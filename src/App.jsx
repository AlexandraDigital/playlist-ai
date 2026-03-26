import { useState, useEffect, useRef } from "react";

const TRANSLATIONS = {
  en: {
    appName: "Playlist AI",
    aiGenerate: "✨ AI Generate",
    aiPlaceholder: "Type a vibe, mood or genre…",
    generating: "⏳ Generating…",
    generateBtn: "⚡ Generate AI Playlist",
    addSong: "🔍 Add Song",
    artistPlaceholder: "Artist, or paste Spotify / YouTube URL",
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
    noResults: "No results found. Try adding manually via Spotify URL.",
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
    scRepeatNote: "Use ↺ inside the SoundCloud player for repeat",
    tabYouTube: "▶ YouTube",
    tabSpotify: "♫ Spotify",
    tabSoundCloud: "☁ SoundCloud",
    tabLocalFile: "📹 Video/Audio",
    uploadFile: "📎 Upload File",
    openInSpotify: "Open in Spotify App",
  },
  es: {
    appName: "Playlist AI",
    aiGenerate: "✨ Generar con IA",
    aiPlaceholder: "Escribe un ambiente, estado de ánimo o género…",
    generating: "⏳ Generando…",
    generateBtn: "⚡ Generar Playlist con IA",
    addSong: "🔍 Agregar Canción",
    artistPlaceholder: "Artista, o pega URL de Spotify / YouTube",
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
    noResults: "No se encontraron resultados. Intenta agregar manualmente con URL de Spotify.",
    searchFailed: "Búsqueda fallida: ",
    aiError: "Error de IA: ",
    aiNoSongs: "La IA no devolvió canciones — asegúrate de tener GROQ_API_KEY configurado en Cloudflare Pages",
    aiNoFind: "No se encontraron canciones, verifica tus claves de API.",
    dragToReorder: "Arrastrar para reordenar",
    remove: "Eliminar canción",
    toggleRepeat: "Repetir",
    defaultPlaylist: "Mi Playlist",
    confirmReplace: "Esto reemplazará todas las canciones de tu playlist. ¿Continuar?",
    spotifyRepeatNote: "Usa ↺ dentro del reproductor de Spotify para repetir",
    scRepeatNote: "Usa ↺ dentro del reproductor de SoundCloud para repetir",
    tabYouTube: "▶ YouTube",
    tabSpotify: "♫ Spotify",
    tabSoundCloud: "☁ SoundCloud",
    tabLocalFile: "📹 Video/Audio",
    uploadFile: "📎 Subir Archivo",
    openInSpotify: "Abrir en App de Spotify",
  },
  zh: {
    appName: "Playlist AI",
    aiGenerate: "✨ AI 生成",
    aiPlaceholder: "输入氛围、心情或曲风…",
    generating: "⏳ 生成中…",
    generateBtn: "⚡ AI 生成歌单",
    addSong: "🔍 添加歌曲",
    artistPlaceholder: "歌手（或粘贴 Spotify / YouTube 链接）",
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
    noResults: "未找到结果，请尝试粘贴 Spotify 链接手动添加。",
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
    scRepeatNote: "请使用 SoundCloud 播放器内的 ↺ 按钮来循环播放",
    tabYouTube: "▶ YouTube",
    tabSpotify: "♫ Spotify",
    tabSoundCloud: "☁ SoundCloud",
    tabLocalFile: "📹 视频/音频",
    uploadFile: "📎 上传文件",
    openInSpotify: "在 Spotify App 中打开",
  },
};

const LANG_OPTIONS = [
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "zh", flag: "🇨🇳", label: "中文" },
];

