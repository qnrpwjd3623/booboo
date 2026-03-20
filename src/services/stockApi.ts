// 한국 주식 시세 API (Yahoo Finance + CORS 프록시)

export interface StockPrice {
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changeRate: number;
  lastUpdated: string;
}

// CORS 프록시 목록 (순서대로 폴백)
const YAHOO_FINANCE_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const PROXY_LIST = [
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

// 프록시를 순서대로 시도 — 첫 번째 성공한 응답 반환
async function fetchWithProxy(path: string): Promise<Response> {
  const fullUrl = `${YAHOO_FINANCE_API_BASE}${path}`;
  let lastError: unknown;
  for (const proxyFn of PROXY_LIST) {
    try {
      const res = await fetch(proxyFn(fullUrl), { signal: AbortSignal.timeout(5000) });
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error('All proxies failed');
}

// 티커 매핑 (한국 주식)
const KOREA_TICKER_MAP: Record<string, string> = {
  '005930': '005930.KS', // 삼성전자
  '035420': '035420.KS', // NAVER
  '035720': '035720.KS', // 카카오
  '005380': '005380.KS', // 현대차
  '373220': '373220.KS', // LG에너지솔루션
  '000660': '000660.KS', // SK하이닉스
  '207940': '207940.KS', // 삼성바이오로직스
  '051910': '051910.KS', // LG화학
  '006400': '006400.KS', // 삼성SDI
  '028260': '028260.KS', // 삼성물산
};

// 티커가 숫자로만 구성되면 한국 주식 (종목코드)
export function isKoreanTicker(ticker: string): boolean {
  return /^\d+$/.test(ticker.trim());
}

// USD/KRW 환율 조회
export async function fetchUSDToKRW(): Promise<number> {
  try {
    const response = await fetchWithProxy('USDKRW=X?interval=1d&range=1d');
    const data = await response.json();
    const result = data.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];
    if (!quote?.close) return 1350;
    const closes = quote.close.filter((v: number | null) => v != null);
    return closes.length > 0 ? Math.round(closes[closes.length - 1]) : 1350;
  } catch {
    return 1350; // fallback rate
  }
}

// Yahoo Finance 공통 파서 (null 값 안전하게 처리)
function parseYahooChart(data: Record<string, unknown>, originalTicker: string): StockPrice | null {
  const chart = data.chart as Record<string, unknown> | undefined;
  const results = chart?.result as Array<Record<string, unknown>> | undefined;
  if (!results?.[0]) return null;
  const result = results[0];
  const meta = result.meta as Record<string, unknown>;
  const indicators = result.indicators as Record<string, unknown>;
  const quote = (indicators?.quote as Array<Record<string, unknown>>)?.[0];

  // close 배열에서 유효한 값 추출, 없으면 meta.regularMarketPrice 로 폴백
  const closes = quote?.close
    ? (quote.close as (number | null)[]).filter((v) => v != null)
    : [];

  const currentPrice: number =
    closes.length > 0
      ? closes[closes.length - 1]
      : (meta.regularMarketPrice as number) || 0;

  if (!currentPrice) return null;

  const previousClose =
    (meta.previousClose as number) ||
    (meta.regularMarketPreviousClose as number) ||
    currentPrice;
  const change = currentPrice - previousClose;
  const changeRate = previousClose > 0 ? (change / previousClose) * 100 : 0;
  return {
    ticker: originalTicker,
    name: (meta.shortName as string) || (meta.longName as string) || originalTicker,
    currentPrice: Math.round(currentPrice),
    change: Math.round(change),
    changeRate: Number(changeRate.toFixed(2)),
    lastUpdated: new Date().toISOString(),
  };
}

// 미국 주식 가격 조회 (달러 단위)
export async function fetchUSStockPrice(ticker: string): Promise<StockPrice | null> {
  try {
    const response = await fetchWithProxy(`${ticker.toUpperCase()}?interval=1d&range=1d`);
    const data = await response.json();
    return parseYahooChart(data, ticker.toUpperCase());
  } catch (error) {
    console.error('Error fetching US stock price:', error);
    return null;
  }
}

// 주식 가격 조회 (단일) — 한국/미국 자동 감지, 항상 KRW로 반환
export async function fetchStockPrice(ticker: string): Promise<StockPrice | null> {
  try {
    // 미국 주식: 환율 변환 후 KRW 반환
    if (!isKoreanTicker(ticker)) {
      const [usdPrice, krwRate] = await Promise.all([
        fetchUSStockPrice(ticker),
        fetchUSDToKRW(),
      ]);
      if (!usdPrice) return null;
      return {
        ...usdPrice,
        currentPrice: Math.round(usdPrice.currentPrice * krwRate),
        change: Math.round(usdPrice.change * krwRate),
      };
    }

    // 한국 주식 — parseYahooChart로 null 안전하게 처리
    const yahooTicker = KOREA_TICKER_MAP[ticker] || `${ticker}.KS`;
    const response = await fetchWithProxy(`${yahooTicker}?interval=1d&range=1d`);
    const data = await response.json();
    return parseYahooChart(data, ticker);
  } catch (error) {
    console.error('Error fetching stock price:', error);
    return null;
  }
}

// 여러 주식 가격 조회
export async function fetchMultipleStockPrices(tickers: string[]): Promise<Record<string, StockPrice>> {
  const results: Record<string, StockPrice> = {};
  const promises = tickers.map(async (ticker) => {
    const price = await fetchStockPrice(ticker);
    if (price) {
      results[ticker] = price;
    }
  });
  await Promise.all(promises);
  return results;
}

// 주식 가격 자동 업데이트 (5분 간격)
export function startStockPriceAutoUpdate(
  tickers: string[],
  onUpdate: (prices: Record<string, StockPrice>) => void,
  intervalMinutes: number = 5
): () => void {
  fetchMultipleStockPrices(tickers).then(onUpdate);
  const intervalId = setInterval(() => {
    fetchMultipleStockPrices(tickers).then(onUpdate);
  }, intervalMinutes * 60 * 1000);
  return () => clearInterval(intervalId);
}

// 더미 데이터 (API 호출 실패 시 사용)
export function getDummyStockPrice(ticker: string): StockPrice {
  const dummyPrices: Record<string, number> = {
    '005930': 78500,
    '035420': 298000,
    '035720': 92000,
    '005380': 215000,
    '373220': 398000,
    '000660': 145000,
    '207940': 850000,
    '051910': 520000,
    '006400': 480000,
    '028260': 125000,
  };
  return {
    ticker,
    name: ticker,
    currentPrice: dummyPrices[ticker] || 50000,
    change: 0,
    changeRate: 0,
    lastUpdated: new Date().toISOString(),
  };
}
