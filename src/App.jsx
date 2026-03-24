import { useState, useRef, useEffect } from "react";
const openDB = () => {
  return new Promise((resolve) => {
    const request = indexedDB.open("musicDB", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("songs", { keyPath: "id" });
    };

    request.onsuccess = () => resolve(request.result);
  });
};

export default function App() {
  const [query, setQuery] = useState("");
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(localStorage.getItem("pro") === "true");
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const audioRef = useRef(null);

  // Install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () =>
      window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  
  useEffect(() => {
  const loadSongs = async () => {
    const db = await openDB();
    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");

    const request = store.getAll();

    request.onsuccess = () => {
      const tracks = request.result.map((t) => ({
        ...t,
        url: URL.createObjectURL(t.file),
      }));

      setPlaylist(tracks);
    };
  };

  loadSongs();
}, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

 const play = (track) => {
  // Stop previous
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }

  // 🎵 Uploaded file
  if (track.url) {
    audioRef.current = new Audio(track.url);

    audioRef.current.onended = () => {
      const index = playlist.findIndex(
        (t) => t.videoId === track.videoId
      );

      let nextIndex = index + 1;
      if (nextIndex >= playlist.length) nextIndex = 0;

      play(playlist[nextIndex]);
    };

    audioRef.current.play();
  } 
  // 🌐 AI / YouTube song
  else if (track.videoId) {
    window.open(
      `https://www.youtube.com/watch?v=${track.videoId}`,
      "_blank"
    );
  }
};

const generateAI = async () => {
  setLoading(true);

  try {
    // 1. Get AI songs
    const res = await fetch("/api/ai/", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
const raw = await res.text();
console.log("AI raw:", raw);

const data = JSON.parse(raw);
const text = data.choices[0].message.content;

    // 2. Clean list
    const songs = text
      .split("\n")
      .map(s => s.replace(/^\d+\.?\s*/, "").trim())
      .filter(Boolean);

    const results = [];

    // 3. Search each song
    for (let song of songs.slice(0, 10)) {
      const r = await fetch(`/api/search?q=${encodeURIComponent(song)}`);
      const d = await r.json();

      if (d) {
        results.push({
          title: d.title,
          videoId: d.videoId,
          thumbnail: d.thumbnail,
        });
      }
    }

    setPlaylist(results);
  } catch (e) {
    console.error(e);
    alert("AI failed");
  }

  setLoading(false);
};


const handleUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const track = {
    id: "local-" + Date.now(),
    title: file.name,
    file,
  };

  const db = await openDB();
  const tx = db.transaction("songs", "readwrite");
  const store = tx.objectStore("songs");
  store.put(track);

  setPlaylist((prev) => [
    ...prev,
    { ...track, url: URL.createObjectURL(file) },
  ]);
};

return (
  <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white flex flex-col items-center p-6">
    
    {/* Title */}
    <h1 className="text-4xl font-bold mb-8 text-purple-400 drop-shadow-lg">
      🎧 Playlist AI
    </h1>

    {/* Input + AI */}
    <div className="w-full max-w-md flex gap-2 mb-6">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a vibe..."
        className="flex-1 bg-zinc-900 text-white p-3 rounded-xl border border-zinc-700"
      />

      <button
        onClick={generateAI}
        className="bg-purple-600 hover:bg-purple-700 px-4 rounded-xl"
      >
        AI
      </button>
    </div>

    {/* Upload */}
    <label className="mb-6 cursor-pointer bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl shadow-lg transition">
      Upload Music 🎵
      <input
        type="file"
        accept="audio/*"
        onChange={handleUpload}
        className="hidden"
      />
    </label>

    {/* Playlist */}
    <div className="w-full max-w-md flex flex-col gap-3">
      {playlist.map((t, i) => (
        <div
          key={i}
          className="bg-zinc-900/80 backdrop-blur border border-zinc-800 hover:border-purple-500 transition p-4 rounded-xl flex items-center gap-3 shadow-md"
        >
          {t.thumbnail && (
            <img src={t.thumbnail} className="w-12 h-12 rounded" />
          )}

          <div className="flex flex-col flex-1">
            <span className="text-sm font-semibold truncate">
              {t.title}
            </span>
            <span className="text-xs text-zinc-400">
              Tap to play
            </span>
          </div>

          <button
            onClick={() => play(t)}
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg text-sm"
          >
            ▶
          </button>
        </div>
      ))}

      {playlist.length === 0 && (
        <div className="text-zinc-400 text-center mt-4">
          No songs yet 🎧
        </div>
      )}
    </div>

    {/* Install */}
    {deferredPrompt && (
      <button
        onClick={installApp}
        className="mt-6 bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl shadow-lg"
      >
        Install App 📱
      </button>
    )}

    {/* Pro */}
    {!isPro && (
      <button className="mt-6 bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-xl shadow-lg">
        Upgrade to Pro 🚀
      </button>
    )}

  </div>
);
}
