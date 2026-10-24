# Instalação no cPanel – versão Node.js

O site roda como **aplicativo Node.js** do cPanel ("Setup Node.js App"), sem PHP e sem `npm install`. O banco continua o mesmo **PostgreSQL** (`database/schema.pgsql.sql`).

Precisa de: Terminal do cPanel (não precisa ser root), **Node.js 22** (ou 20+) no "Setup Node.js App" e o banco PostgreSQL já criado. Nos comandos, `cartoriosjc` é o usuário da conta.

## Migrando da versão PHP (mesmo servidor)

### 1. Atualizar o código

O cPanel mexeu no `public/.htaccess`, então guarde uma cópia e descarte a mudança antes de atualizar:

```
cd ~/cartorio
cp public/.htaccess ~/htaccess-php-antes.txt
git checkout -- public/.htaccess
git pull origin main
ls app.js node/server.js
```

### 2. Criar o aplicativo Node.js

cPanel → **Setup Node.js App** → **Criar aplicação**:

| Campo | Valor |
| --- | --- |
| Versão do Node.js | **22.x** |
| Modo do aplicativo | **Production** |
| Raiz do aplicativo | `cartorio` |
| URL do aplicativo | `cartoriosjcampestre.com.br` |
| Arquivo de inicialização | `app.js` |

Clique em **Criar**. Não precisa clicar em "Run NPM Install": o site não usa pacotes.

No topo da página do aplicativo aparece um comando como `source /home/cartoriosjc/nodevenv/cartorio/22/bin/activate && cd /home/cartoriosjc/cartorio`. Copie: ele deixa o comando `node` disponível no Terminal.

### 3. Configuração

```
source /home/cartoriosjc/nodevenv/cartorio/22/bin/activate && cd /home/cartoriosjc/cartorio
node node/bin/configurar.js --importar-php
chmod 600 node/config.json
```

O `--importar-php` copia banco, senhas e e-mail do `app/config.php`. Sem ele, o script faz as perguntas.

### 4. Senha do painel

As senhas da versão PHP não servem na versão Node. Redefina:

```
node node/bin/criar-usuario.js "Eliane Viana de Sousa" notaria@cartoriosjcampestre.com.br admin
```

### 5. Regras do servidor web

```
node node/bin/htaccess-node.js --blocos-de=$HOME/public_html/.htaccess
```

Isso grava o `public/.htaccess` da versão Node (https, www, cache e **bloqueio de qualquer `.php`**) e mantém os blocos que o cPanel criou (Node.js e PHP).

### 6. Ligar o domínio ao site

```
cd ~ && rm public_html && ln -s ~/cartorio/public public_html && ls -l public_html
```

Depois, em **Setup Node.js App**, clique em **Reiniciar** (Restart) no aplicativo.

### 7. Conferir

```
cd ~/cartorio
node node/bin/verificar.js --online
```

Teste no navegador: página inicial, um envio em **Contato** e o login em **/admin**.

## Voltar para a página de manutenção

```
cd ~ && rm public_html && ln -s ~/manutencao public_html
```

## Atualizar o site depois

```
source /home/cartoriosjc/nodevenv/cartorio/22/bin/activate && cd /home/cartoriosjc/cartorio
cp public/.htaccess ~/htaccess-atual.txt && git checkout -- public/.htaccess
git pull origin main
node node/bin/htaccess-node.js --blocos-de=$HOME/htaccess-atual.txt
mkdir -p tmp && touch tmp/restart.txt
```

O `tmp/restart.txt` faz o cPanel reiniciar o aplicativo com o código novo (o botão **Reiniciar** também serve).

## Se algo der errado

| Sintoma | Onde olhar |
| --- | --- |
| Erro 503 ou "Incomplete response" | `~/cartorio/stderr.log` e `storage/logs/node-error.log` |
| "Configuração ausente" | falta o `node/config.json` (passo 3) |
| Login diz que a senha precisa ser redefinida | passo 4 |
| Página da versão PHP ou erro 403 no início | passo 5 e reinicie o aplicativo |
| E-mails não chegam | `node node/bin/verificar.js --testar-email=seu@email` |
