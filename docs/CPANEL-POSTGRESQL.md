# Instalação no cPanel com PostgreSQL

Guia para hospedagens cPanel em que o MySQL não está disponível e o banco é **PostgreSQL**. O site funciona igual: formulários, protocolo, painel, transparência.

Precisa de: acesso ao **Terminal** do cPanel (não precisa ser root), **PHP 8.3** e **PostgreSQL 10 ou mais novo**. Nos comandos, troque `cartoriosjc` pelo usuário da sua conta cPanel.

## 1. Puxar o site do GitHub

cPanel → **Git Version Control** → **Criar**:

- **Clone URL:** `https://github.com/viniciusmacedoazevedo-ctrl/Site-Cartorio.git`
- **Caminho do repositório:** `cartorio` (fora da `public_html`)
- **Nome:** `Site-Cartorio`

## 2. PHP 8.3

cPanel → **MultiPHP Manager** → marque o domínio → **PHP 8.3** → Aplicar.

## 3. Criar o banco PostgreSQL

cPanel → **Assistente de banco de dados PostgreSQL**:

1. Banco: `cartorio`.
2. Usuário: `site`, com o **Gerador de senha**. Guarde a senha.
3. Associe o usuário ao banco com **todos os privilégios**.

O cPanel acrescenta o prefixo da conta: o banco fica `cartoriosjc_cartorio` e o usuário `cartoriosjc_site`.

## 4. Criar as tabelas (Terminal)

```
cd ~/cartorio
psql --version
psql -h localhost -U cartoriosjc_site cartoriosjc_cartorio -f database/schema.pgsql.sql
```

A senha pedida é a do usuário do banco. A saída deve ter `CREATE TABLE` e `CREATE INDEX`, sem `ERROR`.

## 5. Caixa de e-mail

cPanel → **Contas de e-mail** → criar `nao-responda@cartoriosjcampestre.com.br`. Guarde a senha.

## 6. Configuração

```
cd ~/cartorio
php -v
php bin/configurar.php
```

`php -v` precisa mostrar 8.3. Se mostrar outra versão, use `/opt/cpanel/ea-php83/root/usr/bin/php` no lugar de `php` em todos os comandos.

Respostas:

| Pergunta | Resposta |
| --- | --- |
| Endereço público do site | Enter |
| Tipo de banco | `pgsql` |
| Servidor do banco | Enter (`localhost`) |
| Porta | Enter (`5432`) |
| Nome do banco | `cartoriosjc_cartorio` |
| Usuário do banco | `cartoriosjc_site` |
| Senha do banco | a do passo 3 |
| Forma de envio | `smtp` |
| Remetente, servidor, criptografia, porta, usuário SMTP | Enter |
| Senha SMTP | a do passo 5 |

## 7. Permissões

```
chmod 600 app/config.php
chmod -R 750 storage
```

## 8. Ligar a public_html ao site

```
cd ~
mv public_html public_html_antiga
ln -s ~/cartorio/public public_html
ls -l public_html
```

A última linha deve mostrar `public_html -> /home/cartoriosjc/cartorio/public`.

## 9. Primeiro usuário do painel

```
cd ~/cartorio
php bin/criar-usuario.php "Eliane Viana de Sousa" notaria@cartoriosjcampestre.com.br admin
```

## 10. Anexos de até 5 MB

cPanel → **MultiPHP INI Editor** → domínio → `upload_max_filesize = 6M` e `post_max_size = 8M`.

## 11. HTTPS

Com o DNS apontando para a hospedagem: cPanel → **SSL/TLS Status** → **Run AutoSSL**.

## 12. Conferir

```
cd ~/cartorio
php bin/verificar.php --online
```

As sugestões com `sudo` são do servidor próprio; no cPanel, ignore-as.

## Atualizar o site

**Git Version Control** → Manage → **Pull or Deploy** → **Update from Remote**. Por causa do passo 8, o site muda na hora.
