<?php
declare(strict_types=1);

const OUVIDORIA_TIPOS = ['Denúncia', 'Reclamação', 'Sugestão', 'Elogio', 'Outro'];

const LGPD_DIREITOS = [
    'Confirmação e acesso aos meus dados',
    'Correção de dados incompletos, inexatos ou desatualizados',
    'Anonimização, bloqueio ou eliminação de dados desnecessários',
    'Portabilidade dos meus dados',
    'Eliminação de dados tratados com meu consentimento',
    'Informação sobre compartilhamento dos meus dados',
    'Informação sobre não dar consentimento e suas consequências',
    'Revogação do consentimento',
    'Oposição ao tratamento',
];

const STATUS = ['Novo', 'Em análise', 'Aguardando cliente', 'Concluído', 'Arquivado'];

function status_classe(string $status): string
{
    return ['Novo' => 'novo', 'Em análise' => 'analise', 'Aguardando cliente' => 'aguardando', 'Concluído' => 'concluido', 'Arquivado' => 'arquivado'][$status] ?? 'novo';
}

function servicos_lista(): array
{
    static $lista = null;
    if ($lista === null) {
        $lista = [];
        foreach (require APP_DIR . '/content/servicos.php' as $grupo) {
            foreach ($grupo['itens'] as $item) {
                $lista[$item['slug']] = $item['nome'];
            }
        }
        $lista['outro'] = 'Outro serviço ou dúvida';
    }
    return $lista;
}

/**
 * Definição dos formulários. 'tipo_campo' indica qual campo vira a coluna "tipo"
 * do registro (usada em filtros e na permissão do perfil Atendente).
 */
