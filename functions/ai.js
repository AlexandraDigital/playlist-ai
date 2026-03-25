export async function onRequestPost(context) {
  try {
    const { query } = await context.request.json();

    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.GROQ_API_KEY}`,
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
      }
    );

    const data = await res.json();

    const text = data.choices?.[0]?.message?.content || "";

    const songs = text
      .split("\n")
      .map((line) =>
        line
          .replace(/^\d+\.\s*/, "")
          .replace(/["']/g, "")
          .trim()
      )
      .filter((line) => line.includes(" - "));

    return new Response(JSON.stringify({ songs }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ songs: [], error: e.message }),
      { status: 500 }
    );
  }
}
