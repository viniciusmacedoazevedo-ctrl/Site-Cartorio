<?php
$u = $u ?? null;
$titulo = $titulo ?? 'Painel';
$atual = current_path();
?><!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= e($titulo) ?> – Painel do cartório</title>
<link rel="icon" type="image/png" href="/assets/img/brasao.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bitter:wght@600;700&display=swap">
<link rel="stylesheet" href="/assets/css/admin.css?v=2">
</head>
<body class="adm">
<header class="adm-topo">
  <div class="adm-largura adm-topo-in">
    <a class="adm-marca" href="<?= $u ? '/admin/registros' : '/admin' ?>">
      <img src="/assets/img/brasao.png" alt="" width="30" height="32">
      <span>Painel do cartório</span>
    </a>
    <?php if ($u): ?>
      <nav class="adm-menu" aria-label="Painel">
        <a href="/admin/registros"<?= $atual === '/admin/registros' || $atual === '/admin/registro' ? ' aria-current="page"' : '' ?>>Registros</a>
        <?php if ($u['perfil'] === 'admin'): ?>
          <a href="/admin/transparencia"<?= $atual === '/admin/transparencia' ? ' aria-current="page"' : '' ?>>Transparência</a>
          <a href="/admin/usuarios"<?= $atual === '/admin/usuarios' ? ' aria-current="page"' : '' ?>>Usuários</a>
        <?php endif; ?>
        <a href="/admin/senha"<?= $atual === '/admin/senha' ? ' aria-current="page"' : '' ?>>Minha senha</a>
        <form method="post" action="/admin/sair"><?= csrf_field() ?><button type="submit">Sair</button></form>
      </nav>
      <p class="adm-quem"><?= e($u['nome']) ?> <span><?= $u['perfil'] === 'admin' ? 'Administrador' : 'Atendente' ?></span></p>
    <?php endif; ?>
  </div>
</header>
<main class="adm-largura adm-main" id="conteudo">
<?php if ($msg = flash('ok')): ?><div class="adm-alerta adm-ok" role="status"><?= e($msg) ?></div><?php endif; ?>
<?php if ($msg = flash('aviso')): ?><div class="adm-alerta adm-aviso" role="alert"><?= e($msg) ?></div><?php endif; ?>
