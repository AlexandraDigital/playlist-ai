export async function onRequestPost() {
  return new Response(
    JSON.stringify({ ok: true, message: "AI working" }),
    { headers: { "Content-Type": "application/json" } }
  );
}
