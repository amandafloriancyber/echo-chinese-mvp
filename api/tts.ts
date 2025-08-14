// api/tts.ts — Vercel Serverless Function (Node.js runtime)
// Uses OpenAI TTS to return pleasant MP3 audio. Frontend already calls /api/tts.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, lang } = req.body as { text?: string; lang?: string };
    if (!text || !lang) return res.status(400).json({ error: 'Missing text or lang' });

    // Use OpenAI TTS (pleasant neural voice). Set OPENAI_API_KEY in Vercel.
    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: 'alloy', // you can switch voices later
        input: text,
      }),
    });

    if (!resp.ok) {
      const msg = await resp.text().catch(() => '');
      return res.status(resp.status).json({ error: `OpenAI TTS error: ${msg || resp.statusText}` });
    }

    const buf = Buffer.from(await resp.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buf);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'TTS failed' });
  }
}
