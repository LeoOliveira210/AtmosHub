# bmp180.py
#
# Driver MicroPython para o sensor de pressao/temperatura BMP180.
#
# Implementa o algoritmo de compensacao descrito no datasheet oficial da
# Bosch (o mesmo usado, com pequenas variacoes, por praticamente todos os
# drivers open-source de BMP180/BMP085 que existem por ai - nao e uma
# invencao nossa, e a formula do fabricante).
#
# Usado neste projeto como aproximacao de simulacao para o BMP280: o Wokwi
# nao possui um componente nativo de BMP280, entao estamos validando a
# logica de leitura via I2C com o BMP180, que e eletricamente e
# funcionalmente equivalente (temperatura + pressao via I2C). No hardware
# fisico, o BMP280 real usara seu proprio driver, com seu proprio conjunto
# de registradores.

from time import sleep_ms
from ustruct import unpack

_BMP180_ADDR = 0x77


class BMP180:
    def __init__(self, i2c, address=_BMP180_ADDR, oversample=1):
        self.i2c = i2c
        self.address = address
        # oversample vai de 0 a 3: quanto maior, mais precisa e mais lenta
        # e a leitura de pressao.
        self.oversample = oversample
        self._load_calibration()

    # --- leitura de registradores de calibracao (gravados de fabrica) ---

    def _read_s16(self, register):
        data = self.i2c.readfrom_mem(self.address, register, 2)
        return unpack(">h", data)[0]

    def _read_u16(self, register):
        data = self.i2c.readfrom_mem(self.address, register, 2)
        return unpack(">H", data)[0]

    def _load_calibration(self):
        self.AC1 = self._read_s16(0xAA)
        self.AC2 = self._read_s16(0xAC)
        self.AC3 = self._read_s16(0xAE)
        self.AC4 = self._read_u16(0xB0)
        self.AC5 = self._read_u16(0xB2)
        self.AC6 = self._read_u16(0xB4)
        self.B1 = self._read_s16(0xB6)
        self.B2 = self._read_s16(0xB8)
        self.MB = self._read_s16(0xBA)
        self.MC = self._read_s16(0xBC)
        self.MD = self._read_s16(0xBE)

    # --- leituras brutas do sensor ---

    def _read_raw_temperature(self):
        self.i2c.writeto_mem(self.address, 0xF4, b"\x2E")
        sleep_ms(5)
        return self._read_u16(0xF6)

    def _read_raw_pressure(self):
        control = 0x34 + (self.oversample << 6)
        self.i2c.writeto_mem(self.address, 0xF4, bytes([control]))
        sleep_ms(2 + (3 << self.oversample))
        msb, lsb, xlsb = self.i2c.readfrom_mem(self.address, 0xF6, 3)
        raw = ((msb << 16) + (lsb << 8) + xlsb) >> (8 - self.oversample)
        return raw

    def _compute_b5(self, ut):
        x1 = ((ut - self.AC6) * self.AC5) // 32768
        x2 = (self.MC * 2048) // (x1 + self.MD)
        return x1 + x2

    # --- valores compensados (o que voce realmente usa no main.py) ---

    @property
    def temperature(self):
        """Temperatura em graus Celsius."""
        ut = self._read_raw_temperature()
        b5 = self._compute_b5(ut)
        return ((b5 + 8) >> 4) / 10

    @property
    def pressure(self):
        """Pressao atmosferica em Pascal (Pa). Divida por 100 para hPa."""
        ut = self._read_raw_temperature()
        b5 = self._compute_b5(ut)
        up = self._read_raw_pressure()

        b6 = b5 - 4000
        x1 = (self.B2 * (b6 * b6 // 4096)) // 2048
        x2 = (self.AC2 * b6) // 2048
        x3 = x1 + x2
        b3 = (((self.AC1 * 4 + x3) << self.oversample) + 2) // 4

        x1 = (self.AC3 * b6) // 8192
        x2 = (self.B1 * (b6 * b6 // 4096)) // 65536
        x3 = ((x1 + x2) + 2) // 4
        b4 = (self.AC4 * (x3 + 32768)) // 32768
        b7 = (up - b3) * (50000 >> self.oversample)

        if b7 < 0x80000000:
            p = (b7 * 2) // b4
        else:
            p = (b7 // b4) * 2

        x1 = (p // 256) * (p // 256)
        x1 = (x1 * 3038) // 65536
        x2 = (-7357 * p) // 65536
        p = p + (x1 + x2 + 3791) // 16
        return p