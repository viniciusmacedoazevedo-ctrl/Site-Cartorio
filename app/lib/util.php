<?php
declare(strict_types=1);

function config(string $key, mixed $default = null): mixed
{
    $value = $GLOBALS['__config'];
    foreach (explode('.', $key) as $part) {
        if (!is_array($value) || !array_key_exists($part, $value)) {
            return $default;
        }
        $value = $value[$part];
    }
    return $value;
}

function cartorio(string $key): mixed
{
    $value = $GLOBALS['__cartorio'];
    foreach (explode('.', $key) as $part) {
        $value = $value[$part] ?? null;
    }
    return $value;
}

function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function redirect(string $path, int $code = 303): never
{
    header('Location: ' . $path, true, $code);
    exit;
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function ip_hash(): string
{
    return hash_hmac('sha256', client_ip(), (string) config('app_key'));
}

function current_path(): string
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $path = '/' . trim($path, '/');
    return $path;
}

function now(): string
{
    return date('Y-m-d H:i:s');
}

function data_br(?string $datetime, bool $hora = true): string
{
    if (!$datetime) {
        return '';
    }
    $ts = strtotime($datetime);
    return $hora ? date('d/m/Y \à\s H:i', $ts) : date('d/m/Y', $ts);
}

function so_digitos(string $s): string
{
    return preg_replace('/\D+/', '', $s) ?? '';
}

function cpf_valido(string $cpf): bool
{
    $cpf = so_digitos($cpf);
    if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf)) {
        return false;
    }
    for ($t = 9; $t < 11; $t++) {
        $soma = 0;
        for ($i = 0; $i < $t; $i++) {
            $soma += (int) $cpf[$i] * (($t + 1) - $i);
        }
        $digito = ((10 * $soma) % 11) % 10;
        if ((int) $cpf[$t] !== $digito) {
            return false;
        }
    }
    return true;
}

function cpf_formatado(string $cpf): string
{
    $d = so_digitos($cpf);
    return strlen($d) === 11
        ? substr($d, 0, 3) . '.' . substr($d, 3, 3) . '.' . substr($d, 6, 3) . '-' . substr($d, 9, 2)
        : $cpf;
}

/** Situação do atendimento presencial agora (sem considerar feriados). */
function atendimento_agora(): array
{
    $dia = (int) date('N');
    $hora = date('H:i');
    $util = $dia <= 5;
    $aberto = $util && $hora >= cartorio('abre') && $hora < cartorio('fecha');
    if ($aberto) {
        return ['aberto' => true, 'texto' => 'Aberto agora, até as 17h'];
    }
    if ($util && $hora < cartorio('abre')) {
        return ['aberto' => false, 'texto' => 'Fechado agora. Abre hoje às 8h'];
    }
    $proximo = ($dia >= 5) ? 'segunda-feira' : 'amanhã';
    return ['aberto' => false, 'texto' => "Fechado agora. Abre $proximo às 8h"];
}

function view(string $name, array $vars = []): void
{
    extract($vars, EXTR_SKIP);
    require APP_DIR . "/views/$name.php";
}

function not_found(): never
{
    http_response_code(404);
    $titulo = 'Página não encontrada';
    view('header', compact('titulo'));
    echo '<main id="conteudo" class="pagina"><div class="faixa"><h1>Página não encontrada</h1>'
        . '<p class="lead">O endereço digitado não existe ou mudou. Use o menu acima ou volte para a <a href="/">página inicial</a>.</p></div></main>';
    view('footer');
    exit;
}
