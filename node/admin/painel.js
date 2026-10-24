'use strict';
/** Painel /admin: login, registros, detalhe, anexos, exportação, usuários, senha e transparência. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { cfg, cartorio, RUBRICAS, html, raw, e, dataBr, nl2br, agora, cortar, emailValido, primeiraMaiuscula, registrarErro, rawurlencode } = require('../lib/base');
const { q, qTodos, qUm, qValor, driver } = require('../lib/db');
const { Resposta, redirecionar } = require('../lib/http');
const { STATUS, statusClasse, formularios, csrfCampo } = require('../lib/forms');
const { exigirLogin, exigirAdmin, usuarioAtual, entrar, sair, auditoria, filtroPerfil, senhaForte, hashSenha, conferirSenha, senhaAntiga, marcaSenha } = require('../lib/auth');
const { limiteExcedido, registrarTentativa, historico, rotulosExtras, tipoArquivo, baseUrl } = require('../lib/registros');
const { enviarEmail } = require('../lib/mailer');
const { mesNome, lerMoeda, numeroBr, PASTA } = require('../pages/transparencia');
const { paginaAdmin } = require('../views/layout');

const CURTOS = { pedido: 'Pedido', ouvidoria: 'Ouvidoria', lgpd: 'LGPD', contato: 'Contato' };
const anon = (txt) => raw(`<span class="adm-anon">${txt}</span>`);

/* ------------------------------------------------------------- login e saída */

async function login(ctx) {
  if (await usuarioAtual(ctx)) throw redirecionar('/admin/registros');
  let erro = null;
  let email = '';
  if (ctx.metodo === 'POST') {
    await ctx.lerFormulario();
    email = ctx.campo('email').trim();
    if (!ctx.csrfOk()) {
      erro = 'A página ficou aberta por muito tempo. Entre de novo.';
    } else if (await limiteExcedido(ctx, 'login')) {
      erro = 'Muitas tentativas a partir desta conexão. Aguarde 15 minutos.';
    } else {
      const [ok, msg] = await entrar(ctx, email, ctx.campo('senha'));
      if (ok) throw redirecionar('/admin/registros');
      await registrarTentativa(ctx, 'login');
      erro = msg;
    }
  }
  return ctx.html(await paginaAdmin(ctx, { titulo: 'Entrar' }, html`
<section class="adm-login">
  <h1>Entrar no painel</h1>
  <p>Acesso restrito à equipe do cartório. Todas as ações ficam registradas.</p>
  ${erro ? html`<div class="adm-alerta adm-aviso" role="alert">${erro}</div>` : ''}
  <form method="post" action="/admin" class="adm-form">
    <label for="l-email">E-mail</label>
    <input id="l-email" name="email" type="email" autocomplete="username" required value="${email}">
    <label for="l-senha">Senha</label>
    <input id="l-senha" name="senha" type="password" autocomplete="current-password" required>
    ${csrfCampo(ctx)}
    <button class="adm-botao" type="submit">Entrar</button>
  </form>
</section>`));
}

async function sairPainel(ctx) {
  if (ctx.metodo === 'POST') {
    await ctx.lerFormulario();
    if (ctx.csrfOk()) {
      const u = await usuarioAtual(ctx);
      if (u) await auditoria(ctx, u.id, 'logout', '');
      sair(ctx);
      ctx.flash('ok', 'Você saiu do painel.');
    }
  }
  throw redirecionar('/admin');
}

/* ------------------------------------------------------------- lista de registros */

/** Monta WHERE e parâmetros a partir dos filtros da lista. */
function filtrosRegistros(u, entrada) {
  const forms = formularios();
  const get = (k) => (typeof entrada[k] === 'string' ? entrada[k] : '');
  const f = {
    formulario: get('formulario') in forms ? get('formulario') : '',
    status: STATUS.includes(get('status')) ? get('status') : '',
    de: /^\d{4}-\d{2}-\d{2}$/.test(get('de')) ? get('de') : '',
    ate: /^\d{4}-\d{2}-\d{2}$/.test(get('ate')) ? get('ate') : '',
    busca: cortar(get('busca').trim(), 100),
    abertos: get('abertos') === '1' ? '1' : '',
  };
  const where = [filtroPerfil(u)];
  const params = [];
  if (f.formulario) {
    where.push('formulario = ?');
    params.push(f.formulario);
  }
  if (f.status) {
    where.push('status = ?');
    params.push(f.status);
  } else if (f.abertos) {
    where.push("status NOT IN ('Concluído', 'Arquivado')");
  }
  if (f.de) {
    where.push('criado_em >= ?');
    params.push(`${f.de} 00:00:00`);
  }
  if (f.ate) {
    where.push('criado_em <= ?');
    params.push(`${f.ate} 23:59:59`);
  }
  if (f.busca !== '') {
    const pg = driver() === 'pgsql';
    const esc = '!';
    const op = pg ? 'ILIKE' : 'LIKE';
    const like = '%' + f.busca.replace(/[!%_]/g, (ch) => esc + ch) + '%';
    const cond = `${op} ? ESCAPE '${esc}'`;
    where.push(`(protocolo ${cond} OR nome ${cond} OR cpf ${cond} OR email ${cond} OR telefone ${cond})`);
    params.push(like, like, like, like, like);
  }
  return [f, where.join(' AND '), params];
}

