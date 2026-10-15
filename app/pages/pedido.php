<?php
require __DIR__ . '/_envio.php';
[$valores, $erros, $msg] = processar_envio('pedido');
$mapaDocs = [];
foreach (require APP_DIR . '/content/servicos.php' as $g) {
    foreach ($g['itens'] as $sv) {
        $mapaDocs[$sv['slug']] = ['nome' => $sv['nome'], 'docs' => $sv['docs']];
    }
}
view('header', ['titulo' => 'Solicitação e agendamento online', 'descricao' => 'Peça um serviço ou agende atendimento no Cartório de São José do Campestre e receba o protocolo por e-mail.']);
?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura form-layout">
    <div class="pagina-cabeca">
      <h1>Solicitação e agendamento online</h1>
      <p class="lead">Opção para adiantar seu atendimento: conte o que precisa ou sugira uma data. O ato é praticado no cartório, com os documentos obrigatórios de cada serviço.</p>
      <ul class="lembretes">
        <li>Veja antes os documentos de cada serviço na <a href="/servicos">Carta de Serviços</a>.</li>
        <li>Os valores seguem a <a href="<?= e(cartorio('tabela_custas.arquivo')) ?>" download>tabela de custas 2026</a>.</li>
        <li>O agendamento é confirmado pelo cartório por e-mail ou telefone.</li>
        <li>Campos sem a marca “opcional” são obrigatórios.</li>
      </ul>
    </div>
    <form class="formulario" method="post" action="/pedido" enctype="multipart/form-data" novalidate>
      <?= aviso_geral($msg) ?>
      <?= campo('pedido', 'servico', $valores, $erros) ?>
      <aside class="docs-servico" id="docs-servico" aria-live="polite" hidden data-docs="<?= e(json_encode($mapaDocs, JSON_UNESCAPED_UNICODE)) ?>"><h3>Documentos obrigatórios</h3><ul></ul></aside>
      <?= campo('pedido', 'modalidade', $valores + ['modalidade' => 'Pedido online'], $erros) ?>
      <div class="agendamento" data-agendamento data-feriados="<?= e(json_encode(feriados_agendamento(), JSON_UNESCAPED_UNICODE)) ?>">
        <?= campo('pedido', 'data_preferida', $valores, $erros) ?>
        <?= campo('pedido', 'periodo', $valores, $erros) ?>
      </div>
      <?= campo('pedido', 'nome', $valores, $erros) ?>
      <?= campo('pedido', 'cpf', $valores, $erros) ?>
      <div class="linha-2">
        <?= campo('pedido', 'email', $valores, $erros) ?>
        <?= campo('pedido', 'telefone', $valores, $erros) ?>
      </div>
      <?= campo('pedido', 'mensagem', $valores, $erros) ?>
      <?= campo('pedido', 'anexo', $valores, $erros) ?>
      <?= rodape_formulario('pedido', $erros, 'Enviar pedido') ?>
    </form>
  </div>
</main>
<?php view('footer'); ?>
