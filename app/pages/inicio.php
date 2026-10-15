<?php
$servicos = require APP_DIR . '/content/servicos.php';
$agora = atendimento_agora();
$tabela = cartorio('tabela_custas');
$foto = cartorio('foto_abertura');
view('header', ['titulo' => '', 'descricao' => null]);
?>
<main id="conteudo" tabindex="-1">
  <section class="abertura<?= $foto ? ' abertura-foto' : '' ?>"<?= $foto ? ' style="--abertura-imagem: url(\'' . e($foto) . '\')"' : '' ?>>
    <div class="largura abertura-grade">
      <div class="abertura-texto">
        <p class="abertura-local"><?= e(cartorio('cidade')) ?></p>
        <h1>Cartório de São José do Campestre</h1>
        <p class="lead">Tabelionato de notas e de protesto, registro civil, registro de imóveis, títulos e documentos e pessoas jurídicas, e certificado digital. Veja o que cada serviço exige antes de vir ao cartório.</p>
        <div class="acoes">
          <a class="botao botao-claro" href="/servicos">Ver serviços e documentos</a>
          <a class="botao botao-contorno-claro" href="/emolumentos">Emolumentos e gratuidades</a>
        </div>
      </div>
      <aside class="ficha" aria-label="Atendimento presencial">
        <p class="ficha-estado <?= $agora['aberto'] ? 'aberto' : 'fechado' ?>"><span aria-hidden="true"></span><?= e($agora['texto']) ?></p>
        <dl>
          <div><dt>Horário</dt><dd><?= e(cartorio('horario')) ?></dd></div>
          <div><dt>Endereço</dt><dd><?= e(cartorio('endereco')) ?><br><?= e(cartorio('cidade')) ?></dd></div>
          <div><dt>Telefone</dt><dd><a href="tel:<?= e(cartorio('telefone_link')) ?>"><?= e(cartorio('telefone')) ?></a></dd></div>
          <div><dt>WhatsApp</dt><dd><a href="https://wa.me/<?= e(cartorio('whatsapp_link')) ?>"><?= e(cartorio('whatsapp')) ?></a></dd></div>
          <div><dt>Titular</dt><dd><?= e(cartorio('titular')) ?><br><span class="ficha-menor">CNS <?= e(cartorio('cns')) ?></span></dd></div>
        </dl>
        <a class="ficha-mapa" href="<?= e(cartorio('mapa_url')) ?>" rel="noopener" target="_blank">Ver no mapa</a>
      </aside>
    </div>
  </section>

  <section class="destaque" aria-label="Tabela de custas e conformidade">
    <div class="largura destaque-grade">
      <div class="destaque-tabela">
        <h2>Tabela de custas 2026</h2>
        <p>Valores oficiais de emolumentos e taxas de todos os atos, com ISS de 5%. <?= e($tabela['detalhe']) ?>.</p>
        <a class="botao botao-ouro" href="<?= e($tabela['arquivo']) ?>" download>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M11 3h2v9.6l3.3-3.3 1.4 1.4L12 16.4l-5.7-5.7 1.4-1.4 3.3 3.3V3ZM5 19h14v2H5z"/></svg>
          Baixar tabela de custas (PDF, <?= e($tabela['tamanho']) ?>)
        </a>
      </div>
      <div class="destaque-selo">
        <?php view('selo', ['id' => 'inicio']); ?>
        <p>Serventia em conformidade com as normas do Conselho Nacional de Justiça, incluindo o Provimento nº 213/2026 e a Lei Geral de Proteção de Dados. <a href="/conformidade">Ver o que isso inclui</a>.</p>
      </div>
    </div>
  </section>

  <section class="secao" aria-labelledby="t-servicos">
    <div class="largura">
      <div class="secao-cabeca">
        <h2 id="t-servicos">Carta de serviços</h2>
        <p>Cada serviço traz uma descrição curta e a lista de documentos obrigatórios.</p>
      </div>
      <ul class="servicos-grade">
        <?php foreach ($servicos as $i => $grupo): ?>
          <li class="card-servico">
            <span class="card-servico-icone"><?php view('icone', ['nome' => $grupo['icone'] ?? '']); ?></span>
            <h3><a href="/servicos#area-<?= $i ?>"><?= e($grupo['area']) ?></a></h3>
            <p><?= e($grupo['resumo']) ?></p>
            <ul>
              <?php foreach ($grupo['itens'] as $s): ?>
                <li><a href="/servicos#<?= e($s['slug']) ?>"><?= e($s['nome']) ?></a></li>
              <?php endforeach; ?>
            </ul>
          </li>
        <?php endforeach; ?>
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
    <div class="largura">
      <div class="secao-cabeca">
        <h2 id="t-acesso">Informação ao cidadão</h2>
      </div>
      <ul class="acesso">
        <li><a href="/transparencia"><strong>Transparência</strong><span>Receitas públicas arrecadadas mês a mês: parcela pública dos emolumentos e repasses aos fundos.</span></a></li>
        <li><a href="/emolumentos#gratuidades"><strong>Gratuidades</strong><span>Atos gratuitos por lei, como o registro de nascimento e de óbito e suas primeiras certidões.</span></a></li>
        <li><a href="/validacao"><strong>Validar selo e certidão</strong><span>Confira a autenticidade de um ato pelo selo digital de fiscalização do TJRN.</span></a></li>
        <li><a href="/validacao#centrais"><strong>Centrais nacionais</strong><span>e-Notariado, CENSEC, ONR, CRC Nacional e CENPROT para pedidos de todo o país.</span></a></li>
        <li><a href="/serventia"><strong>A serventia</strong><span>Titular, Código Nacional da Serventia, atribuições e responsáveis.</span></a></li>
        <li><a href="/protocolo"><strong>Consultar protocolo</strong><span>Acompanhe uma solicitação, manifestação ou pedido enviado pelo site.</span></a></li>
      </ul>
    </div>
  </section>

  <section class="ouvidoria-faixa" aria-labelledby="t-ouv">
    <div class="largura ouvidoria-in">
      <div>
        <h2 id="t-ouv">Ouvidoria</h2>
        <p>Denúncias, reclamações, sugestões e elogios. Você pode se identificar ou não; toda manifestação recebe protocolo.</p>
      </div>
      <a class="botao botao-claro" href="/ouvidoria">Abrir manifestação</a>
    </div>
  </section>

  <section class="secao" aria-labelledby="t-links">
    <div class="largura links-grade">
      <div>
        <h2 id="t-links">Links úteis</h2>
        <ul class="links">
          <?php foreach (cartorio('links_uteis') as [$rot, $href]): ?>
            <li><a href="<?= e($href) ?>" rel="noopener" target="_blank"><?= e($rot) ?></a></li>
          <?php endforeach; ?>
        </ul>
      </div>
      <div>
        <h2>Onde estamos</h2>
        <address class="endereco">
          <?= e(cartorio('endereco')) ?><br>
          <?= e(cartorio('cidade')) ?>, CEP <?= e(cartorio('cep')) ?><br>
          <?= e(cartorio('horario')) ?>
        </address>
        <p><a href="<?= e(cartorio('mapa_url')) ?>" rel="noopener" target="_blank">Abrir no mapa</a></p>
      </div>
    </div>
  </section>
</main>
<?php view('footer'); ?>
