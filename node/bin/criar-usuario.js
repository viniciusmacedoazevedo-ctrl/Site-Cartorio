'use strict';
/**
 * Cria ou redefine um usuário do painel.
 * Uso: node node/bin/criar-usuario.js "Nome" email@dominio admin|atendente
 * A senha é pedida sem aparecer na tela (ou vem da variável SENHA).
 */
process.env.TZ = 'America/Fortaleza';
const { emailValido, agora } = require('../lib/base');
const { qValor, q, fecharBanco } = require('../lib/db');
const { hashSenha, senhaForte } = require('../lib/auth');
const { perguntarSenha } = require('./_terminal');

async function main() {
  const [nome, emailBruto, perfil] = process.argv.slice(2);
  if (!nome || !emailBruto || !['admin', 'atendente'].includes(perfil)) {
    console.error('Uso: node node/bin/criar-usuario.js "Nome" email@dominio admin|atendente');
    process.exit(1);
  }
  const email = emailBruto.trim().toLowerCase();
  if (!emailValido(email)) {
    console.error('E-mail inválido.');
    process.exit(1);
  }
  const senha = process.env.SENHA || (await perguntarSenha('Senha (mín. 10 caracteres, letras e números)')).trim();
  const fraca = senhaForte(senha);
  if (fraca) {
    console.error(fraca);
    process.exit(1);
  }
  const hash = hashSenha(senha);
  if (await qValor('SELECT id FROM usuarios WHERE email = ?', [email])) {
    await q('UPDATE usuarios SET nome = ?, senha_hash = ?, perfil = ?, ativo = 1, tentativas = 0, bloqueado_ate = NULL WHERE email = ?', [nome, hash, perfil, email]);
    console.log(`Usuário atualizado: ${email} (${perfil})`);
  } else {
    await q('INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo, criado_em) VALUES (?, ?, ?, ?, 1, ?)', [nome, email, hash, perfil, agora()]);
    console.log(`Usuário criado: ${email} (${perfil})`);
  }
  fecharBanco();
}

main().catch((err) => {
  console.error(`Erro: ${err.message}`);
  process.exit(1);
});
