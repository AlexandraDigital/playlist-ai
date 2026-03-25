const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestGet({ request, env }) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return new Response(JSON.stringify({ error: "Missing query" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
    return new Response(
      JSON.stringify({
        error:
          "SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is not set. Go to Cloudflare Pages → Settings → Environment Variables and add both.",
      }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    // 🔐 Get Spotify token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          btoa(env.SPOTIFY_CLIENT_ID + ":" + env.SPOTIFY_CLIENT_SECRET),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      return new Response(
        JSON.stringify({
          error:
            tokenData.error_description ||
            "Failed to get Spotify access token. Check your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.",
        }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenData.access_token;

    // 🔍 Search track
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await searchRes.json();

    if (!searchRes.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || `Spotify search failed (status ${searchRes.status})` }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const track = data.tracks?.items?.[0];

    if (!track) {
      return new Response(JSON.stringify({ track: null }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        track: {
          title: `${track.name} - ${track.artists[0].name}`,
          embedUrl: `https://open.spotify.com/embed/track/${track.id}`,
        },
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
