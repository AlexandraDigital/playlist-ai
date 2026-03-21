// api/search.js
// Groq-powered song search.
// Takes any search query (song name, artist, partial lyrics, description)
// and uses Groq LLM to identify the best matching songs with clean metadata.
// Returns { tracks: [{ title, artist }] }
// The frontend then calls /api/youtube-search to get videoIds.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.query?.q;
  if (!q) return res.status(400).json({ error: 'q required' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a music search assistant with encyclopedic knowledge of all songs. When given any query — a song name, artist name, partial lyrics, description, or mood — identify the best matching real songs and return ONLY a valid JSON array. Each object must have exactly two fields: "title" (the exact song title) and "artist" (the exact artist name). Return between 1 and 6 results ordered by relevance. Output ONLY the raw JSON array, no markdown, no explanation.
Example: [{"title":"Bohemian Rhapsody","artist":"Queen"},{"title":"We Are the Champions","artist":"Queen"}]`,
          },
          {
            role: 'user',
            content: q,
          },
        ],
        max_tokens: 400,
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Groq API error' });
    }

    const content = data.choices?.[0]?.message?.content?.trim() || '[]';
    // Safely extract JSON array even if model wraps it in markdown
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let tracks = [];
    if (jsonMatch) {
      try { tracks = JSON.parse(jsonMatch[0]); } catch { tracks = []; }
    }

    return res.status(200).json({ tracks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
