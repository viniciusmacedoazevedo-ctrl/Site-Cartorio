<?php view('header', ['titulo' => 'Validar selo e centrais nacionais', 'descricao' => 'Como conferir a autenticidade de atos e certidões pelo selo digital do TJRN e links para as centrais nacionais dos cartórios.']); ?>
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
        <li><strong>Pelo código do selo:</strong> use o código impresso ao lado do QR Code na <a href="<?= e(cartorio('selo_consulta_url')) ?>" rel="noopener" target="_blank">consulta pública do selo digital do TJRN</a>.</li>
        <li><strong>Com o cartório:</strong> se os dados não conferirem ou você tiver dúvida, <a href="/contato?assunto=<?= rawurlencode('Conferência de selo ou certidão') ?>">fale conosco</a> informando o código do selo. Suspeita de fraude: <a href="mailto:<?= e(cartorio('emails.compliance')) ?>"><?= e(cartorio('emails.compliance')) ?></a>.</li>
      </ol>
      <p><a class="botao botao-primario" href="<?= e(cartorio('selo_consulta_url')) ?>" rel="noopener" target="_blank">Consultar selo no site do TJRN</a></p>
      <p>Certidões eletrônicas emitidas pelas centrais nacionais trazem seu próprio código de verificação, conferido no site da central que a emitiu.</p>

      <h2 id="centrais">Centrais nacionais</h2>
      <p>Plataformas oficiais dos cartórios brasileiros, reguladas pelo CNJ, para pedir atos e certidões pela internet em qualquer cartório do país.</p>
      <ul class="centrais">
        <?php foreach (cartorio('centrais') as [$nome, $url, $texto]): ?>
          <li><a href="<?= e($url) ?>" rel="noopener" target="_blank"><?= e($nome) ?></a><span><?= e($texto) ?></span></li>
        <?php endforeach; ?>
      </ul>
    </div>
  </div>
</main>
<?php view('footer'); ?>
