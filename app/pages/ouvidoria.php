<?php
require __DIR__ . '/_envio.php';
[$valores, $erros, $msg] = processar_envio('ouvidoria');
view('header', ['titulo' => 'Ouvidoria', 'descricao' => 'Ouvidoria do Cartório de São José do Campestre: denúncias, reclamações, sugestões e elogios, com ou sem identificação.']);
?>
<main id="conteudo" class="pagina pagina-ouvidoria">
  <div class="largura form-layout">
    <div class="pagina-cabeca">
      <h1>Ouvidoria</h1>
      <p class="lead">Canal para denúncias, reclamações, sugestões e elogios sobre o atendimento do cartório.</p>
      <ul class="lembretes">
        <li>Nome, e-mail e telefone são opcionais: você pode se manifestar sem se identificar.</li>
        <li>Sem e-mail, o protocolo aparece apenas na tela. Anote-o para consultar depois.</li>
        <li>Denúncias de fraude ou de conduta antiética também podem ir para <a href="mailto:<?= e(cartorio('emails.compliance')) ?>"><?= e(cartorio('emails.compliance')) ?></a>.</li>
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
      <?= aviso_geral($msg) ?>
      <?= campo('ouvidoria', 'tipo', $valores, $erros) ?>
      <?= campo('ouvidoria', 'nome', $valores, $erros) ?>
      <div class="linha-2">
        <?= campo('ouvidoria', 'email', $valores, $erros) ?>
        <?= campo('ouvidoria', 'telefone', $valores, $erros) ?>
      </div>
      <?= campo('ouvidoria', 'mensagem', $valores, $erros) ?>
      <?= campo('ouvidoria', 'anexo', $valores, $erros) ?>
      <?= rodape_formulario('ouvidoria', $erros, 'Enviar manifestação') ?>
    </form>
  </div>
</main>
<?php view('footer'); ?>
