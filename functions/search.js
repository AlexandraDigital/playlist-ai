export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const q = url.searchParams.get("q");

    if (!q) {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(
        q
      )}&key=${context.env.YOUTUBE_API_KEY}`
    );

    const data = await res.json();

    // ✅ filter ONLY valid videos
    const validItems =
      data.items?.filter((item) => item.id?.videoId) || [];

    return new Response(JSON.stringify({ items: validItems }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ items: [], error: e.message }), {
      status: 500,
    });
  }
}
