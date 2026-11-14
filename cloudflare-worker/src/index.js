// Cloudflare Worker: sends mock readings to the IoT portal every 5 minutes (cron trigger).
// Secret: IOT_TOKEN (set with `npx wrangler secret put IOT_TOKEN`).
// Optional KV binding ACKS: keeps command ids between runs so they are confirmed in the next post.
const URL = "https://app.iotportal.cc/api/ingest";

// Mock data: replace with real values.
function readSensors() {
  const temperature = 20 + Math.random() * 15; // Temperature (°C)
  return { temperature: Math.round(temperature * 10) / 10 };
}

// Act on one command from the portal, e.g. {"id":"…","command":"relay_on","relay":1}.
function handleCommand(cmd) {
  console.log("command", JSON.stringify(cmd));
}

async function send(env) {
  const body = readSensors();
  const acks = env.ACKS ? JSON.parse((await env.ACKS.get("acks")) || "[]") : [];
  if (acks.length) body.ack = acks;

  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.IOT_TOKEN}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`POST ${res.status} ${text}`);
  if (res.status !== 200) return { status: res.status, text };

  const next = [];
  try {
    for (const cmd of JSON.parse(text).commands || []) {
      handleCommand(cmd);
      if (cmd.id) next.push(cmd.id);
    }
  } catch (_) {}
  if (env.ACKS && (acks.length || next.length)) await env.ACKS.put("acks", JSON.stringify(next));
  return { status: res.status, text };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(send(env));
  },
  // Visiting the Worker URL shows status only; it does not send.
  async fetch() {
    return new Response("iot-sender: posts every 5 minutes via cron\n");
  },
};
