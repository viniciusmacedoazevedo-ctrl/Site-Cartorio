'use strict';
/** Páginas com formulário: contato, ouvidoria, pedido, privacidade (LGPD), recibo e consulta de protocolo. */
const { cartorio, SERVICOS, html, raw, e, dataBr, nl2br, registrarErro, cfg, rawurlencode } = require('../lib/base');
const { formularios, validarFormulario, campo, rodapeFormulario, pareceRobo, csrfCampo, feriadosAgendamento, statusClasse } = require('../lib/forms');
const { limiteExcedido, registrarTentativa, processarAnexo, criarRegistro, notificarRegistro, consultarProtocolo } = require('../lib/registros');
const { redirecionar } = require('../lib/http');
const { pagina } = require('../views/layout');
const fs = require('node:fs');
const path = require('node:path');

const c = cartorio;

/**
 * Processa o POST de um formulário público. Em caso de sucesso redireciona
 * para /enviado; senão devolve [valores, erros, mensagem geral].
 */
async function processarEnvio(ctx, chave) {
  if (ctx.metodo !== 'POST') {
    ctx.csrfToken(); // abre a sessão para o formulário
    return [{}, {}, null];
  }
  await ctx.lerFormulario();
  if (ctx.corpoGrande) {
    return [{}, {}, 'O arquivo passa de 5 MB. Envie um arquivo menor.'];
  }
  const valores = ctx.valores();
  if (!ctx.csrfOk()) return [valores, {}, 'A página ficou aberta por muito tempo. Confira os dados e envie de novo.'];
  if (pareceRobo(valores)) return [valores, {}, 'Não foi possível confirmar o envio. Aguarde alguns segundos e envie de novo.'];
  if (await limiteExcedido(ctx, 'form')) {
    return [valores, {}, `Muitos envios em pouco tempo a partir desta conexão. Aguarde 15 minutos ou ligue para ${c('telefone')}.`];
  }
  const [dados, erros] = validarFormulario(chave, valores);
  let anexo = null;
  const arquivo = ctx.arquivo('anexo');
  if (formularios()[chave].campos.anexo && arquivo && (arquivo.size || arquivo.name)) {
    if (!Object.keys(erros).length) {
      const [info, erroAnexo] = await processarAnexo(arquivo);
      if (erroAnexo) erros.anexo = erroAnexo;
      else anexo = info;
    } else {
      erros.anexo = 'Por segurança, selecione o arquivo de novo antes de enviar.';
    }
  }
  const n = Object.keys(erros).length;
  if (n) {
    if (anexo) apagarAnexo(anexo);
    return [valores, erros, n === 1 ? 'Corrija o campo indicado para enviar.' : `Corrija os ${n} campos indicados para enviar.`];
  }
  await registrarTentativa(ctx, 'form');
  let reg;
  try {
    reg = await criarRegistro(ctx, chave, dados, anexo);
  } catch (err) {
    registrarErro('Erro ao gravar registro', err);
    if (anexo) apagarAnexo(anexo);
    return [valores, {}, `O envio não foi concluído por um erro no sistema. Tente de novo em alguns minutos ou ligue para ${c('telefone')}.`];
  }
  await notificarRegistro(reg, anexo);
  const csrf = ctx.sessao.csrf;
  ctx.novaSessao({ csrf });
  ctx.flash('enviado', { protocolo: reg.protocolo, codigo: reg.codigo_acesso, titulo: formularios()[chave].titulo, email: reg.email });
  throw redirecionar('/enviado#conteudo');
}

function apagarAnexo(anexo) {
  try {
    fs.unlinkSync(path.join(cfg('uploads.path'), anexo.arquivo));
  } catch {
    /* já não existe */
  }
}

const avisoGeral = (msg) => (msg ? html`<div class="alerta alerta-erro" role="alert" tabindex="-1" data-foco>${msg}</div>` : '');

