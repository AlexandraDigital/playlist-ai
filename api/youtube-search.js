// Uses public Invidious instances — no API key needed
const INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.fdn.fr',
  'https://yt.artemislena.eu',
  'https://invidious.nerdvpn.de',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  for (const instance of INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=videoId,title,author,videoThumbnails&page=1`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) continue;
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const video = data[0];
        return res.status(200).json({
          videoId: video.videoId,
          title: video.title,
          author: video.author,
          thumbnail: video.videoThumbnails?.[4]?.url || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
        });
      }
    } catch {
      continue;
    }
  }

  return res.status(404).json({ error: 'Could not find video. Try again.' });
}
