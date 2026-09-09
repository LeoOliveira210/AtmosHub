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

A comunicação entre o ESP32 e o servidor é realizada utilizando MQTT.

- Broker: broker.hivemq.com
- Porta: 1883
- Tópico principal: atmoshub/dados
- Formato da mensagem: JSON contendo todas as leituras dos sensores.
- Frequência de envio: a cada 2 segundos o ESP32 publica uma nova mensagem.

**## Exemplo de mensagem JSON**

{
  "temperatura_ar": 59.6,
  "umidade_ar": 79.5,
  "temperatura_bmp180": 24.0,
  "pressao_hpa": 1013.23,
  "luminosidade_bruta": 1001,
  "qualidade_ar_bruta": 3628,
  "chuva_pulsos": 39,
  "chuva_acumulada": 7.8
}

**##Assinando os dados no terminal**

` .\mosquitto_sub.exe -h broker.hivemq.com -t "atmoshub/sensores" `