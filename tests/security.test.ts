import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import stock from '../api/stock.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
function response() {
  return { code: 200, body: undefined as unknown, headers: {} as Record<string, unknown>,
    setHeader(k: string, v: unknown) { this.headers[k] = v; return this; },
    status(n: number) { this.code = n; return this; },
    json(v: unknown) { this.body = v; return this; },
  };
}
test('stock rejects anonymous requests before contacting any upstream', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ chart: {} }); };
  const res = response();
  await stock({ method: 'GET', query: { ticker: 'AAPL' }, headers: {} } as never, res as never);
  assert.equal(res.code, 401);
  assert.equal(calls, 0);
});
test('stock rejects unsupported methods', async () => {
  globalThis.fetch = async () => Response.json({});
  const res = response();
  await stock({ method: 'POST', query: { ticker: 'AAPL' }, headers: {} } as never, res as never);
  assert.equal(res.code, 405);
});

import { existsSync } from 'node:fs';
test('Gemini has a server endpoint instead of a public browser key', () => {
  assert.ok(existsSync(new URL('../api/ai.ts', import.meta.url)), 'Missing server AI endpoint');
});

process.env.SUPABASE_URL = 'https://auth.example.test';
process.env.SUPABASE_ANON_KEY = 'public-test-key';
process.env.GEMINI_API_KEY = 'server-only-test-secret';
const headers = { authorization: 'Bearer valid-test-token-long-enough', 'content-type': 'application/json' };
function upstream(quota: unknown = { allowed: true }, upstreamResponse: () => Response = () => Response.json({ chart: {} })) {
  const urls: string[] = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    if (String(url).endsWith('/auth/v1/user')) return Response.json({ id: 'account-a' });
    if (String(url).endsWith('/rpc/consume_api_quota')) return Response.json(quota);
    return upstreamResponse();
  };
  return urls;
}
test('invalid token never reaches quota or Yahoo', async () => {
  const urls: string[] = [];
  globalThis.fetch = async (u) => { urls.push(String(u)); return Response.json({}, { status: 401 }); };
  const res = response();
  await stock({ method: 'GET', headers, query: { ticker: 'AAPL' } } as never, res as never);
  assert.equal(res.code, 401); assert.equal(urls.length, 1);
});
test('exhausted shared quota returns 429 without contacting Yahoo', async () => {
  const urls = upstream({ allowed: false, reason: 'rate_limit', retry_after: 30 });
  const res = response();
  await stock({ method: 'GET', headers, query: { ticker: 'AAPL' } } as never, res as never);
  assert.equal(res.code, 429); assert.equal(res.headers['Retry-After'], '30');
  assert.equal(urls.length, 2);
});
test('quota failure fails closed', async () => {
  const urls = upstream({});
  const res = response();
  await stock({ method: 'GET', headers, query: { ticker: 'AAPL' } } as never, res as never);
  assert.equal(res.code, 503); assert.equal(urls.length, 2);
});
test('unapproved account cannot consume paid upstream resources', async () => {
  const urls = upstream({ allowed: false, reason: 'not_allowed' });
  const res = response();
  await stock({ method: 'GET', headers, query: { ticker: 'AAPL' } } as never, res as never);
  assert.equal(res.code, 403); assert.equal(urls.length, 2);
});
test('stock rejects query injection and accepts currency and Korean ETF tickers', async () => {
  for (const ticker of ['AAPL?range=max', '../other', 'https://evil.test', ['AAPL']]) {
    const urls = upstream(); const res = response();
    await stock({ method: 'GET', headers, query: { ticker } } as never, res as never);
    assert.equal(res.code, 400); assert.equal(urls.length, 2);
  }
  for (const ticker of ['AAPL', 'USDKRW=X', '0025N0.KS', 'BRK-B']) {
    const urls = upstream(); const res = response();
    await stock({ method: 'GET', headers, query: { ticker } } as never, res as never);
    assert.equal(res.code, 200);
    assert.equal(urls[2], `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`);
  }
});
test('AI anonymous requests are blocked and provider errors never leak secrets', async () => {
  const { default: ai } = await import('../api/ai.ts');
  let urls = upstream(); let res = response();
  await ai({ method: 'POST', headers: {}, body: { prompt: 'test' } } as never, res as never);
  assert.equal(res.code, 401); assert.equal(urls.length, 0);
  urls = upstream({ allowed: true }, () => Response.json({ error: process.env.GEMINI_API_KEY }, { status: 400 }));
  res = response();
  await ai({ method: 'POST', headers, body: { prompt: 'test' } } as never, res as never);
  assert.equal(res.code, 502);
  assert.ok(!JSON.stringify(res.body).includes(process.env.GEMINI_API_KEY!));
  assert.ok(!urls.some(url => url.includes('key=')));
});
test('AI rejects oversized prompts and caller model/token overrides', async () => {
  const { default: ai } = await import('../api/ai.ts');
  for (const body of [{ prompt: 'x'.repeat(20001) }, { prompt: 'x', model: 'other' }, { prompt: 'x', generationConfig: { maxOutputTokens: 999999 } }]) {
    const urls = upstream(); const res = response();
    await ai({ method: 'POST', headers, body } as never, res as never);
    assert.equal(res.code, 400); assert.equal(urls.length, 2);
  }
});
test('AI supports text and images, enforcing model and output budget server-side', async () => {
  const { default: ai } = await import('../api/ai.ts');
  for (const image of [undefined, { data: 'AAAA', mimeType: 'image/jpeg' }]) {
    let providerBody: { generationConfig?: { maxOutputTokens?: number } } = {};
    globalThis.fetch = async (u, options) => {
      if (String(u).endsWith('/auth/v1/user')) return Response.json({ id: 'account-a' });
      if (String(u).endsWith('/rpc/consume_api_quota')) return Response.json({ allowed: true });
      assert.equal((options!.headers as Record<string, string>)['x-goog-api-key'], process.env.GEMINI_API_KEY);
      providerBody = JSON.parse(String(options!.body));
      return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"message":"ok"}' }] } }] });
    };
    const res = response();
    await ai({ method: 'POST', headers, body: { prompt: 'test', image } } as never, res as never);
    assert.equal(res.code, 200); assert.deepEqual(res.body, { text: '{"message":"ok"}' });
    assert.equal(providerBody.generationConfig?.maxOutputTokens, image ? 4096 : 1024);
  }
});
