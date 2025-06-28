// api/groq.ts  – Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { userMessage, history = [] } = req.body as {
    userMessage: string;
    history: { role: 'user' | 'assistant'; content: string }[];
  };

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content:
              'You are Anna, a warm, youth‑friendly mental‑wellness bear. Validate feelings, ask gentle follow‑ups, no medical advice.',
          },
          ...history,
          { role: 'user', content: userMessage },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    }).then((r) => r.json());

    const assistant = groqRes.choices?.[0]?.message?.content?.trim() ?? 'Bear brain glitch 🐻';
    res.status(200).json({ assistant });
  } catch (e) {
    console.error(e);
    res.status(500).json({ assistant: 'Server error, please try again later.' });
  }
}
