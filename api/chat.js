const https = require("https");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const apiKey = process.env.VITE_GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ content: [{ type: "text", text: "Missing VITE_GROQ_API_KEY in Vercel env vars" }] });

  const { messages, system } = req.body;

  const body = JSON.stringify({
    model: "llama3-70b-8192",
    max_tokens: 1000,
    messages: [
      { role: "system", content: system || "You are a music playlist curator." },
      ...(messages || []),
    ],
  });

  const options = {
    hostname: "api.groq.com",
    path: "/openai/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
      "Authorization": `Bearer ${apiKey}`,
    },
  };

  return new Promise((resolve) => {
    const apiReq = https.request(options, (apiRes) => {
      let data = "";
      apiRes.on("data", chunk => data += chunk);
      apiRes.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.message?.content || parsed.error?.message || "No response";
          res.status(200).json({ content: [{ type: "text", text }] });
        } catch (e) {
          res.status(500).json({ content: [{ type: "text", text: "Parse error: " + e.message }] });
        }
        resolve();
      });
    });
    apiReq.on("error", e => {
      res.status(500).json({ content: [{ type: "text", text: "Network error: " + e.message }] });
      resolve();
    });
    apiReq.write(body);
    apiReq.end();
  });
};
