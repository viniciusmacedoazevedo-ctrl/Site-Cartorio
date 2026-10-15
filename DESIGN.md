# Design System Unificado --- Cartório de São José do Campestre

## Direção visual e princípios

Este documento combina os padrões do site original com a estrutura
editorial da referência visual adicional. O site original permanece como
fonte prioritária de identidade visual; a segunda referência orienta a
organização de conteúdo, o uso de imagens temáticas, os cards de
serviços, os indicadores e as etapas numeradas.

**Objetivo:** manter uma identidade institucional reconhecível,
acessível e consistente, usando verde como cor principal, dourado como
acento e superfícies claras como base.

**Importante:** os valores apresentados como originais são os
identificados no CSS do projeto anterior. Os aliases, componentes e
valores indicados como sugestões devem ser conferidos no código antes de
serem tratados como tokens oficiais. Imagens e conteúdos ilustrativos
não confirmam serviços, estatísticas ou depoimentos reais.

## 1. Cores

### 1.1 Paleta institucional

  -----------------------------------------------------------------------
  Token                   HEX                     Uso recomendado
  ----------------------- ----------------------- -----------------------
  Verde institucional     `#0B5D59`               Botões primários,
                                                  links, ícones e
                                                  indicadores ativos

  Verde escuro            `#08403D`               Hover, estados
                                                  destacados e fundos
                                                  institucionais

  Verde noturno           `#0C2826`               Hero escuro, navegação
                                                  superior e rodapé

  Verde claro             `#E2EEEB`               Superfícies suaves,
                                                  fundos de ícones e
                                                  hover secundário

  Papel                   `#F2F5F3`               Seções alternadas e
                                                  áreas informativas

  Branco                  `#FFFFFF`               Fundo principal, cards
                                                  e formulários

  Tinta                   `#172422`               Títulos e texto
                                                  principal

  Tinta secundária        `#4A5B58`               Descrições e metadados

  Linha                   `#C9D6D2`               Bordas e divisórias

  Linha forte             `#8FA6A1`               Contornos de maior
                                                  destaque

  Ouro                    `#D6B04A`               Detalhes
                                                  institucionais, ícones
                                                  e pequenos acentos

  Ouro claro              `#F3DE9C`               Destaques e botões
                                                  alternativos

  Erro                    `#B3261E`               Mensagens de erro

  Fundo de erro           `#FCEEEC`               Fundo de alertas de
                                                  erro

  Sucesso                 `#1B6B3A`               Confirmações e estados
                                                  positivos

  Foco                    `#E0A100`               Indicador de foco por
                                                  teclado
  -----------------------------------------------------------------------

**Proporção visual:** predominância de branco e cinza-papel; verde nos
elementos de identidade; dourado apenas em detalhes. O hero pode usar
fundo escuro, mas as seções não devem ser todas escuras.

### 1.2 Estados

  -----------------------------------------------------------------------
  Estado                              Tratamento
  ----------------------------------- -----------------------------------
  Padrão                              Verde institucional, branco ou
                                      superfície neutra

  Hover primário                      Verde escuro

  Hover secundário                    Fundo verde claro

  Ativo                               Texto verde e marcador inferior ou
                                      lateral

  Erro                                Texto vermelho, fundo rosa claro e
                                      mensagem textual

  Sucesso                             Texto verde escuro e indicador
                                      positivo

  Foco                                Contorno dourado de 3 px,
                                      afastamento de 2 px

  Desabilitado                        Contraste reduzido sem perder
                                      legibilidade; cursor e estado
                                      semântico apropriados
  -----------------------------------------------------------------------

Não transmitir estados exclusivamente por cor.

## 2. Tipografia

### 2.1 Famílias

-   **Títulos:** `Bitter`, com fallback `Georgia`, `Times New Roman`,
    serif.
-   **Corpo e interface:** `Atkinson Hyperlegible`, com fallback
    `Segoe UI`, `Roboto`, `Arial`, sans-serif.

### 2.2 Escala tipográfica

  Aplicação        Família                                 Tamanho      Peso   Altura de linha
  ---------------- ----------------------- ----------------------- --------- -----------------
  H1               Bitter                    Fluido, 33,6--52,8 px       700               1,2
  H2               Bitter                                24--32 px       600               1,2
  H3               Bitter                                  22,5 px       600               1,2
  H4               Bitter                                    18 px       600               1,2
  Corpo            Atkinson Hyperlegible                     18 px       400               1,6
  Introdução       Atkinson Hyperlegible                   20,7 px   Herdado               1,6
  Navegação        Atkinson Hyperlegible                   17,1 px       700               1,2
  Texto auxiliar   Atkinson Hyperlegible                   16,2 px       400          1,5--1,6
  Botões           Atkinson Hyperlegible                     18 px       700               1,2
  Rodapé           Atkinson Hyperlegible                  16,56 px       400               1,6

