import { useState, useEffect, useRef } from "react";

export default function App() {
  const [vibe, setVibe] = useState("");
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");

  const [playlists, setPlaylists] = useState([{ name: "My Playlist", songs: [] }]);
  const [currentPlaylist, setCurrentPlaylist] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeat, setRepeat] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const fileInputRef = useRef();
  const active = playlists[currentPlaylist];

  // Install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
  };

  // Upload local audio
  const upload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    addSong({ title: file.name, url: URL.createObjectURL(file), local: true });
  };

  // Load saved playlists
  useEffect(() => {
    const saved = localStorage.getItem("library");
    const savedState = localStorage.getItem("playerState");
    if (saved) setPlaylists(JSON.parse(saved));
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.currentPlaylist !== undefined) setCurrentPlaylist(state.currentPlaylist);
      if (state.currentIndex !== undefined) setCurrentIndex(state.currentIndex);
    }
  }, []);

  // Save playlists
  useEffect(() => {
    localStorage.setItem("library", JSON.stringify(playlists));
    localStorage.setItem("playerState", JSON.stringify({ currentPlaylist, currentIndex }));
  }, [playlists, currentPlaylist, currentIndex]);

  // Playlist functions
  const addSong = (s) => { const updated = [...playlists]; updated[currentPlaylist].songs.unshift(s); setPlaylists(updated); };
  const removeSong = (i) => { const updated = [...playlists]; updated[currentPlaylist].songs.splice(i, 1); setPlaylists(updated); };
  const newPlaylist = () => { const name = prompt("Name your playlist:") || "New Playlist"; const updated = [...playlists, { name, songs: [] }]; setPlaylists(updated); setCurrentPlaylist(updated.length - 1); };
  const deletePlaylist = () => { if (playlists.length === 1) return alert("Can't delete last playlist"); const updated = playlists.filter((_, i) => i !== currentPlaylist); setPlaylists(updated); setCurrentPlaylist(0); };
  const renamePlaylist = () => { const name = prompt("Rename playlist:"); if (!name) return; const updated = [...playlists]; updated[currentPlaylist].name = name; setPlaylists(updated); };
  const switchPlaylist = () => { const names = playlists.map((p, i) => `${i + 1}. ${p.name}`).join("\n"); const choice = prompt(`Select playlist:\n${names}`); const index = parseInt(choice) - 1; if (index >= 0 && index < playlists.length) { setCurrentPlaylist(index); setCurrentIndex(0); } };

  // Search song
  const searchSong = async () => {
    if (!artist && !song) return;
    try {
      const q = `${artist} ${song}`;
      let res = await fetch(`/functions/search?q=${encodeURIComponent(q)}`);
      let data = await res.json();
      const vid = data.items?.[0];
      if (!vid) return alert("No results");
      addSong({ title: vid.snippet.title, videoId: vid.id.videoId });
      setArtist(""); setSong("");
    } catch { alert("Search failed"); }
  };

  // AI playlist
  const generateAI = async () => {
    if (!vibe) return;
    try {
      const res = await fetch(`/functions/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: vibe }),
      });
      const data = await res.json();
      const songs = data.songs;
      if (!songs?.length) return alert("AI failed");

      let results = [];
      for (let s of songs) {
        let res = await fetch(`/functions/search?q=${encodeURIComponent(s)}`);
        let d = await res.json();
        const vid = d.items?.[0];
        if (vid) results.push({ title: vid.snippet.title, videoId: vid.id.videoId });
      }

      const updated = [...playlists]; updated[currentPlaylist].songs = results; setPlaylists(updated);
    } catch { alert("AI error"); }
  };

  const clearPlaylist = () => { const updated = [...playlists]; updated[currentPlaylist].songs = []; setPlaylists(updated); };
  const nextSong = () => { if (!active.songs.length) return; setCurrentIndex((prev) => (prev + 1) % active.songs.length); };
  const prevSong = () => { if (!active.songs.length) return; setCurrentIndex((prev) => (prev - 1 + active.songs.length) % active.songs.length); };

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
        <button onClick={generateAI} className="w-full bg-purple-600 p-3 mb-4 rounded-xl">Generate AI Playlist</button>

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
          <div key={i} onClick={() => setCurrentIndex(i)} className="flex justify-between bg-gray-900 p-3 mb-2 rounded-xl">
            <div>{s.title}</div>
            <button onClick={e => { e.stopPropagation(); removeSong(i); }}>❌</button>
          </div>
        ))}

        {active.songs[currentIndex] && (
          <>
            <div className="flex justify-center gap-3 mt-4">
              <button onClick={prevSong} className="bg-gray-700 px-4 py-2 rounded-xl">⏮</button>
              <button onClick={nextSong} className="bg-gray-700 px-4 py-2 rounded-xl">⏭</button>
            </div>
            {active.songs[currentIndex].local ? (
              <audio src={active.songs[currentIndex].url} controls autoPlay loop={repeat} className="w-full mt-4" />
            ) : (
              <iframe className="w-full mt-4 rounded-xl" height="200" src={`https://www.youtube.com/embed/${active.songs[currentIndex].videoId}?autoplay=1&loop=${repeat ? 1 : 0}`} allow="autoplay" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
