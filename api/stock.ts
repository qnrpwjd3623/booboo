import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel 서버리스 함수 — 서버에서 Yahoo Finance 직접 호출 (CORS 우회)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { ticker } = req.query;
  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'ticker required' });
  }

  // ticker에 이미 쿼리스트링 포함 (예: 005930.KS?interval=1d&range=1d)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo Finance returned ${response.status}` });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
}
