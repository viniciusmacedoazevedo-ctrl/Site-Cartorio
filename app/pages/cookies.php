<?php view('header', ['titulo' => 'Política de cookies']); ?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Política de cookies</h1>
      <p class="lead">Cookies são pequenos arquivos que o site grava no seu navegador. Aqui usamos só os indispensáveis.</p>
    </div>
    <div class="legal-corpo texto-legal texto-estreito">
      <h2>Cookies que usamos</h2>
      <table class="tabela">
        <thead><tr><th scope="col">Nome</th><th scope="col">Para que serve</th><th scope="col">Duração</th></tr></thead>
        <tbody>
          <tr><td>sjc_sessao</td><td>Protege os formulários contra envios falsos e mantém o acesso ao painel interno do cartório.</td><td>Até fechar o navegador</td></tr>
          <tr><td>sjc_contraste e sjc_fonte</td><td>Guardam, no próprio navegador (armazenamento local), se você ligou o alto contraste ou mudou o tamanho da letra.</td><td>Até você apagar os dados do navegador</td></tr>
          <tr><td>sjc_cookies</td><td>Lembra que você já leu este aviso, para ele não aparecer de novo.</td><td>1 ano</td></tr>
        </tbody>
      </table>
      <p>Esses cookies são essenciais: sem eles os formulários não funcionam com segurança. Por isso não podem ser desligados pelo site, mas você pode apagá-los nas configurações do navegador.</p>
      <h2>O que não usamos</h2>
      <p>Não usamos cookies de publicidade, de redes sociais nem de estatística de visitas. Não rastreamos sua navegação em outros sites.</p>
      <h2>Serviços de terceiros</h2>
      <p>As páginas do site não carregam nada de outras empresas: as fontes tipográficas e as imagens ficam no próprio site. Os links para mapas e para o WhatsApp só levam a esses serviços se você clicar neles.</p>
      <h2>Dúvidas</h2>
      <p>Fale com o Encarregado pelo tratamento de dados: <a href="mailto:<?= e(cartorio('emails.lgpd')) ?>"><?= e(cartorio('emails.lgpd')) ?></a>. Veja também o <a href="/privacidade">Aviso de privacidade</a>.</p>
      <p class="atualizado">Última atualização: <?= e(cartorio('cookies_atualizada_em')) ?>.</p>
    </div>
  </div>
</main>
<?php view('footer'); ?>
