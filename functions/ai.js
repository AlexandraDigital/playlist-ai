export async function onRequestPost(context) {
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: "Song A\nSong B\nSong C"
          }
        }
      ]
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
