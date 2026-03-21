export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { songs, context } = req.body;
    if (!songs || !songs.length) return res.status(400).json({ error: 'No songs provided' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

    const songList = songs.map((s, i) => `${i + 1}. ${s.title} - ${s.artist}`).join('\n');
    const situationNote = context
      ? `The user's situation: "${context}"`
      : 'General offline listening (no specific situation given).';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a music advisor AI. Given a playlist and the user's offline listening situation, pick the best songs to prioritize for offline download. Consider replay value, mood fit, and variety. Return ONLY a valid JSON array — no markdown, no extra text — like this:
[{"title":"Song Title","artist":"Artist Name","reason":"One sentence why this is a great offline pick"}]
Pick between 5 and 10 songs. Use exact titles and artists from the list provided.`,
          },
          {
            role: 'user',
            content: `${situationNote}\n\nMy playlist:\n${songList}\n\nWhich songs should I download for offline listening?`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Groq API error' });
    }

    const raw = data.choices?.[0]?.message?.content || '[]';
    let suggestions = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) suggestions = JSON.parse(match[0]);
    } catch {
      suggestions = [];
    }

    return res.status(200).json({ suggestions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
