import { useState, useRef, useEffect } from "react";

// IndexedDB
const openDB = () =>
  new Promise((resolve) => {
    const req = indexedDB.open("musicDB", 1);

    req.onupgradeneeded = () => {
      req.result.createObjectStore("playlists", { keyPath: "id" });
    };

    req.onsuccess = () => resolve(req.result);
  });

export default function App() {
  const [query, setQuery] = useState("");
  const [playlist, setPlaylist] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [current, setCurrent] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef(null);

  /* ---------- LOAD PLAYLISTS ---------- */
  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    const db = await openDB();
    const tx = db.transaction("playlists", "readonly");
    const store = tx.objectStore("playlists");
    const req = store.getAll();

    req.onsuccess = () => {
      setPlaylists(req.result || []);
    };
  };

  const savePlaylist = async (name, songs) => {
    const db = await openDB();
    const tx = db.transaction("playlists", "readwrite");
    const store = tx.objectStore("playlists");

    store.put({
      id: Date.now(),
      name,
      songs,
    });

    loadPlaylists();
  };

  /* ---------- PLAYER ---------- */
  const play = (track, index) => {
    if (!track.url) return alert("No audio source");

    if (audioRef.current) audioRef.current.pause();

    const audio = new Audio(track.url);
    audioRef.current = audio;

    setCurrent(index);

    audio.ontimeupdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    audio.onended = next;

    audio.play();
  };

  const next = () => {
    if (playlist.length === 0) return;
    const nextIndex = (current + 1) % playlist.length;
    play(playlist[nextIndex], nextIndex);
  };

  const prev = () => {
    if (playlist.length === 0) return;
    const prevIndex =
      (current - 1 + playlist.length) % playlist.length;
    play(playlist[prevIndex], prevIndex);
  };

  /* ---------- FAVORITES ---------- */
  const toggleFavorite = (track) => {
    setFavorites((prev) =>
      prev.find((t) => t.id === track.id)
        ? prev.filter((t) => t.id !== track.id)
        : [...prev, track]
    );
  };

  /* ---------- UPLOAD ---------- */
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const track = {
      id: Date.now(),
      title: file.name,
      url: URL.createObjectURL(file),
    };

    setPlaylist((prev) => [track, ...prev]);
  };

  /* ---------- YOUTUBE SEARCH ---------- */
  const searchSong = async (q) => {
    try {
      const r = await fetch(`/search?q=${encodeURIComponent(q)}`);
      const d = await r.json();

      if (d.items && d.items.length > 0) {
        const vid = d.items[0];

        const track = {
          id: vid.id.videoId,
          title: vid.snippet.title,
          thumbnail: vid.snippet.thumbnails.medium.url,
          videoId: vid.id.videoId,
          url: `https://www.youtube.com/watch?v=${vid.id.videoId}`,
        };

        setPlaylist((prev) => [track, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  /* ---------- AI GENERATE ---------- */
  const generateAI = async () => {
    if (!query.trim()) return;

    try {
      const res = await fetch("/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";

      const songs = text.split("\n").filter(Boolean);

      let results = [];

      for (let song of songs.slice(0, 8)) {
        const r = await fetch(`/search?q=${encodeURIComponent(song)}`);
        const d = await r.json();

        if (d.items && d.items.length > 0) {
          const vid = d.items[0];

          results.push({
            id: vid.id.videoId,
            title: vid.snippet.title,
            thumbnail: vid.snippet.thumbnails.medium.url,
            videoId: vid.id.videoId,
            url: `https://www.youtube.com/watch?v=${vid.id.videoId}`,
          });
        }
      }

      setPlaylist(results);
      savePlaylist(query, results);
    } catch (e) {
      console.error(e);
      alert("AI failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white flex flex-col items-center p-6">

      {/* TITLE */}
      <h1 className="text-4xl font-bold mb-6 text-purple-400">
        🎧 Playlist AI
      </h1>

      {/* VIBE INPUT */}
      <div className="w-full max-w-md flex gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              generateAI();
            }
          }}
          placeholder="Type a vibe..."
          className="flex-1 p-3 rounded-xl bg-zinc-800"
        />

        <button
          onClick={generateAI}
          disabled={!query.trim()}
          className={`px-4 rounded-xl ${
            query.trim()
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-zinc-600 cursor-not-allowed"
          }`}
        >
          AI
        </button>
      </div>

      {/* SEARCH SONG */}
      <input
        placeholder="Search & add song..."
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target.value.trim()) {
            searchSong(e.target.value);
            e.target.value = "";
          }
        }}
        className="w-full max-w-md p-3 rounded-xl bg-zinc-800 mb-6"
      />

      {/* UPLOAD */}
      <label className="mb-6 cursor-pointer bg-purple-600 px-4 py-2 rounded-xl">
        Upload Music 🎵
        <input
          type="file"
          accept="audio/*"
          onChange={handleUpload}
          className="hidden"
        />
      </label>

      {/* PLAYER */}
      {current !== null && (
        <div className="w-full max-w-md mb-6">
          <div className="h-2 bg-zinc-700 rounded">
            <div
              className="h-2 bg-purple-500 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between mt-3">
            <button onClick={prev}>⏮️</button>
            <button onClick={next}>⏭️</button>
          </div>
        </div>
      )}

      {/* PLAYLIST */}
      <div className="w-full max-w-md flex flex-col gap-3">
        {playlist.length === 0 && (
          <div className="text-zinc-400 text-center">
            No songs yet 🎧
          </div>
        )}

        {playlist.map((t, i) => (
          <div
            key={t.id}
            className="bg-zinc-900 p-4 rounded-xl flex items-center gap-3 justify-between"
          >
            <div className="flex items-center gap-3 flex-1">
              {t.thumbnail && (
                <img src={t.thumbnail} className="w-12 h-12 rounded" />
              )}
              <span className="truncate">{t.title}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => play(t, i)}>▶</button>
              <button onClick={() => toggleFavorite(t)}>
                {favorites.find((f) => f.id === t.id) ? "❤️" : "🤍"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SAVED PLAYLISTS */}
      <div className="mt-10 w-full max-w-md">
        <h2 className="text-purple-300 mb-2">Your Playlists</h2>

        {playlists.map((p) => (
          <div
            key={p.id}
            className="bg-zinc-800 p-3 rounded mb-2 cursor-pointer"
            onClick={() => setPlaylist(p.songs)}
          >
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}