const queryObj = (ctx) => Object.fromEntries(ctx.query.entries());

async function registros(ctx) {
  const u = await exigirLogin(ctx);
  const qobj = queryObj(ctx);
  const entrada = Object.keys(qobj).length ? qobj : { abertos: '1' };
  const [f, where, params] = filtrosRegistros(u, entrada);
  const porPagina = 50;
  let paginaN = Math.max(1, Number.parseInt(qobj.pagina || '1', 10) || 1);
  const total = Number(await qValor(`SELECT COUNT(*) FROM registros WHERE ${where}`, params));
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  paginaN = Math.min(paginaN, paginas);
  const lista = await qTodos(`SELECT id, protocolo, formulario, tipo, nome, email, telefone, status, criado_em, atualizado_em
            FROM registros WHERE ${where} ORDER BY criado_em DESC, id DESC LIMIT ${porPagina} OFFSET ${(paginaN - 1) * porPagina}`, params);
  const contagem = {};
  for (const r of await qTodos(`SELECT status, COUNT(*) AS n FROM registros WHERE ${filtroPerfil(u)} GROUP BY status`)) contagem[r.status] = Number(r.n);
  const hoje = Number(await qValor(`SELECT COUNT(*) FROM registros WHERE ${filtroPerfil(u)} AND criado_em >= ?`, [`${agora().slice(0, 10)} 00:00:00`]));
  const curtos = { ...CURTOS };
  if (u.perfil !== 'admin') delete curtos.lgpd;
  const qs = (extra) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...f, ...extra })) if (v !== '' && v !== null && v !== undefined) p.set(k, v);
    return '?' + p.toString();
  };

  const tabela = !lista.length ? html`
  <div class="adm-vazio">
    <p>Nenhum registro com esses filtros.</p>
    <a href="/admin/registros?todos=1">Ver todos os registros</a>
  </div>
` : html`
  <div class="adm-tabela-wrap">
    <table class="adm-tabela">
      <thead><tr><th scope="col">Protocolo</th><th scope="col">Recebido</th><th scope="col">Formulário</th><th scope="col">Assunto</th><th scope="col">Solicitante</th><th scope="col">Situação</th></tr></thead>
      <tbody>
      ${lista.map((r) => html`
        <tr>
          <td><a class="adm-protocolo" href="/admin/registro?id=${Number(r.id)}">${r.protocolo}</a></td>
          <td>${dataBr(r.criado_em)}</td>
          <td>${curtos[r.formulario] || CURTOS[r.formulario] || r.formulario}</td>
          <td>${r.tipo}</td>
          <td>${r.nome !== '' ? r.nome : anon('Não identificado')}${r.email || r.telefone ? html`<br><small>${r.email || r.telefone}</small>` : ''}</td>
          <td><span class="adm-status st-${statusClasse(r.status)}">${r.status}</span></td>
        </tr>
      `)}
      </tbody>
    </table>
  </div>
  ${paginas > 1 ? html`
    <nav class="adm-paginas" aria-label="Páginas">
      ${paginaN > 1 ? html`<a href="${qs({ pagina: paginaN - 1 })}">Anterior</a>` : ''}
      ${paginaN < paginas ? html`<a href="${qs({ pagina: paginaN + 1 })}">Próxima</a>` : ''}
    </nav>
  ` : ''}
`;

  return ctx.html(await paginaAdmin(ctx, { u, titulo: 'Registros' }, html`
<div class="adm-cabeca">
  <h1>Registros recebidos pelo site</h1>
  <a class="adm-botao adm-botao-sec" href="/admin/exportar${qs({})}">Exportar CSV (filtro atual)</a>
</div>

<ul class="adm-contadores">
  <li><a href="${qs({ status: 'Novo', abertos: '' })}"><strong>${contagem.Novo || 0}</strong> novos</a></li>
  <li><a href="${qs({ status: 'Em análise', abertos: '' })}"><strong>${contagem['Em análise'] || 0}</strong> em análise</a></li>
  <li><a href="${qs({ status: 'Aguardando cliente', abertos: '' })}"><strong>${contagem['Aguardando cliente'] || 0}</strong> aguardando cliente</a></li>
  <li><a href="${qs({ status: 'Concluído', abertos: '' })}"><strong>${contagem['Concluído'] || 0}</strong> concluídos</a></li>
  <li class="adm-hoje"><strong>${hoje}</strong> recebidos hoje</li>
</ul>

<form class="adm-filtros" method="get" action="/admin/registros">
  <div>
    <label for="fl-busca">Buscar</label>
    <input id="fl-busca" name="busca" type="search" value="${f.busca}" placeholder="Protocolo, nome, CPF, e-mail ou telefone">
  </div>
  <div>
    <label for="fl-form">Formulário</label>
    <select id="fl-form" name="formulario">
      <option value="">Todos</option>
      ${Object.entries(curtos).map(([k, rot]) => html`<option value="${k}"${raw(f.formulario === k ? ' selected' : '')}>${rot}</option>`)}
    </select>
  </div>
  <div>
    <label for="fl-status">Situação</label>
    <select id="fl-status" name="status">
      <option value="">Todas</option>
      ${STATUS.map((s) => html`<option${raw(f.status === s ? ' selected' : '')}>${s}</option>`)}
    </select>
  </div>
  <div>
    <label for="fl-de">De</label>
    <input id="fl-de" name="de" type="date" value="${f.de}">
  </div>
  <div>
    <label for="fl-ate">Até</label>
    <input id="fl-ate" name="ate" type="date" value="${f.ate}">
  </div>
  <label class="adm-check"><input type="checkbox" name="abertos" value="1"${raw(f.abertos ? ' checked' : '')}> Só em aberto</label>
  <div class="adm-filtros-acoes">
    <button class="adm-botao" type="submit">Filtrar</button>
    <a href="/admin/registros?todos=1">Limpar</a>
  </div>
</form>

<p class="adm-total">${total} registro${total === 1 ? '' : 's'}${paginas > 1 ? `, página ${paginaN} de ${paginas}` : ''}</p>
${tabela}`));
}

