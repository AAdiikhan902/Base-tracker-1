import type { TrackedWalletData } from "./base";

export async function generateAiSummary(data: TrackedWalletData): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return "AI summary unavailable: no GROQ_API_KEY set on the server.";
  }

  const transferLines = data.transfers
    .slice(0, 15)
    .map((t) => {
      const decimals = Number(t.tokenDecimal || "18");
      const amount = Number(t.value) / Math.pow(10, decimals);
      const direction = t.to.toLowerCase() === data.address.toLowerCase() ? "received" : "sent";
      return `${direction} ${amount.toFixed(4)} ${t.tokenSymbol} (tx ${t.hash.slice(0, 10)}...)`;
    })
    .join("\n");

  const whaleLines = data.flags.whaleTransfers
    .map((w) => `${w.symbol}: ${w.amount.toFixed(2)} (~$${w.usd?.toFixed(0)})`)
    .join("\n") || "none";

  const prompt = `You are a blockchain analyst assistant. Summarize this Base chain wallet's recent activity in plain English for a non-technical reader. Be concise (4-6 sentences max). Mention notable patterns, and clearly call out any whale-sized transfers or high-frequency activity if present. Do not invent data not given below.

Wallet: ${data.address}
Native ETH balance: ${data.nativeBalanceEth} ETH
Distinct tokens seen: ${data.uniqueTokens.join(", ") || "none"}
Transactions in last 24h: ${data.flags.recentTxCount24h}
High frequency flag: ${data.flags.highFrequency}

Recent transfers:
${transferLines || "none"}

Whale-sized transfers (>$10,000):
${whaleLines}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      return "AI summary unavailable right now (the AI provider returned an error).";
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() || "No summary generated.";
  } catch {
    return "AI summary unavailable right now (network error contacting the AI provider).";
  }
}
