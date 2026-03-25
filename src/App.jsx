import { useState, useEffect, useRef } from "react";

const TRANSLATIONS = {
  en: {
    appName: "Playlist AI",
    aiGenerate: "✨ AI Generate",
    aiPlaceholder: "Type a vibe, mood or genre…",
    generating: "⏳ Generating…",
    generateBtn: "⚡ Generate AI Playlist",
    addSong: "🔍 Add Song",
    artistPlaceholder: "Artist",
    songPlaceholder: "Song title",
    addSongBtn: "Add Song",
    nowPlaying: "🎵 Now Playing",
    clear: "🗑 Clear",
    install: "📲 Install",
    noSongs: "No songs yet — generate or add some!",
    songs: (n) => `${n} song${n !== 1 ? "s" : ""}`,
    autosaved: "Autosaved",
    rename: "Rename playlist",
    newPlaylist: "New playlist",
    deletePlaylist: "Delete playlist",
    cantDelete: "Can't delete the last playlist",
    newPlaylistPrompt: "Name your playlist:",
    newPlaylistDefault: "New Playlist",
    noResults: "No results found on YouTube or Spotify",
    searchFailed: "Search failed: ",
    aiError: "AI error: ",
    aiNoSongs: "AI returned no songs — make sure GROQ_API_KEY is set in Cloudflare Pages → Settings → Environment Variables",
    aiNoFind: "Couldn't find any songs. Check your API keys.",
    dragToReorder: "Drag to reorder",
    remove: "Remove song",
    toggleRepeat: "Toggle repeat",
    defaultPlaylist: "My Playlist",
    confirmReplace: "This will replace all songs in your playlist. Continue?",
    spotifyRepeatNote: "Use ↺ inside the Spotify player for repeat",
    tabYouTube: "▶ YouTube",
    tabSpotify: "♫ Spotify",
  },
  es: {
    appName: "Playlist AI",
    aiGenerate: "✨ Generar con IA",
    aiPlaceholder: "Escribe un ambiente, estado de ánimo o género…",
    generating: "⏳ Generando…",
    generateBtn: "⚡ Generar Playlist con IA",
    addSong: "🔍 Agregar Canción",
    artistPlaceholder: "Artista",
    songPlaceholder: "Título de la canción",
    addSongBtn: "Agregar",
    nowPlaying: "🎵 Reproduciendo",
    clear: "🗑 Borrar",
    install: "📲 Instalar",
    noSongs: "Sin canciones — ¡genera o agrega algunas!",
    songs: (n) => `${n} canción${n !== 1 ? "es" : ""}`,
    autosaved: "Guardado automático",
    rename: "Renombrar playlist",
    newPlaylist: "Nueva playlist",
    deletePlaylist: "Eliminar playlist",
    cantDelete: "No se puede eliminar la última playlist",
    newPlaylistPrompt: "Nombre tu playlist:",
    newPlaylistDefault: "Nueva Playlist",
    noResults: "No se encontraron resultados en YouTube o Spotify",
    searchFailed: "Búsqueda fallida: ",
    aiError: "Error de IA: ",
    aiNoSongs: "La IA no devolvió canciones — asegúrate de tener GROQ_API_KEY configurado en Cloudflare Pages",
    aiNoFind: "No se encontraron canciones. Verifica tus claves de API.",
    dragToReorder: "Arrastrar para reordenar",
    remove: "Eliminar canción",
    toggleRepeat: "Repetir",
    defaultPlaylist: "Mi Playlist",
    confirmReplace: "Esto reemplazará todas las canciones de tu playlist. ¿Continuar?",
    spotifyRepeatNote: "Usa ↺ dentro del reproductor de Spotify para repetir",
    tabYouTube: "▶ YouTube",
    tabSpotify: "♫ Spotify",
  },
  zh: {
    appName: "Playlist AI",
    aiGenerate: "✨ AI 生成",
    aiPlaceholder: "输入氛围、心情或曲风…",
    generating: "⏳ 生成中…",
    generateBtn: "⚡ AI 生成歌单",
    addSong: "🔍 添加歌曲",
    artistPlaceholder: "歌手",
    songPlaceholder: "歌曲名称",
    addSongBtn: "添加",
    nowPlaying: "🎵 正在播放",
    clear: "🗑 清空",
    install: "📲 安装",
    noSongs: "暂无歌曲 — 生成或添加一些吧！",
    songs: (n) => `${n} 首歌曲`,
    autosaved: "已自动保存",
    rename: "重命名歌单",
    newPlaylist: "新建歌单",
    deletePlaylist: "删除歌单",
    cantDelete: "无法删除最后一个歌单",
    newPlaylistPrompt: "请输入歌单名称：",
    newPlaylistDefault: "新歌单",
    noResults: "在 YouTube 或 Spotify 上未找到结果",
    searchFailed: "搜索失败：",
    aiError: "AI 错误：",
    aiNoSongs: "AI 未返回歌曲 — 请确保在 Cloudflare Pages 中设置了 GROQ_API_KEY",
    aiNoFind: "未找到任何歌曲，请检查您的 API 密钥。",
    dragToReorder: "拖动以重新排序",
    remove: "移除歌曲",
    toggleRepeat: "切换循环",
    defaultPlaylist: "我的歌单",
    confirmReplace: "这将替换歌单中的所有歌曲，是否继续？",
    spotifyRepeatNote: "请使用 Spotify 播放器内的 ↺ 按钮来循环播放",
    tabYouTube: "▶ YouTube",
    tabSpotify: "♫ Spotify",
  },
};

