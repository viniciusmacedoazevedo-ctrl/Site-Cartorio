'use strict';
/**
 * Cria o node/config.json fazendo perguntas.
 * Uso: node node/bin/configurar.js
 *      node node/bin/configurar.js --importar-php   (aproveita o app/config.php da versão PHP, sem redigitar senhas)
 * Gera a chave secreta sozinho e testa a conexão com o banco antes de gravar.
 */
process.env.TZ = 'America/Fortaleza';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { perguntar, perguntarSenha, escolher } = require('./_terminal');

const NODE_DIR = path.resolve(__dirname, '..');
const RAIZ = path.resolve(NODE_DIR, '..');
const DESTINO = process.env.CARTORIO_CONFIG || path.join(NODE_DIR, 'config.json');

const MODELO = {
  base_url: 'https://www.cartoriosjcampestre.com.br',
  app_key: '',
  debug: false,
  db: { driver: 'pgsql', host: 'localhost', port: 5432, database: 'cartorio_site', username: 'cartorio_site', password: '' },
  mail: {
    transport: 'smtp',
    from_email: 'nao-responda@cartoriosjcampestre.com.br',
    from_name: 'Cartório de São José do Campestre',
    smtp: { host: 'mail.cartoriosjcampestre.com.br', port: 587, encryption: 'tls', username: 'nao-responda@cartoriosjcampestre.com.br', password: '', timeout: 15 },
  },
  destinos: {
    pedido: 'contato@cartoriosjcampestre.com.br',
    contato: 'contato@cartoriosjcampestre.com.br',
    ouvidoria: 'ouvidoria@cartoriosjcampestre.com.br',
    lgpd: 'lgpd@cartoriosjcampestre.com.br',
    lgpd_copia: 'denis@psgdados.com.br',
  },
  uploads: { max_bytes: 5 * 1024 * 1024, path: 'storage/anexos' },
  rate_limit: { max: 6, janela_min: 15 },
  admin_timeout_min: 30,
};