Os tamanhos em pixels derivam de uma base CSS de 18 px
(`font-size: 112.5%` no elemento `html`). Confirmar as regras e
`clamp()` reais no CSS antes de alterar o projeto.

### 2.3 Espaçamento entre letras

-   H1: `letter-spacing: -0.02em`.
-   Outros títulos: `letter-spacing: -0.01em`.
-   Texto corrido: espaçamento normal.
-   Evitar texto corrido em caixa alta e blocos longos com espaçamento
    artificial.

## 3. Tokens CSS

O bloco abaixo consolida a paleta e as convenções recomendadas. Os
tokens de espaçamento e sombra são aliases de organização sugeridos; não
devem ser confundidos com declarações necessariamente presentes no CSS
original.

``` css
:root {
  /* Cores institucionais */
  --verde: #0B5D59;
  --verde-escuro: #08403D;
  --verde-noite: #0C2826;
  --verde-claro: #E2EEEB;
  --papel: #F2F5F3;
  --branco: #FFFFFF;

  /* Texto e divisórias */
  --tinta: #172422;
  --tinta-2: #4A5B58;
  --linha: #C9D6D2;
  --linha-forte: #8FA6A1;

  /* Acentos e estados */
  --ouro: #D6B04A;
  --ouro-claro: #F3DE9C;
  --erro: #B3261E;
  --erro-fundo: #FCEEEC;
  --sucesso: #1B6B3A;
  --foco: #E0A100;

  /* Tipografia */
  --fonte-texto: "Atkinson Hyperlegible", "Segoe UI", Roboto, Arial, sans-serif;
  --fonte-titulo: "Bitter", Georgia, "Times New Roman", serif;
  --texto-base: 1rem;
  --linha-texto: 1.6;
  --linha-titulo: 1.2;

  /* Layout */
  --largura: 1160px;
  --raio: 6px;
  --raio-grande: 10px;
  --raio-modal: 12px;

  /* Escala de espaçamento sugerida */
  --espaco-1: 4px;
  --espaco-2: 8px;
  --espaco-3: 12px;
  --espaco-4: 16px;
  --espaco-5: 20px;
  --espaco-6: 24px;
  --espaco-8: 32px;
  --espaco-10: 40px;
  --espaco-12: 48px;
  --espaco-16: 64px;
  --espaco-18: 72px;

  /* Sombras sugeridas, usar com moderação */
  --sombra-menu: 0 12px 24px rgba(12, 40, 38, 0.12);
  --sombra-flutuante: 0 6px 18px rgba(12, 40, 38, 0.28);
  --sombra-modal: 0 24px 60px rgba(12, 40, 38, 0.35);

  /* Composição baseada na segunda referência */
  --hero-overlay: rgba(12, 40, 38, 0.76);
  --hero-min-height: 360px;
  --card-padding: 24px;
  --card-gap: 24px;
  --section-padding-block: 72px;
  --section-padding-mobile: 40px;
  --icon-surface: #E2EEEB;
  --icon-color: #0B5D59;
}
```

### 3.1 Escala de espaçamento

  Token             Valor Uso
  --------------- ------- ----------------------------
  `--espaco-1`       4 px Ajustes pequenos
  `--espaco-2`       8 px Elementos relacionados
  `--espaco-3`      12 px Ícones e grupos compactos
  `--espaco-4`      16 px Padding compacto
  `--espaco-5`      20 px Margens laterais
  `--espaco-6`      24 px Cards e formulários
  `--espaco-8`      32 px Separação de grupos
  `--espaco-10`     40 px Gaps de grid
  `--espaco-12`     48 px Separação de colunas
  `--espaco-16`     64 px Espaçamento de seções
  `--espaco-18`     72 px Padding vertical de seções

## 4. Layout

### 4.1 Container e grids

  -----------------------------------------------------------------------
  Propriedade                         Valor de referência
  ----------------------------------- -----------------------------------
  Container máximo                    1160 px

  Margens laterais                    20 px

  Grid editorial do hero              1,5fr / 1fr

  Grid de destaque                    1,4fr / 1fr

  Cards de serviços                   3 colunas em desktop amplo

  Gap de serviços                     40 px vertical / 48 px horizontal

  Cabeçalho desktop                   Altura mínima de 84 px

  Cabeçalho compacto                  Altura mínima de 72 px

  Seções principais                   Padding vertical de 72 px

  Hero desktop                        Padding de referência: 64 px
                                      superior / 96 px inferior
  -----------------------------------------------------------------------

