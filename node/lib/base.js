'use strict';
/** Configuração, dados da serventia e utilitários usados em todo o site. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const RAIZ = path.resolve(__dirname, '..', '..');
const NODE_DIR = path.resolve(__dirname, '..');
const ARQUIVO_CONFIG = process.env.CARTORIO_CONFIG || path.join(NODE_DIR, 'config.json');

let config = null;
function carregarConfig() {
  if (!config) {
    if (!fs.existsSync(ARQUIVO_CONFIG)) {
      throw new Error('Configuração ausente: rode "node node/bin/configurar.js" para criar node/config.json.');
    }
    config = JSON.parse(fs.readFileSync(ARQUIVO_CONFIG, 'utf8'));
    const c = config;
    c.uploads = c.uploads || {};
    c.uploads.max_bytes = c.uploads.max_bytes || 5 * 1024 * 1024;
    c.uploads.path = path.resolve(RAIZ, c.uploads.path || 'storage/anexos');
    c.rate_limit = c.rate_limit || { max: 6, janela_min: 15 };
    c.admin_timeout_min = c.admin_timeout_min || 30;
    if (c.db && c.db.driver === 'sqlite' && c.db.sqlite_path) c.db.sqlite_path = path.resolve(RAIZ, c.db.sqlite_path);
  }
  return config;
}

/** config('db.host') → valor; padrão quando ausente. */
function cfg(chave, padrao = null) {
  let v = carregarConfig();
  for (const p of chave.split('.')) {
    if (v === null || typeof v !== 'object' || !(p in v)) return padrao;
    v = v[p];
  }
  return v;
}

const conteudo = (nome) => JSON.parse(fs.readFileSync(path.join(NODE_DIR, 'content', nome + '.json'), 'utf8'));
const CARTORIO = conteudo('cartorio');
const SERVICOS = conteudo('servicos');
const RUBRICAS = conteudo('transparencia');

function cartorio(chave) {
  let v = CARTORIO;
  for (const p of chave.split('.')) v = v == null ? null : v[p];
  return v;
}

/* ------------------------------------------------------------- HTML seguro */

class Seguro {
  constructor(s) {
    this.s = s;
  }
  toString() {
    return this.s;
  }
}

const MAPA = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
function e(v) {
  if (v === null || v === undefined || v === false) return '';
  return String(v).replace(/[&<>"']/g, (c) => MAPA[c]);
}

/** HTML já pronto (não escapa). Use só com conteúdo do próprio site. */
const raw = (s) => new Seguro(String(s ?? ''));

function valorHtml(v) {
  if (v instanceof Seguro) return v.s;
  if (Array.isArray(v)) return v.map(valorHtml).join('');
  return e(v);
}

/** Template de HTML: tudo que é interpolado é escapado, exceto raw() e outros html``. */
function html(partes, ...valores) {
  let s = partes[0];
  for (let i = 0; i < valores.length; i++) s += valorHtml(valores[i]) + partes[i + 1];
  return new Seguro(s);
}

const nl2br = (s) => raw(e(s).replace(/\r?\n/g, '<br>\n'));

/* ------------------------------------------------------------- datas */

const dois = (n) => String(n).padStart(2, '0');

/** Data e hora local no formato do banco: AAAA-MM-DD HH:MM:SS. */
function agora(d = new Date()) {
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())} ${dois(d.getHours())}:${dois(d.getMinutes())}:${dois(d.getSeconds())}`;
}

const hoje = (d = new Date()) => agora(d).slice(0, 10);

function dataBr(texto, comHora = true) {
  if (!texto) return '';
  const m = String(texto).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return String(texto);
  const d = `${m[3]}/${m[2]}/${m[1]}`;
  return comHora ? `${d} às ${m[4] || '00'}:${m[5] || '00'}` : d;
}

/** Situação do atendimento presencial agora (sem considerar feriados). */
function atendimentoAgora(d = new Date()) {
  const dia = d.getDay() === 0 ? 7 : d.getDay(); // 1 = segunda ... 7 = domingo
  const hora = `${dois(d.getHours())}:${dois(d.getMinutes())}`;
  const util = dia <= 5;
  if (util && hora >= cartorio('abre') && hora < cartorio('fecha')) return { aberto: true, texto: 'Aberto agora, até as 17h' };
  if (util && hora < cartorio('abre')) return { aberto: false, texto: 'Fechado agora. Abre hoje às 8h' };
  const proximo = dia >= 5 ? 'segunda-feira' : 'amanhã';
  return { aberto: false, texto: `Fechado agora. Abre ${proximo} às 8h` };
}

/* ------------------------------------------------------------- textos */

const soDigitos = (s) => String(s ?? '').replace(/\D+/g, '');

function cpfValido(cpf) {
  const d = soDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
    if (Number(d[t]) !== ((10 * soma) % 11) % 10) return false;
  }
  return true;
}

function cpfFormatado(cpf) {
  const d = soDigitos(cpf);
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf;
}

/** Mesmo critério do filter_var(FILTER_VALIDATE_EMAIL) para os casos comuns. */
function emailValido(s) {
  const v = String(s ?? '');
  if (v.length > 254 || /\s/.test(v)) return false;
  return /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@([A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(v);
}

const tamanho = (s) => [...String(s ?? '')].length; // como mb_strlen
const cortar = (s, n) => [...String(s ?? '')].slice(0, n).join(''); // como mb_substr
const primeiraMaiuscula = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Igual ao rawurlencode do PHP (também codifica ! ' ( ) *). */
const rawurlencode = (s) => encodeURIComponent(String(s)).replace(/[!'()*]/g, (ch) => '%' + ch.charCodeAt(0).toString(16).toUpperCase());

const md5 = (s) => crypto.createHash('md5').update(String(s)).digest('hex');
const hmac = (s) => crypto.createHmac('sha256', String(cfg('app_key', ''))).update(String(s)).digest('hex');

function igualSeguro(a, b) {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Erros de execução vão para storage/logs/node-error.log. */
function registrarErro(msg, err) {
  const linha = `[${agora()}] ${msg}${err ? ': ' + (err.stack || err.message || err) : ''}\n`;
  try {
    fs.mkdirSync(path.join(RAIZ, 'storage', 'logs'), { recursive: true });
    fs.appendFileSync(path.join(RAIZ, 'storage', 'logs', 'node-error.log'), linha);
  } catch {
    /* sem log em disco */
  }
  process.stderr.write(linha);
}

module.exports = {
  RAIZ, NODE_DIR, ARQUIVO_CONFIG, carregarConfig, cfg, cartorio, CARTORIO, SERVICOS, RUBRICAS,
  Seguro, e, raw, html, nl2br, agora, hoje, dataBr, atendimentoAgora, dois,
  soDigitos, cpfValido, cpfFormatado, emailValido, tamanho, cortar, primeiraMaiuscula,
  md5, hmac, igualSeguro, registrarErro, rawurlencode,
};
