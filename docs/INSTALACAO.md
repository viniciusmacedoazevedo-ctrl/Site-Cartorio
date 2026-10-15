# Instalação no servidor — passo a passo

Guia para colocar o site em **https://www.cartoriosjcampestre.com.br** num servidor Debian ou Ubuntu que já tem PHP 8.3 e MySQL/MariaDB. Os comandos usam `sudo`; rode cada bloco e confira a saída antes de seguir.

Em todo o guia, o site fica em `/var/www/cartorio`. Se escolher outra pasta, troque esse caminho nos comandos e no arquivo do servidor web.

> Testado em Ubuntu 24.04 com PHP 8.3, MariaDB 10.11, Apache 2.4.58 e Nginx 1.24: páginas, envio de formulário, protocolo, login no painel e redirecionamentos.

---

## 0. Antes de começar

- **DNS**: os dois endereços, `cartoriosjcampestre.com.br` e `www.cartoriosjcampestre.com.br`, precisam apontar (registro A) para o IP do servidor. Sem isso o certificado HTTPS não é emitido. Confira com:
  ```
  dig +short cartoriosjcampestre.com.br
  dig +short www.cartoriosjcampestre.com.br
  ```
- **Portas 80 e 443** liberadas no firewall (`sudo ufw allow 'Apache Full'` ou `sudo ufw allow 'Nginx Full'`, se usar ufw).
- **Qual servidor web já está rodando?**
  ```
  systemctl is-active apache2 nginx
  ```
  Use o que estiver `active` e siga só a parte dele no passo 6. Se o servidor já hospeda outros sites, **não** desative o site padrão nem mexa nos arquivos deles.

## 1. Copiar os arquivos

Opção A, a partir do GitHub (o site precisa estar no branch principal; se o repositório for privado, o GitHub pede login):
```
sudo git clone https://github.com/viniciusmacedoazevedo-ctrl/Site-Cartorio.git /var/www/cartorio
```

Opção B, a partir do seu computador (na pasta do projeto):
```
rsync -av --exclude app/config.php --exclude 'storage/*.sqlite' ./ usuario@IP-DO-SERVIDOR:/tmp/cartorio/
# depois, no servidor:
sudo mv /tmp/cartorio /var/www/cartorio
```

Daqui em diante, os comandos são rodados dentro da pasta:
```
cd /var/www/cartorio
```

## 2. Conferir o PHP

```
php -v                                   # precisa ser 8.3 ou mais novo
php -m | grep -E 'pdo_mysql|mbstring|fileinfo|openssl'
```
As quatro extensões devem aparecer. Se faltar alguma:
```
sudo apt install php8.3-mysql php8.3-mbstring
```
Com Apache, o PHP vem do pacote `libapache2-mod-php8.3`; com Nginx, de `php8.3-fpm`.

## 3. Criar o banco

Gere uma senha forte para o usuário do banco e **guarde-a** (vai ser pedida no passo 4):
```
openssl rand -base64 24
```

Entre no MySQL/MariaDB como administrador:
```
sudo mysql
```
e rode, trocando `SENHA-FORTE` pela senha gerada:
```sql
CREATE DATABASE cartorio_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cartorio_site'@'localhost' IDENTIFIED BY 'SENHA-FORTE';
GRANT SELECT, INSERT, UPDATE, DELETE ON cartorio_site.* TO 'cartorio_site'@'localhost';
EXIT;
```

Crie as tabelas:
```
sudo mysql cartorio_site < database/schema.sql
```

O usuário `cartorio_site` só lê e grava dados; ele não consegue apagar tabelas. Isso é proposital.

## 4. Criar o app/config.php

```
sudo php bin/configurar.php
```
O script pergunta o endereço do site, os dados do banco e a forma de envio de e-mail. Ele gera a chave secreta sozinho, testa a conexão com o banco antes de gravar e deixa `debug` desligado.

- **E-mail `mail`**: o servidor envia pelo Postfix/Exim local. Use se o e-mail do domínio está neste servidor.
- **E-mail `smtp`**: use se o e-mail é de um provedor (Locaweb, Hostinger, Google, Microsoft etc.). Tenha em mãos o servidor SMTP, a porta e a senha da caixa `nao-responda@`.

Para mudar algo depois, rode o script de novo (ele guarda uma cópia do arquivo anterior) ou edite `app/config.php`. As explicações de cada opção estão em `app/config.example.php`.

## 5. Permissões

```
sudo chown -R root:root /var/www/cartorio
sudo chown -R www-data:www-data storage
sudo chmod -R 750 storage
sudo chown root:www-data app/config.php
sudo chmod 640 app/config.php
```
Assim o site só consegue gravar em `storage/` (anexos e logs), e só o servidor web lê as senhas do `config.php`.

## 6. Servidor web

### 6A. Apache

```
sudo cp docs/apache.conf.exemplo /etc/apache2/sites-available/cartorio.conf
sudo a2enmod rewrite headers
sudo a2ensite cartorio
sudo apache2ctl configtest          # deve responder "Syntax OK"
sudo systemctl reload apache2
```
Os redirecionamentos para HTTPS e para o endereço com `www` já estão em `public/.htaccess`. Eles só passam a valer depois do passo 8.

