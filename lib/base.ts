// Basescan's API is now served through Etherscan's unified V2 endpoint —
// this is Basescan data (chainid=8453 = Base), just via the merged system.
// You can get the key from either basescan.org/apis or etherscan.io — same key.
const ETHERSCAN_V2_BASE = "https://api.etherscan.io/v2/api";
const BASE_CHAIN_ID = 8453;
const WHALE_USD_THRESHOLD = 10000; // flag any single transfer above this
const HIGH_FREQUENCY_THRESHOLD = 20; // tx count in last 24h to flag as "high activity"

export interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  tokenSymbol: string;
  tokenName: string;
  contractAddress: string;
  value: string;
  tokenDecimal: string;
  timeStamp: string;
}

export interface TrackedWalletData {
  address: string;
  nativeBalanceEth: string;
  transfers: TokenTransfer[];
  uniqueTokens: string[];
  flags: {
    whaleTransfers: { symbol: string; amount: number; usd: number | null; hash: string }[];
    highFrequency: boolean;
    recentTxCount24h: number;
  };
}

function etherscanUrl(params: Record<string, string>) {
  const url = new URL(ETHERSCAN_V2_BASE);
  url.searchParams.set("chainid", String(BASE_CHAIN_ID));
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", process.env.BASESCAN_API_KEY || "");
  return url.toString();
}

export async function fetchNativeBalance(address: string): Promise<string> {
  const res = await fetch(
    etherscanUrl({ module: "account", action: "balance", address, tag: "latest" }),
    { cache: "no-store" }
  );
  const data = await res.json();
  if (data.status !== "1" && data.message !== "OK") {
    return "0";
  }
  const wei = BigInt(data.result || "0");
  const eth = Number(wei) / 1e18;
  return eth.toFixed(6);
}

export async function fetchTokenTransfers(address: string): Promise<TokenTransfer[]> {
  const res = await fetch(
    etherscanUrl({
      module: "account",
      action: "tokentx",
      address,
      sort: "desc",
      page: "1",
      offset: "100",
    }),
    { cache: "no-store" }
  );
  const data = await res.json();
  if (!Array.isArray(data.result)) return [];
  return data.result as TokenTransfer[];
}

async function fetchTokenPricesUsd(contractAddresses: string[]): Promise<Record<string, number>> {
  if (contractAddresses.length === 0) return {};
  try {
    const unique = Array.from(new Set(contractAddresses.map((a) => a.toLowerCase())));
    const chunks: string[][] = [];
    for (let i = 0; i < unique.length; i += 50) chunks.push(unique.slice(i, i + 50));

    const priceMap: Record<string, number> = {};
    for (const chunk of chunks) {
      const url = `https://api.coingecko.com/api/v3/simple/token_price/base?contract_addresses=${chunk.join(
        ","
      )}&vs_currencies=usd`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      for (const addr of Object.keys(data)) {
        if (data[addr]?.usd) priceMap[addr.toLowerCase()] = data[addr].usd;
      }
    }
    return priceMap;
  } catch {
    return {};
  }
}

export async function analyzeWallet(address: string): Promise<TrackedWalletData> {
  const [nativeBalanceEth, transfers] = await Promise.all([
    fetchNativeBalance(address),
    fetchTokenTransfers(address),
  ]);

  const uniqueTokens = Array.from(new Set(transfers.map((t) => t.tokenSymbol))).slice(0, 50);
  const uniqueContracts = Array.from(new Set(transfers.map((t) => t.contractAddress)));
  const prices = await fetchTokenPricesUsd(uniqueContracts);

  const whaleTransfers: TrackedWalletData["flags"]["whaleTransfers"] = [];
  for (const t of transfers) {
    const decimals = Number(t.tokenDecimal || "18");
    const amount = Number(t.value) / Math.pow(10, decimals);
    const price = prices[t.contractAddress?.toLowerCase()];
    const usd = price ? amount * price : null;
    if (usd !== null && usd >= WHALE_USD_THRESHOLD) {
      whaleTransfers.push({ symbol: t.tokenSymbol, amount, usd, hash: t.hash });
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const recentTxCount24h = transfers.filter(
    (t) => now - Number(t.timeStamp) < 24 * 60 * 60
  ).length;

  return {
    address,
    nativeBalanceEth,
    transfers: transfers.slice(0, 25),
    uniqueTokens,
    flags: {
      whaleTransfers: whaleTransfers.slice(0, 10),
      highFrequency: recentTxCount24h >= HIGH_FREQUENCY_THRESHOLD,
      recentTxCount24h,
    },
  };
}
