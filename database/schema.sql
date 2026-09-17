CREATE TABLE estacao (
    id_estacao SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    localizacao VARCHAR(150),
    data_instalacao DATE
);

CREATE TABLE sensores (
    id_sensor SERIAL PRIMARY KEY,
    id_estacao INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    unidade VARCHAR(20),

    CONSTRAINT fk_sensor_estacao
        FOREIGN KEY (id_estacao)
        REFERENCES estacao(id_estacao)
);

CREATE TABLE medicoes (
    id_medicao SERIAL PRIMARY KEY,
    id_sensor INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_medicao_sensor
        FOREIGN KEY (id_sensor)
        REFERENCES sensores(id_sensor)
);