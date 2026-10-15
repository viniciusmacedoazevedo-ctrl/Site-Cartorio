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
