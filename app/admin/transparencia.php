<?php
$u = exigir_admin();
$rubricas = rubricas();
$dir = APP_ROOT . '/storage/transparencia';
$erros = [];
$ano = (int) ($_GET['ano'] ?? date('Y'));
$mes = (int) ($_GET['mes'] ?? (int) date('n', strtotime('first day of last month')));
if (isset($_GET['ano']) === false) {
    $ano = (int) date('Y', strtotime('first day of last month'));
}
$form = ['valores' => [], 'observacao' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_ok()) {
        flash('aviso', 'A página ficou aberta por muito tempo. Tente de novo.');
        redirect('/admin/transparencia');
    }
    $ano = (int) ($_POST['ano'] ?? 0);
    $mes = (int) ($_POST['mes'] ?? 0);
    $acao = $_POST['acao'] ?? 'salvar';
    if ($ano < 2000 || $ano > (int) date('Y') + 1 || $mes < 1 || $mes > 12) {
        $erros[] = 'Escolha um mês e ano válidos.';
    }
    $existente = $erros ? null : q_one('SELECT * FROM transparencia WHERE ano = ? AND mes = ?', [$ano, $mes]);

    if ($acao === 'remover' && $existente) {
        if ($existente['arquivo']) {
            @unlink("$dir/" . basename($existente['arquivo']));
        }
        q('DELETE FROM transparencia WHERE id = ?', [$existente['id']]);
        auditoria((int) $u['id'], 'transparencia_removida', sprintf('%02d/%d', $mes, $ano));
        flash('ok', 'Lançamento de ' . mes_nome($mes) . "/$ano removido do site.");
        redirect('/admin/transparencia');
    }

    $valores = [];
    foreach ($rubricas as $r) {
        $bruto = (string) ($_POST['v'][$r['chave']] ?? '');
        $form['valores'][$r['chave']] = $bruto;
        $v = ler_moeda($bruto);
        if ($v !== null && (is_nan($v) || $v < 0)) {
            $erros[] = "Valor inválido em “{$r['rotulo']}”. Use o formato 1.234,56.";
        } elseif ($v !== null) {
            $valores[$r['chave']] = $v;
        }
    }
    $obs = mb_substr(trim((string) ($_POST['observacao'] ?? '')), 0, 1000);
    $form['observacao'] = $obs;
    if (!$valores && !$erros) {
        $erros[] = 'Preencha ao menos um valor.';
    }

    $arquivo = $existente['arquivo'] ?? null;
    $arquivoNome = $existente['arquivo_nome'] ?? null;
    $novoArquivo = null;
    if (!$erros && ($_FILES['pdf']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        $f = $_FILES['pdf'];
        if ($f['error'] !== UPLOAD_ERR_OK || $f['size'] > 10 * 1024 * 1024) {
            $erros[] = 'O PDF não foi recebido ou passa de 10 MB.';
        } elseif ((new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']) !== 'application/pdf') {
            $erros[] = 'O demonstrativo precisa ser um arquivo PDF.';
        } else {
            if (!is_dir($dir)) {
                mkdir($dir, 0750, true);
            }
            $novoArquivo = sprintf('%d-%02d-%s.pdf', $ano, $mes, bin2hex(random_bytes(6)));
            if (!move_uploaded_file($f['tmp_name'], "$dir/$novoArquivo")) {
                $erros[] = 'Não foi possível guardar o PDF.';
                $novoArquivo = null;
            }
        }
    }
    if (!empty($_POST['tirar_pdf']) && !$novoArquivo && $arquivo) {
        @unlink("$dir/" . basename($arquivo));
        $arquivo = $arquivoNome = null;
    }

    if (!$erros) {
        if ($novoArquivo) {
            if ($arquivo) {
                @unlink("$dir/" . basename($arquivo));
            }
            $arquivo = $novoArquivo;
            $arquivoNome = mb_substr(basename((string) $_FILES['pdf']['name']), 0, 150);
        }
        $json = json_encode($valores);
        if ($existente) {
            q('UPDATE transparencia SET valores_json = ?, observacao = ?, arquivo = ?, arquivo_nome = ?, atualizado_por = ?, atualizado_em = ? WHERE id = ?',
                [$json, $obs, $arquivo, $arquivoNome, $u['id'], now(), $existente['id']]);
        } else {
            q('INSERT INTO transparencia (ano, mes, valores_json, observacao, arquivo, arquivo_nome, atualizado_por, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [$ano, $mes, $json, $obs, $arquivo, $arquivoNome, $u['id'], now()]);
        }
        auditoria((int) $u['id'], $existente ? 'transparencia_alterada' : 'transparencia_publicada', sprintf('%02d/%d', $mes, $ano));
        flash('ok', 'Mês de ' . mes_nome($mes) . "/$ano publicado na página de Transparência.");
        redirect('/admin/transparencia');
    } elseif ($novoArquivo) {
        @unlink("$dir/$novoArquivo");
    }
}

$atual = q_one('SELECT * FROM transparencia WHERE ano = ? AND mes = ?', [$ano, $mes]);
if ($atual && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    foreach (json_decode($atual['valores_json'], true) ?: [] as $k => $v) {
        $form['valores'][$k] = number_format((float) $v, 2, ',', '.');
    }
    $form['observacao'] = (string) $atual['observacao'];
}
$lancados = q('SELECT t.*, u.nome FROM transparencia t LEFT JOIN usuarios u ON u.id = t.atualizado_por ORDER BY ano DESC, mes DESC LIMIT 36')->fetchAll();
view('admin-header', ['u' => $u, 'titulo' => 'Transparência']);
?>
<div class="adm-cabeca">
  <div>
    <h1>Transparência</h1>
    <p class="adm-dica">Receitas públicas mensais publicadas em <a href="/transparencia" target="_blank" rel="noopener">/transparencia</a> (Resolução CNJ nº 215/2015, art. 6º, § 3º).</p>
  </div>
</div>
<div class="adm-detalhe">
  <section class="adm-cartao">
    <h2><?= $atual ? 'Alterar' : 'Lançar' ?> <?= e(mes_nome($mes)) ?>/<?= $ano ?></h2>
    <form method="get" class="adm-periodo">
      <label for="t-mes">Mês</label>
      <select id="t-mes" name="mes"><?php for ($m = 1; $m <= 12; $m++): ?><option value="<?= $m ?>"<?= $m === $mes ? ' selected' : '' ?>><?= e(ucfirst(mes_nome($m))) ?></option><?php endfor; ?></select>
      <label for="t-ano">Ano</label>
      <input id="t-ano" name="ano" type="number" min="2020" max="<?= (int) date('Y') + 1 ?>" value="<?= $ano ?>">
      <button class="adm-botao adm-botao-sec" type="submit">Abrir mês</button>
    </form>
    <?php if ($erros): ?><div class="adm-alerta adm-aviso" role="alert"><?= implode('<br>', array_map('e', $erros)) ?></div><?php endif; ?>
    <form method="post" enctype="multipart/form-data" class="adm-form">
      <input type="hidden" name="ano" value="<?= $ano ?>">
      <input type="hidden" name="mes" value="<?= $mes ?>">
      <?php $grupo = null; foreach ($rubricas as $r): ?>
        <?php if ($r['grupo'] !== $grupo): $grupo = $r['grupo']; ?><h3><?= e($grupo) ?></h3><?php endif; ?>
        <label for="v-<?= e($r['chave']) ?>"><?= e($r['rotulo']) ?> (R$)</label>
        <input id="v-<?= e($r['chave']) ?>" name="v[<?= e($r['chave']) ?>]" inputmode="decimal" placeholder="0,00" value="<?= e($form['valores'][$r['chave']] ?? '') ?>">
      <?php endforeach; ?>
      <label for="t-obs">Observação pública</label>
      <p class="adm-dica">Opcional. Aparece abaixo do mês, por exemplo para explicar uma retificação.</p>
      <textarea id="t-obs" name="observacao" rows="2" maxlength="1000"><?= e($form['observacao']) ?></textarea>
      <label for="t-pdf">Demonstrativo em PDF</label>
      <p class="adm-dica">Opcional, até 10 MB. Fica disponível para download no site.<?= $atual && $atual['arquivo'] ? ' Já enviado: ' . e($atual['arquivo_nome']) . '.' : '' ?></p>
      <input id="t-pdf" name="pdf" type="file" accept="application/pdf">
      <?php if ($atual && $atual['arquivo']): ?><label class="adm-check"><input type="checkbox" name="tirar_pdf" value="1"> Remover o PDF atual</label><?php endif; ?>
      <?= csrf_field() ?>
      <button class="adm-botao" type="submit" name="acao" value="salvar"><?= $atual ? 'Salvar alterações' : 'Publicar mês' ?></button>
    </form>
    <?php if ($atual): ?>
      <form method="post" class="adm-remover" data-confirmar="Remover este mês da página pública?">
        <input type="hidden" name="ano" value="<?= $ano ?>"><input type="hidden" name="mes" value="<?= $mes ?>"><input type="hidden" name="acao" value="remover">
        <?= csrf_field() ?><button class="adm-link" type="submit">Remover este mês do site</button>
      </form>
    <?php endif; ?>
  </section>
  <section class="adm-cartao">
    <h2>Meses publicados</h2>
    <?php if (!$lancados): ?>
      <p class="adm-dica">Nenhum mês publicado ainda. Lance o primeiro ao lado.</p>
    <?php else: ?>
      <div class="adm-tabela-wrap">
        <table class="adm-tabela">
          <thead><tr><th scope="col">Mês</th><th scope="col">Atualizado</th><th scope="col"></th></tr></thead>
          <tbody>
          <?php foreach ($lancados as $l): ?>
            <tr>
              <td><?= e(ucfirst(mes_nome((int) $l['mes']))) ?>/<?= (int) $l['ano'] ?><?= $l['arquivo'] ? ' <small>com PDF</small>' : '' ?></td>
              <td><?= e(data_br($l['atualizado_em'])) ?><?= $l['nome'] ? '<br><small>' . e($l['nome']) . '</small>' : '' ?></td>
              <td><a href="/admin/transparencia?ano=<?= (int) $l['ano'] ?>&amp;mes=<?= (int) $l['mes'] ?>">Alterar</a></td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </section>
</div>
<?php view('admin-footer'); ?>
