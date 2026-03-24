export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get("q");

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${context.env.YOUTUBE_API_KEY}`
  );

  const data = await res.json();
  const item = data.items?.[0];

  if (!item) {
    return new Response(JSON.stringify(null));
  }

  return new Response(
    JSON.stringify({
      title: item.snippet.title,
      videoId: item.id.videoId,
      thumbnail: item.snippet.thumbnails.default.url,
    })
  );
}
