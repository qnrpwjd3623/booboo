// 한국 주식 시세 API (한국투자증권 KIS API 또는 Yahoo Finance 대안)
// 실제 구현 시 API 키가 필요합니다

export interface StockPrice {
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changeRate: number;
  lastUpdated: string;
}

// Yahoo Finance API (묶음 조회 지원)
const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart/';

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

// 주식 가격 조회 (단일)
export async function fetchStockPrice(ticker: string): Promise<StockPrice | null> {
  try {
    const yahooTicker = KOREA_TICKER_MAP[ticker] || `${ticker}.KS`;
    const response = await fetch(`${YAHOO_FINANCE_API}${yahooTicker}?interval=1d&range=1d`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch stock price');
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      return null;
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    if (!quote?.close?.[0]) {
      return null;
    }

    const currentPrice = quote.close[quote.close.length - 1];
    const previousClose = meta.previousClose || meta.regularMarketPreviousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changeRate = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      ticker,
      name: meta.shortName || meta.longName || ticker,
      currentPrice: Math.round(currentPrice),
      change: Math.round(change),
      changeRate: Number(changeRate.toFixed(2)),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching stock price:', error);
    return null;
  }
}

// 여러 주식 가격 조회
export async function fetchMultipleStockPrices(tickers: string[]): Promise<Record<string, StockPrice>> {
  const results: Record<string, StockPrice> = {};
  
  // 병렬로 조회
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
  // 초기 조회
  fetchMultipleStockPrices(tickers).then(onUpdate);

  // 주기적 업데이트
  const intervalId = setInterval(() => {
    fetchMultipleStockPrices(tickers).then(onUpdate);
  }, intervalMinutes * 60 * 1000);

  // 클린업 함수 반환
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
