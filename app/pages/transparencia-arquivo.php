<?php
$l = q_one('SELECT ano, mes, arquivo, arquivo_nome FROM transparencia WHERE id = ?', [(int) ($_GET['id'] ?? 0)]);
$caminho = $l && $l['arquivo'] ? APP_ROOT . '/storage/transparencia/' . basename($l['arquivo']) : null;
if (!$caminho || !is_file($caminho)) {
    not_found();
}
$nome = sprintf('transparencia-%d-%02d.pdf', $l['ano'], $l['mes']);
header('Content-Type: application/pdf');
header('Content-Length: ' . filesize($caminho));
header('Content-Disposition: inline; filename="' . $nome . '"');
readfile($caminho);
