'use strict';
/** Registros dos formulários: limite de envios, anexos, protocolo, e-mails e consulta pública. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { cfg, cartorio, agora, dataBr, cortar, hmac, igualSeguro, registrarErro } = require('./base');
const { q, qUm, qValor, transacao, proximoNumero } = require('./db');
const { formularios, nomeServico } = require('./forms');
const { enviarEmail } = require('./mailer');

const CODIGO_LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sem I e O, para não confundir com 1 e 0

const ipHash = (ctx) => hmac(ctx.ip);

async function limiteExcedido(ctx, acao) {
  const janela = Number(cfg('rate_limit.janela_min', 15));
  const max = Number(cfg('rate_limit.max', 6));
  const desde = agora(new Date(Date.now() - janela * 60000));
  await q('DELETE FROM limites WHERE criado_em < ?', [agora(new Date(Date.now() - 86400000))]);
  const n = Number(await qValor('SELECT COUNT(*) FROM limites WHERE ip_hash = ? AND acao = ? AND criado_em >= ?', [ipHash(ctx), acao, desde]));
  return n >= max;
}

async function registrarTentativa(ctx, acao) {
  await q('INSERT INTO limites (ip_hash, acao, criado_em) VALUES (?, ?, ?)', [ipHash(ctx), acao, agora()]);
}

/** Tipo real do arquivo pelos primeiros bytes (não confia na extensão nem no navegador). */
function tipoArquivo(buf) {
  if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  return null;
}

function nomeOriginal(nome, ext) {
  const base = path.basename(String(nome || '').replace(/\\/g, '/'));
  const limpo = base.replace(/[^\p{L}\p{N}._ -]+/gu, '_');
  return cortar(limpo || `anexo.${ext}`, 150);
}

/** Valida e guarda o anexo fora da pasta pública. Retorna [info|null, erro|null]. */
async function processarAnexo(arquivo) {
  if (!arquivo || (!arquivo.size && !arquivo.name)) return [null, null];
  if (arquivo.size > cfg('uploads.max_bytes')) return [null, 'O arquivo passa de 5 MB. Envie um arquivo menor.'];
  const buf = Buffer.from(await arquivo.arrayBuffer());
  const mime = tipoArquivo(buf);
  const ext = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }[mime];
  if (!ext) return [null, 'Formato não aceito. Envie PDF, JPG ou PNG.'];
  const d = new Date();
  const sub = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  const dir = path.join(cfg('uploads.path'), sub);
  const nome = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
    fs.writeFileSync(path.join(dir, nome), buf, { mode: 0o640, flag: 'wx' });
  } catch (err) {
    registrarErro('Falha ao guardar anexo', err);
    return [null, 'Não foi possível guardar o arquivo. Tente novamente.'];
  }
  return [{ arquivo: `${sub}/${nome}`, nome_original: nomeOriginal(arquivo.name, ext), mime, tamanho: buf.length }, null];
}

async function historico(registroId, usuarioId, acao, detalhe = '', t = null) {
  await q('INSERT INTO historico (registro_id, usuario_id, acao, detalhe, criado_em) VALUES (?, ?, ?, ?, ?)',
    [registroId, usuarioId, acao, detalhe, agora()], t);
}

