const https = require("https");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { messages, system } = req.body;

  // Build OpenAI-compatible messages array, prepending system prompt
  const groqMessages = [
    { role: "system", content: system || "You are a helpful music playlist curator." },
    ...messages,
  ];

  const body = JSON.stringify({
    model: "llama3-70b-8192",
    max_tokens: 1000,
    messages: groqMessages,
  });

  const options = {
    hostname: "api.groq.com",
    path: "/openai/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
  };

  return new Promise((resolve) => {
    const apiReq = https.request(options, (apiRes) => {
      let data = "";
      apiRes.on("data", (chunk) => (data += chunk));
      apiRes.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          // Convert Groq response to Anthropic-like shape so App.jsx needs no changes
          const text = parsed.choices?.[0]?.message?.content || "";
          res.status(apiRes.statusCode).json({ content: [{ type: "text", text }] });
        } catch (e) {
          res.status(500).json({ error: "Failed to parse Groq response" });
        }
        resolve();
      });
    });
    apiReq.on("error", (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });
    apiReq.write(body);
    apiReq.end();
  });
};