// Extract Spotify track ID from a Spotify URL
const extractSpotifyTrackId = (input) => {
  const match = input.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

// Extract YouTube video ID from a YouTube URL
const extractYouTubeVideoId = (input) => {
  const match = input.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  // "youtube" | "spotify" | "soundcloud" — which player tab is active
  const [sourceTab, setSourceTab] = useState("spotify");
  const [ytQuotaExceeded, setYtQuotaExceeded] = useState(false);
  const ytQuotaRef = useRef(false);
  const ytErrorCountRef = useRef(0);
  // Used to force-remount iframes (to trigger autoplay)
  const [playerKey, setPlayerKey] = useState(0);

  const fileInputRef = useRef();
  const renameInputRef = useRef();
  const audioRef = useRef();
  const active = playlists[currentPlaylist];

  // When song changes: pick best tab (Spotify > SoundCloud > YouTube) + start playing
  useEffect(() => {
    const s = playlists[currentPlaylist]?.songs[currentIndex];
    if (s?.soundcloudUrl) setSourceTab("soundcloud");
    else if (s?.spotifyEmbedUrl) setSourceTab("spotify");
    else setSourceTab("youtube");
    setIsPlaying(true);
    setPlayerKey((k) => k + 1);
  }, [currentIndex, currentPlaylist]); // eslint-disable-line react-hooks/exhaustive-deps

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
    return res.json();
  };

  // Search YouTube + Odesli (Spotify + SoundCloud), return a song object
  const fetchSong = async (query) => {
    if (ytQuotaRef.current) {
      throw new Error("YouTube quota exceeded. Add songs manually by pasting a Spotify URL.");
    }

    const data = await safeFetchJSON(`/search?q=${encodeURIComponent(query)}`);

    if (data.error) {
      const isQuota = /quota|limit exceeded|daily|forbidden|permission|rate/i.test(data.error);
      ytErrorCountRef.current += 1;
      if (isQuota || ytErrorCountRef.current >= 3) {
        ytQuotaRef.current = true;
        setYtQuotaExceeded(true);
      }
      throw new Error(data.error);
    }

    ytErrorCountRef.current = 0;

    const source = data.spotifyEmbedUrl ? "both" : "youtube";
    return {
      title: data.title,
      videoId: data.videoId,
      thumbnail: data.thumbnail,
      spotifyEmbedUrl: data.spotifyEmbedUrl || null,
      soundcloudUrl: data.soundcloudUrl || null,
      source,
    };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    addSong({
      title: file.name.replace(/\.[^.]+$/, ""),
      videoId: null,
      thumbnail: isVideo ? null : null,
      spotifyEmbedUrl: null,
      soundcloudUrl: null,
      localFileUrl: blobUrl,
      localFileType: file.type,
      source: "local",
    });
    e.target.value = "";
  };

  const searchSong = async () => {
    // Check if user pasted a YouTube URL
    const youtubeId = extractYouTubeVideoId(artist) || extractYouTubeVideoId(song);
    if (youtubeId) {
      let title = "YouTube Video";
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`
        );
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          title = oembedData.title || title;
        }
      } catch (_) { /* oEmbed failed — use generic title */ }
      addSong({
        title,
        videoId: youtubeId,
        thumbnail: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`,
        spotifyEmbedUrl: null,
        soundcloudUrl: null,
        source: "youtube",
      });
      setArtist(""); setSong("");
      return;
    }

    // Check if user pasted a Spotify URL in the artist field
    const spotifyId = extractSpotifyTrackId(artist) || extractSpotifyTrackId(song);
    if (spotifyId) {
      const spotifyTrackUrl = `https://open.spotify.com/track/${spotifyId}`;
      const title = (artist && !extractSpotifyTrackId(artist) ? artist + " - " : "") + (song && !extractSpotifyTrackId(song) ? song : "Spotify Track");
      // Look up SoundCloud via Odesli as fallback
      let soundcloudUrl = null;
      try {
        const scData = await safeFetchJSON(`/search?spotifyUrl=${encodeURIComponent(spotifyTrackUrl)}`);
        soundcloudUrl = scData.soundcloudUrl || null;
      } catch (e) {
        // Odesli lookup failed — that's okay, Spotify embed still works
      }
      addSong({
        title,
        videoId: null,
        thumbnail: null,
        spotifyEmbedUrl: `https://open.spotify.com/embed/track/${spotifyId}`,
        soundcloudUrl,
        source: "spotify",
      });
      setArtist(""); setSong("");
      return;
    }

    if (!artist && !song) return;
    try {
      const q = `${artist} ${song}`.trim();
      const result = await fetchSong(q);
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
      let firstError = null;
      for (const s of songs) {
        try {
          const result = await fetchSong(s);
          results.push(result);
        } catch (e) {
          if (!firstError) firstError = e;
        }
      }
      if (!results.length) {
        alert(firstError ? `${t.searchFailed}${firstError.message}` : t.aiNoFind);
        setLoading(false);
        return;
      }
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

  const nextSong = () => {
    if (!active.songs.length) return;
    setCurrentIndex((prev) => (prev + 1) % active.songs.length);
  };

  const prevSong = () => {
    if (!active.songs.length) return;
    setCurrentIndex((prev) => (prev - 1 + active.songs.length) % active.songs.length);
  };

  // Play/pause toggle
  const togglePlay = () => {
    const current = active.songs[currentIndex];
    if (!current) return;

    if (current.source === "local" && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      if (!isPlaying) {
        setPlayerKey((k) => k + 1);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const currentSong = active.songs[currentIndex];

  // Derive which tabs are available for current song
  const availableTabs = [
    currentSong?.localFileUrl ? "local" : null,
    currentSong?.spotifyEmbedUrl ? "spotify" : null,
    currentSong?.soundcloudUrl ? "soundcloud" : null,
    currentSong?.videoId ? "youtube" : null,
  ].filter(Boolean);

  // Build Spotify embed URL with autoplay when playing
  const buildSpotifyUrl = (baseUrl) => {
    if (!baseUrl) return null;
    const url = new URL(baseUrl);
    if (isPlaying) url.searchParams.set("autoplay", "1");
    return url.toString();
  };

  // Build SoundCloud embed URL
  const buildSoundCloudUrl = (trackUrl) => {
    if (!trackUrl) return null;
    const encoded = encodeURIComponent(trackUrl);
    const autoplay = isPlaying ? "true" : "false";
    return `https://w.soundcloud.com/player/?url=${encoded}&color=%23ff5500&auto_play=${autoplay}&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
  };

  const showingSpotify = sourceTab === "spotify" && !!currentSong?.spotifyEmbedUrl;
  const showingSoundCloud = sourceTab === "soundcloud" && !!currentSong?.soundcloudUrl;
  const repeatSupported = currentSong?.source === "local" || (currentSong?.videoId && sourceTab === "youtube");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* YouTube quota warning banner */}
      {ytQuotaExceeded && (
        <div className="bg-yellow-900/60 border-b border-yellow-700 text-yellow-300 text-sm text-center px-4 py-2 flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>YouTube daily quota reached — paste a Spotify URL in Add Song to keep adding music!</span>
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
              id="vibe-input"
              name="vibe"
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
              id="artist-input"
              name="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder={t.artistPlaceholder}
              className="w-full p-3 mb-2 bg-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-600"
            />
            <input
              id="song-input"
              name="song"
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
            <input ref={fileInputRef} type="file" accept="audio/*,video/*" onChange={upload} hidden />
          </div>

          {/* Now Playing card */}
          {currentSong && (
            <div className="bg-gray-900 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{t.nowPlaying}</p>

              {/* YouTube thumbnail — shown when on YouTube tab */}
              {sourceTab === "youtube" && currentSong.videoId && (
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

              {/* Dynamic tab switcher — only when more than 1 source available */}
              {availableTabs.length > 1 && (
                <div className="flex gap-1.5 mb-3">
                  {availableTabs.includes("local") && (
                    <button
                      onClick={() => { setSourceTab("local"); setPlayerKey((k) => k + 1); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                        sourceTab === "local"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      }`}
                    >
                      {t.tabLocalFile}
                    </button>
                  )}
    {availableTabs.includes("spotify") && (
                    <button
                      onClick={() => { setSourceTab("spotify"); setPlayerKey((k) => k + 1); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                        sourceTab === "spotify"
                          ? "bg-[#1db954] text-black"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      }`}
                    >
                      {t.tabSpotify}
                    </button>
                  )}
                  {availableTabs.includes("soundcloud") && (
                    <button
                      onClick={() => { setSourceTab("soundcloud"); setPlayerKey((k) => k + 1); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                        sourceTab === "soundcloud"
                          ? "bg-[#ff5500] text-white"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      }`}
                    >
                      {t.tabSoundCloud}
                    </button>
                  )}
                  {availableTabs.includes("youtube") && (
                    <button
                      onClick={() => { setSourceTab("youtube"); setPlayerKey((k) => k + 1); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                        sourceTab === "youtube"
                          ? "bg-red-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      }`}
                    >
                      {t.tabYouTube}
                    </button>
                  )}
                </div>
              )}

              {/* Playback controls */}
              <div className="flex justify-center gap-3 mb-3">
                <button
                  onClick={prevSong}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl transition"
                >⏮</button>

                {/* ▶/⏸ Play/Pause button */}
                <button
                  onClick={togglePlay}
                  className="bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-xl text-lg font-bold transition shadow-lg"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>

                <button
                  onClick={() => repeatSupported && setRepeat(!repeat)}
                  className={`px-4 py-2 rounded-xl transition ${
                    !repeatSupported
                      ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                      : repeat
                      ? "bg-purple-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                  title={
                    showingSpotify ? t.spotifyRepeatNote
                    : showingSoundCloud ? t.scRepeatNote
                    : t.toggleRepeat
                  }
                  disabled={!repeatSupported}
                >🔁</button>

                <button
                  onClick={nextSong}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl transition"
                >⏭</button>
              </div>

              {/* ── Players ── */}

              {/* Local audio */}
              {currentSong.source === "local" && (
                <audio
                  ref={audioRef}
                  src={currentSong.url}
                  controls
                  autoPlay={isPlaying}
                  loop={repeat}
                  className="w-full"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              )}

              {/* ── SPOTIFY PLAYER ── */}
              {isPlaying && showingSpotify && currentSong.spotifyEmbedUrl && (
                <>
                  <iframe
                    key={`sp-${playerKey}`}
                    className="w-full rounded-xl"
                    height="152"
                    src={buildSpotifyUrl(currentSong.spotifyEmbedUrl)}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                  <p className="text-xs text-gray-500 text-center mt-1 mb-2">{t.spotifyRepeatNote}</p>
                </>
              )}

              {/* Spotify paused state */}
              {!isPlaying && showingSpotify && currentSong.spotifyEmbedUrl && (
                <>
                  <div className="w-full h-[152px] bg-gray-800 rounded-xl flex flex-col items-center justify-center gap-2 mb-2">
                    <span className="text-4xl text-[#1db954]">♫</span>
                    <p className="text-xs text-gray-400">Press ▶ to play</p>
                  </div>

                </>
              )}

              {/* ── SOUNDCLOUD PLAYER ── */}
              {isPlaying && showingSoundCloud && currentSong.soundcloudUrl && (
                <>
                  <iframe
                    key={`sc-${playerKey}`}
                    className="w-full rounded-xl"
                    height="166"
                    scrolling="no"
                    frameBorder="no"
                    src={buildSoundCloudUrl(currentSong.soundcloudUrl)}
                    allow="autoplay"
                  />
                  <p className="text-xs text-gray-500 text-center mt-1">{t.scRepeatNote}</p>
                </>
              )}

              {/* SoundCloud paused state */}
              {!isPlaying && showingSoundCloud && currentSong.soundcloudUrl && (
                <div className="w-full h-[166px] bg-gray-800 rounded-xl flex flex-col items-center justify-center gap-2">
                  <span className="text-4xl text-[#ff5500]">☁</span>
                  <p className="text-xs text-gray-400">Press ▶ to play</p>
                </div>
              )}

              {/* ── LOCAL FILE PLAYER ── */}
              {sourceTab === "local" && currentSong.localFileUrl && (
                currentSong.localFileType?.startsWith("video/") ? (
                  <video
                    key={`local-${playerKey}`}
                    src={currentSong.localFileUrl}
                    controls
                    autoPlay={isPlaying}
                    loop={repeat}
                    className="w-full rounded-xl"
                    style={{ maxHeight: "300px" }}
                  />
                ) : (
                  <audio
                    key={`local-${playerKey}`}
                    src={currentSong.localFileUrl}
                    controls
                    autoPlay={isPlaying}
                    loop={repeat}
                    className="w-full mt-2"
                  />
                )
              )}

              {/* ── YOUTUBE PLAYER ── */}
              {isPlaying && sourceTab === "youtube" && currentSong.videoId && (
                <iframe
                  key={`yt-${playerKey}`}
                  className="w-full rounded-xl"
                  height="200"
                  src={`https://www.youtube.com/embed/${currentSong.videoId}?autoplay=1&loop=${repeat ? 1 : 0}&playlist=${currentSong.videoId}`}
                  allow="autoplay; encrypted-media"
                />
              )}

              {/* YouTube paused state */}
              {!isPlaying && sourceTab === "youtube" && currentSong.videoId && (
                <div className="w-full h-[200px] bg-gray-800 rounded-xl flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${currentSong.videoId}/mqdefault.jpg`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                  <span className="relative text-5xl">▶</span>
                  <p className="relative text-xs text-gray-300">Press ▶ to play</p>
                </div>
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

          {/* Song list */}
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
                {s.videoId ? (
                  <div className="relative w-14 h-10 shrink-0">
                    <img
                      src={s.thumbnail || `https://img.youtube.com/vi/${s.videoId}/mqdefault.jpg`}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                      draggable={false}
                    />
                    {s.spotifyEmbedUrl && (
                      <span className="absolute bottom-0 right-0 bg-[#1db954] text-black text-[9px] font-bold px-1 rounded-bl-lg rounded-tr-lg leading-tight">♫</span>
                    )}
                    {!s.spotifyEmbedUrl && s.soundcloudUrl && (
                      <span className="absolute bottom-0 right-0 bg-[#ff5500] text-white text-[9px] font-bold px-1 rounded-bl-lg rounded-tr-lg leading-tight">☁</span>
                    )}
                  </div>
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
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {s.spotifyEmbedUrl && (
                      <span className="text-[10px] text-green-400 font-medium">Spotify</span>
                    )}
                    {s.soundcloudUrl && (
                      <span className="text-[10px] text-orange-400 font-medium">SoundCloud</span>
                    )}
                    {s.videoId && (
                      <span className="text-[10px] text-red-400 font-medium">YouTube</span>
                    )}
                    {s.source === "local" && (
                      <span className="text-[10px] text-blue-400 font-medium">local</span>
                    )}
                  </div>
                </div>

                {i === currentIndex && (
                  <span className="text-purple-400 text-xs shrink-0">
                    {isPlaying ? "▶" : "⏸"}
                  </span>
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