/** Grava o registro com protocolo e código de acesso. Retorna o registro criado. */
async function criarRegistro(ctx, chave, dados, anexo) {
  const def = formularios()[chave];
  const ano = new Date().getFullYear();
  const id = await transacao(async (t) => {
    const numero = await proximoNumero(def.prefixo, ano, t);
    const protocolo = `${def.prefixo}-${ano}-${String(numero).padStart(6, '0')}`;
    let codigo = '';
    for (let i = 0; i < 4; i++) codigo += CODIGO_LETRAS[crypto.randomInt(CODIGO_LETRAS.length)];
    let tipo = dados[def.tipo_campo] || '';
    if (chave === 'pedido') tipo = nomeServico(tipo);
    const extras = {};
    for (const [k, v] of Object.entries(dados)) if (!['nome', 'cpf', 'email', 'telefone', 'mensagem'].includes(k)) extras[k] = v;
    if (chave === 'pedido' && 'servico' in extras) extras.servico = nomeServico(extras.servico);
    const r = await qUm(
      `INSERT INTO registros (protocolo, codigo_acesso, formulario, tipo, nome, cpf, email, telefone, mensagem, dados_json, status, ip, user_agent, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [protocolo, codigo, chave, cortar(tipo, 150), dados.nome || '', dados.cpf || '', dados.email || '', dados.telefone || '',
        dados.mensagem || '', JSON.stringify(extras), 'Novo', ctx.ip, cortar(ctx.userAgent, 250), agora(), agora()],
      t,
    );
    const novoId = Number(r.id);
    if (anexo) {
      await q('INSERT INTO anexos (registro_id, arquivo, nome_original, mime, tamanho, criado_em) VALUES (?, ?, ?, ?, ?, ?)',
        [novoId, anexo.arquivo, anexo.nome_original, anexo.mime, anexo.tamanho, agora()], t);
    }
    await historico(novoId, null, 'Recebido pelo site', '', t);
    return novoId;
  });
  return qUm('SELECT * FROM registros WHERE id = ?', [id]);
}

function rotulosExtras(chave) {
  const r = {};
  for (const [nome, c] of Object.entries(formularios()[chave].campos)) r[nome] = c.label;
  return r;
}

const baseUrl = () => String(cfg('base_url', '')).replace(/\/+$/, '');

/** E-mail para a caixa do setor e, se houver e-mail, confirmação ao cliente. */
async function notificarRegistro(reg, anexo) {
  const chave = reg.formulario;
  const def = formularios()[chave];
  const rotulos = rotulosExtras(chave);
  let extras = {};
  try {
    extras = JSON.parse(reg.dados_json || '{}') || {};
  } catch {
    extras = {};
  }
  const painel = `${baseUrl()}/admin/registro?id=${reg.id}`;
  const linhas = ['Novo registro recebido pelo site.', '', `Formulário: ${def.titulo}`, `Protocolo: ${reg.protocolo}`, `Data: ${dataBr(reg.criado_em)}`, ''];
  for (const [k, v] of Object.entries(extras)) {
    if (v !== '') linhas.push(`${rotulos[k] || k}: ${k === 'data_preferida' ? dataBr(v, false) : v}`);
  }
  for (const [k, rot] of [['nome', 'Nome'], ['cpf', 'CPF'], ['email', 'E-mail'], ['telefone', 'Telefone']]) {
    linhas.push(`${rot}: ${reg[k] !== '' ? reg[k] : 'não informado'}`);
  }
  linhas.push('', 'Mensagem:', reg.mensagem);
  if (anexo) linhas.push('', `Anexo: ${anexo.nome_original} (disponível no painel)`);
  linhas.push('', `Abrir no painel: ${painel}`);

  const destino = cfg(`destinos.${chave}`);
  const cc = chave === 'lgpd' ? [cfg('destinos.lgpd_copia')] : [];
  const assunto = `[${reg.protocolo}] ${def.titulo}${reg.tipo ? ` – ${reg.tipo}` : ''}`;
  let ok = await enviarEmail(destino, assunto, linhas.join('\n'), { cc, reply_to: reg.email || null });
  await historico(Number(reg.id), null, ok ? 'E-mail enviado ao cartório' : 'Falha no e-mail ao cartório', String(destino || ''));

  if (reg.email !== '') {
    const consulta = `${baseUrl()}/protocolo`;
    const corpo = [
      reg.nome !== '' ? `Olá, ${reg.nome}.` : 'Olá.',
      '',
      `Recebemos sua solicitação: ${def.titulo}.`,
      '',
      `Protocolo: ${reg.protocolo}`,
      `Código de consulta: ${reg.codigo_acesso}`,
      '',
      `Para acompanhar, acesse ${consulta} e informe o protocolo e o código.`,
      '',
      'Guarde este e-mail. Não responda: esta caixa não é lida.',
      `Dúvidas: ${cartorio('emails.contato')} ou ${cartorio('telefone')}.`,
      '',
      cartorio('nome_oficial'),
      `${cartorio('endereco')} – ${cartorio('cidade')}`,
    ].join('\n');
    ok = await enviarEmail(reg.email, `Protocolo ${reg.protocolo} – ${cartorio('nome_curto')}`, corpo);
    await historico(Number(reg.id), null, ok ? 'Protocolo enviado ao cliente' : 'Falha no e-mail ao cliente', reg.email);
  }
}

async function consultarProtocolo(protocolo, codigo) {
  const p = String(protocolo).trim().toUpperCase();
  const c = String(codigo).trim().toUpperCase();
  if (!/^[A-Z]{3,4}-\d{4}-\d{6}$/.test(p) || !/^[A-Z]{4}$/.test(c)) return null;
  const reg = await qUm('SELECT protocolo, codigo_acesso, formulario, tipo, status, retorno_publico, criado_em, atualizado_em FROM registros WHERE protocolo = ?', [p]);
  if (!reg || !igualSeguro(reg.codigo_acesso, c)) return null;
  return reg;
}

module.exports = {
  limiteExcedido, registrarTentativa, processarAnexo, tipoArquivo, criarRegistro, historico,
  rotulosExtras, notificarRegistro, consultarProtocolo, baseUrl,
};
