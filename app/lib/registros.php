<?php
declare(strict_types=1);

const CODIGO_LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sem I e O, para não confundir com 1 e 0

function limite_excedido(string $acao): bool
{
    $janela = (int) config('rate_limit.janela_min', 15);
    $max = (int) config('rate_limit.max', 6);
    $desde = date('Y-m-d H:i:s', time() - $janela * 60);
    q('DELETE FROM limites WHERE criado_em < ?', [date('Y-m-d H:i:s', time() - 86400)]);
    $n = (int) q_val('SELECT COUNT(*) FROM limites WHERE ip_hash = ? AND acao = ? AND criado_em >= ?', [ip_hash(), $acao, $desde]);
    return $n >= $max;
}

function registrar_tentativa(string $acao): void
{
    q('INSERT INTO limites (ip_hash, acao, criado_em) VALUES (?, ?, ?)', [ip_hash(), $acao, now()]);
}

/** Valida e guarda o anexo fora da pasta pública. Retorna [info|null, erro|null]. */
function processar_anexo(array $file): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return [null, null];
    }
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return [null, $file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE
            ? 'O arquivo passa de 5 MB. Envie um arquivo menor.'
            : 'Não foi possível receber o arquivo. Tente novamente.'];
    }
    if ($file['size'] > config('uploads.max_bytes')) {
        return [null, 'O arquivo passa de 5 MB. Envie um arquivo menor.'];
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $ext = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'][$mime] ?? null;
    if (!$ext) {
        return [null, 'Formato não aceito. Envie PDF, JPG ou PNG.'];
    }
    $sub = date('Y/m');
    $dir = rtrim(config('uploads.path'), '/') . '/' . $sub;
    if (!is_dir($dir) && !mkdir($dir, 0750, true)) {
        return [null, 'Não foi possível guardar o arquivo. Tente novamente.'];
    }
    $nome = bin2hex(random_bytes(16)) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], "$dir/$nome")) {
        return [null, 'Não foi possível guardar o arquivo. Tente novamente.'];
    }
    $original = mb_substr(preg_replace('/[^\p{L}\p{N}._ -]+/u', '_', basename((string) $file['name'])) ?: "anexo.$ext", 0, 150);
    return [['arquivo' => "$sub/$nome", 'nome_original' => $original, 'mime' => $mime, 'tamanho' => (int) $file['size']], null];
}

/** Grava o registro com protocolo e código de acesso. Retorna o registro criado. */
function criar_registro(string $chave, array $dados, ?array $anexo): array
{
    $def = formularios()[$chave];
    $ano = (int) date('Y');
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $numero = proximo_numero($def['prefixo'], $ano);
        $protocolo = sprintf('%s-%d-%06d', $def['prefixo'], $ano, $numero);
        $codigo = '';
        for ($i = 0; $i < 4; $i++) {
            $codigo .= CODIGO_LETRAS[random_int(0, strlen(CODIGO_LETRAS) - 1)];
        }
        $tipoCampo = $def['tipo_campo'];
        $tipo = $dados[$tipoCampo] ?? '';
        if ($chave === 'pedido') {
            $tipo = servicos_lista()[$tipo] ?? $tipo;
        }
        $extras = array_diff_key($dados, array_flip(['nome', 'cpf', 'email', 'telefone', 'mensagem']));
        if ($chave === 'pedido' && isset($extras['servico'])) {
            $extras['servico'] = servicos_lista()[$extras['servico']] ?? $extras['servico'];
        }
        q('INSERT INTO registros (protocolo, codigo_acesso, formulario, tipo, nome, cpf, email, telefone, mensagem, dados_json, status, ip, user_agent, criado_em, atualizado_em)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            $protocolo, $codigo, $chave, mb_substr($tipo, 0, 150),
            $dados['nome'] ?? '', $dados['cpf'] ?? '', $dados['email'] ?? '', $dados['telefone'] ?? '',
            $dados['mensagem'] ?? '', json_encode($extras, JSON_UNESCAPED_UNICODE),
            'Novo', client_ip(), mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250), now(), now(),
        ]);
        $id = (int) $pdo->lastInsertId();
        if ($anexo) {
            q('INSERT INTO anexos (registro_id, arquivo, nome_original, mime, tamanho, criado_em) VALUES (?, ?, ?, ?, ?, ?)',
                [$id, $anexo['arquivo'], $anexo['nome_original'], $anexo['mime'], $anexo['tamanho'], now()]);
        }
        historico($id, null, 'Recebido pelo site');
        $pdo->commit();
    } catch (Throwable $ex) {
        $pdo->rollBack();
        throw $ex;
    }
    return q_one('SELECT * FROM registros WHERE id = ?', [$id]);
}

