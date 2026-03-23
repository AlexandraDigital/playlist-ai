export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q');

  const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  if (!q) {
    return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400, headers: CORS });
  }

  // ── Helper: extract video ID from a Piped /watch?v=... url ──
  const vidFromPipedUrl = (u) => {
    try { return new URL('https://x' + u).searchParams.get('v'); } catch { return null; }
  };

  // ── 1. Try Piped API instances (maintained, CF-friendly) ────
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://api.piped.yt',
    'https://piped-api.garudalinux.org',
  ];

  const tryPiped = async (base) => {
    const res = await fetch(
      `${base}/search?q=${encodeURIComponent(q)}&filter=music_songs`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const streams = (data.items || []).filter((i) => i.type === 'stream').slice(0, 3);
    if (!streams.length) throw new Error('No results');
    return streams.map((v) => {
      const videoId = vidFromPipedUrl(v.url);
      return {
        id: { videoId },
        snippet: {
          title: v.title,
          channelTitle: v.uploaderName || '',
          thumbnails: {
            medium: { url: videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : (v.thumbnail || '') },
          },
        },
      };
    }).filter((i) => i.id.videoId);
  };

  try {
    const items = await Promise.any(pipedInstances.map(tryPiped));
    if (items.length) {
      return new Response(JSON.stringify({ items }), { status: 200, headers: CORS });
    }
  } catch { /* fall through */ }

  // ── 2. Try Invidious instances as secondary ──────────────────
  const invidiousInstances = [
    'https://inv.nadeko.net',
    'https://invidious.fdn.fr',
    'https://invidious.privacyredirect.com',
    'https://invidious.nerdvpn.de',
    'https://iv.melmac.space',
    'https://yt.artemislena.eu',
  ];

  const tryInvidious = async (base) => {
    const res = await fetch(
      `${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&fields=videoId,title,author,videoThumbnails`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error('No results');
    return data.slice(0, 3).map((v) => ({
      id: { videoId: v.videoId },
      snippet: {
        title: v.title,
        channelTitle: v.author,
        thumbnails: { medium: { url: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg` } },
      },
    }));
  };

  try {
    const items = await Promise.any(invidiousInstances.map(tryInvidious));
    if (items.length) {
      return new Response(JSON.stringify({ items }), { status: 200, headers: CORS });
    }
  } catch { /* fall through */ }

  // ── 3. Official YouTube Data API v3 fallback ─────────────────
  const apiKey = env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(q)}&key=${apiKey}`;
      const res = await fetch(ytUrl, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: 200, headers: CORS });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
    }
  }

  return new Response(JSON.stringify({ items: [] }), { status: 200, headers: CORS });
}
