'use strict';
/** Contexto de cada requisição: leitura do formulário, sessão, respostas e redirecionamentos. */
const crypto = require('node:crypto');
const { cfg, Seguro } = require('./base');

const NOME_COOKIE = 'sjc_sessao';
const LIMITE_CORPO = 12 * 1024 * 1024; // corpo máximo aceito (anexo de 10 MB na transparência + campos)

/** Usado para interromper o processamento e responder (como exit/redirect no PHP). */
class Resposta {
  constructor(status, corpo = '', cabecalhos = {}) {
    this.status = status;
    this.corpo = corpo;
    this.cabecalhos = cabecalhos;
  }
}

const redirecionar = (destino, status = 303) => new Resposta(status, '', { Location: destino });

/* ------------------------------------------------------------- sessão em cookie cifrado */

function chaveSessao() {
  return crypto.createHash('sha256').update('sessao:' + String(cfg('app_key', ''))).digest();
}

function abrirSessao(valor) {
  try {
    const b = Buffer.from(valor, 'base64url');
    if (b.length < 29) return {};
    const decifra = crypto.createDecipheriv('aes-256-gcm', chaveSessao(), b.subarray(0, 12));
    decifra.setAuthTag(b.subarray(12, 28));
    const texto = Buffer.concat([decifra.update(b.subarray(28)), decifra.final()]).toString('utf8');
    const dados = JSON.parse(texto);
    return dados && typeof dados === 'object' ? dados : {};
  } catch {
    return {};
  }
}

function fecharSessao(dados) {
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv('aes-256-gcm', chaveSessao(), iv);
  const corpo = Buffer.concat([cifra.update(JSON.stringify(dados), 'utf8'), cifra.final()]);
  return Buffer.concat([iv, cifra.getAuthTag(), corpo]).toString('base64url');
}

function lerCookies(cabecalho) {
  const r = {};
  for (const parte of String(cabecalho || '').split(';')) {
    const i = parte.indexOf('=');
    if (i > 0) r[parte.slice(0, i).trim()] = parte.slice(i + 1).trim();
  }
  return r;
}

/* ------------------------------------------------------------- contexto */

class Contexto {
  constructor(req, url) {
    this.req = req;
    this.metodo = req.method;
    this.url = url;
    this.caminho = url.pathname;
    this.query = url.searchParams;
    this.https = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' || Boolean(req.socket.encrypted);
    this.ip = req.socket.remoteAddress || '';
    if (this.ip.startsWith('::ffff:')) this.ip = this.ip.slice(7);
    const encaminhado = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    // Atrás do LiteSpeed/Passenger (conexão local ou por socket) o endereço real vem no X-Forwarded-For.
    if (encaminhado && (!this.ip || ['127.0.0.1', '::1'].includes(this.ip))) this.ip = encaminhado;
    this.ip = this.ip.slice(0, 45) || '0.0.0.0';
    this.userAgent = String(req.headers['user-agent'] || '');
    this.form = null;
    this.corpoGrande = false;
    this._sessao = null;
    this._sessaoAlterada = false;
    this.cabecalhos = {};
  }

  /** Lê o corpo do POST (urlencoded ou multipart) com limite de tamanho. */
  async lerFormulario() {
    if (this.metodo !== 'POST' || this.form) return this.form;
    const tipo = String(this.req.headers['content-type'] || '');
    const partes = [];
    let total = 0;
    // Lê tudo (mesmo acima do limite, descartando) para não quebrar a conexão do navegador.
    for await (const pedaco of this.req) {
      total += pedaco.length;
      if (total > LIMITE_CORPO) {
        this.corpoGrande = true;
        partes.length = 0;
        continue;
      }
      partes.push(pedaco);
    }
    if (this.corpoGrande) {
      this.form = new FormData();
      return this.form;
    }
    const corpo = Buffer.concat(partes);
    try {
      this.form = await new Request('http://local/', {
        method: 'POST', headers: { 'content-type': tipo || 'application/x-www-form-urlencoded' }, body: corpo,
      }).formData();
    } catch {
      this.form = new FormData();
    }
    return this.form;
  }

  /** Valor de texto de um campo do formulário ('' se ausente ou se for arquivo). */
  campo(nome) {
    const v = this.form ? this.form.get(nome) : null;
    return typeof v === 'string' ? v : '';
  }

  arquivo(nome) {
    const v = this.form ? this.form.get(nome) : null;
    return v && typeof v === 'object' && typeof v.arrayBuffer === 'function' ? v : null;
  }

  /** Campos com nome "prefixo[chave]" viram { chave: valor }. */
  grupo(prefixo) {
    const r = {};
    if (!this.form) return r;
    for (const [k, v] of this.form.entries()) {
      const m = k.match(/^([^[]+)\[([^\]]+)\]$/);
      if (m && m[1] === prefixo && typeof v === 'string') r[m[2]] = v;
    }
    return r;
  }

  /** Todos os campos de texto, para reexibir o formulário com os valores digitados. */
  valores() {
    const r = {};
    if (this.form) for (const [k, v] of this.form.entries()) if (typeof v === 'string') r[k] = v;
    return r;
  }

  /* --------------------------------------------- sessão */

  get sessao() {
    if (!this._sessao) {
      const c = lerCookies(this.req.headers.cookie)[NOME_COOKIE];
      this._sessao = c ? abrirSessao(c) : {};
    }
    return this._sessao;
  }

  salvarSessao() {
    this._sessaoAlterada = true;
  }

  /** Recomeça a sessão (login, logout, troca de senha): descarta tudo e gera novo token. */
  novaSessao(manter = {}) {
    this._sessao = { ...manter };
    this._sessaoAlterada = true;
  }

  csrfToken() {
    if (!this.sessao.csrf) {
      this.sessao.csrf = crypto.randomBytes(32).toString('hex');
      this.salvarSessao();
    }
    return this.sessao.csrf;
  }

  csrfOk() {
    const enviado = this.campo('_csrf');
    const esperado = this.sessao.csrf;
    if (!enviado || !esperado) return false;
    const a = Buffer.from(enviado);
    const b = Buffer.from(esperado);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  flash(chave, valor) {
    if (valor !== undefined) {
      this.sessao.flash = { ...(this.sessao.flash || {}), [chave]: valor };
      this.salvarSessao();
      return null;
    }
    const f = this.sessao.flash || {};
    if (!(chave in f)) return null;
    const v = f[chave];
    delete f[chave];
    if (!Object.keys(f).length) delete this.sessao.flash;
    this.salvarSessao();
    return v;
  }

  cookieSessao() {
    if (!this._sessaoAlterada) return null;
    const seguro = this.https ? '; Secure' : '';
    if (!Object.keys(this._sessao || {}).length) {
      return `${NOME_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${seguro}`;
    }
    return `${NOME_COOKIE}=${fecharSessao(this._sessao)}; Path=/; HttpOnly; SameSite=Lax${seguro}`;
  }

  /* --------------------------------------------- respostas */

  html(conteudo, status = 200) {
    const corpo = conteudo instanceof Seguro ? conteudo.s : String(conteudo);
    return new Resposta(status, corpo, { 'Content-Type': 'text/html; charset=utf-8' });
  }
}

module.exports = { Contexto, Resposta, redirecionar, NOME_COOKIE, abrirSessao, fecharSessao };
