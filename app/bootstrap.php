<?php
declare(strict_types=1);

define('APP_ROOT', dirname(__DIR__));
define('APP_DIR', __DIR__);

date_default_timezone_set('America/Fortaleza');
mb_internal_encoding('UTF-8');

$configFile = APP_DIR . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    exit('Configuração ausente: copie app/config.example.php para app/config.php.');
}
$GLOBALS['__config'] = require $configFile;
$GLOBALS['__cartorio'] = require APP_DIR . '/content/cartorio.php';

if (!empty($GLOBALS['__config']['debug'])) {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    ini_set('error_log', APP_ROOT . '/storage/logs/php-error.log');
}

foreach (['util', 'db', 'session', 'mailer', 'forms', 'registros', 'auth', 'transparencia'] as $lib) {
    require APP_DIR . "/lib/$lib.php";
}

// Cabeçalhos de segurança para todas as respostas.
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; script-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");
if (is_https()) {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}
