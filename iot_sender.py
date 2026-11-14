#!/usr/bin/env python3
"""Sends readings to the IoT portal every 1 minute and runs commands returned in the reply.

Usage:
    pip install requests
    export IOT_TOKEN="dvc_..."   # device token from the portal; keep it secret
    python3 iot_sender.py
"""
import os
import sys
import time

import requests

URL = "https://app.iotportal.cc/api/ingest"
TOKEN = os.environ.get("IOT_TOKEN", "")
EVERY_S = 60  # the portal accepts at most one message per 5 s

acks = []  # ids of commands carried out, confirmed in the next post


def read_sensors():
    """Read your sensors here and return the values."""
    temperature = 0.0  # Temperature (°C)
    return {"temperature": round(temperature, 1)}


def handle_command(cmd):
    """Act on one command from the portal, e.g. {"id": "...", "command": "relay_on", "relay": 1}."""
    print(f"command {cmd}")
    # if cmd.get("command") == "relay_on": ...
    # if cmd.get("command") == "relay_off": ...


def run_commands(reply):
    for cmd in reply.get("commands", []) or []:
        handle_command(cmd)
        if "id" in cmd:
            acks.append(cmd["id"])


def post_readings(body):
    try:
        r = requests.post(
            URL,
            json=body,
            headers={"Authorization": f"Bearer {TOKEN}"},
            timeout=15,
        )
    except requests.RequestException as e:
        print(f"POST failed: {e}")
        return False
    print(f"POST {r.status_code} {r.text}")
    if r.status_code == 200:
        try:
            run_commands(r.json())
        except ValueError:
            pass
        return True
    return False


def main():
    if not TOKEN:
        sys.exit("Set the IOT_TOKEN environment variable.")
    while True:
        body = read_sensors()
        sent_acks = list(acks)
        if sent_acks:
            body["ack"] = sent_acks
        if post_readings(body):
            del acks[: len(sent_acks)]  # keep acks until delivered
        time.sleep(EVERY_S)


if __name__ == "__main__":
    main()
