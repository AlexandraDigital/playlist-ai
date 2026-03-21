// api/stream-audio.js
// Node.js serverless function — NO edge runtime (needs streaming + 30s timeout).
//
// KEY FIX: Uses Invidious with ?local=true so audio URLs are PROXIED through
// the Invidious server — not raw YouTube CDN URLs that are IP-locked.
// Flow: Browser → Vercel → Invidious proxy → YouTube CDN  ✓

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

async function getAudioInfo(instance, videoId) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(`${instance}/api/v1/videos/${videoId}?local=true`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: ac.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return null;
    const data = await r.json();

    // Get audio-only streams, sorted by bitrate descending
    const streams = (data.adaptiveFormats || [])
      .filter(f => f.type?.startsWith('audio'))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    // Prefer m4a/AAC (itag 140) — wider browser support
    const best =
      streams.find(s => s.itag === 140) ||
      streams.find(s => s.type?.includes('mp4')) ||
      streams.find(s => s.itag === 251) ||
      streams.find(s => s.type?.includes('webm')) ||
      streams[0];

    if (!best?.url) return null;
    // Extract clean MIME type (strip codec params for the Content-Type header)
    const mimeType = best.type?.split(';')[0]?.trim() || 'audio/mp4';
    return { url: best.url, mimeType };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function resolveAudioUrl(videoId) {
  return new Promise(resolve => {
    let resolved = false;
    let pending = INVIDIOUS_INSTANCES.length;
    INVIDIOUS_INSTANCES.forEach(instance => {
      getAudioInfo(instance, videoId).then(result => {
        pending--;
        if (result && !resolved) { resolved = true; resolve(result); }
        else if (pending === 0 && !resolved) resolve(null);
      });
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: 'videoId required' });

  const result = await resolveAudioUrl(videoId);
  if (!result) {
    return res.status(503).json({ error: 'Audio unavailable — all sources failed. Please try again.' });
  }

  const { url: audioUrl, mimeType } = result;

  const upstreamHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*',
    'Accept-Encoding': 'identity', // prevent gzip so we can stream raw bytes
    'Referer': 'https://www.youtube.com/',
  };
  const range = req.headers['range'];
  if (range) upstreamHeaders['Range'] = range;

  let upstream;
  try {
    upstream = await fetch(audioUrl, { headers: upstreamHeaders });
  } catch (e) {
    return res.status(502).json({ error: `Upstream fetch failed: ${e.message}` });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return res.status(502).json({ error: `Upstream returned ${upstream.status}` });
  }

  res.status(upstream.status);
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-store');

  const cl = upstream.headers.get('content-length');
  const cr = upstream.headers.get('content-range');
  if (cl) res.setHeader('Content-Length', cl);
  if (cr) res.setHeader('Content-Range', cr);

  // Stream body chunk by chunk
  const reader = upstream.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.writableEnded) res.write(Buffer.from(value));
    }
  } catch {
    // Client disconnected — normal, just stop
  } finally {
    reader.releaseLock();
    if (!res.writableEnded) res.end();
  }
}
