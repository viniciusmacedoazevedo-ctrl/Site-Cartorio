'use strict';
/**
 * Ajusta o public/.htaccess para a versão Node.js:
 * - tira a regra que mandava tudo para o index.php;
 * - bloqueia qualquer arquivo .php (o PHP deixa de ser usado);
 * - mantém https, www e cache;
 * - preserva os blocos que o cPanel escreve (Node.js/Passenger e MultiPHP).
 * Uso: node node/bin/htaccess-node.js                       (guarda uma cópia em storage/)
 *      node node/bin/htaccess-node.js --blocos-de=ARQUIVO    (pega os blocos do cPanel de outro arquivo)
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..');
const ARQ = path.join(RAIZ, 'public', '.htaccess');
const opcaoBlocos = (process.argv.find((a) => a.startsWith('--blocos-de=')) || '').slice('--blocos-de='.length);

const REGRAS = `# Site do cartório – versão Node.js (gerado por node/bin/htaccess-node.js)
Options -Indexes
RewriteEngine On
# Validação do certificado (Let's Encrypt / AutoSSL) precisa responder em HTTP, sem redirecionar.
RewriteRule ^\\.well-known/ - [L]
RewriteCond %{HTTPS} off
RewriteCond %{HTTP_HOST} !^localhost [NC]
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteCond %{HTTP_HOST} ^cartoriosjcampestre\\.com\\.br$ [NC]
RewriteRule ^ https://www.cartoriosjcampestre.com.br%{REQUEST_URI} [L,R=301]

# O PHP não é mais usado: nenhum arquivo .php é executado nem baixado.
<FilesMatch "\\.(php|phtml|php8|ini)$">
  Require all denied
</FilesMatch>

<IfModule mod_headers.c>
  <FilesMatch "\\.(css|js|png|svg|woff2)$">
    Header set Cache-Control "public, max-age=604800"
  </FilesMatch>
</IfModule>
`;

function blocosCpanel(texto) {
  const blocos = [];
  const re = /#\s*DO NOT REMOVE\.\s*CLOUDLINUX PASSENGER CONFIGURATION BEGIN[\s\S]*?#\s*DO NOT REMOVE\.\s*CLOUDLINUX PASSENGER CONFIGURATION END[^\n]*\n?/g;
  for (const m of texto.match(re) || []) blocos.push(m.trimEnd());
  const handler = texto.match(/# php -- BEGIN cPanel-generated handler[\s\S]*?# php -- END cPanel-generated handler[^\n]*\n?/);
  if (handler) blocos.push(handler[0].trimEnd());
  const php = texto.match(/# BEGIN cPanel-generated php ini directives[\s\S]*?# END cPanel-generated php ini directives[^\n]*\n?/);
  if (php) blocos.push(php[0].trimEnd());
  return blocos;
}

const atual = fs.existsSync(ARQ) ? fs.readFileSync(ARQ, 'utf8') : '';
const origem = opcaoBlocos ? fs.readFileSync(opcaoBlocos.replace(/^~(?=\/)/, process.env.HOME || '~'), 'utf8') : atual;
const preservados = blocosCpanel(origem);
if (atual) {
  fs.mkdirSync(path.join(RAIZ, 'storage', 'logs'), { recursive: true });
  const copia = path.join(RAIZ, 'storage', 'logs', `htaccess-antes-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.txt`);
  fs.writeFileSync(copia, atual, { mode: 0o600 });
  console.log(`Cópia do .htaccess anterior: ${path.relative(RAIZ, copia)}`);
}
const novo = (preservados.length ? preservados.join('\n\n') + '\n\n' : '') + REGRAS;
fs.writeFileSync(ARQ, novo);
console.log(`public/.htaccess atualizado para a versão Node.js${preservados.length ? ` (mantidos ${preservados.length} bloco(s) do cPanel)` : ''}.`);
