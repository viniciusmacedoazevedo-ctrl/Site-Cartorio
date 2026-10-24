'use strict';
/**
 * Confere a instalação da versão Node.js.
 * Uso: node node/bin/verificar.js [--online] [--testar-email=seu@email]
 */
process.env.TZ = 'America/Fortaleza';
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..');
const CONFIG = process.env.CARTORIO_CONFIG || path.join(RAIZ, 'node', 'config.json');
let falhas = 0;
let avisos = 0;
const ok = (m) => console.log(`  OK     ${m}`);
const falha = (m, dica) => {
  falhas++;
  console.log(`  FALHA  ${m}`);
  if (dica) console.log(`         → ${dica}`);
};
const aviso = (m, dica) => {
  avisos++;
  console.log(`  AVISO  ${m}`);
  if (dica) console.log(`         → ${dica}`);
};

async function main() {
  console.log('\nNode.js');
  const [maior] = process.versions.node.split('.').map(Number);
  maior >= 20 ? ok(`Node ${process.versions.node}`) : falha(`Node ${process.versions.node} (precisa ser 20 ou mais novo)`, 'no cPanel, escolha a versão 22 ou 24 em "Setup Node.js App"');

  console.log('\nConfiguração (node/config.json)');
  if (!fs.existsSync(CONFIG)) {
    falha('node/config.json não existe', 'node node/bin/configurar.js --importar-php   (ou sem --importar-php para responder as perguntas)');
    return fim();
  }
  const modo = fs.statSync(CONFIG).mode & 0o777;
  modo & 0o044 ? falha('node/config.json pode ser lido por outros usuários', 'chmod 600 node/config.json') : ok('node/config.json protegido');
  const { cfg } = require('../lib/base');
  const chave = String(cfg('app_key', ''));
  chave.length >= 64 ? ok('chave secreta (app_key) definida') : falha('app_key ausente ou curta', 'node node/bin/configurar.js');
  cfg('debug') ? falha('debug ligado (mostra erros para o público)', 'troque "debug": false no node/config.json') : ok('debug desligado');
  String(cfg('base_url', '')).startsWith('https://') ? ok(`base_url ${cfg('base_url')}`) : aviso('base_url não começa com https://');
  cfg('db.driver') === 'pgsql' ? ok('banco PostgreSQL') : falha(`banco "${cfg('db.driver')}" (sqlite é só para testes)`, 'use "driver": "pgsql"');
  const t = cfg('mail.transport');
  if (t === 'log') falha('e-mail em modo "log" (nada é enviado)', 'use "smtp" ou "mail"');
  else if (t === 'smtp') ok(`e-mail por SMTP (${cfg('mail.smtp.host')})`);
  else ok('e-mail pelo servidor local (sendmail)');

  console.log('\nBanco de dados');
  const { qTodos, qValor, fecharBanco } = require('../lib/db');
  try {
    const versao = Number(await qValor('SHOW server_version_num'));
    ok(`conexão com ${cfg('db.database')} em ${cfg('db.host')}`);
    versao >= 100000 ? ok(`PostgreSQL ${await qValor('SHOW server_version')}`) : falha('PostgreSQL antigo (precisa ser 10 ou mais novo)');
    const esperadas = ['registros', 'anexos', 'usuarios', 'historico', 'contadores', 'limites', 'auditoria', 'transparencia'];
    const existentes = (await qTodos('SELECT tablename FROM pg_tables WHERE schemaname = current_schema()')).map((r) => r.tablename);
    const faltando = esperadas.filter((x) => !existentes.includes(x));
    if (faltando.length) {
      falha(`tabelas ausentes: ${faltando.join(', ')}`, `psql -h ${cfg('db.host')} -U ${cfg('db.username')} ${cfg('db.database')} -f database/schema.pgsql.sql`);
    } else {
      ok('todas as tabelas criadas');
      const admins = await qTodos("SELECT email, senha_hash FROM usuarios WHERE perfil = 'admin' AND ativo = 1");
      if (!admins.length) falha('nenhum administrador do painel', 'node node/bin/criar-usuario.js "Nome" email@dominio admin');
      else ok('há administrador do painel');
      const antigos = (await qTodos('SELECT email, senha_hash FROM usuarios WHERE ativo = 1')).filter((u) => /^\$2[aby]\$/.test(u.senha_hash));
      for (const u of antigos) aviso(`${u.email} tem senha do sistema antigo (PHP) e não consegue entrar`, `node node/bin/criar-usuario.js "Nome" ${u.email} admin|atendente`);
    }
  } catch (err) {
    falha(`não conectou ao banco: ${err.message}`, 'confira host, usuário e senha em node/config.json');
  }
  fecharBanco();

  console.log('\nPastas de gravação');
  for (const p of ['storage/anexos', 'storage/logs', 'storage/transparencia']) {
    const d = path.join(RAIZ, p);
    try {
      fs.mkdirSync(d, { recursive: true });
      fs.accessSync(d, fs.constants.W_OK);
      ok(`${p} gravável`);
    } catch {
      falha(`${p} sem permissão de gravação`, `chmod -R 750 ${p}`);
    }
  }

  console.log('\nProteções');
  const ht = path.join(RAIZ, 'public', '.htaccess');
  const conteudo = fs.existsSync(ht) ? fs.readFileSync(ht, 'utf8') : '';
  /Require all denied/.test(conteudo) && /\.php/.test(conteudo)
    ? ok('arquivos .php bloqueados no public/.htaccess')
    : aviso('o public/.htaccess não bloqueia os arquivos .php da versão antiga', 'node node/bin/htaccess-node.js');

  const emailTeste = (process.argv.find((a) => a.startsWith('--testar-email=')) || '').split('=')[1];
  if (emailTeste) {
    console.log('\nTeste de e-mail');
    const { enviarEmail } = require('../lib/mailer');
    (await enviarEmail(emailTeste, 'Teste do site do cartório', 'Se você recebeu esta mensagem, o envio de e-mail do site está funcionando.'))
      ? ok(`mensagem enviada para ${emailTeste}`)
      : falha('o envio falhou', 'veja storage/logs/node-error.log');
  }

  if (process.argv.includes('--online')) {
    console.log('\nSite na internet');
    const base = String(cfg('base_url', '')).replace(/\/+$/, '');
    const pedir = (url) => fetch(url, { redirect: 'manual' });
    try {
      const r = await pedir(base + '/');
      r.status === 200 ? ok(`${base}/ responde 200`) : falha(`${base}/ respondeu ${r.status}`);
      (r.headers.get('strict-transport-security') || '') ? ok('HTTPS com HSTS') : aviso('resposta sem HSTS');
      const t2 = await (await pedir(base + '/servicos')).text();
      /Carta de Serviços/.test(t2) ? ok('páginas internas respondem pela versão Node') : falha('página /servicos não respondeu como esperado');
      const hu = new URL(base);
      const rh = await pedir(`http://${hu.host}/`);
      [301, 302, 308].includes(rh.status) && String(rh.headers.get('location')).startsWith('https://') ? ok(`http://${hu.host} redireciona para HTTPS`) : falha(`http://${hu.host} não redireciona para HTTPS (${rh.status})`);
      const semWww = hu.host.replace(/^www\./, '');
      if (semWww !== hu.host) {
        const rw = await pedir(`https://${semWww}/`);
        [301, 302, 308].includes(rw.status) ? ok(`https://${semWww} redireciona para o www`) : aviso(`https://${semWww} não redireciona para o www (${rw.status})`);
      }
      for (const p of ['/index.php', '/../app/config.php', '/../node/config.json', '/.htaccess', '/../storage/']) {
        const rp = await pedir(base + p);
        const corpo = rp.status === 200 ? await rp.text() : '';
        const exposto = rp.status === 200 && (/<\?php|"app_key"|password/i.test(corpo) || p === '/index.php' && !/Página não encontrada/.test(corpo));
        exposto ? falha(`${p} está exposto`) : ok(`${p} não está exposto`);
      }
    } catch (err) {
      falha(`não foi possível acessar ${base}: ${err.message}`);
    }
  }
  fim();
}

function fim() {
  console.log(falhas
    ? `\nResultado: ${falhas} falha(s) e ${avisos} aviso(s). Corrija as falhas e rode de novo.`
    : `\nResultado: tudo certo${avisos ? ` (${avisos} aviso(s))` : ''}.`);
  process.exitCode = falhas ? 1 : 0;
}

main().catch((err) => {
  console.error(`Erro: ${err.message}`);
  process.exit(1);
});
