'use strict';
/** Cabeçalho, rodapé e trechos repetidos do site e do painel. */
const { cartorio, html, raw, e, md5, rawurlencode } = require('../lib/base');
const { csrfCampo } = require('../lib/forms');

const MENU = [
  ['/', 'Início'],
  ['/serventia', 'A serventia'],
  ['/servicos', 'Serviços'],
  ['/emolumentos', 'Emolumentos'],
  ['/transparencia', 'Transparência'],
  ['/ouvidoria', 'Ouvidoria'],
  ['/contato', 'Contato'],
];

const DESCRICAO_PADRAO = 'Cartório de São José do Campestre/RN: notas, protesto, registro civil, imóveis, títulos e documentos e certificado digital. Carta de serviços, emolumentos, transparência e ouvidoria.';

function cabecalho(ctx, { titulo = '', descricao = null } = {}) {
  const desc = descricao || DESCRICAO_PADRAO;
  const paginaTitulo = (titulo ? `${titulo} – ` : '') + cartorio('nome_curto');
  const menu = MENU.map(([href, rot]) => html`<li><a href="${raw(href)}"${raw(ctx.caminho === href ? ' aria-current="page"' : '')}>${rot}</a></li>`);
  const trilha = titulo !== '' ? html`
<nav class="trilha" aria-label="Você está em">
  <ol class="largura">
    <li><a href="/">Início</a></li>
    <li aria-current="page">${titulo}</li>
  </ol>
</nav>
` : '';
  return html`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${paginaTitulo}</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#0B5D59">
<link rel="icon" type="image/png" href="/assets/img/brasao.png">
<link rel="preload" href="/assets/fonts/atkinson-hyperlegible-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/bitter-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fontes.css?v=2">
<link rel="stylesheet" href="/assets/css/site.css?v=9">
<script src="/assets/js/js.js"></script>
<meta property="og:title" content="${paginaTitulo}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
</head>
<body>
<header class="topo">
  <div class="topo-faixa">
    <div class="largura topo-faixa-in">
      <ul class="atalhos" aria-label="Atalhos de teclado">
        <li><a href="#conteudo" accesskey="1">Ir para o conteúdo <span>1</span></a></li>
        <li><a href="#menu-principal" accesskey="2">Ir para o menu <span>2</span></a></li>
        <li><a href="#rodape" accesskey="4">Ir para o rodapé <span>4</span></a></li>
      </ul>
      <ul class="utilidades">
        <li><a href="/protocolo">Consultar protocolo</a></li>
        <li><a href="/validacao">Validar selo</a></li>
        <li><a href="/acessibilidade">Acessibilidade</a></li>
        <li><button type="button" data-contraste aria-pressed="false">Alto contraste</button></li>
        <li class="fonte"><button type="button" data-fonte="-1" aria-label="Diminuir letra">A−</button><button type="button" data-fonte="1" aria-label="Aumentar letra">A+</button></li>
      </ul>
    </div>
  </div>
  <div class="largura topo-in">
    <a class="marca" href="/" aria-label="${cartorio('nome_curto')} – página inicial">
      <img src="/assets/img/brasao.png" alt="" width="46" height="48">
      <span class="marca-texto">
        <span class="marca-nome">Cartório de São José do Campestre</span>
        <span class="marca-sub">Serviço Notarial e Registral</span>
      </span>
    </a>
    <button class="menu-botao" type="button" aria-expanded="false" aria-controls="menu-principal">Menu</button>
    <nav id="menu-principal" class="menu" aria-label="Principal" tabindex="-1">
      <ul>
        ${menu}
      </ul>
    </nav>
  </div>
</header>
${trilha}`;
}

