<?php
declare(strict_types=1);

/**
 * Processa o POST de um formulário público. Em caso de sucesso redireciona
 * para /enviado; senão devolve [valores, erros, mensagem geral].
 */
function processar_envio(string $chave): array
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        csrf_token(); // abre a sessão para o formulário
        return [[], [], null];
    }
    $valores = $_POST;
    if (!csrf_ok()) {
        return [$valores, [], 'A página ficou aberta por muito tempo. Confira os dados e envie de novo.'];
    }
    if (parece_robo($_POST)) {
        return [$valores, [], 'Não foi possível confirmar o envio. Aguarde alguns segundos e envie de novo.'];
    }
    if (limite_excedido('form')) {
        return [$valores, [], 'Muitos envios em pouco tempo a partir desta conexão. Aguarde 15 minutos ou ligue para ' . cartorio('telefone') . '.'];
    }
    [$dados, $erros] = validar_formulario($chave, $_POST);
    $anexo = null;
    if (isset(formularios()[$chave]['campos']['anexo']) && isset($_FILES['anexo'])) {
        if (!$erros) {
            [$anexo, $erroAnexo] = processar_anexo($_FILES['anexo']);
            if ($erroAnexo) {
                $erros['anexo'] = $erroAnexo;
            }
        } elseif (($_FILES['anexo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
            $erros['anexo'] = 'Por segurança, selecione o arquivo de novo antes de enviar.';
        }
    }
    if ($erros) {
        $n = count($erros);
        return [$valores, $erros, $n === 1 ? 'Corrija o campo indicado para enviar.' : "Corrija os $n campos indicados para enviar."];
    }
    registrar_tentativa('form');
    try {
        $reg = criar_registro($chave, $dados, $anexo);
    } catch (Throwable $ex) {
        error_log('Erro ao gravar registro: ' . $ex->getMessage());
        if ($anexo) {
            @unlink(rtrim(config('uploads.path'), '/') . '/' . $anexo['arquivo']);
        }
        return [$valores, [], 'O envio não foi concluído por um erro no sistema. Tente de novo em alguns minutos ou ligue para ' . cartorio('telefone') . '.'];
    }
    notificar_registro($reg, $anexo);
    session_regenerate_id(true);
    flash('enviado', [
        'protocolo' => $reg['protocolo'],
        'codigo' => $reg['codigo_acesso'],
        'titulo' => formularios()[$chave]['titulo'],
        'email' => $reg['email'],
    ]);
    redirect('/enviado#conteudo');
}

function aviso_geral(?string $msg): string
{
    return $msg ? '<div class="alerta alerta-erro" role="alert" tabindex="-1" data-foco>' . e($msg) . '</div>' : '';
}
