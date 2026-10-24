'use strict';
/**
 * Envio de e-mail em texto simples (UTF-8).
 * Transportes: smtp (autenticado), mail (sendmail do servidor) ou log (testes).
 * Retorna true quando o servidor aceitou a mensagem.
 */
const fs = require('node:fs');
const os = require('node:os');
const net = require('node:net');
const tls = require('node:tls');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { cfg, agora, emailValido, registrarErro, RAIZ } = require('./base');

/** Cabeçalho codificado (RFC 2047) quando há acentos. */
function codificarCabecalho(texto, modo = 'B') {
  if (/^[\x20-\x7e]*$/.test(texto)) return texto;
  if (modo === 'Q') {
    const q = Buffer.from(texto, 'utf8').toString('hex').toUpperCase().match(/../g).map((h) => {
      const c = parseInt(h, 16);
      return (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a) ? String.fromCharCode(c) : c === 0x20 ? '_' : '=' + h;
    }).join('');
    return `=?UTF-8?Q?${q}?=`;
  }
  // Base64 em pedaços de até 45 bytes sem quebrar caracteres UTF-8.
  const partes = [];
  let atual = '';
  for (const ch of texto) {
    if (Buffer.byteLength(atual + ch, 'utf8') > 45) {
      partes.push(atual);
      atual = '';
    }
    atual += ch;
  }
  if (atual) partes.push(atual);
  return partes.map((p) => `=?UTF-8?B?${Buffer.from(p, 'utf8').toString('base64')}?=`).join('\r\n ');
}

function dataRfc2822(d = new Date()) {
  const dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const off = -d.getTimezoneOffset();
  const sinal = off >= 0 ? '+' : '-';
  const p = (n) => String(Math.abs(n)).padStart(2, '0');
  return `${dias[d.getDay()]}, ${p(d.getDate())} ${meses[d.getMonth()]} ${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} ${sinal}${p(Math.trunc(off / 60))}${p(off % 60)}`;
}

const semQuebra = (s) => String(s || '').replace(/[\r\n]+/g, ' ');

function montarMensagem({ para, cc, replyTo, assunto, corpo }) {
  const fromEmail = cfg('mail.from_email');
  const fromName = cfg('mail.from_name', '');
  const dominio = (fromEmail.split('@')[1] || 'localhost');
  const cab = {
    Date: dataRfc2822(),
    From: `${codificarCabecalho(fromName, 'Q')} <${fromEmail}>`,
    To: para.join(', '),
    Subject: codificarCabecalho(semQuebra(assunto)),
    'Message-ID': `<${crypto.randomBytes(12).toString('hex')}@${dominio}>`,
    'MIME-Version': '1.0',
    'Content-Type': 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding': 'base64',
    'Auto-Submitted': 'auto-generated',
  };
  if (cc.length) cab.Cc = cc.join(', ');
  if (replyTo && emailValido(replyTo)) cab['Reply-To'] = replyTo;
  const texto = String(corpo).replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
  const b64 = Buffer.from(texto, 'utf8').toString('base64').match(/.{1,76}/g) || [''];
  return Object.entries(cab).map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n' + b64.join('\r\n') + '\r\n';
}

/* ------------------------------------------------------------- SMTP */

