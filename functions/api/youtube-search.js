export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q');

  if (!q) {
    return new Response(JSON.stringify({ error: 'Missing query' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Try Invidious instances first — free, no API key, no quota limits
  const invidiousInstances = [
    'https://inv.nadeko.net',
    'https://invidious.fdn.fr',
    'https://invidious.nerdvpn.de',
    'https://iv.melmac.space',
  ];

  for (const instance of invidiousInstances) {
    try {
      const ivUrl = `${instance}/api/v1/search?q=${encodeURIComponent(q)}&type=video&fields=videoId,title,author,videoThumbnails,lengthSeconds`;
      const response = await fetch(ivUrl, { signal: AbortSignal.timeout(6000) });
      if (!response.ok) continue;
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) continue;

      // Convert Invidious format → YouTube API format (same shape the client expects)
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

      return new Response(JSON.stringify({ items }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch {
      continue; // try next instance
    }
  }

  // Fallback: YouTube Data API v3 (needs YOUTUBE_API_KEY but has quota limits)
  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(q)}&key=${apiKey}`;
    const response = await fetch(ytUrl);
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
