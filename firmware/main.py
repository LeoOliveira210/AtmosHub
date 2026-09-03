import dht
from machine import Pin, I2C, ADC
from time import sleep, ticks_ms, ticks_diff
from bmp180 import BMP180
from rain import RainSensor

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
        dht22.measure()
        temperatura_ar = dht22.temperature()
        umidade_ar = dht22.humidity()

        temperatura_bmp = bmp.temperature
        pressao_hpa = bmp.pressure / 100

        luminosidade_bruta = ldr.read()
        qualidade_ar_bruta = mq135.read()

        print("=== ATMOSHUB ===")
        print("Temperatura (DHT22):", temperatura_ar, "C")
        print("Umidade:", umidade_ar, "%")
        print("Temperatura (BMP180):", temperatura_bmp, "C")
        print("Pressao:", pressao_hpa, "hPa")
        print("Luminosidade (bruta):", luminosidade_bruta)
        print("Qualidade do ar (bruta):", qualidade_ar_bruta)
        print("Chuva - pulsos:", rain.pulses)
        print("Chuva acumulada:", rain.rain_mm, "mm")
        print("------------------------------")

        ultimo_print = agora

    sleep(0.05)
