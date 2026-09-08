import random
import json
import time


def gerar_dados():
    dados = {
        "temperature": round(random.uniform(15, 35), 1),
        "humidity": round(random.uniform(40, 90), 1),
        "pressure": round(random.uniform(990, 1030), 1),
        "light": random.randint(0, 1000),
        "air_quality": random.randint(0, 4000),
        "rain": random.randint(0, 1)
    }

    return dados


while True:
    dados = gerar_dados()

    print("=== ATMOSHUB SIMULATOR ===")
    print(json.dumps(dados, indent=2))
    print("--------------------------")

    time.sleep(2)