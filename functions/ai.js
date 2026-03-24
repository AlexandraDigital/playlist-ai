export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const query = body?.query || "music";

    if (!context.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing GROQ_API_KEY" }),
        { status: 500 }
      );
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `Give me 8 songs (artist - title) for this vibe: ${query}`,
          },
        ],
      }),
    });

    const text = await res.text(); // 🔥 don't parse yet

    return new Response(text, {
      headers: { "Content-Type": "application/json" },
      status: res.status,
    });

  } catch (e) {
    return new Response(
      JSON.stringify({
        error: e.message,
        stack: e.stack,
      }),
      { status: 500 }
    );
  }
}
