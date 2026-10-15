-- Banco do site do Cartório de São José do Campestre (MySQL 8+ / MariaDB 10.5+)
-- mysql -u root -p cartorio_site < database/schema.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS registros (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
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
  responsavel_id  INT UNSIGNED NULL,
  ip              VARCHAR(45)  NOT NULL DEFAULT '',
  user_agent      VARCHAR(250) NOT NULL DEFAULT '',
  criado_em       DATETIME     NOT NULL,
  atualizado_em   DATETIME     NOT NULL,
  INDEX idx_form_status (formulario, status),
  INDEX idx_criado (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS anexos (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  registro_id   INT UNSIGNED NOT NULL,
  arquivo       VARCHAR(200) NOT NULL,
  nome_original VARCHAR(150) NOT NULL,
  mime          VARCHAR(60)  NOT NULL,
  tamanho       INT UNSIGNED NOT NULL,
  criado_em     DATETIME     NOT NULL,
  CONSTRAINT fk_anexo_registro FOREIGN KEY (registro_id) REFERENCES registros(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(120) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  senha_hash    VARCHAR(255) NOT NULL,
  perfil        VARCHAR(20)  NOT NULL DEFAULT 'atendente', -- admin | atendente
  ativo         TINYINT(1)   NOT NULL DEFAULT 1,
  tentativas    INT          NOT NULL DEFAULT 0,
  bloqueado_ate DATETIME     NULL,
  ultimo_login  DATETIME     NULL,
  criado_em     DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS historico (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  registro_id INT UNSIGNED NOT NULL,
  usuario_id  INT UNSIGNED NULL,
  acao        VARCHAR(120) NOT NULL,
  detalhe     TEXT         NULL,
  criado_em   DATETIME     NOT NULL,
  INDEX idx_hist_registro (registro_id),
  CONSTRAINT fk_hist_registro FOREIGN KEY (registro_id) REFERENCES registros(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contadores (
  prefixo VARCHAR(5)   NOT NULL,
  ano     SMALLINT     NOT NULL,
  ultimo  INT UNSIGNED NOT NULL,
  PRIMARY KEY (prefixo, ano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS limites (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ip_hash   CHAR(64)    NOT NULL,
  acao      VARCHAR(20) NOT NULL,
  criado_em DATETIME    NOT NULL,
  INDEX idx_limite (ip_hash, acao, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auditoria (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  acao       VARCHAR(40)  NOT NULL,
  alvo       VARCHAR(190) NOT NULL DEFAULT '',
  ip         VARCHAR(45)  NOT NULL DEFAULT '',
  criado_em  DATETIME     NOT NULL,
  INDEX idx_aud_data (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transparencia (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ano            SMALLINT     NOT NULL,
  mes            TINYINT      NOT NULL,
  valores_json   TEXT         NOT NULL,
  observacao     TEXT         NULL,
  arquivo        VARCHAR(200) NULL,
  arquivo_nome   VARCHAR(150) NULL,
  atualizado_por INT UNSIGNED NULL,
  atualizado_em  DATETIME     NOT NULL,
  UNIQUE KEY uk_ano_mes (ano, mes)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
