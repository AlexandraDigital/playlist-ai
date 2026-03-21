export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const apiKey = process.env.VITE_GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ content: [{ type: "text", text: "Missing VITE_GROQ_API_KEY" }] });

  const { messages, system } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        max_tokens: 1000,
        messages: [
          { role: "system", content: system || "You are a music playlist curator." },
          ...(messages || []),
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || data.error?.message || "No response";
    res.status(200).json({ content: [{ type: "text", text }] });
  } catch (e) {
    res.status(500).json({ content: [{ type: "text", text: "Error: " + e.message }] });
  }
}
