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
    if (!vibe.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: vibe }),
      });

      const data = await res.json();

      const text = data?.choices?.[0]?.message?.content || "";
      const songs = text.split("\n").filter(Boolean);

      let results = [];

      for (let s of songs.slice(0, 8)) {
        const r = await fetch(`/search?q=${encodeURIComponent(s)}`);
        const d = await r.json();

        const vid = d?.items?.[0];
        if (!vid) continue;

        results.push({
          title: vid.snippet.title,
          thumbnail: vid.snippet.thumbnails.medium.url,
          url: `https://www.youtube.com/watch?v=${vid.id.videoId}`,
        });
      }

      setPlaylist(results);
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
