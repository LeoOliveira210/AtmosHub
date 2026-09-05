# AtmosHub

Estacao meteorologica/ambiental baseada em ESP32 e MicroPython, simulada no Wokwi.

## Estrutura atual

```text
AtmosHub/
├── firmware/
│   ├── main.py
│   ├── bmp180.py
│   └── rain.py
├── backend/
├── dashboard/
├── docs/
├── diagram.json
├── README.md
└── .gitignore
```

## Sensores

- DHT22: temperatura e umidade — GPIO 15
- BMP180: pressao e temperatura — SDA 21 / SCL 22
- LDR: luminosidade — GPIO 34
- Sensor de gas Wokwi: leitura analogica — GPIO 35
- Botao: simulacao do pluviometro — GPIO 27

## Pluviometro

Cada pressionamento valido do botao representa um pulso de um pluviometro de bascula.
O valor inicial usado na simulacao e 0,2 mm por pulso e pode ser alterado no `main.py` quando o sensor fisico for definido.

**## Comunicação**

A comunicação entre o ESP32 e o servidor será realizada utilizando MQTT.

A configuração do broker, tópicos e envio dos dados será definida durante o desenvolvimento da Issue #2.