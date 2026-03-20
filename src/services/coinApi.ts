// CoinGecko API - CORS 프록시 불필요 (직접 호출 가능)

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  currentPriceKRW: number;
  currentPriceUSD: number;
  change24h: number;
}

// 주요 코인 심볼 → CoinGecko ID 매핑
const COIN_ID_MAP: Record<string, string> = {
  BTC:   'bitcoin',
  ETH:   'ethereum',
  SOL:   'solana',
  XRP:   'ripple',
  ADA:   'cardano',
  DOGE:  'dogecoin',
  AVAX:  'avalanche-2',
  DOT:   'polkadot',
  LINK:  'chainlink',
  UNI:   'uniswap',
  ATOM:  'cosmos',
  MATIC: 'matic-network',
  POL:   'matic-network',
  LTC:   'litecoin',
  BCH:   'bitcoin-cash',
  NEAR:  'near',
  APT:   'aptos',
  OP:    'optimism',
  ARB:   'arbitrum',
  SUI:   'sui',
  SHIB:  'shiba-inu',
  PEPE:  'pepe',
  KLAY:  'klay-token',
  WEMIX: 'wemix-token',
  BORA:  'bora',
  TRX:   'tron',
  TON:   'the-open-network',
  FIL:   'filecoin',
  SAND:  'the-sandbox',
  MANA:  'decentraland',
  GRT:   'the-graph',
  INJ:   'injective-protocol',
  SEI:   'sei-network',
};

export async function fetchCoinPrice(symbol: string): Promise<CoinPrice | null> {
  const upperSymbol = symbol.toUpperCase().trim();
  let coinId = COIN_ID_MAP[upperSymbol];
  let coinName = upperSymbol;

  // 매핑에 없으면 CoinGecko search API로 찾기
  if (!coinId) {
    try {
      const searchRes = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(upperSymbol)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!searchRes.ok) return null;
      const searchData = await searchRes.json();
      const coin = searchData.coins?.[0];
      if (!coin) return null;
      coinId = coin.id;
      coinName = coin.name;
    } catch {
      return null;
    }
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=krw,usd&include_24hr_change=true`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const coinData = data[coinId];
    if (!coinData) return null;

    return {
      id: coinId,
      symbol: upperSymbol,
      name: coinName,
      currentPriceKRW: Math.round(coinData.krw),
      currentPriceUSD: coinData.usd,
      change24h: coinData.usd_24h_change ?? 0,
    };
  } catch {
    return null;
  }
}
