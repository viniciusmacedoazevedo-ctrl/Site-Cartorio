<?php
declare(strict_types=1);

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MIN = 15;

function usuario_atual(): ?array
{
    session_start_safe();
    if (empty($_SESSION['uid'])) {
        return null;
    }
    $limite = (int) config('admin_timeout_min', 30) * 60;
    if (time() - (int) ($_SESSION['ultimo_acesso'] ?? 0) > $limite) {
        sair();
        return null;
    }
    $_SESSION['ultimo_acesso'] = time();
    static $u = null;
    if ($u === null || (int) $u['id'] !== (int) $_SESSION['uid']) {
        $u = q_one('SELECT id, nome, email, perfil FROM usuarios WHERE id = ? AND ativo = 1', [$_SESSION['uid']]);
        if (!$u) {
            sair();
            return null;
        }
    }
    return $u;
}

function exigir_login(): array
{
    $u = usuario_atual();
    if (!$u) {
        flash('aviso', 'Entre com seu usuário para continuar.');
        redirect('/admin');
    }
    return $u;
}

function exigir_admin(): array
{
    $u = exigir_login();
    if ($u['perfil'] !== 'admin') {
        http_response_code(403);
        exit('Acesso restrito ao perfil Administrador.');
    }
    return $u;
}

/** Retorna [ok, mensagem]. */
function entrar(string $email, string $senha): array
{
    $u = q_one('SELECT * FROM usuarios WHERE email = ?', [mb_strtolower(trim($email))]);
    $erroPadrao = 'E-mail ou senha incorretos.';
    if (!$u || !(int) $u['ativo']) {
        password_hash($senha, PASSWORD_DEFAULT); // mesmo custo de tempo de um login real
        auditoria(null, 'login_falhou', $email);
        return [false, $erroPadrao];
    }
    if ($u['bloqueado_ate'] && $u['bloqueado_ate'] > now()) {
        return [false, 'Acesso bloqueado por excesso de tentativas. Tente de novo depois das ' . date('H:i', strtotime($u['bloqueado_ate'])) . '.'];
    }
    if (!password_verify($senha, $u['senha_hash'])) {
        $t = (int) $u['tentativas'] + 1;
        $bloq = $t >= MAX_TENTATIVAS ? date('Y-m-d H:i:s', time() + BLOQUEIO_MIN * 60) : null;
        q('UPDATE usuarios SET tentativas = ?, bloqueado_ate = ? WHERE id = ?', [$bloq ? 0 : $t, $bloq, $u['id']]);
        auditoria((int) $u['id'], 'login_falhou', $email);
        return [false, $bloq ? 'Acesso bloqueado por ' . BLOQUEIO_MIN . ' minutos após ' . MAX_TENTATIVAS . ' tentativas.' : $erroPadrao];
    }
    if (password_needs_rehash($u['senha_hash'], PASSWORD_DEFAULT)) {
        q('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [password_hash($senha, PASSWORD_DEFAULT), $u['id']]);
    }
    session_start_safe();
    session_regenerate_id(true);
    $_SESSION['uid'] = (int) $u['id'];
    $_SESSION['ultimo_acesso'] = time();
    q('UPDATE usuarios SET tentativas = 0, bloqueado_ate = NULL, ultimo_login = ? WHERE id = ?', [now(), $u['id']]);
    auditoria((int) $u['id'], 'login', '');
    return [true, ''];
}

function sair(): void
{
    session_start_safe();
    $_SESSION = [];
    session_regenerate_id(true);
}

function auditoria(?int $usuarioId, string $acao, string $alvo): void
{
    q('INSERT INTO auditoria (usuario_id, acao, alvo, ip, criado_em) VALUES (?, ?, ?, ?, ?)',
        [$usuarioId, $acao, mb_substr($alvo, 0, 190), client_ip(), now()]);
}

/** Condição SQL que limita o que o perfil Atendente pode ver. */
function filtro_perfil(array $u): string
{
    if ($u['perfil'] === 'admin') {
        return '1=1';
    }
    return "formulario <> 'lgpd' AND NOT (formulario = 'ouvidoria' AND tipo = 'Denúncia')";
}

function senha_forte(string $senha): ?string
{
    if (mb_strlen($senha) < 10) {
        return 'A senha precisa ter pelo menos 10 caracteres.';
    }
    if (!preg_match('/[A-Za-z]/', $senha) || !preg_match('/\d/', $senha)) {
        return 'Use letras e números na senha.';
    }
    return null;
}
