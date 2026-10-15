<?php
$em = cartorio('emails');
view('header', ['titulo' => 'A serventia', 'descricao' => 'Identificação do Serviço Notarial e Registral de São José do Campestre/RN: titular, CNS, CNPJ, atribuições e contatos.']);
?>
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>A serventia</h1>
      <p class="lead">O <?= e(cartorio('nome_oficial')) ?> é um serviço público delegado pelo Poder Judiciário e fiscalizado pela Corregedoria Geral de Justiça do Rio Grande do Norte.</p>
    </div>
    <div class="ficha-oficial">
      <dl>
        <div><dt>Denominação</dt><dd><?= e(cartorio('nome_oficial')) ?></dd></div>
        <div><dt><?= e(cartorio('responsavel_tipo')) ?></dt><dd><?= e(cartorio('titular')) ?>, <?= e(cartorio('titular_cargo')) ?></dd></div>
        <div><dt>Código Nacional da Serventia (CNS)</dt><dd><?= e(cartorio('cns')) ?></dd></div>
        <div><dt>CNPJ</dt><dd><?= e(cartorio('cnpj')) ?></dd></div>
        <div><dt>Atribuições</dt><dd><ul><?php foreach (cartorio('atribuicoes') as $a): ?><li><?= e($a) ?></li><?php endforeach; ?></ul></dd></div>
        <div><dt>Endereço</dt><dd><?= e(cartorio('endereco')) ?>, <?= e(cartorio('cidade')) ?>, CEP <?= e(cartorio('cep')) ?><br><a href="<?= e(cartorio('mapa_url')) ?>" rel="noopener" target="_blank">Abrir no mapa</a></dd></div>
        <div><dt>Horário de atendimento</dt><dd><?= e(cartorio('horario')) ?></dd></div>
        <div><dt>Telefone e WhatsApp</dt><dd><a href="tel:<?= e(cartorio('telefone_link')) ?>"><?= e(cartorio('telefone')) ?></a> · <a href="https://wa.me/<?= e(cartorio('whatsapp_link')) ?>"><?= e(cartorio('whatsapp')) ?></a></dd></div>
        <div><dt>E-mail institucional</dt><dd><a href="mailto:<?= e($em['contato']) ?>"><?= e($em['contato']) ?></a></dd></div>
        <div><dt><?= e(cartorio('titular_cargo')) ?></dt><dd><a href="mailto:<?= e($em['notaria']) ?>"><?= e($em['notaria']) ?></a></dd></div>
        <div><dt>Encarregado de dados (DPO)</dt><dd><?= e(cartorio('dpo_nome')) ?>, <a href="mailto:<?= e(cartorio('dpo_email')) ?>"><?= e(cartorio('dpo_email')) ?></a></dd></div>
        <div><dt>Ouvidoria</dt><dd><a href="/ouvidoria">Formulário com protocolo</a> ou <a href="mailto:<?= e($em['ouvidoria']) ?>"><?= e($em['ouvidoria']) ?></a></dd></div>
        <div><dt>Ética e denúncia de fraudes</dt><dd><a href="mailto:<?= e($em['compliance']) ?>"><?= e($em['compliance']) ?></a>, <?= e(cartorio('etica_telefone')) ?></dd></div>
        <div><dt>Fiscalização</dt><dd>Corregedoria Geral de Justiça do RN – <a href="<?= e(cartorio('corregedoria_url')) ?>" rel="noopener" target="_blank">portal do extrajudicial</a></dd></div>
      </dl>
    </div>
  </div>
</main>
<?php view('footer'); ?>
