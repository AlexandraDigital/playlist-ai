export async function onRequest(context) {
  const { request } = context;

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return new Response(JSON.stringify({ error: "Missing videoId" }), {
      status: 400,
    });
  }

  const instances = [
    "https://api.cobalt.tools/",
    "https://co.wuk.sh/",
  ];

  let audioUrl = null;

  for (const instance of instances) {
    try {
      const res = await fetch(instance, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          downloadMode: "audio",
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();

      if (data.url) {
        audioUrl = data.url;
        break;
      }
    } catch {}
  }

  if (!audioUrl) {
    return new Response(JSON.stringify({ error: "Download failed" }), {
      status: 500,
    });
  }

  try {
    const audioRes = await fetch(audioUrl);

    return new Response(audioRes.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
    });
  }
}
