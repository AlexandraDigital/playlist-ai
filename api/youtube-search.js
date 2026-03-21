// api/youtube-search.js
// Searches YouTube via Invidious public instances — much more reliable than Piped.
// Races all instances in parallel; first valid result wins.

const INVIDIOUS_INSTANCES = [
  'https://y.com.sb',
  'https://inv.riverside.rocks',
  'https://invidious.tiekoetter.com',
  'https://invidious.flokinet.to',
  'https://vid.puffyan.us',
  'https://yewtu.be',
  'https://invidious.snopyta.org',
  'https://invidious.kavin.rocks',
];

async function searchInstance(base, q) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 6000);
  try {
    const r = await fetch(
      `${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&fields=videoId,title,author,videoThumbnails,lengthSeconds`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: ac.signal,
      }
    );
    clearTimeout(timer);
    if (!r.ok) return null;
    const items = await r.json();
    if (!Array.isArray(items) || !items.length) return null;

    // Prefer tracks 1–10 min (a real song), then fallback to any
    const video =
      items.find(i => i.videoId && i.lengthSeconds > 60 && i.lengthSeconds < 600) ||
      items.find(i => i.videoId);
    if (!video?.videoId) return null;

    const thumbnail =
      video.videoThumbnails?.find(t => t.quality === 'high')?.url ||
      video.videoThumbnails?.[0]?.url ||
      `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;

    return { videoId: video.videoId, title: video.title || '', thumbnail };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.query?.q;
  if (!q) return res.status(400).json({ error: 'q required' });

  const result = await new Promise(resolve => {
    let resolved = false;
    let pending = INVIDIOUS_INSTANCES.length;
    INVIDIOUS_INSTANCES.forEach(base => {
      searchInstance(base, q + ' audio').then(r => {
        pending--;
        if (r && !resolved) { resolved = true; resolve(r); }
        else if (pending === 0 && !resolved) resolve(null);
      });
    });
  });

  if (!result) return res.status(404).json({ error: 'Not found on any source' });
  return res.status(200).json(result);
}
