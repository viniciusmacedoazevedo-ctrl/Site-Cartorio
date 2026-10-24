'use strict';
/** Páginas de conteúdo (sem formulário). */
const { cartorio, SERVICOS, html, raw, atendimentoAgora, rawurlencode } = require('../lib/base');
const { pagina, icone, selo } = require('../views/layout');

const c = cartorio;

function inicio(ctx) {
  const agora = atendimentoAgora();
  const tabela = c('tabela_custas');
  const foto = c('foto_abertura');
  const grupos = SERVICOS.map((g, i) => html`
          <li class="card-servico${g.itens.length >= 4 ? ' card-servico-largo' : ''}">
            <div class="card-servico-topo">
              <span class="card-servico-icone">${icone(g.icone || '')}</span>
              <h3><a href="/servicos#area-${i}">${g.area}</a></h3>
            </div>
            <p>${g.resumo}</p>
            <ul class="card-servico-itens">
              ${g.itens.map((s) => html`<li><a href="/servicos#${s.slug}">${s.nome}</a></li>
              `)}
            </ul>
          </li>
        `);
  const abertura = foto
    ? html`<img class="abertura-img" src="${foto}" alt="" width="1101" height="513" fetchpriority="high">`
    : html`<div class="abertura-fundo" aria-hidden="true">
        <img class="abertura-brasao" src="/assets/img/brasao-gravura.svg" alt="" width="128" height="135">
        <svg class="abertura-nome" viewBox="0 0 1160 60" preserveAspectRatio="xMidYMid meet" focusable="false">
          <text x="580" y="46" text-anchor="middle" textLength="1150" lengthAdjust="spacingAndGlyphs">SERVIÇO NOTARIAL E REGISTRAL · SÃO JOSÉ DO CAMPESTRE · RN</text>
        </svg>
      </div>`;
  return ctx.html(pagina(ctx, { titulo: '' }, html`
<main id="conteudo" tabindex="-1">
  <section class="abertura${foto ? ' abertura-foto' : ''}">
    ${abertura}
    <div class="largura abertura-grade">
      <div class="abertura-texto">
        <h1>Cartório de São José do Campestre/RN</h1>
        <p class="lead">Tabelionato de notas e de protesto, registro civil, registro de imóveis, títulos e documentos e pessoas jurídicas, e certificado digital. Veja o que cada serviço exige antes de vir ao cartório.</p>
        <div class="acoes">
          <a class="botao botao-claro" href="/servicos">Ver serviços e documentos</a>
          <a class="botao botao-contorno-claro" href="/emolumentos">Emolumentos e gratuidades</a>
        </div>
      </div>
      <aside class="ficha" aria-label="Atendimento presencial">
        <p class="ficha-estado ${agora.aberto ? 'aberto' : 'fechado'}"><span aria-hidden="true"></span>${agora.texto}</p>
        <dl>
          <div><dt>Horário</dt><dd class="ficha-linha">${c('horario')}</dd></div>
          <div><dt>Endereço</dt><dd>${c('endereco')}<br>${c('cidade')}</dd></div>
          <div><dt>Telefone</dt><dd><a href="tel:${c('telefone_link')}">${c('telefone')}</a></dd></div>
          <div><dt>WhatsApp</dt><dd><a href="https://wa.me/${c('whatsapp_link')}">${c('whatsapp')}</a></dd></div>
          <div><dt>Titular</dt><dd>${c('titular')}<br><span class="ficha-menor">CNS ${c('cns')}</span></dd></div>
        </dl>
        <a class="ficha-mapa" href="${c('mapa_url')}" rel="noopener" target="_blank">Ver no mapa</a>
      </aside>
    </div>
  </section>

  <nav class="atalhos-rapidos" aria-label="Acesso rápido">
    <ul class="largura atalhos-grade">
      <li><a href="/pedido"><span class="atalho-icone">${icone('pedido')}</span><strong>Fazer pedido ou agendar</strong><span>Adiante seu atendimento</span></a></li>
      <li><a href="/protocolo"><span class="atalho-icone">${icone('protocolo')}</span><strong>Consultar protocolo</strong><span>Acompanhe seu pedido</span></a></li>
      <li><a href="/validacao"><span class="atalho-icone">${icone('selo')}</span><strong>Validar selo</strong><span>Confira um ato do cartório</span></a></li>
      <li><a href="${tabela.arquivo}" download><span class="atalho-icone">${icone('custas')}</span><strong>Tabela de custas 2026</strong><span>PDF, ${tabela.tamanho}</span></a></li>
      <li><a href="/ouvidoria"><span class="atalho-icone">${icone('ouvidoria')}</span><strong>Ouvidoria</strong><span>Reclamações, sugestões e elogios</span></a></li>
    </ul>
  </nav>

  <section class="secao" aria-labelledby="t-servicos">
    <div class="largura">
      <div class="secao-cabeca">
        <h2 id="t-servicos">Carta de serviços</h2>
        <p>Cada serviço traz uma descrição curta e a lista de documentos obrigatórios.</p>
      </div>
      <ul class="servicos-grade">
        ${grupos}
      </ul>
    </div>
  </section>

  <section class="secao secao-papel" aria-labelledby="t-solicitar">
    <div class="largura">
      <div class="secao-cabeca">
        <h2 id="t-solicitar">Como adiantar seu atendimento pela internet</h2>
        <p>O ato é praticado no cartório, mas você pode enviar o pedido ou sugerir uma data antes de vir.</p>
      </div>
      <ol class="passos passos-4">
        <li>
          <h3>Confira os documentos</h3>
          <p>Na <a href="/servicos">Carta de Serviços</a>, veja o que cada serviço exige.</p>
        </li>
        <li>
          <h3>Envie o pedido ou agende</h3>
          <p>Preencha a <a href="/pedido">solicitação online</a>. O agendamento é confirmado pelo cartório por e-mail ou telefone.</p>
        </li>
        <li>
          <h3>Guarde o protocolo</h3>
          <p>Você recebe um número de protocolo e um código de 4 letras, na tela e por e-mail, se informar um.</p>
        </li>
        <li>
          <h3>Acompanhe a situação</h3>
          <p>Use o protocolo e o código em <a href="/protocolo">Consultar protocolo</a>.</p>
        </li>
      </ol>
      <p class="secao-acao"><a class="botao botao-primario" href="/pedido">Fazer uma solicitação</a></p>
    </div>
  </section>

  <section class="secao" aria-labelledby="t-acesso">
    <div class="largura cidadao-grade">
      <div>
        <div class="secao-cabeca">
          <h2 id="t-acesso">Informação ao cidadão</h2>
        </div>
        <ul class="acesso">
          <li><a href="/transparencia"><strong>Transparência</strong><span>Receitas públicas arrecadadas mês a mês: parcela pública dos emolumentos e repasses aos fundos.</span></a></li>
          <li><a href="/emolumentos#gratuidades"><strong>Gratuidades</strong><span>Atos gratuitos por lei, como o registro de nascimento e de óbito e suas primeiras certidões.</span></a></li>
          <li><a href="/validacao#centrais"><strong>Centrais nacionais</strong><span>e-Notariado, CENSEC, ONR, CRC Nacional e CENPROT para pedidos de todo o país.</span></a></li>
          <li><a href="/serventia"><strong>A serventia</strong><span>Titular, Código Nacional da Serventia, atribuições e responsáveis.</span></a></li>
        </ul>
      </div>
      <aside class="conformidade-cartao" aria-label="Conformidade e tabela de custas">
        ${selo('inicio')}
        <p>Serventia em conformidade com as normas do Conselho Nacional de Justiça, incluindo o Provimento nº 213/2026 e a Lei Geral de Proteção de Dados. <a href="/conformidade">Ver o que isso inclui</a>.</p>
        <p class="conformidade-tabela">Valores oficiais na <a href="${tabela.arquivo}" download>Tabela de custas 2026</a> (${tabela.detalhe}), com ISS de 5%.</p>
      </aside>
    </div>
  </section>

  <section class="secao-links" aria-labelledby="t-links">
    <div class="largura links-faixa">
      <h2 id="t-links">Links úteis</h2>
      <ul class="links">
        ${c('links_uteis').map(([rot, href]) => html`<li><a href="${href}" rel="noopener" target="_blank">${rot}</a></li>
        `)}
      </ul>
    </div>
  </section>
</main>`));
}

