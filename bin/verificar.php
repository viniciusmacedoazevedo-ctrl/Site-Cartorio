<?php
// Confere se a instalação está pronta e diz o que falta.
// Uso:   php bin/verificar.php            (verificações locais)
//        php bin/verificar.php --online   (também acessa o site pela internet)
//        php bin/verificar.php --testar-email=seu@email.com.br   (envia um e-mail de teste)
// Para conferir as permissões como o servidor web vê:
//        sudo -u www-data php bin/verificar.php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit(1);
}
// Segura a saída até o fim: o bootstrap envia cabeçalhos HTTP e não pode vir depois de texto.
ob_start();

$raiz = dirname(__DIR__);
$falhas = 0;
$avisos = 0;

function ok(string $t): void { echo "  OK     $t\n"; }
function falha(string $t, string $como = ''): void
{
    global $falhas;
    $falhas++;
    echo "  FALHA  $t\n" . ($como ? "         → $como\n" : '');
}
function aviso(string $t, string $como = ''): void
{
    global $avisos;
    $avisos++;
    echo "  AVISO  $t\n" . ($como ? "         → $como\n" : '');
}
function bytes(string $v): int
{
    $n = (int) $v;
    return match (strtolower(substr(trim($v), -1))) {
        'g' => $n * 1024 ** 3, 'm' => $n * 1024 ** 2, 'k' => $n * 1024, default => $n,
    };
}

echo "\nPHP\n";
version_compare(PHP_VERSION, '8.3.0', '>=')
    ? ok('PHP ' . PHP_VERSION)
    : falha('PHP ' . PHP_VERSION . ' (precisa ser 8.3 ou mais novo)');
foreach (['pdo_mysql' => 'php8.3-mysql', 'mbstring' => 'php8.3-mbstring', 'fileinfo' => 'php8.3-common', 'openssl' => 'php8.3-common'] as $ext => $pacote) {
    extension_loaded($ext) ? ok("extensão $ext") : falha("extensão $ext ausente", "sudo apt install $pacote");
}
bytes((string) ini_get('upload_max_filesize')) >= 6 * 1024 ** 2
    ? ok('upload_max_filesize = ' . ini_get('upload_max_filesize'))
    : aviso('upload_max_filesize = ' . ini_get('upload_max_filesize') . ' (anexos precisam de 6M)', 'ajuste no php.ini (veja docs/INSTALACAO.md, passo 7)');
bytes((string) ini_get('post_max_size')) >= 8 * 1024 ** 2
    ? ok('post_max_size = ' . ini_get('post_max_size'))
    : aviso('post_max_size = ' . ini_get('post_max_size') . ' (precisa de 8M)', 'ajuste no php.ini (veja docs/INSTALACAO.md, passo 7)');
echo "         (o php.ini do terminal pode ser diferente do usado pelo site)\n";

echo "\nConfiguração (app/config.php)\n";
$arquivo = "$raiz/app/config.php";
if (!is_file($arquivo)) {
    falha('app/config.php não existe', 'php bin/configurar.php');
    echo "\nResultado: $falhas falha(s). Corrija e rode de novo.\n";
    exit(1);
}
if (!is_readable($arquivo)) {
    falha('app/config.php sem permissão de leitura para o usuário ' . (get_current_user() ?: 'atual'), 'sudo chown root:www-data app/config.php && sudo chmod 640 app/config.php');
    exit(1);
}
require "$raiz/app/bootstrap.php";

(fileperms($arquivo) & 0004) ? falha('app/config.php pode ser lido por qualquer usuário do servidor', 'chmod 640 app/config.php') : ok('app/config.php protegido');
$chave = (string) config('app_key');
(strlen($chave) >= 64 && !str_contains($chave, 'TROQUE')) ? ok('chave secreta (app_key) definida') : falha('app_key ainda é o valor de exemplo', 'php bin/configurar.php');
config('debug') ? falha('debug ligado (mostra erros para o público)', "troque 'debug' => false") : ok('debug desligado');
str_starts_with((string) config('base_url'), 'https://') ? ok('base_url ' . config('base_url')) : aviso('base_url não começa com https://');
config('db.driver') === 'mysql' ? ok('banco MySQL/MariaDB') : falha("banco '" . config('db.driver') . "' (sqlite é só para testes)", "use 'driver' => 'mysql'");
match (config('mail.transport')) {
    'log' => falha("e-mail em modo 'log' (nada é enviado)", "use 'mail' ou 'smtp'"),
    'smtp' => ok('e-mail por SMTP (' . config('mail.smtp')['host'] . ')'),
    default => ok('e-mail pelo servidor local (função mail)'),
};

