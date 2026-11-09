
const express = require("express");
const cors = require("cors");
const mqtt = require("mqtt");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;
const TOPICO = "atmoshub/dados";

let ultimaLeitura = null;
let mqttConectado = false;

const clienteMqtt = mqtt.connect(
    "mqtt://broker.hivemq.com:1883"
);

clienteMqtt.on("connect", () => {
    mqttConectado = true;

    console.log("MQTT conectado!");

    clienteMqtt.subscribe(TOPICO, (erro) => {
        if (erro) {
            console.log("Erro ao assinar tópico:", erro);
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

clienteMqtt.on("message", (topico, mensagem) => {

    try {
        const dados = JSON.parse(mensagem.toString());

        ultimaLeitura = {
            temperatura: dados.temperatura_ar,
            umidade: dados.umidade_ar,
            pressao: dados.pressao_hpa,
            luminosidade: dados.luminosidade_bruta,
            qualidadeAr: dados.qualidade_ar_bruta,
            chuva: dados.chuva_acumulada,
            dataHora: new Date().toISOString()
        };

        console.log("Nova leitura recebida:");
        console.log(ultimaLeitura);

    } catch (erro) {
        console.log("Erro ao interpretar os dados:", erro.message);
    }
});

app.get("/api/status", (req, res) => {

    res.json({
        api: "online",
        mqttConectado: mqttConectado,
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

app.listen(PORT, () => {
    console.log(`API disponível em http://localhost:${PORT}`);
});
