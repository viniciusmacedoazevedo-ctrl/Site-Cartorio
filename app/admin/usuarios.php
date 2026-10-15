<?php
$u = exigir_admin();
$erros = [];
$novo = ['nome' => '', 'email' => '', 'perfil' => 'atendente'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_ok()) {
        flash('aviso', 'A página ficou aberta por muito tempo. Tente de novo.');
        redirect('/admin/usuarios');
    }
    $acao = $_POST['acao'] ?? '';
    if ($acao === 'criar') {
        $novo = [
            'nome' => mb_substr(trim((string) ($_POST['nome'] ?? '')), 0, 120),
            'email' => mb_strtolower(trim((string) ($_POST['email'] ?? ''))),
            'perfil' => ($_POST['perfil'] ?? '') === 'admin' ? 'admin' : 'atendente',
        ];
        $senha = (string) ($_POST['senha'] ?? '');
        if ($novo['nome'] === '') {
            $erros[] = 'Informe o nome.';
        }
        if (!filter_var($novo['email'], FILTER_VALIDATE_EMAIL)) {
            $erros[] = 'Informe um e-mail válido.';
        } elseif (q_val('SELECT id FROM usuarios WHERE email = ?', [$novo['email']])) {
            $erros[] = 'Já existe um usuário com esse e-mail.';
        }
        if ($e = senha_forte($senha)) {
            $erros[] = $e;
        }
        if (!$erros) {
            q('INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo, criado_em) VALUES (?, ?, ?, ?, 1, ?)',
                [$novo['nome'], $novo['email'], password_hash($senha, PASSWORD_DEFAULT), $novo['perfil'], now()]);
            auditoria((int) $u['id'], 'usuario_criado', $novo['email']);
            flash('ok', "Usuário {$novo['email']} criado. Passe a senha à pessoa por um canal seguro.");
            redirect('/admin/usuarios');
        }
    } elseif ($acao === 'alternar') {
        $alvo = (int) ($_POST['id'] ?? 0);
        if ($alvo === (int) $u['id']) {
            flash('aviso', 'Você não pode desativar o próprio acesso.');
        } else {
            q('UPDATE usuarios SET ativo = 1 - ativo WHERE id = ?', [$alvo]);
            auditoria((int) $u['id'], 'usuario_alternado', (string) $alvo);
            flash('ok', 'Acesso atualizado.');
        }
        redirect('/admin/usuarios');
    }
}

$usuarios = q('SELECT id, nome, email, perfil, ativo, ultimo_login FROM usuarios ORDER BY ativo DESC, nome')->fetchAll();
$log = q('SELECT a.*, u.nome FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id ORDER BY a.criado_em DESC, a.id DESC LIMIT 30')->fetchAll();
view('admin-header', ['u' => $u, 'titulo' => 'Usuários']);
?>
<div class="adm-cabeca"><h1>Usuários do painel</h1></div>
<div class="adm-detalhe">
  <section class="adm-cartao">
    <h2>Quem tem acesso</h2>
    <div class="adm-tabela-wrap">
      <table class="adm-tabela">
        <thead><tr><th scope="col">Nome</th><th scope="col">Perfil</th><th scope="col">Último acesso</th><th scope="col">Acesso</th></tr></thead>
        <tbody>
        <?php foreach ($usuarios as $x): ?>
          <tr<?= $x['ativo'] ? '' : ' class="adm-inativo"' ?>>
            <td><?= e($x['nome']) ?><br><small><?= e($x['email']) ?></small></td>
            <td><?= $x['perfil'] === 'admin' ? 'Administrador' : 'Atendente' ?></td>
            <td><?= $x['ultimo_login'] ? e(data_br($x['ultimo_login'])) : 'Nunca' ?></td>
            <td>
              <?php if ((int) $x['id'] !== (int) $u['id']): ?>
                <form method="post"><?= csrf_field() ?><input type="hidden" name="acao" value="alternar"><input type="hidden" name="id" value="<?= (int) $x['id'] ?>">
                  <button class="adm-link" type="submit"><?= $x['ativo'] ? 'Desativar' : 'Reativar' ?></button></form>
              <?php else: ?>Você<?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <p class="adm-dica">Administrador vê todos os registros e gerencia usuários. Atendente não vê solicitações LGPD nem denúncias da ouvidoria.</p>
  </section>
  <section class="adm-cartao">
    <h2>Adicionar usuário</h2>
    <?php if ($erros): ?><div class="adm-alerta adm-aviso" role="alert"><?= implode('<br>', array_map('e', $erros)) ?></div><?php endif; ?>
    <form method="post" class="adm-form">
      <label for="u-nome">Nome</label>
      <input id="u-nome" name="nome" required value="<?= e($novo['nome']) ?>">
      <label for="u-email">E-mail</label>
      <input id="u-email" name="email" type="email" required value="<?= e($novo['email']) ?>">
      <label for="u-perfil">Perfil</label>
      <select id="u-perfil" name="perfil">
        <option value="atendente"<?= $novo['perfil'] === 'atendente' ? ' selected' : '' ?>>Atendente</option>
        <option value="admin"<?= $novo['perfil'] === 'admin' ? ' selected' : '' ?>>Administrador</option>
      </select>
      <label for="u-senha">Senha inicial</label>
      <p class="adm-dica">Pelo menos 10 caracteres, com letras e números.</p>
      <input id="u-senha" name="senha" type="password" autocomplete="new-password" required>
      <input type="hidden" name="acao" value="criar">
      <?= csrf_field() ?>
      <button class="adm-botao" type="submit">Adicionar usuário</button>
    </form>
  </section>
</div>
<section class="adm-cartao adm-auditoria">
  <h2>Últimas ações registradas</h2>
  <div class="adm-tabela-wrap">
    <table class="adm-tabela">
      <thead><tr><th scope="col">Quando</th><th scope="col">Quem</th><th scope="col">Ação</th><th scope="col">Detalhe</th><th scope="col">IP</th></tr></thead>
      <tbody>
      <?php foreach ($log as $l): ?>
        <tr><td><?= e(data_br($l['criado_em'])) ?></td><td><?= e($l['nome'] ?? '—') ?></td><td><?= e(str_replace('_', ' ', $l['acao'])) ?></td><td><?= e($l['alvo']) ?></td><td><?= e($l['ip']) ?></td></tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</section>
<?php view('admin-footer'); ?>
