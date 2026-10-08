"""
Mock edge agent for the flood detection demo.

This script stands in for the YOLOv8 visual-verification stage that would run on
the ESP32-CAM edge node. It emits the same telemetry payload that stage produces,
so the API and dashboard can be exercised without the real model or hardware.

Sequence: "Normal" every 5 s, then "Flood Level" from t=15 s onward. The USSD
triage alert fires once, on the transition.
"""

import os
import time

import requests

API_URL = os.getenv("API_URL", "http://localhost:3000")

INTERVAL_SECONDS = 5
FLOOD_AFTER_SECONDS = 15

NORMAL_WATER_LEVEL_CM = 12.5
FLOOD_WATER_LEVEL_CM = 87.0

USSD_NUMBER = "*119#"


def send_telemetry(status, water_level):
    requests.post(
        f"{API_URL}/api/telemetry",
        json={"status": status, "waterLevel": water_level},
        timeout=5,
    )
    print(f"[EDGE] status={status} waterLevel={water_level}cm")


def main():
    started_at = time.time()
    ussd_sent = False

    while True:
        elapsed = time.time() - started_at

        if elapsed >= FLOOD_AFTER_SECONDS:
            send_telemetry("Flood Level", FLOOD_WATER_LEVEL_CM)

            if not ussd_sent:
                print(f"[USSD GATEWAY] Emergency Alert sent to {USSD_NUMBER}")
                ussd_sent = True
        else:
            send_telemetry("Normal", NORMAL_WATER_LEVEL_CM)

        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
