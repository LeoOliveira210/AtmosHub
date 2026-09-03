from machine import Pin
from time import ticks_ms, ticks_diff


class RainSensor:
    def __init__(self, pin, mm_per_pulse=0.2, debounce_ms=200):
        self.button = Pin(pin, Pin.IN, Pin.PULL_UP)
        self.mm_per_pulse = mm_per_pulse
        self.debounce_ms = debounce_ms
        self.pulses = 0
        self.rain_mm = 0.0
        self.last_state = self.button.value()
        self.last_pulse = ticks_ms()

    def update(self):
        state = self.button.value()
        now = ticks_ms()

        if self.last_state == 1 and state == 0:
            if ticks_diff(now, self.last_pulse) >= self.debounce_ms:
                self.pulses += 1
                self.rain_mm = self.pulses * self.mm_per_pulse
                self.last_pulse = now

        self.last_state = state
