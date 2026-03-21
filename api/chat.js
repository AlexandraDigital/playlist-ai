import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.VITE_GROQ_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!process.env.VITE_GROQ_API_KEY) {
    return res.status(500).json({ error: 'Missing VITE_GROQ_API_KEY' });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    return res.status(200).json(completion.choices[0].message);
  } catch (error) {
    console.error('Groq API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
