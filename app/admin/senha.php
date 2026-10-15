<?php
$u = exigir_login();
$erro = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $atual = (string) ($_POST['atual'] ?? '');
    $nova = (string) ($_POST['nova'] ?? '');
    $hash = (string) q_val('SELECT senha_hash FROM usuarios WHERE id = ?', [$u['id']]);
    if (!csrf_ok()) {
        $erro = 'A página ficou aberta por muito tempo. Tente de novo.';
    } elseif (!password_verify($atual, $hash)) {
        $erro = 'A senha atual não confere.';
    } elseif ($nova !== (string) ($_POST['repetir'] ?? '')) {
        $erro = 'A nova senha e a confirmação são diferentes.';
    } elseif ($e = senha_forte($nova)) {
        $erro = $e;
    } else {
        q('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [password_hash($nova, PASSWORD_DEFAULT), $u['id']]);
        auditoria((int) $u['id'], 'senha_alterada', '');
        session_regenerate_id(true);
        flash('ok', 'Senha alterada.');
        redirect('/admin/registros');
    }
}
view('admin-header', ['u' => $u, 'titulo' => 'Minha senha']);
?>
<section class="adm-login">
  <h1>Alterar minha senha</h1>
  <?php if ($erro): ?><div class="adm-alerta adm-aviso" role="alert"><?= e($erro) ?></div><?php endif; ?>
  <form method="post" class="adm-form">
    <label for="s-atual">Senha atual</label>
    <input id="s-atual" name="atual" type="password" autocomplete="current-password" required>
    <label for="s-nova">Nova senha</label>
    <p class="adm-dica">Pelo menos 10 caracteres, com letras e números.</p>
    <input id="s-nova" name="nova" type="password" autocomplete="new-password" required>
    <label for="s-repetir">Repita a nova senha</label>
    <input id="s-repetir" name="repetir" type="password" autocomplete="new-password" required>
    <?= csrf_field() ?>
    <button class="adm-botao" type="submit">Salvar nova senha</button>
  </form>
</section>
<?php view('admin-footer'); ?>
