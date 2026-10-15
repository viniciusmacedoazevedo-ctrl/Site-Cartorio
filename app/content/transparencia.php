<?php
/*
 * Rubricas do campo "Transparência" (Resolução CNJ nº 215/2015, art. 6º, § 3º,
 * com redação da Resolução CNJ nº 670/2025). Os grupos seguem os incisos da norma.
 * Fundos da Lei estadual nº 11.038/2021 (FRMP: Lei nº 9.419/2010). ISS e despesas aparecem (confirmado pelo cartório).
 * 'chave' identifica a rubrica no banco: não altere depois de lançar valores.
 */
return [
    ['chave' => 'emolumentos_publica', 'grupo' => 'Receitas públicas', 'rotulo' => 'Emolumentos (parcela pública)'],
    ['chave' => 'fdj',    'grupo' => 'Receitas públicas', 'rotulo' => 'FDJ – Fundo de Desenvolvimento da Justiça'],
    ['chave' => 'fcrcpn', 'grupo' => 'Receitas públicas', 'rotulo' => 'FCRCPN – Fundo de Compensação dos Registradores Civis das Pessoas Naturais'],
    ['chave' => 'frmp',   'grupo' => 'Receitas públicas', 'rotulo' => 'FRMP – Fundo de Reaparelhamento do Ministério Público'],
    ['chave' => 'funaf',  'grupo' => 'Receitas públicas', 'rotulo' => 'FUNAF'],
    ['chave' => 'iss',    'grupo' => 'Tributos',          'rotulo' => 'ISS recolhido ao Município'],
    ['chave' => 'despesas_publicas', 'grupo' => 'Despesas públicas', 'rotulo' => 'Despesas públicas'],
];