### 4.2 Breakpoints de referência

  Largura            Comportamento
  ------------------ -----------------------------------------------------
  Até 400 px         Ocultar subtítulo secundário da marca se necessário
  Até 520 px         Simplificar a marca e a faixa superior
  Até 560 px         Uma coluna para cards e rodapé
  Até 680 px         Tabelas compactas ou com rolagem interna
  Até 760 px         Etapas em coluna e utilidades reorganizadas
  Até 860 px         Hero e destaque em uma coluna; grids reduzidos
  Até 960 px         Rodapé em duas colunas
  Até 1180 px        Navegação horizontal transforma-se em menu compacto
  Acima de 1180 px   Container centralizado e grids amplos

Confirmar os media queries existentes antes de implementar. Os exemplos
mobile-first abaixo são uma estratégia recomendada; devem ser ajustados
para preservar o comportamento original.

``` css
.container {
  width: 100%;
  max-width: var(--largura);
  margin-inline: auto;
  padding-inline: 20px;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr);
  gap: 56px;
}

.servicos-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
}

@media (min-width: 561px) {
  .servicos-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px;
  }
}

@media (min-width: 861px) {
  .servicos-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 40px 48px;
  }
}

@media (max-width: 860px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
```

## 5. Componentes

### 5.1 Botões

  Variante     Fundo          Texto          Borda
  ------------ -------------- -------------- -------------------
  Primário     `#0B5D59`      Branco         Transparente
  Secundário   Branco         Verde          Verde
  Claro        Branco         Verde escuro   Transparente
  Ouro         `#F3DE9C`      `#2B2206`      Ouro
  Texto        Transparente   Verde          Sem borda visível

**Especificações:** altura mínima padrão de 52 px; compacta de 44 px;
padding horizontal aproximado de 23 px; raio de 6 px; borda de 2 px;
fonte 700. O estado hover do primário usa verde escuro e o secundário
usa fundo verde claro.

``` css
.botao {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  min-height: 52px;
  padding: 0.7em 1.3em;
  font: 700 1rem/1.2 var(--fonte-texto);
  border: 2px solid transparent;
  border-radius: var(--raio);
  text-align: center;
  cursor: pointer;
}

.botao-primario {
  color: var(--branco);
  background: var(--verde);
}

.botao-primario:hover {
  background: var(--verde-escuro);
}

.botao-secundario {
  color: var(--verde);
  background: var(--branco);
  border-color: var(--verde);
}

.botao-secundario:hover {
  background: var(--verde-claro);
}
```

### 5.2 Inputs e formulários

-   Fundo branco e texto principal.
-   Borda neutra, raio de 6 px.
-   Foco dourado com contorno visível.
-   Erros com texto vermelho e fundo rosa claro.
-   Sucesso com texto verde escuro.
-   Rótulos explícitos, mensagens de validação textuais e associação
    semântica entre `label` e campo.

``` css
input,
select,
textarea {
  font-family: var(--fonte-texto);
  color: var(--tinta);
  background: var(--branco);
  border: 1px solid var(--linha-forte);
  border-radius: var(--raio);
}

.campo-erro {
  color: var(--erro);
  background: var(--erro-fundo);
  border-color: var(--erro);
}

:focus-visible {
  outline: 3px solid var(--foco);
  outline-offset: 2px;
}
```

### 5.3 Cards e painéis

  -----------------------------------------------------------------------
  Tipo                                Tratamento
  ----------------------------------- -----------------------------------
  Card de serviço                     Branco, borda neutra, ícone
                                      circular verde, título e link

  Ficha informativa                   Branco, borda neutra e faixa
                                      esquerda verde de 6 px

  Recibo                              Branco, borda superior verde de 8
                                      px, raio de 10 px

  Ficha oficial                       Branco, borda superior verde de 6
                                      px

  Área de documentos                  Fundo papel e borda neutra

  Seção alternada                     Fundo papel e bordas horizontais

  Indicadores                         Faixa verde ou superfície suave;
                                      números apenas com dados reais
  -----------------------------------------------------------------------

``` css
.card-servico {
  background: var(--branco);
  color: var(--tinta);
  border: 1px solid var(--linha);
  border-radius: var(--raio);
  padding: var(--card-padding);
}

.card-informativo {
  background: var(--branco);
  border: 1px solid var(--linha);
  border-left: 6px solid var(--verde);
  border-radius: var(--raio);
  padding: 24px;
}

.secao-alternada {
  background: var(--papel);
  border-block: 1px solid var(--linha);
}
```

