<?php
$servicos = require APP_DIR . '/content/servicos.php';
view('header', ['titulo' => 'Carta de Serviços', 'descricao' => 'Carta de Serviços do Cartório de São José do Campestre/RN: o que é cada serviço, documentos obrigatórios e gratuidades.']);
?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Carta de Serviços ao Cidadão</h1>
      <p class="lead">O que cada serviço faz e quais documentos levar. Traga os originais ou cópias autenticadas; conforme o caso, o cartório pode pedir outros documentos previstos em lei.</p>
      <p class="pagina-apoio">Valores na <a href="/emolumentos">tabela de emolumentos</a>. Atendimento presencial <?= e(mb_strtolower(cartorio('horario'))) ?>.</p>
    </div>
    <div class="carta-layout">
    <nav class="indice carta-indice" aria-label="Atribuições">
      <?php foreach ($servicos as $i => $g): ?>
        <a href="#area-<?= $i ?>"><?= e($g['area']) ?></a>
      <?php endforeach; ?>
      <a class="carta-indice-pedido" href="/pedido">Fazer pedido ou agendar</a>
    </nav>
    <div class="carta-corpo">
    <?php foreach ($servicos as $i => $g): ?>
      <section class="servico-area" id="area-<?= $i ?>" aria-labelledby="area-t-<?= $i ?>">
        <header>
          <h2 id="area-t-<?= $i ?>"><?= e($g['area']) ?></h2>
          <p><?= e($g['resumo']) ?></p>
        </header>
        <?php foreach ($g['itens'] as $s): ?>
          <article class="servico" id="<?= e($s['slug']) ?>" aria-labelledby="sv-<?= e($s['slug']) ?>">
            <div class="servico-texto">
              <h3 id="sv-<?= e($s['slug']) ?>"><?= e($s['nome']) ?></h3>
              <p><?= e($s['texto']) ?></p>
              <?php if (!empty($s['gratuidade'])): ?>
                <p class="servico-gratis"><strong>Gratuidade:</strong> <?= e($s['gratuidade']) ?></p>
              <?php endif; ?>
            </div>
            <div class="servico-docs">
              <h4>Documentos obrigatórios</h4>
              <ul>
                <?php foreach ($s['docs'] as $d): ?><li><?= e($d) ?></li><?php endforeach; ?>
              </ul>
              <p class="servico-online">Prefere adiantar pela internet? <a href="/pedido?servico=<?= e($s['slug']) ?>">Envie a solicitação ou agende</a>.</p>
            </div>
          </article>
        <?php endforeach; ?>
      </section>
    <?php endforeach; ?>
    </div>
    </div>
  </div>
</main>
<?php view('footer'); ?>
