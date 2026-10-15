<?php $em = cartorio('emails'); ?>
<footer class="rodape" id="rodape" tabindex="-1">
  <div class="largura rodape-grade">
    <section class="rodape-bloco rodape-id" aria-label="Identificação da serventia">
      <img src="/assets/img/brasao.png" alt="" width="40" height="42">
      <p class="rodape-nome"><?= e(cartorio('nome_oficial')) ?></p>
      <p>CNS <?= e(cartorio('cns')) ?> · CNPJ <?= e(cartorio('cnpj')) ?></p>
      <p><?= e(cartorio('titular_cargo')) ?>: <?= e(cartorio('titular')) ?></p>
      <p><?= e(cartorio('endereco')) ?><br><?= e(cartorio('cidade')) ?>, CEP <?= e(cartorio('cep')) ?></p>
      <p><?= e(cartorio('horario')) ?></p>
    </section>
    <section class="rodape-bloco" aria-labelledby="rod-contato">
      <h2 id="rod-contato">Atendimento</h2>
      <p>Telefone <a href="tel:<?= e(cartorio('telefone_link')) ?>"><?= e(cartorio('telefone')) ?></a></p>
      <p>WhatsApp <a href="https://wa.me/<?= e(cartorio('whatsapp_link')) ?>"><?= e(cartorio('whatsapp')) ?></a></p>
      <p><a href="mailto:<?= e($em['contato']) ?>"><?= e($em['contato']) ?></a></p>
      <p class="rodape-pessoa"><?= e(cartorio('titular_cargo')) ?><br><strong><?= e(cartorio('titular')) ?></strong><br><a href="mailto:<?= e($em['notaria']) ?>"><?= e($em['notaria']) ?></a></p>
    </section>
    <section class="rodape-bloco" aria-labelledby="rod-dados">
      <h2 id="rod-dados">Proteção de dados</h2>
      <p class="rodape-pessoa">Encarregado (DPO)<br><strong><?= e(cartorio('dpo_nome')) ?></strong><br><a href="mailto:<?= e(cartorio('dpo_email')) ?>"><?= e(cartorio('dpo_email')) ?></a></p>
      <p class="rodape-pessoa">Solicitação dos direitos dos titulares<br><a href="mailto:<?= e($em['lgpd']) ?>"><?= e($em['lgpd']) ?></a></p>
      <p class="rodape-pessoa">Linha de apoio à ética e denúncia de fraudes<br><a href="mailto:<?= e($em['compliance']) ?>"><?= e($em['compliance']) ?></a><br><?= e(cartorio('etica_telefone')) ?></p>
    </section>
    <nav class="rodape-bloco rodape-transparencia" aria-labelledby="rod-links">
      <h2 id="rod-links">Transparência</h2>
      <ul>
        <li><a href="/transparencia">Transparência</a></li>
        <li><a href="/emolumentos">Emolumentos e gratuidades</a></li>
        <li><a href="<?= e(cartorio('tabela_custas.arquivo')) ?>" download>Tabela de custas 2026 (PDF)</a></li>
        <li><a href="/serventia">A serventia</a></li>
        <li><a href="/validacao">Validar selo</a></li>
        <li><a href="/validacao#centrais">Centrais nacionais</a></li>
        <li><a href="/conformidade">Conformidade com o CNJ</a></li>
        <li><a href="/privacidade#aviso" data-dialogo="aviso-privacidade">Aviso de privacidade</a></li>
        <li><a href="/privacidade#direitos" data-dialogo="direitos-titulares">Direitos dos titulares</a></li>
        <li><a href="/termos">Termos de uso</a></li>
        <li><a href="/cookies">Política de cookies</a></li>
        <li><a href="/acessibilidade">Acessibilidade</a></li>
        <li><a href="/ouvidoria">Ouvidoria</a></li>
        <li><a href="/pedido">Solicitação e agendamento online</a></li>
        <li><a href="/protocolo">Consultar protocolo</a></li>
      </ul>
    </nav>
  </div>
  <div class="largura rodape-fim">
    <p>© <?= date('Y') ?> <?= e(cartorio('nome_oficial')) ?>. Serviço público delegado, fiscalizado pelo Poder Judiciário do Rio Grande do Norte.</p>
  </div>
</footer>

<a class="whatsapp" href="https://wa.me/<?= e(cartorio('whatsapp_link')) ?>?text=<?= rawurlencode('Olá! Vim pelo site do cartório.') ?>" aria-label="Conversar pelo WhatsApp <?= e(cartorio('whatsapp')) ?>">
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.8 11.8 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
  <span>WhatsApp</span>
</a>

<dialog class="dialogo" id="aviso-privacidade" aria-labelledby="dlg-aviso-titulo">
  <div class="dialogo-topo">
    <h2 id="dlg-aviso-titulo">Aviso de privacidade e tratamento de dados pessoais</h2>
    <button type="button" class="dialogo-fechar" data-fechar>Fechar</button>
  </div>
  <div class="dialogo-corpo texto-legal"><?php view('texto-aviso'); ?></div>
</dialog>

<dialog class="dialogo" id="direitos-titulares" aria-labelledby="dlg-direitos-titulo">
  <div class="dialogo-topo">
    <h2 id="dlg-direitos-titulo">Direitos dos titulares de dados</h2>
    <button type="button" class="dialogo-fechar" data-fechar>Fechar</button>
  </div>
  <div class="dialogo-corpo texto-legal"><?php view('texto-direitos'); ?>
    <p><a class="botao botao-primario" href="/privacidade#solicitar">Fazer minha solicitação</a></p>
  </div>
</dialog>

<div class="cookies" id="aviso-cookies" role="region" aria-label="Aviso sobre cookies" hidden>
  <p>Este site usa apenas cookies essenciais, necessários para a segurança dos formulários e do atendimento. Não usamos cookies de publicidade nem de estatística. <a href="/cookies">Ler a política de cookies</a>.</p>
  <button type="button" class="botao botao-claro" data-aceitar-cookies>Aceitar e fechar</button>
</div>

<script src="/assets/js/site.js?v=2" defer></script>
</body>
</html>