/* ------------------------------------------------------------- detalhe do registro */

async function registro(ctx) {
  const u = await exigirLogin(ctx);
  const id = Number.parseInt(ctx.query.get('id') || '0', 10) || 0;
  const reg = await qUm(`SELECT * FROM registros WHERE id = ? AND ${filtroPerfil(u)}`, [id]);
  if (!reg) {
    ctx.flash('aviso', 'Registro não encontrado ou sem permissão para o seu perfil.');
    throw redirecionar('/admin/registros');
  }

  if (ctx.metodo === 'POST') {
    await ctx.lerFormulario();
    if (!ctx.csrfOk()) {
      ctx.flash('aviso', 'A página ficou aberta por muito tempo. Faça a alteração de novo.');
      throw redirecionar(`/admin/registro?id=${id}`);
    }
    const acao = ctx.campo('acao');
    if (acao === 'atualizar') {
      const status = STATUS.includes(ctx.campo('status')) ? ctx.campo('status') : reg.status;
      const retorno = cortar(ctx.campo('retorno_publico').trim(), 2000);
      const mudou = [];
      if (status !== reg.status) mudou.push(`Situação: ${reg.status} → ${status}`);
      if (retorno !== String(reg.retorno_publico ?? '')) mudou.push('Mensagem ao cliente atualizada');
      if (mudou.length) {
        await q('UPDATE registros SET status = ?, retorno_publico = ?, atualizado_em = ? WHERE id = ?', [status, retorno, agora(), id]);
        await historico(id, u.id, mudou.join('; '), retorno);
        await auditoria(ctx, u.id, 'registro_atualizado', reg.protocolo);
        if (ctx.campo('avisar') && reg.email !== '') {
          const corpo = [
            reg.nome !== '' ? `Olá, ${reg.nome}.` : 'Olá.',
            '',
            `Seu protocolo ${reg.protocolo} foi atualizado.`,
            `Situação: ${status}`,
            retorno !== '' ? `\nMensagem do cartório:\n${retorno}` : '',
            '',
            `Consulte em ${baseUrl()}/protocolo com o protocolo e o código recebidos.`,
            '',
            cartorio('nome_oficial'),
            `${cartorio('telefone')} – ${cartorio('emails.contato')}`,
          ].join('\n');
          const ok = await enviarEmail(reg.email, `Protocolo ${reg.protocolo} atualizado – ${cartorio('nome_curto')}`, corpo);
          await historico(id, u.id, ok ? 'Cliente avisado por e-mail' : 'Falha ao avisar o cliente', reg.email);
        }
        ctx.flash('ok', 'Registro atualizado.');
      } else {
        ctx.flash('aviso', 'Nada foi alterado.');
      }
    } else if (acao === 'nota') {
      const nota = cortar(ctx.campo('nota').trim(), 4000);
      if (nota !== '') {
        await historico(id, u.id, 'Nota interna', nota);
        await q('UPDATE registros SET atualizado_em = ? WHERE id = ?', [agora(), id]);
        ctx.flash('ok', 'Nota adicionada.');
      } else {
        ctx.flash('aviso', 'Escreva a nota antes de salvar.');
      }
    }
    throw redirecionar(`/admin/registro?id=${id}`);
  }

  await auditoria(ctx, u.id, 'registro_visto', reg.protocolo);
  const def = formularios()[reg.formulario];
  const rotulos = rotulosExtras(reg.formulario);
  let extras = {};
  try {
    extras = JSON.parse(reg.dados_json || '{}') || {};
  } catch {
    extras = {};
  }
  const anexos = await qTodos('SELECT * FROM anexos WHERE registro_id = ?', [id]);
  const hist = await qTodos('SELECT h.*, u.nome AS usuario FROM historico h LEFT JOIN usuarios u ON u.id = h.usuario_id WHERE h.registro_id = ? ORDER BY h.criado_em DESC, h.id DESC', [id]);
  const info = (v) => (v !== '' ? v : anon('Não informado'));

  return ctx.html(await paginaAdmin(ctx, { u, titulo: reg.protocolo }, html`
<p class="adm-voltar"><a href="/admin/registros">Voltar para a lista</a></p>
<div class="adm-cabeca">
  <div>
    <p class="adm-tipo">${def.titulo}</p>
    <h1>${reg.protocolo}</h1>
  </div>
  <span class="adm-status adm-status-grande st-${statusClasse(reg.status)}">${reg.status}</span>
</div>

<div class="adm-detalhe">
  <section class="adm-cartao" aria-labelledby="t-dados">
    <h2 id="t-dados">Dados enviados</h2>
    <dl class="adm-dados">
      <div><dt>Recebido em</dt><dd>${dataBr(reg.criado_em)}</dd></div>
      ${Object.entries(extras).filter(([, v]) => v !== '').map(([k, v]) => html`
        <div><dt>${rotulos[k] || k}</dt><dd>${k === 'data_preferida' ? dataBr(v, false) : v}</dd></div>
      `)}
      <div><dt>Nome</dt><dd>${info(reg.nome)}</dd></div>
      <div><dt>CPF</dt><dd>${info(reg.cpf)}</dd></div>
      <div><dt>E-mail</dt><dd>${reg.email !== '' ? html`<a href="mailto:${reg.email}?subject=${raw(rawurlencode('Protocolo ' + reg.protocolo))}">${reg.email}</a>` : anon('Não informado')}</dd></div>
      <div><dt>Telefone</dt><dd>${info(reg.telefone)}</dd></div>
    </dl>
    <h3>Mensagem</h3>
    <div class="adm-mensagem">${nl2br(reg.mensagem)}</div>
    ${anexos.length ? html`
      <h3>Anexos</h3>
      <ul class="adm-anexos">
        ${anexos.map((a) => html`
          <li><a href="/admin/anexo?id=${Number(a.id)}">${a.nome_original}</a> <small>${Math.round(Number(a.tamanho) / 1024).toLocaleString('pt-BR')} KB</small></li>
        `)}
      </ul>
    ` : ''}
    <p class="adm-tecnico">Código de consulta do cliente: <strong>${reg.codigo_acesso}</strong> · IP ${reg.ip}</p>
  </section>

  <div class="adm-coluna">
    <section class="adm-cartao" aria-labelledby="t-situacao">
      <h2 id="t-situacao">Atualizar</h2>
      <form method="post" class="adm-form">
        <label for="r-status">Situação</label>
        <select id="r-status" name="status">
          ${STATUS.map((s) => html`<option${raw(reg.status === s ? ' selected' : '')}>${s}</option>`)}
        </select>
        <label for="r-retorno">Mensagem ao cliente</label>
        <p class="adm-dica">Aparece na consulta pública do protocolo. Não inclua dados pessoais.</p>
        <textarea id="r-retorno" name="retorno_publico" rows="4" maxlength="2000">${reg.retorno_publico || ''}</textarea>
        ${reg.email !== '' ? raw('<label class="adm-check"><input type="checkbox" name="avisar" value="1"> Avisar o cliente por e-mail</label>') : ''}
        <input type="hidden" name="acao" value="atualizar">
        ${csrfCampo(ctx)}
        <button class="adm-botao" type="submit">Salvar alterações</button>
      </form>
    </section>

    <section class="adm-cartao" aria-labelledby="t-nota">
      <h2 id="t-nota">Nota interna</h2>
      <form method="post" class="adm-form">
        <label for="r-nota" class="sr">Nota interna</label>
        <textarea id="r-nota" name="nota" rows="3" maxlength="4000" placeholder="Visível só para a equipe"></textarea>
        <input type="hidden" name="acao" value="nota">
        ${csrfCampo(ctx)}
        <button class="adm-botao adm-botao-sec" type="submit">Adicionar nota</button>
      </form>
    </section>

    <section class="adm-cartao" aria-labelledby="t-hist">
      <h2 id="t-hist">Histórico</h2>
      <ol class="adm-historico">
        ${hist.map((h) => html`
          <li>
            <p><strong>${h.acao}</strong></p>
            ${h.detalhe !== null && h.detalhe !== '' ? html`<p class="adm-hist-detalhe">${nl2br(h.detalhe)}</p>` : ''}
            <p class="adm-hist-meta">${dataBr(h.criado_em)}${h.usuario ? `, por ${h.usuario}` : ', automático'}</p>
          </li>
        `)}
      </ol>
    </section>
  </div>
</div>`));
}

