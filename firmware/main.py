import dht
from machine import Pin, I2C, ADC
from time import sleep, ticks_ms, ticks_diff
from bmp180 import BMP180
from rain import RainSensor
from umqtt.simple import MQTTClient
import network
import ujson

# Configuração de rede Wi-Fi
ssid = "Wokwi-GUEST"
password = ""
sta_if = network.WLAN(network.STA_IF)
sta_if.active(True)
sta_if.connect(ssid, password)

# Aguarda a conexão Wi-Fi/até conectar 
while not sta_if.isconnected():
    sleep(1)
print("Conectado à rede Wi-Fi:", ssid, sta_if.ifconfig())

# Configuração do cliente MQTT
client_id = "esp32_atmoshub"    # <- Identificador único do cliente MQTT
broker = "broker.hivemq.com"    # < - Identificador do broker MQTT (HiveMQ)
client = MQTTClient(client_id, broker, port=1883) 
client.connect()
#
print("Conectado ao broker:", broker)

# Sensores
dht22 = dht.DHT22(Pin(15))
i2c = I2C(0, scl=Pin(22), sda=Pin(21))
bmp = BMP180(i2c)
ldr = ADC(Pin(34))
ldr.atten(ADC.ATTN_11DB)
mq135 = ADC(Pin(35))
mq135.atten(ADC.ATTN_11DB)

# Pluviometro simulado por botao
rain = RainSensor(27, mm_per_pulse=0.2)

ultimo_print = ticks_ms()

while True:
    rain.update()

    agora = ticks_ms()
    if ticks_diff(agora, ultimo_print) >= 2000:

        # Leitura dos sensores
        dht22.measure()
        temperatura_ar = dht22.temperature()
        umidade_ar = dht22.humidity()

        temperatura_bmp = bmp.temperature
        pressao_hpa = bmp.pressure / 100
        luminosidade_bruta = ldr.read()
        qualidade_ar_bruta = mq135.read()

        chuva_pulsos = rain.pulses
        chuva_acumulada = rain.rain_mm

        print("=== ATMOSHUB ===")
        print("Temperatura (DHT22):", temperatura_ar, "C")
        print("Umidade:", umidade_ar, "%")
        print("Temperatura (BMP180):", temperatura_bmp, "C")
        print("Pressao:", pressao_hpa, "hPa")
        print("Luminosidade (bruta):", luminosidade_bruta)
        print("Qualidade do ar (bruta):", qualidade_ar_bruta)
        print("Chuva - pulsos:", chuva_pulsos)
        print("Chuva acumulada:", chuva_acumulada, "mm")
        print("------------------------------")

        # Aqui todos os valores são agrupados em um único objeto JSON.
        dados = {
            "temperatura_ar": temperatura_ar,
            "umidade_ar": umidade_ar,
            "temperatura_bmp180": temperatura_bmp,
            "pressao_hpa": pressao_hpa,
            "luminosidade_bruta": luminosidade_bruta,
            "qualidade_ar_bruta": qualidade_ar_bruta,
            "chuva_pulsos": chuva_pulsos,
            "chuva_acumulada": chuva_acumulada
            # Cada chave corresponde a um sensor físico.
        }
        # Publicando os dados no broker MQTT
        client.publish("atmoshub/dados", ujson.dumps(dados))

        ultimo_print = agora

    sleep(0.05)
