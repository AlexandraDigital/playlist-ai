export async function onRequest(context) {
  const { request, env } = context;

  const CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const type = url.searchParams.get('type') || 'track';

  if (!q) {
    return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400, headers: CORS });
  }

  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: 'Spotify credentials not configured' }),
      { status: 500, headers: CORS }
    );
  }

  try {
    // Spotify Client Credentials flow
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(8000),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: 'Failed to get Spotify token', details: tokenData }),
        { status: 500, headers: CORS }
      );
    }

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${type}&limit=3&market=US`,
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        signal: AbortSignal.timeout(8000),
      }
    );

    const data = await searchRes.json();

    if (!searchRes.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || 'Spotify search error' }),
        { status: searchRes.status, headers: CORS }
      );
    }

    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}
