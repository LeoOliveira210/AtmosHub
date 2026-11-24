
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mqtt = require("mqtt");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;
const TOPICO = "atmoshub/dados";

// Conexão com PostgreSQL
const banco = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

let ultimaLeitura = null;
let mqttConectado = false;
let idsSensores = {};

// Cadastra a estação e os sensores caso ainda não existam
async function prepararBanco() {
    const conexao = await banco.connect();

    try {
        await conexao.query("BEGIN");

        let resultado = await conexao.query(
            "SELECT id_estacao FROM estacao WHERE nome = $1 ORDER BY id_estacao LIMIT 1",
            ["AtmosHub"]
        );

        let idEstacao;

        if (resultado.rows.length === 0) {
            resultado = await conexao.query(
                `INSERT INTO estacao (nome, localizacao, data_instalacao)
                 VALUES ($1, $2, CURRENT_DATE)
                 RETURNING id_estacao`,
                ["AtmosHub", "Wokwi"]
            );
        }

        idEstacao = resultado.rows[0].id_estacao;

        const sensores = [
            ["temperatura", "°C"],
            ["umidade", "%"],
            ["pressao", "hPa"],
            ["luminosidade", "bruto"],
            ["qualidade_ar", "bruto"],
            ["chuva", "mm"]
        ];

        for (const [tipo, unidade] of sensores) {
            resultado = await conexao.query(
                `SELECT id_sensor FROM sensores
                 WHERE id_estacao = $1 AND tipo = $2
                 LIMIT 1`,
                [idEstacao, tipo]
            );

            if (resultado.rows.length === 0) {
                resultado = await conexao.query(
                    `INSERT INTO sensores (id_estacao, tipo, unidade)
                     VALUES ($1, $2, $3)
                     RETURNING id_sensor`,
                    [idEstacao, tipo, unidade]
                );
            }

            idsSensores[tipo] = resultado.rows[0].id_sensor;
        }

        await conexao.query("COMMIT");

        console.log("PostgreSQL conectado!");
        console.log("Estação e sensores preparados!");

    } catch (erro) {
        await conexao.query("ROLLBACK");
        throw erro;
    } finally {
        conexao.release();
    }
}

// Salva as leituras recebidas no banco
async function salvarMedicoes(dados) {
    const medicoes = [
        ["temperatura", dados.temperatura_ar],
        ["umidade", dados.umidade_ar],
        ["pressao", dados.pressao_hpa],
        ["luminosidade", dados.luminosidade_bruta],
        ["qualidade_ar", dados.qualidade_ar_bruta],
        ["chuva", dados.chuva_acumulada]
    ];

    const conexao = await banco.connect();

    try {
        await conexao.query("BEGIN");

        for (const [tipo, valor] of medicoes) {
            const numero = Number(valor);

            if (valor === undefined || valor === null || !Number.isFinite(numero)) {
                continue;
            }

            await conexao.query(
                `INSERT INTO medicoes (id_sensor, valor)
                 VALUES ($1, $2)`,
                [idsSensores[tipo], numero]
            );
        }

        await conexao.query("COMMIT");

    } catch (erro) {
        await conexao.query("ROLLBACK");
        throw erro;
    } finally {
        conexao.release();
    }
}

// Inicialização do servidor
async function iniciarServidor() {
    try {
        await prepararBanco();

        const clienteMqtt = mqtt.connect(
            "mqtt://broker.hivemq.com:1883"
        );

        clienteMqtt.on("connect", () => {
            mqttConectado = true;

            console.log("MQTT conectado!");

            clienteMqtt.subscribe(TOPICO, (erro) => {
                if (erro) {
                    console.log("Erro ao assinar tópico:", erro.message);
                } else {
                    console.log("Escutando:", TOPICO);
                }
            });
        });

        clienteMqtt.on("offline", () => {
            mqttConectado = false;
            console.log("MQTT offline");
        });

        clienteMqtt.on("reconnect", () => {
            console.log("Reconectando ao MQTT...");
        });

        clienteMqtt.on("error", (erro) => {
            console.log("Erro MQTT:", erro.message);
        });

        clienteMqtt.on("message", async (topico, mensagem) => {
            try {
                const dados = JSON.parse(mensagem.toString());

                await salvarMedicoes(dados);

                ultimaLeitura = {
                    temperatura: dados.temperatura_ar,
                    umidade: dados.umidade_ar,
                    pressao: dados.pressao_hpa,
                    luminosidade: dados.luminosidade_bruta,
                    qualidadeAr: dados.qualidade_ar_bruta,
                    chuva: dados.chuva_acumulada,
                    dataHora: new Date().toISOString()
                };

                console.log("Nova leitura recebida e salva no PostgreSQL:");
                console.log(ultimaLeitura);

            } catch (erro) {
                console.log("Erro ao processar leitura:", erro.message);
            }
        });

        app.get("/api/status", async (req, res) => {
            let bancoConectado = false;

            try {
                await banco.query("SELECT 1");
                bancoConectado = true;
            } catch (erro) {
                console.log("Erro ao verificar PostgreSQL:", erro.message);
            }

            res.json({
                api: "online",
                mqttConectado,
                bancoConectado,
                recebeuLeitura: ultimaLeitura !== null
            });
        });

        app.get("/api/leituras", (req, res) => {
            if (ultimaLeitura === null) {
                return res.status(503).json({
                    erro: "Aguardando dados dos sensores via MQTT"
                });
            }

            res.json(ultimaLeitura);
        });

        // Consulta o histórico de medições
        app.get("/api/medicoes", async (req, res) => {
            try {
                const resultado = await banco.query(`
                    SELECT
                        s.tipo,
                        s.unidade,
                        m.valor,
                        m.data_hora
                    FROM medicoes m
                    INNER JOIN sensores s
                        ON m.id_sensor = s.id_sensor
                    ORDER BY m.data_hora DESC
                    LIMIT 100
                `);

                res.json(resultado.rows);

            } catch (erro) {
                console.log("Erro ao consultar medições:", erro.message);
                res.status(500).json({
                    erro: "Erro ao consultar o histórico"
                });
            }
        });

        app.listen(PORT, () => {
            console.log(`API disponível em http://localhost:${PORT}`);
        });

    } catch (erro) {
        console.error("Erro ao iniciar o servidor:", erro.message);
        process.exit(1);
    }
}

iniciarServidor();
