export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const q = url.searchParams.get("q");

    if (!q) {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          btoa(
            context.env.SPOTIFY_CLIENT_ID +
              ":" +
              context.env.SPOTIFY_CLIENT_SECRET
          ),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    if (!token) {
      return new Response(
        JSON.stringify({
          items: [],
          error: "Spotify token failed",
          raw: tokenData,
        }),
        { status: 500 }
      );
    }

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=3`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    const items =
      data.tracks?.items.map((t) => ({
        artist: t.artists[0].name,
        title: t.name,
        spotifyId: t.id,
        // Do NOT append "official audio" here — search.js already adds it
        query: `${t.artists[0].name} ${t.name}`,
      })) || [];

    return new Response(JSON.stringify({ items }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ items: [], error: e.message }),
      { status: 500 }
    );
  }
}
