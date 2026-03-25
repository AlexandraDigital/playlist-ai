export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const q = url.searchParams.get("q");

    if (!q) {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const key = context.env.YOUTUBE_API_KEY;

    // 🔥 improved query (more reliable results)
    const searchQuery = `${q} official audio`;

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(searchQuery)}&key=${key}`
    );

    const data = await res.json();

    // 🔴 if API fails, return empty safely
    if (!data.items) {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ items: [], error: e.message }),
      { status: 500 }
    );
  }
}
