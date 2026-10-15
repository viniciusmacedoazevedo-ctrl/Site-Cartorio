<?php
// Apaga registros concluídos ou arquivados mais antigos que o prazo de guarda.
// Uso: php bin/limpar-antigos.php [anos=5] [--confirmar]
// Sem --confirmar, apenas mostra quantos seriam apagados.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit(1);
}
require __DIR__ . '/../app/bootstrap.php';

$anos = (int) ($argv[1] ?? 5) ?: 5;
$confirmar = in_array('--confirmar', $argv, true);
$limite = date('Y-m-d H:i:s', strtotime("-$anos years"));
$regs = q("SELECT id FROM registros WHERE status IN ('Concluído', 'Arquivado') AND atualizado_em < ?", [$limite])->fetchAll();
echo count($regs) . " registro(s) anteriores a $limite.\n";
if (!$confirmar) {
    echo "Nada foi apagado. Rode com --confirmar para apagar.\n";
    exit(0);
}
foreach ($regs as $r) {
    foreach (q('SELECT arquivo FROM anexos WHERE registro_id = ?', [$r['id']])->fetchAll() as $a) {
        @unlink(rtrim(config('uploads.path'), '/') . '/' . $a['arquivo']);
    }
    q('DELETE FROM historico WHERE registro_id = ?', [$r['id']]);
    q('DELETE FROM anexos WHERE registro_id = ?', [$r['id']]);
    q('DELETE FROM registros WHERE id = ?', [$r['id']]);
}
auditoria(null, 'limpeza', count($regs) . " registros anteriores a $limite");
echo "Apagados.\n";
