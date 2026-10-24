'use strict';
/** Definição dos formulários públicos, validação e montagem dos campos (igual ao site em PHP). */
const { cfg, cartorio, SERVICOS, html, raw, e, md5, hmac, igualSeguro, tamanho, soDigitos, cpfValido, cpfFormatado, emailValido, hoje, dois } = require('./base');

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

const statusClasse = (s) => ({ Novo: 'novo', 'Em análise': 'analise', 'Aguardando cliente': 'aguardando', Concluído: 'concluido', Arquivado: 'arquivado' })[s] || 'novo';

/** Lista de opções em ordem: [[valor, rótulo], ...]. */
function servicosLista() {
  const lista = [];
  for (const g of SERVICOS) for (const s of g.itens) lista.push([s.slug, s.nome]);
  lista.push(['outro', 'Outro serviço ou dúvida']);
  return lista;
}

const nomeServico = (slug) => (servicosLista().find(([v]) => v === slug) || [null, slug])[1];

/**
 * Feriados nacionais de datas fixas (Lei nº 662/1949, com a redação da Lei nº 10.607/2002;
 * Lei nº 6.802/1980; Lei nº 14.759/2023), mais os dias de 'feriados_extras' em content/cartorio.json.
 */
function feriados(ano) {
  const f = {
    [`${ano}-01-01`]: 'Confraternização Universal',
    [`${ano}-04-21`]: 'Tiradentes',
    [`${ano}-05-01`]: 'Dia do Trabalho',
    [`${ano}-09-07`]: 'Independência do Brasil',
    [`${ano}-10-12`]: 'Nossa Senhora Aparecida',
    [`${ano}-11-02`]: 'Finados',
    [`${ano}-11-15`]: 'Proclamação da República',
    [`${ano}-11-20`]: 'Dia Nacional de Zumbi e da Consciência Negra',
    [`${ano}-12-25`]: 'Natal',
  };
  const extras = cartorio('feriados_extras');
  if (extras && !Array.isArray(extras)) {
    for (const [data, nome] of Object.entries(extras)) if (data.startsWith(`${ano}-`)) f[data] = nome;
  }
  return f;
}

