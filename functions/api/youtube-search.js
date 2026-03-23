export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q');

  const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  if (!q) {
    return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400, headers: CORS });
  }

  // Race all Invidious instances in PARALLEL — first valid response wins
  const invidiousInstances = [
    'https://inv.nadeko.net',
    'https://invidious.fdn.fr',
    'https://invidious.nerdvpn.de',
    'https://iv.melmac.space',
  ];

  const tryInstance = async (instance) => {
    const ivUrl = `${instance}/api/v1/search?q=${encodeURIComponent(q)}&type=video&fields=videoId,title,author,videoThumbnails,lengthSeconds`;
    const response = await fetch(ivUrl, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('No results');

    const items = data.slice(0, 3).map((v) => ({
      id: { videoId: v.videoId },
      snippet: {
        title: v.title,
        channelTitle: v.author,
        thumbnails: {
          medium: { url: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg` },
        },
      },
    }));
    return items;
  };

  try {
    // Promise.any resolves as soon as the first instance succeeds
    const items = await Promise.any(invidiousInstances.map(tryInstance));
    return new Response(JSON.stringify({ items }), { status: 200, headers: CORS });
  } catch {
    // All Invidious instances failed — fall back to YouTube Data API v3
  }

  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ items: [] }), { status: 200, headers: CORS });
  }

  try {
    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(q)}&key=${apiKey}`;
    const response = await fetch(ytUrl, { signal: AbortSignal.timeout(8000) });
    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200, headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}
