<?php view('header', ['titulo' => 'Acessibilidade']); ?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Acessibilidade</h1>
      <p class="lead">Este site segue o Modelo de Acessibilidade em Governo Eletrônico (e-MAG) e as diretrizes WCAG 2.1, nível AA, como determina a Lei Brasileira de Inclusão (Lei nº 13.146/2015, art. 63).</p>
    </div>
    <div class="texto-legal texto-estreito">
      <h2>Atalhos de teclado</h2>
      <table class="tabela">
        <thead><tr><th scope="col">Tecla</th><th scope="col">Leva para</th></tr></thead>
        <tbody>
          <tr><td>Alt + 1</td><td>Conteúdo principal da página</td></tr>
          <tr><td>Alt + 2</td><td>Menu principal</td></tr>
          <tr><td>Alt + 4</td><td>Rodapé, com contatos e links de transparência</td></tr>
        </tbody>
      </table>
      <p>No Firefox use Alt + Shift + número; no Safari e no Mac, Control + Option + número. A tecla Tab percorre links, botões e campos em ordem, sempre com destaque visível.</p>

      <h2>Recursos da página</h2>
      <ul>
        <li><strong>Alto contraste:</strong> botão no topo de todas as páginas. A escolha fica salva neste navegador.</li>
        <li><strong>Tamanho da letra:</strong> botões A− e A+ no topo. Também funciona o zoom do navegador (Ctrl + e Ctrl −).</li>
        <li><strong>Leitores de tela:</strong> páginas com títulos organizados, imagens com descrição, campos de formulário com rótulos e mensagens de erro anunciadas.</li>
        <li><strong>Celular:</strong> o site se adapta a qualquer tamanho de tela, sem rolagem lateral.</li>
      </ul>

      <h2>Encontrou alguma barreira?</h2>
      <p>Conte para nós pela <a href="/ouvidoria">Ouvidoria</a> ou pelo telefone <a href="tel:<?= e(cartorio('telefone_link')) ?>"><?= e(cartorio('telefone')) ?></a>. O atendimento presencial é acessível e prioritário para pessoas com deficiência, idosos, gestantes e pessoas com crianças de colo.</p>
    </div>
  </div>
</main>
<?php view('footer'); ?>
