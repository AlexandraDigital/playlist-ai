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
    // Check for API key first
    if (!env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({
          songs: [],
          error:
            "GROQ_API_KEY is not set. Go to Cloudflare Pages \u2192 Settings \u2192 Environment Variables and add GROQ_API_KEY.",
        }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

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
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "Return ONLY a list of songs in this exact format: Artist - Song. No extra text.",
          },
          {
            role: "user",
            content: `Give 20 songs for: ${query}`,
          },
        ],
      }),
    });

    // Check if Groq returned a valid JSON response
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const raw = await res.text();
      return new Response(
        JSON.stringify({ songs: [], error: `Groq API returned unexpected response (status ${res.status}). Check your API key.` }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const data = await res.json();

    // Handle Groq API errors (e.g., invalid key, rate limit)
    if (!res.ok || data.error) {
      const errMsg = data.error?.message || `Groq API error (status ${res.status})`;
      return new Response(
        JSON.stringify({ songs: [], error: errMsg }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

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
