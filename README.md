# Grok Console

A GitHub Pages website for talking to Grok in the browser, instead of a desktop `.exe`.

**Live site:** [https://hacker3278.github.io/grok-console/](https://hacker3278.github.io/grok-console/)

**Repo:** [https://github.com/HaCkEr3278/grok-console](https://github.com/HaCkEr3278/grok-console)

GitHub will 404 until Pages is switched on once: repo **Settings → Pages → Source: GitHub Actions**, then re-run the latest workflow under the **Actions** tab.

Conversations and your API key stay in *your* browser. The page calls [api.x.ai](https://api.x.ai) directly (GitHub Pages is static, so there is no server of ours in the middle).

## Use it

1. Open the live site.
2. You can chat immediately in **Demo mode**.
3. For live Grok, create a key at [console.x.ai](https://console.x.ai), paste it in **Controls**, and press **Test connection**.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

## Controls

| Knob | What it does |
| --- | --- |
| API key | xAI bearer token, stored in this browser |
| Model | `grok-4.7` default, plus others your account lists |
| Temperature / Top P / Max tokens | Sampling |
| Live search | Off, Auto, or On (web + X). Off by default |
| Reasoning effort | Sent for Grok 4.3 / 4.7 / 4.20 |
| System prompt | Standing instructions for every turn |

## Scripts

```bash
npm run dev      # http://127.0.0.1:4317
npm run build    # static files in out/
npm run lint
```
