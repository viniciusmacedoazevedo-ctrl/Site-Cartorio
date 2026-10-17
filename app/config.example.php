<?php
/*
 * Copie este arquivo para app/config.php e preencha os valores.
 * Nunca publique o config.php (ele fica fora da pasta public).
 */
return [
    // Endereço público do site, sem barra no final (usado nos e-mails).
    'base_url' => 'https://www.cartoriosjcampestre.com.br',

    // Chave secreta: gere com  php -r "echo bin2hex(random_bytes(32));"
    'app_key' => 'TROQUE-POR-UMA-CHAVE-ALEATORIA-DE-64-CARACTERES',

    // true só em desenvolvimento (mostra erros na tela).
    'debug' => false,

    'db' => [
        'driver'   => 'mysql',            // mysql (MySQL/MariaDB), pgsql (PostgreSQL, porta 5432) ou sqlite (apenas testes)
        'host'     => '127.0.0.1',
        'port'     => 3306,
        'database' => 'cartorio_site',
        'username' => 'cartorio_site',
        'password' => 'SENHA-DO-BANCO',
        'sqlite_path' => __DIR__ . '/../storage/teste.sqlite',
    ],

    'mail' => [
        // mail = função mail() do PHP (Postfix/Exim local do servidor)
        // smtp = conexão SMTP autenticada
        // log  = não envia, grava em storage/logs/mail.log (testes)
        'transport'  => 'smtp',
        'from_email' => 'nao-responda@cartoriosjcampestre.com.br',
        'from_name'  => 'Cartório de São José do Campestre',
        'smtp' => [
            'host'       => 'mail.cartoriosjcampestre.com.br',
            'port'       => 587,
            'encryption' => 'tls',        // tls (STARTTLS na 587), ssl (465) ou none
            'username'   => 'nao-responda@cartoriosjcampestre.com.br',
            'password'   => 'SENHA-DO-EMAIL',
            'timeout'    => 15,
        ],
    ],

    // Caixas que recebem cada formulário.
    'destinos' => [
        'pedido'     => 'contato@cartoriosjcampestre.com.br',
        'contato'    => 'contato@cartoriosjcampestre.com.br',
        'ouvidoria'  => 'ouvidoria@cartoriosjcampestre.com.br',
        'lgpd'       => 'lgpd@cartoriosjcampestre.com.br',
        'lgpd_copia' => 'denis@psgdados.com.br',   // cópia ao Encarregado (DPO)
    ],

    'uploads' => [
        'max_bytes' => 5 * 1024 * 1024,
        'path'      => __DIR__ . '/../storage/anexos',
    ],

    // Limite de envios de formulário por IP.
    'rate_limit' => ['max' => 6, 'janela_min' => 15],

    // Tempo de inatividade do painel, em minutos.
    'admin_timeout_min' => 30,
];
