export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const query = body?.query || "music";

    if (!context.env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY" }), { status: 500 });
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
            content: `Give EXACTLY 10 songs in this format:
Artist - Song
No numbering
No extra text
No explanation
Vibe: ${query}`,
          },
        ],
      }),
    });

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";

    const songs = content
      .split("\n")
      .map(s =>
        s
          .replace(/^\d+\.\s*/, "")
          .replace(/["“”]/g, "")
          .replace(/\s*[-–—:]\s*/, " - ")
          .trim()
      )
      .filter(s => s.includes(" - "))
      .slice(0, 10);

    return new Response(JSON.stringify({ songs }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
