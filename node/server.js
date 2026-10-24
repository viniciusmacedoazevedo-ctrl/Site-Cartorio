'use strict';
/**
 * Site do Cartório de São José do Campestre/RN — versão Node.js (sem dependências externas).
 * Uso local:   node node/server.js   (porta 3000 ou PORT)
 * No cPanel:   aplicativo Node.js com arquivo de inicialização app.js (na raiz do projeto).
 */
process.env.TZ = 'America/Fortaleza';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { RAIZ, cfg, carregarConfig, html, registrarErro } = require('./lib/base');
const { Contexto, Resposta, redirecionar } = require('./lib/http');
const { pagina } = require('./views/layout');
const estaticas = require('./pages/estaticas');
const formularios = require('./pages/formularios');
const transparencia = require('./pages/transparencia');
const painel = require('./admin/painel');

const PUBLICO = path.join(RAIZ, 'public');

function naoEncontrado(ctx) {
  return ctx.html(pagina(ctx, { titulo: 'Página não encontrada' }, html`<main id="conteudo" class="pagina"><div class="faixa"><h1>Página não encontrada</h1><p class="lead">O endereço digitado não existe ou mudou. Use o menu acima ou volte para a <a href="/">página inicial</a>.</p></div></main>`), 404);
}

const ROTAS = {
  '/': estaticas.inicio,
  '/servicos': estaticas.servicos,
  '/pedido': formularios.pedido,
  '/protocolo': formularios.protocolo,
  '/ouvidoria': formularios.ouvidoria,
  '/privacidade': formularios.privacidade,
  '/cookies': estaticas.cookies,
  '/conformidade': estaticas.conformidade,
  '/contato': formularios.contato,
  '/enviado': formularios.enviado,
  '/serventia': estaticas.serventia,
  '/emolumentos': estaticas.emolumentos,
  '/transparencia': transparencia.transparencia,
  '/transparencia/arquivo': (ctx) => transparencia.arquivo(ctx, naoEncontrado),
  '/validacao': estaticas.validacao,
  '/termos': estaticas.termos,
  '/acessibilidade': estaticas.acessibilidade,
  '/admin': painel.login,
  '/admin/sair': painel.sairPainel,
  '/admin/registros': painel.registros,
  '/admin/registro': painel.registro,
  '/admin/anexo': painel.anexo,
  '/admin/exportar': painel.exportar,
  '/admin/usuarios': painel.usuarios,
  '/admin/senha': painel.senha,
  '/admin/transparencia': painel.transparenciaAdmin,
};

const TIPOS = {
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon', '.json': 'application/json', '.xml': 'application/xml',
  '.html': 'text/html; charset=utf-8',
};
const CACHE_LONGO = new Set(['.css', '.js', '.png', '.svg', '.woff2']);

/** Arquivo real dentro de public/ (nunca fora dela, nunca .php nem arquivos ocultos, exceto .well-known). */
function arquivoPublico(caminho) {
  let rel;
  try {
    rel = decodeURIComponent(caminho);
  } catch {
    return null;
  }
  if (rel.includes('\0')) return null;
  const alvo = path.resolve(PUBLICO, '.' + rel);
  if (!alvo.startsWith(PUBLICO + path.sep)) return null;
  const partes = path.relative(PUBLICO, alvo).split(path.sep);
  if (partes.some((p, i) => p.startsWith('.') && !(i === 0 && p === '.well-known'))) return null;
  if (/\.(php|phtml|ini)$/i.test(alvo)) return null;
  try {
    const st = fs.statSync(alvo);
    return st.isFile() ? { alvo, st } : null;
  } catch {
    return null;
  }
}

function cabecalhosSeguranca(ctx) {
  const h = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; script-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'",
  };
  if (ctx.https) h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  return h;
}

/**
 * Endereço canônico (https e com www), como o .htaccess da versão PHP.
 * Só manda para https quando o servidor web informa que a visita veio por http
 * (X-Forwarded-Proto: http); sem essa informação, deixa o redirecionamento para o .htaccess.
 */
function redirecionamentoCanonico(req, ctx) {
  const host = String(req.headers.host || '').toLowerCase();
  if (!host || /^(localhost|127\.|\[::1\])/.test(host) || ctx.caminho.startsWith('/.well-known/')) return null;
  let canon;
  try {
    canon = new URL(cfg('base_url', ''));
  } catch {
    return null;
  }
  if (canon.protocol !== 'https:') return null;
  const semWww = canon.host.replace(/^www\./, '');
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  const veioPorHttp = proto === 'http';
  const semPrefixo = host === semWww && canon.host !== semWww;
  if (!veioPorHttp && !semPrefixo) return null;
  return `https://${semPrefixo ? canon.host : host}${req.url}`;
}

