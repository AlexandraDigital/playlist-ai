export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => null);

    if (!body || !body.query) {
      return new Response(JSON.stringify({ error: "No query" }), {
        status: 400,
      });
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
            content: `Give me 10 songs for: ${body.query}`,
          },
        ],
      }),
    });

    const text = await res.text();

    return new Response(text, {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message || "Server error" }),
      { status: 500 }
    );
  }
}
