<?php
declare(strict_types=1);

/**
 * Envio de e-mail em texto simples (UTF-8).
 * Transportes: mail (função mail do PHP), smtp (autenticado) ou log (testes).
 * Retorna true quando o servidor aceitou a mensagem.
 */
function enviar_email(string|array $para, string $assunto, string $corpo, array $opcoes = []): bool
{
    $para = array_values(array_filter((array) $para));
    if (!$para) {
        return false;
    }
    $cc = array_values(array_filter((array) ($opcoes['cc'] ?? [])));
    $replyTo = $opcoes['reply_to'] ?? null;
    $fromEmail = config('mail.from_email');
    $fromName = config('mail.from_name');
    $dominio = substr(strrchr($fromEmail, '@') ?: '@localhost', 1);

    $headers = [
        'Date' => date(DATE_RFC2822),
        'From' => mb_encode_mimeheader($fromName, 'UTF-8', 'Q') . " <$fromEmail>",
        'Message-ID' => '<' . bin2hex(random_bytes(12)) . '@' . $dominio . '>',
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding' => 'base64',
        'Auto-Submitted' => 'auto-generated',
    ];
    if ($cc) {
        $headers['Cc'] = implode(', ', $cc);
    }
    if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $headers['Reply-To'] = $replyTo;
    }
    $assuntoCod = mb_encode_mimeheader($assunto, 'UTF-8', 'B', "\r\n");
    $corpoCod = rtrim(chunk_split(base64_encode(str_replace("\n", "\r\n", str_replace("\r\n", "\n", $corpo)))));

    $transport = config('mail.transport', 'mail');
    try {
        if ($transport === 'log') {
            $linha = sprintf("[%s] Para: %s%s\nAssunto: %s\n%s\n%s\n", now(), implode(', ', $para),
                $cc ? ' | Cc: ' . implode(', ', $cc) : '', $assunto, $corpo, str_repeat('-', 60));
            return file_put_contents(APP_ROOT . '/storage/logs/mail.log', $linha, FILE_APPEND | LOCK_EX) !== false;
        }
        if ($transport === 'smtp') {
            $headers['To'] = implode(', ', $para);
            $headers['Subject'] = $assuntoCod;
            return smtp_enviar($fromEmail, array_merge($para, $cc), $headers, $corpoCod);
        }
        $linhas = [];
        foreach ($headers as $k => $v) {
            $linhas[] = "$k: $v";
        }
        return mail(implode(', ', $para), $assuntoCod, $corpoCod, implode("\r\n", $linhas), '-f' . $fromEmail);
    } catch (Throwable $ex) {
        error_log('Falha no envio de e-mail: ' . $ex->getMessage());
        return false;
    }
}

function smtp_enviar(string $from, array $destinatarios, array $headers, string $corpo): bool
{
    $c = config('mail.smtp');
    $host = $c['host'];
    $enc = $c['encryption'] ?? 'tls';
    $remote = ($enc === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . (int) $c['port'];
    $ctx = stream_context_create(['ssl' => ['peer_name' => $host, 'verify_peer' => true, 'verify_peer_name' => true]]);
    $fp = @stream_socket_client($remote, $errno, $errstr, (int) ($c['timeout'] ?? 15), STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) {
        throw new RuntimeException("SMTP: não conectou em $remote ($errstr)");
    }
    stream_set_timeout($fp, (int) ($c['timeout'] ?? 15));

    $ler = function () use ($fp): array {
        $texto = '';
        while (($linha = fgets($fp, 1024)) !== false) {
            $texto .= $linha;
            if (strlen($linha) < 4 || $linha[3] === ' ') {
                break;
            }
        }
        return [(int) substr($texto, 0, 3), $texto];
    };
    $cmd = function (string $linha, array $esperado) use ($fp, $ler): string {
        fwrite($fp, $linha . "\r\n");
        [$code, $texto] = $ler();
        if (!in_array($code, $esperado, true)) {
            throw new RuntimeException('SMTP: resposta inesperada ' . trim($texto));
        }
        return $texto;
    };

    [$code] = $ler();
    if ($code !== 220) {
        throw new RuntimeException('SMTP: servidor não respondeu 220');
    }
    $ehlo = gethostname() ?: 'localhost';
    $cmd("EHLO $ehlo", [250]);
    if ($enc === 'tls') {
        $cmd('STARTTLS', [220]);
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) {
            throw new RuntimeException('SMTP: falha no STARTTLS');
        }
        $cmd("EHLO $ehlo", [250]);
    }
    if (!empty($c['username'])) {
        $cmd('AUTH LOGIN', [334]);
        $cmd(base64_encode($c['username']), [334]);
        $cmd(base64_encode($c['password']), [235]);
    }
    $cmd("MAIL FROM:<$from>", [250]);
    foreach ($destinatarios as $rcpt) {
        $cmd("RCPT TO:<$rcpt>", [250, 251]);
    }
    $cmd('DATA', [354]);
    $msg = '';
    foreach ($headers as $k => $v) {
        $msg .= "$k: $v\r\n";
    }
    $msg .= "\r\n" . $corpo . "\r\n";
    $msg = preg_replace('/^\./m', '..', $msg);
    $cmd($msg . '.', [250]);
    $cmd('QUIT', [221]);
    fclose($fp);
    return true;
}
