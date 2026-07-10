"use client";

import { useState } from "react";

interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  tokenSymbol: string;
  value: string;
  tokenDecimal: string;
  timeStamp: string;
}

interface TrackedWalletData {
  address: string;
  nativeBalanceEth: string;
  transfers: TokenTransfer[];
  uniqueTokens: string[];
  flags: {
    whaleTransfers: { symbol: string; amount: number; usd: number | null; hash: string }[];
    highFrequency: boolean;
    recentTxCount24h: number;
  };
  aiSummary: string;
}

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function CornerMarks() {
  return (
    <div>
      <span className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-base-blue" />
      <span className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-base-blue" />
      <span className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-base-blue" />
      <span className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-base-blue" />
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackedWalletData | null>(null);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setData(null);
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: input.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
      } else {
        setData(json);
      }
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <header className="mb-12">
        <div className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-base-blue">
          Base chain · Sheet 01
        </div>
        <h1 className="font-display text-4xl font-bold text-paper sm:text-5xl">
          Blueprint
        </h1>
        <p className="mt-3 max-w-xl font-body text-paper/70">
          Paste any address active on Base. We read its on-chain activity and
          have an AI agent draft a plain-English blueprint — balances,
          transfers, and anything that looks like whale or bot activity.
        </p>
      </header>

      <form onSubmit={handleTrack} className="mb-10">
        <div className="relative border border-blueprint-line bg-blueprint/60 p-1">
          <CornerMarks />
          <div className="flex flex-col gap-2 p-3 sm:flex-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
              className="flex-1 bg-transparent px-3 py-3 font-mono text-sm text-paper placeholder:text-paper/30 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-base-blue px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Reading…" : "Trace address"}
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-3 font-mono text-sm text-alert-red">{error}</p>
        )}
      </form>

      {data && (
        <section className="space-y-6">
          {/* Summary card */}
          <div className="relative border border-blueprint-line bg-blueprint/60 p-6">
            <CornerMarks />
            <div className="mb-4 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-base-blue">
              <span>Subject</span>
              <span>{shorten(data.address)}</span>
            </div>
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="ETH balance" value={`${data.nativeBalanceEth} ETH`} />
              <Stat label="Tokens seen" value={String(data.uniqueTokens.length)} />
              <Stat label="Tx / 24h" value={String(data.flags.recentTxCount24h)} />
            </div>

            {(data.flags.whaleTransfers.length > 0 || data.flags.highFrequency) && (
              <div className="mb-6 flex flex-wrap gap-2">
                {data.flags.highFrequency && (
                  <Badge color="amber">High frequency activity</Badge>
                )}
                {data.flags.whaleTransfers.map((w, i) => (
                  <Badge key={i} color="red">
                    Whale transfer · {w.symbol} (~${w.usd?.toFixed(0)})
                  </Badge>
                ))}
              </div>
            )}

            <div className="border-t border-blueprint-line pt-4">
              <div className="mb-2 font-mono text-xs uppercase tracking-widest text-base-blue">
                AI read
              </div>
              <p className="font-body text-sm leading-relaxed text-paper/90">
                {data.aiSummary}
              </p>
            </div>
          </div>

          {/* Transfers table */}
          <div className="relative border border-blueprint-line bg-blueprint/60 p-6">
            <CornerMarks />
            <div className="mb-4 font-mono text-xs uppercase tracking-widest text-base-blue">
              Recent transfers
            </div>
            {data.transfers.length === 0 ? (
              <p className="font-mono text-sm text-paper/50">
                No token transfers found for this address yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="text-paper/40">
                      <th className="pb-2 pr-4 font-normal">Direction</th>
                      <th className="pb-2 pr-4 font-normal">Amount</th>
                      <th className="pb-2 pr-4 font-normal">Token</th>
                      <th className="pb-2 font-normal">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transfers.map((t) => {
                      const decimals = Number(t.tokenDecimal || "18");
                      const amount = Number(t.value) / Math.pow(10, decimals);
                      const isIncoming =
                        t.to.toLowerCase() === data.address.toLowerCase();
                      return (
                        <tr key={t.hash} className="border-t border-blueprint-line/60">
                          <td
                            className={`py-2 pr-4 ${
                              isIncoming ? "text-green-400" : "text-paper/70"
                            }`}
                          >
                            {isIncoming ? "IN" : "OUT"}
                          </td>
                          <td className="py-2 pr-4 text-paper">
                            {amount.toFixed(4)}
                          </td>
                          <td className="py-2 pr-4 text-paper/70">
                            {t.tokenSymbol}
                          </td>
                          <td className="py-2">
                            
                              href={`https://basescan.org/tx/${t.hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-base-blue hover:underline"
                            >
                              {t.hash.slice(0, 10)}…
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      <footer className="mt-16 font-mono text-xs text-paper/30">
        Data via Basescan (Base chain). Prices via CoinGecko. AI read via
        Groq. Not financial advice.
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-paper/40">
        {label}
      </div>
      <div className="font-display text-lg font-bold text-paper">{value}</div>
    </div>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "amber" | "red";
}) {
  const colorClass =
    color === "amber"
      ? "border-alert-amber text-alert-amber"
      : "border-alert-red text-alert-red";
  return (
    <span
      className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${colorClass}`}
    >
      {children}
    </span>
  );
}