/* ------------------------------------------------------------- anexo e exportação */

async function anexo(ctx) {
  const u = await exigirLogin(ctx);
  const id = Number.parseInt(ctx.query.get('id') || '0', 10) || 0;
  const a = await qUm(`SELECT a.*, r.protocolo FROM anexos a JOIN registros r ON r.id = a.registro_id WHERE a.id = ? AND ${filtroPerfil(u, 'r.')}`, [id]);
  const pasta = cfg('uploads.path');
  const caminho = a ? path.resolve(pasta, a.arquivo) : null;
  if (!a || a.arquivo.includes('..') || !caminho.startsWith(path.resolve(pasta) + path.sep) || !fs.existsSync(caminho)) {
    return new Resposta(404, 'Anexo não encontrado.', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
  await auditoria(ctx, u.id, 'anexo_baixado', `${a.protocolo} ${a.nome_original}`);
  const dados = fs.readFileSync(caminho);
  const nome = String(a.nome_original);
  return new Resposta(200, dados, {
    'Content-Type': a.mime,
    'Content-Length': String(dados.length),
    'Content-Disposition': `attachment; filename="${nomeAscii(nome)}"; filename*=UTF-8''${rawurlencode(nome)}`,
    'Cache-Control': 'private, no-store',
  });
}

/** Nome do arquivo só com caracteres simples (o nome completo vai em filename*). */
const nomeAscii = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '');

/** Igual ao fputcsv do PHP com ';' como separador. */
function linhaCsv(campos) {
  return campos.map((v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[;"\n\r\t ]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(';') + '\n';
}

async function exportar(ctx) {
  const u = await exigirLogin(ctx);
  const [f, where, params] = filtrosRegistros(u, queryObj(ctx));
  const rows = await qTodos(`SELECT protocolo, formulario, tipo, status, nome, cpf, email, telefone, mensagem, dados_json, retorno_publico, criado_em, atualizado_em
           FROM registros WHERE ${where} ORDER BY criado_em DESC`, params);
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, v);
  await auditoria(ctx, u.id, 'exportacao', p.toString());
  const titulos = Object.fromEntries(Object.entries(formularios()).map(([k, x]) => [k, x.titulo]));
  const seguro = (v) => (/^[=+\-@\t\r]/.test(String(v ?? '')) ? "'" + v : v); // evita fórmulas no Excel
  let csv = '﻿' + linhaCsv(['Protocolo', 'Formulário', 'Assunto', 'Situação', 'Nome', 'CPF', 'E-mail', 'Telefone', 'Mensagem', 'Outros dados', 'Mensagem ao cliente', 'Recebido em', 'Atualizado em']);
  for (const r of rows) {
    let extras = {};
    try {
      extras = JSON.parse(r.dados_json || '{}') || {};
    } catch {
      extras = {};
    }
    const outros = Object.entries(extras).map(([k, v]) => `${k}: ${v}`).join(' | ');
    csv += linhaCsv([
      r.protocolo, titulos[r.formulario] || r.formulario, r.tipo, r.status, r.nome, r.cpf,
      r.email, r.telefone, r.mensagem, outros, r.retorno_publico, dataBr(r.criado_em), dataBr(r.atualizado_em),
    ].map(seguro));
  }
  const carimbo = agora().replace(/[: ]/g, '').replace(/^(\d{4}-\d{2}-\d{2})(\d{6})$/, '$1-$2');
  return new Resposta(200, csv, {
    'Content-Type': 'text/csv; charset=UTF-8',
    'Content-Disposition': `attachment; filename="registros-${carimbo}.csv"`,
    'Cache-Control': 'private, no-store',
  });
}

/* ------------------------------------------------------------- minha senha */

async function senha(ctx) {
  const u = await exigirLogin(ctx);
  let erro = null;
  if (ctx.metodo === 'POST') {
    await ctx.lerFormulario();
    const atual = ctx.campo('atual');
    const nova = ctx.campo('nova');
    const hash = String(await qValor('SELECT senha_hash FROM usuarios WHERE id = ?', [u.id]));
    let fraca = null;
    if (!ctx.csrfOk()) erro = 'A página ficou aberta por muito tempo. Tente de novo.';
    else if (senhaAntiga(hash) || !conferirSenha(atual, hash)) erro = 'A senha atual não confere.';
    else if (nova !== ctx.campo('repetir')) erro = 'A nova senha e a confirmação são diferentes.';
    else if ((fraca = senhaForte(nova))) erro = fraca;
    else {
      const novoHash = hashSenha(nova);
      await q('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [novoHash, u.id]);
      await auditoria(ctx, u.id, 'senha_alterada', '');
      ctx.novaSessao({ uid: u.id, ultimo: Math.floor(Date.now() / 1000), marca: marcaSenha(novoHash) });
      ctx.flash('ok', 'Senha alterada.');
      throw redirecionar('/admin/registros');
    }
  }
  return ctx.html(await paginaAdmin(ctx, { u, titulo: 'Minha senha' }, html`
<section class="adm-login">
  <h1>Alterar minha senha</h1>
  ${erro ? html`<div class="adm-alerta adm-aviso" role="alert">${erro}</div>` : ''}
  <form method="post" class="adm-form">
    <label for="s-atual">Senha atual</label>
    <input id="s-atual" name="atual" type="password" autocomplete="current-password" required>
    <label for="s-nova">Nova senha</label>
    <p class="adm-dica">Pelo menos 10 caracteres, com letras e números.</p>
    <input id="s-nova" name="nova" type="password" autocomplete="new-password" required>
    <label for="s-repetir">Repita a nova senha</label>
    <input id="s-repetir" name="repetir" type="password" autocomplete="new-password" required>
    ${csrfCampo(ctx)}
    <button class="adm-botao" type="submit">Salvar nova senha</button>
  </form>
</section>`));
}

/* ------------------------------------------------------------- usuários */

async function usuarios(ctx) {
  const u = await exigirAdmin(ctx);
  const erros = [];
  let novo = { nome: '', email: '', perfil: 'atendente' };
  if (ctx.metodo === 'POST') {
    await ctx.lerFormulario();
    if (!ctx.csrfOk()) {
      ctx.flash('aviso', 'A página ficou aberta por muito tempo. Tente de novo.');
      throw redirecionar('/admin/usuarios');
    }
    const acao = ctx.campo('acao');
    if (acao === 'criar') {
      novo = {
        nome: cortar(ctx.campo('nome').trim(), 120),
        email: ctx.campo('email').trim().toLowerCase(),
        perfil: ctx.campo('perfil') === 'admin' ? 'admin' : 'atendente',
      };
      const s = ctx.campo('senha');
      if (novo.nome === '') erros.push('Informe o nome.');
      if (!emailValido(novo.email)) erros.push('Informe um e-mail válido.');
      else if (await qValor('SELECT id FROM usuarios WHERE email = ?', [novo.email])) erros.push('Já existe um usuário com esse e-mail.');
      const fraca = senhaForte(s);
      if (fraca) erros.push(fraca);
      if (!erros.length) {
        await q('INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo, criado_em) VALUES (?, ?, ?, ?, 1, ?)',
          [novo.nome, novo.email, hashSenha(s), novo.perfil, agora()]);
        await auditoria(ctx, u.id, 'usuario_criado', novo.email);
        ctx.flash('ok', `Usuário ${novo.email} criado. Passe a senha à pessoa por um canal seguro.`);
        throw redirecionar('/admin/usuarios');
      }
    } else if (acao === 'alternar') {
      const alvo = Number.parseInt(ctx.campo('id') || '0', 10) || 0;
      if (alvo === u.id) {
        ctx.flash('aviso', 'Você não pode desativar o próprio acesso.');
      } else {
        await q('UPDATE usuarios SET ativo = 1 - ativo WHERE id = ?', [alvo]);
        await auditoria(ctx, u.id, 'usuario_alternado', String(alvo));
        ctx.flash('ok', 'Acesso atualizado.');
      }
      throw redirecionar('/admin/usuarios');
    }
  }
  const lista = await qTodos('SELECT id, nome, email, perfil, ativo, ultimo_login FROM usuarios ORDER BY ativo DESC, nome');
  const log = await qTodos('SELECT a.*, u.nome FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id ORDER BY a.criado_em DESC, a.id DESC LIMIT 30');
  return ctx.html(await paginaAdmin(ctx, { u, titulo: 'Usuários' }, html`
<div class="adm-cabeca"><h1>Usuários do painel</h1></div>
<div class="adm-detalhe">
  <section class="adm-cartao">
    <h2>Quem tem acesso</h2>
    <div class="adm-tabela-wrap">
      <table class="adm-tabela">
        <thead><tr><th scope="col">Nome</th><th scope="col">Perfil</th><th scope="col">Último acesso</th><th scope="col">Acesso</th></tr></thead>
        <tbody>
        ${lista.map((x) => html`
          <tr${raw(Number(x.ativo) ? '' : ' class="adm-inativo"')}>
            <td>${x.nome}<br><small>${x.email}</small></td>
            <td>${x.perfil === 'admin' ? 'Administrador' : 'Atendente'}</td>
            <td>${x.ultimo_login ? dataBr(x.ultimo_login) : 'Nunca'}</td>
            <td>
              ${Number(x.id) !== u.id ? html`
                <form method="post">${csrfCampo(ctx)}<input type="hidden" name="acao" value="alternar"><input type="hidden" name="id" value="${Number(x.id)}">
                  <button class="adm-link" type="submit">${Number(x.ativo) ? 'Desativar' : 'Reativar'}</button></form>
              ` : 'Você'}
            </td>
          </tr>
        `)}
        </tbody>
      </table>
    </div>
    <p class="adm-dica">Administrador vê todos os registros e gerencia usuários. Atendente não vê solicitações LGPD nem denúncias da ouvidoria.</p>
  </section>
  <section class="adm-cartao">
    <h2>Adicionar usuário</h2>
    ${erros.length ? html`<div class="adm-alerta adm-aviso" role="alert">${raw(erros.map(e).join('<br>'))}</div>` : ''}
    <form method="post" class="adm-form">
      <label for="u-nome">Nome</label>
      <input id="u-nome" name="nome" required value="${novo.nome}">
      <label for="u-email">E-mail</label>
      <input id="u-email" name="email" type="email" required value="${novo.email}">
      <label for="u-perfil">Perfil</label>
      <select id="u-perfil" name="perfil">
        <option value="atendente"${raw(novo.perfil === 'atendente' ? ' selected' : '')}>Atendente</option>
        <option value="admin"${raw(novo.perfil === 'admin' ? ' selected' : '')}>Administrador</option>
      </select>
      <label for="u-senha">Senha inicial</label>
      <p class="adm-dica">Pelo menos 10 caracteres, com letras e números.</p>
      <input id="u-senha" name="senha" type="password" autocomplete="new-password" required>
      <input type="hidden" name="acao" value="criar">
      ${csrfCampo(ctx)}
      <button class="adm-botao" type="submit">Adicionar usuário</button>
    </form>
  </section>
</div>
<section class="adm-cartao adm-auditoria">
  <h2>Últimas ações registradas</h2>
  <div class="adm-tabela-wrap">
    <table class="adm-tabela">
      <thead><tr><th scope="col">Quando</th><th scope="col">Quem</th><th scope="col">Ação</th><th scope="col">Detalhe</th><th scope="col">IP</th></tr></thead>
      <tbody>
      ${log.map((l) => html`
        <tr><td>${dataBr(l.criado_em)}</td><td>${l.nome || '—'}</td><td>${String(l.acao).replace(/_/g, ' ')}</td><td>${l.alvo}</td><td>${l.ip}</td></tr>
      `)}
      </tbody>
    </table>
  </div>
</section>`));
}

/* ------------------------------------------------------------- transparência (lançamentos) */

function mesPassado() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return { ano: d.getFullYear(), mes: d.getMonth() + 1 };
}

const apagar = (arq) => {
  try {
    fs.unlinkSync(path.join(PASTA, path.basename(arq)));
  } catch {
    /* ignora */
  }
};

async function transparenciaAdmin(ctx) {
  const u = await exigirAdmin(ctx);
  const erros = [];
  const passado = mesPassado();
  let ano = ctx.query.has('ano') ? Number.parseInt(ctx.query.get('ano'), 10) || 0 : passado.ano;
  let mes = ctx.query.has('mes') ? Number.parseInt(ctx.query.get('mes'), 10) || 0 : passado.mes;
  const form = { valores: {}, observacao: '' };

  if (ctx.metodo === 'POST') {
    await ctx.lerFormulario();
    if (ctx.corpoGrande) {
      ctx.flash('aviso', 'O PDF não foi recebido ou passa de 10 MB.');
      throw redirecionar('/admin/transparencia');
    }
    if (!ctx.csrfOk()) {
      ctx.flash('aviso', 'A página ficou aberta por muito tempo. Tente de novo.');
      throw redirecionar('/admin/transparencia');
    }
    ano = Number.parseInt(ctx.campo('ano') || '0', 10) || 0;
    mes = Number.parseInt(ctx.campo('mes') || '0', 10) || 0;
    const acao = ctx.campo('acao') || 'salvar';
    if (ano < 2000 || ano > new Date().getFullYear() + 1 || mes < 1 || mes > 12) erros.push('Escolha um mês e ano válidos.');
    const existente = erros.length ? null : await qUm('SELECT * FROM transparencia WHERE ano = ? AND mes = ?', [ano, mes]);
    const rotuloMes = `${String(mes).padStart(2, '0')}/${ano}`;

    if (acao === 'remover' && existente) {
      if (existente.arquivo) apagar(existente.arquivo);
      await q('DELETE FROM transparencia WHERE id = ?', [existente.id]);
      await auditoria(ctx, u.id, 'transparencia_removida', rotuloMes);
      ctx.flash('ok', `Lançamento de ${mesNome(mes)}/${ano} removido do site.`);
      throw redirecionar('/admin/transparencia');
    }

    const valores = {};
    const brutos = ctx.grupo('v');
    for (const r of RUBRICAS) {
      const bruto = brutos[r.chave] || '';
      form.valores[r.chave] = bruto;
      const v = lerMoeda(bruto);
      if (v !== null && (Number.isNaN(v) || v < 0)) erros.push(`Valor inválido em “${r.rotulo}”. Use o formato 1.234,56.`);
      else if (v !== null) valores[r.chave] = v;
    }
    const obs = cortar(ctx.campo('observacao').trim(), 1000);
    form.observacao = obs;
    if (!Object.keys(valores).length && !erros.length) erros.push('Preencha ao menos um valor.');

    let arquivo = existente ? existente.arquivo : null;
    let arquivoNome = existente ? existente.arquivo_nome : null;
    let novoArquivo = null;
    const pdf = ctx.arquivo('pdf');
    if (!erros.length && pdf && (pdf.size || pdf.name)) {
      const buf = Buffer.from(await pdf.arrayBuffer());
      if (!buf.length || buf.length > 10 * 1024 * 1024) {
        erros.push('O PDF não foi recebido ou passa de 10 MB.');
      } else if (tipoArquivo(buf) !== 'application/pdf') {
        erros.push('O demonstrativo precisa ser um arquivo PDF.');
      } else {
        novoArquivo = `${ano}-${String(mes).padStart(2, '0')}-${crypto.randomBytes(6).toString('hex')}.pdf`;
        try {
          fs.mkdirSync(PASTA, { recursive: true, mode: 0o750 });
          fs.writeFileSync(path.join(PASTA, novoArquivo), buf, { mode: 0o640 });
        } catch (err) {
          registrarErro('Falha ao guardar PDF da transparência', err);
          erros.push('Não foi possível guardar o PDF.');
          novoArquivo = null;
        }
      }
    }
    if (ctx.campo('tirar_pdf') && !novoArquivo && arquivo) {
      apagar(arquivo);
      arquivo = null;
      arquivoNome = null;
    }

    if (!erros.length) {
      if (novoArquivo) {
        if (arquivo) apagar(arquivo);
        arquivo = novoArquivo;
        arquivoNome = cortar(path.basename(String(pdf.name || '').replace(/\\/g, '/')), 150);
      }
      const json = JSON.stringify(valores);
      if (existente) {
        await q('UPDATE transparencia SET valores_json = ?, observacao = ?, arquivo = ?, arquivo_nome = ?, atualizado_por = ?, atualizado_em = ? WHERE id = ?',
          [json, obs, arquivo, arquivoNome, u.id, agora(), existente.id]);
      } else {
        await q('INSERT INTO transparencia (ano, mes, valores_json, observacao, arquivo, arquivo_nome, atualizado_por, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [ano, mes, json, obs, arquivo, arquivoNome, u.id, agora()]);
      }
      await auditoria(ctx, u.id, existente ? 'transparencia_alterada' : 'transparencia_publicada', rotuloMes);
      ctx.flash('ok', `Mês de ${mesNome(mes)}/${ano} publicado na página de Transparência.`);
      throw redirecionar('/admin/transparencia');
    } else if (novoArquivo) {
      apagar(novoArquivo);
    }
  }

  const atual = await qUm('SELECT * FROM transparencia WHERE ano = ? AND mes = ?', [ano, mes]);
  if (atual && ctx.metodo !== 'POST') {
    let v = {};
    try {
      v = JSON.parse(atual.valores_json) || {};
    } catch {
      v = {};
    }
    for (const [k, x] of Object.entries(v)) form.valores[k] = numeroBr(Number(x));
    form.observacao = String(atual.observacao || '');
  }
  const lancados = await qTodos('SELECT t.*, u.nome FROM transparencia t LEFT JOIN usuarios u ON u.id = t.atualizado_por ORDER BY ano DESC, mes DESC LIMIT 36');
  let grupo = null;
  const campos = RUBRICAS.map((r) => {
    const titulo = r.grupo !== grupo ? html`<h3>${r.grupo}</h3>` : '';
    grupo = r.grupo;
    return html`
        ${titulo}
        <label for="v-${r.chave}">${r.rotulo} (R$)</label>
        <input id="v-${r.chave}" name="v[${r.chave}]" inputmode="decimal" placeholder="0,00" value="${form.valores[r.chave] || ''}">
      `;
  });
  const meses = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => html`<option value="${m}"${raw(m === mes ? ' selected' : '')}>${primeiraMaiuscula(mesNome(m))}</option>`);

  return ctx.html(await paginaAdmin(ctx, { u, titulo: 'Transparência' }, html`
<div class="adm-cabeca">
  <div>
    <h1>Transparência</h1>
    <p class="adm-dica">Receitas públicas mensais publicadas em <a href="/transparencia" target="_blank" rel="noopener">/transparencia</a> (Resolução CNJ nº 215/2015, art. 6º, § 3º).</p>
  </div>
</div>
<div class="adm-detalhe">
  <section class="adm-cartao">
    <h2>${atual ? 'Alterar' : 'Lançar'} ${mesNome(mes)}/${ano}</h2>
    <form method="get" class="adm-periodo">
      <label for="t-mes">Mês</label>
      <select id="t-mes" name="mes">${meses}</select>
      <label for="t-ano">Ano</label>
      <input id="t-ano" name="ano" type="number" min="2020" max="${new Date().getFullYear() + 1}" value="${ano}">
      <button class="adm-botao adm-botao-sec" type="submit">Abrir mês</button>
    </form>
    ${erros.length ? html`<div class="adm-alerta adm-aviso" role="alert">${raw(erros.map(e).join('<br>'))}</div>` : ''}
    <form method="post" enctype="multipart/form-data" class="adm-form">
      <input type="hidden" name="ano" value="${ano}">
      <input type="hidden" name="mes" value="${mes}">
      ${campos}
      <label for="t-obs">Observação pública</label>
      <p class="adm-dica">Opcional. Aparece abaixo do mês, por exemplo para explicar uma retificação.</p>
      <textarea id="t-obs" name="observacao" rows="2" maxlength="1000">${form.observacao}</textarea>
      <label for="t-pdf">Demonstrativo em PDF</label>
      <p class="adm-dica">Opcional, até 10 MB. Fica disponível para download no site.${atual && atual.arquivo ? ` Já enviado: ${atual.arquivo_nome}.` : ''}</p>
      <input id="t-pdf" name="pdf" type="file" accept="application/pdf">
      ${atual && atual.arquivo ? raw('<label class="adm-check"><input type="checkbox" name="tirar_pdf" value="1"> Remover o PDF atual</label>') : ''}
      ${csrfCampo(ctx)}
      <button class="adm-botao" type="submit" name="acao" value="salvar">${atual ? 'Salvar alterações' : 'Publicar mês'}</button>
    </form>
    ${atual ? html`
      <form method="post" class="adm-remover" data-confirmar="Remover este mês da página pública?">
        <input type="hidden" name="ano" value="${ano}"><input type="hidden" name="mes" value="${mes}"><input type="hidden" name="acao" value="remover">
        ${csrfCampo(ctx)}<button class="adm-link" type="submit">Remover este mês do site</button>
      </form>
    ` : ''}
  </section>
  <section class="adm-cartao">
    <h2>Meses publicados</h2>
    ${!lancados.length ? html`<p class="adm-dica">Nenhum mês publicado ainda. Lance o primeiro ao lado.</p>` : html`
      <div class="adm-tabela-wrap">
        <table class="adm-tabela">
          <thead><tr><th scope="col">Mês</th><th scope="col">Atualizado</th><th scope="col"></th></tr></thead>
          <tbody>
          ${lancados.map((l) => html`
            <tr>
              <td>${primeiraMaiuscula(mesNome(Number(l.mes)))}/${Number(l.ano)}${l.arquivo ? raw(' <small>com PDF</small>') : ''}</td>
              <td>${dataBr(l.atualizado_em)}${l.nome ? html`<br><small>${l.nome}</small>` : ''}</td>
              <td><a href="/admin/transparencia?ano=${Number(l.ano)}&amp;mes=${Number(l.mes)}">Alterar</a></td>
            </tr>
          `)}
          </tbody>
        </table>
      </div>
    `}
  </section>
</div>`));
}

module.exports = { login, sairPainel, registros, registro, anexo, exportar, senha, usuarios, transparenciaAdmin, filtrosRegistros, linhaCsv };