function formularios(): array
{
    return [
        'pedido' => [
            'titulo' => 'Solicitação de serviço ou agendamento',
            'prefixo' => 'PED',
            'tipo_campo' => 'servico',
            'campos' => [
                'servico' => ['label' => 'Serviço', 'type' => 'select', 'options' => servicos_lista(), 'required' => true],
                'modalidade' => ['label' => 'Como prefere ser atendido', 'type' => 'radio', 'options' => [
                    'Pedido online' => 'Pedido online: o cartório responde por e-mail ou telefone',
                    'Agendamento presencial' => 'Agendar atendimento no cartório',
                ], 'required' => true],
                'data_preferida' => ['label' => 'Data preferida', 'type' => 'date', 'hint' => 'Só para agendamento. O cartório confirma a data com você.'],
                'periodo' => ['label' => 'Período', 'type' => 'select', 'options' => ['' => 'Sem preferência', 'Manhã' => 'Manhã (8h às 12h)', 'Tarde' => 'Tarde (13h às 17h)']],
                'nome' => ['label' => 'Nome completo', 'type' => 'text', 'required' => true, 'max' => 150, 'autocomplete' => 'name'],
                'cpf' => ['label' => 'CPF', 'type' => 'cpf', 'hint' => 'Ajuda a localizar seus registros.'],
                'email' => ['label' => 'E-mail', 'type' => 'email', 'max' => 150, 'autocomplete' => 'email', 'hint' => 'Informe e-mail ou telefone. O protocolo é enviado para este e-mail.'],
                'telefone' => ['label' => 'Telefone ou WhatsApp', 'type' => 'tel', 'max' => 30, 'autocomplete' => 'tel'],
                'mensagem' => ['label' => 'Descreva o que você precisa', 'type' => 'textarea', 'required' => true, 'max' => 4000],
                'anexo' => ['label' => 'Anexar documento', 'type' => 'file', 'hint' => 'PDF, JPG ou PNG de até 5 MB.'],
            ],
            'regra' => 'contato_obrigatorio',
        ],
        'ouvidoria' => [
            'titulo' => 'Ouvidoria',
            'prefixo' => 'OUV',
            'tipo_campo' => 'tipo',
            'campos' => [
                'tipo' => ['label' => 'Tipo de manifestação', 'type' => 'radio', 'options' => array_combine(OUVIDORIA_TIPOS, OUVIDORIA_TIPOS), 'required' => true],
                'nome' => ['label' => 'Nome', 'type' => 'text', 'max' => 150, 'hint' => 'Você pode se manifestar sem se identificar.', 'autocomplete' => 'name'],
                'email' => ['label' => 'E-mail', 'type' => 'email', 'max' => 150, 'hint' => 'Informe para receber o protocolo e a resposta.', 'autocomplete' => 'email'],
                'telefone' => ['label' => 'Telefone', 'type' => 'tel', 'max' => 30, 'autocomplete' => 'tel'],
                'mensagem' => ['label' => 'Sua mensagem', 'type' => 'textarea', 'required' => true, 'max' => 6000],
                'anexo' => ['label' => 'Anexar arquivo', 'type' => 'file', 'hint' => 'PDF, JPG ou PNG de até 5 MB.'],
            ],
        ],
        'lgpd' => [
            'titulo' => 'Solicitação de direitos do titular (LGPD)',
            'prefixo' => 'LGPD',
            'tipo_campo' => 'direito',
            'campos' => [
                'direito' => ['label' => 'O que você deseja solicitar', 'type' => 'select', 'options' => ['' => 'Escolha uma opção'] + array_combine(LGPD_DIREITOS, LGPD_DIREITOS), 'required' => true],
                'nome' => ['label' => 'Nome completo', 'type' => 'text', 'required' => true, 'max' => 150, 'autocomplete' => 'name'],
                'cpf' => ['label' => 'CPF', 'type' => 'cpf', 'required' => true, 'hint' => 'Necessário para confirmar que os dados são seus.'],
                'email' => ['label' => 'E-mail', 'type' => 'email', 'required' => true, 'max' => 150, 'autocomplete' => 'email'],
                'telefone' => ['label' => 'Telefone', 'type' => 'tel', 'max' => 30, 'autocomplete' => 'tel'],
                'mensagem' => ['label' => 'Detalhe sua solicitação', 'type' => 'textarea', 'required' => true, 'max' => 4000],
            ],
        ],
        'contato' => [
            'titulo' => 'Fale com o cartório',
            'prefixo' => 'CTT',
            'tipo_campo' => 'assunto',
            'campos' => [
                'nome' => ['label' => 'Nome', 'type' => 'text', 'required' => true, 'max' => 150, 'autocomplete' => 'name'],
                'email' => ['label' => 'E-mail', 'type' => 'email', 'required' => true, 'max' => 150, 'autocomplete' => 'email'],
                'telefone' => ['label' => 'Telefone', 'type' => 'tel', 'max' => 30, 'autocomplete' => 'tel'],
                'assunto' => ['label' => 'Assunto', 'type' => 'text', 'max' => 150],
                'mensagem' => ['label' => 'Mensagem', 'type' => 'textarea', 'required' => true, 'max' => 4000],
            ],
        ],
    ];
}

