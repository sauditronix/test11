# Webhook Service

Sends simulated IoT sensor readings (temperature, humidity, CO2) to a webhook URL every N seconds. No dependencies, Node 18+.

## Run

```bash
WEBHOOK_URL=https://webhook.site/your-id INTERVAL_SEC=30 node index.js
```

Docker:

```bash
docker build -t webhook-service .
docker run -d --restart unless-stopped -e WEBHOOK_URL=https://... -e INTERVAL_SEC=30 webhook-service
```

## Config (env vars)

| Var | Default | Purpose |
|---|---|---|
| `WEBHOOK_URL` | required | Target URL (http/https) |
| `INTERVAL_SEC` | `60` | Seconds between sends |
| `DEVICE_ID` | `sensor-001` | Device ID in payload |
| `WEBHOOK_TOKEN` | – | Sent as `Authorization: Bearer` |
| `WEBHOOK_SECRET` | – | Adds `X-Signature: sha256=<HMAC of body>` |
| `RETRIES` | `3` | Attempts per reading (exponential backoff) |
| `TIMEOUT_MS` | `10000` | Per-request timeout |

## Payload

```json
{
  "deviceId": "sensor-001",
  "timestamp": "2026-10-20T12:00:00.000Z",
  "data": { "temperature": 24.3, "humidity": 51.2, "co2": 640 }
}
```

To send real data, replace `buildPayload()` in `index.js`.
