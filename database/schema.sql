-- ============================================================
-- ATMOSHUB
-- SCHEMA INICIAL DO BANCO DE DADOS
-- PostgreSQL
-- ============================================================
--
-- Fluxo dos dados:
--
-- ESP32
--   ↓
-- MQTT
--   ↓
-- Backend/API
--   ↓
-- PostgreSQL
--
-- Estrutura do banco:
--
-- ESTACAO
--    ↓
-- SENSORES
--    ↓
-- MEDICOES
--
-- Uma estação possui vários sensores.
-- Um sensor pode gerar várias medições.
-- ============================================================


-- ============================================================
-- 1. TABELA: ESTACAO
-- ============================================================
--
-- Representa a estação meteorológica física.
--
-- Exemplo:
--
-- id_estacao: 1
-- nome: AtmosHub
-- localizacao: UNIP
--
-- ============================================================

CREATE TABLE estacao (
    -- Identificador único da estação.
    -- SERIAL faz o PostgreSQL gerar automaticamente
    -- os números: 1, 2, 3, 4...
    id_estacao SERIAL PRIMARY KEY,

    -- Nome da estação.
    -- NOT NULL significa que esse campo é obrigatório.
    nome VARCHAR(100) NOT NULL,

    -- Local onde a estação está instalada.
    -- Pode ficar vazio caso a localização não seja informada.
    localizacao VARCHAR(150),

    -- Data em que a estação foi instalada.
    data_instalacao DATE
);


-- ============================================================
-- 2. TABELA: SENSORES
-- ============================================================
--
-- Representa os sensores físicos conectados à estação.
--
-- IMPORTANTE:
--
-- Aqui cadastramos o SENSOR FÍSICO apenas uma vez.
--
-- Por exemplo:
--
-- DHT22
-- BMP180
-- LDR
-- MQ2
-- Chuva
--
-- O DHT22 pode produzir temperatura E umidade.
-- Por isso não colocamos "°C" ou "%" aqui.
--
-- O tipo da medição ficará na tabela MEDICOES.
--
-- ============================================================

CREATE TABLE sensores (
    -- Identificador único do sensor.
    id_sensor SERIAL PRIMARY KEY,

    -- Identifica a estação à qual o sensor pertence.
    id_estacao INT NOT NULL,

    -- Tipo/modelo do sensor físico.
    -- Exemplos: DHT22, BMP180, LDR, MQ2.
    tipo VARCHAR(50) NOT NULL,

    -- Indica se o sensor está ativo no sistema.
    -- TRUE  = sensor em funcionamento/uso
    -- FALSE = sensor desativado
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    -- Relaciona o sensor com uma estação.
    --
    -- Se id_estacao = 1, esse sensor pertence à estação 1.
    CONSTRAINT fk_sensor_estacao
        FOREIGN KEY (id_estacao)
        REFERENCES estacao(id_estacao)
);


-- ============================================================
-- 3. TABELA: MEDICOES
-- ============================================================
--
-- Aqui ficam os dados coletados pelos sensores.
--
-- É a tabela que provavelmente receberá a maior quantidade
-- de registros do projeto.
--
-- Exemplo:
--
-- id_medicao | id_sensor | tipo_medicao | unidade | valor
-- ---------------------------------------------------------
--     1     |     1     | temperatura   | °C      | 24.50
--     2     |     1     | umidade       | %       | 65.20
--     3     |     2     | pressao       | hPa     | 1013.20
--
-- ============================================================

CREATE TABLE medicoes (
    -- Identificador único da medição.
    id_medicao SERIAL PRIMARY KEY,

    -- Identifica qual sensor realizou a medição.
    id_sensor INT NOT NULL,

    -- Diz O QUE está sendo medido.
    --
    -- Exemplos:
    -- temperatura
    -- umidade
    -- pressao
    -- luminosidade
    -- qualidade_ar
    -- chuva
    tipo_medicao VARCHAR(50) NOT NULL,

    -- Unidade utilizada naquela medição.
    --
    -- Exemplos:
    -- °C
    -- %
    -- hPa
    -- bruto
    -- mm
    unidade VARCHAR(20) NOT NULL,

    -- Valor coletado pelo sensor.
    --
    -- DECIMAL(10,2):
    -- até 10 dígitos no total
    -- sendo 2 casas decimais.
    --
    -- Exemplos:
    -- 24.50
    -- 65.20
    -- 1013.23
    valor DECIMAL(10,2) NOT NULL,

    -- Data e horário em que a medição foi registrada.
    --
    -- CURRENT_TIMESTAMP faz o PostgreSQL preencher
    -- automaticamente quando o registro for criado.
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Relaciona a medição ao sensor que a produziu.
    CONSTRAINT fk_medicao_sensor
        FOREIGN KEY (id_sensor)
        REFERENCES sensores(id_sensor)
);


-- ============================================================
-- 4. ÍNDICES
-- ============================================================
--
-- Índices ajudam o PostgreSQL a encontrar informações
-- mais rapidamente.
--
-- Como o AtmosHub terá muitas medições, consultas por
-- data/hora serão muito comuns.
--
-- Exemplo:
--
-- "Quero todas as medições das últimas 24 horas."
--
-- O índice abaixo ajuda nessa consulta.
--
-- ============================================================

CREATE INDEX idx_medicoes_data_hora
    ON medicoes(data_hora);


-- Também será muito comum buscar todas as medições
-- de determinado sensor.
--
-- Exemplo:
--
-- "Quero todas as medições do DHT22."
--
CREATE INDEX idx_medicoes_sensor
    ON medicoes(id_sensor);


-- Índice para encontrar rapidamente os sensores
-- pertencentes a determinada estação.
CREATE INDEX idx_sensores_estacao
    ON sensores(id_estacao);