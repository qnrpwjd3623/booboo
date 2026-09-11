import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { authorize } from '../server/security.ts';

const inputSchema = z.object({
  prompt: z.string().min(1).max(20000),
  systemInstruction: z.string().max(4000).optional(),
  image: z.object({
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    data: z.string().min(4).max(1500000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  }).strict().optional(),
}).strict();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!await authorize(req, res, 'ai')) return;
  if (!req.headers['content-type']?.startsWith('application/json')) {
    return res.status(415).json({ error: 'JSON 요청이 필요합니다.' });
  }
  const parsed = inputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: '요청이 올바르지 않거나 이미지가 너무 큽니다.' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI 서버 설정이 필요합니다.' });
  const { prompt, systemInstruction, image } = parsed.data;
  const parts: unknown[] = image ? [{ inlineData: image }] : [];
  parts.push({ text: prompt });
  const body = {
    contents: [{ parts }],
    ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
    generationConfig: {
      temperature: image ? 0.1 : 0.7,
      maxOutputTokens: image ? 4096 : 1024,
      responseMimeType: 'application/json',
    },
  };
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body), signal: AbortSignal.timeout(25000), redirect: 'error',
    });
    if (!response.ok) {
      return res.status(response.status === 429 ? 429 : 502).json({ error: 'AI 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.' });
    }
    const data = z.object({ candidates: z.array(z.object({
      finishReason: z.string().optional(),
      content: z.object({ parts: z.array(z.object({ text: z.string().optional() })) }).optional(),
    })).optional() }).parse(await response.json());
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if ((candidate?.finishReason && candidate.finishReason !== 'STOP') || typeof text !== 'string') {
      return res.status(502).json({ error: 'AI 응답을 받지 못했습니다.' });
    }
    // Return only model text, never raw provider errors, credentials, or request logs.
    return res.json({ text });
  } catch {
    return res.status(502).json({ error: 'AI 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' });
  }
}