/** Lê o app/config.php com o PHP do servidor e converte para o formato do Node. */
function importarPhp() {
  const arq = path.join(RAIZ, 'app', 'config.php');
  if (!fs.existsSync(arq)) throw new Error('app/config.php não encontrado.');
  const phps = ['/opt/cpanel/ea-php83/root/usr/bin/php', '/opt/cpanel/ea-php82/root/usr/bin/php', 'php'];
  for (const php of phps) {
    try {
      const saida = execFileSync(php, ['-r', 'echo json_encode(require $argv[1]);', arq], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const c = JSON.parse(saida);
      const r = JSON.parse(JSON.stringify(MODELO));
      Object.assign(r, { base_url: c.base_url || r.base_url, debug: false });
      r.db = { ...r.db, ...c.db };
      delete r.db.sqlite_path;
      r.mail = { ...r.mail, ...c.mail, smtp: { ...r.mail.smtp, ...(c.mail && c.mail.smtp) } };
      r.destinos = { ...r.destinos, ...c.destinos };
      if (c.rate_limit) r.rate_limit = c.rate_limit;
      if (c.admin_timeout_min) r.admin_timeout_min = c.admin_timeout_min;
      return r;
    } catch {
      /* tenta o próximo */
    }
  }
  throw new Error('Não foi possível ler o app/config.php com o PHP do servidor.');
}

async function testarBanco(db) {
  process.env.CARTORIO_CONFIG_TESTE = '1';
  const { Pool } = require('../lib/pg');
  const pool = new Pool({ ...db, max: 1 });
  try {
    const r = await pool.consultar("SELECT tablename FROM pg_tables WHERE schemaname = current_schema()");
    return r.rows.map((x) => x.tablename);
  } finally {
    pool.fechar();
  }
}

function gravar(config) {
  if (fs.existsSync(DESTINO)) {
    const copia = `${DESTINO}.bak-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`;
    fs.copyFileSync(DESTINO, copia);
    fs.chmodSync(copia, 0o600);
    console.log(`\nCópia de segurança: ${copia}`);
  }
  fs.writeFileSync(DESTINO, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
  fs.chmodSync(DESTINO, 0o600);
  console.log(`\nGravado em ${path.relative(RAIZ, DESTINO)} (permissão 600).`);
  console.log('Próximo passo: node node/bin/verificar.js');
}

async function main() {
  console.log('\nConfiguração do site do cartório (versão Node.js)');
  if (fs.existsSync(DESTINO)) {
    const r = await escolher('Já existe um node/config.json. Substituir? Uma cópia de segurança será guardada', ['s', 'n'], 'n');
    if (r !== 's') {
      console.log('Nada foi alterado.');
      return;
    }
  }

  if (process.argv.includes('--importar-php')) {
    const config = importarPhp();
    config.app_key = crypto.randomBytes(32).toString('hex');
    if (config.db.driver !== 'pgsql') throw new Error(`O app/config.php usa o banco "${config.db.driver}". A versão Node usa PostgreSQL.`);
    process.stdout.write('Testando a conexão com o banco... ');
    const tabelas = await testarBanco(config.db);
    console.log('ok.');
    if (!tabelas.includes('usuarios')) console.log('Atenção: as tabelas ainda não existem (database/schema.pgsql.sql).');
    console.log(`Importado do app/config.php: banco ${config.db.database}, e-mail ${config.mail.transport} (${config.mail.from_email}).`);
    gravar(config);
    return;
  }

  console.log('Aperte Enter para aceitar o valor entre colchetes.\n');
  const config = JSON.parse(JSON.stringify(MODELO));
  config.base_url = (await perguntar('Endereço público do site', config.base_url)).replace(/\/+$/, '');
  config.app_key = crypto.randomBytes(32).toString('hex');

  console.log('\n— Banco de dados (PostgreSQL) —');
  for (;;) {
    const db = config.db;
    db.host = await perguntar('Servidor do banco', db.host);
    db.port = Number(await perguntar('Porta', String(db.port)));
    db.database = await perguntar('Nome do banco', db.database);
    db.username = await perguntar('Usuário do banco', db.username);
    db.password = await perguntarSenha('Senha do usuário do banco (não aparece ao digitar)');
    process.stdout.write('Testando a conexão... ');
    try {
      const tabelas = await testarBanco(db);
      console.log('ok.');
      if (!tabelas.includes('usuarios')) {
        console.log('Atenção: as tabelas ainda não existem. Rode depois:');
        console.log(`  psql -h ${db.host} -U ${db.username} ${db.database} -f database/schema.pgsql.sql`);
      }
      break;
    } catch (err) {
      console.log(`falhou.\n  ${err.message}`);
      if ((await escolher('Tentar de novo?', ['s', 'n'], 's')) !== 's') {
        console.log('Nada foi gravado.');
        process.exit(1);
      }
    }
  }

  console.log('\n— E-mail —');
  console.log('smtp = provedor de e-mail com usuário e senha');
  console.log('mail = programa de e-mail do próprio servidor (sendmail)');
  const m = config.mail;
  m.transport = await escolher('Forma de envio', ['smtp', 'mail'], m.transport);
  m.from_email = await perguntar('Remetente dos e-mails automáticos', m.from_email);
  if (m.transport === 'smtp') {
    m.smtp.host = await perguntar('Servidor SMTP', m.smtp.host);
    m.smtp.encryption = await escolher('Criptografia', ['tls', 'ssl', 'none'], m.smtp.encryption);
    m.smtp.port = Number(await perguntar('Porta SMTP', m.smtp.encryption === 'ssl' ? '465' : '587'));
    m.smtp.username = await perguntar('Usuário SMTP', m.from_email);
    m.smtp.password = await perguntarSenha('Senha SMTP (não aparece ao digitar)');
  }
  gravar(config);
}

main().catch((err) => {
  console.error(`\nErro: ${err.message}`);
  process.exit(1);
});
