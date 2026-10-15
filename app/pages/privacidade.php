<?php
require __DIR__ . '/_envio.php';
[$valores, $erros, $msg] = processar_envio('lgpd');
view('header', ['titulo' => 'Privacidade e proteção de dados', 'descricao' => 'Aviso de privacidade, direitos dos titulares e formulário de solicitação LGPD do Cartório de São José do Campestre.']);
?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Privacidade e proteção de dados</h1>
      <p class="lead">Como tratamos seus dados pessoais e como você pode exercer seus direitos pela LGPD.</p>
    </div>
    <div class="legal-layout">
      <nav class="indice indice-vertical" aria-label="Nesta página">
        <a href="#aviso">Aviso de privacidade</a>
        <a href="#direitos">Direitos dos titulares</a>
        <a href="#solicitar">Fazer uma solicitação</a>
        <a href="/cookies">Política de cookies</a>
      </nav>
      <div class="legal-corpo">
        <section id="aviso" class="texto-legal" aria-labelledby="t-aviso">
          <h2 id="t-aviso">Aviso de privacidade e tratamento de dados pessoais</h2>
          <?php view('texto-aviso'); ?>
        </section>
        <section id="direitos" class="texto-legal" aria-labelledby="t-direitos">
          <h2 id="t-direitos">Direitos dos titulares</h2>
          <?php view('texto-direitos'); ?>
        </section>
        <section id="solicitar" aria-labelledby="t-solicitar">
          <h2 id="t-solicitar">Fazer uma solicitação</h2>
          <p>A solicitação é gratuita, recebe protocolo e vai para o canal de privacidade e para o Encarregado (DPO). Pedimos o CPF para confirmar que os dados são seus.</p>
          <form class="formulario" method="post" action="/privacidade#solicitar" novalidate>
            <?= aviso_geral($msg) ?>
            <?= campo('lgpd', 'direito', $valores, $erros) ?>
            <div class="linha-2">
              <?= campo('lgpd', 'nome', $valores, $erros) ?>
              <?= campo('lgpd', 'cpf', $valores, $erros) ?>
            </div>
            <div class="linha-2">
              <?= campo('lgpd', 'email', $valores, $erros) ?>
              <?= campo('lgpd', 'telefone', $valores, $erros) ?>
            </div>
            <?= campo('lgpd', 'mensagem', $valores, $erros) ?>
            <?= rodape_formulario('lgpd', $erros, 'Enviar solicitação') ?>
          </form>
        </section>
      </div>
    </div>
  </div>
</main>
<?php view('footer'); ?>