function historico(int $registroId, ?int $usuarioId, string $acao, string $detalhe = ''): void
{
    q('INSERT INTO historico (registro_id, usuario_id, acao, detalhe, criado_em) VALUES (?, ?, ?, ?, ?)',
        [$registroId, $usuarioId, $acao, $detalhe, now()]);
}

function rotulos_extras(string $chave): array
{
    $r = [];
    foreach (formularios()[$chave]['campos'] as $nome => $c) {
        $r[$nome] = $c['label'];
    }
    return $r;
}

/** E-mail para a caixa do setor e, se houver e-mail, confirmação ao cliente. */
function notificar_registro(array $reg, ?array $anexo): void
{
    $chave = $reg['formulario'];
    $def = formularios()[$chave];
    $rotulos = rotulos_extras($chave);
    $extras = json_decode($reg['dados_json'] ?: '{}', true) ?: [];
    $painel = rtrim(config('base_url'), '/') . '/admin/registro?id=' . $reg['id'];

    $linhas = ["Novo registro recebido pelo site.", '', "Formulário: {$def['titulo']}", "Protocolo: {$reg['protocolo']}", 'Data: ' . data_br($reg['criado_em']), ''];
    foreach ($extras as $k => $v) {
        if ($v !== '') {
            $linhas[] = ($rotulos[$k] ?? $k) . ': ' . ($k === 'data_preferida' ? data_br($v, false) : $v);
        }
    }
    foreach (['nome' => 'Nome', 'cpf' => 'CPF', 'email' => 'E-mail', 'telefone' => 'Telefone'] as $k => $rot) {
        $linhas[] = "$rot: " . ($reg[$k] !== '' ? $reg[$k] : 'não informado');
    }
    $linhas[] = '';
    $linhas[] = 'Mensagem:';
    $linhas[] = $reg['mensagem'];
    if ($anexo) {
        $linhas[] = '';
        $linhas[] = "Anexo: {$anexo['nome_original']} (disponível no painel)";
    }
    $linhas[] = '';
    $linhas[] = "Abrir no painel: $painel";

    $destino = config("destinos.$chave");
    $cc = $chave === 'lgpd' ? [config('destinos.lgpd_copia')] : [];
    $assunto = "[{$reg['protocolo']}] {$def['titulo']}" . ($reg['tipo'] ? " – {$reg['tipo']}" : '');
    $ok = enviar_email($destino, $assunto, implode("\n", $linhas), ['cc' => $cc, 'reply_to' => $reg['email'] ?: null]);
    historico((int) $reg['id'], null, $ok ? 'E-mail enviado ao cartório' : 'Falha no e-mail ao cartório', (string) $destino);

    if ($reg['email'] !== '') {
        $consulta = rtrim(config('base_url'), '/') . '/protocolo';
        $nome = $reg['nome'] !== '' ? $reg['nome'] : 'Olá';
        $corpo = implode("\n", [
            $reg['nome'] !== '' ? "Olá, $nome." : 'Olá.',
            '',
            "Recebemos sua solicitação: {$def['titulo']}.",
            '',
            "Protocolo: {$reg['protocolo']}",
            "Código de consulta: {$reg['codigo_acesso']}",
            '',
            "Para acompanhar, acesse $consulta e informe o protocolo e o código.",
            '',
            'Guarde este e-mail. Não responda: esta caixa não é lida.',
            'Dúvidas: ' . cartorio('emails.contato') . ' ou ' . cartorio('telefone') . '.',
            '',
            cartorio('nome_oficial'),
            cartorio('endereco') . ' – ' . cartorio('cidade'),
        ]);
        $ok = enviar_email($reg['email'], "Protocolo {$reg['protocolo']} – " . cartorio('nome_curto'), $corpo);
        historico((int) $reg['id'], null, $ok ? 'Protocolo enviado ao cliente' : 'Falha no e-mail ao cliente', $reg['email']);
    }
}

function consultar_protocolo(string $protocolo, string $codigo): ?array
{
    $protocolo = strtoupper(trim($protocolo));
    $codigo = strtoupper(trim($codigo));
    if (!preg_match('/^[A-Z]{3,4}-\d{4}-\d{6}$/', $protocolo) || !preg_match('/^[A-Z]{4}$/', $codigo)) {
        return null;
    }
    $reg = q_one('SELECT protocolo, codigo_acesso, formulario, tipo, status, retorno_publico, criado_em, atualizado_em FROM registros WHERE protocolo = ?', [$protocolo]);
    if (!$reg || !hash_equals($reg['codigo_acesso'], $codigo)) {
        return null;
    }
    return $reg;
}
