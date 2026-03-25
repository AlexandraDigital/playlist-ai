import { useState, useEffect } from "react";

export default function App() {
  const [vibe, setVibe] = useState("");
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");

  const [playlists, setPlaylists] = useState([
    { name: "My Playlist", songs: [] },
  ]);
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

  // 🔍 SEARCH
  const searchSong = async () => {
    if (!artist && !song) return;

    try {
      const q = `${artist} ${song}`;

      // YouTube first
      let res = await fetch(`/search?q=${encodeURIComponent(q)}`);
      let data = await res.json();
      let vid = data.items?.[0];

      // Spotify fallback
      if (!vid) {
        const spRes = await fetch(`/spotify-search?q=${encodeURIComponent(q)}`);
        const spData = await spRes.json();
        const track = spData.items?.[0];

        if (track) {
          const retry = await fetch(
            `/search?q=${encodeURIComponent(track.query)}`
          );
          const retryData = await retry.json();
          vid = retryData.items?.[0];
        }
      }

      if (!vid) {
        alert("No results found");
        return;
      }

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
      const res = await fetch("/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: vibe }),
      });

      const data = await res.json();

      if (!data.songs || !data.songs.length) {
        alert("AI failed");
        return;
      }

      let results = [];

      for (let s of data.songs) {
        let res = await fetch(`/search?q=${encodeURIComponent(s)}`);
        let d = await res.json();
        let vid = d.items?.[0];

        if (!vid) {
          const spRes = await fetch(`/spotify-search?q=${encodeURIComponent(s)}`);
          const spData = await spRes.json();
          const track = spData.items?.[0];

          if (track) {
            const retry = await fetch(
              `/search?q=${encodeURIComponent(track.query)}`
            );
            const retryData = await retry.json();
            vid = retryData.items?.[0];
          }
        }

        if (vid) {
          results.push({
            title: vid.snippet.title,
            videoId: vid.id.videoId,
          });
        }
      }

      if (!results.length) {
        alert("No results found");
        return;
      }

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

      {/* Songs */}
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