### 6B. Nginx

O arquivo `docs/nginx.conf.exemplo` já tem a versão final, com HTTPS. Como o certificado ainda não existe, comece **só com o primeiro bloco `server`** (porta 80):

```
sudo sed -n '1,/^}/p' docs/nginx.conf.exemplo | sudo tee /etc/nginx/sites-available/cartorio
sudo ln -s /etc/nginx/sites-available/cartorio /etc/nginx/sites-enabled/cartorio
sudo nginx -t                       # deve responder "test is successful"
sudo systemctl reload nginx
```
O arquivo completo é instalado no passo 8, depois do certificado.

## 7. Limite de envio de anexos no PHP

Os formulários aceitam anexos de até 5 MB. O PHP vem com limite de 2 MB, então crie um arquivo de ajuste.

Com **Apache**:
```
printf 'upload_max_filesize = 6M\npost_max_size = 8M\n' | sudo tee /etc/php/8.3/apache2/conf.d/99-cartorio.ini
sudo systemctl reload apache2
```

Com **Nginx (PHP-FPM)**:
```
printf 'upload_max_filesize = 6M\npost_max_size = 8M\n' | sudo tee /etc/php/8.3/fpm/conf.d/99-cartorio.ini
sudo systemctl restart php8.3-fpm
```

## 8. HTTPS com Let's Encrypt

O certificado precisa cobrir os dois endereços (com e sem `www`).

### Com Apache
```
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d www.cartoriosjcampestre.com.br -d cartoriosjcampestre.com.br
```
Informe um e-mail para avisos de vencimento (por exemplo `notaria@cartoriosjcampestre.com.br`) e aceite os termos. O certbot cria sozinho a versão HTTPS do site.

### Com Nginx
```
sudo apt install certbot
sudo certbot certonly --webroot -w /var/www/cartorio/public \
  -d www.cartoriosjcampestre.com.br -d cartoriosjcampestre.com.br \
  --deploy-hook "systemctl reload nginx"
```
Com o certificado emitido, instale a configuração completa:
```
sudo cp docs/nginx.conf.exemplo /etc/nginx/sites-available/cartorio
sudo nginx -t
sudo systemctl reload nginx
```

### Renovação (Apache e Nginx)
O certificado vale 90 dias e o certbot renova sozinho. Para testar a renovação sem trocar nada:
```
sudo certbot renew --dry-run
```

## 9. Primeiro usuário do painel

```
sudo -u www-data php bin/criar-usuario.php "Eliane Viana de Sousa" notaria@cartoriosjcampestre.com.br admin
```
O script pede a senha (mínimo 10 caracteres, com letras e números) sem mostrá-la na tela. Os demais usuários (Administrador ou Atendente) são criados pelo painel, em **Usuários**.

Rode os scripts de `bin/` como `www-data` (`sudo -u www-data ...`). Assim, arquivos de log criados por eles continuam graváveis pelo site.

## 10. Conferir tudo

```
sudo -u www-data php bin/verificar.php --online
```
O script confere o PHP, o `config.php`, o banco, o administrador, as pastas de gravação e, com `--online`, o HTTPS, os redirecionamentos e se algum arquivo interno está exposto. Ele diz o que corrigir em cada falha.

O aviso sobre `upload_max_filesize` pode aparecer mesmo depois do passo 7: o PHP do terminal usa outro `php.ini`. O que vale para o site é o do passo 7.

Por fim, teste no navegador:
1. Abra https://www.cartoriosjcampestre.com.br e algumas páginas.
2. Envie uma mensagem em **Contato** com o seu e-mail. Anote o protocolo e o código.
3. Confira se o e-mail chegou (veja também o spam).
4. Consulte o protocolo em **Consultar protocolo**.
5. Entre em https://www.cartoriosjcampestre.com.br/admin e veja o registro.

## Depois da instalação

- **E-mail**: configure SPF, DKIM e DMARC do domínio (veja a seção "E-mail" do README) para os avisos não caírem no spam.
- **Backup diário** do banco e de `storage/anexos` (veja "Rotina recomendada" no README).
- **Pendências de conteúdo** antes de divulgar o site: veja "Para revisar antes de publicar" no README.

## Se algo der errado

| Sintoma | Onde olhar |
| --- | --- |
| Página em branco ou erro 500 | `storage/logs/php-error.log` e o log do servidor web (`/var/log/apache2/cartorio-erro.log` ou `/var/log/nginx/error.log`) |
| "Configuração ausente" | falta o `app/config.php` (passo 4) |
| Erro de conexão com o banco | usuário e senha em `app/config.php`; `sudo -u www-data php bin/verificar.php` |
| Formulário com anexo falha | limites do passo 7 |
| Certbot não emite o certificado | DNS (passo 0), portas 80/443 e se o site responde em `http://` |
| E-mails não chegam | `transport` no `config.php`; log do servidor de e-mail (`/var/log/mail.log`) |
