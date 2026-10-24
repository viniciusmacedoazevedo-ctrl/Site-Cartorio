'use strict';
/** Login do painel, perfis, senhas e trilha de auditoria. */
const crypto = require('node:crypto');
const { cfg, agora, cortar, tamanho, hmac, dois } = require('./base');
const { q, qUm } = require('./db');
const { redirecionar, Resposta } = require('./http');

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MIN = 15;
const SCRYPT = { N: 16384, r: 8, p: 1 };

/* ------------------------------------------------------------- senhas */

function hashSenha(senha) {
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(String(senha), sal, 32, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${sal.toString('base64')}$${h.toString('base64')}`;
}

/** Senhas criadas pelo site em PHP (bcrypt) não podem ser conferidas aqui: precisam ser redefinidas. */
const senhaAntiga = (hash) => /^\$2[aby]\$/.test(String(hash || ''));

function conferirSenha(senha, hash) {
  const partes = String(hash || '').split('$');
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false;
  const [, N, r, p, salB64, hB64] = partes;
  const esperado = Buffer.from(hB64, 'base64');
  const calc = crypto.scryptSync(String(senha), Buffer.from(salB64, 'base64'), esperado.length, {
    N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
  });
  return calc.length === esperado.length && crypto.timingSafeEqual(calc, esperado);
}

function senhaForte(senha) {
  if (tamanho(senha) < 10) return 'A senha precisa ter pelo menos 10 caracteres.';
  if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha)) return 'Use letras e números na senha.';
  return null;
}

/** Marca da senha atual guardada na sessão: trocar a senha encerra as outras sessões. */
const marcaSenha = (hash) => hmac('senha:' + hash).slice(0, 16);

/* ------------------------------------------------------------- sessão do painel */

async function usuarioAtual(ctx) {
  if (ctx._usuario !== undefined) return ctx._usuario;
  const s = ctx.sessao;
  ctx._usuario = null;
  if (!s.uid) return null;
  const limite = Number(cfg('admin_timeout_min', 30)) * 60;
  const agoraSeg = Math.floor(Date.now() / 1000);
  if (agoraSeg - Number(s.ultimo || 0) > limite) {
    sair(ctx);
    return null;
  }
  const u = await qUm('SELECT id, nome, email, perfil, senha_hash FROM usuarios WHERE id = ? AND ativo = 1', [s.uid]);
  if (!u || s.marca !== marcaSenha(u.senha_hash)) {
    sair(ctx);
    return null;
  }
  s.ultimo = agoraSeg;
  ctx.salvarSessao();
  delete u.senha_hash;
  u.id = Number(u.id);
  ctx._usuario = u;
  return u;
}

async function exigirLogin(ctx) {
  const u = await usuarioAtual(ctx);
  if (!u) {
    ctx.flash('aviso', 'Entre com seu usuário para continuar.');
    throw redirecionar('/admin');
  }
  return u;
}

async function exigirAdmin(ctx) {
  const u = await exigirLogin(ctx);
  if (u.perfil !== 'admin') {
    throw new Resposta(403, 'Acesso restrito ao perfil Administrador.', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
  return u;
}

async function auditoria(ctx, usuarioId, acao, alvo) {
  await q('INSERT INTO auditoria (usuario_id, acao, alvo, ip, criado_em) VALUES (?, ?, ?, ?, ?)',
    [usuarioId, acao, cortar(alvo, 190), ctx ? ctx.ip : '', agora()]);
}

/** Retorna [ok, mensagem]. */
async function entrar(ctx, email, senha) {
  const emailNorm = String(email).trim().toLowerCase();
  const u = await qUm('SELECT * FROM usuarios WHERE email = ?', [emailNorm]);
  const erroPadrao = 'E-mail ou senha incorretos.';
  if (!u || !Number(u.ativo)) {
    hashSenha(senha); // mesmo custo de tempo de um login real
    await auditoria(ctx, null, 'login_falhou', email);
    return [false, erroPadrao];
  }
  if (u.bloqueado_ate && String(u.bloqueado_ate) > agora()) {
    return [false, `Acesso bloqueado por excesso de tentativas. Tente de novo depois das ${String(u.bloqueado_ate).slice(11, 16)}.`];
  }
  if (senhaAntiga(u.senha_hash)) {
    await auditoria(ctx, Number(u.id), 'login_falhou', email + ' (senha precisa ser redefinida)');
    return [false, 'Sua senha foi criada no sistema antigo e precisa ser redefinida. Peça a um administrador para rodar o comando de redefinição de senha no servidor.'];
  }
  if (!conferirSenha(senha, u.senha_hash)) {
    const t = Number(u.tentativas) + 1;
    let bloq = null;
    if (t >= MAX_TENTATIVAS) {
      const d = new Date(Date.now() + BLOQUEIO_MIN * 60 * 1000);
      bloq = agora(d);
    }
    await q('UPDATE usuarios SET tentativas = ?, bloqueado_ate = ? WHERE id = ?', [bloq ? 0 : t, bloq, u.id]);
    await auditoria(ctx, Number(u.id), 'login_falhou', email);
    return [false, bloq ? `Acesso bloqueado por ${BLOQUEIO_MIN} minutos após ${MAX_TENTATIVAS} tentativas.` : erroPadrao];
  }
  ctx.novaSessao({ uid: Number(u.id), ultimo: Math.floor(Date.now() / 1000), marca: marcaSenha(u.senha_hash) });
  ctx._usuario = undefined;
  await q('UPDATE usuarios SET tentativas = 0, bloqueado_ate = NULL, ultimo_login = ? WHERE id = ?', [agora(), u.id]);
  await auditoria(ctx, Number(u.id), 'login', '');
  return [true, ''];
}

function sair(ctx) {
  ctx.novaSessao();
  ctx._usuario = null;
}

/** Condição SQL que limita o que o perfil Atendente pode ver. */
function filtroPerfil(u, prefixo = '') {
  if (u.perfil === 'admin') return '1=1';
  return `${prefixo}formulario <> 'lgpd' AND NOT (${prefixo}formulario = 'ouvidoria' AND ${prefixo}tipo = 'Denúncia')`;
}

module.exports = {
  hashSenha, conferirSenha, senhaAntiga, senhaForte, marcaSenha, usuarioAtual, exigirLogin, exigirAdmin,
  auditoria, entrar, sair, filtroPerfil, MAX_TENTATIVAS, BLOQUEIO_MIN, dois,
};
