import { useState, useRef, useEffect } from "react";

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

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const play = (track) => {
    if (audioRef.current) audioRef.current.pause();

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
  };


  const generateAI = () => {
  const fakeSongs = [
    { title: "Chill Vibes 🌙", videoId: "1", url: "" },
    { title: "Night Drive 🚗", videoId: "2", url: "" },
    { title: "Deep Focus 🎧", videoId: "3", url: "" },
  ];

  setPlaylist(fakeSongs);
};
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const track = {
      title: file.name,
      videoId: "local-" + Date.now(),
      url: URL.createObjectURL(file),
    };

    setPlaylist((prev) => [track, ...prev]);
  };

  return (
  <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white flex flex-col items-center p-6">

    {/* Title */}
    <h1 className="text-4xl font-bold mb-8 text-purple-400 drop-shadow-lg">
      🎧 Playlist AI
    </h1>

    {/* Input */}
    <div className="w-full max-w-md flex gap-2 mb-6">
      <input
        className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-600 outline-none text-white p-3 rounded-xl transition"
        placeholder="Type a vibe..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button
        onClick={generateAI}
        className="bg-purple-600 hover:bg-purple-700 px-4 rounded-xl font-semibold transition"
      >
        {loading ? "..." : "AI"}
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
      className="bg-zinc-900/80 backdrop-blur border border-zinc-800 hover:border-purple-500 transition p-4 rounded-xl flex items-center justify-between shadow-md"
    >
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
</div>
    {playlist.length === 0 && (
  <div className="text-zinc-400 mt-6">
    No songs yet. Generate or upload 🎧
  </div>
)}

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
