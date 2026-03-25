export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams.get("q");
  if (!q) return new Response(JSON.stringify({ items: [] }), { headers: { "Content-Type": "application/json" } });

  try {
    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&key=${env.YOUTUBE_API_KEY}&maxResults=1`
    );
    const ytData = await ytRes.json();
    return new Response(JSON.stringify({ items: ytData.items || [] }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(
      JSON.stringify({ items: [], error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
