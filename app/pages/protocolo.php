<?php
$resultado = null;
$erro = null;
$protocolo = strtoupper(trim((string) ($_POST['protocolo'] ?? $_GET['p'] ?? '')));
$codigo = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $codigo = strtoupper(trim((string) ($_POST['codigo'] ?? '')));
    if (!csrf_ok()) {
        $erro = 'A página ficou aberta por muito tempo. Digite os dados e consulte de novo.';
    } elseif (limite_excedido('consulta')) {
        $erro = 'Muitas consultas em pouco tempo a partir desta conexão. Aguarde 15 minutos e tente de novo.';
    } else {
        $resultado = consultar_protocolo($protocolo, $codigo);
        if (!$resultado) {
            registrar_tentativa('consulta');
            $erro = 'Não encontramos um pedido com esse protocolo e código. Confira se digitou como no e-mail recebido (por exemplo, PED-2026-000123 e código ABCD).';
        }
    }
} else {
    csrf_token();
}
$titulos = array_map(fn ($f) => $f['titulo'], formularios());
view('header', ['titulo' => 'Consultar protocolo', 'descricao' => 'Acompanhe seu pedido, manifestação ou solicitação no Cartório de São José do Campestre.']);
?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura form-layout">
    <div class="pagina-cabeca">
      <h1>Consultar protocolo</h1>
      <p class="lead">Informe o protocolo e o código de 4 letras que você recebeu ao enviar o pedido.</p>
      <ul class="lembretes">
        <li>Os dois estão no e-mail de confirmação e na tela exibida após o envio.</li>
        <li>Por segurança, a consulta mostra só a situação do pedido, sem dados pessoais.</li>
      </ul>
    </div>
    <div>
      <form class="formulario" method="post" action="/protocolo" novalidate>
        <?php if ($erro): ?><div class="alerta alerta-erro" role="alert" tabindex="-1" data-foco><?= e($erro) ?></div><?php endif; ?>
        <div class="linha-2 linha-protocolo">
          <div class="campo">
            <label for="c-protocolo">Protocolo</label>
            <input id="c-protocolo" name="protocolo" type="text" required autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="PED-2026-000123" value="<?= e($protocolo) ?>" maxlength="20">
          </div>
          <div class="campo">
            <label for="c-codigo">Código</label>
            <input id="c-codigo" name="codigo" type="text" required autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD" value="<?= e($codigo) ?>" maxlength="4">
          </div>
        </div>
        <?= csrf_field() ?>
        <button class="botao botao-primario" type="submit">Consultar</button>
      </form>

      <?php if ($resultado): ?>
        <section class="resultado" aria-labelledby="t-res" tabindex="-1" data-foco>
          <h2 id="t-res">Protocolo <?= e($resultado['protocolo']) ?></h2>
          <p class="resultado-status status-<?= status_classe($resultado['status']) ?>"><?= e($resultado['status']) ?></p>
          <dl>
            <div><dt>Tipo</dt><dd><?= e($titulos[$resultado['formulario']] ?? '') ?><?= $resultado['tipo'] && $resultado['formulario'] !== 'ouvidoria' ? ': ' . e($resultado['tipo']) : '' ?></dd></div>
            <div><dt>Recebido em</dt><dd><?= e(data_br($resultado['criado_em'])) ?></dd></div>
            <div><dt>Última atualização</dt><dd><?= e(data_br($resultado['atualizado_em'])) ?></dd></div>
          </dl>
          <?php if (trim((string) $resultado['retorno_publico']) !== ''): ?>
            <div class="retorno">
              <h3>Mensagem do cartório</h3>
              <p><?= nl2br(e($resultado['retorno_publico'])) ?></p>
            </div>
          <?php endif; ?>
        </section>
      <?php endif; ?>
    </div>
  </div>
</main>
<?php view('footer'); ?>