/** Valida $_POST contra a definição. Retorna [dados, erros]. */
function validar_formulario(string $chave, array $input): array
{
    $def = formularios()[$chave];
    $dados = [];
    $erros = [];
    foreach ($def['campos'] as $nome => $campo) {
        if ($campo['type'] === 'file') {
            continue;
        }
        $valor = $input[$nome] ?? '';
        $valor = is_string($valor) ? trim($valor) : '';
        $valor = str_replace("\0", '', $valor);
        $req = !empty($campo['required']);

        if ($valor === '') {
            if ($req) {
                $erros[$nome] = in_array($campo['type'], ['select', 'radio'], true)
                    ? 'Escolha uma opção.'
                    : 'Preencha este campo.';
            }
            $dados[$nome] = '';
            continue;
        }
        $max = $campo['max'] ?? 4000;
        if (mb_strlen($valor) > $max) {
            $erros[$nome] = "Use no máximo $max caracteres.";
        }
        switch ($campo['type']) {
            case 'email':
                if (!filter_var($valor, FILTER_VALIDATE_EMAIL)) {
                    $erros[$nome] = 'Digite um e-mail válido, como nome@exemplo.com.';
                }
                break;
            case 'cpf':
                if (!cpf_valido($valor)) {
                    $erros[$nome] = 'CPF inválido. Confira os 11 números.';
                } else {
                    $valor = cpf_formatado($valor);
                }
                break;
            case 'tel':
                if (strlen(so_digitos($valor)) < 10) {
                    $erros[$nome] = 'Digite o telefone com DDD.';
                }
                break;
            case 'date':
                $d = DateTime::createFromFormat('Y-m-d', $valor);
                if (!$d || $d->format('Y-m-d') !== $valor) {
                    $erros[$nome] = 'Data inválida.';
                } elseif ($valor < date('Y-m-d')) {
                    $erros[$nome] = 'Escolha hoje ou uma data futura.';
                }
                break;
            case 'select':
            case 'radio':
                if (!array_key_exists($valor, $campo['options'])) {
                    $erros[$nome] = 'Escolha uma das opções.';
                }
                break;
        }
        $dados[$nome] = $valor;
    }
    if (($def['regra'] ?? '') === 'contato_obrigatorio' && $dados['email'] === '' && $dados['telefone'] === '') {
        $erros['email'] = 'Informe um e-mail ou um telefone para o cartório falar com você.';
    }
    if (empty($input['aceite'])) {
        $erros['aceite'] = 'Marque esta opção para enviar.';
    }
    return [$dados, $erros];
}

/** Renderiza um campo com rótulo, dica e erro. */
function campo(string $chave, string $nome, array $valores = [], array $erros = []): string
{
    $c = formularios()[$chave]['campos'][$nome];
    $id = "f-$chave-$nome";
    $valor = $valores[$nome] ?? ($_GET[$nome] ?? '');
    $valor = is_string($valor) ? $valor : '';
    $erro = $erros[$nome] ?? null;
    $req = !empty($c['required']);
    $descr = [];
    if (!empty($c['hint'])) {
        $descr[] = "$id-dica";
    }
    if ($erro) {
        $descr[] = "$id-erro";
    }
    $aria = ($descr ? ' aria-describedby="' . implode(' ', $descr) . '"' : '') . ($erro ? ' aria-invalid="true"' : '') . ($req ? ' required' : '');
    $rotulo = e($c['label']) . ($req ? '' : ' <span class="opcional">(opcional)</span>');
    $dica = !empty($c['hint']) ? '<p class="dica" id="' . $id . '-dica">' . e($c['hint']) . '</p>' : '';
    $erroHtml = $erro ? '<p class="erro" id="' . $id . '-erro">' . e($erro) . '</p>' : '';
    $classe = 'campo campo-' . $c['type'] . ($erro ? ' tem-erro' : '');

    if ($c['type'] === 'radio') {
        $html = '<fieldset class="' . $classe . '"' . ($descr ? ' aria-describedby="' . implode(' ', $descr) . '"' : '') . '><legend>' . $rotulo . '</legend>' . $dica . '<div class="opcoes">';
        foreach ($c['options'] as $v => $txt) {
            $oid = $id . '-' . substr(md5((string) $v), 0, 6);
            $html .= '<label class="opcao" for="' . $oid . '"><input type="radio" id="' . $oid . '" name="' . $nome . '" value="' . e($v) . '"'
                . ((string) $v === $valor ? ' checked' : '') . ($req ? ' required' : '') . '><span>' . e($txt) . '</span></label>';
        }
        return $html . '</div>' . $erroHtml . '</fieldset>';
    }

    $html = '<div class="' . $classe . '"><label for="' . $id . '">' . $rotulo . '</label>' . $dica;
    switch ($c['type']) {
        case 'textarea':
            $html .= '<textarea id="' . $id . '" name="' . $nome . '" rows="6" maxlength="' . ($c['max'] ?? 4000) . '"' . $aria . '>' . e($valor) . '</textarea>';
            break;
        case 'select':
            $html .= '<select id="' . $id . '" name="' . $nome . '"' . $aria . '>';
            if (!array_key_exists('', $c['options'])) {
                $html .= '<option value="">Escolha uma opção</option>';
            }
            foreach ($c['options'] as $v => $txt) {
                $html .= '<option value="' . e($v) . '"' . ((string) $v === $valor ? ' selected' : '') . '>' . e($txt) . '</option>';
            }
            $html .= '</select>';
            break;
        case 'file':
            $html .= '<input type="file" id="' . $id . '" name="' . $nome . '" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"' . $aria . '>';
            break;
        default:
            $tipos = ['email' => 'email', 'tel' => 'tel', 'date' => 'date', 'cpf' => 'text', 'text' => 'text'];
            $extra = '';
            if ($c['type'] === 'cpf') {
                $extra = ' inputmode="numeric" maxlength="14" placeholder="000.000.000-00" data-mascara="cpf"';
            } elseif ($c['type'] === 'tel') {
                $extra = ' inputmode="tel" data-mascara="tel"';
            } elseif ($c['type'] === 'date') {
                $extra = ' min="' . date('Y-m-d') . '"';
            }
            if (!empty($c['max'])) {
                $extra .= ' maxlength="' . $c['max'] . '"';
            }
            if (!empty($c['autocomplete'])) {
                $extra .= ' autocomplete="' . $c['autocomplete'] . '"';
            }
            $html .= '<input type="' . $tipos[$c['type']] . '" id="' . $id . '" name="' . $nome . '" value="' . e($valor) . '"' . $extra . $aria . '>';
    }
    return $html . $erroHtml . '</div>';
}

