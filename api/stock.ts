import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authorize } from '../server/security.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!await authorize(req, res, 'stock')) return;
  const { ticker } = req.query;
  if (typeof ticker !== 'string' || !/^[A-Z0-9^][A-Z0-9.^=-]{0,19}$/.test(ticker)) {
    return res.status(400).json({ error: 'Invalid ticker' });
  }
  // Fixed host, path encoding, and fixed query prevent arbitrary upstream requests.
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(8000), redirect: 'error',
    });
    if (!response.ok) return res.status(502).json({ error: '주가 정보를 가져오지 못했습니다.' });
    return res.json(await response.json());
  } catch {
    return res.status(502).json({ error: '주가 정보를 가져오지 못했습니다.' });
  }
}
