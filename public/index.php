<?php
declare(strict_types=1);

// Servidor embutido do PHP (testes): entrega arquivos estáticos diretamente.
if (PHP_SAPI === 'cli-server') {
    $arquivo = __DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if ($arquivo !== __DIR__ . '/' && is_file($arquivo)) {
        return false;
    }
}

require dirname(__DIR__) . '/app/bootstrap.php';

$rotas = [
    '/'             => 'pages/inicio.php',
    '/servicos'     => 'pages/servicos.php',
    '/pedido'       => 'pages/pedido.php',
    '/protocolo'    => 'pages/protocolo.php',
    '/ouvidoria'    => 'pages/ouvidoria.php',
    '/privacidade'  => 'pages/privacidade.php',
    '/cookies'      => 'pages/cookies.php',
    '/conformidade' => 'pages/conformidade.php',
    '/contato'      => 'pages/contato.php',
    '/enviado'      => 'pages/enviado.php',
    '/serventia'    => 'pages/serventia.php',
    '/emolumentos'  => 'pages/emolumentos.php',
    '/transparencia'         => 'pages/transparencia.php',
    '/transparencia/arquivo' => 'pages/transparencia-arquivo.php',
    '/validacao'    => 'pages/validacao.php',
    '/termos'       => 'pages/termos.php',
    '/acessibilidade' => 'pages/acessibilidade.php',
    '/admin'                => 'admin/login.php',
    '/admin/sair'           => 'admin/sair.php',
    '/admin/registros'      => 'admin/registros.php',
    '/admin/registro'       => 'admin/registro.php',
    '/admin/anexo'          => 'admin/anexo.php',
    '/admin/exportar'       => 'admin/exportar.php',
    '/admin/usuarios'       => 'admin/usuarios.php',
    '/admin/senha'          => 'admin/senha.php',
    '/admin/transparencia'  => 'admin/transparencia.php',
];

$rota = current_path();
if (!isset($rotas[$rota])) {
    not_found();
}
if (str_starts_with($rota, '/admin')) {
    header('X-Robots-Tag: noindex, nofollow');
    header('Cache-Control: no-store');
}
require APP_DIR . '/' . $rotas[$rota];
