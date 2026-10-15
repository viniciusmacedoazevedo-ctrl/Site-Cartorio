<?php
$u = exigir_login();
$id = (int) ($_GET['id'] ?? 0);
$reg = q_one('SELECT * FROM registros WHERE id = ? AND ' . filtro_perfil($u), [$id]);
if (!$reg) {
    flash('aviso', 'Registro não encontrado ou sem permissão para o seu perfil.');
    redirect('/admin/registros');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_ok()) {
        flash('aviso', 'A página ficou aberta por muito tempo. Faça a alteração de novo.');
        redirect("/admin/registro?id=$id");
    }
    $acao = $_POST['acao'] ?? '';
    if ($acao === 'atualizar') {
        $status = in_array($_POST['status'] ?? '', STATUS, true) ? $_POST['status'] : $reg['status'];
        $retorno = mb_substr(trim((string) ($_POST['retorno_publico'] ?? '')), 0, 2000);
        $mudou = [];
        if ($status !== $reg['status']) {
            $mudou[] = "Situação: {$reg['status']} → $status";
        }
        if ($retorno !== (string) $reg['retorno_publico']) {
            $mudou[] = 'Mensagem ao cliente atualizada';
        }
        if ($mudou) {
            q('UPDATE registros SET status = ?, retorno_publico = ?, atualizado_em = ? WHERE id = ?', [$status, $retorno, now(), $id]);
            historico($id, (int) $u['id'], implode('; ', $mudou), $retorno);
            auditoria((int) $u['id'], 'registro_atualizado', $reg['protocolo']);
            if (!empty($_POST['avisar']) && $reg['email'] !== '') {
                $corpo = implode("\n", [
                    $reg['nome'] !== '' ? "Olá, {$reg['nome']}." : 'Olá.',
                    '',
                    "Seu protocolo {$reg['protocolo']} foi atualizado.",
                    "Situação: $status",
                    $retorno !== '' ? "\nMensagem do cartório:\n$retorno" : '',
                    '',
                    'Consulte em ' . rtrim(config('base_url'), '/') . '/protocolo com o protocolo e o código recebidos.',
                    '',
                    cartorio('nome_oficial'),
                    cartorio('telefone') . ' – ' . cartorio('emails.contato'),
                ]);
                $ok = enviar_email($reg['email'], "Protocolo {$reg['protocolo']} atualizado – " . cartorio('nome_curto'), $corpo);
                historico($id, (int) $u['id'], $ok ? 'Cliente avisado por e-mail' : 'Falha ao avisar o cliente', $reg['email']);
            }
            flash('ok', 'Registro atualizado.');
        } else {
            flash('aviso', 'Nada foi alterado.');
        }
    } elseif ($acao === 'nota') {
        $nota = mb_substr(trim((string) ($_POST['nota'] ?? '')), 0, 4000);
        if ($nota !== '') {
            historico($id, (int) $u['id'], 'Nota interna', $nota);
            q('UPDATE registros SET atualizado_em = ? WHERE id = ?', [now(), $id]);
            flash('ok', 'Nota adicionada.');
        } else {
            flash('aviso', 'Escreva a nota antes de salvar.');
        }
    }
    redirect("/admin/registro?id=$id");
}

auditoria((int) $u['id'], 'registro_visto', $reg['protocolo']);
$def = formularios()[$reg['formulario']];
$rotulos = rotulos_extras($reg['formulario']);
$extras = json_decode($reg['dados_json'] ?: '{}', true) ?: [];
$anexos = q('SELECT * FROM anexos WHERE registro_id = ?', [$id])->fetchAll();
$hist = q('SELECT h.*, u.nome AS usuario FROM historico h LEFT JOIN usuarios u ON u.id = h.usuario_id WHERE h.registro_id = ? ORDER BY h.criado_em DESC, h.id DESC', [$id])->fetchAll();

view('admin-header', ['u' => $u, 'titulo' => $reg['protocolo']]);
?>
<p class="adm-voltar"><a href="/admin/registros">Voltar para a lista</a></p>
<div class="adm-cabeca">
  <div>
    <p class="adm-tipo"><?= e($def['titulo']) ?></p>
    <h1><?= e($reg['protocolo']) ?></h1>
  </div>
  <span class="adm-status adm-status-grande st-<?= status_classe($reg['status']) ?>"><?= e($reg['status']) ?></span>
</div>

