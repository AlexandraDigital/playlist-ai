// Node.js serverless function — NO edge runtime (avoids 25s timeout)
// Races all Piped instances in parallel; first winner proxies audio to client

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.projectsegfau.lt',
  'https://pipedapi.leptons.xyz',
  'https://piped-api.garudalinux.org',
  'https://pa.il.sable.cc',
  'https://pipedapi.reallyaweso.me',
];

async function tryGetAudioInfo(base, videoId) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 7000);
  try {
    const r = await fetch(`${base}/streams/${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: ac.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return null;
    const data = await r.json();
    const streams = (data.audioStreams || []).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    const best =
      streams.find(s => s.mimeType?.includes('mp4')) ||
      streams.find(s => s.mimeType?.includes('webm')) ||
      streams[0];
    return best?.url ? { url: best.url, mimeType: best.mimeType || 'audio/mp4' } : null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function getAudioUrl(videoId) {
  // Race all instances — fastest working one wins
  return new Promise(resolve => {
    let resolved = false;
    let pending = PIPED_INSTANCES.length;
    PIPED_INSTANCES.forEach(base => {
      tryGetAudioInfo(base, videoId).then(result => {
        pending--;
        if (result && !resolved) {
          resolved = true;
          resolve(result);
        } else if (pending === 0 && !resolved) {
          resolve(null);
        }
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

  const result = await getAudioUrl(videoId);
  if (!result) {
    return res.status(503).json({ error: 'Audio unavailable — all sources failed. Try again in a moment.' });
  }

  const { url: audioUrl, mimeType } = result;
  const upstreamHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': '*/*',
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
    return res.status(502).json({ error: `Upstream error ${upstream.status}` });
  }

  res.status(upstream.status);
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-store');

  const cl = upstream.headers.get('content-length');
  const cr = upstream.headers.get('content-range');
  if (cl) res.setHeader('Content-Length', cl);
  if (cr) res.setHeader('Content-Range', cr);

  // Stream body to client chunk by chunk
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
