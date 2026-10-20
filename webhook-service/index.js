#!/usr/bin/env node
// Sends simulated IoT sensor data to a webhook URL at a fixed interval.
// Zero dependencies (Node 18+). Configure via environment variables.

const crypto = require('crypto');

const cfg = {
  url: process.env.WEBHOOK_URL,
  intervalSec: Number(process.env.INTERVAL_SEC || 60),
  deviceId: process.env.DEVICE_ID || 'sensor-001',
  secret: process.env.WEBHOOK_SECRET || '', // optional HMAC-SHA256 signing
  token: process.env.WEBHOOK_TOKEN || '',   // optional Bearer token
  retries: Number(process.env.RETRIES || 3),
  timeoutMs: Number(process.env.TIMEOUT_MS || 10000),
};

if (!cfg.url || !/^https?:\/\//.test(cfg.url)) {
  console.error('WEBHOOK_URL is required (http/https).');
  process.exit(1);
}
if (!(cfg.intervalSec >= 1)) {
  console.error('INTERVAL_SEC must be >= 1.');
  process.exit(1);
}

const log = (...a) => console.log(new Date().toISOString(), ...a);
const rand = (min, max) => +(min + Math.random() * (max - min)).toFixed(1);

function buildPayload() {
  return {
    deviceId: cfg.deviceId,
    timestamp: new Date().toISOString(),
    data: {
      temperature: rand(18, 35),
      humidity: rand(30, 70),
      co2: Math.round(rand(400, 1200)),
    },
  };
}

async function send(payload) {
  const body = JSON.stringify(payload);
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
  if (cfg.secret) {
    headers['X-Signature'] =
      'sha256=' + crypto.createHmac('sha256', cfg.secret).update(body).digest('hex');
  }

  for (let attempt = 1; attempt <= cfg.retries; attempt++) {
    try {
      const res = await fetch(cfg.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(cfg.timeoutMs),
      });
      if (res.ok) return log(`sent OK (${res.status})`, body);
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      log(`attempt ${attempt}/${cfg.retries} failed: ${err.message}`);
      if (attempt < cfg.retries) await new Promise(r => setTimeout(r, 2 ** attempt * 1000));
    }
  }
  log('giving up on this reading');
}

let busy = false;
async function tick() {
  if (busy) return; // skip if previous send still retrying
  busy = true;
  try { await send(buildPayload()); } finally { busy = false; }
}

log(`starting: ${cfg.url} every ${cfg.intervalSec}s as ${cfg.deviceId}`);
tick();
const timer = setInterval(tick, cfg.intervalSec * 1000);

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => { log('stopping'); clearInterval(timer); process.exit(0); });
}
