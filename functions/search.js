const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams.get("q");

  if (!q) {
    return new Response(JSON.stringify({ items: [] }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!env.YOUTUBE_API_KEY) {
    return new Response(
      JSON.stringify({
        items: [],
        error:
          "YOUTUBE_API_KEY is not set. Go to Cloudflare Pages → Settings → Environment Variables and add YOUTUBE_API_KEY.",
      }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&key=${env.YOUTUBE_API_KEY}&maxResults=1`
    );
    const ytData = await ytRes.json();

    if (!ytRes.ok || ytData.error) {
      const errMsg =
        ytData.error?.message || `YouTube API error (status ${ytRes.status})`;
      return new Response(
        JSON.stringify({ items: [], error: errMsg }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ items: ytData.items || [] }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ items: [], error: e.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
