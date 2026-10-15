<?php
if (usuario_atual()) {
    redirect('/admin/registros');
}
$erro = null;
$email = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim((string) ($_POST['email'] ?? ''));
    if (!csrf_ok()) {
        $erro = 'A página ficou aberta por muito tempo. Entre de novo.';
    } elseif (limite_excedido('login')) {
        $erro = 'Muitas tentativas a partir desta conexão. Aguarde 15 minutos.';
    } else {
        [$ok, $msg] = entrar($email, (string) ($_POST['senha'] ?? ''));
        if ($ok) {
            redirect('/admin/registros');
        }
        registrar_tentativa('login');
        $erro = $msg;
    }
}
view('admin-header', ['titulo' => 'Entrar']);
?>
<section class="adm-login">
  <h1>Entrar no painel</h1>
  <p>Acesso restrito à equipe do cartório. Todas as ações ficam registradas.</p>
  <?php if ($erro): ?><div class="adm-alerta adm-aviso" role="alert"><?= e($erro) ?></div><?php endif; ?>
  <form method="post" action="/admin" class="adm-form">
    <label for="l-email">E-mail</label>
    <input id="l-email" name="email" type="email" autocomplete="username" required value="<?= e($email) ?>">
    <label for="l-senha">Senha</label>
    <input id="l-senha" name="senha" type="password" autocomplete="current-password" required>
    <?= csrf_field() ?>
    <button class="adm-botao" type="submit">Entrar</button>
  </form>
</section>
<?php view('admin-footer'); ?>
