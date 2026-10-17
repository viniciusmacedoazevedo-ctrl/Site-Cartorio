-- Banco do site do Cartório de São José do Campestre (PostgreSQL 10+)
-- Mesmas tabelas do schema.sql (MySQL), no formato do PostgreSQL.
-- No cPanel: phpPgAdmin > banco > SQL > colar este arquivo > Executar.
-- No terminal: psql -h localhost -U USUARIO BANCO -f database/schema.pgsql.sql

CREATE TABLE IF NOT EXISTS registros (
  id              SERIAL       PRIMARY KEY,
  protocolo       VARCHAR(20)  NOT NULL UNIQUE,
  codigo_acesso   CHAR(4)      NOT NULL,
  formulario      VARCHAR(20)  NOT NULL,           -- pedido | ouvidoria | lgpd | contato
  tipo            VARCHAR(150) NOT NULL DEFAULT '', -- serviço, tipo de manifestação, direito ou assunto
  nome            VARCHAR(150) NOT NULL DEFAULT '',
  cpf             VARCHAR(14)  NOT NULL DEFAULT '',
  email           VARCHAR(150) NOT NULL DEFAULT '',
  telefone        VARCHAR(30)  NOT NULL DEFAULT '',
  mensagem        TEXT         NOT NULL,
  dados_json      TEXT         NULL,
  status          VARCHAR(30)  NOT NULL DEFAULT 'Novo',
  retorno_publico TEXT         NULL,                -- texto que o cliente vê na consulta do protocolo
  responsavel_id  INTEGER      NULL,
  ip              VARCHAR(45)  NOT NULL DEFAULT '',
  user_agent      VARCHAR(250) NOT NULL DEFAULT '',
  criado_em       TIMESTAMP(0) NOT NULL,
  atualizado_em   TIMESTAMP(0) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_form_status ON registros (formulario, status);
CREATE INDEX IF NOT EXISTS idx_criado ON registros (criado_em);

CREATE TABLE IF NOT EXISTS anexos (
  id            SERIAL       PRIMARY KEY,
  registro_id   INTEGER      NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
  arquivo       VARCHAR(200) NOT NULL,
  nome_original VARCHAR(150) NOT NULL,
  mime          VARCHAR(60)  NOT NULL,
  tamanho       INTEGER      NOT NULL,
  criado_em     TIMESTAMP(0) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL       PRIMARY KEY,
  nome          VARCHAR(120) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  senha_hash    VARCHAR(255) NOT NULL,
  perfil        VARCHAR(20)  NOT NULL DEFAULT 'atendente', -- admin | atendente
  ativo         SMALLINT     NOT NULL DEFAULT 1,
  tentativas    INTEGER      NOT NULL DEFAULT 0,
  bloqueado_ate TIMESTAMP(0) NULL,
  ultimo_login  TIMESTAMP(0) NULL,
  criado_em     TIMESTAMP(0) NOT NULL
);

CREATE TABLE IF NOT EXISTS historico (
  id          SERIAL       PRIMARY KEY,
  registro_id INTEGER      NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
  usuario_id  INTEGER      NULL,
  acao        VARCHAR(120) NOT NULL,
  detalhe     TEXT         NULL,
  criado_em   TIMESTAMP(0) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hist_registro ON historico (registro_id);

CREATE TABLE IF NOT EXISTS contadores (
  prefixo VARCHAR(5) NOT NULL,
  ano     SMALLINT   NOT NULL,
  ultimo  INTEGER    NOT NULL,
  PRIMARY KEY (prefixo, ano)
);

CREATE TABLE IF NOT EXISTS limites (
  id        SERIAL       PRIMARY KEY,
  ip_hash   CHAR(64)     NOT NULL,
  acao      VARCHAR(20)  NOT NULL,
  criado_em TIMESTAMP(0) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_limite ON limites (ip_hash, acao, criado_em);

CREATE TABLE IF NOT EXISTS auditoria (
  id         SERIAL       PRIMARY KEY,
  usuario_id INTEGER      NULL,
  acao       VARCHAR(40)  NOT NULL,
  alvo       VARCHAR(190) NOT NULL DEFAULT '',
  ip         VARCHAR(45)  NOT NULL DEFAULT '',
  criado_em  TIMESTAMP(0) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_aud_data ON auditoria (criado_em);

CREATE TABLE IF NOT EXISTS transparencia (
  id             SERIAL       PRIMARY KEY,
  ano            SMALLINT     NOT NULL,
  mes            SMALLINT     NOT NULL,
  valores_json   TEXT         NOT NULL,
  observacao     TEXT         NULL,
  arquivo        VARCHAR(200) NULL,
  arquivo_nome   VARCHAR(150) NULL,
  atualizado_por INTEGER      NULL,
  atualizado_em  TIMESTAMP(0) NOT NULL,
  CONSTRAINT uk_ano_mes UNIQUE (ano, mes)
);
