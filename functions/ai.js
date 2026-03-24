export async function onRequestPost(context) {
  const { request } = context;
  const body = await request.json();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${context.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Give me 10 songs for this vibe: ${body.query}. Only respond as a list like:
Artist - Song`
        }
      ]
    })
  });

  const data = await res.json();
  return new Response(JSON.stringify(data));
}
