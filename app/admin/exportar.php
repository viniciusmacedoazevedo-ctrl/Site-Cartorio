<?php
require __DIR__ . '/_filtros.php';
$u = exigir_login();
[$f, $where, $params] = filtros_registros($u, $_GET);
$rows = q("SELECT protocolo, formulario, tipo, status, nome, cpf, email, telefone, mensagem, dados_json, retorno_publico, criado_em, atualizado_em
           FROM registros WHERE $where ORDER BY criado_em DESC", $params);
auditoria((int) $u['id'], 'exportacao', http_build_query(array_filter($f)));

header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="registros-' . date('Y-m-d-His') . '.csv"');
header('Cache-Control: private, no-store');
$out = fopen('php://output', 'w');
fwrite($out, "\xEF\xBB\xBF"); // BOM para o Excel reconhecer acentos
$titulos = array_map(fn ($x) => $x['titulo'], formularios());
$seguro = fn ($v) => preg_match('/^[=+\-@\t\r]/', (string) $v) ? "'" . $v : $v; // evita fórmulas no Excel
fputcsv($out, ['Protocolo', 'Formulário', 'Assunto', 'Situação', 'Nome', 'CPF', 'E-mail', 'Telefone', 'Mensagem', 'Outros dados', 'Mensagem ao cliente', 'Recebido em', 'Atualizado em'], ';');
while ($r = $rows->fetch()) {
    $extras = json_decode($r['dados_json'] ?: '{}', true) ?: [];
    $outros = implode(' | ', array_map(fn ($k, $v) => "$k: $v", array_keys($extras), $extras));
    fputcsv($out, array_map($seguro, [
        $r['protocolo'], $titulos[$r['formulario']] ?? $r['formulario'], $r['tipo'], $r['status'], $r['nome'], $r['cpf'],
        $r['email'], $r['telefone'], $r['mensagem'], $outros, $r['retorno_publico'], data_br($r['criado_em']), data_br($r['atualizado_em']),
    ]), ';');
}
fclose($out);
