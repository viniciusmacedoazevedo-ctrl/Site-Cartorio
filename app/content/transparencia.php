<?php
/*
 * Rubricas do campo "Transparência" (Resolução CNJ nº 215/2015, art. 6º, § 3º,
 * com redação da Resolução CNJ nº 670/2025). Os grupos seguem os incisos da norma.
 * Confirme a classificação com a contabilidade e as orientações da Corregedoria do RN.
 * 'chave' identifica a rubrica no banco: não altere depois de lançar valores.
 */
return [
    ['chave' => 'emolumentos_publica', 'grupo' => 'Receitas públicas', 'rotulo' => 'Emolumentos (parcela pública)'],
    ['chave' => 'fdj',    'grupo' => 'Receitas públicas', 'rotulo' => 'FDJ – Fundo de reaparelhamento da Justiça'],
    ['chave' => 'fcrcpn', 'grupo' => 'Receitas públicas', 'rotulo' => 'FCRCPN – Fundo de compensação do Registro Civil'],
    ['chave' => 'frmp',   'grupo' => 'Receitas públicas', 'rotulo' => 'FRMP – outros fundos especiais'],
    ['chave' => 'funaf',  'grupo' => 'Receitas públicas', 'rotulo' => 'FUNAF – outros fundos especiais'],
    ['chave' => 'iss',    'grupo' => 'Tributos',          'rotulo' => 'ISS recolhido ao Município'],
    ['chave' => 'despesas_publicas', 'grupo' => 'Despesas públicas', 'rotulo' => 'Despesas públicas'],
];
