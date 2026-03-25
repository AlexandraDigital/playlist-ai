import { useState, useEffect, useRef } from "react";

export default function App() {
  const [vibe, setVibe] = useState("");
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [loading, setLoading] = useState(false);

  const [playlists, setPlaylists] = useState([
    { name: "My Playlist", songs: [] },
  ]);
  const [currentPlaylist, setCurrentPlaylist] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeat, setRepeat] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallHint, setShowInstallHint] = useState(false);

  const fileInputRef = useRef();
  const active = playlists[currentPlaylist];

  // INSTALL
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallHint(true);
      setTimeout(() => setShowInstallHint(false), 4000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    setShowInstallHint(false);
  };

  // UPLOAD
  const upload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    addSong({
      title: file.name,
      url: URL.createObjectURL(file),
      local: true,
    });
  };

  // LOAD
  useEffect(() => {
    const saved = localStorage.getItem("library");
    const savedState = localStorage.getItem("playerState");

    if (saved) setPlaylists(JSON.parse(saved));

    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.currentPlaylist !== undefined)
        setCurrentPlaylist(state.currentPlaylist);
      if (state.currentIndex !== undefined)
        setCurrentIndex(state.currentIndex);
    }
  }, []);

  // SAVE
  useEffect(() => {
    localStorage.setItem("library", JSON.stringify(playlists));

    const state = {
      currentPlaylist,
      currentIndex,
    };
    localStorage.setItem("playerState", JSON.stringify(state));
  }, [playlists, currentPlaylist, currentIndex]);

  // CLAMP currentIndex when songs array shrinks
  useEffect(() => {
    if (active.songs.length > 0 && currentIndex >= active.songs.length) {
      setCurrentIndex(active.songs.length - 1);
    }
  }, [active.songs.length]);

  const addSong = (s) => {
    const updated = [...playlists];
    updated[currentPlaylist].songs.unshift(s);
    setPlaylists(updated);
  };

  const removeSong = (i) => {
    const updated = [...playlists];
    updated[currentPlaylist].songs.splice(i, 1);
    setPlaylists(updated);

    // Keep currentIndex pointing at the same song
    if (i < currentIndex) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    } else if (i === currentIndex) {
      setCurrentIndex(0);
    }
    // i > currentIndex: no change needed
  };

  const newPlaylist = () => {
    const name = prompt("Name your playlist:") || "New Playlist";
    const updated = [...playlists, { name, songs: [] }];
    setPlaylists(updated);
    setCurrentPlaylist(updated.length - 1);
  };

  const deletePlaylist = () => {
    if (playlists.length === 1) return alert("Can't delete last playlist");
    const updated = playlists.filter((_, i) => i !== currentPlaylist);
    setPlaylists(updated);
    setCurrentPlaylist(0);
  };

  const renamePlaylist = () => {
    const name = prompt("Rename playlist:");
    if (!name) return;
    const updated = [...playlists];
    updated[currentPlaylist].name = name;
    setPlaylists(updated);
  };

  const switchPlaylist = () => {
    const names = playlists.map((p, i) => `${i + 1}. ${p.name}`).join("\n");
    const choice = prompt(`Select playlist:\n${names}`);
    const index = parseInt(choice) - 1;
    if (index >= 0 && index < playlists.length) {
      setCurrentPlaylist(index);
      setCurrentIndex(0);
    }
  };

  // Helper: try YouTube first, fall back to Spotify embed (full song)
  const resolveTrack = async (q) => {
    // 1. Try YouTube directly
    let res = await fetch(`/search?q=${encodeURIComponent(q)}`);
    let data = await res.json();
    let vid = data.items?.[0];
    if (vid) {
      return { title: vid.snippet.title, videoId: vid.id.videoId };
    }

    // 2. Get Spotify metadata + track ID
    const spRes = await fetch(`/spotify-search?q=${encodeURIComponent(q)}`);
    const spData = await spRes.json();
    const track = spData.items?.[0];

    if (!track) return null;

    // 3. Retry YouTube with Spotify's enriched query
    const retryQuery = track.query || `${track.artist} ${track.title}`;
    const retry = await fetch(`/search?q=${encodeURIComponent(retryQuery)}`);
    const retryData = await retry.json();
    vid = retryData.items?.[0];

    if (vid) {
      return { title: vid.snippet.title, videoId: vid.id.videoId };
    }

    // 4. YouTube fully failed — use Spotify embed (full song playback)
    return {
      title: `${track.artist} \u2013 ${track.title}`,
      spotifyId: track.spotifyId,
    };
  };

  // SEARCH
  const searchSong = async () => {
    if (!artist && !song) return;
    if (loading) return;

    setLoading(true);
    try {
      const result = await resolveTrack(`${artist} ${song}`);
      if (!result) return alert("No results found");
      addSong(result);
      setArtist("");
      setSong("");
    } catch {
      alert("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // AI
  const generateAI = async () => {
    if (!vibe) return;
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: vibe }),
      });

      const data = await res.json();
      const songs = data.songs;

      if (!songs?.length) return alert("AI failed");

      const results = [];

      for (let s of songs) {
        const result = await resolveTrack(s);
        if (result) results.push(result);
      }

      const updated = [...playlists];
      updated[currentPlaylist].songs = results;
      setPlaylists(updated);
      setCurrentIndex(0);
    } catch {
      alert("AI error");
    } finally {
      setLoading(false);
    }
  };

  const clearPlaylist = () => {
    const updated = [...playlists];
    updated[currentPlaylist].songs = [];
    setPlaylists(updated);
    setCurrentIndex(0);
  };

  const nextSong = () => {
    if (!active.songs.length) return;
    setCurrentIndex((prev) => (prev + 1) % active.songs.length);
  };

  const prevSong = () => {
    if (!active.songs.length) return;
    setCurrentIndex(
      (prev) => (prev - 1 + active.songs.length) % active.songs.length
    );
  };

  const currentSong = active.songs[currentIndex];

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl">

        {/* LOGO */}
        <div className="flex flex-col items-center mb-6 animate-bounce">
          <div className="text-5xl">\ud83c\udfa7</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Playlist AI
          </h1>
        </div>

        {/* HEADER */}
        <div className="flex justify-center gap-2 mb-6">
          <button onClick={switchPlaylist} onDoubleClick={renamePlaylist} className="bg-purple-600 px-4 py-2 rounded-xl">
            {active.name}
          </button>
          <button onClick={newPlaylist} className="bg-purple-600 px-3 py-2 rounded-xl">+</button>
          <button onClick={deletePlaylist} className="bg-purple-600 px-3 py-2 rounded-xl">\ud83d\uddd1</button>
        </div>

        {/* VIBE */}
        <input
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generateAI()}
          placeholder="Type a vibe..."
          className="w-full p-3 mb-2 bg-gray-900 rounded-xl"
        />
        <button
          onClick={generateAI}
          disabled={loading}
          className="w-full bg-purple-600 p-3 mb-4 rounded-xl disabled:opacity-50"
        >
          {loading ? "Generating\u2026" : "Generate AI Playlist"}
        </button>

        {/* SEARCH */}
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchSong()}
          placeholder="Artist"
          className="w-full p-3 mb-2 bg-gray-900 rounded-xl"
        />
        <input
          value={song}
          onChange={(e) => setSong(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchSong()}
          placeholder="Song"
          className="w-full p-3 mb-2 bg-gray-900 rounded-xl"
        />

        <div className="flex gap-2 mb-4">
          <button
            onClick={searchSong}
            disabled={loading}
            className="flex-1 bg-purple-600 p-3 rounded-xl disabled:opacity-50"
          >
            {loading ? "\u2026" : "Add Song"}
          </button>
          <button onClick={() => fileInputRef.current.click()} className="bg-gray-700 px-3 rounded-xl">\u2b06\ufe0f</button>
        </div>

        <input ref={fileInputRef} type="file" accept="audio/*" onChange={upload} hidden />

        {/* ACTIONS */}
        <div className={`grid ${deferredPrompt ? "grid-cols-3" : "grid-cols-2"} gap-2 mb-4`}>
          <button onClick={clearPlaylist} className="bg-gray-700 p-3 rounded-xl">Clear</button>
          <button onClick={() => setRepeat(!repeat)} className={`p-3 rounded-xl ${repeat ? "bg-purple-600" : "bg-gray-700"}`}>\ud83d\udd01</button>
          {deferredPrompt && (
            <button onClick={installApp} className="bg-purple-600 p-3 rounded-xl text-sm">Install</button>
          )}
        </div>

        {/* SONG LIST */}
        {active.songs.map((s, i) => (
          <div
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`flex justify-between items-center p-3 mb-2 rounded-xl cursor-pointer ${
              i === currentIndex ? "bg-purple-800" : "bg-gray-900 hover:bg-gray-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {s.spotifyId && (
                <span className="text-green-400 text-xs font-bold">\u2665 Spotify</span>
              )}
              <span className="truncate">{s.title}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); removeSong(i); }}>\u274c</button>
          </div>
        ))}

        {/* PLAYER */}
        {currentSong && (
          <>
            <div className="flex justify-center gap-3 mt-4">
              <button onClick={prevSong} className="bg-gray-700 px-4 py-2 rounded-xl">\u23ee</button>
              <button onClick={nextSong} className="bg-gray-700 px-4 py-2 rounded-xl">\u23ed</button>
            </div>

            {currentSong.local ? (
              <audio
                src={currentSong.url}
                controls
                autoPlay
                loop={repeat}
                className="w-full mt-4"
              />
            ) : currentSong.spotifyId ? (
              <iframe
                key={currentSong.spotifyId}
                className="w-full mt-4 rounded-xl"
                src={`https://open.spotify.com/embed/track/${currentSong.spotifyId}?utm_source=generator&autoplay=1`}
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            ) : (
              <iframe
                key={currentSong.videoId}
                className="w-full mt-4 rounded-xl"
                height="200"
                src={`https://www.youtube.com/embed/${currentSong.videoId}?autoplay=1&loop=${repeat ? 1 : 0}&playlist=${currentSong.videoId}`}
                allow="autoplay; encrypted-media"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
