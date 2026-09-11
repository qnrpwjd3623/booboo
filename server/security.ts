import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export async function authorize(
  req: VercelRequest, res: VercelResponse, resource: 'stock' | 'ai',
): Promise<boolean> {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !/^Bearer [^\s]{20,8192}$/i.test(authorization)) {
    res.status(401).json({ error: '로그인이 필요합니다.' });
    return false;
  }
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.status(503).json({ error: '서버 설정을 확인해주세요.' });
    return false;
  }
  try {
    const headers = { apikey: key, Authorization: authorization };
    // Validate with Supabase Auth; never trust a locally decoded JWT or client user ID.
    const auth = await fetch(`${url}/auth/v1/user`, { headers, signal: AbortSignal.timeout(5000) });
    if (!auth.ok) {
      res.status(auth.status >= 500 ? 503 : 401).json({ error: '로그인을 다시 확인해주세요.' });
      return false;
    }
    const user = z.object({ id: z.string() }).parse(await auth.json());
    if (typeof user.id !== 'string') {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return false;
    }
    // Atomic shared database counter; missing migration/outage must fail closed.
    const quota = await fetch(`${url}/rest/v1/rpc/consume_api_quota`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_resource: resource }), signal: AbortSignal.timeout(5000),
    });
    if (!quota.ok) throw new Error('Quota unavailable');
    const result = z.object({ allowed: z.boolean(), reason: z.string().optional(), retry_after: z.number().optional() }).parse(await quota.json());
    if (result.allowed !== true) {
      if (result.reason === 'not_allowed') {
        res.status(403).json({ error: 'API 사용이 허용되지 않은 계정입니다.' });
      } else if (result.reason === 'rate_limit') {
        const retry = Math.max(1, Math.min(86400, Number(result.retry_after) || 60));
        res.setHeader('Retry-After', String(Math.ceil(retry)));
        res.status(429).json({ error: '요청이 많습니다. 잠시 후 다시 시도해주세요.' });
      } else throw new Error('Invalid quota response');
      return false;
    }
    return true;
  } catch {
    res.status(503).json({ error: '인증 또는 호출 제한 확인에 실패했습니다. 잠시 후 다시 시도해주세요.' });
    return false;
  }
}
