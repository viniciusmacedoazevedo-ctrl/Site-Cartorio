'use strict';
/**
 * Cliente mínimo do PostgreSQL (protocolo v3), sem dependências externas.
 * Suporta autenticação SCRAM-SHA-256, MD5 e senha simples, consultas com
 * parâmetros (protocolo estendido, formato texto) e um pool pequeno de conexões.
 */
const net = require('node:net');
const crypto = require('node:crypto');

const INTEIROS = new Set([20, 21, 23, 26]); // int8, int2, int4, oid
const DECIMAIS = new Set([700, 701, 1700]); // float4, float8, numeric

class PgErro extends Error {
  constructor(campos) {
    super(campos.M || 'Erro do PostgreSQL');
    this.code = campos.C;
    this.detail = campos.D;
    this.severity = campos.S;
  }
}

/** Troca os "?" da consulta por $1, $2... sem mexer no que está entre aspas. */
function numerarParametros(sql) {
  let saida = '';
  let n = 0;
  let aspas = null;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (aspas) {
      saida += c;
      if (c === aspas) {
        if (sql[i + 1] === aspas) {
          saida += sql[++i];
        } else {
          aspas = null;
        }
      }
    } else if (c === "'" || c === '"') {
      aspas = c;
      saida += c;
    } else if (c === '?') {
      saida += '$' + ++n;
    } else {
      saida += c;
    }
  }
  return saida;
}

function cstr(s) {
  return Buffer.concat([Buffer.from(String(s), 'utf8'), Buffer.from([0])]);
}

function mensagem(tipo, corpo) {
  const cab = Buffer.alloc(tipo ? 5 : 4);
  if (tipo) {
    cab.write(tipo, 0, 'ascii');
    cab.writeInt32BE(corpo.length + 4, 1);
  } else {
    cab.writeInt32BE(corpo.length + 4, 0);
  }
  return Buffer.concat([cab, corpo]);
}

function int16(n) {
  const b = Buffer.alloc(2);
  b.writeInt16BE(n);
  return b;
}

function int32(n) {
  const b = Buffer.alloc(4);
  b.writeInt32BE(n);
  return b;
}

