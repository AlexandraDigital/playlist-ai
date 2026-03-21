export const config = { runtime: 'edge' };

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.projectsegfau.lt',
  'https://pipedapi.leptons.xyz',
  'https://piped-api.garudalinux.org',
  'https://pa.il.sable.cc',
  'https://pipedapi.reallyaweso.me',
];

function extractVideoId(url) {
  if (!url) return null;
  const m = url.match(/[?&]v=([^&]+)/) || url.match(/\/watch\?v=([^&]+)/);
  return m ? m[1] : null;
}

async function searchInstance(base, q) {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 6000);
    const r = await fetch(
      `${base}/search?q=${encodeURIComponent(q + ' audio')}&filter=videos`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: ac.signal }
    );
    clearTimeout(timer);
    if (!r.ok) return null;
    const data = await r.json();
    const items = data.items || [];
    // Prefer music/audio videos, then any video
    const video =
      items.find(i => (i.type === 'stream' || i.url?.includes('watch')) && i.duration && i.duration < 600) ||
      items.find(i => i.type === 'stream' || i.url?.includes('watch'));
    if (!video) return null;
    const videoId = extractVideoId(video.url);
    if (!videoId) return null;
    return { videoId, title: video.title || '', thumbnail: video.thumbnail || null };
  } catch {
    return null;
  }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) {
    return new Response(JSON.stringify({ error: 'q required' }), { status: 400 });
  }

  // Race all instances — fastest working one wins
  const result = await new Promise(resolve => {
    let resolved = false;
    let pending = PIPED_INSTANCES.length;
    PIPED_INSTANCES.forEach(base => {
      searchInstance(base, q).then(r => {
        pending--;
        if (r && !resolved) { resolved = true; resolve(r); }
        else if (pending === 0 && !resolved) resolve(null);
      });
    });
  });

  if (!result) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
}
