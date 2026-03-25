export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const q = url.searchParams.get("q");

  const key = context.env.YOUTUBE_API_KEY_1;

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(q)}&key=${key}`
  );

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
