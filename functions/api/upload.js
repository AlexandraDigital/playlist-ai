export async function onRequest(context) {
  const formData = await context.request.formData();
  const file = formData.get("file");

  if (!file) {
    return new Response("No file", { status: 400 });
  }

  // 🔥 Replace this with R2 / storage later
  return new Response("Uploaded (placeholder)");
}
