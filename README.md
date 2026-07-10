# Blueprint — Base chain wallet tracker

Paste any address active on Base, and get:
- Native ETH balance + recent ERC-20 token transfers
- Whale-transfer flags (>$10k single transfers, priced via CoinGecko)
- High-frequency / bot-like activity flags
- An AI-written plain-English summary of what the wallet's been doing

Everything below is free — no paid plan is required for any piece of this.

## 1. Get two free API keys

1. **Basescan (data source)**
   - Go to https://basescan.org/apis, make a free account there, create an API key.
   - Basescan's API now runs on the unified Etherscan V2 system — the key you
     get from basescan.org works the same as one from etherscan.io. The code
     calls `api.etherscan.io/v2/api` with `chainid=8453`, which is how you tell
     the unified system "give me Base chain data" — this **is** Basescan's data,
     just served through the merged endpoint. No separate legacy key exists anymore.
2. **Groq (free LLM inference)**
   - Go to https://console.groq.com/keys, make a free account, create an API key.
   - Groq's free tier is generous and fast — this powers the AI summary.

## 2. Run it locally

```bash
npm install
cp .env.example .env.local
# paste your two keys into .env.local (BASESCAN_API_KEY and GROQ_API_KEY)
npm run dev
```

Open http://localhost:3000, paste a Base address (e.g. any active wallet from
https://basescan.org), and hit "Trace address".

## 3. Deploy it for free (Vercel)

1. Push this folder to a new GitHub repo.
2. Go to https://vercel.com, sign in with GitHub, click "New Project", pick the repo.
3. In the project's Environment Variables settings, add:
   - `BASESCAN_API_KEY`
   - `GROQ_API_KEY`
4. Deploy. Vercel's free Hobby tier covers this comfortably — the AI/RPC calls
   run in serverless functions, not on a server you have to keep alive.

Your site will be live at `your-project.vercel.app` (or attach a custom domain,
also free on Vercel).

## Notes on scope / next steps

- This tracks **one address at a time** (paste-and-go), no accounts or saved
  watchlists — matches what was asked for. Adding accounts later would mean
  adding a free-tier database (e.g. Vercel Postgres or Supabase's free tier)
  plus simple auth.
- Whale threshold ($10k) and high-frequency threshold (20 tx/24h) are set as
  constants in `lib/base.ts` — easy to tune.
- Rate limits to be aware of on free tiers: Etherscan free key is 5 calls/sec,
  Groq free tier has generous but real daily token limits, CoinGecko public
  API is rate-limited per IP. Fine for personal/low-traffic use; if this gets
  real traffic you'd want to add caching (e.g. a short-lived KV cache per
  address) before scaling up.
