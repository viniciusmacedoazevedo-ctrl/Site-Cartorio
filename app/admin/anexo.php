<?php
$u = exigir_login();
$a = q_one('SELECT a.*, r.protocolo FROM anexos a JOIN registros r ON r.id = a.registro_id WHERE a.id = ? AND ' . str_replace(['formulario', 'tipo'], ['r.formulario', 'r.tipo'], filtro_perfil($u)), [(int) ($_GET['id'] ?? 0)]);
$caminho = $a ? rtrim(config('uploads.path'), '/') . '/' . $a['arquivo'] : null;
if (!$a || !is_file($caminho) || str_contains($a['arquivo'], '..')) {
    http_response_code(404);
    exit('Anexo não encontrado.');
}
auditoria((int) $u['id'], 'anexo_baixado', $a['protocolo'] . ' ' . $a['nome_original']);
header('Content-Type: ' . $a['mime']);
header('Content-Length: ' . filesize($caminho));
header('Content-Disposition: attachment; filename="' . str_replace('"', '', $a['nome_original']) . '"; filename*=UTF-8\'\'' . rawurlencode($a['nome_original']));
header('Cache-Control: private, no-store');
readfile($caminho);
