import { useState } from "react";

export default function App() {
  const [vibe, setVibe] = useState("");
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");

  const [playlists, setPlaylists] = useState([{ name: "My Playlist", songs: [] }]);
  const [currentPlaylist, setCurrentPlaylist] = useState(0);

  const active = playlists[currentPlaylist];

  // ➕ Add song
  const addSong = (s) => {
    const updated = [...playlists];
    updated[currentPlaylist].songs.unshift(s);
    setPlaylists(updated);
  };

  // ❌ Remove song
  const removeSong = (i) => {
    const updated = [...playlists];
    updated[currentPlaylist].songs.splice(i, 1);
    setPlaylists(updated);
  };

  // 🔍 SEARCH (mocked)
  const searchSong = async () => {
    if (!artist && !song) return;

    try {
      const q = `${artist} ${song}`;

      // Mock YouTube search result
      const vid = {
        id: { videoId: "dQw4w9WgXcQ" },
        snippet: { title: q || "Mock Song" },
      };

      addSong({
        title: vid.snippet.title,
        videoId: vid.id.videoId,
      });

      setArtist("");
      setSong("");
    } catch (e) {
      console.error(e);
      alert("Search failed");
    }
  };

  // 🤖 AI
  const generateAI = async () => {
    if (!vibe) return;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: vibe }),
      });

      const data = await res.json();

      if (!data.songs || !data.songs.length) {
        alert("AI failed or returned no songs");
        return;
      }

      const results = data.songs.map((s, i) => ({
        title: s,
        videoId: "dQw4w9WgXcQ", // placeholder video for demo
      }));

      const updated = [...playlists];
      updated[currentPlaylist].songs = results;
      setPlaylists(updated);
    } catch (e) {
      console.error(e);
      alert("AI failed");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-3xl mb-4 text-purple-400">Playlist AI</h1>

      {/* AI */}
      <input
        value={vibe}
        onChange={(e) => setVibe(e.target.value)}
        placeholder="Enter a vibe..."
        className="w-full p-2 mb-2 bg-gray-900 rounded"
      />
      <button
        onClick={generateAI}
        className="w-full bg-purple-600 p-2 mb-4 rounded"
      >
        Generate AI Playlist
      </button>

      {/* Search */}
      <input
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        placeholder="Artist"
        className="w-full p-2 mb-2 bg-gray-900 rounded"
      />
      <input
        value={song}
        onChange={(e) => setSong(e.target.value)}
        placeholder="Song"
        className="w-full p-2 mb-2 bg-gray-900 rounded"
      />
      <button
        onClick={searchSong}
        className="w-full bg-purple-600 p-2 mb-4 rounded"
      >
        Add Song
      </button>

      {/* Playlist */}
      {active.songs.map((s, i) => (
        <div
          key={i}
          className="bg-gray-800 p-2 mb-2 flex justify-between rounded"
        >
          {s.title}
          <button onClick={() => removeSong(i)}>❌</button>
        </div>
      ))}

      {/* Player */}
      {active.songs[0] && (
        <iframe
          className="w-full mt-4"
          height="200"
          src={`https://www.youtube.com/embed/${active.songs[0].videoId}?autoplay=1`}
        />
      )}
    </div>
  );
}
