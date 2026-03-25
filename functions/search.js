export async function onRequestGet({ url, env }) {
  const q = url.searchParams.get("q");
  if (!q) return new Response(JSON.stringify({ items: [] }));

  try {
    // 🔴 1. Try YouTube first
    let ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&key=${env.YOUTUBE_API_KEY}&maxResults=1`
    );
    let ytData = await ytRes.json();
    let vid = ytData.items?.[0];

    if (vid?.id?.videoId) {
      return new Response(JSON.stringify({ items: [vid] }));
    }

    // 🟢 2. Get Spotify token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    if (!token) {
      return new Response(JSON.stringify({ items: [] }));
    }

    // 🟢 3. Search Spotify
    const spRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const spData = await spRes.json();
    const track = spData.tracks?.items?.[0];

    if (!track) {
      return new Response(JSON.stringify({ items: [] }));
    }

    // 🔁 4. Retry YouTube with better query
    const retryQuery = `${track.name} ${track.artists[0].name}`;

    const retryRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(retryQuery)}&key=${env.YT_API_KEY}&maxResults=1`
    );

    const retryData = await retryRes.json();

    return new Response(JSON.stringify({ items: retryData.items || [] }));
  } catch (e) {
    return new Response(
      JSON.stringify({ items: [], error: e.message }),
      { status: 500 }
    );
  }
}
