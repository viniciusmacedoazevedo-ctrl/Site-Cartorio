<?php
$info = flash('enviado');
if (!$info) {
    redirect('/');
}
view('header', ['titulo' => 'Envio recebido']);
?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <section class="recibo" aria-labelledby="t-recibo" tabindex="-1" data-foco>
      <p class="recibo-tipo"><?= e($info['titulo']) ?></p>
      <h1 id="t-recibo">Recebemos seu envio</h1>
      <div class="recibo-dados">
        <div><span>Protocolo</span><strong><?= e($info['protocolo']) ?></strong></div>
        <div><span>Código de consulta</span><strong><?= e($info['codigo']) ?></strong></div>
      </div>
      <?php if ($info['email']): ?>
        <p>Enviamos o protocolo e o código para <strong><?= e($info['email']) ?></strong>. Se não encontrar o e-mail, confira a caixa de spam.</p>
      <?php else: ?>
        <p><strong>Anote o protocolo e o código agora.</strong> Como nenhum e-mail foi informado, eles só aparecem nesta tela.</p>
      <?php endif; ?>
      <div class="acoes">
        <a class="botao botao-primario" href="/protocolo?p=<?= e(rawurlencode($info['protocolo'])) ?>">Consultar este protocolo</a>
        <button class="botao botao-secundario" type="button" data-imprimir>Imprimir comprovante</button>
        <a class="botao botao-texto" href="/">Voltar ao início</a>
      </div>
    </section>
  </div>
</main>
<?php view('footer'); ?>