function textoAviso() {
  const c = cartorio;
  return html`<p>Este Aviso de Privacidade explica como o ${c('nome_oficial')} coleta, usa, guarda e protege os dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), as normas da Autoridade Nacional de Proteção de Dados (ANPD) e as diretrizes do Conselho Nacional de Justiça, em especial a Resolução CNJ nº 363/2021 e o Provimento CNJ nº 134/2022. O uso do site também segue os <a href="/termos">Termos de uso</a>.</p>

<h3>1. Quem é o controlador dos dados</h3>
<p>A titular da delegação atua como controladora dos dados pessoais tratados nesta serventia.</p>
<ul>
  <li><strong>Controladora:</strong> ${c('titular')}, ${c('titular_cargo')}</li>
  <li><strong>Endereço:</strong> ${c('endereco')}, ${c('cidade')}, CEP ${c('cep')}</li>
  <li><strong>CNPJ:</strong> ${c('cnpj')}</li>
</ul>

<h3>2. Base legal e finalidade</h3>
<p>Os cartórios prestam um serviço público delegado. Por isso, quase todo o tratamento de dados feito aqui se baseia no cumprimento de obrigação legal ou regulatória (art. 7º, II, e art. 23 da LGPD).</p>
<ul>
  <li><strong>Atos notariais e de registro:</strong> praticar os atos previstos em lei, como escrituras, procurações, registros de imóveis, nascimento, casamento, óbito, protestos e autenticações, garantindo publicidade, autenticidade, segurança e eficácia.</li>
  <li><strong>Atendimento pelo site:</strong> os dados enviados nos formulários servem apenas para atender a solicitação feita, responder ao usuário e manter o registro do atendimento.</li>
</ul>

<h3>3. Quais dados coletamos</h3>
<ul>
  <li><strong>Para a prática de atos:</strong> os dados de qualificação exigidos pela legislação, como nome completo, CPF, RG, estado civil, profissão, endereço e e-mail.</li>
  <li><strong>Nos formulários do site:</strong> nome, CPF (quando necessário), e-mail, telefone, a mensagem e eventuais arquivos enviados voluntariamente. Na Ouvidoria a identificação é opcional.</li>
  <li><strong>Dados técnicos:</strong> endereço IP, data e hora do envio e tipo de navegador, guardados para a segurança do site e para prevenir fraudes.</li>
  <li><strong>Cookies:</strong> apenas os essenciais ao funcionamento seguro do site. Detalhes na <a href="/cookies">Política de Cookies</a>.</li>
</ul>

<h3>4. Compartilhamento</h3>
<p>Como prestador de serviço público, o cartório compartilha os dados dos atos notariais e de registro com os órgãos e centrais definidos em lei, como:</p>
<ul>
  <li>Conselho Nacional de Justiça (CNJ) e Corregedoria Geral de Justiça do RN;</li>
  <li>centrais nacionais de serviços compartilhados, como CENSEC, ONR, CRC Nacional e CENPROT;</li>
  <li>órgãos fiscais e tributários, como a Receita Federal.</li>
</ul>
<p>O cartório <strong>não vende</strong> dados pessoais em nenhuma hipótese. Os dados dos formulários do site não são compartilhados com terceiros, salvo por obrigação legal.</p>

<h3>5. Seus direitos como titular</h3>
<p>Você pode exercer todos os direitos do art. 18 da LGPD, descritos em <a href="/privacidade#direitos" data-dialogo="direitos-titulares">Direitos dos titulares</a>. Os dados inseridos em livros oficiais de registro seguem normas próprias da Corregedoria e não podem ser livremente alterados ou excluídos fora das hipóteses legais.</p>

<h3>6. Encarregado pelo tratamento de dados (DPO)</h3>
<ul>
  <li><strong>Encarregado:</strong> ${c('dpo_nome')} – <a href="mailto:${c('dpo_email')}">${c('dpo_email')}</a></li>
  <li><strong>Canal para solicitações dos titulares:</strong> <a href="mailto:${c('emails.lgpd')}">${c('emails.lgpd')}</a> ou o <a href="/privacidade#solicitar">formulário desta página</a></li>
</ul>

<h3>7. Por quanto tempo guardamos</h3>
<p>Os dados dos atos notariais e de registro são guardados pelos prazos fixados em lei e pelas normas da Corregedoria. Os dados recebidos pelos formulários do site são guardados por até 5 anos após a conclusão do atendimento e depois eliminados, salvo obrigação legal de guarda.</p>

<h3>8. Segurança</h3>
<p>Adotamos medidas técnicas e organizacionais para proteger os dados pessoais contra acessos não autorizados, vazamentos e destruição acidental, em conformidade com o Provimento CNJ nº 213/2026, que define os padrões de tecnologia e segurança da informação dos cartórios. O site usa conexão criptografada (HTTPS), e o acesso ao painel interno é restrito e registrado.</p>

<p class="atualizado">Última atualização: ${c('politicas_atualizadas_em')}.</p>
`;
}