/** Campos comuns ao fim de todo formulário: aceite, armadilha anti-robô, CSRF. */
function rodape_formulario(string $chave, array $erros = [], string $botao = 'Enviar'): string
{
    $erro = $erros['aceite'] ?? null;
    $id = "f-$chave-aceite";
    $html = '<div class="campo campo-aceite' . ($erro ? ' tem-erro' : '') . '">'
        . '<label class="opcao" for="' . $id . '"><input type="checkbox" id="' . $id . '" name="aceite" value="1" required'
        . ($erro ? ' aria-invalid="true" aria-describedby="' . $id . '-erro"' : '') . '>'
        . '<span>Li o <a href="/privacidade" data-dialogo="aviso-privacidade">Aviso de Privacidade</a> e concordo com o uso dos meus dados para atender esta solicitação.</span></label>'
        . ($erro ? '<p class="erro" id="' . $id . '-erro">' . e($erro) . '</p>' : '') . '</div>';
    $html .= '<div class="armadilha" aria-hidden="true"><label>Não preencha este campo<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>';
    $html .= '<input type="hidden" name="_t" value="' . e(assinatura_tempo()) . '">';
    $html .= csrf_field();
    $html .= '<button type="submit" class="botao botao-primario">' . e($botao) . '</button>';
    return $html;
}

function assinatura_tempo(): string
{
    $t = (string) time();
    return $t . '.' . hash_hmac('sha256', $t, (string) config('app_key'));
}

/** Rejeita envios automáticos: armadilha preenchida ou formulário enviado rápido demais. */
function parece_robo(array $input): bool
{
    if (!empty($input['website'])) {
        return true;
    }
    $partes = explode('.', (string) ($input['_t'] ?? ''), 2);
    if (count($partes) !== 2 || !hash_equals(hash_hmac('sha256', $partes[0], (string) config('app_key')), $partes[1])) {
        return true;
    }
    $decorrido = time() - (int) $partes[0];
    return $decorrido < 3 || $decorrido > 86400;
}
