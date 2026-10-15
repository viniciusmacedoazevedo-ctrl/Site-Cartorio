<?php
$tabela = cartorio('tabela_custas');
view('header', ['titulo' => 'Emolumentos e gratuidades', 'descricao' => 'Tabela oficial de emolumentos do RN 2026 e atos gratuitos por lei no Cartório de São José do Campestre.']);
?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Emolumentos e gratuidades</h1>
      <p class="lead">Os valores dos atos são fixados por lei estadual e são os mesmos em todos os cartórios do Rio Grande do Norte.</p>
    </div>
    <div class="texto-legal texto-estreito">
      <section class="tabela-download" aria-labelledby="t-tabela">
        <h2 id="t-tabela"><?= e($tabela['titulo']) ?></h2>
        <p><?= e($tabela['detalhe']) ?>. Inclui emolumentos, taxas destinadas aos fundos (FDJ, FRMP, FCRCPN, FUNAF) e ISS de 5%.</p>
        <a class="botao botao-ouro" href="<?= e($tabela['arquivo']) ?>" download>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M11 3h2v9.6l3.3-3.3 1.4 1.4L12 16.4l-5.7-5.7 1.4-1.4 3.3 3.3V3ZM5 19h14v2H5z"/></svg>
          Baixar tabela de custas (PDF, <?= e($tabela['tamanho']) ?>)
        </a>
      </section>

      <h2>Como os valores são cobrados</h2>
      <ul>
        <li>Os emolumentos seguem a tabela oficial (Lei nº 8.935/1994 e Lei nº 10.169/2000). Nenhum valor fora da tabela pode ser cobrado.</li>
        <li>Todo ato recebe o selo digital de fiscalização do TJRN e você recebe recibo com os valores discriminados.</li>
        <li>Parte do valor pago é repassada aos fundos públicos e ao Município. Esses repasses são publicados mês a mês na página de <a href="/transparencia">Transparência</a>.</li>
      </ul>

      <h2 id="gratuidades">Atos gratuitos por lei</h2>
      <table class="tabela">
        <thead><tr><th scope="col">Ato</th><th scope="col">Quem tem direito</th><th scope="col">Base legal</th></tr></thead>
        <tbody>
          <tr><td>Registro de nascimento e primeira certidão</td><td>Todas as pessoas</td><td>Lei nº 9.534/1997</td></tr>
          <tr><td>Registro de óbito e de natimorto e primeira certidão</td><td>Todas as pessoas</td><td>Lei nº 9.534/1997</td></tr>
          <tr><td>Demais certidões do registro civil (segundas vias)</td><td>Pessoas reconhecidamente pobres, mediante declaração</td><td>Constituição Federal, art. 5º, LXXVI; Lei nº 9.534/1997</td></tr>
          <tr><td>Habilitação, registro e primeira certidão de casamento</td><td>Quem se declarar pobre, sob as penas da lei</td><td>Código Civil, art. 1.512, parágrafo único</td></tr>
          <tr><td>Escrituras de inventário, partilha, separação e divórcio consensuais</td><td>Quem declarar não ter condições de pagar, com assistência de advogado</td><td>Resolução CNJ nº 35/2007, arts. 6º e 7º</td></tr>
          <tr><td>Atos necessários para cumprir decisão judicial</td><td>Beneficiário da gratuidade da justiça concedida no processo</td><td>Código de Processo Civil, art. 98, § 1º, IX</td></tr>
        </tbody>
      </table>
      <p>Para pedir a gratuidade, informe no atendimento e assine a declaração de hipossuficiência. A declaração falsa sujeita o declarante às sanções legais. Outras hipóteses previstas na legislação do Rio Grande do Norte também são aplicadas.</p>
      <p>Dúvidas sobre valores ou gratuidade: <a href="tel:<?= e(cartorio('telefone_link')) ?>"><?= e(cartorio('telefone')) ?></a> ou <a href="/ouvidoria">Ouvidoria</a>.</p>
    </div>
  </div>
</main>
<?php view('footer'); ?>
