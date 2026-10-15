<?php
// Cria ou redefine um usuário do painel.
// Uso: php bin/criar-usuario.php "Nome" email@dominio admin|atendente
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit(1);
}
require __DIR__ . '/../app/bootstrap.php';

[$script, $nome, $email, $perfil] = array_pad($argv, 4, null);
if (!$nome || !$email || !in_array($perfil, ['admin', 'atendente'], true)) {
    fwrite(STDERR, "Uso: php bin/criar-usuario.php \"Nome\" email@dominio admin|atendente\n");
    exit(1);
}
$email = mb_strtolower(trim($email));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "E-mail inválido.\n");
    exit(1);
}
$senha = getenv('SENHA') ?: null;
if (!$senha) {
    echo 'Senha (mín. 10 caracteres, letras e números): ';
    system('stty -echo 2>/dev/null');
    $senha = trim((string) fgets(STDIN));
    system('stty echo 2>/dev/null');
    echo "\n";
}
if ($erro = senha_forte($senha)) {
    fwrite(STDERR, "$erro\n");
    exit(1);
}
$hash = password_hash($senha, PASSWORD_DEFAULT);
if (q_val('SELECT id FROM usuarios WHERE email = ?', [$email])) {
    q('UPDATE usuarios SET nome = ?, senha_hash = ?, perfil = ?, ativo = 1, tentativas = 0, bloqueado_ate = NULL WHERE email = ?', [$nome, $hash, $perfil, $email]);
    echo "Usuário atualizado: $email ($perfil)\n";
} else {
    q('INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo, criado_em) VALUES (?, ?, ?, ?, 1, ?)', [$nome, $email, $hash, $perfil, now()]);
    echo "Usuário criado: $email ($perfil)\n";
}
