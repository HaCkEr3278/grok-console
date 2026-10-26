function aboutApp() {
  return [
    "This is **Grok Console** — a browser replacement for a desktop Grok `.exe`.",
    "",
    "You talk in the center column. Conversations stay in this browser. The right-hand **Controls** panel is the real cockpit:",
    "",
    "- **API key** — paste a key from [console.x.ai](https://console.x.ai). It lives in local storage on this device, then this site proxies it to xAI so the browser never calls the API directly (that would fail CORS).",
    "- **Model** — Grok 4.7 is the default flagship. Switch to 4.3 for long-context reasoning or 3 Mini when you want it cheap and fast.",
    "- **Temperature / Top P / Max tokens** — the usual sampling knobs.",
    "- **Live search** — off by default so you do not get surprise web/X lookups. Flip to Auto or On when you want current events.",
    "- **System prompt** — this is Grok’s standing instructions for the thread.",
    "",
    "You are in **Demo mode** until a key is saved. Demo answers are local, so they cannot search, remember, or match live Grok. Paste a key, hit **Test connection**, and this same window talks to the real model.",
  ].join("\n");
}

export function demoReply(userText: string) {
  const text = userText.trim();
  const lower = text.toLowerCase();

  if (!text) {
    return "Say anything — I will answer in demo mode until you connect a live Grok key.";
  }

  if (
    /\b(what is this|what does this|how does this (app )?work|explain (the )?app|how do i (use|connect)|connect grok|api key)\b/.test(
      lower,
    )
  ) {
    return aboutApp();
  }

  if (/^(hi|hello|hey|yo|sup)\b/.test(lower)) {
    return [
      "Hey. This tab is your Grok desk — same job as a local `.exe`, just in the browser.",
      "",
      "I am running in **Demo mode** right now, so replies stay on this page. Open **Controls**, paste an xAI API key, and I will route you to live Grok.",
      "",
      "Ask me how the app works, or just talk. Demo still streams so you can try stop, regenerate, and new chats.",
    ].join("\n");
  }

  if (/\b(who are you|are you grok)\b/.test(lower)) {
    return [
      "In Demo mode I am a stand-in for Grok so the webpage is usable before you attach a key.",
      "",
      "Connect a key from [console.x.ai](https://console.x.ai) and the same composer talks to live Grok from this page.",
    ].join("\n");
  }

  return [
    `You said: “${text.length > 280 ? `${text.slice(0, 280)}…` : text}”`,
    "",
    "Demo mode can stream, stop, and keep a thread in this browser, but it cannot think like live Grok.",
    "",
    "To hand this window to the real model:",
    "1. Create a key at [console.x.ai](https://console.x.ai).",
    "2. Open **Controls** (the sliders icon).",
    "3. Paste the key and press **Test connection**.",
    "",
    "Until then, ask “how does this app work?” for a tour of the knobs.",
  ].join("\n");
}

export async function streamDemoText(
  text: string,
  onChunk: (chunk: string) => void,
  signal: AbortSignal,
) {
  const parts = text.split(/(\s+)/);
  for (const part of parts) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    onChunk(part);
    await new Promise((resolve) => setTimeout(resolve, part.trim() ? 16 : 8));
  }
}