function smtpEnviar(remetente, destinatarios, mensagem) {
  const c = cfg('mail.smtp');
  const host = c.host;
  const porta = Number(c.port) || 587;
  const enc = c.encryption || 'tls';
  const tempo = (Number(c.timeout) || 15) * 1000;
  return new Promise((resolve, reject) => {
    let sock;
    let buffer = '';
    let esperando = null;
    let terminado = false;
    let entregue = false; // depois do "250" do DATA a mensagem já foi aceita
    const acabar = (err) => {
      if (err && entregue) err = null;
      if (terminado) return;
      terminado = true;
      clearTimeout(relogio);
      if (sock) sock.destroy();
      if (err) reject(err);
      else resolve(true);
    };
    const relogio = setTimeout(() => acabar(new Error('SMTP: tempo esgotado')), tempo * 3);

    const ligar = (s) => {
      s.setEncoding('utf8');
      s.on('data', (d) => {
        buffer += d;
        let i;
        while ((i = buffer.indexOf('\n')) >= 0) {
          const linha = buffer.slice(0, i + 1);
          buffer = buffer.slice(i + 1);
          if (!esperando) continue;
          esperando.texto += linha;
          if (linha.length < 4 || linha[3] === ' ') {
            const w = esperando;
            esperando = null;
            w.resolve({ codigo: parseInt(w.texto.slice(0, 3), 10), texto: w.texto });
          }
        }
      });
      s.on('error', (err) => acabar(new Error('SMTP: ' + err.message)));
      s.on('close', () => acabar(new Error('SMTP: conexão encerrada pelo servidor')));
    };
    const ler = () => new Promise((res) => { esperando = { texto: '', resolve: res }; });
    const cmd = async (linha, aceitos) => {
      const r = ler();
      sock.write(linha + '\r\n');
      const { codigo, texto } = await r;
      if (!aceitos.includes(codigo)) throw new Error('SMTP: resposta inesperada ' + texto.trim());
      return texto;
    };

    const conversa = async () => {
      const primeira = ler();
      sock = enc === 'ssl'
        ? tls.connect({ host, port: porta, servername: host })
        : net.connect({ host, port: porta });
      ligar(sock);
      const { codigo } = await primeira;
      if (codigo !== 220) throw new Error('SMTP: servidor não respondeu 220');
      const ehlo = os.hostname() || 'localhost';
      await cmd(`EHLO ${ehlo}`, [250]);
      if (enc === 'tls') {
        await cmd('STARTTLS', [220]);
        const bruto = sock;
        bruto.removeAllListeners('data');
        bruto.removeAllListeners('close');
        bruto.removeAllListeners('error');
        bruto.on('error', () => {});
        sock = tls.connect({ socket: bruto, servername: host, minVersion: 'TLSv1.2' });
        await new Promise((res, rej) => { sock.once('secureConnect', res); sock.once('error', rej); });
        ligar(sock);
        await cmd(`EHLO ${ehlo}`, [250]);
      }
      if (c.username) {
        await cmd('AUTH LOGIN', [334]);
        await cmd(Buffer.from(c.username).toString('base64'), [334]);
        await cmd(Buffer.from(c.password || '').toString('base64'), [235]);
      }
      await cmd(`MAIL FROM:<${remetente}>`, [250]);
      for (const r of destinatarios) await cmd(`RCPT TO:<${r}>`, [250, 251]);
      await cmd('DATA', [354]);
      await cmd(mensagem.replace(/^\./gm, '..') + '.', [250]);
      entregue = true;
      await cmd('QUIT', [221]).catch(() => {});
    };
    conversa().then(() => acabar(), acabar);
  });
}

/* ------------------------------------------------------------- sendmail (transporte "mail") */

function sendmailEnviar(remetente, mensagem) {
  const bin = ['/usr/sbin/sendmail', '/usr/lib/sendmail'].find((b) => fs.existsSync(b));
  if (!bin) return Promise.reject(new Error('sendmail não encontrado no servidor'));
  return new Promise((resolve, reject) => {
    const p = spawn(bin, ['-t', '-i', '-f', remetente], { stdio: ['pipe', 'ignore', 'pipe'] });
    let erro = '';
    p.stderr.on('data', (d) => { erro += d; });
    p.on('error', reject);
    p.on('close', (cod) => (cod === 0 ? resolve(true) : reject(new Error(`sendmail saiu com código ${cod}: ${erro.trim()}`))));
    p.stdin.end(mensagem.replace(/\r\n/g, '\n'));
  });
}

/* ------------------------------------------------------------- envio */

async function enviarEmail(para, assunto, corpo, opcoes = {}) {
  const destinos = [].concat(para || []).filter(Boolean);
  if (!destinos.length) return false;
  const cc = [].concat(opcoes.cc || []).filter(Boolean);
  const transporte = cfg('mail.transport', 'smtp');
  try {
    if (transporte === 'log') {
      const linha = `[${agora()}] Para: ${destinos.join(', ')}${cc.length ? ' | Cc: ' + cc.join(', ') : ''}\nAssunto: ${assunto}\n${corpo}\n${'-'.repeat(60)}\n`;
      fs.mkdirSync(path.join(RAIZ, 'storage', 'logs'), { recursive: true });
      fs.appendFileSync(path.join(RAIZ, 'storage', 'logs', 'mail.log'), linha);
      return true;
    }
    const mensagem = montarMensagem({ para: destinos, cc, replyTo: opcoes.reply_to, assunto, corpo });
    const remetente = cfg('mail.from_email');
    if (transporte === 'smtp') return await smtpEnviar(remetente, [...destinos, ...cc], mensagem);
    return await sendmailEnviar(remetente, mensagem);
  } catch (err) {
    registrarErro('Falha no envio de e-mail', err);
    return false;
  }
}

module.exports = { enviarEmail, montarMensagem, codificarCabecalho };
