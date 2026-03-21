import { useState, useRef, useEffect, useCallback } from "react";

/* ── IndexedDB helpers ──────────────────────────────────────── */
const IDB = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      const r = indexedDB.open("playlist-ai", 1);
      r.onupgradeneeded = (e) =>
        e.target.result.createObjectStore("offline", { keyPath: "videoId" });
      r.onsuccess = (e) => { this._db = e.target.result; res(this._db); };
      r.onerror = (e) => rej(e.target.error);
    });
  },
  async save(rec) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction("offline", "readwrite");
      tx.objectStore("offline").put(rec);
      tx.oncomplete = res; tx.onerror = rej;
    });
  },
  async getAll() {
    const db = await this.open();
    return new Promise((res, rej) => {
      const req = db.transaction("offline", "readonly").objectStore("offline").getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = rej;
    });
  },
  async del(videoId) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction("offline", "readwrite");
      tx.objectStore("offline").delete(videoId);
      tx.oncomplete = res; tx.onerror = rej;
    });
  },
};

/* ── Styles ─────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #000; --surface: #0a0a0a; --card: #111; --border: #1e1e1e;
    --purple: #a855f7; --purple2: #9333ea; --purple-dim: rgba(168,85,247,0.1);
    --purple-light: #c084fc; --green: #22c55e; --red: #ef4444;
    --text: #fff; --muted: #555; --sub: #888; --font: 'Inter', sans-serif;
  }
  body { background:var(--bg); color:var(--text); font-family:var(--font); min-height:100vh; }
  .app { display:grid; grid-template-rows:auto auto 1fr auto; height:100vh; max-width:840px; margin:0 auto; }
  ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }

  #yt-player-wrap { position:fixed; top:-9999px; left:-9999px; width:320px; height:180px; pointer-events:none; z-index:-1; }
  #yt-player { width:100%; height:100%; }

  /* HEADER */
  .header { padding:22px 24px 14px; }
  .logo { font-size:30px; font-weight:700; letter-spacing:-1.5px;
    background:linear-gradient(135deg,#a855f7,#7c3aed); -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    display:inline-block; margin-bottom:14px; }
  .input-row { display:flex; gap:8px; align-items:center; }
  .main-input { flex:1; background:var(--card); border:1px solid var(--border); border-radius:10px;
    padding:11px 15px; font-size:14px; color:var(--text); font-family:var(--font); outline:none; transition:border-color .15s; }
  .main-input:focus { border-color:#2a2a2a; }
  .main-input::placeholder { color:var(--muted); }
  .gen-btn { padding:11px 22px; background:var(--purple); border:none; border-radius:10px;
    color:#fff; font-family:var(--font); font-size:14px; font-weight:500; cursor:pointer; transition:background .15s; white-space:nowrap; }
  .gen-btn:hover { background:var(--purple2); }
  .gen-btn:disabled { opacity:.4; cursor:not-allowed; }

  /* TABS */
  .tabs { display:flex; border-bottom:1px solid var(--border); padding:0 24px; gap:4px; }
  .tab { padding:11px 14px; font-size:13px; font-weight:500; color:var(--muted); background:transparent;
    border:none; border-bottom:2px solid transparent; cursor:pointer; font-family:var(--font); transition:all .15s; }
  .tab.active { color:var(--purple-light); border-bottom-color:var(--purple); }
  .tab-badge { display:inline-flex; align-items:center; justify-content:center;
    min-width:18px; height:18px; border-radius:9px; background:var(--purple-dim);
    font-size:10px; color:var(--purple-light); margin-left:5px; padding:0 4px; }

  /* AI DRAWER */
  .ai-drawer { background:var(--surface); border-bottom:1px solid var(--border);
    padding:14px 24px; display:flex; flex-direction:column; gap:10px; }
  .ai-msgs { display:flex; flex-direction:column; gap:6px; max-height:140px; overflow-y:auto; }
  .ai-msg { font-size:13px; line-height:1.5; }
  .ai-msg.user { color:var(--sub); }
  .ai-msg.ai { color:var(--text); }
  .ai-msg.thinking { color:var(--muted); font-style:italic; }
  .ai-input-row { display:flex; gap:8px; }
  .ai-input { flex:1; background:var(--card); border:1px solid var(--border); border-radius:8px;
    padding:9px 12px; font-size:13px; color:var(--text); font-family:var(--font); outline:none; }
  .ai-input:focus { border-color:#2a2a2a; }
  .ai-send { padding:9px 16px; background:var(--purple); border:none; border-radius:8px;
    color:#fff; font-family:var(--font); font-size:13px; cursor:pointer; }
  .ai-send:disabled { opacity:.4; cursor:not-allowed; }
  .chip-row { display:flex; gap:6px; flex-wrap:wrap; }
  .chip { padding:5px 11px; background:var(--card); border:1px solid var(--border); border-radius:20px;
    font-size:12px; color:var(--sub); cursor:pointer; transition:all .15s; font-family:var(--font); }
  .chip:hover { border-color:var(--purple); color:var(--purple-light); }

  /* ADD SONG FORM */
  .add-form { background:var(--surface); border-bottom:1px solid var(--border); padding:14px 24px; display:flex; flex-direction:column; gap:10px; }
  .add-form-row { display:flex; gap:8px; }
  .add-input { flex:1; background:var(--card); border:1px solid var(--border); border-radius:8px;
    padding:9px 12px; font-size:13px; color:var(--text); font-family:var(--font); outline:none; min-width:0; }
  .add-input:focus { border-color:#2a2a2a; }
  .add-input::placeholder { color:var(--muted); }
  .add-submit { padding:9px 18px; background:var(--purple); border:none; border-radius:8px;
    color:#fff; font-family:var(--font); font-size:13px; font-weight:500; cursor:pointer; white-space:nowrap; }
  .add-cancel { padding:9px 14px; background:transparent; border:1px solid var(--border); border-radius:8px;
    color:var(--muted); font-family:var(--font); font-size:13px; cursor:pointer; }

  /* PLAYLIST AREA */
  .scroll-area { overflow-y:auto; padding:0 24px 12px; }
  .pl-header { display:flex; align-items:center; justify-content:space-between; padding:14px 0 10px; }
  .pl-name { background:transparent; border:none; color:var(--text); font-family:var(--font);
    font-size:15px; font-weight:600; outline:none; width:200px; }
  .pl-name::placeholder { color:var(--muted); }
  .pl-actions { display:flex; gap:6px; align-items:center; }
  .icon-btn { padding:7px 12px; background:transparent; border:1px solid var(--border); border-radius:8px;
    color:var(--muted); font-size:12px; cursor:pointer; font-family:var(--font); transition:all .15s; white-space:nowrap; }
  .icon-btn:hover { border-color:#333; color:var(--sub); }
  .icon-btn.danger:hover { border-color:var(--red); color:var(--red); }

  /* TRACK ROW */
  .track-row { display:flex; align-items:center; gap:12px; padding:9px 0;
    border-bottom:1px solid var(--border); cursor:pointer; transition:background .1s; border-radius:6px; }
  .track-row:hover { background:rgba(255,255,255,.02); }
  .track-row.playing { background:var(--purple-dim); }
  .track-num { width:22px; font-size:12px; color:var(--muted); text-align:center; flex-shrink:0; }
  .track-thumb { width:42px; height:42px; border-radius:6px; object-fit:cover; background:var(--card); flex-shrink:0; }
  .track-thumb-placeholder { width:42px; height:42px; border-radius:6px; background:var(--card);
    display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; color:var(--muted); }
  .track-info { flex:1; min-width:0; }
  .track-title { font-size:14px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .track-artist { font-size:12px; color:var(--sub); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
  .track-dur { font-size:12px; color:var(--muted); flex-shrink:0; }
  .track-actions { display:flex; gap:6px; align-items:center; flex-shrink:0; }
  .t-btn { width:28px; height:28px; border-radius:6px; border:1px solid var(--border);
    background:transparent; cursor:pointer; color:var(--muted); font-size:13px;
    display:flex; align-items:center; justify-content:center; transition:all .15s; }
  .t-btn:hover { border-color:#333; color:var(--sub); }
  .t-btn.dl-done { border-color:rgba(168,85,247,.3); color:var(--purple); }
  .t-btn.dl-err { border-color:rgba(239,68,68,.3); color:var(--red); }
  .t-btn.dl-ing { opacity:.5; cursor:not-allowed; }
  .t-btn.remove:hover { border-color:rgba(239,68,68,.4); color:var(--red); }
  .t-btn.retry:hover { border-color:rgba(168,85,247,.4); color:var(--purple-light); }
  .track-status { font-size:11px; color:var(--muted); }
  .spotify-dot { width:6px; height:6px; border-radius:50%; background:#1db954; display:inline-block; margin-right:4px; }

  /* EMPTY */
  .empty { display:flex; flex-direction:column; align-items:center; justify-content:center;
    height:100%; gap:10px; color:var(--muted); }
  .empty-icon { font-size:36px; opacity:.3; }
  .empty-text { font-size:14px; }
  .empty-sub { font-size:12px; color:var(--muted); opacity:.6; }

  /* PLAYER BAR */
  .player { background:var(--surface); border-top:1px solid var(--border);
    padding:12px 24px; display:flex; align-items:center; gap:14px; }
  .player-thumb { width:40px; height:40px; border-radius:6px; object-fit:cover; background:var(--card); flex-shrink:0; }
  .player-thumb-ph { width:40px; height:40px; border-radius:6px; background:var(--card);
    display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; color:var(--muted); }
  .player-info { flex:1; min-width:0; }
  .player-title { font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .player-artist { font-size:11px; color:var(--sub); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
  .player-controls { display:flex; gap:8px; align-items:center; }
  .p-btn { width:32px; height:32px; border-radius:8px; border:1px solid var(--border);
    background:transparent; cursor:pointer; color:var(--sub); font-size:13px;
    display:flex; align-items:center; justify-content:center; transition:all .15s; }
  .p-btn:hover { border-color:#333; color:var(--text); }
  .p-btn.play { background:var(--purple); border-color:var(--purple); color:#fff; }
  .p-btn.play:hover { background:var(--purple2); }
  .player-src { font-size:10px; color:var(--muted); flex-shrink:0; }
`;

/* ── YouTube search ─────────────────────────────────────────── */
async function ytSearch(title, artist) {
  const queries = [
    `${title} ${artist}`,
    `${title} ${artist} official audio`,
    `${title} ${artist} lyrics`,
    `${title} official`,
  ];
  for (const q of queries) {
    try {
      const r = await fetch(`/api/youtube-search?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      const item = d?.items?.[0];
      if (item?.id?.videoId) {
        return {
          videoId: item.id.videoId,
          thumbnail: item.snippet?.thumbnails?.medium?.url || null,
          ytTitle: item.snippet?.title || null,
        };
      }
    } catch { /* try next */ }
  }
  return null;
}

/* ── Spotify search ─────────────────────────────────────────── */
async function spotifySearch(title, artist) {
  try {
    const q = artist ? `${title} ${artist}` : title;
    const r = await fetch(`/api/spotify-search?q=${encodeURIComponent(q)}&type=track`);
    if (!r.ok) return null;
    const d = await r.json();
    const track = d?.tracks?.items?.[0];
    if (!track) return null;
    const img = track.album?.images?.[0]?.url || null;
    const ms = track.duration_ms;
    const dur = ms
      ? `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`
      : null;
    return {
      thumbnail: img,
      spotifyId: track.id,
      previewUrl: track.preview_url || null,
      duration: dur,
      fullTitle: track.name,
      fullArtist: track.artists?.map((a) => a.name).join(", ") || artist,
    };
  } catch {
    return null;
  }
}

/* ── Cobalt download ────────────────────────────────────────── */
async function downloadAudio(videoId) {
  const r = await fetch(`/api/download?videoId=${videoId}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const blob = await r.blob();
  if (blob.size < 10000) throw new Error("blob too small");
  return blob;
}

/* ── AI chat ────────────────────────────────────────────────── */
async function aiChat(messages) {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  return d?.content?.[0]?.text || d?.choices?.[0]?.message?.content || "";
}

const CHIPS = ["chill vibes", "hype workout", "late night drive", "sad hours", "focus mode", "k-pop bops"];

export default function App() {
  const [playlist, setPlaylist] = useState([]);
  const [plName, setPlName] = useState("My Playlist");
  const [tab, setTab] = useState("playlist");
  const [query, setQuery] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [aiMsgs, setAiMsgs] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", artist: "", duration: "" });
  const [currentIdx, setCurrentIdx] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [dlStatus, setDlStatus] = useState({});
  const [offlineTracks, setOfflineTracks] = useState([]);

  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const playlistRef = useRef(playlist);
  const blobUrlsRef = useRef({});
  const audioRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  useEffect(() => { playlistRef.current = playlist; }, [playlist]);

  // Load offline tracks
  useEffect(() => {
    IDB.getAll().then(setOfflineTracks).catch(() => {});
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) { ytReadyRef.current = true; return; }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      ytReadyRef.current = true;
      ytPlayerRef.current = new window.YT.Player("yt-player", {
        height: "180", width: "320",
        playerVars: { autoplay: 1, controls: 0, playsinline: 1, mute: 0 },
        events: {
          onReady: (e) => {
            e.target.setVolume(100);
            e.target.unMute();
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) setPlaying(true);
            if (e.data === window.YT.PlayerState.PAUSED) setPlaying(false);
            if (e.data === window.YT.PlayerState.ENDED) skipNext();
          },
        },
      });
    };
  }, []);

  const currentTrack = tab === "offline"
    ? offlineTracks[currentIdx] || null
    : playlist[currentIdx] || null;

  /* ── Play track ─────────────────────────────────────────────── */
  const playTrack = useCallback((idx, trackList) => {
    const list = trackList || (tab === "offline" ? offlineTracks : playlistRef.current);
    const t = list[idx];
    if (!t) return;
    setCurrentIdx(idx);
    setPlaying(true);

    clearTimeout(autoSaveTimerRef.current);

    // Offline blob
    if (t.blobUrl || blobUrlsRef.current[t.videoId]) {
      const url = t.blobUrl || blobUrlsRef.current[t.videoId];
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const a = new Audio(url);
      audioRef.current = a;
      a.play().catch(() => {});
      a.onended = () => skipNext();
      return;
    }

    // YouTube
    if (t.videoId) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const doPlay = (player) => {
        player.unMute();
        player.setVolume(100);
        player.loadVideoById(t.videoId);
      };
      if (ytPlayerRef.current?.loadVideoById) {
        doPlay(ytPlayerRef.current);
      } else {
        const check = setInterval(() => {
          if (ytPlayerRef.current?.loadVideoById) {
            doPlay(ytPlayerRef.current);
            clearInterval(check);
          }
        }, 200);
      }
      // Auto-save after 4s
      autoSaveTimerRef.current = setTimeout(() => {
        if (!blobUrlsRef.current[t.videoId]) downloadAndSave(t);
      }, 4000);
    }
  }, [tab, offlineTracks]);

  const skipNext = useCallback(() => {
    const list = tab === "offline" ? offlineTracks : playlistRef.current;
    setCurrentIdx((i) => {
      const next = (i ?? -1) + 1;
      if (next < list.length) { setTimeout(() => playTrack(next, list), 100); return next; }
      setPlaying(false); return i;
    });
  }, [tab, offlineTracks, playTrack]);

  const skipPrev = useCallback(() => {
    setCurrentIdx((i) => {
      const prev = (i ?? 1) - 1;
      if (prev >= 0) { setTimeout(() => playTrack(prev), 100); return prev; }
      return i;
    });
  }, [playTrack]);

  const togglePlay = useCallback(() => {
    if (currentIdx === null) { playTrack(0); return; }
    if (audioRef.current) {
      if (playing) audioRef.current.pause(); else audioRef.current.play();
      setPlaying(!playing); return;
    }
    if (ytPlayerRef.current) {
      playing ? ytPlayerRef.current.pauseVideo() : ytPlayerRef.current.playVideo();
    }
  }, [currentIdx, playing, playTrack]);

  /* ── Download & save ────────────────────────────────────────── */
  const downloadAndSave = useCallback(async (track) => {
    if (!track.videoId) return;
    if (dlStatus[track.videoId] === "loading") return;
    setDlStatus((s) => ({ ...s, [track.videoId]: "loading" }));
    try {
      const blob = await downloadAudio(track.videoId);
      const url = URL.createObjectURL(blob);
      blobUrlsRef.current[track.videoId] = url;
      setDlStatus((s) => ({ ...s, [track.videoId]: "done" }));
      const rec = {
        videoId: track.videoId, title: track.title, artist: track.artist,
        thumbnail: track.thumbnail, duration: track.duration, blobUrl: url,
      };
      await IDB.save(rec);
      setOfflineTracks(await IDB.getAll());
    } catch {
      setDlStatus((s) => ({ ...s, [track.videoId]: "error" }));
    }
  }, [dlStatus]);

  /* ── Add track ──────────────────────────────────────────────── */
  const addTrack = useCallback(async (track) => {
    if (playlistRef.current.find((t) => t.title === track.title && t.artist === track.artist)) return;
    const id = Date.now() + Math.random();
    setPlaylist((p) => [...p, { ...track, id, videoId: null, thumbnail: null, ytStatus: "searching" }]);

    const [yt, spotify] = await Promise.all([
      ytSearch(track.title, track.artist),
      spotifySearch(track.title, track.artist),
    ]);

    setPlaylist((p) =>
      p.map((t) =>
        t.id === id
          ? {
              ...t,
              videoId: yt?.videoId || null,
              thumbnail: spotify?.thumbnail || yt?.thumbnail || null,
              duration: spotify?.duration || track.duration || null,
              title: spotify?.fullTitle || track.title,
              artist: spotify?.fullArtist || track.artist,
              ytStatus: yt?.videoId ? "found" : "notfound",
              hasSpotify: !!spotify,
            }
          : t
      )
    );

    if (yt?.videoId && blobUrlsRef.current[yt.videoId]) {
      setDlStatus((s) => ({ ...s, [yt.videoId]: "done" }));
    }
  }, []);

  /* ── AI generate ────────────────────────────────────────────── */
  const sendAI = useCallback(async (userMsg) => {
    const msg = userMsg || aiInput.trim();
    if (!msg || aiLoading) return;
    setAiInput("");
    setAiLoading(true);
    setShowAI(true);
    const newMsgs = [...aiMsgs, { role: "user", content: msg }];
    setAiMsgs([...newMsgs, { role: "thinking", content: "thinking…" }]);

    try {
      const systemPrompt = `You are a music playlist AI. When asked for a playlist, respond ONLY with a JSON array like:
[{"title":"Song Name","artist":"Artist Name","duration":"3:45"},...]
Include 6-10 songs. No explanations, just the JSON array.`;
      const reply = await aiChat([
        { role: "system", content: systemPrompt },
        ...newMsgs,
      ]);

      let songs = [];
      try {
        const match = reply.match(/\[[\s\S]*\]/);
        if (match) songs = JSON.parse(match[0]);
      } catch { /* not JSON */ }

      const displayReply = songs.length
        ? `Adding ${songs.length} songs to your playlist ✦`
        : reply;

      setAiMsgs([...newMsgs, { role: "assistant", content: displayReply }]);
      if (songs.length) {
        setTab("playlist");
        songs.forEach((s) => addTrack(s));
      }
    } catch (e) {
      setAiMsgs([...newMsgs, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, aiLoading, aiMsgs, addTrack]);

  const handleGenerate = () => {
    if (query.trim()) {
      sendAI(query.trim());
      setQuery("");
    } else {
      setShowAI((v) => !v);
    }
  };

  /* ── Add song form submit ────────────────────────────────────── */
  const submitAdd = () => {
    if (!addForm.title.trim()) return;
    addTrack({ title: addForm.title.trim(), artist: addForm.artist.trim(), duration: addForm.duration.trim() });
    setAddForm({ title: "", artist: "", duration: "" });
    setShowAdd(false);
    setTab("playlist");
  };

  /* ── Render track row ───────────────────────────────────────── */
  const renderRow = (t, idx, isOffline = false) => {
    const isPlaying = currentIdx === idx && playing && tab === (isOffline ? "offline" : "playlist");
    const dl = dlStatus[t.videoId];
    const isOfflineSaved = !!offlineTracks.find((o) => o.videoId === t.videoId);

    return (
      <div
        key={t.id || t.videoId}
        className={`track-row${isPlaying ? " playing" : ""}`}
        onClick={() => { setTab(isOffline ? "offline" : "playlist"); playTrack(idx); }}
      >
        <div className="track-num">
          {isPlaying ? "▶" : idx + 1}
        </div>

        {t.thumbnail ? (
          <img className="track-thumb" src={t.thumbnail} alt="" />
        ) : (
          <div className="track-thumb-placeholder">♪</div>
        )}

        <div className="track-info">
          <div className="track-title">
            {t.hasSpotify && <span className="spotify-dot" title="Spotify metadata" />}
            {t.title}
          </div>
          <div className="track-artist">{t.artist || "—"}</div>
        </div>

        {t.ytStatus === "searching" && (
          <span className="track-status">searching…</span>
        )}
        {t.ytStatus === "notfound" && (
          <span className="track-status">not found</span>
        )}

        {t.duration && <div className="track-dur">{t.duration}</div>}

        <div className="track-actions" onClick={(e) => e.stopPropagation()}>
          {!isOffline && t.videoId && (
            <button
              className={`t-btn${dl === "done" || isOfflineSaved ? " dl-done" : dl === "error" ? " dl-err" : dl === "loading" ? " dl-ing" : ""}`}
              title={dl === "done" || isOfflineSaved ? "Saved offline" : dl === "error" ? "Retry download" : "Save offline"}
              onClick={() => downloadAndSave(t)}
              disabled={dl === "loading"}
            >
              {dl === "done" || isOfflineSaved ? "⚡" : dl === "loading" ? "…" : dl === "error" ? "!" : "⬇"}
            </button>
          )}
          {!isOffline && t.ytStatus === "notfound" && (
            <button
              className="t-btn retry"
              title="Retry search"
              onClick={() => {
                setPlaylist((p) => p.map((x) => x.id === t.id ? { ...x, ytStatus: "searching" } : x));
                ytSearch(t.title, t.artist).then((yt) => {
                  if (yt?.videoId) setPlaylist((p) => p.map((x) => x.id === t.id ? { ...x, videoId: yt.videoId, thumbnail: x.thumbnail || yt.thumbnail, ytStatus: "found" } : x));
                });
              }}
            >↺</button>
          )}
          <button
            className="t-btn remove"
            title="Remove"
            onClick={() => {
              if (isOffline) {
                IDB.del(t.videoId).then(() => IDB.getAll().then(setOfflineTracks));
              } else {
                setPlaylist((p) => p.filter((_, i) => i !== idx));
              }
            }}
          >×</button>
        </div>
      </div>
    );
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <>
      <style>{STYLES}</style>
      <div id="yt-player-wrap"><div id="yt-player" /></div>

      <div className="app">
        {/* HEADER */}
        <div className="header">
          <div className="logo">Playlist AI</div>
          <div className="input-row">
            <input
              className="main-input"
              placeholder="Type a vibe, genre, or mood…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button className="gen-btn" onClick={handleGenerate} disabled={aiLoading}>
              {aiLoading ? "…" : "Generate"}
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          <button className={`tab${tab === "playlist" ? " active" : ""}`} onClick={() => setTab("playlist")}>
            Playlist {playlist.length > 0 && <span className="tab-badge">{playlist.length}</span>}
          </button>
          <button className={`tab${tab === "offline" ? " active" : ""}`} onClick={() => setTab("offline")}>
            Downloads {offlineTracks.length > 0 && <span className="tab-badge">{offlineTracks.length}</span>}
          </button>
        </div>

        {/* AI DRAWER */}
        {showAI && (
          <div className="ai-drawer">
            {aiMsgs.length > 0 && (
              <div className="ai-msgs">
                {aiMsgs.map((m, i) => (
                  <div key={i} className={`ai-msg ${m.role}`}>
                    {m.role === "user" ? `you: ${m.content}` : m.content}
                  </div>
                ))}
              </div>
            )}
            {aiMsgs.length === 0 && (
              <div className="chip-row">
                {CHIPS.map((c) => (
                  <button key={c} className="chip" onClick={() => sendAI(c)}>{c}</button>
                ))}
              </div>
            )}
            <div className="ai-input-row">
              <input
                className="ai-input"
                placeholder="Ask for any playlist…"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAI()}
                autoFocus
              />
              <button className="ai-send" onClick={() => sendAI()} disabled={aiLoading}>
                {aiLoading ? "…" : "→"}
              </button>
            </div>
          </div>
        )}

        {/* ADD SONG FORM */}
        {showAdd && (
          <div className="add-form">
            <div className="add-form-row">
              <input className="add-input" placeholder="Song title *" value={addForm.title}
                onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && submitAdd()} autoFocus />
              <input className="add-input" placeholder="Artist" value={addForm.artist}
                onChange={(e) => setAddForm((f) => ({ ...f, artist: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && submitAdd()} />
              <input className="add-input" placeholder="Duration (e.g. 3:24)" value={addForm.duration}
                style={{ maxWidth: 120 }}
                onChange={(e) => setAddForm((f) => ({ ...f, duration: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && submitAdd()} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="add-submit" onClick={submitAdd}>Add Song</button>
              <button className="add-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* SCROLL AREA */}
        <div className="scroll-area">
          {tab === "playlist" && (
            <>
              <div className="pl-header">
                <input className="pl-name" value={plName} onChange={(e) => setPlName(e.target.value)} />
                <div className="pl-actions">
                  <button className="icon-btn" onClick={() => { setShowAdd((v) => !v); setShowAI(false); }}>
                    + Add Song
                  </button>
                  {playlist.length > 0 && (
                    <button className="icon-btn danger" onClick={() => { setPlaylist([]); setCurrentIdx(null); }}>
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {playlist.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">♫</div>
                  <div className="empty-text">Your playlist is empty</div>
                  <div className="empty-sub">Type a vibe above or add songs manually</div>
                </div>
              ) : (
                playlist.map((t, i) => renderRow(t, i, false))
              )}
            </>
          )}

          {tab === "offline" && (
            <>
              <div className="pl-header">
                <span style={{ fontSize: 15, fontWeight: 600 }}>Downloads</span>
              </div>
              {offlineTracks.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">⚡</div>
                  <div className="empty-text">No offline tracks yet</div>
                  <div className="empty-sub">Hit ⬇ on any song to save it for offline playback</div>
                </div>
              ) : (
                offlineTracks.map((t, i) => renderRow(t, i, true))
              )}
            </>
          )}
        </div>

        {/* PLAYER BAR */}
        {currentTrack && (
          <div className="player">
            {currentTrack.thumbnail ? (
              <img className="player-thumb" src={currentTrack.thumbnail} alt="" />
            ) : (
              <div className="player-thumb-ph">♪</div>
            )}
            <div className="player-info">
              <div className="player-title">{currentTrack.title}</div>
              <div className="player-artist">{currentTrack.artist}</div>
            </div>
            <div className="player-controls">
              <button className="p-btn" onClick={skipPrev}>⏮</button>
              <button className="p-btn play" onClick={togglePlay}>{playing ? "⏸" : "▶"}</button>
              <button className="p-btn" onClick={skipNext}>⏭</button>
            </div>
            <div className="player-src">
              {blobUrlsRef.current[currentTrack.videoId] ? "⚡ offline" : "▶ yt"}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