### 5.4 Navegação

-   Cabeçalho branco com borda inferior.
-   Faixa superior em verde noturno.
-   Marca e brasão oficiais preservados.
-   Nome institucional serifado e subtítulo auxiliar.
-   Links em negrito e hover discreto.
-   Página atual indicada por linha inferior verde de 3 px ou marcador
    lateral.
-   Menu compacto em telas menores.
-   Menu móvel em coluna, com divisórias e indicador de página ativa.

### 5.5 Badges e estados

``` css
.badge-status {
  display: inline-block;
  padding: 0.3em 0.9em;
  border-radius: 999px;
  font-weight: 700;
  background: var(--verde-claro);
  color: var(--verde-escuro);
}

.alerta-erro {
  color: var(--erro);
  background: var(--erro-fundo);
}

.alerta-sucesso {
  color: var(--sucesso);
  background: var(--verde-claro);
}
```

### 5.6 Modais, banners e controles flutuantes

  Componente           Especificação de referência
  -------------------- ------------------------------------------------
  Modal                Largura máxima de 780 px, raio de 12 px
  Altura do modal      Máximo de 88vh
  Cabeçalho do modal   Branco, padding de 22 px 28 px 16 px
  Fechar modal         Controle com área mínima de 44 × 44 px
  Banner de cookies    Fundo `#172422`, texto claro e sombra moderada
  Botão flutuante      Verde, formato arredondado e sombra

Modais devem controlar o foco, permitir fechamento acessível, não cortar
conteúdo e funcionar com teclado e leitor de tela.

## 6. Estrutura recomendada da página

A estrutura abaixo combina a identidade original com a composição da
referência adicional.

1.  **Header institucional:** brasão, nome, navegação, busca e contato.
2.  **Hero:** fotografia temática escurecida por overlay verde, título
    serifado, breadcrumb e ação principal.
3.  **Apresentação institucional:** composição editorial em duas
    colunas, texto e imagem de apoio.
4.  **Indicadores institucionais:** faixa com métricas somente se houver
    dados oficiais verificáveis.
5.  **Serviços:** cards com ícones circulares verdes, descrições curtas
    e links para os serviços reais.
6.  **Como solicitar:** etapas numeradas, conectadas visualmente no
    desktop e empilhadas no mobile.
7.  **Informações de atendimento:** canais, horários, endereço e mapa
    com informações oficiais.
8.  **Notícias ou comunicados:** somente se existir conteúdo atualizado
    e mantido.
9.  **Footer:** fundo verde noturno, marca oficial, contatos e links
    institucionais.

Não importar literalmente o conteúdo de um site de advocacia. A
referência orienta a hierarquia e a composição, não confirma serviços,
estatísticas, profissionais, depoimentos ou notícias do cartório.

## 7. Responsividade

  -----------------------------------------------------------------------
  Dispositivo                         Regras
  ----------------------------------- -----------------------------------
  Mobile --- até 560 px               Uma coluna, navegação compacta,
                                      marca reduzida e botões adaptáveis

  Tablet --- 561 a 860 px             Hero em uma coluna; cards em duas
                                      colunas quando houver espaço

  Desktop --- 861 a 1180 px           Grids de duas ou três colunas
                                      conforme o conteúdo; navegação
                                      compacta conforme breakpoint

  Desktop amplo --- acima de 1180 px  Navegação horizontal, grids amplos
                                      e container máximo de 1160 px
  -----------------------------------------------------------------------

-   Começar com uma coluna e ampliar conforme a largura.
-   Evitar larguras fixas em textos e formulários.
-   Preservar a ordem semântica de leitura.
-   Permitir quebra de palavras longas, URLs e protocolos.
-   Usar rolagem interna ou reorganização para tabelas extensas.
-   Definir dimensões de imagens para reduzir mudanças de layout.
-   Respeitar `prefers-reduced-motion`.

``` css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 8. Usabilidade e acessibilidade

  -----------------------------------------------------------------------
  Requisito                           Regra
  ----------------------------------- -----------------------------------
  Contraste                           Verificar combinações reais segundo
                                      WCAG AA

  Foco                                Contorno de 3 px, dourado,
                                      afastamento de 2 px

  Área de toque                       Preferir pelo menos 44 × 44 px

  Hierarquia                          Títulos serifados, corpo sem serifa
                                      e texto auxiliar secundário

  Navegação                           Indicar a página atual sem depender
                                      apenas da cor

  Formulários                         Associar rótulos e campos; explicar
                                      erros em texto

  Imagens                             Texto alternativo informativo ou
                                      `alt=""` para decoração

  Tabelas                             Cabeçalhos semânticos e
                                      identificação das colunas

  Zoom                                Não impedir ampliação nem cortar
                                      conteúdo

  Movimento                           Respeitar preferência de movimento
                                      reduzido
  -----------------------------------------------------------------------

A combinação `#0B5D59` com branco tem contraste aproximado de 7,5:1. Não
presumir que todas as outras combinações da paleta tenham o mesmo
contraste: verificar cada par de cores utilizado, sobretudo dourado
sobre branco e texto secundário em tamanhos pequenos.

