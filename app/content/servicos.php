<?php
/*
 * Carta de Serviços ao Cidadão, agrupada por atribuição da serventia.
 * 'docs'       = documentos obrigatórios para a solicitação (originais ou cópias autenticadas)
 * 'gratuidade' = hipótese de gratuidade prevista em lei, quando houver
 * 'slug'       = usado nos links (/servicos#slug e /pedido?servico=slug); não alterar
 * Revisar com a serventia antes de publicar.
 */
return [
    [
        'area' => 'Tabelionato de Notas',
        'icone' => 'notas',
        'resumo' => 'Atos com fé pública que formalizam a vontade das partes.',
        'itens' => [
            [
                'slug' => 'escrituras',
                'nome' => 'Escrituras públicas',
                'texto' => 'Formalizam compra e venda, doação, permuta, inventário e partilha, divórcio e separação consensuais, união estável, testamento e outros negócios que a lei exige por escritura.',
                'docs' => [
                    'Documento de identidade com foto e CPF de todas as partes',
                    'Certidão de nascimento ou de casamento atualizada (até 90 dias)',
                    'Comprovante de residência e profissão das partes',
                    'Imóveis: certidão de matrícula atualizada, certidão de ônus reais e guia do ITBI ou ITCMD paga',
                    'Inventário e divórcio: presença de advogado e certidão de óbito ou de casamento, conforme o caso',
                ],
                'gratuidade' => 'Inventário, partilha, separação e divórcio consensuais podem ser gratuitos para quem declarar não poder pagar os emolumentos (Resolução CNJ nº 35/2007).',
            ],
            [
                'slug' => 'procuracoes',
                'nome' => 'Procurações',
                'texto' => 'Autorizam outra pessoa a agir em seu nome em negócios, bancos, órgãos públicos ou processos. Também são lavrados substabelecimentos e revogações.',
                'docs' => [
                    'Documento de identidade com foto e CPF de quem outorga',
                    'Certidão de casamento, se a pessoa for casada',
                    'Nome completo, CPF, endereço e profissão do procurador',
                    'Descrição dos poderes e, se for o caso, dados do bem envolvido',
                ],
            ],
            [
                'slug' => 'firma-autenticacao',
                'nome' => 'Reconhecimento de firma e autenticação',
                'texto' => 'Confirma que a assinatura em um documento é de quem assinou e que a cópia confere com o original.',
                'docs' => [
                    'Firma: documento de identidade com foto e CPF para abrir a ficha de assinatura (só na primeira vez)',
                    'Firma por autenticidade: presença de quem assina',
                    'Autenticação: documento original e a cópia',
                ],
            ],
            [
                'slug' => 'atas-notariais',
                'nome' => 'Atas notariais',
                'texto' => 'O tabelião constata e registra um fato, como o conteúdo de um site, mensagens de aplicativo ou o estado de um imóvel, para servir de prova.',
                'docs' => [
                    'Documento de identidade com foto e CPF do solicitante',
                    'Acesso ao conteúdo, aparelho ou local a ser constatado',
                ],
            ],
            [
                'slug' => 'venda-de-veiculos',
                'nome' => 'Comunicação de venda de veículos',
                'texto' => 'Reconhecimento de firma na transferência e comunicação da venda ao Detran, para o vendedor deixar de responder por multas e impostos do veículo.',
                'docs' => [
                    'CRV ou ATPV-e preenchido com os dados do comprador',
                    'Documento de identidade com foto e CPF do vendedor e do comprador',
                ],
            ],
        ],
    ],
    [
        'area' => 'Registro Civil das Pessoas Naturais',
        'icone' => 'civil',
        'resumo' => 'Os registros que acompanham a vida de cada pessoa.',
        'itens' => [
            [
                'slug' => 'nascimento',
                'nome' => 'Registro de nascimento',
                'texto' => 'Registro da criança, com a emissão da primeira certidão de nascimento e do CPF.',
                'docs' => [
                    'Declaração de Nascido Vivo (DNV) emitida pela maternidade',
                    'Documento de identidade com foto dos pais',
                    'Certidão de casamento dos pais, se forem casados e só um deles comparecer',
                ],
                'gratuidade' => 'O registro de nascimento e a primeira certidão são gratuitos para todos (Lei nº 9.534/1997).',
            ],
            [
                'slug' => 'casamento',
                'nome' => 'Casamento',
                'texto' => 'Habilitação, celebração e registro do casamento civil, além de conversão de união estável em casamento.',
                'docs' => [
                    'Certidão de nascimento atualizada (solteiros) ou de casamento com averbação do divórcio ou certidão de óbito do cônjuge (divorciados e viúvos)',
                    'Documento de identidade com foto, CPF e comprovante de residência dos noivos',
                    'Duas testemunhas maiores de idade, com documento de identidade',
                    'Menores de 18 anos (a partir de 16): autorização dos pais ou responsáveis',
                ],
                'gratuidade' => 'Habilitação, registro e primeira certidão são gratuitos para quem se declarar pobre (Código Civil, art. 1.512).',
            ],
            [
                'slug' => 'obito',
                'nome' => 'Registro de óbito',
                'texto' => 'Registro do falecimento e emissão da certidão de óbito, necessária para sepultamento, inventário e benefícios.',
                'docs' => [
                    'Declaração de Óbito (DO) emitida pelo médico ou serviço de saúde',
                    'Documento de identidade, CPF e certidão de nascimento ou casamento da pessoa falecida',
                    'Documento de identidade de quem declara o óbito',
                ],
                'gratuidade' => 'O registro de óbito e a primeira certidão são gratuitos para todos (Lei nº 9.534/1997).',
            ],
            [
                'slug' => 'certidoes',
                'nome' => 'Certidões e averbações',
                'texto' => 'Segunda via de certidões de nascimento, casamento e óbito, e averbações como divórcio, reconhecimento de paternidade e mudança de nome.',
                'docs' => [
                    'Nome completo da pessoa registrada, data e local do registro (ou cópia de certidão antiga)',
                    'Documento de identidade do solicitante',
                    'Averbações: o documento que dá origem à mudança (sentença, escritura ou termo)',
                ],
                'gratuidade' => 'Gratuitas para pessoas reconhecidamente pobres, mediante declaração (Lei nº 9.534/1997).',
            ],
        ],
    ],
    [
        'area' => 'Protesto de Títulos',
        'icone' => 'protesto',
        'resumo' => 'Cobrança formal de dívidas e consulta de pendências.',
        'itens' => [
            [
                'slug' => 'protestos',
                'nome' => 'Protesto, cancelamento e certidões',
                'texto' => 'Protesto de cheques, duplicatas, notas promissórias, contratos e outros títulos; cancelamento depois do pagamento; e certidões negativas ou positivas de protesto.',
                'docs' => [
                    'Protesto: título original ou documento da dívida e dados do devedor (nome, CPF ou CNPJ e endereço)',
                    'Documento de identidade e CPF ou CNPJ do apresentante',
                    'Cancelamento: carta de anuência do credor com firma reconhecida, ou o título original',
                    'Certidão: nome e CPF ou CNPJ da pessoa pesquisada',
                ],
            ],
        ],
    ],
    [
        'area' => 'Registro de Imóveis',
        'icone' => 'imoveis',
        'resumo' => 'Garante a propriedade e a segurança dos negócios com imóveis.',
        'itens' => [
            [
                'slug' => 'registro-de-imoveis',
                'nome' => 'Registro, averbação e certidões de imóveis',
                'texto' => 'Registro de escrituras, contratos de financiamento e formais de partilha; averbação de construção, demolição e mudança de estado civil; certidões de matrícula e de ônus.',
                'docs' => [
                    'Título original a registrar (escritura, contrato ou formal de partilha)',
                    'Guia do ITBI ou ITCMD quitada, quando houver transmissão',
                    'Averbação de construção: habite-se e CND do INSS da obra',
                    'Certidão: número da matrícula ou endereço do imóvel e nome do proprietário',
                ],
            ],
        ],
    ],
    [
        'area' => 'Títulos e Documentos e Pessoas Jurídicas',
        'icone' => 'titulos',
        'resumo' => 'Dá data certa e publicidade a documentos e constitui associações e entidades.',
        'itens' => [
            [
                'slug' => 'titulos-e-documentos',
                'nome' => 'Contratos, notificações e entidades',
                'texto' => 'Registro de contratos e documentos para conservação e prova, notificações extrajudiciais, e registro de estatutos e atas de associações, igrejas e fundações.',
                'docs' => [
                    'Documento original a registrar, assinado',
                    'Notificação: texto da notificação e endereço completo do notificado',
                    'Pessoas jurídicas: estatuto ou ata assinados, lista de presença e documento do representante legal, com visto de advogado quando exigido',
                ],
            ],
        ],
    ],
    [
        'area' => 'Certificação Digital',
        'icone' => 'certificado',
        'resumo' => 'Sua assinatura válida em documentos eletrônicos.',
        'itens' => [
            [
                'slug' => 'certificado-digital',
                'nome' => 'Emissão de certificado digital',
                'texto' => 'Emissão de e-CPF e e-CNPJ para assinar documentos, acessar sistemas do governo e emitir notas fiscais. O atendimento é feito com hora marcada.',
                'docs' => [
                    'Documento de identidade com foto (RG ou CNH)',
                    'CPF e comprovante de residência recente',
                    'e-CNPJ: contrato social ou estatuto, cartão CNPJ e documento do representante legal',
                ],
            ],
        ],
    ],
];
