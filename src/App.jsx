import { useState, useEffect, useRef } from "react";

export default function App() {
  const [vibe, setVibe] = useState("");
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [loading, setLoading] = useState(false);

  const [playlists, setPlaylists] = useState([{ name: "My Playlist", songs: [] }]);
  const [currentPlaylist, setCurrentPlaylist] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const fileInputRef = useRef();
  const active = playlists[currentPlaylist];

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = () => { if (!deferredPrompt) return; deferredPrompt.prompt(); };

  const upload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    addSong({ title: file.name, url: URL.createObjectURL(file), source: "local" });
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("library");
      const savedState = localStorage.getItem("playerState");
      if (saved) setPlaylists(JSON.parse(saved));
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.currentPlaylist !== undefined) setCurrentPlaylist(state.currentPlaylist);
        if (state.currentIndex !== undefined) setCurrentIndex(state.currentIndex);
      }
    } catch {
      localStorage.removeItem("library");
      localStorage.removeItem("playerState");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("library", JSON.stringify(playlists));
    localStorage.setItem("playerState", JSON.stringify({ currentPlaylist, currentIndex }));
  }, [playlists, currentPlaylist, currentIndex]);

  const addSong = (s) => { const updated = [...playlists]; updated[currentPlaylist].songs.unshift(s); setPlaylists(updated); };
  const removeSong = (i) => {
    const updated = [...playlists];
    updated[currentPlaylist].songs.splice(i, 1);
    setPlaylists(updated);
    setCurrentIndex((prev) => Math.min(prev, Math.max(0, updated[currentPlaylist].songs.length - 1)));
  };
  const newPlaylist = () => { const name = prompt("Name your playlist:") || "New Playlist"; const updated = [...playlists, { name, songs: [] }]; setPlaylists(updated); setCurrentPlaylist(updated.length - 1); };
  const deletePlaylist = () => { if (playlists.length === 1) return alert("Can't delete last playlist"); const updated = playlists.filter((_, i) => i !== currentPlaylist); setPlaylists(updated); setCurrentPlaylist(0); };
  const renamePlaylist = () => { const name = prompt("Rename playlist:"); if (!name) return; const updated = [...playlists]; updated[currentPlaylist].name = name; setPlaylists(updated); };
  const switchPlaylist = () => { const names = playlists.map((p, i) => `${i + 1}. ${p.name}`).join("\n"); const choice = prompt(`Select playlist:\n${names}`); const index = parseInt(choice) - 1; if (index >= 0 && index < playlists.length) { setCurrentPlaylist(index); setCurrentIndex(0); } };

  // Spotify fallback search
  const trySpotify = async (query) => {
    try {
      const res = await fetch(`/spotify?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.track) return { title: data.track.title, spotifyEmbedUrl: data.track.embedUrl, source: "spotify" };
    } catch {}
    return null;
  };

  // Search song — YouTube first, Spotify fallback
  const searchSong = async () => {
    if (!artist && !song) return;
    try {
      const q = `${artist} ${song}`;
      const res = await fetch(`/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const vid = data.items?.[0];
      if (vid) {
        addSong({ title: vid.snippet.title, videoId: vid.id.videoId, source: "youtube" });
      } else {
        const spotifyTrack = await trySpotify(q);
        if (spotifyTrack) {
          addSong(spotifyTrack);
        } else {
          alert("No results found on YouTube or Spotify");
          return;
        }
      }
      setArtist(""); setSong("");
    } catch { alert("Search failed"); }
  };

  // AI playlist — YouTube first, Spotify fallback per song
  const generateAI = async () => {
    if (!vibe) return;
    setLoading(true);
    try {
      const res = await fetch("/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: vibe }),
      });
      const data = await res.json();
      const songs = data.songs;

      if (!songs?.length) {
        alert(data.error || "AI returned no songs — make sure GROQ_API_KEY is set in Cloudflare Pages → Settings → Environment Variables");
        setLoading(false);
        return;
      }

      const results = [];
      for (const s of songs) {
        // Try YouTube first
        try {
          const r = await fetch(`/search?q=${encodeURIComponent(s)}`);
          const d = await r.json();
          const vid = d.items?.[0];
          if (vid) {
            results.push({ title: vid.snippet.title, videoId: vid.id.videoId, source: "youtube" });
            continue;
          }
        } catch {}
        // Spotify fallback
        const spotifyTrack = await trySpotify(s);
        if (spotifyTrack) results.push(spotifyTrack);
      }

      if (!results.length) {
        alert("Couldn't find any songs. Check that YOUTUBE_API_KEY or SPOTIFY credentials are set.");
        setLoading(false);
        return;
      }

      const updated = [...playlists];
      updated[currentPlaylist].songs = results;
      setPlaylists(updated);
      setCurrentIndex(0);
    } catch (e) {
      alert("AI error: " + (e.message || "Unknown error"));
    }
    setLoading(false);
  };

  const clearPlaylist = () => { const updated = [...playlists]; updated[currentPlaylist].songs = []; setPlaylists(updated); setCurrentIndex(0); };
  const nextSong = () => { if (!active.songs.length) return; setCurrentIndex((prev) => (prev + 1) % active.songs.length); };
  const prevSong = () => { if (!active.songs.length) return; setCurrentIndex((prev) => (prev - 1 + active.songs.length) % active.songs.length); };

  const currentSong = active.songs[currentIndex];

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center mb-6 animate-bounce">
          <div className="text-5xl">🎧</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Playlist AI
          </h1>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          <button onClick={switchPlaylist} onDoubleClick={renamePlaylist} className="bg-purple-600 px-4 py-2 rounded-xl">{active.name}</button>
          <button onClick={newPlaylist} className="bg-purple-600 px-3 py-2 rounded-xl">+</button>
          <button onClick={deletePlaylist} className="bg-purple-600 px-3 py-2 rounded-xl">🗑</button>
        </div>

        <input value={vibe} onChange={e => setVibe(e.target.value)} placeholder="Type a vibe..." className="w-full p-3 mb-2 bg-gray-900 rounded-xl" />
        <button onClick={generateAI} disabled={loading} className="w-full bg-purple-600 p-3 mb-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "⏳ Generating..." : "Generate AI Playlist"}
        </button>

        <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist" className="w-full p-3 mb-2 bg-gray-900 rounded-xl" />
        <input value={song} onChange={e => setSong(e.target.value)} placeholder="Song" className="w-full p-3 mb-2 bg-gray-900 rounded-xl" />

        <div className="flex gap-2 mb-4">
          <button onClick={searchSong} className="flex-1 bg-purple-600 p-3 rounded-xl">Add Song</button>
          <button onClick={() => fileInputRef.current.click()} className="bg-gray-700 px-3 rounded-xl">⬆️</button>
        </div>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={upload} hidden />

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button onClick={clearPlaylist} className="bg-gray-700 p-3 rounded-xl">Clear</button>
          <button onClick={() => setRepeat(!repeat)} className={`p-3 rounded-xl ${repeat ? "bg-purple-600" : "bg-gray-700"}`}>🔁</button>
          {deferredPrompt && <button onClick={installApp} className="bg-purple-600 p-3 rounded-xl text-sm">Install</button>}
        </div>

        {active.songs.map((s, i) => (
          <div
            key={`${s.videoId || s.spotifyEmbedUrl || s.url}-${i}`}
            onClick={() => setCurrentIndex(i)}
            className={`flex justify-between items-center p-3 mb-2 rounded-xl cursor-pointer ${
              i === currentIndex ? "bg-purple-900 border border-purple-500" : "bg-gray-900"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {s.source === "spotify" && <span className="text-green-400 text-xs shrink-0">🟢</span>}
              {s.source === "youtube" && <span className="text-red-400 text-xs shrink-0">🔴</span>}
              {s.source === "local" && <span className="text-blue-400 text-xs shrink-0">📁</span>}
              <span className="truncate">{s.title}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); removeSong(i); }} className="shrink-0 ml-2">❌</button>
          </div>
        ))}

        {currentSong && (
          <>
            <div className="flex justify-center gap-3 mt-4">
              <button onClick={prevSong} className="bg-gray-700 px-4 py-2 rounded-xl">⏮</button>
              <button onClick={nextSong} className="bg-gray-700 px-4 py-2 rounded-xl">⏭</button>
            </div>
            {currentSong.source === "local" ? (
              <audio src={currentSong.url} controls autoPlay loop={repeat} className="w-full mt-4" />
            ) : currentSong.source === "spotify" ? (
              <iframe
                className="w-full mt-4 rounded-xl"
                height="152"
                src={currentSong.spotifyEmbedUrl}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            ) : (
              <iframe
                className="w-full mt-4 rounded-xl"
                height="200"
                src={`https://www.youtube.com/embed/${currentSong.videoId}?autoplay=1&loop=${
                  repeat ? 1 : 0
                }&playlist=${currentSong.videoId}`}
                allow="autoplay"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
