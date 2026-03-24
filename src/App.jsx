import { useState, useRef, useEffect } from "react";

/* ---------- IndexedDB ---------- */
const openDB = () =>
  new Promise((resolve) => {
    const req = indexedDB.open("musicDB", 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore("playlists", { keyPath: "id" });
    };

    req.onsuccess = () => resolve(req.result);
  });

/* ---------- APP ---------- */
export default function App() {
  const [query, setQuery] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);

  const currentPlaylist = playlists[currentIndex]?.songs || [];

  /* ---------- LOAD FROM DB ---------- */
  useEffect(() => {
    (async () => {
      const db = await openDB();
      const tx = db.transaction("playlists", "readonly");
      const store = tx.objectStore("playlists");

      const req = store.getAll();
      req.onsuccess = () => {
        if (req.result.length) setPlaylists(req.result);
      };
    })();
  }, []);

  /* ---------- SAVE TO DB ---------- */
  useEffect(() => {
    (async () => {
      const db = await openDB();
      const tx = db.transaction("playlists", "readwrite");
      const store = tx.objectStore("playlists");

      playlists.forEach((p) => store.put(p));
    })();
  }, [playlists]);

  /* ---------- PLAY ---------- */
  const play = (track) => {
    if (audioRef.current) audioRef.current.pause();

    if (track.file) {
      audioRef.current = new Audio(URL.createObjectURL(track.file));
      audioRef.current.play();
    } else if (track.videoId) {
      window.open(
        `https://www.youtube.com/watch?v=${track.videoId}`,
        "_blank"
      );
    }
  };

  /* ---------- AI ---------- */
  const generateAI = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      const text = data.choices[0].message.content;

      const songs = text
        .split("\n")
        .map((s) => s.replace(/^\d+[\.\-\)]?\s*/, "").trim())
        .filter((s) => s.length > 2)
        .slice(0, 10);

      const results = [];

      for (let song of songs) {
        const r = await fetch(`/api/search?q=${encodeURIComponent(song)}`);
        const d = await r.json();

        if (d && d.videoId) {
          results.push({
            title: d.title,
            videoId: d.videoId,
            thumbnail: d.thumbnail,
          });
        }
      }

      const newPlaylist = {
        id: Date.now(),
        name: query || "New Playlist",
        songs: results,
      };

      setPlaylists((prev) => [newPlaylist, ...prev]);
      setCurrentIndex(0);
    } catch (e) {
      alert("AI failed");
    }

    setLoading(false);
  };

  /* ---------- UPLOAD ---------- */
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const track = {
      id: Date.now(),
      title: file.name,
      file, // ✅ stored in IndexedDB
    };

    setPlaylists((prev) => {
      const updated = [...prev];

      if (!updated[currentIndex]) {
        return [
          {
            id: Date.now(),
            name: "My Music",
            songs: [track],
          },
        ];
      }

      updated[currentIndex].songs.unshift(track);
      return updated;
    });
  };

  /* ---------- RENAME ---------- */
  const renamePlaylist = () => {
    const name = prompt("New playlist name:");
    if (!name) return;

    setPlaylists((prev) => {
      const updated = [...prev];
      updated[currentIndex].name = name;
      return updated;
    });
  };

  /* ---------- INSTALL ---------- */
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () =>
      window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">

      <h1 className="text-3xl mb-6">🎧 Playlist AI</h1>

      {/* INPUT */}
      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-zinc-900 p-2 rounded"
        />
        <button onClick={generateAI} className="bg-purple-600 px-3 rounded">
          {loading ? "..." : "AI"}
        </button>
      </div>

      {/* UPLOAD */}
      <input type="file" onChange={handleUpload} />

      {/* PLAYLIST SELECT */}
      <div className="flex gap-2 mt-4">
        {playlists.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setCurrentIndex(i)}
            className={i === currentIndex ? "bg-purple-600 px-2" : "bg-zinc-700 px-2"}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* RENAME */}
      <button onClick={renamePlaylist} className="mt-2 text-sm text-purple-400">
        Rename ✏️
      </button>

      {/* SONGS */}
      <div className="mt-4 w-full max-w-md">
        {currentPlaylist.map((t) => (
          <div key={t.id} className="flex justify-between p-2 bg-zinc-900 mb-2">
            <span>{t.title}</span>
            <button onClick={() => play(t)}>▶</button>
          </div>
        ))}
      </div>

      {/* INSTALL */}
      {deferredPrompt && (
        <button onClick={installApp} className="mt-6 bg-blue-600 px-4 py-2 rounded">
          Install App 📱
        </button>
      )}

    </div>
  );
}