async function contato(ctx) {
  const [valores, erros, msg] = await processarEnvio(ctx, 'contato');
  const em = c('emails');
  const f = (n) => campo(ctx, 'contato', n, valores, erros);
  return ctx.html(pagina(ctx, { titulo: 'Contato', descricao: 'Endereço, telefones, horário e e-mails do Cartório de São José do Campestre/RN.' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura form-layout">
    <div class="pagina-cabeca">
      <h1>Contato</h1>
      <p class="lead">Atendimento presencial ${c('horario').toLowerCase()}.</p>
      <dl class="contatos">
        <div><dt>Endereço</dt><dd>${c('endereco')}, ${c('cidade')}, CEP ${c('cep')}<br><a href="${c('mapa_url')}" rel="noopener" target="_blank">Abrir no mapa</a></dd></div>
        <div><dt>Telefone</dt><dd><a href="tel:${c('telefone_link')}">${c('telefone')}</a></dd></div>
        <div><dt>WhatsApp</dt><dd><a href="https://wa.me/${c('whatsapp_link')}">${c('whatsapp')}</a></dd></div>
        <div><dt>Atendimento geral</dt><dd><a href="mailto:${em.contato}">${em.contato}</a></dd></div>
        <div><dt>${c('titular_cargo')}</dt><dd>${c('titular')}<br><a href="mailto:${em.notaria}">${em.notaria}</a></dd></div>
        <div><dt>Ouvidoria</dt><dd><a href="mailto:${em.ouvidoria}">${em.ouvidoria}</a></dd></div>
        <div><dt>Direitos dos titulares (LGPD)</dt><dd><a href="mailto:${em.lgpd}">${em.lgpd}</a></dd></div>
      </dl>
    </div>
    <form class="formulario" method="post" action="/contato" novalidate>
      <h2 class="formulario-titulo">Envie uma mensagem</h2>
      ${avisoGeral(msg)}
      <div class="linha-2">
        ${f('nome')}
        ${f('telefone')}
      </div>
      ${f('email')}
      ${f('assunto')}
      ${f('mensagem')}
      ${rodapeFormulario(ctx, 'contato', erros, 'Enviar mensagem')}
    </form>
  </div>
</main>`));
}

async function ouvidoria(ctx) {
  const [valores, erros, msg] = await processarEnvio(ctx, 'ouvidoria');
  const f = (n) => campo(ctx, 'ouvidoria', n, valores, erros);
  return ctx.html(pagina(ctx, { titulo: 'Ouvidoria', descricao: 'Ouvidoria do Cartório de São José do Campestre: denúncias, reclamações, sugestões e elogios, com ou sem identificação.' }, html`
<main id="conteudo" class="pagina pagina-ouvidoria">
  <div class="largura form-layout">
    <div class="pagina-cabeca">
      <h1>Ouvidoria</h1>
      <p class="lead">Canal para denúncias, reclamações, sugestões e elogios sobre o atendimento do cartório.</p>
      <ul class="lembretes">
        <li>Nome, e-mail e telefone são opcionais: você pode se manifestar sem se identificar.</li>
        <li>Sem e-mail, o protocolo aparece apenas na tela. Anote-o para consultar depois.</li>
        <li>Denúncias de fraude ou de conduta antiética também podem ir para <a href="mailto:${c('emails.compliance')}">${c('emails.compliance')}</a>.</li>
      </ul>
      <figure class="ouvidoria-ilustracao" aria-hidden="true">
        <svg viewBox="0 0 360 240" focusable="false">
          <circle cx="180" cy="124" r="108" fill="#E2EEEB"/>
          <rect x="62" y="44" width="176" height="112" rx="18" fill="#0B5D59"/>
          <path d="M98 156 L92 188 L130 156 Z" fill="#0B5D59"/>
          <rect x="88" y="72" width="124" height="10" rx="5" fill="#E2EEEB"/>
          <rect x="88" y="96" width="98" height="10" rx="5" fill="#E2EEEB" opacity=".75"/>
          <rect x="88" y="120" width="112" height="10" rx="5" fill="#E2EEEB" opacity=".55"/>
          <rect x="196" y="122" width="118" height="78" rx="16" fill="#F3DE9C" stroke="#D6B04A" stroke-width="2"/>
          <path d="M284 200 L298 222 L262 200 Z" fill="#F3DE9C" stroke="#D6B04A" stroke-width="2" stroke-linejoin="round"/>
          <path d="M282 199 L264 199" stroke="#F3DE9C" stroke-width="4"/>
          <path d="M229 162 l14 13 l30 -30" fill="none" stroke="#08403D" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
          <g fill="#D6B04A"><circle cx="300" cy="58" r="5"/><circle cx="324" cy="84" r="3.5"/><circle cx="46" cy="186" r="4"/></g>
        </svg>
        <figcaption>Sua manifestação recebe protocolo e resposta do cartório.</figcaption>
      </figure>
    </div>
    <form class="formulario" method="post" action="/ouvidoria" enctype="multipart/form-data" novalidate>
      ${avisoGeral(msg)}
      ${f('tipo')}
      ${f('nome')}
      <div class="linha-2">
        ${f('email')}
        ${f('telefone')}
      </div>
      ${f('mensagem')}
      ${f('anexo')}
      ${rodapeFormulario(ctx, 'ouvidoria', erros, 'Enviar manifestação')}
    </form>
  </div>
</main>`));
}

async function pedido(ctx) {
  const [valores, erros, msg] = await processarEnvio(ctx, 'pedido');
  const mapaDocs = {};
  for (const g of SERVICOS) for (const s of g.itens) mapaDocs[s.slug] = { nome: s.nome, docs: s.docs };
  const f = (n, v = valores) => campo(ctx, 'pedido', n, v, erros);
  return ctx.html(pagina(ctx, { titulo: 'Solicitação e agendamento online', descricao: 'Peça um serviço ou agende atendimento no Cartório de São José do Campestre e receba o protocolo por e-mail.' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura form-layout">
    <div class="pagina-cabeca">
      <h1>Solicitação e agendamento online</h1>
      <p class="lead">Opção para adiantar seu atendimento: conte o que precisa ou sugira uma data. O ato é praticado no cartório, com os documentos obrigatórios de cada serviço.</p>
      <ul class="lembretes">
        <li>Veja antes os documentos de cada serviço na <a href="/servicos">Carta de Serviços</a>.</li>
        <li>Os valores seguem a <a href="${c('tabela_custas.arquivo')}" download>tabela de custas 2026</a>.</li>
        <li>O agendamento é confirmado pelo cartório por e-mail ou telefone.</li>
        <li>Campos sem a marca “opcional” são obrigatórios.</li>
      </ul>
    </div>
    <form class="formulario" method="post" action="/pedido" enctype="multipart/form-data" novalidate>
      ${avisoGeral(msg)}
      ${f('servico')}
      <aside class="docs-servico" id="docs-servico" aria-live="polite" hidden data-docs="${JSON.stringify(mapaDocs)}"><h3>Documentos obrigatórios</h3><ul></ul></aside>
      ${f('modalidade', { modalidade: 'Pedido online', ...valores })}
      <div class="agendamento" data-agendamento data-feriados="${JSON.stringify(feriadosAgendamento())}">
        ${f('data_preferida')}
        ${f('periodo')}
      </div>
      ${f('nome')}
      ${f('cpf')}
      <div class="linha-2">
        ${f('email')}
        ${f('telefone')}
      </div>
      ${f('mensagem')}
      ${f('anexo')}
      ${rodapeFormulario(ctx, 'pedido', erros, 'Enviar pedido')}
    </form>
  </div>
</main>`));
}

async function privacidade(ctx) {
  const { textoAviso, textoDireitos } = require('../views/layout');
  const [valores, erros, msg] = await processarEnvio(ctx, 'lgpd');
  const f = (n) => campo(ctx, 'lgpd', n, valores, erros);
  return ctx.html(pagina(ctx, { titulo: 'Privacidade e proteção de dados', descricao: 'Aviso de privacidade, direitos dos titulares e formulário de solicitação LGPD do Cartório de São José do Campestre.' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Privacidade e proteção de dados</h1>
      <p class="lead">Como tratamos seus dados pessoais e como você pode exercer seus direitos pela LGPD.</p>
    </div>
    <div class="legal-layout">
      <nav class="indice indice-vertical" aria-label="Nesta página">
        <a href="#aviso">Aviso de privacidade</a>
        <a href="#direitos">Direitos dos titulares</a>
        <a href="#solicitar">Fazer uma solicitação</a>
        <a href="/cookies">Política de cookies</a>
      </nav>
      <div class="legal-corpo">
        <section id="aviso" class="texto-legal" aria-labelledby="t-aviso">
          <h2 id="t-aviso">Aviso de privacidade e tratamento de dados pessoais</h2>
          ${textoAviso()}
        </section>
        <section id="direitos" class="texto-legal" aria-labelledby="t-direitos">
          <h2 id="t-direitos">Direitos dos titulares</h2>
          ${textoDireitos()}
        </section>
        <section id="solicitar" aria-labelledby="t-solicitar">
          <h2 id="t-solicitar">Fazer uma solicitação</h2>
          <p>A solicitação é gratuita, recebe protocolo e vai para o canal de privacidade e para o Encarregado (DPO). Pedimos o CPF para confirmar que os dados são seus.</p>
          <form class="formulario" method="post" action="/privacidade#solicitar" novalidate>
            ${avisoGeral(msg)}
            ${f('direito')}
            <div class="linha-2">
              ${f('nome')}
              ${f('cpf')}
            </div>
            <div class="linha-2">
              ${f('email')}
              ${f('telefone')}
            </div>
            ${f('mensagem')}
            ${rodapeFormulario(ctx, 'lgpd', erros, 'Enviar solicitação')}
          </form>
        </section>
      </div>
    </div>
  </div>
</main>`));
}

function enviado(ctx) {
  const info = ctx.flash('enviado');
  if (!info) throw redirecionar('/');
  return ctx.html(pagina(ctx, { titulo: 'Envio recebido' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <section class="recibo" aria-labelledby="t-recibo" tabindex="-1" data-foco>
      <p class="recibo-tipo">${info.titulo}</p>
      <h1 id="t-recibo">Recebemos seu envio</h1>
      <div class="recibo-dados">
        <div><span>Protocolo</span><strong>${info.protocolo}</strong></div>
        <div><span>Código de consulta</span><strong>${info.codigo}</strong></div>
      </div>
      ${info.email
    ? html`<p>Enviamos o protocolo e o código para <strong>${info.email}</strong>. Se não encontrar o e-mail, confira a caixa de spam.</p>`
    : html`<p><strong>Anote o protocolo e o código agora.</strong> Como nenhum e-mail foi informado, eles só aparecem nesta tela.</p>`}
      <div class="acoes">
        <a class="botao botao-primario" href="/protocolo?p=${rawurlencode(info.protocolo)}">Consultar este protocolo</a>
        <button class="botao botao-secundario" type="button" data-imprimir>Imprimir comprovante</button>
        <a class="botao botao-texto" href="/">Voltar ao início</a>
      </div>
    </section>
  </div>
</main>`));
}

async function protocolo(ctx) {
  let resultado = null;
  let erro = null;
  let codigo = '';
  let prot;
  if (ctx.metodo === 'POST') {
    await ctx.lerFormulario();
    prot = ctx.campo('protocolo').trim().toUpperCase();
    codigo = ctx.campo('codigo').trim().toUpperCase();
    if (!ctx.csrfOk()) {
      erro = 'A página ficou aberta por muito tempo. Digite os dados e consulte de novo.';
    } else if (await limiteExcedido(ctx, 'consulta')) {
      erro = 'Muitas consultas em pouco tempo a partir desta conexão. Aguarde 15 minutos e tente de novo.';
    } else {
      resultado = await consultarProtocolo(prot, codigo);
      if (!resultado) {
        await registrarTentativa(ctx, 'consulta');
        erro = 'Não encontramos um pedido com esse protocolo e código. Confira se digitou como no e-mail recebido (por exemplo, PED-2026-000123 e código ABCD).';
      }
    }
  } else {
    prot = String(ctx.query.get('p') || '').trim().toUpperCase();
    ctx.csrfToken();
  }
  const titulos = Object.fromEntries(Object.entries(formularios()).map(([k, f]) => [k, f.titulo]));
  const res = resultado ? html`
        <section class="resultado" aria-labelledby="t-res" tabindex="-1" data-foco>
          <h2 id="t-res">Protocolo ${resultado.protocolo}</h2>
          <p class="resultado-status status-${statusClasse(resultado.status)}">${resultado.status}</p>
          <dl>
            <div><dt>Tipo</dt><dd>${titulos[resultado.formulario] || ''}${resultado.tipo && resultado.formulario !== 'ouvidoria' ? ': ' + resultado.tipo : ''}</dd></div>
            <div><dt>Recebido em</dt><dd>${dataBr(resultado.criado_em)}</dd></div>
            <div><dt>Última atualização</dt><dd>${dataBr(resultado.atualizado_em)}</dd></div>
          </dl>
          ${String(resultado.retorno_publico || '').trim() !== '' ? html`
            <div class="retorno">
              <h3>Mensagem do cartório</h3>
              <p>${nl2br(resultado.retorno_publico)}</p>
            </div>
          ` : ''}
        </section>
      ` : '';
  return ctx.html(pagina(ctx, { titulo: 'Consultar protocolo', descricao: 'Acompanhe seu pedido, manifestação ou solicitação no Cartório de São José do Campestre.' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura form-layout">
    <div class="pagina-cabeca">
      <h1>Consultar protocolo</h1>
      <p class="lead">Informe o protocolo e o código de 4 letras que você recebeu ao enviar o pedido.</p>
      <ul class="lembretes">
        <li>Os dois estão no e-mail de confirmação e na tela exibida após o envio.</li>
        <li>Por segurança, a consulta mostra só a situação do pedido, sem dados pessoais.</li>
      </ul>
    </div>
    <div>
      <form class="formulario" method="post" action="/protocolo" novalidate>
        ${erro ? html`<div class="alerta alerta-erro" role="alert" tabindex="-1" data-foco>${erro}</div>` : ''}
        <div class="linha-2 linha-protocolo">
          <div class="campo">
            <label for="c-protocolo">Protocolo</label>
            <input id="c-protocolo" name="protocolo" type="text" required autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="PED-2026-000123" value="${prot}" maxlength="20">
          </div>
          <div class="campo">
            <label for="c-codigo">Código</label>
            <input id="c-codigo" name="codigo" type="text" required autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD" value="${codigo}" maxlength="4">
          </div>
        </div>
        ${csrfCampo(ctx)}
        <button class="botao botao-primario" type="submit">Consultar</button>
      </form>
${res}
    </div>
  </div>
</main>`));
}

module.exports = { contato, ouvidoria, pedido, privacidade, enviado, protocolo, processarEnvio, raw, e };
