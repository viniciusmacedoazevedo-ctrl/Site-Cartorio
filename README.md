# Site do Cartório de São José do Campestre/RN

Site institucional com formulários de pedido, ouvidoria, LGPD e contato. Cada envio gera um protocolo, vai por e-mail para o cartório e fica registrado no painel administrativo (`/admin`). O cliente pode consultar a situação em `/protocolo`.

Requisitos: PHP 8.3+ (extensões pdo_mysql, mbstring, fileinfo, openssl) e MySQL 8+ ou MariaDB 10.5+. Não há dependências externas (sem Composer).

## Estrutura

```
app/        código, textos e configuração (fora da pasta pública)
  config.example.php   modelo de configuração
  content/cartorio.php dados da serventia: telefones, e-mails, DPO, tabela de custas
  content/servicos.php serviços e documentos usuais
  views/texto-aviso.php, texto-direitos.php   textos legais (LGPD)
public/     única pasta exposta na internet (raiz do site)
  docs/tabela-de-custas-rn-2026.pdf
storage/    anexos enviados e logs (fora da pasta pública)
database/   schema.sql do banco
bin/        scripts de linha de comando
```

## Instalação no servidor

**Guia completo, com Apache ou Nginx e HTTPS: [`docs/INSTALACAO.md`](docs/INSTALACAO.md).** Atalhos: `php bin/configurar.php` cria o `app/config.php` fazendo perguntas, e `php bin/verificar.php --online` confere a instalação. Resumo:

1. **Copiar os arquivos** para o servidor, por exemplo `/var/www/cartorio`. A raiz do site (DocumentRoot) deve apontar para `/var/www/cartorio/public`. Assim `app/` e `storage/` ficam inacessíveis pela internet.

2. **Criar o banco e o usuário do banco**
   ```sql
   CREATE DATABASE cartorio_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'cartorio_site'@'localhost' IDENTIFIED BY 'SENHA-FORTE';
   GRANT SELECT, INSERT, UPDATE, DELETE ON cartorio_site.* TO 'cartorio_site'@'localhost';
   ```
   Depois crie as tabelas (com um usuário que tenha permissão de CREATE):
   ```
   mysql -u root -p cartorio_site < database/schema.sql
   ```

3. **Configurar**
   ```
   cp app/config.example.php app/config.php
   php -r "echo bin2hex(random_bytes(32));"     # cole o resultado em app_key
   ```
   Preencha em `app/config.php`: `base_url`, `app_key`, dados do banco e e-mail.

4. **Permissões**: o PHP precisa gravar em `storage/`.
   ```
   chown -R www-data:www-data storage
   chmod -R 750 storage
   chmod 640 app/config.php
   ```

5. **Servidor web**
   - Apache: o arquivo `public/.htaccess` já faz o redirecionamento para HTTPS, para `www` e para o `index.php` (precisa de `mod_rewrite` e `AllowOverride All`).
   - Apache: modelo do site em `docs/apache.conf.exemplo`.
   - Nginx: veja `docs/nginx.conf.exemplo`.
   - Ajuste `upload_max_filesize = 6M` e `post_max_size = 8M` no `php.ini`.

6. **HTTPS**: certificado gratuito com Let's Encrypt (`certbot --apache` ou `certbot --nginx`), renovação automática.

7. **Criar o primeiro usuário do painel**
   ```
   php bin/criar-usuario.php "Eliane Viana de Sousa" notaria@cartoriosjcampestre.com.br admin
   ```
   O script pede a senha (mínimo 10 caracteres, letras e números). Os demais usuários podem ser criados pelo painel, em **Usuários**.

## E-mail

- `transport => 'mail'`: usa o servidor de e-mail local (Postfix/Exim). É o mais simples quando o e-mail está no mesmo servidor.
- `transport => 'smtp'`: conecta com usuário e senha (porta 587 com STARTTLS ou 465 com SSL).
- Crie as caixas ou redirecionamentos: `contato@`, `notaria@`, `ouvidoria@`, `compliance@`, `lgpd@` e `nao-responda@` (remetente automático).
- Configure **SPF, DKIM e DMARC** do domínio para os e-mails não caírem no spam.
- Os destinos de cada formulário ficam em `destinos` no `config.php`. Solicitações LGPD vão para `lgpd@` com cópia ao DPO.

## Páginas exigidas e recomendadas pelo CNJ