function acessibilidade(ctx) {
  return ctx.html(pagina(ctx, { titulo: 'Acessibilidade' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Acessibilidade</h1>
      <p class="lead">Este site segue o Modelo de Acessibilidade em Governo Eletrônico (e-MAG) e as diretrizes WCAG 2.1, nível AA, como determina a Lei Brasileira de Inclusão (Lei nº 13.146/2015, art. 63).</p>
    </div>
    <div class="texto-legal texto-estreito">
      <h2>Atalhos de teclado</h2>
      <table class="tabela">
        <thead><tr><th scope="col">Tecla</th><th scope="col">Leva para</th></tr></thead>
        <tbody>
          <tr><td>Alt + 1</td><td>Conteúdo principal da página</td></tr>
          <tr><td>Alt + 2</td><td>Menu principal</td></tr>
          <tr><td>Alt + 4</td><td>Rodapé, com contatos e links de transparência</td></tr>
        </tbody>
      </table>
      <p>No Firefox use Alt + Shift + número; no Safari e no Mac, Control + Option + número. A tecla Tab percorre links, botões e campos em ordem, sempre com destaque visível.</p>

      <h2>Recursos da página</h2>
      <ul>
        <li><strong>Alto contraste:</strong> botão no topo de todas as páginas. A escolha fica salva neste navegador.</li>
        <li><strong>Tamanho da letra:</strong> botões A− e A+ no topo. Também funciona o zoom do navegador (Ctrl + e Ctrl −).</li>
        <li><strong>Leitores de tela:</strong> páginas com títulos organizados, imagens com descrição, campos de formulário com rótulos e mensagens de erro anunciadas.</li>
        <li><strong>Celular:</strong> o site se adapta a qualquer tamanho de tela, sem rolagem lateral.</li>
      </ul>

      <h2>Encontrou alguma barreira?</h2>
      <p>Conte para nós pela <a href="/ouvidoria">Ouvidoria</a> ou pelo telefone <a href="tel:${c('telefone_link')}">${c('telefone')}</a>. O atendimento presencial é acessível e prioritário para pessoas com deficiência, idosos, gestantes e pessoas com crianças de colo.</p>
    </div>
  </div>
</main>`));
}

function conformidade(ctx) {
  return ctx.html(pagina(ctx, { titulo: 'Conformidade com o CNJ', descricao: 'Normas do CNJ e da LGPD atendidas pelo Cartório de São José do Campestre.' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca conformidade-cabeca">
      ${selo('conf')}
      <div>
        <h1>Atende 100% aos requisitos do CNJ</h1>
        <p class="lead">O cartório segue as normas do Conselho Nacional de Justiça para tecnologia, segurança da informação e proteção de dados pessoais.</p>
      </div>
    </div>
    <div class="texto-legal texto-estreito">
      <table class="tabela">
        <thead><tr><th scope="col">Norma</th><th scope="col">O que exige</th><th scope="col">Como atendemos</th></tr></thead>
        <tbody>
          <tr><td>Provimento CNJ nº 213/2026</td><td>Padrões de tecnologia e segurança da informação: políticas de segurança, cópias de segurança, controle de acesso, continuidade do serviço e conformidade com a LGPD.</td><td>Política de segurança, backups, acesso restrito e registrado aos sistemas, Encarregado de dados designado e canal para os titulares.</td></tr>
          <tr><td>Provimento CNJ nº 243/2026</td><td>Atualiza o Provimento 213: enquadramento das serventias e prazos de implantação; quem terceiriza continua responsável.</td><td>Fornecedores de tecnologia contratados e acompanhados pela serventia; sistemas mantidos em versões com suporte.</td></tr>
          <tr><td>Resolução CNJ nº 215/2015, art. 6º, § 3º (redação da Resolução CNJ nº 670/2025)</td><td>Campo “Transparência” com as receitas públicas mensais (parcela pública dos emolumentos e fundos) e despesas públicas; parcela privada com acesso condicionado.</td><td><a href="/transparencia">Página de Transparência</a> atualizada mês a mês, com orientação para pedidos de acesso à Corregedoria.</td></tr>
          <tr><td>Lei Geral de Proteção de Dados (Lei nº 13.709/2018), Resolução CNJ nº 363/2021 e Provimento CNJ nº 134/2022</td><td>Política de privacidade, termos de uso, Encarregado identificado e canal para os direitos dos titulares.</td><td><a href="/privacidade#aviso">Aviso de privacidade</a>, <a href="/termos">termos de uso</a>, <a href="/privacidade#solicitar">formulário com protocolo</a> e <a href="/cookies">cookies apenas essenciais</a>.</td></tr>
          <tr><td>Lei nº 8.935/1994 e Lei nº 10.169/2000</td><td>Tabela oficial de emolumentos à disposição do usuário.</td><td><a href="/emolumentos">Tabela de custas 2026</a> para download e explicação da cobrança.</td></tr>
          <tr><td>Lei nº 9.534/1997, Código Civil e Resolução CNJ nº 35/2007</td><td>Informação sobre os atos gratuitos.</td><td><a href="/emolumentos#gratuidades">Quadro de gratuidades</a> e indicação em cada serviço da <a href="/servicos">Carta de Serviços</a>.</td></tr>
          <tr><td>Identificação da serventia</td><td>Titular, Código Nacional da Serventia (CNS), atribuições, endereço, contatos e horário.</td><td>Página <a href="/serventia">A serventia</a> e rodapé de todas as páginas.</td></tr>
          <tr><td>Lei Brasileira de Inclusão (Lei nº 13.146/2015) e e-MAG</td><td>Site acessível a pessoas com deficiência.</td><td>Atalhos de teclado, alto contraste, ajuste da letra e compatibilidade com leitores de tela. <a href="/acessibilidade">Detalhes</a>.</td></tr>
        </tbody>
      </table>
      <h2>Canais de transparência</h2>
      <ul>
        <li>Ouvidoria: <a href="/ouvidoria">formulário com protocolo</a> ou <a href="mailto:${c('emails.ouvidoria')}">${c('emails.ouvidoria')}</a></li>
        <li>Linha de apoio à ética e denúncia de fraudes: <a href="mailto:${c('emails.compliance')}">${c('emails.compliance')}</a>, ${c('etica_telefone')}</li>
        <li>Encarregado (DPO): ${c('dpo_nome')}, <a href="mailto:${c('dpo_email')}">${c('dpo_email')}</a></li>
      </ul>
    </div>
  </div>
</main>`));
}

function cookies(ctx) {
  return ctx.html(pagina(ctx, { titulo: 'Política de cookies' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Política de cookies</h1>
      <p class="lead">Cookies são pequenos arquivos que o site grava no seu navegador. Aqui usamos só os indispensáveis.</p>
    </div>
    <div class="legal-corpo texto-legal texto-estreito">
      <h2>Cookies que usamos</h2>
      <table class="tabela">
        <thead><tr><th scope="col">Nome</th><th scope="col">Para que serve</th><th scope="col">Duração</th></tr></thead>
        <tbody>
          <tr><td>sjc_sessao</td><td>Protege os formulários contra envios falsos e mantém o acesso ao painel interno do cartório.</td><td>Até fechar o navegador</td></tr>
          <tr><td>sjc_contraste e sjc_fonte</td><td>Guardam, no próprio navegador (armazenamento local), se você ligou o alto contraste ou mudou o tamanho da letra.</td><td>Até você apagar os dados do navegador</td></tr>
          <tr><td>sjc_cookies</td><td>Lembra que você já leu este aviso, para ele não aparecer de novo.</td><td>1 ano</td></tr>
        </tbody>
      </table>
      <p>Esses cookies são essenciais: sem eles os formulários não funcionam com segurança. Por isso não podem ser desligados pelo site, mas você pode apagá-los nas configurações do navegador.</p>
      <h2>O que não usamos</h2>
      <p>Não usamos cookies de publicidade, de redes sociais nem de estatística de visitas. Não rastreamos sua navegação em outros sites.</p>
      <h2>Serviços de terceiros</h2>
      <p>As páginas do site não carregam nada de outras empresas: as fontes tipográficas e as imagens ficam no próprio site. Os links para mapas e para o WhatsApp só levam a esses serviços se você clicar neles.</p>
      <h2>Dúvidas</h2>
      <p>Fale com o Encarregado pelo tratamento de dados: <a href="mailto:${c('emails.lgpd')}">${c('emails.lgpd')}</a>. Veja também o <a href="/privacidade">Aviso de privacidade</a>.</p>
      <p class="atualizado">Última atualização: ${c('cookies_atualizada_em')}.</p>
    </div>
  </div>
</main>`));
}

function emolumentos(ctx) {
  const tabela = c('tabela_custas');
  return ctx.html(pagina(ctx, { titulo: 'Emolumentos e gratuidades', descricao: 'Tabela oficial de emolumentos do RN 2026 e atos gratuitos por lei no Cartório de São José do Campestre.' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Emolumentos e gratuidades</h1>
      <p class="lead">Os valores dos atos são fixados por lei estadual e são os mesmos em todos os cartórios do Rio Grande do Norte.</p>
    </div>
    <div class="texto-legal texto-estreito">
      <section class="tabela-download" aria-labelledby="t-tabela">
        <h2 id="t-tabela">${tabela.titulo}</h2>
        <p>${tabela.detalhe}. Inclui emolumentos, taxas destinadas aos fundos (FDJ, FRMP, FCRCPN, FUNAF) e ISS de 5%.</p>
        <a class="botao botao-ouro" href="${tabela.arquivo}" download>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M11 3h2v9.6l3.3-3.3 1.4 1.4L12 16.4l-5.7-5.7 1.4-1.4 3.3 3.3V3ZM5 19h14v2H5z"/></svg>
          Baixar tabela de custas (PDF, ${tabela.tamanho})
        </a>
      </section>

      <h2>Como os valores são cobrados</h2>
      <ul>
        <li>Os emolumentos seguem a tabela oficial (Lei nº 8.935/1994 e Lei nº 10.169/2000). Nenhum valor fora da tabela pode ser cobrado.</li>
        <li>Todo ato recebe o selo digital de fiscalização do TJRN e você recebe recibo com os valores discriminados.</li>
        <li>Parte do valor pago é repassada aos fundos públicos e ao Município. Esses repasses são publicados mês a mês na página de <a href="/transparencia">Transparência</a>.</li>
      </ul>

      <h2 id="gratuidades">Atos gratuitos por lei</h2>
      <table class="tabela">
        <thead><tr><th scope="col">Ato</th><th scope="col">Quem tem direito</th><th scope="col">Base legal</th></tr></thead>
        <tbody>
          <tr><td>Registro de nascimento e primeira certidão</td><td>Todas as pessoas</td><td>Lei nº 9.534/1997</td></tr>
          <tr><td>Registro de óbito e de natimorto e primeira certidão</td><td>Todas as pessoas</td><td>Lei nº 9.534/1997</td></tr>
          <tr><td>Demais certidões do registro civil (segundas vias)</td><td>Pessoas reconhecidamente pobres, mediante declaração</td><td>Constituição Federal, art. 5º, LXXVI; Lei nº 9.534/1997</td></tr>
          <tr><td>Habilitação, registro e primeira certidão de casamento</td><td>Quem se declarar pobre, sob as penas da lei</td><td>Código Civil, art. 1.512, parágrafo único</td></tr>
          <tr><td>Escrituras de inventário, partilha, separação e divórcio consensuais</td><td>Quem declarar não ter condições de pagar, com assistência de advogado</td><td>Resolução CNJ nº 35/2007, arts. 6º e 7º</td></tr>
          <tr><td>Atos necessários para cumprir decisão judicial</td><td>Beneficiário da gratuidade da justiça concedida no processo</td><td>Código de Processo Civil, art. 98, § 1º, IX</td></tr>
        </tbody>
      </table>
      <p>Para pedir a gratuidade, informe no atendimento e assine a declaração de hipossuficiência. A declaração falsa sujeita o declarante às sanções legais. Outras hipóteses previstas na legislação do Rio Grande do Norte também são aplicadas.</p>
      <p>Dúvidas sobre valores ou gratuidade: <a href="tel:${c('telefone_link')}">${c('telefone')}</a> ou <a href="/ouvidoria">Ouvidoria</a>.</p>
    </div>
  </div>
</main>`));
}

function serventia(ctx) {
  const em = c('emails');
  return ctx.html(pagina(ctx, { titulo: 'A serventia', descricao: 'Identificação do Serviço Notarial e Registral de São José do Campestre/RN: titular, CNS, CNPJ, atribuições e contatos.' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>A serventia</h1>
      <p class="lead">O ${c('nome_oficial')} é um serviço público delegado pelo Poder Judiciário e fiscalizado pela Corregedoria Geral de Justiça do Rio Grande do Norte.</p>
    </div>
    <div class="ficha-oficial">
      <dl>
        <div><dt>Denominação</dt><dd>${c('nome_oficial')}</dd></div>
        <div><dt>${c('responsavel_tipo')}</dt><dd>${c('titular')}, ${c('titular_cargo')}</dd></div>
        <div><dt>Código Nacional da Serventia (CNS)</dt><dd>${c('cns')}</dd></div>
        <div><dt>CNPJ</dt><dd>${c('cnpj')}</dd></div>
        <div><dt>Atribuições</dt><dd><ul>${c('atribuicoes').map((a) => html`<li>${a}</li>`)}</ul></dd></div>
        <div><dt>Endereço</dt><dd>${c('endereco')}, ${c('cidade')}, CEP ${c('cep')}<br><a href="${c('mapa_url')}" rel="noopener" target="_blank">Abrir no mapa</a></dd></div>
        <div><dt>Horário de atendimento</dt><dd>${c('horario')}</dd></div>
        <div><dt>Telefone e WhatsApp</dt><dd><a href="tel:${c('telefone_link')}">${c('telefone')}</a> · <a href="https://wa.me/${c('whatsapp_link')}">${c('whatsapp')}</a></dd></div>
        <div><dt>E-mail institucional</dt><dd><a href="mailto:${em.contato}">${em.contato}</a></dd></div>
        <div><dt>${c('titular_cargo')}</dt><dd><a href="mailto:${em.notaria}">${em.notaria}</a></dd></div>
        <div><dt>Encarregado de dados (DPO)</dt><dd>${c('dpo_nome')}, <a href="mailto:${c('dpo_email')}">${c('dpo_email')}</a></dd></div>
        <div><dt>Ouvidoria</dt><dd><a href="/ouvidoria">Formulário com protocolo</a> ou <a href="mailto:${em.ouvidoria}">${em.ouvidoria}</a></dd></div>
        <div><dt>Ética e denúncia de fraudes</dt><dd><a href="mailto:${em.compliance}">${em.compliance}</a>, ${c('etica_telefone')}</dd></div>
        <div><dt>Fiscalização</dt><dd>Corregedoria Geral de Justiça do RN – <a href="${c('corregedoria_url')}" rel="noopener" target="_blank">portal do extrajudicial</a></dd></div>
      </dl>
    </div>
  </div>
</main>`));
}

function servicos(ctx) {
  const indice = SERVICOS.map((g, i) => html`<a href="#area-${i}">${g.area}</a>
      `);
  const areas = SERVICOS.map((g, i) => html`
      <section class="servico-area" id="area-${i}" aria-labelledby="area-t-${i}">
        <header>
          <h2 id="area-t-${i}">${g.area}</h2>
          <p>${g.resumo}</p>
        </header>
        ${g.itens.map((s) => html`
          <article class="servico" id="${s.slug}" aria-labelledby="sv-${s.slug}">
            <div class="servico-texto">
              <h3 id="sv-${s.slug}">${s.nome}</h3>
              <p>${s.texto}</p>
              ${s.gratuidade ? html`<p class="servico-gratis"><strong>Gratuidade:</strong> ${s.gratuidade}</p>` : ''}
            </div>
            <div class="servico-docs">
              <h4>Documentos obrigatórios</h4>
              <ul>
                ${s.docs.map((d) => html`<li>${d}</li>`)}
              </ul>
              <p class="servico-online">Prefere adiantar pela internet? <a href="/pedido?servico=${s.slug}">Envie a solicitação ou agende</a>.</p>
            </div>
          </article>
        `)}
      </section>
    `);
  return ctx.html(pagina(ctx, { titulo: 'Carta de Serviços', descricao: 'Carta de Serviços do Cartório de São José do Campestre/RN: o que é cada serviço, documentos obrigatórios e gratuidades.' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Carta de Serviços ao Cidadão</h1>
      <p class="lead">O que cada serviço faz e quais documentos levar. Traga os originais ou cópias autenticadas; conforme o caso, o cartório pode pedir outros documentos previstos em lei.</p>
      <p class="pagina-apoio">Valores na <a href="/emolumentos">tabela de emolumentos</a>. Atendimento presencial ${c('horario').toLowerCase()}.</p>
    </div>
    <div class="carta-layout">
    <nav class="indice carta-indice" aria-label="Atribuições">
      ${indice}
      <a class="carta-indice-pedido" href="/pedido">Fazer pedido ou agendar</a>
    </nav>
    <div class="carta-corpo">
    ${areas}
    </div>
    </div>
  </div>
</main>`));
}

function termos(ctx) {
  return ctx.html(pagina(ctx, { titulo: 'Termos de uso' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Termos de uso do site</h1>
      <p class="lead">Regras para usar este site e os seus formulários. Ao usar o site, você concorda com estes termos.</p>
    </div>
    <div class="texto-legal texto-estreito">
      <h2>1. Finalidade</h2>
      <p>Este site é o canal institucional do ${c('nome_oficial')}, responsável ${c('titular')}, CNS ${c('cns')}, CNPJ ${c('cnpj')}. Ele informa sobre os serviços, valores, gratuidades e transparência da serventia e recebe solicitações, manifestações de ouvidoria e pedidos dos titulares de dados.</p>

      <h2>2. Solicitações pelo site</h2>
      <ul>
        <li>Enviar um formulário <strong>não equivale à prática do ato</strong>. O ato notarial ou de registro só existe depois de lavrado ou registrado pelo cartório, com o selo digital de fiscalização.</li>
        <li>O protocolo do site serve para acompanhar o atendimento. Ele não garante prioridade nem substitui o protocolo oficial de títulos apresentados para registro.</li>
        <li>Prazos, valores e documentos seguem a legislação e a <a href="/emolumentos">tabela oficial de emolumentos</a>.</li>
      </ul>

      <h2>3. Responsabilidades do usuário</h2>
      <ul>
        <li>Informar dados verdadeiros e próprios, ou de quem você representa legalmente. Declaração falsa pode configurar crime.</li>
        <li>Enviar apenas arquivos dos quais você tenha o direito de uso, sem vírus ou conteúdo ilícito.</li>
        <li>Não tentar acessar áreas restritas, sobrecarregar o site ou usar robôs para enviar formulários.</li>
        <li>Guardar o protocolo e o código de consulta: quem os tiver poderá ver a situação do pedido.</li>
      </ul>

      <h2>4. Privacidade</h2>
      <p>Os dados pessoais enviados são tratados conforme o <a href="/privacidade#aviso">Aviso de privacidade</a>, a Lei Geral de Proteção de Dados e as normas do CNJ. O site usa apenas os cookies descritos na <a href="/cookies">Política de cookies</a>.</p>

      <h2>5. Disponibilidade e conteúdo</h2>
      <p>O cartório se esforça para manter o site disponível e as informações atualizadas, mas pode haver interrupções para manutenção. Em caso de divergência, prevalecem a legislação e a orientação dada no atendimento. Os links para sites de terceiros, como as centrais nacionais e órgãos públicos, levam a serviços com regras próprias.</p>

      <h2>6. Alterações</h2>
      <p>Estes termos podem ser atualizados a qualquer tempo. A versão vigente é sempre a publicada nesta página.</p>

      <h2>7. Contato</h2>
      <p>Dúvidas sobre estes termos: <a href="mailto:${c('emails.contato')}">${c('emails.contato')}</a>. Sobre dados pessoais: <a href="mailto:${c('emails.lgpd')}">${c('emails.lgpd')}</a>.</p>
      <p class="atualizado">Última atualização: ${c('politicas_atualizadas_em')}.</p>
    </div>
  </div>
</main>`));
}

function validacao(ctx) {
  return ctx.html(pagina(ctx, { titulo: 'Validar selo e centrais nacionais', descricao: 'Como conferir a autenticidade de atos e certidões pelo selo digital do TJRN e links para as centrais nacionais dos cartórios.' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Validar selo e certidão</h1>
      <p class="lead">Todo ato praticado pelo cartório recebe o selo digital de fiscalização do Tribunal de Justiça do RN, com código e QR Code impressos no documento.</p>
    </div>
    <div class="texto-legal texto-estreito">
      <h2>Como conferir a autenticidade</h2>
      <ol class="passos-lista">
        <li><strong>Pelo QR Code:</strong> aponte a câmera do celular para o QR Code do selo impresso no documento e abra o link da consulta do Tribunal de Justiça. Confira se os dados exibidos correspondem ao documento.</li>
        <li><strong>Pelo código do selo:</strong> use o código impresso ao lado do QR Code na <a href="${c('selo_consulta_url')}" rel="noopener" target="_blank">consulta pública do selo digital do TJRN</a>.</li>
        <li><strong>Com o cartório:</strong> se os dados não conferirem ou você tiver dúvida, <a href="/contato?assunto=${raw(rawurlencode('Conferência de selo ou certidão'))}">fale conosco</a> informando o código do selo. Suspeita de fraude: <a href="mailto:${c('emails.compliance')}">${c('emails.compliance')}</a>.</li>
      </ol>
      <p><a class="botao botao-primario" href="${c('selo_consulta_url')}" rel="noopener" target="_blank">Consultar selo no site do TJRN</a></p>
      <p>Certidões eletrônicas emitidas pelas centrais nacionais trazem seu próprio código de verificação, conferido no site da central que a emitiu.</p>

      <h2 id="centrais">Centrais nacionais</h2>
      <p>Plataformas oficiais dos cartórios brasileiros, reguladas pelo CNJ, para pedir atos e certidões pela internet em qualquer cartório do país.</p>
      <ul class="centrais">
        ${c('centrais').map(([nome, url, texto]) => html`<li><a href="${url}" rel="noopener" target="_blank">${nome}</a><span>${texto}</span></li>
        `)}
      </ul>
    </div>
  </div>
</main>`));
}

module.exports = { inicio, acessibilidade, conformidade, cookies, emolumentos, serventia, servicos, termos, validacao };
