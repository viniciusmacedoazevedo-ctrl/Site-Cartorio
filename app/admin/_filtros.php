<?php
declare(strict_types=1);

/** Monta WHERE e parâmetros a partir dos filtros da lista. */
function filtros_registros(array $u, array $in): array
{
    $f = [
        'formulario' => array_key_exists($in['formulario'] ?? '', formularios()) ? $in['formulario'] : '',
        'status' => in_array($in['status'] ?? '', STATUS, true) ? $in['status'] : '',
        'de' => preg_match('/^\d{4}-\d{2}-\d{2}$/', $in['de'] ?? '') ? $in['de'] : '',
        'ate' => preg_match('/^\d{4}-\d{2}-\d{2}$/', $in['ate'] ?? '') ? $in['ate'] : '',
        'busca' => mb_substr(trim((string) ($in['busca'] ?? '')), 0, 100),
        'abertos' => ($in['abertos'] ?? '') === '1' ? '1' : '',
    ];
    $where = [filtro_perfil($u)];
    $params = [];
    if ($f['formulario']) {
        $where[] = 'formulario = ?';
        $params[] = $f['formulario'];
    }
    if ($f['status']) {
        $where[] = 'status = ?';
        $params[] = $f['status'];
    } elseif ($f['abertos']) {
        $where[] = "status NOT IN ('Concluído', 'Arquivado')";
    }
    if ($f['de']) {
        $where[] = 'criado_em >= ?';
        $params[] = $f['de'] . ' 00:00:00';
    }
    if ($f['ate']) {
        $where[] = 'criado_em <= ?';
        $params[] = $f['ate'] . ' 23:59:59';
    }
    if ($f['busca'] !== '') {
        $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $f['busca']) . '%';
        $where[] = "(protocolo LIKE ? ESCAPE '\\' OR nome LIKE ? ESCAPE '\\' OR cpf LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR telefone LIKE ? ESCAPE '\\')";
        array_push($params, $like, $like, $like, $like, $like);
    }
    return [$f, implode(' AND ', $where), $params];
}
