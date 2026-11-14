# IoT sender on Cloudflare Workers

Posts mock temperature readings to the IoT portal every 5 minutes (free plan cron).

```bash
cd cloudflare-worker
npx wrangler login                 # or set CLOUDFLARE_API_TOKEN
npx wrangler deploy
npx wrangler secret put IOT_TOKEN  # paste the device token
npx wrangler tail                  # watch logs
```
