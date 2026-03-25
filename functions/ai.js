export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const query = body?.query || "music";

    if (!context.env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY" }), {
        status: 500,
      });
    }

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
                "You only output clean song lists. No remixes, no live versions, no special editions, no extra text.",
            },
            {
              role: "user",
              content: `Give 10 songs for this vibe: ${query}.
Format EXACTLY:
Artist - Song
No numbering. No extra text.`,
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
      });
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";

    const songs = content
      .split("\n")
      .map((line) =>
        line
          .replace(/^\d+\.\s*/, "")
          .replace(/["“”]/g, "")
          .replace(/\(.*?\)/g, "") // 🔥 remove remix/feat/etc
          .replace(/\s*[-–—:]\s*/, " - ")
          .trim()
      )
      .filter((line) => line.includes(" - "))
      .slice(0, 10);

    return new Response(JSON.stringify({ songs }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
    });
  }
}