const LANG_OPTIONS = [
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "zh", flag: "🇨🇳", label: "中文" },
];

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");
  const t = TRANSLATIONS[lang];

  const [vibe, setVibe] = useState("");
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState([{ name: t.defaultPlaylist, songs: [] }]);
  const [currentPlaylist, setCurrentPlaylist] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  // "youtube" | "spotify" — which player tab is active for the current song
  const [sourceTab, setSourceTab] = useState("youtube");
  const [ytQuotaExceeded, setYtQuotaExceeded] = useState(false);
  const ytQuotaRef = useRef(false); // ref so fetchBoth sees it immediately inside loops
  const ytErrorCountRef = useRef(0); // consecutive YouTube errors → auto-disable YouTube

  const fileInputRef = useRef();
  const renameInputRef = useRef();
  const active = playlists[currentPlaylist];

  // Reset player tab to YouTube whenever the song changes
  useEffect(() => {
    setSourceTab("youtube");
  }, [currentIndex, currentPlaylist]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

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

  const addSong = (s) => {
    const updated = [...playlists];
    updated[currentPlaylist] = {
      ...updated[currentPlaylist],
      songs: [s, ...updated[currentPlaylist].songs],
    };
    setPlaylists(updated);
  };

  const removeSong = (i) => {
    const updated = [...playlists];
    const newSongs = [...updated[currentPlaylist].songs];
    newSongs.splice(i, 1);
    updated[currentPlaylist] = { ...updated[currentPlaylist], songs: newSongs };
    setPlaylists(updated);
    setCurrentIndex((prev) => {
      if (newSongs.length === 0) return 0;
      if (i < prev) return prev - 1;
      return Math.min(prev, newSongs.length - 1);
    });
  };

  const newPlaylist = () => {
    const name = prompt(t.newPlaylistPrompt) || t.newPlaylistDefault;
    const updated = [...playlists, { name, songs: [] }];
    setPlaylists(updated);
    setCurrentPlaylist(updated.length - 1);
    setCurrentIndex(0);
  };

  const deletePlaylist = () => {
    if (playlists.length === 1) return alert(t.cantDelete);
    const updated = playlists.filter((_, i) => i !== currentPlaylist);
    setPlaylists(updated);
    setCurrentPlaylist(0);
    setCurrentIndex(0);
  };

  const startRename = () => {
    setRenameValue(active.name);
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const confirmRename = () => {
    if (renameValue.trim()) {
      const updated = [...playlists];
      updated[currentPlaylist] = { ...updated[currentPlaylist], name: renameValue.trim() };
      setPlaylists(updated);
    }
    setIsRenaming(false);
  };

  const handleDragStart = (i) => setDragIndex(i);
  const handleDragOver = (e, i) => { e.preventDefault(); setDragOverIndex(i); };
  const handleDrop = (i) => {
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOverIndex(null); return; }
    const updated = [...playlists];
    const songs = [...updated[currentPlaylist].songs];
    const [moved] = songs.splice(dragIndex, 1);
    songs.splice(i, 0, moved);
    updated[currentPlaylist] = { ...updated[currentPlaylist], songs };
    setPlaylists(updated);
    if (currentIndex === dragIndex) setCurrentIndex(i);
    else if (currentIndex > dragIndex && currentIndex <= i) setCurrentIndex(currentIndex - 1);
    else if (currentIndex < dragIndex && currentIndex >= i) setCurrentIndex(currentIndex + 1);
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  const safeFetchJSON = async (url, options) => {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Endpoint ${url} returned non-JSON. Check Cloudflare Pages deployment and API keys.`);
    }
    const json = await res.json();
    // Throw on HTTP errors so callers can catch them properly
    if (!res.ok) {
      throw new Error(json.error || `HTTP ${res.status} from ${url}`);
    }
    return json;
  };

  // Fetch YouTube and Spotify in parallel, return a combined song object
  const fetchBoth = async (query) => {
    const [ytResult, spotifyResult] = await Promise.allSettled([
      // Skip YouTube entirely this session if quota was already hit
      ytQuotaRef.current
        ? Promise.resolve({ items: [] })
        : safeFetchJSON(`/search?q=${encodeURIComponent(query)}`),
      safeFetchJSON(`/spotify?q=${encodeURIComponent(query)}`),
    ]);

    // Handle YouTube result
    let vid = null;
    if (ytResult.status === "fulfilled") {
      vid = ytResult.value.items?.[0] || null;
      ytErrorCountRef.current = 0; // reset on success
    } else {
      // YouTube threw — check if it looks like quota/rate-limit (multiple error wordings)
      const errMsg = ytResult.reason?.message || "";
      const isQuota = /quota|limit exceeded|daily|forbidden|permission|rate/i.test(errMsg);
      ytErrorCountRef.current += 1;
      if (isQuota || ytErrorCountRef.current >= 3) {
        ytQuotaRef.current = true;
        setYtQuotaExceeded(true);
      }
    }

    // Handle Spotify result
    let spotifyTrack = null;
    if (spotifyResult.status === "fulfilled") {
      spotifyTrack = spotifyResult.value.track || null;
    }
    // If Spotify rejected, spotifyTrack stays null — song will be YouTube-only or skipped

    if (!vid && !spotifyTrack) return null;

    const source = vid && spotifyTrack ? "both" : vid ? "youtube" : "spotify";
    return {
      title: vid ? vid.snippet.title : spotifyTrack.title,
      videoId: vid ? vid.id.videoId : null,
      thumbnail: vid ? `https://img.youtube.com/vi/${vid.id.videoId}/mqdefault.jpg` : null,
      spotifyEmbedUrl: spotifyTrack ? spotifyTrack.embedUrl : null,
      source,
    };
  };

  const searchSong = async () => {
    if (!artist && !song) return;
    try {
      const q = `${artist} ${song}`;
      const result = await fetchBoth(q);
      if (!result) { alert(t.noResults); return; }
      addSong(result);
      setArtist(""); setSong("");
    } catch (e) { alert(t.searchFailed + e.message); }
  };

  const generateAI = async () => {
    if (!vibe) return;
    if (active.songs.length > 0 && !window.confirm(t.confirmReplace)) return;
    setLoading(true);
    try {
      const data = await safeFetchJSON("/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: vibe }),
      });
      const songs = data.songs;
      if (!songs?.length) {
        alert(data.error || t.aiNoSongs);
        setLoading(false);
        return;
      }
      const results = [];
      // Fetch YouTube + Spotify in parallel per song, songs processed sequentially to avoid rate limits
      for (const s of songs) {
        try {
          const result = await fetchBoth(s);
          if (result) results.push(result);
        } catch {}
      }
      if (!results.length) { alert(t.aiNoFind); setLoading(false); return; }
      const updated = [...playlists];
      updated[currentPlaylist] = { ...updated[currentPlaylist], songs: results };
      setPlaylists(updated);
      setCurrentIndex(0);
    } catch (e) {
      alert(t.aiError + (e.message || "Unknown error"));
    }
    setLoading(false);
  };

  const clearPlaylist = () => {
    const updated = [...playlists];
    updated[currentPlaylist] = { ...updated[currentPlaylist], songs: [] };
    setPlaylists(updated);
    setCurrentIndex(0);
  };

  const nextSong = () => { if (!active.songs.length) return; setCurrentIndex((prev) => (prev + 1) % active.songs.length); };
  const prevSong = () => { if (!active.songs.length) return; setCurrentIndex((prev) => (prev - 1 + active.songs.length) % active.songs.length); };

  const currentSong = active.songs[currentIndex];
  // True when the active player view is Spotify (either source="spotify" or source="both" on spotify tab)
  const showingSpotify =
    currentSong?.source === "spotify" ||
    (currentSong?.source === "both" && sourceTab === "spotify");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* YouTube quota warning banner */}
      {ytQuotaExceeded && (
        <div className="bg-yellow-900/60 border-b border-yellow-700 text-yellow-300 text-sm text-center px-4 py-2 flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>YouTube daily quota reached — searching Spotify only until midnight (Pacific Time)</span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-900">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎧</span>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            {t.appName}
          </h1>
        </div>

        {/* Language switcher */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => setLang(opt.code)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                lang === opt.code
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              <span>{opt.flag}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="flex flex-1 gap-4 p-4 max-w-6xl mx-auto w-full flex-col lg:flex-row">

        {/* ── LEFT COLUMN: Controls + Player ── */}
        <div className="flex flex-col gap-3 lg:w-80 shrink-0">

          {/* AI Generate card */}
          <div className="bg-gray-900 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">{t.aiGenerate}</p>
            <input
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateAI()}
              placeholder={t.aiPlaceholder}
              className="w-full p-3 mb-2 bg-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              onClick={generateAI}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 p-3 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition"
            >
              {loading ? t.generating : t.generateBtn}
            </button>
          </div>

          {/* Add Song card */}
          <div className="bg-gray-900 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">{t.addSong}</p>
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder={t.artistPlaceholder}
              className="w-full p-3 mb-2 bg-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-600"
            />
            <input
              value={song}
              onChange={(e) => setSong(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchSong()}
              placeholder={t.songPlaceholder}
              className="w-full p-3 mb-2 bg-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-600"
            />
            <div className="flex gap-2">
              <button
                onClick={searchSong}
                className="flex-1 bg-purple-600 hover:bg-purple-500 p-3 rounded-xl font-semibold text-sm transition"
              >
                {t.addSongBtn}
              </button>
              <button
                onClick={() => fileInputRef.current.click()}
                className="bg-gray-700 hover:bg-gray-600 px-4 rounded-xl text-lg transition"
                title="Upload local file"
              >
                📁
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={upload} hidden />
          </div>

          {/* Now Playing card */}
          {currentSong && (
            <div className="bg-gray-900 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{t.nowPlaying}</p>

              {/* YouTube thumbnail — shown when on YouTube tab or source is youtube-only */}
              {(currentSong.source === "youtube" || (currentSong.source === "both" && sourceTab === "youtube")) &&
                currentSong.videoId && (
                <div className="relative w-full mb-3 rounded-xl overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${currentSong.videoId}/mqdefault.jpg`}
                    alt=""
                    className="w-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl" />
                  <p className="absolute bottom-2 left-2 right-2 text-xs font-medium truncate">{currentSong.title}</p>
                </div>
              )}

              {/* Title for spotify-only or local */}
              {(currentSong.source === "spotify" || currentSong.source === "local") && (
                <p className="text-sm font-medium truncate mb-2">{currentSong.title}</p>
              )}

              {/* Source tab switcher — only shown when both are available */}
              {currentSong.source === "both" && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setSourceTab("youtube")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                      sourceTab === "youtube"
                        ? "bg-red-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    }`}
                  >
                    {t.tabYouTube}
                  </button>
                  <button
                    onClick={() => setSourceTab("spotify")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                      sourceTab === "spotify"
                        ? "bg-[#1db954] text-black"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    }`}
                  >
                    {t.tabSpotify}
                  </button>
                </div>
              )}

              {/* Playback controls */}
              <div className="flex justify-center gap-3 mb-3">
                <button onClick={prevSong} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl transition">⏮</button>

                {/* Repeat disabled when viewing Spotify (iframe has no JS API) */}
                <button
                  onClick={() => !showingSpotify && setRepeat(!repeat)}
                  className={`px-4 py-2 rounded-xl transition ${
                    showingSpotify
                      ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                      : repeat
                      ? "bg-purple-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                  title={showingSpotify ? t.spotifyRepeatNote : t.toggleRepeat}
                  disabled={showingSpotify}
                >🔁</button>

                <button onClick={nextSong} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl transition">⏭</button>
              </div>

              {/* ── Players ── */}

              {/* Local audio */}
              {currentSong.source === "local" && (
                <audio src={currentSong.url} controls autoPlay loop={repeat} className="w-full" />
              )}

              {/* YouTube player */}
              {(currentSong.source === "youtube" ||
                (currentSong.source === "both" && sourceTab === "youtube")) &&
                currentSong.videoId && (
                <iframe
                  key={`yt-${currentSong.videoId}`}
                  className="w-full rounded-xl"
                  height="200"
                  src={`https://www.youtube.com/embed/${currentSong.videoId}?autoplay=1&loop=${repeat ? 1 : 0}&playlist=${currentSong.videoId}`}
                  allow="autoplay; encrypted-media"
                />
              )}

              {/* Spotify player */}
              {(currentSong.source === "spotify" ||
                (currentSong.source === "both" && sourceTab === "spotify")) &&
                currentSong.spotifyEmbedUrl && (
                <>
                  <iframe
                    key={`sp-${currentSong.spotifyEmbedUrl}`}
                    className="w-full rounded-xl"
                    height="152"
                    src={currentSong.spotifyEmbedUrl}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                  <p className="text-xs text-gray-500 text-center mt-2">{t.spotifyRepeatNote}</p>
                </>
              )}
            </div>
          )}

          {/* Utility row */}
          <div className="flex gap-2">
            <button onClick={clearPlaylist} className="flex-1 bg-gray-800 hover:bg-gray-700 p-2 rounded-xl text-sm transition">
              {t.clear}
            </button>
            {deferredPrompt && (
              <button onClick={installApp} className="flex-1 bg-purple-700 hover:bg-purple-600 p-2 rounded-xl text-sm transition">
                {t.install}
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Playlist panel ── */}
        <div className="flex flex-col flex-1 bg-gray-900 rounded-2xl overflow-hidden min-h-[400px]">

          {/* Playlist header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={confirmRename}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setIsRenaming(false); }}
                  className="flex-1 bg-gray-800 px-3 py-1 rounded-lg text-lg font-bold outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <h2 className="flex-1 text-lg font-bold truncate">{active.name}</h2>
              )}
              <button
                onClick={startRename}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg text-sm transition"
                title={t.rename}
              >✏️</button>
              <button
                onClick={newPlaylist}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg text-sm font-bold transition"
                title={t.newPlaylist}
              >+</button>
              <button
                onClick={deletePlaylist}
                className="bg-gray-700 hover:bg-red-900 px-3 py-1 rounded-lg text-sm transition"
                title={t.deletePlaylist}
              >🗑</button>
            </div>

            {/* Playlist tabs */}
            {playlists.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {playlists.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentPlaylist(i); setCurrentIndex(0); }}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition ${
                      i === currentPlaylist
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Song list — drag & drop */}
          <div className="flex-1 overflow-y-auto p-3">
            {active.songs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-gray-600">
                <div className="text-5xl mb-3">🎵</div>
                <p className="text-sm">{t.noSongs}</p>
              </div>
            )}

            {active.songs.map((s, i) => (
              <div
                key={`${s.videoId || s.spotifyEmbedUrl || s.url || s.title}-${i}`}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                onClick={() => setCurrentIndex(i)}
                className={`flex items-center gap-3 p-2 mb-1 rounded-xl cursor-pointer transition-all select-none ${
                  i === currentIndex
                    ? "bg-purple-900 border border-purple-500"
                    : dragOverIndex === i
                    ? "bg-gray-700 border border-dashed border-purple-400"
                    : "bg-gray-800 hover:bg-gray-700"
                } ${dragIndex === i ? "opacity-30" : ""}`}
              >
                {/* Thumbnail / icon */}
                {s.source === "both" && s.videoId ? (
                  // YouTube thumbnail with Spotify badge
                  <div className="relative w-14 h-10 shrink-0">
                    <img
                      src={s.thumbnail || `https://img.youtube.com/vi/${s.videoId}/mqdefault.jpg`}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                      draggable={false}
                    />
                    <span className="absolute bottom-0 right-0 bg-[#1db954] text-black text-[9px] font-bold px-1 rounded-bl-lg rounded-tr-lg leading-tight">
                      ♫
                    </span>
                  </div>
                ) : s.source === "youtube" && s.videoId ? (
                  <img
                    src={s.thumbnail || `https://img.youtube.com/vi/${s.videoId}/mqdefault.jpg`}
                    alt=""
                    className="w-14 h-10 object-cover rounded-lg shrink-0"
                    draggable={false}
                  />
                ) : s.source === "spotify" ? (
                  <div className="w-14 h-10 bg-[#1db954]/20 border border-[#1db954]/30 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-[#1db954] text-lg">♫</span>
                  </div>
                ) : (
                  <div className="w-14 h-10 bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-gray-400">📁</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-tight">{s.title}</p>
                  {/* Source badges */}
                  <div className="flex gap-1 mt-0.5">
                    {(s.source === "youtube" || s.source === "both") && (
                      <span className="text-[10px] text-red-400 font-medium">YouTube</span>
                    )}
                    {s.source === "both" && (
                      <span className="text-[10px] text-gray-600">·</span>
                    )}
                    {(s.source === "spotify" || s.source === "both") && (
                      <span className="text-[10px] text-green-400 font-medium">Spotify</span>
                    )}
                    {s.source === "local" && (
                      <span className="text-[10px] text-blue-400 font-medium">local</span>
                    )}
                  </div>
                </div>

                {i === currentIndex && (
                  <span className="text-purple-400 text-xs shrink-0">▶</span>
                )}

                <span className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0 text-lg px-1" title={t.dragToReorder}>
                  ⠿
                </span>

                <button
                  onClick={(e) => { e.stopPropagation(); removeSong(i); }}
                  className="text-gray-600 hover:text-red-400 shrink-0 transition"
                  title={t.remove}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-600">
              {t.songs(active.songs.length)}
            </span>
            <span className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
              {t.autosaved}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