function textoParametro(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return v ? 't' : 'f';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

class Conexao {
  constructor(opcoes) {
    this.opcoes = opcoes;
    this.buffer = Buffer.alloc(0);
    this.fila = [];
    this.atual = null;
    this.aberta = false;
    this.quebrada = false;
  }

  conectar() {
    const o = this.opcoes;
    return new Promise((resolve, reject) => {
      const porta = Number(o.port) || 5432;
      const host = o.host || 'localhost';
      const sock = host.startsWith('/')
        ? net.connect({ path: `${host}/.s.PGSQL.${porta}` })
        : net.connect({ host, port: porta });
      const tempo = setTimeout(() => {
        sock.destroy();
        reject(new Error(`PostgreSQL: tempo esgotado ao conectar em ${host}:${porta}`));
      }, (o.connectTimeout || 10) * 1000);
      this.socket = sock;
      this.pronto = { resolve, reject, tempo };
      sock.on('error', (err) => this.falhar(err));
      sock.on('close', () => this.falhar(new Error('PostgreSQL: conexão encerrada')));
      sock.on('data', (d) => this.receber(d));
      sock.once('connect', () => {
        sock.setNoDelay(true);
        const corpo = Buffer.concat([
          int32(196608),
          cstr('user'), cstr(o.username),
          cstr('database'), cstr(o.database),
          cstr('client_encoding'), cstr('UTF8'),
          cstr('application_name'), cstr('site-cartorio'),
          Buffer.from([0]),
        ]);
        sock.write(mensagem(null, corpo));
      });
    });
  }

  falhar(err) {
    if (this.quebrada) return;
    this.quebrada = true;
    this.aberta = false;
    if (this.pronto) {
      clearTimeout(this.pronto.tempo);
      this.pronto.reject(err);
      this.pronto = null;
    }
    const pendentes = this.atual ? [this.atual, ...this.fila] : this.fila;
    this.atual = null;
    this.fila = [];
    for (const p of pendentes) p.reject(err);
    if (this.socket) this.socket.destroy();
  }

  receber(dados) {
    this.buffer = this.buffer.length ? Buffer.concat([this.buffer, dados]) : dados;
    while (this.buffer.length >= 5) {
      const tipo = String.fromCharCode(this.buffer[0]);
      const tam = this.buffer.readInt32BE(1);
      if (this.buffer.length < tam + 1) break;
      const corpo = this.buffer.subarray(5, tam + 1);
      this.buffer = this.buffer.subarray(tam + 1);
      try {
        this.tratar(tipo, corpo);
      } catch (err) {
        this.falhar(err);
        return;
      }
    }
  }

  tratar(tipo, corpo) {
    switch (tipo) {
      case 'R':
        return this.autenticar(corpo);
      case 'S': // ParameterStatus
      case 'K': // BackendKeyData
      case 'N': // NoticeResponse
      case '1': // ParseComplete
      case '2': // BindComplete
      case 'n': // NoData
        return;
      case 'E': {
        const campos = lerCampos(corpo);
        const erro = new PgErro(campos);
        if (this.pronto) {
          clearTimeout(this.pronto.tempo);
          this.pronto.reject(erro);
          this.pronto = null;
          this.socket.destroy();
          return;
        }
        if (this.atual) this.atual.erro = erro;
        return;
      }
      case 'T':
        if (this.atual) this.atual.campos = lerDescricao(corpo);
        return;
      case 'D':
        if (this.atual) this.atual.linhas.push(lerLinha(corpo, this.atual.campos));
        return;
      case 'C':
        if (this.atual) this.atual.comando = corpo.toString('utf8', 0, corpo.length - 1);
        return;
      case 'Z': {
        if (this.pronto) {
          clearTimeout(this.pronto.tempo);
          this.aberta = true;
          this.pronto.resolve(this);
          this.pronto = null;
          return;
        }
        const q = this.atual;
        this.atual = null;
        if (q) {
          if (q.erro) q.reject(q.erro);
          else q.resolve({ rows: q.linhas, command: q.comando, rowCount: q.linhas.length });
        }
        this.proxima();
        return;
      }
      default:
        return;
    }
  }

  autenticar(corpo) {
    const codigo = corpo.readInt32BE(0);
    const o = this.opcoes;
    if (codigo === 0) return; // AuthenticationOk
    if (codigo === 3) {
      this.socket.write(mensagem('p', cstr(o.password || '')));
      return;
    }
    if (codigo === 5) {
      const sal = corpo.subarray(4, 8);
      const interno = crypto.createHash('md5').update(String(o.password || '') + o.username).digest('hex');
      const final = 'md5' + crypto.createHash('md5').update(Buffer.concat([Buffer.from(interno), sal])).digest('hex');
      this.socket.write(mensagem('p', cstr(final)));
      return;
    }
    if (codigo === 10) {
      const mecanismos = corpo.subarray(4).toString('utf8').split('\0').filter(Boolean);
      if (!mecanismos.includes('SCRAM-SHA-256')) {
        throw new Error('PostgreSQL: método de autenticação não suportado (' + mecanismos.join(', ') + ')');
      }
      this.nonce = crypto.randomBytes(18).toString('base64');
      this.primeiraCliente = `n=*,r=${this.nonce}`;
      const msg = Buffer.from('n,,' + this.primeiraCliente, 'utf8');
      this.socket.write(mensagem('p', Buffer.concat([cstr('SCRAM-SHA-256'), int32(msg.length), msg])));
      return;
    }
    if (codigo === 11) {
      const servidor = corpo.subarray(4).toString('utf8');
      const partes = Object.fromEntries(servidor.split(',').map((p) => [p[0], p.slice(2)]));
      if (!partes.r || !partes.r.startsWith(this.nonce)) throw new Error('PostgreSQL: resposta SCRAM inválida');
      const sal = Buffer.from(partes.s, 'base64');
      const iter = parseInt(partes.i, 10);
      const senhaSalgada = crypto.pbkdf2Sync(String(o.password || '').normalize('NFKC'), sal, iter, 32, 'sha256');
      const chaveCliente = crypto.createHmac('sha256', senhaSalgada).update('Client Key').digest();
      const chaveArmazenada = crypto.createHash('sha256').update(chaveCliente).digest();
      const semProva = `c=biws,r=${partes.r}`;
      const autenticacao = `${this.primeiraCliente},${servidor},${semProva}`;
      const assinatura = crypto.createHmac('sha256', chaveArmazenada).update(autenticacao).digest();
      const prova = Buffer.from(chaveCliente.map((b, i) => b ^ assinatura[i]));
      const chaveServidor = crypto.createHmac('sha256', senhaSalgada).update('Server Key').digest();
      this.assinaturaServidor = crypto.createHmac('sha256', chaveServidor).update(autenticacao).digest('base64');
      this.socket.write(mensagem('p', Buffer.from(`${semProva},p=${prova.toString('base64')}`, 'utf8')));
      return;
    }
    if (codigo === 12) {
      const final = corpo.subarray(4).toString('utf8');
      const v = final.split(',').find((p) => p.startsWith('v='));
      if (!v || v.slice(2) !== this.assinaturaServidor) throw new Error('PostgreSQL: assinatura do servidor não confere');
      return;
    }
    throw new Error('PostgreSQL: autenticação não suportada (código ' + codigo + ')');
  }

  consultar(sql, parametros = []) {
    if (this.quebrada) return Promise.reject(new Error('PostgreSQL: conexão indisponível'));
    return new Promise((resolve, reject) => {
      this.fila.push({ sql: numerarParametros(sql), parametros, resolve, reject, linhas: [], campos: [] });
      if (!this.atual) this.proxima();
    });
  }

  proxima() {
    if (this.atual || !this.fila.length) return;
    const q = (this.atual = this.fila.shift());
    const valores = q.parametros.map(textoParametro);
    const bind = [cstr(''), cstr(''), int16(0), int16(valores.length)];
    for (const v of valores) {
      if (v === null) {
        bind.push(int32(-1));
      } else {
        const b = Buffer.from(v, 'utf8');
        bind.push(int32(b.length), b);
      }
    }
    bind.push(int16(0));
    this.socket.write(Buffer.concat([
      mensagem('P', Buffer.concat([cstr(''), cstr(q.sql), int16(0)])),
      mensagem('B', Buffer.concat(bind)),
      mensagem('D', Buffer.concat([Buffer.from('P'), cstr('')])),
      mensagem('E', Buffer.concat([cstr(''), int32(0)])),
      mensagem('S', Buffer.alloc(0)),
    ]));
  }

  fechar() {
    if (this.socket && !this.quebrada) {
      this.quebrada = true;
      try {
        this.socket.end(mensagem('X', Buffer.alloc(0)));
      } catch {
        /* ignora */
      }
    }
  }
}

function lerCampos(corpo) {
  const campos = {};
  let i = 0;
  while (i < corpo.length && corpo[i] !== 0) {
    const codigo = String.fromCharCode(corpo[i]);
    const fim = corpo.indexOf(0, i + 1);
    campos[codigo] = corpo.toString('utf8', i + 1, fim);
    i = fim + 1;
  }
  return campos;
}

function lerDescricao(corpo) {
  const n = corpo.readInt16BE(0);
  const campos = [];
  let i = 2;
  for (let k = 0; k < n; k++) {
    const fim = corpo.indexOf(0, i);
    const nome = corpo.toString('utf8', i, fim);
    i = fim + 1;
    const tipo = corpo.readInt32BE(i + 6);
    campos.push({ nome, tipo });
    i += 18;
  }
  return campos;
}

function lerLinha(corpo, campos) {
  const n = corpo.readInt16BE(0);
  const linha = {};
  let i = 2;
  for (let k = 0; k < n; k++) {
    const tam = corpo.readInt32BE(i);
    i += 4;
    const campo = campos[k] || { nome: String(k), tipo: 25 };
    if (tam === -1) {
      linha[campo.nome] = null;
      continue;
    }
    const texto = corpo.toString('utf8', i, i + tam);
    i += tam;
    if (INTEIROS.has(campo.tipo) || DECIMAIS.has(campo.tipo)) linha[campo.nome] = Number(texto);
    else if (campo.tipo === 16) linha[campo.nome] = texto === 't';
    else linha[campo.nome] = texto;
  }
  return linha;
}

/** Pool simples: cada consulta usa uma conexão livre; transações seguram uma conexão. */
class Pool {
  constructor(opcoes) {
    this.opcoes = opcoes;
    this.max = opcoes.max || 4;
    this.livres = [];
    this.total = 0;
    this.esperando = [];
  }

  async pegar() {
    while (this.livres.length) {
      const c = this.livres.pop();
      if (!c.quebrada) return c;
      this.total--;
    }
    if (this.total < this.max) {
      this.total++;
      try {
        const c = new Conexao(this.opcoes);
        await c.conectar();
        for (const sql of this.opcoes.aoConectar || []) await c.consultar(sql);
        return c;
      } catch (err) {
        this.total--;
        throw err;
      }
    }
    return new Promise((resolve, reject) => this.esperando.push({ resolve, reject }));
  }

  devolver(c) {
    if (c.quebrada) {
      this.total--;
      const prox = this.esperando.shift();
      if (prox) this.pegar().then(prox.resolve, prox.reject);
      return;
    }
    const prox = this.esperando.shift();
    if (prox) prox.resolve(c);
    else this.livres.push(c);
  }

  async consultar(sql, parametros) {
    const c = await this.pegar();
    try {
      return await c.consultar(sql, parametros);
    } finally {
      this.devolver(c);
    }
  }

  async transacao(fn) {
    const c = await this.pegar();
    try {
      await c.consultar('BEGIN');
      const resultado = await fn({ consultar: (sql, p) => c.consultar(sql, p) });
      await c.consultar('COMMIT');
      return resultado;
    } catch (err) {
      if (!c.quebrada) await c.consultar('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      this.devolver(c);
    }
  }

  fechar() {
    for (const c of this.livres) c.fechar();
    this.livres = [];
    this.total = 0;
  }
}

module.exports = { Pool, Conexao, PgErro, numerarParametros };