function textoDireitos() {
  const c = cartorio;
  return html`<p>O ${c('nome_oficial')} oferece aos titulares de dados um meio fácil e gratuito para exercer os direitos previstos no art. 18 da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
<p>São direitos dos titulares:</p>
<ol class="lista-romana">
  <li><strong>Confirmação e acesso:</strong> solicitar a confirmação de que existe tratamento e acessar seus dados pessoais, com informações claras sobre a origem dos dados, a inexistência de registro, os critérios usados e a finalidade do tratamento.</li>
  <li><strong>Correção:</strong> pedir a correção de dados incompletos, inexatos ou desatualizados.</li>
  <li><strong>Anonimização, bloqueio ou eliminação:</strong> pedir a desvinculação dos seus dados, a suspensão temporária de qualquer operação de tratamento ou a exclusão de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.</li>
  <li><strong>Portabilidade:</strong> solicitar a transferência dos seus dados pessoais a outro fornecedor de serviço ou produto.</li>
  <li><strong>Eliminação:</strong> pedir a eliminação dos dados pessoais tratados com o seu consentimento.</li>
  <li><strong>Compartilhamento:</strong> receber informações sobre as entidades públicas e privadas com as quais seus dados são compartilhados.</li>
  <li><strong>Explicação:</strong> obter informação sobre a possibilidade de não fornecer o seu consentimento e sobre as consequências dessa escolha.</li>
  <li><strong>Revogação do consentimento:</strong> revogar, por procedimento gratuito e facilitado, o consentimento dado para o tratamento dos seus dados.</li>
</ol>
<p>O titular pode ainda se opor ao tratamento feito em descumprimento à LGPD e pedir informações claras sobre os critérios e procedimentos usados em decisões tomadas apenas com base em tratamento automatizado que afetem seus interesses, como decisões que definam seu perfil pessoal, profissional, de consumo ou de crédito. Também pode peticionar à Autoridade Nacional de Proteção de Dados (ANPD).</p>
<p>Os dados lançados nos livros oficiais de registro seguem normas próprias da Corregedoria e só podem ser alterados ou cancelados nas hipóteses previstas em lei.</p>
<p>Para fazer sua solicitação, use o <a href="/privacidade#solicitar">formulário de direitos do titular</a> ou escreva para <a href="mailto:${c('emails.lgpd')}">${c('emails.lgpd')}</a>. Toda solicitação recebe um número de protocolo e é tratada conforme o Protocolo de Resposta a Solicitações de Direitos dos Titulares da serventia.</p>
`;
}

