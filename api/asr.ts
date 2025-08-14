// api/asr.ts — Vercel Serverless Function
// Receives { audioBase64, mime, lang } and returns { text } using OpenAI transcription.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { audioBase64, mime, lang } = req.body as {
      audioBase64?: string; // data without the "data:mime;base64," prefix
      mime?: string;        // e.g. "audio/webm" | "audio/mp4" | "audio/mpeg"
      lang?: string;        // BCP-47 like "zh-CN", "es-ES", ...
    };
    if (!audioBase64 || !mime) {
      return res.status(400).json({ error: 'Missing audioBase64 or mime' });
    }

    // Decode base64 to a Buffer
    const buffer = Buffer.from(audioBase64, 'base64');

    // Build multipart form for OpenAI Whisper (or newer transcribe model)
    const form = new FormData();
    // filename extension helps OpenAI route the decoder correctly
    const ext = mime.includes('webm') ? 'webm' : mime.includes('mp4') ? 'mp4' : mime.includes('mpeg') ? 'mp3' : 'wav';
    form.append('file', new Blob([buffer], { type: mime }), `echo.${ext}`);
    form.append('model', 'whisper-1'); // or 'gpt-4o-mini-transcribe' if enabled on your account
    if (lang) form.append('language', lang);

    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY!}` },
      body: form as any,
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => '');
      return res.status(resp.status).json({ error: `ASR error: ${err || resp.statusText}` });
    }

    const data = await resp.json();
    // OpenAI returns { text: "..." }
    res.json({ text: data.text || '' });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'ASR failed' });
  }
}
