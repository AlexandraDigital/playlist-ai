import { useState, useRef } from "react";

export default function App() {
  const [vibe, setVibe] = useState("");
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);

  /* ---------- PLAYER ---------- */
  const play = (track) => {
    if (!track.url) return alert("No playable audio");

    if (audioRef.current) audioRef.current.pause();

    const audio = new Audio(track.url);
    audioRef.current = audio;
    audio.play();
  };

  /* ---------- SEARCH (Artist + Song) ---------- */
  const searchSong = async () => {
    if (!artist && !song) return;

    const query = `${artist} ${song}`;

    try {
      const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      const vid = data?.items?.[0];

      if (!vid) return alert("No results");

      const track = {
        title: vid.snippet.title,
        thumbnail: vid.snippet.thumbnails.medium.url,
        url: `https://www.youtube.com/watch?v=${vid.id.videoId}`,
      };

      setPlaylist((prev) => [track, ...prev]);
      setArtist("");
      setSong("");
    } catch (e) {
      console.error(e);
      alert("Search failed");
    }
  };

  /* ---------- AI ---------- */
const generateAI = async () => {
  try {
    setLoading(true);

    const res = await fetch("/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: vibe }),
    });

    // 🔥 read as text
    const text = await res.text();
    console.log("AI RAW:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      alert("AI returned invalid response");
      return;
    }

    // ✅ DEFINE CONTENT FIRST
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      alert("AI gave no content");
      return;
    }

    console.log("AI CONTENT:", content);

    // ✅ NOW parse
    const songs = content.split("\n");

    const cleaned = songs
      .map((s) => s.replace(/^\d+\.\s*/, "").trim())
      .filter((s) => s.includes(" - "));

    const results = cleaned.map((s) => {
      const [artist, title] = s.split(" - ");
      return {
        artist: artist?.trim(),
        title: title?.trim(),
      };
    });

    // ✅ search youtube
    let finalSongs = [];

    for (let song of results.slice(0, 10)) {
      try {
        const r = await fetch(
          `/search?q=${encodeURIComponent(song.artist + " " + song.title)}`
        );
        const d = await r.json();

        if (d.items?.length) {
          finalSongs.push({
            title: d.items[0].snippet.title,
            videoId: d.items[0].id.videoId,
            thumbnail: d.items[0].snippet.thumbnails.medium.url,
          });
        }
      } catch {}
    }

    // ✅ DEBUG CHECK
    if (finalSongs.length === 0) {
      console.log("AI CONTENT RAW:", content);
      alert("No songs found from search API");
      return;
    }

    setPlaylist(finalSongs);

  } catch (e) {
    console.error(e);
    alert("AI failed");
  }

  setLoading(false);
};
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">

      <h1 className="text-4xl mb-6 text-purple-400">🎧 Playlist AI</h1>

      {/* VIBE INPUT */}
      <div className="flex gap-2 mb-4 w-full max-w-md">
        <input
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generateAI()}
          placeholder="Type a vibe..."
          className="flex-1 p-3 rounded bg-zinc-800"
        />
        <button
          onClick={generateAI}
          className="bg-purple-600 px-4 rounded"
        >
          AI
        </button>
      </div>

      {/* ARTIST + SONG */}
      <div className="flex gap-2 mb-6 w-full max-w-md">
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist"
          className="flex-1 p-3 rounded bg-zinc-800"
        />
        <input
          value={song}
          onChange={(e) => setSong(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchSong()}
          placeholder="Song"
          className="flex-1 p-3 rounded bg-zinc-800"
        />
      </div>

      {loading && <p className="mb-4">Loading AI...</p>}

      {/* PLAYLIST */}
      <div className="w-full max-w-md flex flex-col gap-3">
        {playlist.length === 0 && (
          <p className="text-zinc-400 text-center">No songs yet</p>
        )}

        {playlist.map((t, i) => (
          <div
            key={i}
            className="bg-zinc-900 p-3 rounded flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <img src={t.thumbnail} className="w-12 h-12 rounded" />
              <span>{t.title}</span>
            </div>

            <button onClick={() => play(t)}>▶</button>
          </div>
        ))}
      </div>

    </div>
  );
}
