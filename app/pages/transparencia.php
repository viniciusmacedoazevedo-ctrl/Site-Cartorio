<?php
$anos = array_map('intval', array_column(q('SELECT DISTINCT ano FROM transparencia ORDER BY ano DESC')->fetchAll(), 'ano'));
$ano = (int) ($_GET['ano'] ?? ($anos[0] ?? date('Y')));
if ($anos && !in_array($ano, $anos, true)) {
    $ano = $anos[0];
}
$linhas = q('SELECT * FROM transparencia WHERE ano = ? ORDER BY mes DESC', [$ano])->fetchAll();
$rubricas = rubricas();
$totais = array_fill_keys(array_column($rubricas, 'chave'), 0.0);
view('header', ['titulo' => 'Transparência', 'descricao' => 'Receitas públicas mensais do Cartório de São José do Campestre: parcela pública dos emolumentos e repasses aos fundos.']);
?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Transparência</h1>
      <p class="lead">Receitas públicas arrecadadas mês a mês com a cobrança de emolumentos e outros serviços, e despesas públicas, conforme a Resolução CNJ nº 215/2015, art. 6º, § 3º, com a redação da Resolução CNJ nº 670/2025.</p>
    </div>

    <?php if ($anos): ?>
      <nav class="indice" aria-label="Ano">
        <?php foreach ($anos as $a): ?>
          <a href="/transparencia?ano=<?= $a ?>"<?= $a === $ano ? ' aria-current="page"' : '' ?>><?= $a ?></a>
        <?php endforeach; ?>
      </nav>
    <?php endif; ?>

    <?php if (!$linhas): ?>
      <div class="vazio">
        <p><strong>Ainda não há meses publicados.</strong> Os valores de cada mês são publicados depois do fechamento contábil.</p>
      </div>
    <?php else: ?>
      <div class="tabela-rolagem" tabindex="0" role="region" aria-label="Receitas públicas de <?= $ano ?>">
        <table class="tabela tabela-numeros">
          <caption>Receitas e despesas públicas de <?= $ano ?>, em reais</caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              <?php foreach ($rubricas as $r): ?><th scope="col"><?= e($r['rotulo']) ?></th><?php endforeach; ?>
              <th scope="col">PDF</th>
            </tr>
          </thead>
          <tbody>
          <?php foreach ($linhas as $l): $v = json_decode($l['valores_json'], true) ?: []; ?>
            <tr>
              <th scope="row"><?= e(ucfirst(mes_nome((int) $l['mes']))) ?></th>
              <?php foreach ($rubricas as $r): $x = isset($v[$r['chave']]) ? (float) $v[$r['chave']] : null; if ($x !== null) $totais[$r['chave']] += $x; ?>
                <td data-rotulo="<?= e($r['rotulo']) ?>"><?= e(moeda($x)) ?></td>
              <?php endforeach; ?>
              <td data-rotulo="Demonstrativo"><?php if ($l['arquivo']): ?><a href="/transparencia/arquivo?id=<?= (int) $l['id'] ?>">PDF</a><?php else: ?>–<?php endif; ?></td>
            </tr>
            <?php if (trim((string) $l['observacao']) !== ''): ?>
              <tr class="tabela-obs"><td colspan="<?= count($rubricas) + 2 ?>"><?= e(ucfirst(mes_nome((int) $l['mes']))) ?>: <?= e($l['observacao']) ?></td></tr>
            <?php endif; ?>
          <?php endforeach; ?>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total do ano</th>
              <?php foreach ($rubricas as $r): ?><td data-rotulo="<?= e($r['rotulo']) ?>"><?= e(moeda($totais[$r['chave']])) ?></td><?php endforeach; ?>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p class="atualizado">Última atualização: <?= e(data_br(max(array_column($linhas, 'atualizado_em')))) ?>.</p>
    <?php endif; ?>

    <div class="texto-legal texto-estreito">
      <h2>O que é publicado aqui</h2>
      <ul>
        <li><strong>Emolumentos (parcela pública)</strong> e repasses aos fundos estaduais: <strong>FDJ</strong> (Fundo de Desenvolvimento da Justiça), <strong>FRMP</strong> (Fundo de Reaparelhamento do Ministério Público), <strong>FCRCPN</strong> (Fundo de Compensação dos Registradores Civis das Pessoas Naturais) e <strong>FUNAF</strong>, como define a norma do CNJ.</li>
        <li>O ISS é o imposto municipal sobre os serviços, recolhido ao Município de São José do Campestre.</li>
      </ul>
      <h2>Parcela privada e remuneração</h2>
      <p>A parcela privada dos emolumentos e as demais receitas e despesas privadas da serventia não são divulgadas abertamente. Quem tiver interesse legítimo pode pedir acesso por requerimento fundamentado à Corregedoria Geral de Justiça do RN, observada a LGPD (Resolução CNJ nº 215/2015, art. 6º, § 3º-B). A Corregedoria e os órgãos de controle têm acesso pleno a esses valores.</p>
      <p><a href="<?= e(cartorio('corregedoria_url')) ?>" rel="noopener" target="_blank">Portal do extrajudicial da Corregedoria do RN</a> · <a href="/contato?assunto=<?= rawurlencode('Pedido de informação') ?>">Pedir outra informação ao cartório</a></p>
    </div>
  </div>
</main>
<?php view('footer'); ?>
