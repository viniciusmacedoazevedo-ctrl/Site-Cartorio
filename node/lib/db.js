'use strict';
/**
 * Banco de dados: PostgreSQL em produção (cliente próprio em pg.js) ou SQLite em testes locais.
 * Consultas usam "?" como marcador de parâmetro, como no site em PHP.
 */
const { cfg } = require('./base');
const { Pool } = require('./pg');

let banco = null;

function criarSqlite(caminho) {
  // eslint-disable-next-line global-require
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(caminho);
  db.exec('PRAGMA foreign_keys = ON');
  const executar = (sql, p = []) => {
    const st = db.prepare(sql);
    const params = p.map((v) => (v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v));
    if (/^\s*(select|with|pragma)\b/i.test(sql) || /\breturning\b/i.test(sql)) {
      const rows = st.all(...params);
      return { rows, rowCount: rows.length };
    }
    const r = st.run(...params);
    return { rows: [], rowCount: Number(r.changes) };
  };
  let fila = Promise.resolve();
  return {
    driver: 'sqlite',
    consultar: async (sql, p) => executar(sql, p),
    transacao(fn) {
      const rodar = async () => {
        executar('BEGIN');
        try {
          const r = await fn({ consultar: async (sql, p) => executar(sql, p) });
          executar('COMMIT');
          return r;
        } catch (err) {
          executar('ROLLBACK');
          throw err;
        }
      };
      const p = fila.then(rodar, rodar);
      fila = p.catch(() => {});
      return p;
    },
    fechar: () => db.close(),
  };
}

function db() {
  if (banco) return banco;
  const c = cfg('db');
  if (c.driver === 'sqlite') {
    banco = criarSqlite(c.sqlite_path);
  } else if (c.driver === 'pgsql') {
    const pool = new Pool({
      host: c.host || 'localhost',
      port: c.port || 5432,
      database: c.database,
      username: c.username,
      password: c.password,
      max: c.max_conexoes || 4,
      aoConectar: ["SET TIME ZONE 'America/Fortaleza'"],
    });
    banco = {
      driver: 'pgsql',
      consultar: (sql, p) => pool.consultar(sql, p),
      transacao: (fn) => pool.transacao(fn),
      fechar: () => pool.fechar(),
    };
  } else {
    throw new Error(`Banco "${c.driver}" não suportado na versão Node (use pgsql ou sqlite).`);
  }
  return banco;
}

const driver = () => db().driver;

/** Funções de consulta; recebem opcionalmente uma transação (t) no lugar do banco. */
async function q(sql, params = [], t = null) {
  return (t || db()).consultar(sql, params);
}
async function qTodos(sql, params = [], t = null) {
  return (await q(sql, params, t)).rows;
}
async function qUm(sql, params = [], t = null) {
  return (await q(sql, params, t)).rows[0] || null;
}
async function qValor(sql, params = [], t = null) {
  const linha = await qUm(sql, params, t);
  return linha ? Object.values(linha)[0] : null;
}
const transacao = (fn) => db().transacao(fn);

/** Próximo número da sequência do protocolo (por prefixo e ano), sem colisão. */
async function proximoNumero(prefixo, ano, t) {
  return Number(await qValor(
    `INSERT INTO contadores (prefixo, ano, ultimo) VALUES (?, ?, 1)
     ON CONFLICT (prefixo, ano) DO UPDATE SET ultimo = contadores.ultimo + 1 RETURNING ultimo`,
    [prefixo, ano], t,
  ));
}

function fecharBanco() {
  if (banco) banco.fechar();
  banco = null;
}

module.exports = { db, driver, q, qTodos, qUm, qValor, transacao, proximoNumero, fecharBanco };
