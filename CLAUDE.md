# CLAUDE.md — Site do Cartório de São José do Campestre/RN

Site institucional do **Serviço Notarial e Registral de São José do Campestre/RN**.
**Node.js sem dependências externas** (pasta `node/`, banco PostgreSQL) é a versão em uso. A versão em PHP 8.3 (pasta `app/`, tag `versao-php`) fica como referência: qualquer mudança de conteúdo ou regra deve ser feita **na versão Node** (e, se for mantida, também na PHP).
Domínio: https://www.cartoriosjcampestre.com.br (servidor próprio do cartório, com PHP 8.3 e MySQL/MariaDB).

Antes de mudar qualquer coisa, leia o `README.md` e a estrutura de `app/`, `public/` e `database/`.

## Estrutura

- `public/` é a única pasta exposta na internet (CSS, JS, fontes, imagens, PDF). Não há mais `public/index.php`.
- `node/server.js` é o roteador (tabela `ROTAS`); `app.js` na raiz é o arquivo de inicialização do cPanel.
- `node/pages/` páginas públicas; `node/admin/painel.js` painel; `node/views/layout.js` cabeçalho, rodapé e textos legais; `node/lib/` banco (cliente PostgreSQL próprio em `pg.js`), sessão em cookie cifrado, formulários, e-mail (SMTP próprio).
- `node/content/*.json` dados da serventia, Carta de Serviços e rubricas (gerados a partir de `app/content/*.php`; edite o JSON).
- Templates usam `html\`...\`` (escapa tudo) e `raw()` só para HTML confiável.
- Versão PHP (referência):
- `app/pages/` páginas públicas; `app/admin/` painel em `/admin`; `app/views/` cabeçalho, rodapé e trechos; `app/lib/` banco, sessão, formulários, e-mail.
- `app/content/cartorio.php` dados da serventia (titular, CNS, contatos, horário, tabela de custas, foto da abertura).
- `app/content/servicos.php` Carta de Serviços (o `slug` é usado em links: não alterar).
- `app/content/transparencia.php` rubricas da Transparência.
- `database/schema.sql` (MySQL), `database/schema.pgsql.sql` (PostgreSQL) e `database/schema.sqlite.sql` (teste local). Ao mudar uma tabela, mude os três.
- `storage/` anexos e logs, fora da pasta pública. `app/config.php` não é versionado.
- `bin/configurar.php` cria o `app/config.php`; `bin/verificar.php [--online]` confere a instalação; `bin/criar-usuario.php` cria usuário do painel.
- `docs/INSTALACAO.md` passo a passo no servidor; `docs/CPANEL-POSTGRESQL.md` instalação em cPanel com PostgreSQL; `docs/apache.conf.exemplo` e `docs/nginx.conf.exemplo`.

## O que o site tem

- Carta de Serviços, Emolumentos e gratuidades, Transparência mensal (Res. CNJ 215/2015 com red. da Res. CNJ 670/2025), A serventia (CNS), Validação de selos, Ouvidoria, LGPD (Res. CNJ 363/2021, Prov. CNJ 134/2022), Termos de uso, Cookies, Acessibilidade (e-MAG).
- Formulários (pedido, ouvidoria, contato, LGPD) geram protocolo + código de 4 letras, gravam no banco e enviam e-mail. Consulta em `/protocolo`.
- Painel `/admin` com perfis **Administrador** e **Atendente** (Atendente não vê LGPD nem denúncias).

## Regras

- Manter o Node **sem dependências externas** (só módulos `node:`; sem `npm install` no servidor). Na versão PHP, PHP puro, sem Composer nem framework.
- Manter o **visual atual**: tokens em `public/assets/css/site.css`, regras em `DESIGN.md` (design system unificado). Classes CSS em português, com hífens. Ao mudar o CSS, incremente o `?v=` em `node/views/layout.js` (e em `app/views/header.php`).
- Todo texto do site em **português**, em linguagem simples para o cidadão.
- **Não inventar** normas, números de lei, valores, estatísticas, depoimentos ou fotos. Se faltar um dado que não está no projeto, perguntar.
- Preservar a acessibilidade: atalhos Alt+1/2/4, alto contraste (`html.alto-contraste`), ajuste de letra, foco visível dourado, rótulos em todos os campos.

## Teste local depois de cada mudança

Versão Node:

```
npm test                                   # 27 testes com SQLite
TESTE_PG="host=127.0.0.1 port=5432 database=teste username=u password=s" npm test
```

Versão PHP (referência):

```
cp app/config.example.php app/config.php   # driver 'sqlite', transport 'log', debug true
php -r '$p=new PDO("sqlite:storage/teste.sqlite"); $p->exec(file_get_contents("database/schema.sqlite.sql"));'
php -S 127.0.0.1:8080 -t public public/index.php
```

Conferir que as páginas respondem 200:

```
for r in / /serventia /servicos /emolumentos /transparencia /validacao /ouvidoria /contato /pedido /protocolo /privacidade /termos /cookies /acessibilidade /conformidade /admin; do
  printf "%s %s\n" "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080$r)" "$r"
done
```

E-mails de teste ficam em `storage/logs/mail.log`.

## Pendências conhecidas (ver README, "Para revisar antes de publicar")

- Nome por extenso do FUNAF (`app/content/transparencia.php`): confirmar com o contador.
- DNS de `cartoriosjcampestre.com.br` e `www` ainda não aponta para o servidor.
- Servidor do cartório: Nginx (guia também cobre Apache), já hospeda outros sites. E-mail por SMTP em `mail.cartoriosjcampestre.com.br`; a senha fica só no `app/config.php` do servidor, nunca no repositório.
