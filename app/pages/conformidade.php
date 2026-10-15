<?php view('header', ['titulo' => 'Conformidade com o CNJ', 'descricao' => 'Normas do CNJ e da LGPD atendidas pelo Cartório de São José do Campestre.']); ?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca conformidade-cabeca">
      <?php view('selo', ['id' => 'conf']); ?>
      <div>
        <h1>Atende 100% aos requisitos do CNJ</h1>
        <p class="lead">O cartório segue as normas do Conselho Nacional de Justiça para tecnologia, segurança da informação e proteção de dados pessoais.</p>
      </div>
    </div>
    <div class="texto-legal texto-estreito">
      <table class="tabela">
        <thead><tr><th scope="col">Norma</th><th scope="col">O que exige</th><th scope="col">Como atendemos</th></tr></thead>
        <tbody>
          <tr><td>Provimento CNJ nº 213/2026</td><td>Padrões de tecnologia e segurança da informação: políticas de segurança, cópias de segurança, controle de acesso, continuidade do serviço e conformidade com a LGPD.</td><td>Política de segurança, backups, acesso restrito e registrado aos sistemas, Encarregado de dados designado e canal para os titulares.</td></tr>
          <tr><td>Provimento CNJ nº 243/2026</td><td>Atualiza o Provimento 213: enquadramento das serventias e prazos de implantação; quem terceiriza continua responsável.</td><td>Fornecedores de tecnologia contratados e acompanhados pela serventia; sistemas mantidos em versões com suporte.</td></tr>
          <tr><td>Resolução CNJ nº 215/2015, art. 6º, § 3º (redação da Resolução CNJ nº 670/2025)</td><td>Campo “Transparência” com as receitas públicas mensais (parcela pública dos emolumentos e fundos) e despesas públicas; parcela privada com acesso condicionado.</td><td><a href="/transparencia">Página de Transparência</a> atualizada mês a mês, com orientação para pedidos de acesso à Corregedoria.</td></tr>
          <tr><td>Lei Geral de Proteção de Dados (Lei nº 13.709/2018), Resolução CNJ nº 363/2021 e Provimento CNJ nº 134/2022</td><td>Política de privacidade, termos de uso, Encarregado identificado e canal para os direitos dos titulares.</td><td><a href="/privacidade#aviso">Aviso de privacidade</a>, <a href="/termos">termos de uso</a>, <a href="/privacidade#solicitar">formulário com protocolo</a> e <a href="/cookies">cookies apenas essenciais</a>.</td></tr>
          <tr><td>Lei nº 8.935/1994 e Lei nº 10.169/2000</td><td>Tabela oficial de emolumentos à disposição do usuário.</td><td><a href="/emolumentos">Tabela de custas 2026</a> para download e explicação da cobrança.</td></tr>
          <tr><td>Lei nº 9.534/1997, Código Civil e Resolução CNJ nº 35/2007</td><td>Informação sobre os atos gratuitos.</td><td><a href="/emolumentos#gratuidades">Quadro de gratuidades</a> e indicação em cada serviço da <a href="/servicos">Carta de Serviços</a>.</td></tr>
          <tr><td>Identificação da serventia</td><td>Titular, Código Nacional da Serventia (CNS), atribuições, endereço, contatos e horário.</td><td>Página <a href="/serventia">A serventia</a> e rodapé de todas as páginas.</td></tr>
          <tr><td>Lei Brasileira de Inclusão (Lei nº 13.146/2015) e e-MAG</td><td>Site acessível a pessoas com deficiência.</td><td>Atalhos de teclado, alto contraste, ajuste da letra e compatibilidade com leitores de tela. <a href="/acessibilidade">Detalhes</a>.</td></tr>
        </tbody>
      </table>
      <h2>Canais de transparência</h2>
      <ul>
        <li>Ouvidoria: <a href="/ouvidoria">formulário com protocolo</a> ou <a href="mailto:<?= e(cartorio('emails.ouvidoria')) ?>"><?= e(cartorio('emails.ouvidoria')) ?></a></li>
        <li>Linha de apoio à ética e denúncia de fraudes: <a href="mailto:<?= e(cartorio('emails.compliance')) ?>"><?= e(cartorio('emails.compliance')) ?></a>, <?= e(cartorio('etica_telefone')) ?></li>
        <li>Encarregado (DPO): <?= e(cartorio('dpo_nome')) ?>, <a href="mailto:<?= e(cartorio('dpo_email')) ?>"><?= e(cartorio('dpo_email')) ?></a></li>
      </ul>
    </div>
  </div>
</main>
<?php view('footer'); ?>
