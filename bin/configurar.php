<?php
// Cria o app/config.php fazendo perguntas, a partir do app/config.example.php.
// Uso: php bin/configurar.php
// Gera a chave secreta sozinho e testa a conexão com o banco antes de gravar.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit(1);
}

$appDir = realpath(__DIR__ . '/../app');
$destino = $appDir . '/config.php';
$config = require $appDir . '/config.example.php';

function perguntar(string $texto, ?string $padrao = null): string
{
    $sufixo = $padrao !== null && $padrao !== '' ? " [$padrao]" : '';
    echo "$texto$sufixo: ";
    $r = fgets(STDIN);
    if ($r === false) {
        fwrite(STDERR, "\nEntrada encerrada. Nada foi gravado.\n");
        exit(1);
    }
    $r = trim($r);
    return $r === '' ? (string) $padrao : $r;
}

function perguntar_senha(string $texto): string
{
    echo "$texto: ";
    $tty = stream_isatty(STDIN);
    if ($tty) {
        system('stty -echo 2>/dev/null');
    }
    $r = fgets(STDIN);
    if ($tty) {
        system('stty echo 2>/dev/null');
        echo "\n";
    }
    if ($r === false) {
        fwrite(STDERR, "\nEntrada encerrada. Nada foi gravado.\n");
        exit(1);
    }
    return rtrim($r, "\r\n");
}

function escolher(string $texto, array $opcoes, string $padrao): string
{
    do {
        $r = perguntar($texto . ' (' . implode('/', $opcoes) . ')', $padrao);
    } while (!in_array($r, $opcoes, true));
    return $r;
}

echo "\nConfiguração do site do cartório\n";
echo "Aperte Enter para aceitar o valor entre colchetes.\n\n";

if (is_file($destino)) {
    $r = escolher('Já existe um app/config.php. Substituir? Uma cópia de segurança será guardada', ['s', 'n'], 'n');
    if ($r !== 's') {
        echo "Nada foi alterado.\n";
        exit(0);
    }
}

// Site
$config['base_url'] = rtrim(perguntar('Endereço público do site', $config['base_url']), '/');
$config['app_key'] = bin2hex(random_bytes(32));
$config['debug'] = false;

// Banco
echo "\n— Banco de dados —\n";
echo "mysql = MySQL/MariaDB\n";
echo "pgsql = PostgreSQL\n";
$db = &$config['db'];
$db['driver'] = escolher('Tipo de banco', ['mysql', 'pgsql'], $db['driver'] === 'pgsql' ? 'pgsql' : 'mysql');
if ($db['driver'] === 'pgsql') {
    $db['host'] = $db['host'] === '127.0.0.1' ? 'localhost' : $db['host'];
    $db['port'] = (int) $db['port'] === 3306 ? 5432 : $db['port'];
}
for (;;) {
    $db['host'] = perguntar('Servidor do banco', $db['host']);
    $db['port'] = (int) perguntar('Porta', (string) $db['port']);
    $db['database'] = perguntar('Nome do banco', $db['database']);
    $db['username'] = perguntar('Usuário do banco', $db['username']);
    $db['password'] = perguntar_senha('Senha do usuário do banco (não aparece ao digitar)');

    echo 'Testando a conexão... ';
    try {
        if ($db['driver'] === 'pgsql') {
            $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s', $db['host'], $db['port'], $db['database']);
            $sqlTabelas = "SELECT tablename FROM pg_tables WHERE schemaname = current_schema()";
            $comando = "psql -h {$db['host']} -U {$db['username']} {$db['database']} -f database/schema.pgsql.sql";
        } else {
            $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $db['host'], $db['port'], $db['database']);
            $sqlTabelas = 'SHOW TABLES';
            $comando = "mysql -u root -p {$db['database']} < database/schema.sql";
        }
        $pdo = new PDO($dsn, $db['username'], $db['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $tabelas = $pdo->query($sqlTabelas)->fetchAll(PDO::FETCH_COLUMN);
        echo "ok.\n";
        if (!in_array('usuarios', $tabelas, true)) {
            echo "Atenção: as tabelas ainda não existem. Rode depois:\n";
            echo "  $comando\n";
        }
        break;
    } catch (PDOException $ex) {
        echo "falhou.\n  " . $ex->getMessage() . "\n";
        if (escolher('Tentar de novo?', ['s', 'n'], 's') !== 's') {
            echo "Nada foi gravado.\n";
            exit(1);
        }
    }
}
unset($db);

// E-mail
echo "\n— E-mail —\n";
echo "mail = servidor de e-mail do próprio servidor (Postfix/Exim)\n";
echo "smtp = provedor de e-mail com usuário e senha\n";
$mail = &$config['mail'];
$mail['transport'] = escolher('Forma de envio', ['mail', 'smtp'], $mail['transport']);
$mail['from_email'] = perguntar('Remetente dos e-mails automáticos', $mail['from_email']);
if ($mail['transport'] === 'smtp') {
    $mail['smtp']['host'] = perguntar('Servidor SMTP', $mail['smtp']['host']);
    $mail['smtp']['encryption'] = escolher('Criptografia', ['tls', 'ssl', 'none'], $mail['smtp']['encryption']);
    $portaPadrao = $mail['smtp']['encryption'] === 'ssl' ? '465' : '587';
    $mail['smtp']['port'] = (int) perguntar('Porta SMTP', $portaPadrao);
    $mail['smtp']['username'] = perguntar('Usuário SMTP', $mail['from_email']);
    $mail['smtp']['password'] = perguntar_senha('Senha SMTP (não aparece ao digitar)');
}
unset($mail);

// Gravação: caminhos dentro do projeto ficam relativos ao app/ (__DIR__), como no modelo.
$php = var_export($config, true);
$php = str_replace("'" . $appDir . '/', "__DIR__ . '/", $php);
$php = preg_replace(['/=>\s*\n\s*array \(/', '/^array \(/', '/^(\s*)\)(,?)$/m'], ['=> [', '[', '$1]$2'], $php);
$conteudo = "<?php\n// Gerado por bin/configurar.php em " . date('d/m/Y H:i') . ".\n"
    . "// Comentários sobre cada opção: app/config.example.php. Não publique este arquivo.\n"
    . "return $php;\n";

if (is_file($destino)) {
    $copia = $destino . '.bak-' . date('Ymd-His');
    copy($destino, $copia);
    chmod($copia, 0600);
    echo "\nCópia de segurança: $copia\n";
}
$antigo = umask(0027);
file_put_contents($destino, $conteudo);
umask($antigo);
chmod($destino, 0640);

echo "\nGravado em app/config.php (permissão 640).\n";
echo "Próximo passo: php bin/verificar.php\n";
