<?php
declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }
    $c = config('db');
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    if ($c['driver'] === 'sqlite') {
        $pdo = new PDO('sqlite:' . $c['sqlite_path'], null, null, $options);
        $pdo->exec('PRAGMA foreign_keys = ON');
    } elseif ($c['driver'] === 'pgsql') {
        $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s', $c['host'], $c['port'], $c['database']);
        $pdo = new PDO($dsn, $c['username'], $c['password'], $options);
        $pdo->exec("SET client_encoding = 'UTF8'");
        $pdo->exec("SET TIME ZONE 'America/Fortaleza'");
    } else {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'], $c['port'], $c['database']);
        $pdo = new PDO($dsn, $c['username'], $c['password'], $options);
        $pdo->exec("SET time_zone = '-03:00'");
    }
    return $pdo;
}

function db_driver(): string
{
    return config('db.driver');
}

function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function q_one(string $sql, array $params = []): ?array
{
    $row = q($sql, $params)->fetch();
    return $row === false ? null : $row;
}

function q_val(string $sql, array $params = []): mixed
{
    $v = q($sql, $params)->fetchColumn();
    return $v === false ? null : $v;
}

/** Próximo número da sequência do protocolo (por prefixo e ano), sem colisão. */
function proximo_numero(string $prefixo, int $ano): int
{
    if (db_driver() === 'sqlite' || db_driver() === 'pgsql') {
        return (int) q_val(
            'INSERT INTO contadores (prefixo, ano, ultimo) VALUES (?, ?, 1)
             ON CONFLICT (prefixo, ano) DO UPDATE SET ultimo = contadores.ultimo + 1 RETURNING ultimo',
            [$prefixo, $ano]
        );
    }
    q('INSERT INTO contadores (prefixo, ano, ultimo) VALUES (?, ?, LAST_INSERT_ID(1))
       ON DUPLICATE KEY UPDATE ultimo = LAST_INSERT_ID(ultimo + 1)', [$prefixo, $ano]);
    return (int) db()->lastInsertId();
}