``` css
:focus-visible {
  outline: 3px solid var(--foco);
  outline-offset: 2px;
}
```

## 9. Direção de imagens e ícones

### Fotografia

-   Priorizar imagens reais de arquitetura, atendimento e ambientes
    institucionais relevantes.
-   Usar iluminação natural, composição organizada e tratamento
    discreto.
-   Para o hero, utilizar imagem horizontal, com ponto focal livre para
    o texto.
-   Aplicar overlay verde escuro para garantir legibilidade.
-   Evitar imagens genéricas de tribunais ou escritórios de advocacia
    que possam confundir a natureza dos serviços.
-   Não distorcer brasões, marcas ou documentos oficiais.

### Proporções sugeridas

  Slot                Proporção
  ------------------- -------------------------------
  Hero                16:9 ou 2:1
  Imagem editorial    4:3
  Cards de conteúdo   4:3 ou 3:2
  Ícones              SVG quadrado
  Marca e brasão      Proporção original do arquivo

### Ícones

-   Preferir SVG ou biblioteca de ícones consistente.
-   Usar traços simples e espessuras coerentes.
-   Aplicar verde institucional sobre fundos claros.
-   Usar dourado apenas para detalhes.
-   Não misturar emojis, ícones lineares e ilustrações 3D no mesmo
    conjunto.
-   Garantir que ícones funcionais tenham nome acessível.

## 10. Regras de implementação

### Nomenclatura

O projeto utiliza classes CSS em português, com nomes semânticos e
hífens. Preservar esse padrão.

  Tipo                     Exemplo
  ------------------------ -------------------
  Seção                    `.abertura`
  Elemento ou composição   `.abertura-grade`
  Variante                 `.botao-primario`
  Estado                   `.aberto`
  Container                `.container`
  Token                    `--verde-escuro`

### Boas práticas

1.  Centralizar cores, fontes, espaçamentos e raios nos tokens.
2.  Reutilizar componentes em vez de duplicar CSS.
3.  Separar estrutura, conteúdo e apresentação.
4.  Utilizar HTML semântico e nomes acessíveis.
5.  Manter navegação por teclado e foco visível.
6.  Otimizar imagens e carregar apenas fontes necessárias.
7.  Testar menus, formulários, cards, tabelas e modais em diferentes
    larguras.
8.  Respeitar preferências de acessibilidade.
9.  Conferir os tokens e breakpoints originais antes de modificar
    estilos globais.
10. Usar somente informações oficiais e autorizadas em indicadores,
    depoimentos, fotos e serviços.

### Evitar

-   Criar outra paleta sem justificativa institucional.
-   Aplicar sombras pesadas a todos os cards.
-   Introduzir glassmorphism, gradientes ou animações decorativas sem
    relação com o estilo existente.
-   Misturar muitas famílias tipográficas.
-   Usar raios exagerados se o padrão predominante é de 6 px.
-   Criar rolagem horizontal na página inteira.
-   Substituir rótulos por placeholders.
-   Comunicar estados apenas com cores.
-   Inserir dados, depoimentos ou serviços fictícios.
-   Duplicar tokens com valores conflitantes.
-   Substituir a identidade do cartório pela identidade visual da
    referência de advocacia.

## 11. Checklist de validação

-   [ ] Cores institucionais preservadas.
-   [ ] Bitter e Atkinson Hyperlegible mantidas.
-   [ ] Container máximo de 1160 px em telas amplas.
-   [ ] Hero com imagem legível e overlay apropriado.
-   [ ] Navegação funcional em desktop, tablet e mobile.
-   [ ] Cards e indicadores coerentes com a identidade original.
-   [ ] Botões com estados de hover, foco e desabilitado.
-   [ ] Formulários com rótulos e mensagens de erro acessíveis.
-   [ ] Contraste verificado em todas as combinações usadas.
-   [ ] Imagens e brasão sem distorção.
-   [ ] Modais acessíveis por teclado.
-   [ ] Conteúdo institucional verificado.
-   [ ] Nenhuma regressão visual desnecessária.
