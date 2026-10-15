<?php
/** @var string $titulo */
$titulo = $titulo ?? '';
$descricao = $descricao ?? 'Cartório de São José do Campestre/RN: notas, protesto, registro civil, imóveis, títulos e documentos e certificado digital. Carta de serviços, emolumentos, transparência e ouvidoria.';
$atual = current_path();
$menu = [
    '/' => 'Início',
    '/serventia' => 'A serventia',
    '/servicos' => 'Serviços',
    '/emolumentos' => 'Emolumentos',
    '/transparencia' => 'Transparência',
    '/ouvidoria' => 'Ouvidoria',
    '/contato' => 'Contato',
];
$paginaTitulo = ($titulo ? "$titulo – " : '') . cartorio('nome_curto');
?><!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($paginaTitulo) ?></title>
<meta name="description" content="<?= e($descricao) ?>">
<meta name="theme-color" content="#0B5D59">
<link rel="icon" type="image/png" href="/assets/img/brasao.png">
<link rel="preload" href="/assets/fonts/atkinson-hyperlegible-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/bitter-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fontes.css?v=1">
<link rel="stylesheet" href="/assets/css/site.css?v=5">
<script src="/assets/js/js.js"></script>
<meta property="og:title" content="<?= e($paginaTitulo) ?>">
<meta property="og:description" content="<?= e($descricao) ?>">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
</head>
<body>
<header class="topo">
  <div class="topo-faixa">
    <div class="largura topo-faixa-in">
      <ul class="atalhos" aria-label="Atalhos de teclado">
        <li><a href="#conteudo" accesskey="1">Ir para o conteúdo <span>1</span></a></li>
        <li><a href="#menu-principal" accesskey="2">Ir para o menu <span>2</span></a></li>
        <li><a href="#rodape" accesskey="4">Ir para o rodapé <span>4</span></a></li>
      </ul>
      <ul class="utilidades">
        <li><a href="/protocolo">Consultar protocolo</a></li>
        <li><a href="/validacao">Validar selo</a></li>
        <li><a href="/acessibilidade">Acessibilidade</a></li>
        <li><button type="button" data-contraste aria-pressed="false">Alto contraste</button></li>
        <li class="fonte"><button type="button" data-fonte="-1" aria-label="Diminuir letra">A−</button><button type="button" data-fonte="1" aria-label="Aumentar letra">A+</button></li>
      </ul>
    </div>
  </div>
  <div class="largura topo-in">
    <a class="marca" href="/" aria-label="<?= e(cartorio('nome_curto')) ?> – página inicial">
      <img src="/assets/img/brasao.png" alt="" width="46" height="48">
      <span class="marca-texto">
        <span class="marca-nome">Cartório de São José do Campestre</span>
        <span class="marca-sub">Serviço Notarial e Registral</span>
      </span>
    </a>
    <button class="menu-botao" type="button" aria-expanded="false" aria-controls="menu-principal">Menu</button>
    <nav id="menu-principal" class="menu" aria-label="Principal" tabindex="-1">
      <ul>
        <?php foreach ($menu as $href => $rot): ?>
          <li><a href="<?= $href ?>"<?= $atual === $href ? ' aria-current="page"' : '' ?>><?= e($rot) ?></a></li>
        <?php endforeach; ?>
      </ul>
    </nav>
  </div>
</header>
<?php if ($titulo !== ''): ?>
<nav class="trilha" aria-label="Você está em">
  <ol class="largura">
    <li><a href="/">Início</a></li>
    <li aria-current="page"><?= e($titulo) ?></li>
  </ol>
</nav>
<?php endif; ?>
