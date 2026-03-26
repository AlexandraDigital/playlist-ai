// functions/search.js — YouTube search + Odesli Spotify + SoundCloud lookup

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get('q');

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const YOUTUBE_API_KEY = context.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    return new Response(JSON.stringify({ error: 'YouTube API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Step 1: Search YouTube
    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=1&key=${YOUTUBE_API_KEY}`;
    const ytRes = await fetch(ytUrl);
    const ytData = await ytRes.json();

    if (ytData.error) {
      const reason = ytData.error?.errors?.[0]?.reason || '';
      if (reason === 'quotaExceeded') {
        return new Response(JSON.stringify({ error: 'YouTube quota exceeded. Try again tomorrow or add songs manually via Spotify URL.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: ytData.error.message || 'YouTube API error' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const item = ytData.items?.[0];
    if (!item) {
      return new Response(JSON.stringify({ error: 'No results found on YouTube' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const videoId = item.id.videoId;
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const title = item.snippet.title;
    const thumbnail = item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '';

    // Step 2: Use Odesli to find Spotify + SoundCloud (free, no auth needed)
    let spotifyEmbedUrl = null;
    let soundcloudUrl = null;
    try {
      const odesliUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(youtubeUrl)}&userCountry=US`;
      const odesliRes = await fetch(odesliUrl);
      if (odesliRes.ok) {
        const odesliData = await odesliRes.json();

        // Spotify
        const spotifyTrackUrl = odesliData?.linksByPlatform?.spotify?.url;
        if (spotifyTrackUrl) {
          const match = spotifyTrackUrl.match(/track\/([a-zA-Z0-9]+)/);
          if (match) {
            spotifyEmbedUrl = `https://open.spotify.com/embed/track/${match[1]}`;
          }
        }

        // SoundCloud
        soundcloudUrl = odesliData?.linksByPlatform?.soundcloud?.url || null;
      }
    } catch (e) {
      // Odesli failed — that's okay, we still have YouTube
      console.error('Odesli lookup failed:', e.message);
    }

    return new Response(JSON.stringify({
      videoId,
      youtubeUrl,
      title,
      thumbnail,
      spotifyEmbedUrl,   // null if not found
      soundcloudUrl      // null if not found
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Search failed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