| Página | Endereço | Base |
| --- | --- | --- |
| A serventia (titular, CNS, atribuições, contatos) | `/serventia` | identificação da serventia |
| Carta de Serviços (descrição e documentos obrigatórios) | `/servicos` | boa prática; textos em `app/content/servicos.php` |
| Emolumentos e gratuidades | `/emolumentos` | Lei 8.935/1994, Lei 10.169/2000, Lei 9.534/1997 |
| Transparência (receitas públicas mensais) | `/transparencia` | Res. CNJ 215/2015, art. 6º, § 3º (red. Res. CNJ 670/2025) |
| Validar selo e centrais nacionais | `/validacao` | boa prática |
| Privacidade, termos de uso, cookies | `/privacidade`, `/termos`, `/cookies` | LGPD, Res. CNJ 363/2021, Prov. CNJ 134/2022 |
| Acessibilidade (atalhos Alt+1, 2, 4; alto contraste; letra) | `/acessibilidade` | Lei 13.146/2015, e-MAG |

### Transparência: lançamento mensal

No painel, menu **Transparência** (só Administrador): escolha mês e ano, preencha os valores (formato 1.234,56), anexe o demonstrativo em PDF se quiser e clique em **Publicar mês**. O mês aparece na hora em `/transparencia`, com totais do ano. As rubricas ficam em `app/content/transparencia.php`; confirme a classificação com a contabilidade e as orientações da Corregedoria antes do primeiro lançamento.

## Rotina recomendada

- **Backup diário** do banco e da pasta `storage/anexos`, com cópia fora do servidor. Exemplo de cron:
  ```
  30 2 * * * mysqldump cartorio_site | gzip > /backup/cartorio-$(date +\%F).sql.gz
  ```
- **Prazo de guarda** (5 anos, conforme o Aviso de Privacidade): para conferir e apagar registros concluídos ou arquivados mais antigos:
  ```
  php bin/limpar-antigos.php 5             # só mostra quantos
  php bin/limpar-antigos.php 5 --confirmar # apaga
  ```
- **Tabela de custas**: quando sair a nova, substitua `public/docs/tabela-de-custas-rn-2026.pdf` e atualize o bloco `tabela_custas` em `app/content/cartorio.php`.
- Manter PHP e banco em versões com suporte (exigência do Provimento CNJ 243/2026).

## Painel administrativo

- Endereço: `https://www.cartoriosjcampestre.com.br/admin`
- **Administrador**: vê tudo, cria e desativa usuários, vê o registro de ações.
- **Atendente**: não vê solicitações LGPD nem denúncias da ouvidoria.
- Em cada registro: alterar a situação, escrever a mensagem que o cliente vê na consulta do protocolo (com opção de avisá-lo por e-mail), adicionar notas internas e baixar anexos.
- Exportação em CSV (abre no Excel) respeitando os filtros da lista.
- Segurança: bloqueio de 15 minutos após 5 senhas erradas, sessão expira após 30 minutos sem uso, todas as ações ficam registradas (logins, visualizações, alterações, downloads e exportações).

## Proteções dos formulários

Token contra envio falso (CSRF), campo-armadilha e tempo mínimo contra robôs, limite de 6 envios por 15 minutos por conexão, validação de CPF, anexos só PDF/JPG/PNG até 5 MB guardados fora da pasta pública com nome aleatório.

## Para revisar antes de publicar

- **CNS 09.545-5** em `app/content/cartorio.php`: confirmar no Justiça Aberta do CNJ.
- **Consulta pública do selo digital do TJRN**: a página `/validacao` aponta para o portal do extrajudicial da Corregedoria. Se houver um endereço direto de consulta de selos, troque `corregedoria_url` (ou acrescente um link) em `app/content/cartorio.php`.
- **Rubricas da Transparência** em `app/content/transparencia.php` (nomes dos fundos e se ISS e despesas devem aparecer).

- Descrições, documentos obrigatórios e gratuidades de cada serviço em `app/content/servicos.php` (conferir com a prática da serventia).
- Prazo de guarda de 5 anos no Aviso de Privacidade (`app/views/texto-aviso.php`), a confirmar pela notária e pelo DPO.
- O brasão foi extraído do documento enviado (128 px). Se houver uma versão em alta resolução, substitua `public/assets/img/brasao.png`.

## Teste local (sem MySQL)

```
cp app/config.example.php app/config.php   # driver 'sqlite', transport 'log', debug true
php -r '$p=new PDO("sqlite:storage/teste.sqlite"); $p->exec(file_get_contents("database/schema.sqlite.sql"));'
php -S 127.0.0.1:8080 -t public public/index.php
```
Os e-mails ficam em `storage/logs/mail.log`.
