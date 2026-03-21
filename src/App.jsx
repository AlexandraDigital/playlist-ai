import { useState, useRef, useEffect, useCallback } from "react";

/* ── IndexedDB helpers ──────────────────────────────────────── */
const IDB = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      const r = indexedDB.open("playlist-ai", 2);
      r.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("offline"))
          db.createObjectStore("offline", { keyPath: "videoId" });
      };
      r.onsuccess = (e) => { this._db = e.target.result; res(this._db); };
      r.onerror = (e) => rej(e.target.error);
    });
  },
  async save(rec) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction("offline", "readwrite");
      // Don't store the blobUrl (session-only), store the blob itself
      const { blobUrl, ...toStore } = rec;
      tx.objectStore("offline").put(toStore);
      tx.oncomplete = res; tx.onerror = rej;
    });
  },
  async getAll() {
    const db = await this.open();
    return new Promise((res, rej) => {
      const req = db.transaction("offline", "readonly").objectStore("offline").getAll();
      req.onsuccess = () => {
        const records = req.result || [];
        // Recreate blob URLs from stored audio blobs
        const results = records.map((rec) => {
          if (rec.audioBlob) {
            const url = URL.createObjectURL(rec.audioBlob);
            return { ...rec, blobUrl: url };
          }
          return rec;
        });
        res(results);
      };
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

  /* MY PLAYLISTS */
  .pl-list { display:flex; flex-direction:column; gap:8px; padding-bottom:12px; }
  .pl-card { background:var(--card); border:1px solid var(--border); border-radius:10px;
    padding:13px 15px; display:flex; align-items:center; gap:12px; cursor:pointer; transition:border-color .15s; }
  .pl-card:hover { border-color:#2a2a2a; }
  .pl-card-icon { width:40px; height:40px; border-radius:8px; background:var(--purple-dim);
    display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
  .pl-card-info { flex:1; min-width:0; }
  .pl-card-name { font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pl-card-count { font-size:12px; color:var(--muted); margin-top:2px; }
  .pl-card-actions { display:flex; gap:6px; }
  .save-pl-btn { padding:8px 14px; background:var(--purple); border:none; border-radius:8px;
    color:#fff; font-family:var(--font); font-size:12px; font-weight:500; cursor:pointer; transition:background .15s; white-space:nowrap; }
  .save-pl-btn:hover { background:var(--purple2); }
  .save-pl-btn:disabled { opacity:.4; cursor:not-allowed; }

  /* UPLOAD */
  .t-btn.upload { }
  .t-btn.upload:hover { border-color:rgba(168,85,247,.4); color:var(--purple-light); }

  /* AI SUGGESTIONS */
  .suggest-list { display:flex; flex-direction:column; gap:4px; max-height:220px; overflow-y:auto; margin-top:4px; }
  .suggest-row { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px;
    border:1px solid var(--border); background:var(--card); cursor:pointer; transition:all .15s; }
  .suggest-row.selected { border-color:rgba(168,85,247,.5); background:var(--purple-dim); }
  .suggest-check { width:18px; height:18px; border-radius:5px; border:1.5px solid var(--border);
    display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; transition:all .15s; }
  .suggest-row.selected .suggest-check { background:var(--purple); border-color:var(--purple); color:#fff; }
  .suggest-song { flex:1; min-width:0; }
  .suggest-title { font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .suggest-artist { font-size:11px; color:var(--sub); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .suggest-dur { font-size:11px; color:var(--muted); flex-shrink:0; }
  .suggest-actions { display:flex; gap:6px; margin-top:8px; }
  .suggest-add-btn { flex:1; padding:9px; background:var(--purple); border:none; border-radius:8px;
    color:#fff; font-family:var(--font); font-size:13px; font-weight:500; cursor:pointer; transition:background .15s; }
  .suggest-add-btn:hover { background:var(--purple2); }
  .suggest-add-btn:disabled { opacity:.4; cursor:not-allowed; }
  .suggest-all-btn { padding:9px 14px; background:transparent; border:1px solid var(--border); border-radius:8px;
    color:var(--muted); font-family:var(--font); font-size:12px; cursor:pointer; white-space:nowrap; }

  /* INSTALL + PRO HEADER */
  .header-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .header-badges { display:flex; gap:8px; align-items:center; }
  .install-btn { padding:6px 12px; background:transparent; border:1px solid var(--border); border-radius:8px;
    color:var(--muted); font-family:var(--font); font-size:12px; cursor:pointer; transition:all .15s; }
  .install-btn:hover { border-color:#333; color:var(--sub); }
  .pro-btn { padding:6px 12px; background:linear-gradient(135deg,#a855f7,#7c3aed); border:none; border-radius:8px;
    color:#fff; font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; letter-spacing:.3px; }

  /* PRO MODAL */
  .pro-overlay { position:fixed; inset:0; background:rgba(0,0,0,.88); backdrop-filter:blur(10px); z-index:100;
    display:flex; align-items:center; justify-content:center; padding:20px; }
  .pro-modal { background:#0c0c0c; border:1px solid #2a1f3d; border-radius:20px; width:100%; max-width:380px; overflow:hidden; }
  .pro-header { background:linear-gradient(160deg,#1a0a2e,#0d0020,#000); padding:28px 24px 20px; text-align:center; }
  .pro-crown { font-size:38px; margin-bottom:10px; }
  .pro-title { font-size:24px; font-weight:700; letter-spacing:-0.5px;
    background:linear-gradient(135deg,#a855f7,#c084fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .pro-subtitle { font-size:13px; color:var(--sub); margin-top:6px; }
  .pro-features { padding:20px 24px; display:flex; flex-direction:column; gap:13px; }
  .pro-feat { display:flex; align-items:center; gap:12px; }
  .pro-feat-icon { width:32px; height:32px; border-radius:8px; background:var(--purple-dim);
    display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
  .pro-feat-text { flex:1; }
  .pro-feat-name { font-size:13px; font-weight:500; }
  .pro-feat-desc { font-size:11px; color:var(--sub); margin-top:1px; }
  .pro-divider { height:1px; background:var(--border); margin:0 24px; }
  .pro-pricing { padding:16px 24px 8px; text-align:center; }
  .pro-price { font-size:30px; font-weight:700; color:var(--text); }
  .pro-price span { font-size:13px; font-weight:400; color:var(--sub); }
  .pro-actions { padding:14px 24px 22px; display:flex; flex-direction:column; gap:8px; }
  .pro-cta { width:100%; padding:14px; background:linear-gradient(135deg,#a855f7,#7c3aed); border:none; border-radius:12px;
    color:#fff; font-family:var(--font); font-size:15px; font-weight:600; cursor:pointer; }
  .pro-skip { width:100%; padding:10px; background:transparent; border:1px solid var(--border); border-radius:12px;
    color:var(--muted); font-family:var(--font); font-size:13px; cursor:pointer; }

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
  const [savedPlaylists, setSavedPlaylists] = useState(() => {
    try { return JSON.parse(localStorage.getItem("saved-playlists") || "[]"); } catch { return []; }
  });
  const [newPlName, setNewPlName] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]); // songs AI suggested, not yet added
  const [aiSelected, setAiSelected] = useState(new Set()); // indices of selected suggestions
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showPro, setShowPro] = useState(false);

  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const playlistRef = useRef(playlist);
  const blobUrlsRef = useRef({});
  const audioRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const uploadFileRef = useRef(null);
  const uploadTargetRef = useRef(null);

  useEffect(() => { playlistRef.current = playlist; }, [playlist]);

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Media Session action handlers (lock screen controls)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => togglePlay());
    navigator.mediaSession.setActionHandler('nexttrack', () => skipNext());
    navigator.mediaSession.setActionHandler('previoustrack', () => skipPrev());
  }, []);

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

    // Media Session: lock screen / notification controls
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title || 'Unknown',
        artist: t.artist || '',
        album: 'Playlist AI',
        artwork: t.thumbnail
          ? [{ src: t.thumbnail, sizes: '640x640', type: 'image/jpeg' }]
          : [],
      });
      navigator.mediaSession.playbackState = 'playing';
    }

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
        thumbnail: track.thumbnail, duration: track.duration,
        audioBlob: blob, // store actual blob so it survives page reloads
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
        ? `Found ${songs.length} songs — pick the ones you want ✦`
        : reply;

      setAiMsgs([...newMsgs, { role: "assistant", content: displayReply }]);
      if (songs.length) {
        setAiSuggestions(songs);
        setAiSelected(new Set(songs.map((_, i) => i))); // all selected by default
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

  /* ── Upload audio file ──────────────────────────────────────── */
  const handleUploadFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const target = uploadTargetRef.current;
    if (!target) return;

    const url = URL.createObjectURL(file);

    if (target.isNew) {
      // New offline track from Downloads tab upload
      const title = file.name.replace(/\.[^/.]+$/, "");
      const videoId = `upload_${Date.now()}`;
      blobUrlsRef.current[videoId] = url;
      const rec = { videoId, title, artist: "", thumbnail: null, duration: null, audioBlob: file };
      await IDB.save(rec);
      setOfflineTracks(await IDB.getAll());
    } else {
      // Attach audio to existing playlist track
      const t = target.track;
      const videoId = t.videoId || `upload_${Date.now()}`;
      blobUrlsRef.current[videoId] = url;
      setDlStatus((s) => ({ ...s, [videoId]: "done" }));
      const rec = {
        videoId, title: t.title, artist: t.artist,
        thumbnail: t.thumbnail, duration: t.duration, audioBlob: file,
      };
      await IDB.save(rec);
      setOfflineTracks(await IDB.getAll());
      if (!t.videoId) setPlaylist((p) => p.map((x) => x.id === t.id ? { ...x, videoId } : x));
    }
  }, []);

  /* ── Save / load playlists ──────────────────────────────────── */
  const savePlaylist = useCallback(() => {
    if (!playlist.length) return;
    const name = plName.trim() || "Untitled";
    const entry = {
      id: Date.now(),
      name,
      songs: playlist.map(({ title, artist, videoId, thumbnail, duration, hasSpotify }) =>
        ({ title, artist, videoId, thumbnail, duration, hasSpotify })),
    };
    const updated = [entry, ...savedPlaylists.filter((p) => p.name !== name)];
    setSavedPlaylists(updated);
    localStorage.setItem("saved-playlists", JSON.stringify(updated));
  }, [playlist, plName, savedPlaylists]);

  const loadPlaylist = useCallback((pl) => {
    setPlaylist(pl.songs.map((s) => ({ ...s, id: Date.now() + Math.random(), ytStatus: s.videoId ? "found" : "notfound" })));
    setPlName(pl.name);
    setTab("playlist");
    setCurrentIdx(null);
  }, []);

  const deletePlaylist = useCallback((id) => {
    const updated = savedPlaylists.filter((p) => p.id !== id);
    setSavedPlaylists(updated);
    localStorage.setItem("saved-playlists", JSON.stringify(updated));
  }, [savedPlaylists]);

  const createNewPlaylist = useCallback(() => {
    const name = newPlName.trim() || "New Playlist";
    setPlaylist([]);
    setPlName(name);
    setNewPlName("");
    setCurrentIdx(null);
    setTab("playlist");
  }, [newPlName]);

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
          {!isOffline && (
            <button
              className="t-btn upload"
              title="Upload audio file"
              onClick={() => { uploadTargetRef.current = { track: t }; uploadFileRef.current?.click(); }}
            >⬆</button>
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
      <input
        ref={uploadFileRef}
        type="file"
        accept="audio/*"
        style={{ display: "none" }}
        onChange={handleUploadFile}
      />

      <div className="app">
        {/* HEADER */}
        <div className="header">
          <div className="header-top">
            <div className="logo">Playlist AI</div>
            <div className="header-badges">
              {installPrompt && (
                <button
                  className="install-btn"
                  onClick={async () => {
                    installPrompt.prompt();
                    const { outcome } = await installPrompt.userChoice;
                    if (outcome === 'accepted') setInstallPrompt(null);
                  }}
                >⬇ Install</button>
              )}
              <button className="pro-btn" onClick={() => setShowPro(true)}>✦ Pro</button>
            </div>
          </div>
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
          <button className={`tab${tab === "myplaylists" ? " active" : ""}`} onClick={() => setTab("myplaylists")}>
            My Playlists {savedPlaylists.length > 0 && <span className="tab-badge">{savedPlaylists.length}</span>}
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
            {aiSuggestions.length > 0 && (
              <>
                <div className="suggest-list">
                  {aiSuggestions.map((s, i) => (
                    <div
                      key={i}
                      className={`suggest-row${aiSelected.has(i) ? " selected" : ""}`}
                      onClick={() => setAiSelected((prev) => {
                        const next = new Set(prev);
                        next.has(i) ? next.delete(i) : next.add(i);
                        return next;
                      })}
                    >
                      <div className="suggest-check">{aiSelected.has(i) ? "✓" : ""}</div>
                      <div className="suggest-song">
                        <div className="suggest-title">{s.title}</div>
                        <div className="suggest-artist">{s.artist}</div>
                      </div>
                      {s.duration && <div className="suggest-dur">{s.duration}</div>}
                    </div>
                  ))}
                </div>
                <div className="suggest-actions">
                  <button
                    className="suggest-add-btn"
                    disabled={aiSelected.size === 0}
                    onClick={() => {
                      const toAdd = aiSuggestions.filter((_, i) => aiSelected.has(i));
                      toAdd.forEach((s) => addTrack(s));
                      setAiSuggestions([]);
                      setAiSelected(new Set());
                      setTab("playlist");
                    }}
                  >
                    Add {aiSelected.size} song{aiSelected.size !== 1 ? "s" : ""} →
                  </button>
                  <button
                    className="suggest-all-btn"
                    onClick={() => setAiSelected(new Set(aiSuggestions.map((_, i) => i)))}
                  >All</button>
                  <button
                    className="suggest-all-btn"
                    onClick={() => setAiSelected(new Set())}
                  >None</button>
                </div>
              </>
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
                    <button className="save-pl-btn" onClick={savePlaylist} title="Save playlist to My Playlists">
                      Save ✦
                    </button>
                  )}
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
                <div className="pl-actions">
                  <button
                    className="icon-btn"
                    onClick={() => { uploadTargetRef.current = { isNew: true }; uploadFileRef.current?.click(); }}
                  >
                    + Upload File
                  </button>
                </div>
              </div>
              {offlineTracks.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">⚡</div>
                  <div className="empty-text">No offline tracks yet</div>
                  <div className="empty-sub">Hit ⬇ or ⬆ on any song, or upload a file above</div>
                </div>
              ) : (
                offlineTracks.map((t, i) => renderRow(t, i, true))
              )}
            </>
          )}

          {tab === "myplaylists" && (
            <>
              <div className="pl-header">
                <span style={{ fontSize: 15, fontWeight: 600 }}>My Playlists</span>
              </div>
              {/* New playlist form */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input
                  className="add-input"
                  placeholder="New playlist name…"
                  value={newPlName}
                  onChange={(e) => setNewPlName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createNewPlaylist()}
                />
                <button className="save-pl-btn" onClick={createNewPlaylist}>+ New</button>
              </div>
              {savedPlaylists.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">🎵</div>
                  <div className="empty-text">No saved playlists yet</div>
                  <div className="empty-sub">Build a playlist and hit Save ✦ to keep it</div>
                </div>
              ) : (
                <div className="pl-list">
                  {savedPlaylists.map((pl) => (
                    <div key={pl.id} className="pl-card" onClick={() => loadPlaylist(pl)}>
                      <div className="pl-card-icon">🎵</div>
                      <div className="pl-card-info">
                        <div className="pl-card-name">{pl.name}</div>
                        <div className="pl-card-count">{pl.songs.length} songs</div>
                      </div>
                      <div className="pl-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="save-pl-btn" onClick={() => loadPlaylist(pl)}>Load</button>
                        <button
                          className="icon-btn danger"
                          onClick={() => deletePlaylist(pl.id)}
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
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

      {/* PRO MODAL */}
      {showPro && (
        <div className="pro-overlay" onClick={() => setShowPro(false)}>
          <div className="pro-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pro-header">
              <div className="pro-crown">👑</div>
              <div className="pro-title">Playlist AI Pro</div>
              <div className="pro-subtitle">Unlock the full experience</div>
            </div>
            <div className="pro-features">
              {[
                ['🎵', 'Unlimited AI Generations', 'No limits on playlist creation'],
                ['🎧', 'Smart Mood Detection', 'BPM matching & energy analysis'],
                ['🔄', 'Cross-device Sync', 'Your playlists on every device'],
                ['👥', 'Collaborative Playlists', 'Share & edit with friends'],
                ['📊', 'Listening Stats', 'Track your music habits'],
                ['⚡', 'Auto-offline Everything', 'Auto-save all songs as you play'],
              ].map(([icon, name, desc]) => (
                <div key={name} className="pro-feat">
                  <div className="pro-feat-icon">{icon}</div>
                  <div className="pro-feat-text">
                    <div className="pro-feat-name">{name}</div>
                    <div className="pro-feat-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pro-divider" />
            <div className="pro-pricing">
              <div className="pro-price">$4.99 <span>/ month</span></div>
            </div>
            <div className="pro-actions">
              <button
                className="pro-cta"
                onClick={() => alert('Coming soon! Pro payments launching shortly 🚀')}
              >
                Get Pro →
              </button>
              <button className="pro-skip" onClick={() => setShowPro(false)}>Maybe later</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
