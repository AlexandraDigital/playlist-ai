export const config = { runtime: 'edge' };

const INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.projectsegfau.lt',
  'https://pipedapi.leptons.xyz',
  'https://pa.il.sable.cc',
  'https://piped-api.garudalinux.org',
];

async function getAudioUrl(videoId) {
  for (const base of INSTANCES) {
    try {
      const r = await fetch(`${base}/streams/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) continue;
      const data = await r.json();
      const streams = (data.audioStreams || []).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      // Prefer mp4/m4a, fall back to anything
      const best =
        streams.find(s => s.mimeType?.includes('mp4')) ||
        streams.find(s => s.mimeType?.includes('webm')) ||
        streams[0];
      if (best?.url) return { url: best.url, mimeType: best.mimeType || 'audio/mp4' };
    } catch { /* try next */ }
  }
  return null;
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return new Response(JSON.stringify({ error: 'videoId required' }), { status: 400 });
  }

  const result = await getAudioUrl(videoId);
  if (!result) {
    return new Response(JSON.stringify({ error: 'No stream available from any Piped instance' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { url: audioUrl, mimeType } = result;

  // Forward Range header for seeking support
  const reqHeaders = { 'User-Agent': 'Mozilla/5.0' };
  const range = req.headers.get('range');
  if (range) reqHeaders['Range'] = range;

  let upstream;
  try {
    upstream = await fetch(audioUrl, { headers: reqHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: `Upstream fetch failed: ${e.message}` }), { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(JSON.stringify({ error: `Upstream error ${upstream.status}` }), { status: 502 });
  }

  const resHeaders = {
    'Content-Type': mimeType,
    'Access-Control-Allow-Origin': '*',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  };

  const cl = upstream.headers.get('content-length');
  const cr = upstream.headers.get('content-range');
  if (cl) resHeaders['Content-Length'] = cl;
  if (cr) resHeaders['Content-Range'] = cr;

  return new Response(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}