<div class="adm-detalhe">
  <section class="adm-cartao" aria-labelledby="t-dados">
    <h2 id="t-dados">Dados enviados</h2>
    <dl class="adm-dados">
      <div><dt>Recebido em</dt><dd><?= e(data_br($reg['criado_em'])) ?></dd></div>
      <?php foreach ($extras as $k => $v): if ($v === '') continue; ?>
        <div><dt><?= e($rotulos[$k] ?? $k) ?></dt><dd><?= e($k === 'data_preferida' ? data_br($v, false) : $v) ?></dd></div>
      <?php endforeach; ?>
      <div><dt>Nome</dt><dd><?= $reg['nome'] !== '' ? e($reg['nome']) : '<span class="adm-anon">Não informado</span>' ?></dd></div>
      <div><dt>CPF</dt><dd><?= $reg['cpf'] !== '' ? e($reg['cpf']) : '<span class="adm-anon">Não informado</span>' ?></dd></div>
      <div><dt>E-mail</dt><dd><?= $reg['email'] !== '' ? '<a href="mailto:' . e($reg['email']) . '?subject=' . rawurlencode('Protocolo ' . $reg['protocolo']) . '">' . e($reg['email']) . '</a>' : '<span class="adm-anon">Não informado</span>' ?></dd></div>
      <div><dt>Telefone</dt><dd><?= $reg['telefone'] !== '' ? e($reg['telefone']) : '<span class="adm-anon">Não informado</span>' ?></dd></div>
    </dl>
    <h3>Mensagem</h3>
    <div class="adm-mensagem"><?= nl2br(e($reg['mensagem'])) ?></div>
    <?php if ($anexos): ?>
      <h3>Anexos</h3>
      <ul class="adm-anexos">
        <?php foreach ($anexos as $a): ?>
          <li><a href="/admin/anexo?id=<?= (int) $a['id'] ?>"><?= e($a['nome_original']) ?></a> <small><?= number_format($a['tamanho'] / 1024, 0, ',', '.') ?> KB</small></li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
    <p class="adm-tecnico">Código de consulta do cliente: <strong><?= e($reg['codigo_acesso']) ?></strong> · IP <?= e($reg['ip']) ?></p>
  </section>

  <div class="adm-coluna">
    <section class="adm-cartao" aria-labelledby="t-situacao">
      <h2 id="t-situacao">Atualizar</h2>
      <form method="post" class="adm-form">
        <label for="r-status">Situação</label>
        <select id="r-status" name="status">
          <?php foreach (STATUS as $s): ?><option<?= $reg['status'] === $s ? ' selected' : '' ?>><?= e($s) ?></option><?php endforeach; ?>
        </select>
        <label for="r-retorno">Mensagem ao cliente</label>
        <p class="adm-dica">Aparece na consulta pública do protocolo. Não inclua dados pessoais.</p>
        <textarea id="r-retorno" name="retorno_publico" rows="4" maxlength="2000"><?= e($reg['retorno_publico']) ?></textarea>
        <?php if ($reg['email'] !== ''): ?>
          <label class="adm-check"><input type="checkbox" name="avisar" value="1"> Avisar o cliente por e-mail</label>
        <?php endif; ?>
        <input type="hidden" name="acao" value="atualizar">
        <?= csrf_field() ?>
        <button class="adm-botao" type="submit">Salvar alterações</button>
      </form>
    </section>

    <section class="adm-cartao" aria-labelledby="t-nota">
      <h2 id="t-nota">Nota interna</h2>
      <form method="post" class="adm-form">
        <label for="r-nota" class="sr">Nota interna</label>
        <textarea id="r-nota" name="nota" rows="3" maxlength="4000" placeholder="Visível só para a equipe"></textarea>
        <input type="hidden" name="acao" value="nota">
        <?= csrf_field() ?>
        <button class="adm-botao adm-botao-sec" type="submit">Adicionar nota</button>
      </form>
    </section>

    <section class="adm-cartao" aria-labelledby="t-hist">
      <h2 id="t-hist">Histórico</h2>
      <ol class="adm-historico">
        <?php foreach ($hist as $h): ?>
          <li>
            <p><strong><?= e($h['acao']) ?></strong></p>
            <?php if ($h['detalhe'] !== null && $h['detalhe'] !== ''): ?><p class="adm-hist-detalhe"><?= nl2br(e($h['detalhe'])) ?></p><?php endif; ?>
            <p class="adm-hist-meta"><?= e(data_br($h['criado_em'])) ?><?= $h['usuario'] ? ', por ' . e($h['usuario']) : ', automático' ?></p>
          </li>
        <?php endforeach; ?>
      </ol>
    </section>
  </div>
</div>
<?php view('admin-footer'); ?>
