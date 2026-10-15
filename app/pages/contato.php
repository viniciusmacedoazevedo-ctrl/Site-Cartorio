<?php
require __DIR__ . '/_envio.php';
[$valores, $erros, $msg] = processar_envio('contato');
$em = cartorio('emails');
view('header', ['titulo' => 'Contato', 'descricao' => 'Endereço, telefones, horário e e-mails do Cartório de São José do Campestre/RN.']);
?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura form-layout">
    <div class="pagina-cabeca">
      <h1>Contato</h1>
      <p class="lead">Atendimento presencial <?= e(mb_strtolower(cartorio('horario'))) ?>.</p>
      <dl class="contatos">
        <div><dt>Endereço</dt><dd><?= e(cartorio('endereco')) ?>, <?= e(cartorio('cidade')) ?>, CEP <?= e(cartorio('cep')) ?><br><a href="<?= e(cartorio('mapa_url')) ?>" rel="noopener" target="_blank">Abrir no mapa</a></dd></div>
        <div><dt>Telefone</dt><dd><a href="tel:<?= e(cartorio('telefone_link')) ?>"><?= e(cartorio('telefone')) ?></a></dd></div>
        <div><dt>WhatsApp</dt><dd><a href="https://wa.me/<?= e(cartorio('whatsapp_link')) ?>"><?= e(cartorio('whatsapp')) ?></a></dd></div>
        <div><dt>Atendimento geral</dt><dd><a href="mailto:<?= e($em['contato']) ?>"><?= e($em['contato']) ?></a></dd></div>
        <div><dt><?= e(cartorio('titular_cargo')) ?></dt><dd><?= e(cartorio('titular')) ?><br><a href="mailto:<?= e($em['notaria']) ?>"><?= e($em['notaria']) ?></a></dd></div>
        <div><dt>Ouvidoria</dt><dd><a href="mailto:<?= e($em['ouvidoria']) ?>"><?= e($em['ouvidoria']) ?></a></dd></div>
        <div><dt>Direitos dos titulares (LGPD)</dt><dd><a href="mailto:<?= e($em['lgpd']) ?>"><?= e($em['lgpd']) ?></a></dd></div>
      </dl>
    </div>
    <form class="formulario" method="post" action="/contato" novalidate>
      <h2 class="formulario-titulo">Envie uma mensagem</h2>
      <?= aviso_geral($msg) ?>
      <div class="linha-2">
        <?= campo('contato', 'nome', $valores, $erros) ?>
        <?= campo('contato', 'telefone', $valores, $erros) ?>
      </div>
      <?= campo('contato', 'email', $valores, $erros) ?>
      <?= campo('contato', 'assunto', $valores, $erros) ?>
      <?= campo('contato', 'mensagem', $valores, $erros) ?>
      <?= rodape_formulario('contato', $erros, 'Enviar mensagem') ?>
    </form>
  </div>
</main>
<?php view('footer'); ?>
