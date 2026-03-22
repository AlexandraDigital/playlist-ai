export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { system, messages } = await request.json();

    // Build messages array with system prompt
    const allMessages = [];
    if (system) {
      allMessages.push({ role: 'system', content: system });
    }
    if (messages && Array.isArray(messages)) {
      allMessages.push(...messages);
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Groq error' }), {
        status: groqRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return in Anthropic-compatible format that the frontend expects
    const text = data.choices[0].message.content;
    return new Response(JSON.stringify({ content: [{ text }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