function rodape() {
  const c = cartorio;
  const em = c('emails');
  return html`<footer class="rodape" id="rodape" tabindex="-1">
  <div class="largura rodape-grade">
    <section class="rodape-bloco rodape-id" aria-label="Identificação da serventia">
      <img src="/assets/img/brasao.png" alt="" width="40" height="42">
      <p class="rodape-nome">${c('nome_oficial')}</p>
      <p>${c('titular_cargo')}: ${c('titular')}</p>
      <p>CNS ${c('cns')}<br>CNPJ ${c('cnpj')}</p>
      <p>${c('endereco')}<br>${c('cidade')}, CEP ${c('cep')}</p>
      <p>${c('horario')}</p>
    </section>
    <section class="rodape-bloco" aria-labelledby="rod-contato">
      <h2 id="rod-contato">Atendimento</h2>
      <p>Telefone <a href="tel:${c('telefone_link')}">${c('telefone')}</a><br>WhatsApp <a href="https://wa.me/${c('whatsapp_link')}">${c('whatsapp')}</a></p>
      <p><a href="mailto:${em.contato}">${em.contato}</a></p>
      <p class="rodape-pessoa">${c('titular_cargo')}<br><strong>${c('titular')}</strong><br><a href="mailto:${em.notaria}">${em.notaria}</a></p>
      <h2 id="rod-dados">Proteção de dados</h2>
      <p class="rodape-pessoa">Encarregado (DPO)<br><strong>${c('dpo_nome')}</strong><br><a href="mailto:${c('dpo_email')}">${c('dpo_email')}</a></p>
      <p class="rodape-pessoa">Direitos dos titulares<br><a href="mailto:${em.lgpd}">${em.lgpd}</a></p>
      <p class="rodape-pessoa">Ética e denúncia de fraudes<br><a href="mailto:${em.compliance}">${em.compliance}</a><br>${c('etica_telefone')}</p>
    </section>
    <nav class="rodape-bloco" aria-labelledby="rod-transp">
      <h2 id="rod-transp">Transparência</h2>
      <ul>
        <li><a href="/transparencia">Receitas e repasses mensais</a></li>
        <li><a href="/emolumentos">Emolumentos e gratuidades</a></li>
        <li><a href="${c('tabela_custas.arquivo')}" download>Tabela de custas 2026 (PDF)</a></li>
        <li><a href="/serventia">A serventia</a></li>
        <li><a href="/conformidade">Conformidade com o CNJ</a></li>
        <li><a href="/validacao">Validar selo</a></li>
        <li><a href="/validacao#centrais">Centrais nacionais</a></li>
      </ul>
    </nav>
    <nav class="rodape-bloco" aria-labelledby="rod-online">
      <h2 id="rod-online">Atendimento online</h2>
      <ul>
        <li><a href="/pedido">Solicitação e agendamento</a></li>
        <li><a href="/protocolo">Consultar protocolo</a></li>
        <li><a href="/ouvidoria">Ouvidoria</a></li>
        <li><a href="/contato">Contato</a></li>
      </ul>
      <h2 id="rod-politicas">Políticas</h2>
      <ul>
        <li><a href="/privacidade#aviso" data-dialogo="aviso-privacidade">Aviso de privacidade</a></li>
        <li><a href="/privacidade#direitos" data-dialogo="direitos-titulares">Direitos dos titulares</a></li>
        <li><a href="/termos">Termos de uso</a></li>
        <li><a href="/cookies">Política de cookies</a></li>
        <li><a href="/acessibilidade">Acessibilidade</a></li>
      </ul>
    </nav>
  </div>
  <div class="largura rodape-fim">
    <p>© ${new Date().getFullYear()} ${c('nome_oficial')}. Serviço público delegado, fiscalizado pelo Poder Judiciário do Rio Grande do Norte.</p>
  </div>
</footer>

<a class="whatsapp" href="https://wa.me/${c('whatsapp_link')}?text=${raw(rawurlencode('Olá! Vim pelo site do cartório.'))}" aria-label="Conversar pelo WhatsApp ${c('whatsapp')}">
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.8 11.8 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
  <span>WhatsApp</span>
</a>

<dialog class="dialogo" id="aviso-privacidade" aria-labelledby="dlg-aviso-titulo">
  <div class="dialogo-topo">
    <h2 id="dlg-aviso-titulo">Aviso de privacidade e tratamento de dados pessoais</h2>
    <button type="button" class="dialogo-fechar" data-fechar>Fechar</button>
  </div>
  <div class="dialogo-corpo texto-legal">${textoAviso()}</div>
</dialog>

<dialog class="dialogo" id="direitos-titulares" aria-labelledby="dlg-direitos-titulo">
  <div class="dialogo-topo">
    <h2 id="dlg-direitos-titulo">Direitos dos titulares de dados</h2>
    <button type="button" class="dialogo-fechar" data-fechar>Fechar</button>
  </div>
  <div class="dialogo-corpo texto-legal">${textoDireitos()}
    <p><a class="botao botao-primario" href="/privacidade#solicitar">Fazer minha solicitação</a></p>
  </div>
</dialog>

<div class="cookies" id="aviso-cookies" role="region" aria-label="Aviso sobre cookies" hidden>
  <p>Este site usa apenas cookies essenciais, necessários para a segurança dos formulários e do atendimento. Não usamos cookies de publicidade nem de estatística. <a href="/cookies">Ler a política de cookies</a>.</p>
  <button type="button" class="botao botao-claro" data-aceitar-cookies>Aceitar e fechar</button>
</div>

<script src="/assets/js/site.js?v=4" defer></script>
</body>
</html>
`;
}

/** Página pública completa. */
const pagina = (ctx, opcoes, conteudo) => html`${cabecalho(ctx, opcoes)}${conteudo}
${rodape()}`;