/** Sem X-Forwarded-Proto, uma visita ao endereço oficial https conta como https (cookie Secure e HSTS). */
function marcarHttps(req, ctx) {
  if (ctx.https) return;
  const proto = String(req.headers['x-forwarded-proto'] || '').trim().toLowerCase();
  try {
    const canon = new URL(cfg('base_url', ''));
    if (canon.protocol === 'https:' && !proto && String(req.headers.host || '').toLowerCase() === canon.host) ctx.https = true;
  } catch {
    /* sem base_url */
  }
}

async function atender(req, res) {
  const url = new URL(req.url, 'http://local');
  const ctx = new Contexto(req, url);
  let resposta;
  try {
    const canon = redirecionamentoCanonico(req, ctx);
    marcarHttps(req, ctx);
    if (canon) {
      resposta = redirecionar(canon, 301);
    } else if (!['GET', 'HEAD', 'POST'].includes(req.method)) {
      resposta = new Resposta(405, 'Método não permitido.', { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD, POST' });
    } else {
      const arq = req.method !== 'POST' && ctx.caminho !== '/' ? arquivoPublico(ctx.caminho) : null;
      if (arq) {
        const ext = path.extname(arq.alvo).toLowerCase();
        const cab = { ...cabecalhosSeguranca(ctx), 'Content-Type': TIPOS[ext] || 'application/octet-stream', 'Content-Length': arq.st.size, 'Last-Modified': arq.st.mtime.toUTCString() };
        if (CACHE_LONGO.has(ext)) cab['Cache-Control'] = 'public, max-age=604800';
        if (req.headers['if-modified-since'] && new Date(req.headers['if-modified-since']) >= new Date(arq.st.mtime.toUTCString())) {
          res.writeHead(304, cab);
          res.end();
          return;
        }
        res.writeHead(200, cab);
        if (req.method === 'HEAD') res.end();
        else fs.createReadStream(arq.alvo).pipe(res);
        return;
      }
      const rota = '/' + ctx.caminho.replace(/^\/+|\/+$/g, '');
      ctx.caminho = rota;
      const fn = ROTAS[rota];
      resposta = fn ? await fn(ctx) : naoEncontrado(ctx);
    }
  } catch (err) {
    if (err instanceof Resposta) {
      resposta = err;
    } else {
      registrarErro(`Erro em ${req.method} ${req.url}`, err);
      const debug = Boolean(cfg('debug', false));
      resposta = ctx.html(html`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Erro no site</title></head><body><h1>O site está com um problema</h1><p>Tente de novo em alguns minutos ou ligue para (84) 3294-2524.</p>${debug ? html`<pre>${err.stack}</pre>` : ''}</body></html>`, 500);
    }
  }
  if (!ctx.metodo || req.method === 'POST') req.resume();
  const cab = { ...cabecalhosSeguranca(ctx), ...resposta.cabecalhos };
  if (ctx.caminho.startsWith('/admin')) {
    cab['X-Robots-Tag'] = 'noindex, nofollow';
    cab['Cache-Control'] = cab['Cache-Control'] || 'no-store';
  }
  const cookie = ctx.cookieSessao();
  if (cookie) cab['Set-Cookie'] = cookie;
  const corpo = Buffer.isBuffer(resposta.corpo) ? resposta.corpo : Buffer.from(String(resposta.corpo ?? ''), 'utf8');
  cab['Content-Length'] = String(corpo.length);
  res.writeHead(resposta.status, cab);
  res.end(req.method === 'HEAD' ? undefined : corpo);
}

function iniciar(porta = process.env.PORT || 3000) {
  carregarConfig();
  const servidor = http.createServer((req, res) => {
    atender(req, res).catch((err) => {
      registrarErro('Falha ao responder', err);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Erro no site.');
    });
  });
  servidor.headersTimeout = 30000;
  servidor.requestTimeout = 120000;
  servidor.listen(porta, () => {
    if (!process.env.PASSENGER_APP_ENV) process.stdout.write(`Site do cartório em http://localhost:${porta}\n`);
  });
  return servidor;
}

if (require.main === module || process.env.PASSENGER_APP_ENV || process.env.CARTORIO_INICIAR) {
  iniciar();
}

module.exports = { iniciar, atender };
