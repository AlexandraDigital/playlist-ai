export async function onRequest(context) {
  // Handle CORS preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const { searchParams } = new URL(context.request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return new Response(JSON.stringify({ error: "Missing videoId" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const res = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: ytUrl,
        downloadMode: "audio",
        audioFormat: "mp3",
        filenameStyle: "basic",
      }),
    });

    const data = await res.json();

    if (data.url && (data.status === "tunnel" || data.status === "redirect" || data.status === "stream")) {
      return new Response(JSON.stringify({ url: data.url }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } else {
      return new Response(
        JSON.stringify({ error: data.error?.code || "Download not available", raw: data }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}
