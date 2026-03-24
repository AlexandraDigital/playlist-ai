import { useState, useRef } from "react";

export default function App() {
  const [vibe, setVibe] = useState("");
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");

  const [playlist, setPlaylist] = useState([]);
  const [playlistName, setPlaylistName] = useState("My Playlist");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeat, setRepeat] = useState(false);

  const fileInputRef = useRef();
  const dragItem = useRef();
  const dragOverItem = useRef();

  // ▶️ PLAY
  const playSong = (i) => setCurrentIndex(i);

  // ❌ REMOVE
  const removeSong = (index) => {
    setPlaylist((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔀 DRAG
  const handleSort = () => {
    let list = [...playlist];
    const dragged = list.splice(dragItem.current, 1)[0];
    list.splice(dragOverItem.current, 0, dragged);
    setPlaylist(list);
  };

  // 🔍 SEARCH
  const searchSong = async () => {
    if (!artist && !song) return;

    try {
      const query = `${artist} ${song}`;
      const r = await fetch(`/search?q=${encodeURIComponent(query)}`);
      const d = await r.json();

      if (!d.items?.length) return alert("No results");

      const vid = d.items[0];

      const newSong = {
        title: vid.snippet.title,
        videoId: vid.id.videoId,
        thumbnail: vid.snippet.thumbnails.medium.url,
      };

      setPlaylist((prev) => [newSong, ...prev]);
      setArtist("");
      setSong("");
    } catch {
      alert("Search failed");
    }
  };

  // 🤖 AI
  const generateAI = async () => {
    if (!vibe) return;

    try {
      const res = await fetch("/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: vibe }),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        alert("AI broken");
        return;
      }

      const content = data?.choices?.[0]?.message?.content;
      if (!content) return alert("AI failed");

      const songs = content
        .split("\n")
        .map((s) => s.replace(/^\d+\.\s*/, "").trim())
        .filter((s) => s.includes(" - "));

      let results = [];

      for (let s of songs.slice(0, 10)) {
        const [artist, title] = s.split(" - ");

        try {
          const r = await fetch(
            `/search?q=${encodeURIComponent(artist + " " + title)}`
          );
          const d = await r.json();

          if (d.items?.length) {
            results.push({
              title: d.items[0].snippet.title,
              videoId: d.items[0].id.videoId,
              thumbnail: d.items[0].snippet.thumbnails.medium.url,
            });
          }
        } catch {}
      }

      if (!results.length) return alert("No songs found");

      setPlaylist(results);
    } catch {
      alert("AI failed");
    }
  };

  // 📤 UPLOAD
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newSong = {
      title: file.name,
      url: URL.createObjectURL(file),
      local: true,
    };

    setPlaylist((prev) => [newSong, ...prev]);
  };

  // 🧹 CLEAR
  const clearPlaylist = () => {
    setPlaylist([]);
    setCurrentIndex(0);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md sm:max-w-lg px-4">

        {/* TITLE */}
        <input
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          className="text-2xl font-bold text-center w-full mb-6 bg-transparent outline-none"
        />

        {/* AI */}
        <input
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generateAI()}
          placeholder="Type a vibe..."
          className="w-full p-3 mb-3 rounded-xl bg-gray-900 border border-gray-800"
        />

        <button className="w-full p-4 mb-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 hover:opacity-90 transition">
          Generate AI Playlist
        </button>

        {/* SEARCH */}
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchSong()}
          placeholder="Artist"
          className="w-full p-3 mb-2 rounded-xl bg-gray-900 border border-gray-800"
        />

        <input
          value={song}
          onChange={(e) => setSong(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchSong()}
          placeholder="Song"
          className="w-full p-3 mb-3 rounded-xl bg-gray-900 border border-gray-800"
        />

        {/* BUTTONS */}
        <div className="grid grid-cols-2 gap-3 mb-4">

          <button
            onClick={searchSong}
            className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 transition"
          >
            Add
          </button>

          <button
            onClick={clearPlaylist}
            className="p-3 rounded-xl bg-gray-700 hover:bg-gray-600 active:scale-95 transition"
          >
            Clear
          </button>

          <button
            onClick={() => setRepeat(!repeat)}
            className={`p-3 rounded-xl active:scale-95 transition ${
              repeat
                ? "bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/40"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            🔁 Repeat
          </button>

          <button
            onClick={() => fileInputRef.current.click()}
            className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 transition"
          >
            Upload
          </button>

        </div>

        {/* FILE */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleUpload}
          className="hidden"
        />

        {/* PLAYLIST */}
        <div className="space-y-3">
          {playlist.map((s, i) => (
            <div
              key={i}
              draggable
              onClick={() => playSong(i)}
              onDragStart={() => (dragItem.current = i)}
              onDragEnter={() => (dragOverItem.current = i)}
              onDragEnd={handleSort}
              onDragOver={(e) => e.preventDefault()}
              className="flex items-center gap-3 bg-gray-900 p-3 rounded-xl cursor-pointer hover:bg-gray-800 transition"
            >
              {s.thumbnail && (
                <img src={s.thumbnail} className="w-14 rounded" />
              )}

              <div className="flex-1 text-sm">{s.title}</div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSong(i);
                }}
                className="text-red-400 hover:text-red-300"
              >
                ❌
              </button>
            </div>
          ))}
        </div>

        {/* PLAYER */}
        {playlist[currentIndex] &&
          (playlist[currentIndex].local ? (
            <audio
              key={currentIndex}
              className="w-full mt-6"
              src={playlist[currentIndex].url}
              controls
              autoPlay
              loop={repeat}
            />
          ) : (
            <iframe
              key={currentIndex}
              width="0"
              height="0"
              src={`https://www.youtube.com/embed/${playlist[currentIndex].videoId}?autoplay=1&loop=${repeat ? 1 : 0}`}
              allow="autoplay"
            />
          ))}
      </div>
    </div>
  );
}