echo "\nBanco de dados\n";
try {
    db();
    ok('conexão com ' . config('db.database') . ' em ' . config('db.host'));
    $esperadas = ['registros', 'anexos', 'usuarios', 'historico', 'contadores', 'limites', 'auditoria', 'transparencia'];
    $existentes = config('db.driver') === 'sqlite'
        ? q("SELECT name FROM sqlite_master WHERE type = 'table'")->fetchAll(PDO::FETCH_COLUMN)
        : q('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    $faltando = array_diff($esperadas, $existentes);
    $faltando
        ? falha('tabelas ausentes: ' . implode(', ', $faltando), 'mysql -u root -p ' . config('db.database') . ' < database/schema.sql')
        : ok('todas as tabelas criadas');
    if (!$faltando) {
        (int) q_val("SELECT COUNT(*) FROM usuarios WHERE perfil = 'admin' AND ativo = 1") > 0
            ? ok('há administrador do painel')
            : falha('nenhum administrador do painel', 'php bin/criar-usuario.php "Nome" email@dominio admin');
    }
} catch (Throwable $ex) {
    falha('não conectou ao banco: ' . $ex->getMessage(), 'confira host, usuário e senha em app/config.php');
}

echo "\nPastas de gravação (usuário: " . (function_exists('posix_getpwuid') ? posix_getpwuid(posix_geteuid())['name'] : get_current_user()) . ")\n";
foreach (['storage/anexos', 'storage/logs', 'storage/transparencia'] as $pasta) {
    is_dir("$raiz/$pasta") && is_writable("$raiz/$pasta")
        ? ok("$pasta gravável")
        : falha("$pasta sem permissão de gravação", 'sudo chown -R www-data:www-data storage && sudo chmod -R 750 storage');
}

if (in_array('--online', $argv, true)) {
    echo "\nSite na internet\n";
    $base = rtrim((string) config('base_url'), '/');
    $host = (string) parse_url($base, PHP_URL_HOST);
    $ctx = stream_context_create(['http' => ['method' => 'GET', 'follow_location' => 0, 'timeout' => 15, 'ignore_errors' => true]]);
    $status = static function (string $url) use ($ctx): array {
        $h = @get_headers($url, true, $ctx);
        if (!$h) {
            return [0, []];
        }
        preg_match('/\s(\d{3})\s?/', $h[0], $m);
        return [(int) ($m[1] ?? 0), array_change_key_case($h, CASE_LOWER)];
    };
    [$c, $h] = $status("$base/");
    $c === 200 ? ok("$base/ responde 200") : falha("$base/ respondeu " . ($c ?: 'sem resposta'), 'confira o servidor web e o certificado (docs/INSTALACAO.md)');
    if ($c === 200) {
        isset($h['strict-transport-security']) ? ok('HTTPS com HSTS') : aviso('cabeçalho HSTS ausente');
    }
    [$c, $h] = $status("http://$host/");
    in_array($c, [301, 308], true) && str_starts_with((string) (is_array($h['location'] ?? '') ? end($h['location']) : ($h['location'] ?? '')), 'https://')
        ? ok("http://$host redireciona para HTTPS")
        : aviso("http://$host não redireciona para HTTPS (respondeu " . ($c ?: 'nada') . ')');
    if (str_starts_with($host, 'www.')) {
        $raizDominio = substr($host, 4);
        [$c] = $status("https://$raizDominio/");
        in_array($c, [301, 308], true) ? ok("https://$raizDominio redireciona para o www") : aviso("https://$raizDominio respondeu " . ($c ?: 'nada'), 'o certificado precisa incluir os dois endereços (com e sem www)');
    }
    foreach (['/app/config.php', '/../app/config.php', '/storage/'] as $proibido) {
        [$c] = $status($base . $proibido);
        $c === 200 ? falha("$proibido está acessível pela internet", 'a raiz do site precisa ser a pasta public') : ok("$proibido não está exposto");
    }
}

foreach ($argv as $arg) {
    if (!str_starts_with($arg, '--testar-email=')) {
        continue;
    }
    $destino = substr($arg, strlen('--testar-email='));
    echo "\nE-mail de teste\n";
    if (!filter_var($destino, FILTER_VALIDATE_EMAIL)) {
        falha("endereço inválido: $destino");
        continue;
    }
    $enviado = enviar_email($destino, 'Teste do site do cartório',
        "Este é um e-mail de teste enviado por bin/verificar.php em " . date('d/m/Y H:i') . ".\nSe chegou, o envio de e-mails do site está funcionando.");
    $enviado
        ? ok("e-mail aceito pelo servidor para $destino (confira a caixa de entrada e o spam)")
        : falha('o envio falhou', 'veja storage/logs/php-error.log; confira senha, porta e criptografia (587/tls ou 465/ssl) com php bin/configurar.php');
}

echo "\n";
if ($falhas) {
    echo "Resultado: $falhas falha(s) e $avisos aviso(s). Corrija as falhas e rode de novo.\n";
    exit(1);
}
echo $avisos ? "Resultado: pronto, com $avisos aviso(s) para conferir.\n" : "Resultado: tudo pronto.\n";
