const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequest({ request, env }) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    // Get user input
    const { query } = await request.json();

    if (!query) {
      return new Response(JSON.stringify({ songs: [], error: "No query provided" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Call Groq AI
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "Return ONLY a list of songs in this exact format: Artist - Song. No extra text.",
          },
          {
            role: "user",
            content: `Give 10 songs for: ${query}`,
          },
        ],
      }),
    });

    const data = await res.json();

    // Extract text safely
    const text = data?.choices?.[0]?.message?.content || "";

    // Clean + format songs
    const songs = text
      .split("\n")
      .map((line) =>
        line
          .replace(/^\d+\.\s*/, "") // remove numbering
          .replace(/["']/g, "") // remove quotes
          .trim()
      )
      .filter((line) => line.includes(" - ")); // ensure correct format

    return new Response(JSON.stringify({ songs }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        songs: [],
        error: e.message || "AI error",
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
}