const SEMANA = ['', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira'];

/** Próximos dias úteis para o agendamento, a partir de amanhã: sem sábados, domingos e feriados. */
function diasUteisAgendamento(quantos = 45) {
  const dias = [['', 'Sem preferência']];
  const cache = {};
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (dias.length <= quantos) {
    const ano = d.getFullYear();
    cache[ano] = cache[ano] || feriados(ano);
    const n = d.getDay() === 0 ? 7 : d.getDay();
    const chave = `${ano}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
    if (n <= 5 && !cache[ano][chave]) dias.push([chave, `${SEMANA[n]}, ${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${ano}`]);
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

/** Feriados entre hoje e a última data de agendamento, para o calendário mostrar o motivo. */
function feriadosAgendamento() {
  const ano = new Date().getFullYear();
  return { ...feriados(ano), ...feriados(ano + 1) };
}

const pares = (lista) => lista.map((v) => [v, v]);

/**
 * Definição dos formulários. 'tipo_campo' indica qual campo vira a coluna "tipo"
 * do registro (usada em filtros e na permissão do perfil Atendente).
 */
function formularios() {
  return {
    pedido: {
      titulo: 'Solicitação de serviço ou agendamento',
      prefixo: 'PED',
      tipo_campo: 'servico',
      campos: {
        servico: { label: 'Serviço', type: 'select', options: servicosLista(), required: true },
        modalidade: { label: 'Como prefere ser atendido', type: 'radio', options: [
          ['Pedido online', 'Pedido online: o cartório responde por e-mail ou telefone'],
          ['Agendamento presencial', 'Agendar atendimento no cartório'],
        ], required: true },
        data_preferida: { label: 'Data preferida', type: 'select', options: diasUteisAgendamento(), hint: 'Atendimento de segunda a sexta, exceto feriados. O cartório confirma a data com você.' },
        periodo: { label: 'Período', type: 'select', options: [['', 'Sem preferência'], ['Manhã', 'Manhã (8h às 12h)'], ['Tarde', 'Tarde (13h às 17h)']] },
        nome: { label: 'Nome completo', type: 'text', required: true, max: 150, autocomplete: 'name' },
        cpf: { label: 'CPF', type: 'cpf', hint: 'Ajuda a localizar seus registros.' },
        email: { label: 'E-mail', type: 'email', max: 150, autocomplete: 'email', hint: 'Informe e-mail ou telefone. O protocolo é enviado para este e-mail.' },
        telefone: { label: 'Telefone ou WhatsApp', type: 'tel', max: 30, autocomplete: 'tel' },
        mensagem: { label: 'Descreva o que você precisa', type: 'textarea', required: true, max: 4000 },
        anexo: { label: 'Anexar documento', type: 'file', hint: 'PDF, JPG ou PNG de até 5 MB.' },
      },
      regra: 'contato_obrigatorio',
    },
    ouvidoria: {
      titulo: 'Ouvidoria',
      prefixo: 'OUV',
      tipo_campo: 'tipo',
      campos: {
        tipo: { label: 'Tipo de manifestação', type: 'radio', options: pares(OUVIDORIA_TIPOS), required: true },
        nome: { label: 'Nome', type: 'text', max: 150, hint: 'Você pode se manifestar sem se identificar.', autocomplete: 'name' },
        email: { label: 'E-mail', type: 'email', max: 150, hint: 'Informe para receber o protocolo e a resposta.', autocomplete: 'email' },
        telefone: { label: 'Telefone', type: 'tel', max: 30, autocomplete: 'tel' },
        mensagem: { label: 'Sua mensagem', type: 'textarea', required: true, max: 6000 },
        anexo: { label: 'Anexar arquivo', type: 'file', hint: 'PDF, JPG ou PNG de até 5 MB.' },
      },
    },
    lgpd: {
      titulo: 'Solicitação de direitos do titular (LGPD)',
      prefixo: 'LGPD',
      tipo_campo: 'direito',
      campos: {
        direito: { label: 'O que você deseja solicitar', type: 'select', options: [['', 'Escolha uma opção'], ...pares(LGPD_DIREITOS)], required: true },
        nome: { label: 'Nome completo', type: 'text', required: true, max: 150, autocomplete: 'name' },
        cpf: { label: 'CPF', type: 'cpf', required: true, hint: 'Necessário para confirmar que os dados são seus.' },
        email: { label: 'E-mail', type: 'email', required: true, max: 150, autocomplete: 'email' },
        telefone: { label: 'Telefone', type: 'tel', max: 30, autocomplete: 'tel' },
        mensagem: { label: 'Detalhe sua solicitação', type: 'textarea', required: true, max: 4000 },
      },
    },
    contato: {
      titulo: 'Fale com o cartório',
      prefixo: 'CTT',
      tipo_campo: 'assunto',
      campos: {
        nome: { label: 'Nome', type: 'text', required: true, max: 150, autocomplete: 'name' },
        email: { label: 'E-mail', type: 'email', required: true, max: 150, autocomplete: 'email' },
        telefone: { label: 'Telefone', type: 'tel', max: 30, autocomplete: 'tel' },
        assunto: { label: 'Assunto', type: 'text', max: 150 },
        mensagem: { label: 'Mensagem', type: 'textarea', required: true, max: 4000 },
      },
    },
  };
}

const temOpcao = (campo, valor) => campo.options.some(([v]) => String(v) === valor);

/** Valida os campos enviados. Retorna [dados, erros]. */
function validarFormulario(chave, valores) {
  const def = formularios()[chave];
  const dados = {};
  const erros = {};
  for (const [nome, campo] of Object.entries(def.campos)) {
    if (campo.type === 'file') continue;
    let valor = typeof valores[nome] === 'string' ? valores[nome].trim() : '';
    valor = valor.replace(/\0/g, '');
    const obrigatorio = Boolean(campo.required);
    if (valor === '') {
      if (obrigatorio) erros[nome] = ['select', 'radio'].includes(campo.type) ? 'Escolha uma opção.' : 'Preencha este campo.';
      dados[nome] = '';
      continue;
    }
    const max = campo.max || 4000;
    if (tamanho(valor) > max) erros[nome] = `Use no máximo ${max} caracteres.`;
    switch (campo.type) {
      case 'email':
        if (!emailValido(valor)) erros[nome] = 'Digite um e-mail válido, como nome@exemplo.com.';
        break;
      case 'cpf':
        if (!cpfValido(valor)) erros[nome] = 'CPF inválido. Confira os 11 números.';
        else valor = cpfFormatado(valor);
        break;
      case 'tel':
        if (soDigitos(valor).length < 10) erros[nome] = 'Digite o telefone com DDD.';
        break;
      case 'select':
      case 'radio':
        if (!temOpcao(campo, valor)) erros[nome] = 'Escolha uma das opções.';
        break;
      default:
        break;
    }
    dados[nome] = valor;
  }
  if (def.regra === 'contato_obrigatorio' && dados.email === '' && dados.telefone === '') {
    erros.email = 'Informe um e-mail ou um telefone para o cartório falar com você.';
  }
  if (!valores.aceite) erros.aceite = 'Marque esta opção para enviar.';
  return [dados, erros];
}

/** Monta um campo com rótulo, dica e erro. */
function campo(ctx, chave, nome, valores = {}, erros = {}) {
  const c = formularios()[chave].campos[nome];
  const id = `f-${chave}-${nome}`;
  let valor = nome in valores ? valores[nome] : ctx.query.get(nome) ?? '';
  valor = typeof valor === 'string' ? valor : '';
  const erro = erros[nome] || null;
  const req = Boolean(c.required);
  const descr = [];
  if (c.hint) descr.push(`${id}-dica`);
  if (erro) descr.push(`${id}-erro`);
  const aria = raw((descr.length ? ` aria-describedby="${descr.join(' ')}"` : '') + (erro ? ' aria-invalid="true"' : '') + (req ? ' required' : ''));
  const rotulo = html`${c.label}${req ? '' : raw(' <span class="opcional">(opcional)</span>')}`;
  const dica = c.hint ? html`<p class="dica" id="${id}-dica">${c.hint}</p>` : '';
  const erroHtml = erro ? html`<p class="erro" id="${id}-erro">${erro}</p>` : '';
  const classe = `campo campo-${c.type}${erro ? ' tem-erro' : ''}`;

  if (c.type === 'radio') {
    const opcoes = c.options.map(([v, txt]) => {
      const oid = `${id}-${md5(String(v)).slice(0, 6)}`;
      return html`<label class="opcao" for="${oid}"><input type="radio" id="${oid}" name="${nome}" value="${v}"${raw(String(v) === valor ? ' checked' : '')}${raw(req ? ' required' : '')}><span>${txt}</span></label>`;
    });
    return html`<fieldset class="${classe}"${raw(descr.length ? ` aria-describedby="${descr.join(' ')}"` : '')}><legend>${rotulo}</legend>${dica}<div class="opcoes">${opcoes}</div>${erroHtml}</fieldset>`;
  }

  let controle;
  switch (c.type) {
    case 'textarea':
      controle = html`<textarea id="${id}" name="${nome}" rows="6" maxlength="${c.max || 4000}"${aria}>${valor}</textarea>`;
      break;
    case 'select': {
      const vazia = c.options.some(([v]) => v === '') ? '' : raw('<option value="">Escolha uma opção</option>');
      const opcoes = c.options.map(([v, txt]) => html`<option value="${v}"${raw(String(v) === valor ? ' selected' : '')}>${txt}</option>`);
      controle = html`<select id="${id}" name="${nome}"${aria}>${vazia}${opcoes}</select>`;
      break;
    }
    case 'file':
      controle = html`<input type="file" id="${id}" name="${nome}" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"${aria}>`;
      break;
    default: {
      const tipos = { email: 'email', tel: 'tel', date: 'date', cpf: 'text', text: 'text' };
      let extra = '';
      if (c.type === 'cpf') extra = ' inputmode="numeric" maxlength="14" placeholder="000.000.000-00" data-mascara="cpf"';
      else if (c.type === 'tel') extra = ' inputmode="tel" data-mascara="tel"';
      else if (c.type === 'date') extra = ` min="${hoje()}"`;
      if (c.max) extra += ` maxlength="${c.max}"`;
      if (c.autocomplete) extra += ` autocomplete="${c.autocomplete}"`;
      controle = html`<input type="${tipos[c.type]}" id="${id}" name="${nome}" value="${valor}"${raw(extra)}${aria}>`;
    }
  }
  return html`<div class="${classe}"><label for="${id}">${rotulo}</label>${dica}${controle}${erroHtml}</div>`;
}

const csrfCampo = (ctx) => html`<input type="hidden" name="_csrf" value="${ctx.csrfToken()}">`;

function assinaturaTempo() {
  const t = String(Math.floor(Date.now() / 1000));
  return `${t}.${hmac(t)}`;
}

/** Campos comuns ao fim de todo formulário: aceite, armadilha anti-robô, CSRF. */
function rodapeFormulario(ctx, chave, erros = {}, botao = 'Enviar') {
  const erro = erros.aceite || null;
  const id = `f-${chave}-aceite`;
  return html`<div class="campo campo-aceite${erro ? ' tem-erro' : ''}"><label class="opcao" for="${id}"><input type="checkbox" id="${id}" name="aceite" value="1" required${raw(erro ? ` aria-invalid="true" aria-describedby="${id}-erro"` : '')}><span>Li o <a href="/privacidade" data-dialogo="aviso-privacidade">Aviso de Privacidade</a> e concordo com o uso dos meus dados para atender esta solicitação.</span></label>${erro ? html`<p class="erro" id="${id}-erro">${erro}</p>` : ''}</div><div class="armadilha" aria-hidden="true"><label>Não preencha este campo<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div><input type="hidden" name="_t" value="${assinaturaTempo()}">${csrfCampo(ctx)}<button type="submit" class="botao botao-primario">${botao}</button>`;
}

/** Rejeita envios automáticos: armadilha preenchida ou formulário enviado rápido demais. */
function pareceRobo(valores) {
  if (valores.website) return true;
  const partes = String(valores._t || '').split('.');
  if (partes.length !== 2 || !igualSeguro(hmac(partes[0]), partes[1])) return true;
  const decorrido = Math.floor(Date.now() / 1000) - Number(partes[0]);
  return decorrido < 3 || decorrido > 86400;
}

module.exports = {
  OUVIDORIA_TIPOS, LGPD_DIREITOS, STATUS, statusClasse, servicosLista, nomeServico, feriados,
  diasUteisAgendamento, feriadosAgendamento, formularios, validarFormulario, campo, csrfCampo,
  rodapeFormulario, pareceRobo, assinaturaTempo, e, cfg,
};
