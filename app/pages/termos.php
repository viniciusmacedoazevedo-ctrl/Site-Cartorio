<?php view('header', ['titulo' => 'Termos de uso']); ?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Termos de uso do site</h1>
      <p class="lead">Regras para usar este site e os seus formulários. Ao usar o site, você concorda com estes termos.</p>
    </div>
    <div class="texto-legal texto-estreito">
      <h2>1. Finalidade</h2>
      <p>Este site é o canal institucional do <?= e(cartorio('nome_oficial')) ?>, responsável <?= e(cartorio('titular')) ?>, CNS <?= e(cartorio('cns')) ?>, CNPJ <?= e(cartorio('cnpj')) ?>. Ele informa sobre os serviços, valores, gratuidades e transparência da serventia e recebe solicitações, manifestações de ouvidoria e pedidos dos titulares de dados.</p>

      <h2>2. Solicitações pelo site</h2>
      <ul>
        <li>Enviar um formulário <strong>não equivale à prática do ato</strong>. O ato notarial ou de registro só existe depois de lavrado ou registrado pelo cartório, com o selo digital de fiscalização.</li>
        <li>O protocolo do site serve para acompanhar o atendimento. Ele não garante prioridade nem substitui o protocolo oficial de títulos apresentados para registro.</li>
        <li>Prazos, valores e documentos seguem a legislação e a <a href="/emolumentos">tabela oficial de emolumentos</a>.</li>
      </ul>

      <h2>3. Responsabilidades do usuário</h2>
      <ul>
        <li>Informar dados verdadeiros e próprios, ou de quem você representa legalmente. Declaração falsa pode configurar crime.</li>
        <li>Enviar apenas arquivos dos quais você tenha o direito de uso, sem vírus ou conteúdo ilícito.</li>
        <li>Não tentar acessar áreas restritas, sobrecarregar o site ou usar robôs para enviar formulários.</li>
        <li>Guardar o protocolo e o código de consulta: quem os tiver poderá ver a situação do pedido.</li>
      </ul>

      <h2>4. Privacidade</h2>
      <p>Os dados pessoais enviados são tratados conforme o <a href="/privacidade#aviso">Aviso de privacidade</a>, a Lei Geral de Proteção de Dados e as normas do CNJ. O site usa apenas os cookies descritos na <a href="/cookies">Política de cookies</a>.</p>

      <h2>5. Disponibilidade e conteúdo</h2>
      <p>O cartório se esforça para manter o site disponível e as informações atualizadas, mas pode haver interrupções para manutenção. Em caso de divergência, prevalecem a legislação e a orientação dada no atendimento. Os links para sites de terceiros, como as centrais nacionais e órgãos públicos, levam a serviços com regras próprias.</p>

      <h2>6. Alterações</h2>
      <p>Estes termos podem ser atualizados a qualquer tempo. A versão vigente é sempre a publicada nesta página.</p>

      <h2>7. Contato</h2>
      <p>Dúvidas sobre estes termos: <a href="mailto:<?= e(cartorio('emails.contato')) ?>"><?= e(cartorio('emails.contato')) ?></a>. Sobre dados pessoais: <a href="mailto:<?= e(cartorio('emails.lgpd')) ?>"><?= e(cartorio('emails.lgpd')) ?></a>.</p>
      <p class="atualizado">Última atualização: <?= e(cartorio('politicas_atualizadas_em')) ?>.</p>
    </div>
  </div>
</main>
<?php view('footer'); ?>
