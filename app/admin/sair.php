<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && csrf_ok()) {
    $u = usuario_atual();
    if ($u) {
        auditoria((int) $u['id'], 'logout', '');
    }
    sair();
    flash('ok', 'Você saiu do painel.');
}
redirect('/admin');