const TRACOS = {
  notas: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  civil: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2A5 5 0 0 1 21 19"/>',
  protesto: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><circle cx="12.5" cy="14" r="3.5"/><path d="M12.5 12.3v1.9l1.2.8"/>',
  imoveis: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  titulos: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 13h8"/>',
  certificado: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v2"/>',
  pedido: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>',
  protocolo: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2M8.5 11h5"/>',
  selo: '<path d="M12 3l2.4 1.8 3 .1.9 2.9 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-.9 2.9-3 .1L12 21l-2.4-1.8-3-.1-.9-2.9L3.3 14.4l.9-2.9-.9-2.9 2.4-1.8.9-2.9 3-.1z"/><path d="m9 12 2 2 4-4"/>',
  custas: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9.5 14.5 12 17l2.5-2.5"/>',
  ouvidoria: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
};

const icone = (nome) => raw(`<svg class="icone" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${TRACOS[nome] || TRACOS.notas}</svg>`);

function selo(id = 'a') {
  const sid = 'selo-' + md5(id).slice(0, 6);
  return html`<a class="selo" href="/conformidade" aria-label="Atende 100% aos requisitos do CNJ. Ver detalhes da conformidade">
  <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <defs>
      <path id="${sid}" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"/>
    </defs>
    <circle cx="100" cy="100" r="96" class="selo-aro"/>
    <circle cx="100" cy="100" r="88" class="selo-fio"/>
    <circle cx="100" cy="100" r="58" class="selo-fio"/>
    <text class="selo-volta"><textPath href="#${sid}" startOffset="0">ATENDE 100% AOS REQUISITOS DO CNJ ✦ PROV. 213/2026 ✦</textPath></text>
    <text x="100" y="92" text-anchor="middle" class="selo-grande">100%</text>
    <text x="100" y="118" text-anchor="middle" class="selo-cnj">CNJ</text>
    <path d="M82 139 l12 10 l26 -23" class="selo-check"/>
  </svg>
</a>
`;
}

/* ------------------------------------------------------------- painel */

function cabecalhoAdmin(ctx, { u = null, titulo = 'Painel' } = {}) {
  const atual = ctx.caminho;
  const cur = (cond) => raw(cond ? ' aria-current="page"' : '');
  const menu = u ? html`
      <nav class="adm-menu" aria-label="Painel">
        <a href="/admin/registros"${cur(atual === '/admin/registros' || atual === '/admin/registro')}>Registros</a>
        ${u.perfil === 'admin' ? html`
          <a href="/admin/transparencia"${cur(atual === '/admin/transparencia')}>Transparência</a>
          <a href="/admin/usuarios"${cur(atual === '/admin/usuarios')}>Usuários</a>
        ` : ''}
        <a href="/admin/senha"${cur(atual === '/admin/senha')}>Minha senha</a>
        <form method="post" action="/admin/sair">${csrfCampo(ctx)}<button type="submit">Sair</button></form>
      </nav>
      <p class="adm-quem">${u.nome} <span>${u.perfil === 'admin' ? 'Administrador' : 'Atendente'}</span></p>
    ` : '';
  const ok = ctx.flash('ok');
  const aviso = ctx.flash('aviso');
  return html`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${titulo} – Painel do cartório</title>
<link rel="icon" type="image/png" href="/assets/img/brasao.png">
<link rel="stylesheet" href="/assets/css/fontes.css?v=2">
<link rel="stylesheet" href="/assets/css/admin.css?v=2">
</head>
<body class="adm">
<header class="adm-topo">
  <div class="adm-largura adm-topo-in">
    <a class="adm-marca" href="${u ? '/admin/registros' : '/admin'}">
      <img src="/assets/img/brasao.png" alt="" width="30" height="32">
      <span>Painel do cartório</span>
    </a>
    ${menu}
  </div>
</header>
<main class="adm-largura adm-main" id="conteudo">
${ok ? html`<div class="adm-alerta adm-ok" role="status">${ok}</div>` : ''}${aviso ? html`<div class="adm-alerta adm-aviso" role="alert">${aviso}</div>` : ''}`;
}

const rodapeAdmin = () => raw(`</main>
<script src="/assets/js/admin.js?v=2" defer></script>
</body>
</html>
`);

async function paginaAdmin(ctx, opcoes, conteudo) {
  return html`${cabecalhoAdmin(ctx, opcoes)}${conteudo}
${rodapeAdmin()}`;
}

module.exports = { cabecalho, rodape, pagina, textoAviso, textoDireitos, icone, selo, cabecalhoAdmin, rodapeAdmin, paginaAdmin, e };
