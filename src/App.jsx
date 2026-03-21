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

  /* Hidden YouTube player - must be in DOM for IFrame API */
  #yt-player { position:fixed; bottom:-5px; right:-5px; width:2px; height:2px; opacity:0; pointer-events:none; z-index:-1; }

  /* HEADER */
  .header { padding:22px 24px 14px; }
  .logo { font-size:30px; font-weight:700; letter-spacing:-1.5px;
    background:linear-gradient(135deg,#a855f7,#7c3aed); -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    display:inline-block; margin-bottom:14px; }
  .input-row { display:flex; gap:8px; align-items:center; }
  .main-input { flex:1; background:var(--card); border:1px solid var(--border); border-radius:10px;
    padding:11px 15px; font-size:14px; color:var(--text); font-family:var(--font); outline:none; transition:border-color .15s; }
  .main-input:focus { border-color:#333; }
  .main-input::placeholder { color:var(--muted); }
  .gen-btn { padding:11px 20px; background:var(--purple); border:none; border-radius:10px;
    color:#fff; font-family:var(--font); font-size:14px; font-weight:500; cursor:pointer; transition:background .15s; white-space:nowrap; }
  .gen-btn:hover { background:var(--purple2); }
  .gen-btn:disabled { opacity:.4; cursor:not-allowed; }
  .ai-btn { padding:11px 14px; background:transparent; border:1px solid var(--border); border-radius:10px;
    color:var(--muted); font-family:var(--font); font-size:13px; cursor:pointer; transition:all .15s; white-space:nowrap; }
  .ai-btn:hover, .ai-btn.active { border-color:var(--purple); color:var(--purple-light); }

  /* TABS */
  .tabs { display:flex; border-bottom:1px solid var(--border); padding:0 24px; }
  .tab { padding:11px 16px; font-size:13px; font-weight:500; color:var(--muted); background:transparent;
    border:none; border-bottom:2px solid transparent; cursor:pointer; font-family:var(--font); transition:all .15s; }
  .tab.active { color:var(--purple-light); border-bottom-color:var(--purple); }
  .tab-badge { display:inline-flex; align-items:center; justify-content:center;
    min-width:18px; height:18px; border-radius:9px; background:var(--purple-dim);
    font-size:10px; color:var(--purple-light); margin-left:5px; padding:0 4px; }

  /* AI DRAWER */
  .backdrop { position:fixed; inset:0; z-index:40; background:rgba(0,0,0,.6); }
  .backdrop.hidden { display:none; }
  .ai-drawer { position:fixed; z-index:50; left:0; right:0; max-width:840px; margin:0 auto;
    background:var(--surface); border:1px solid var(--border); border-top:none;
    overflow:hidden; transition:max-height .3s ease, opacity .25s; box-shadow:0 30px 80px rgba(0,0,0,.9); }
  .ai-drawer.open { max-height:520px; opacity:1; }
  .ai-drawer.closed { max-height:0; opacity:0; pointer-events:none; }
  .drawer-head { padding:12px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .drawer-label { font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:var(--muted); }
  .drawer-x { width:26px; height:26px; border-radius:6px; border:1px solid var(--border); background:transparent;
    color:var(--muted); cursor:pointer; font-size:13px; transition:all .12s; display:flex; align-items:center; justify-content:center; }
  .drawer-x:hover { border-color:var(--purple); color:var(--purple-light); }

  /* CHAT */
  .chat-scroll { overflow-y:auto; padding:16px 18px; display:flex; flex-direction:column; gap:12px; max-height:270px; }
  .msg { display:flex; gap:9px; animation:fadeUp .2s ease; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
  .msg-av { width:26px; height:26px; border-radius:6px; display:flex; align-items:center; justify-content:center;
    font-size:11px; flex-shrink:0; font-weight:600; }
  .msg-av.ai { background:var(--purple-dim); border:1px solid var(--purple); color:var(--purple-light); }
  .msg-av.user { background:rgba(255,255,255,.05); border:1px solid var(--border); color:var(--muted); }
  .msg-name { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); margin-bottom:4px; }
  .msg-text { font-size:13px; line-height:1.65; color:#999; }
  .mini-tracks { margin-top:10px; display:flex; flex-direction:column; gap:4px; }
  .mini-row { display:flex; align-items:center; gap:8px; background:var(--card); border:1px solid var(--border);
    border-radius:8px; padding:7px 10px; cursor:pointer; transition:border-color .12s; }
  .mini-row:hover { border-color:var(--purple); }
  .mini-n { color:var(--muted); font-size:11px; width:14px; flex-shrink:0; }
  .mini-info { flex:1; min-width:0; }
  .mini-title { font-size:12px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mini-artist { font-size:11px; color:var(--muted); margin-top:1px; }
  .mini-plus { color:var(--purple-light); font-size:16px; opacity:.5; flex-shrink:0; }
  .mini-row:hover .mini-plus { opacity:1; }
  .add-all { margin-top:5px; width:100%; padding:8px; background:var(--purple-dim); border:1px solid rgba(168,85,247,.3);
    color:var(--purple-light); border-radius:8px; font-size:12px; font-weight:500; cursor:pointer;
    font-family:var(--font); transition:background .12s; }
  .add-all:hover { background:rgba(168,85,247,.2); }
  .chips { display:flex; gap:6px; flex-wrap:wrap; padding:8px 18px; border-top:1px solid var(--border); }
  .chip { padding:5px 11px; border-radius:20px; border:1px solid var(--border); background:transparent;
    color:var(--muted); font-size:11px; cursor:pointer; transition:all .12s; font-family:var(--font); }
  .chip:hover { border-color:var(--purple); color:var(--purple-light); }
  .chat-foot { padding:10px 18px; border-top:1px solid var(--border); display:flex; gap:8px; }
  .chat-in { flex:1; background:var(--card); border:1px solid var(--border); border-radius:10px;
    padding:9px 13px; font-size:13px; color:var(--text); font-family:var(--font);
    resize:none; outline:none; transition:border-color .15s; min-height:38px; max-height:70px; }
  .chat-in:focus { border-color:#333; }
  .chat-in::placeholder { color:var(--muted); }
  .send-btn { width:38px; height:38px; background:var(--purple); border:none; border-radius:10px;
    color:#fff; font-size:14px; cursor:pointer; transition:background .15s; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; }
  .send-btn:hover { background:var(--purple2); }
  .send-btn:disabled { opacity:.35; cursor:not-allowed; }
  .dots { display:inline-flex; gap:4px; align-items:center; padding:4px 0; }
  .dots span { width:5px; height:5px; background:var(--purple); border-radius:50%;
    animation:bounce 1.1s ease-in-out infinite; }
  .dots span:nth-child(2){animation-delay:.18s} .dots span:nth-child(3){animation-delay:.36s}
  @keyframes bounce { 0%,80%,100%{transform:scale(.5);opacity:.3} 40%{transform:scale(1);opacity:1} }

  /* MAIN SCROLL */
  .main { overflow-y:auto; }

  /* PLAYLIST SECTION */
  .section { padding:20px 24px; display:flex; flex-direction:column; gap:14px; }
  .pl-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .pl-name-wrap { flex:1; }
  .pl-name { font-size:19px; font-weight:600; background:transparent; border:none;
    border-bottom:1.5px solid transparent; color:var(--text); outline:none; width:100%;
    padding-bottom:3px; font-family:var(--font); transition:border-color .2s; letter-spacing:-.3px; }
  .pl-name:focus { border-color:var(--purple); }
  .pl-meta { font-size:12px; color:var(--muted); margin-top:4px; }
  .pl-actions { display:flex; gap:7px; flex-shrink:0; }
  .btn { padding:7px 13px; border-radius:8px; font-size:12px; font-weight:500; cursor:pointer;
    font-family:var(--font); transition:all .15s; }
  .btn-p { background:var(--purple); border:1px solid var(--purple); color:#fff; }
  .btn-p:hover { background:var(--purple2); }
  .btn-g { background:transparent; border:1px solid var(--border); color:var(--muted); }
  .btn-g:hover { border-color:#333; color:var(--sub); }
  .track-list { display:flex; flex-direction:column; gap:3px; }
  .empty { text-align:center; padding:50px 20px; border:1.5px dashed var(--border); border-radius:12px; }
  .empty-icon { font-size:38px; margin-bottom:12px; opacity:.25; }
  .empty-title { font-size:15px; font-weight:600; color:var(--sub); margin-bottom:5px; }
  .empty-sub { font-size:12px; color:var(--muted); line-height:1.6; }

  /* TRACK ROW */
  .track-row { display:flex; align-items:center; gap:10px; padding:10px 12px;
    background:var(--card); border:1px solid var(--border); border-radius:10px; transition:border-color .12s; animation:fadeUp .2s ease; }
  .track-row:hover { border-color:#2a2a2a; }
  .track-row.playing { border-color:rgba(168,85,247,.4); background:rgba(168,85,247,.05); }
  .track-num { width:18px; text-align:center; font-size:12px; color:var(--muted); flex-shrink:0; }
  .track-thumb { width:46px; height:34px; border-radius:6px; overflow:hidden; flex-shrink:0;
    background:#1a1a1a; display:flex; align-items:center; justify-content:center;
    font-size:14px; cursor:pointer; position:relative; transition:transform .1s; }
  .track-thumb:hover { transform:scale(1.06); }
  .track-thumb img { width:100%; height:100%; object-fit:cover; }
  .thumb-ov { position:absolute; inset:0; background:rgba(0,0,0,.65);
    display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .12s; }
  .track-thumb:hover .thumb-ov, .track-row.playing .thumb-ov { opacity:1; }
  .play-ic { width:18px; height:18px; border-radius:3px; background:var(--purple);
    display:flex; align-items:center; justify-content:center; font-size:8px; color:#fff; }
  .offline-ic { width:18px; height:18px; border-radius:50%; background:var(--green);
    display:flex; align-items:center; justify-content:center; font-size:8px; color:#fff; }
  .track-info { flex:1; min-width:0; }
  .track-title { font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .track-artist { font-size:11px; color:var(--muted); margin-top:2px; }
  .track-st { font-size:9px; text-transform:uppercase; letter-spacing:.8px; margin-top:2px; }
  .track-st.found { color:#333; } .track-st.searching { color:var(--muted); }
  .track-st.notfound { color:#2a2a2a; } .track-st.offline { color:var(--green); }
  .track-genre { font-size:10px; background:var(--purple-dim); border:1px solid rgba(168,85,247,.15);
    color:var(--purple-light); padding:2px 8px; border-radius:20px; white-space:nowrap; flex-shrink:0; }
  .track-dur { font-size:11px; color:var(--muted); flex-shrink:0; min-width:30px; text-align:right; }
  .track-act { width:28px; height:28px; border-radius:7px; border:none; background:transparent;
    color:var(--muted); cursor:pointer; flex-shrink:0; opacity:0; transition:all .1s;
    display:flex; align-items:center; justify-content:center; font-size:13px; }
  .track-row:hover .track-act { opacity:1; }
  .track-act:hover { background:rgba(168,85,247,.15); color:var(--purple-light); }
  .track-act.dl-done { opacity:1; color:var(--green); }
  .track-act.dl-doing { opacity:1; color:var(--purple-light); }
  .track-act.dl-err { opacity:1; color:var(--red); }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .spin { animation:spin .7s linear infinite; display:inline-block; }
  .bars { display:inline-flex; gap:2px; align-items:flex-end; height:12px; }
  .bars span { width:3px; background:var(--purple-light); border-radius:1px;
    animation:bar .6s ease-in-out infinite alternate; }
  .bars span:nth-child(1){height:4px} .bars span:nth-child(2){height:9px;animation-delay:.15s} .bars span:nth-child(3){height:12px;animation-delay:.3s}
  @keyframes bar { from{transform:scaleY(.25)} to{transform:scaleY(1)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

  /* ADD SONG MODAL */
  .modal-back { position:fixed; inset:0; z-index:60; background:rgba(0,0,0,.75); display:flex; align-items:center; justify-content:center; padding:20px; }
  .modal { background:var(--card); border:1px solid var(--border); border-radius:14px; padding:22px; width:100%; max-width:400px; }
  .modal-title { font-size:16px; font-weight:600; margin-bottom:16px; }
  .field { margin-bottom:12px; }
  .field label { display:block; font-size:11px; font-weight:500; color:var(--muted); text-transform:uppercase; letter-spacing:.8px; margin-bottom:5px; }
  .field input { width:100%; background:var(--surface); border:1px solid var(--border); border-radius:8px;
    padding:10px 12px; font-size:14px; color:var(--text); font-family:var(--font); outline:none; transition:border-color .15s; }
  .field input:focus { border-color:var(--purple); }
  .field input::placeholder { color:var(--muted); }
  .modal-btns { display:flex; gap:8px; margin-top:16px; }
  .modal-btns .btn { flex:1; padding:10px; font-size:13px; }

  /* DOWNLOADS TAB */
  .dl-head { display:flex; align-items:center; justify-content:space-between; }
  .dl-title { font-size:17px; font-weight:600; }
  .dl-sub { font-size:12px; color:var(--muted); margin-top:3px; }
  .offline-pill { display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:600;
    letter-spacing:.8px; text-transform:uppercase; color:var(--green);
    background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2); padding:4px 10px; border-radius:20px; }
  .offline-dot { width:5px; height:5px; border-radius:50%; background:var(--green);
    animation:pulse 2s ease-in-out infinite; }

  /* PLAYER */
  .player { background:var(--surface); border-top:1px solid var(--border);
    overflow:hidden; transition:max-height .3s ease; }
  .player.hidden { max-height:0; border-top:none; }
  .player.visible { max-height:72px; }
  .player-inner { display:flex; align-items:center; gap:16px; padding:14px 20px; }
  .player-art { width:42px; height:32px; border-radius:5px; overflow:hidden; flex-shrink:0;
    background:#1a1a1a; display:flex; align-items:center; justify-content:center; font-size:13px; }
  .player-art img { width:100%; height:100%; object-fit:cover; }
  .player-info { flex:1; min-width:0; }
  .player-title { font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .player-artist { font-size:11px; color:var(--muted); margin-top:1px; }
  .player-mode { font-size:9px; text-transform:uppercase; letter-spacing:1px; margin-top:2px; }
  .player-mode.stream { color:#555; } .player-mode.offline { color:var(--green); }
  .player-mode.saving { color:var(--purple-light); } .player-mode.loading { color:var(--muted); }
  .ctrls { display:flex; align-items:center; gap:8px; flex-shrink:0; }
  .ctrl { width:32px; height:32px; border-radius:50%; border:1px solid var(--border); background:transparent;
    color:var(--sub); cursor:pointer; display:flex; align-items:center; justify-content:center;
    font-size:11px; transition:all .12s; }
  .ctrl:hover:not(:disabled) { border-color:var(--purple); color:var(--purple-light); }
  .ctrl:disabled { opacity:.2; cursor:not-allowed; }
  .play-btn { width:40px; height:40px; border-radius:50%; border:none; background:var(--purple);
    color:#fff; cursor:pointer; font-size:14px; transition:all .15s;
    display:flex; align-items:center; justify-content:center; }
  .play-btn:hover { background:var(--purple2); transform:scale(1.05); }
`;

const EMOJIS = ["🎵","🎸","🎹","🎷","🎺","🥁","🎻","🎤","🎧","🎼"];
const PROMPTS = ["Late night lo-fi 📚","Road trip bangers 🚗","90s hip-hop 🎤","Dark ambient 🌑","Indie pop ☀️","Workout mix 💪"];

function totalDur(tracks) {
  const s = tracks.reduce((a, t) => {
    const parts = (t.duration || "").split(":");
    if (parts.length < 2) return a;
    const m = parseInt(parts[0], 10);
    const sec = parseInt(parts[1], 10);
    if (isNaN(m) || isNaN(sec)) return a;
    return a + m * 60 + sec;
  }, 0);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

async function ytSearch(title, artist) {
  try {
    const q = encodeURIComponent(`${title} ${artist}`);
    const r = await fetch(`/api/youtube-search?q=${q}`);
    const d = await r.json();
    const item = d?.items?.[0];
    if (!item) return null;
    return { videoId: item.id?.videoId, thumbnail: item.snippet?.thumbnails?.medium?.url };
  } catch { return null; }
}

export default function App() {
  const [tab, setTab] = useState("playlist");
  const [playlist, setPlaylist] = useState([]);
  const [plName, setPlName] = useState("My Playlist");
  const [aiOpen, setAiOpen] = useState(false);
  const [msgs, setMsgs] = useState([{
    role: "ai", text: "Hi! Tell me a vibe, mood, or genre and I'll build your playlist. 🎵",
    tracks: null
  }]);
  const [mainInput, setMainInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ytLoading, setYtLoading] = useState(false);
  const [dlStatus, setDlStatus] = useState({});
  const [downloads, setDownloads] = useState([]);
  const [blobUrls, setBlobUrls] = useState({});
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", artist: "", genre: "", duration: "" });
  const [autoSaving, setAutoSaving] = useState(false);

  const chatEndRef = useRef(null);
  const headerRef = useRef(null);

  // Refs for stale-closure-safe access in callbacks
  const ytPlayer = useRef(null);
  const ytReady = useRef(false);
  const activePlayer = useRef("none"); // "yt" | "audio"
  const audioEl = useRef(new Audio());
  const blobUrlsRef = useRef({});
  const dlStatusRef = useRef({});
  const nowPlayingRef = useRef(null);
  const playlistRef = useRef([]);
  const downloadsRef = useRef([]);

  // Keep refs in sync
  useEffect(() => { dlStatusRef.current = dlStatus; }, [dlStatus]);
  useEffect(() => { nowPlayingRef.current = nowPlaying; }, [nowPlaying]);
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { downloadsRef.current = downloads; }, [downloads]);

  // Load offline tracks on mount
  useEffect(() => {
    IDB.getAll().then(tracks => {
      if (!tracks.length) return;
      setDownloads(tracks);
      const urls = {}, status = {};
      tracks.forEach(t => {
        if (t.audioBlob) urls[t.videoId] = URL.createObjectURL(t.audioBlob);
        status[t.videoId] = "done";
      });
      blobUrlsRef.current = urls;
      setBlobUrls(urls);
      setDlStatus(status);
    }).catch(console.error);
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => () => {
    Object.values(blobUrlsRef.current).forEach(URL.revokeObjectURL);
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    const initYTPlayer = () => {
      ytPlayer.current = new window.YT.Player("yt-player", {
        height: "1",
        width: "1",
        playerVars: { autoplay: 1, playsinline: 1, controls: 0 },
        events: {
          onReady: () => { ytReady.current = true; },
          onStateChange: (e) => {
            const S = window.YT?.PlayerState;
            if (!S) return;
            if (e.data === S.PLAYING) { setIsPlaying(true); setYtLoading(false); }
            if (e.data === S.PAUSED) setIsPlaying(false);
            if (e.data === S.BUFFERING) setYtLoading(true);
            if (e.data === S.ENDED) {
              setIsPlaying(false);
              setYtLoading(false);
              // Advance to next track
              const curr = nowPlayingRef.current;
              if (!curr) return;
              const list = curr._offline ? downloadsRef.current : playlistRef.current;
              const i = list.findIndex(t => t.videoId === curr.videoId);
              const next = list[i + 1];
              if (next) {
                setTimeout(() => playTrackRef.current(next, curr._offline), 300);
              }
            }
          },
          onError: () => { setIsPlaying(false); setYtLoading(false); }
        }
      });
    };

    if (window.YT?.Player) {
      initYTPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initYTPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      try { ytPlayer.current?.destroy?.(); } catch {}
    };
  }, []);

  // HTML5 audio events (for offline blobs)
  useEffect(() => {
    const audio = audioEl.current;
    const onEnd = () => {
      setIsPlaying(false);
      const curr = nowPlayingRef.current;
      if (!curr) return;
      const list = curr._offline ? downloadsRef.current : playlistRef.current;
      const i = list.findIndex(t => t.videoId === curr.videoId);
      const next = list[i + 1];
      if (next) setTimeout(() => playTrackRef.current(next, curr._offline), 300);
    };
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    return () => {
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", () => setIsPlaying(true));
      audio.removeEventListener("pause", () => setIsPlaying(false));
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (aiOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading, aiOpen]);

  /* ── Core download function (saves blob to IndexedDB) ──────── */
  const saveTrack = useCallback(async (track, signal) => {
    const vid = track.videoId;
    if (!vid) return null;
    if (dlStatusRef.current[vid] === "done" || dlStatusRef.current[vid] === "doing") return blobUrlsRef.current[vid] || null;
    setDlStatus(s => ({ ...s, [vid]: "doing" }));
    try {
      const r = await fetch(`/api/download?videoId=${vid}`, signal ? { signal } : {});
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      if (blob.size < 1000) throw new Error("Empty audio response");
      const rec = {
        videoId: vid, title: track.title, artist: track.artist,
        duration: track.duration, thumbnail: track.thumbnail, genre: track.genre,
        audioBlob: blob, savedAt: Date.now()
      };
      await IDB.save(rec);
      const blobUrl = URL.createObjectURL(blob);
      blobUrlsRef.current[vid] = blobUrl;
      setBlobUrls(u => ({ ...u, [vid]: blobUrl }));
      setDownloads(prev => [...prev.filter(t => t.videoId !== vid), rec]);
      setDlStatus(s => ({ ...s, [vid]: "done" }));
      return blobUrl;
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Save failed:", e);
        setDlStatus(s => ({ ...s, [vid]: "err" }));
      }
      return null;
    }
  }, []);

  /* ── Play a track ───────────────────────────────────────────── */
  const playTrack = useCallback((track, fromOffline = false) => {
    if (!track.videoId) return;
    const blobUrl = blobUrlsRef.current[track.videoId];
    const useOffline = fromOffline || !!blobUrl;

    setNowPlaying({ ...track, _offline: useOffline });
    setIsPlaying(false);

    if (useOffline && blobUrl) {
      // Play from local blob (HTML5 audio)
      activePlayer.current = "audio";
      if (ytPlayer.current?.pauseVideo) {
        try { ytPlayer.current.pauseVideo(); } catch {}
      }
      audioEl.current.src = blobUrl;
      audioEl.current.play().catch(console.error);
    } else {
      // Play via YouTube IFrame (most reliable!)
      activePlayer.current = "yt";
      audioEl.current.pause();
      setYtLoading(true);
      if (ytReady.current && ytPlayer.current?.loadVideoById) {
        try {
          ytPlayer.current.loadVideoById({ videoId: track.videoId, suggestedQuality: "small" });
        } catch (e) {
          console.error("YT load error:", e);
          setYtLoading(false);
        }
      } else {
        // YT not ready yet — wait and retry
        const retry = setInterval(() => {
          if (ytReady.current && ytPlayer.current?.loadVideoById) {
            clearInterval(retry);
            try {
              ytPlayer.current.loadVideoById({ videoId: track.videoId, suggestedQuality: "small" });
            } catch {}
          }
        }, 200);
        setTimeout(() => clearInterval(retry), 5000);
      }
    }
  }, []);

  // Store playTrack in ref so event handlers always have current version
  const playTrackRef = useRef(playTrack);
  useEffect(() => { playTrackRef.current = playTrack; }, [playTrack]);

  /* ── Auto-save in background when streaming ─────────────────── */
  useEffect(() => {
    if (!nowPlaying?.videoId) return;
    const vid = nowPlaying.videoId;
    if (blobUrlsRef.current[vid]) return;
    if (dlStatusRef.current[vid] === "done" || dlStatusRef.current[vid] === "doing") return;

    setAutoSaving(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const url = await saveTrack(nowPlaying, controller.signal);
      setAutoSaving(false);
      if (url) {
        setNowPlaying(prev =>
          prev?.videoId === vid ? { ...prev, _offline: true } : prev
        );
      }
    }, 4000);

    return () => {
      clearTimeout(timer);
      controller.abort();
      setAutoSaving(false);
    };
  }, [nowPlaying?.videoId, saveTrack]);

  const togglePlay = () => {
    if (!nowPlaying) return;
    if (activePlayer.current === "yt") {
      try {
        if (isPlaying) ytPlayer.current?.pauseVideo?.();
        else ytPlayer.current?.playVideo?.();
      } catch {}
    } else {
      if (isPlaying) audioEl.current.pause();
      else audioEl.current.play().catch(console.error);
    }
  };

  const skip = (dir) => {
    if (!nowPlaying) return;
    const list = nowPlaying._offline ? downloadsRef.current : playlistRef.current;
    const i = list.findIndex(t => t.videoId === nowPlaying.videoId);
    const next = list[i + dir];
    if (next) playTrack(next, nowPlaying._offline);
  };

  const addTrack = useCallback(async (track) => {
    if (playlistRef.current.find(t => t.title === track.title && t.artist === track.artist)) return;
    const id = Date.now() + Math.random();
    setPlaylist(p => [...p, { ...track, id, videoId: null, thumbnail: null, ytStatus: "searching" }]);
    const yt = await ytSearch(track.title, track.artist);
    setPlaylist(p => p.map(t => t.id === id
      ? { ...t, videoId: yt?.videoId || null, thumbnail: yt?.thumbnail || null, ytStatus: yt?.videoId ? "found" : "notfound" }
      : t));
    if (yt?.videoId && blobUrlsRef.current[yt.videoId]) {
      setDlStatus(s => ({ ...s, [yt.videoId]: "done" }));
    }
  }, []);

  const addAll = (tracks) => tracks.forEach(t => addTrack(t));

  const removeTrack = (id) => {
    setPlaylist(p => p.filter(t => t.id !== id));
    const track = playlistRef.current.find(t => t.id === id);
    if (nowPlaying?.videoId === track?.videoId) {
      if (activePlayer.current === "yt") { try { ytPlayer.current?.stopVideo?.(); } catch {} }
      else audioEl.current.pause();
      setNowPlaying(null); setIsPlaying(false);
    }
  };

  const downloadTrack = (track) => saveTrack(track);

  const deleteDownload = async (videoId) => {
    await IDB.del(videoId);
    if (blobUrlsRef.current[videoId]) {
      URL.revokeObjectURL(blobUrlsRef.current[videoId]);
      delete blobUrlsRef.current[videoId];
      setBlobUrls(u => { const c = { ...u }; delete c[videoId]; return c; });
    }
    setDownloads(prev => prev.filter(t => t.videoId !== videoId));
    setDlStatus(s => { const c = { ...s }; delete c[videoId]; return c; });
    if (nowPlaying?.videoId === videoId) {
      if (activePlayer.current === "yt") { try { ytPlayer.current?.stopVideo?.(); } catch {} }
      else audioEl.current.pause();
      setNowPlaying(null); setIsPlaying(false);
    }
  };

  const sendMsg = async (text) => {
    const t = text || chatInput.trim();
    if (!t || loading) return;
    setChatInput("");
    setMsgs(p => [...p, { role: "user", text: t }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You are a music playlist curator. Respond with a 1-2 sentence intro, then exactly 8 songs as JSON:\n\`\`\`json\n[{"title":"Song Title","artist":"Artist Name","genre":"Genre","duration":"3:42"}]\n\`\`\`\nShort genres, realistic durations. End with one sentence about the selection.`,
          messages: [{ role: "user", content: t }]
        })
      });
      const raw = await res.text();
      let data; try { data = JSON.parse(raw); } catch { throw new Error(raw.slice(0, 120)); }
      const full = data.content?.map(b => b.text || "").join("") || "";
      const match = full.match(/```json\s*([\s\S]*?)```/);
      let tracks = null, display = full;
      if (match) { try { tracks = JSON.parse(match[1].trim()); display = full.replace(/```json[\s\S]*?```/, "").trim(); } catch {} }
      setMsgs(p => [...p, { role: "ai", text: display, tracks }]);
    } catch (e) {
      setMsgs(p => [...p, { role: "ai", text: `Something went wrong: ${e.message}`, tracks: null }]);
    }
    setLoading(false);
  };

  const generateFromMain = () => {
    if (!mainInput.trim()) return;
    setAiOpen(true);
    sendMsg(mainInput);
    setMainInput("");
  };

  const submitAddSong = () => {
    const { title, artist, genre, duration } = addForm;
    if (!title.trim() || !artist.trim()) return;
    addTrack({ title: title.trim(), artist: artist.trim(), genre: genre.trim() || "Unknown", duration: duration.trim() || "?" });
    setAddForm({ title: "", artist: "", genre: "", duration: "" });
    setAddOpen(false);
  };

  const exportPlaylist = () => {
    const text = `${plName}\n${"─".repeat(30)}\n\n` +
      playlist.map((t, i) =>
        `${i + 1}. ${t.title} — ${t.artist} [${t.duration}]${t.videoId ? `\n   https://youtube.com/watch?v=${t.videoId}` : ""}`
      ).join("\n\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = `${plName.replace(/\s+/g, "_").toLowerCase()}.txt`;
    a.click();
  };

  const isOfflinePlaying = nowPlaying && !!blobUrlsRef.current[nowPlaying?.videoId];

  const renderRow = (track, i, fromOffline = false) => {
    const isNowPlaying = nowPlaying?.videoId === track.videoId;
    const dl = dlStatus[track.videoId];
    const isOffline = !!blobUrls[track.videoId];
    return (
      <div key={track.id || track.videoId} className={`track-row${isNowPlaying ? " playing" : ""}`}>
        <div className="track-num">
          {isNowPlaying && isPlaying
            ? <span className="bars"><span /><span /><span /></span>
            : i + 1}
        </div>
        <div className="track-thumb" onClick={() => track.videoId && playTrack(track, fromOffline)}>
          {track.thumbnail ? <img src={track.thumbnail} alt="" /> : <span>{EMOJIS[i % EMOJIS.length]}</span>}
          <div className="thumb-ov">
            {isOffline
              ? <div className="offline-ic">{isNowPlaying && isPlaying ? "⏸" : "▶"}</div>
              : <div className="play-ic">{isNowPlaying && isPlaying ? "⏸" : "▶"}</div>}
          </div>
        </div>
        <div className="track-info">
          <div className="track-title">{track.title}</div>
          <div className="track-artist">{track.artist}</div>
          <div className={`track-st ${isOffline ? "offline" : track.ytStatus || ""}`}>
            {isOffline ? "⚡ offline" : track.ytStatus === "found" ? "● ready" : track.ytStatus === "searching" ? "○ searching…" : track.ytStatus === "notfound" ? "○ not found" : ""}
          </div>
        </div>
        {track.genre && <div className="track-genre">{track.genre}</div>}
        <div className="track-dur">{track.duration}</div>
        {!fromOffline && track.videoId && (
          <button
            className={`track-act${dl === "done" ? " dl-done" : dl === "doing" ? " dl-doing" : dl === "err" ? " dl-err" : ""}`}
            onClick={() => downloadTrack(track)}
            title={dl === "done" ? "Saved offline ✓" : dl === "doing" ? "Saving…" : dl === "err" ? "Download failed — tap to retry" : "Save offline"}
          >
            {dl === "done" ? "✓" : dl === "doing" ? <span className="spin">↻</span> : dl === "err" ? "!" : "⬇"}
          </button>
        )}
        <button
          className="track-act"
          onClick={() => fromOffline ? deleteDownload(track.videoId) : removeTrack(track.id)}
          title={fromOffline ? "Remove download" : "Remove from playlist"}
        >✕</button>
      </div>
    );
  };

  return (
    <>
      <style>{STYLES}</style>

      {/* Hidden YouTube IFrame player div — must stay in DOM */}
      <div id="yt-player" />

      {/* ADD SONG MODAL */}
      {addOpen && (
        <div className="modal-back" onClick={e => { if (e.target.className === "modal-back") setAddOpen(false); }}>
          <div className="modal">
            <div className="modal-title">Add a Song</div>
            <div className="field">
              <label>Song Title *</label>
              <input autoFocus placeholder="e.g. Bohemian Rhapsody" value={addForm.title}
                onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") submitAddSong(); }} />
            </div>
            <div className="field">
              <label>Artist *</label>
              <input placeholder="e.g. Queen" value={addForm.artist}
                onChange={e => setAddForm(f => ({ ...f, artist: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") submitAddSong(); }} />
            </div>
            <div className="field">
              <label>Genre (optional)</label>
              <input placeholder="e.g. Rock" value={addForm.genre}
                onChange={e => setAddForm(f => ({ ...f, genre: e.target.value }))} />
            </div>
            <div className="field">
              <label>Duration (optional)</label>
              <input placeholder="e.g. 3:45" value={addForm.duration}
                onChange={e => setAddForm(f => ({ ...f, duration: e.target.value }))} />
            </div>
            <div className="modal-btns">
              <button className="btn btn-g" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="btn btn-p" onClick={submitAddSong} disabled={!addForm.title.trim() || !addForm.artist.trim()}>Add to Playlist</button>
            </div>
          </div>
        </div>
      )}

      <div className="app">
        {/* HEADER */}
        <div className="header" ref={headerRef}>
          <div className="logo">Playlist AI</div>
          <div className="input-row">
            <input
              className="main-input"
              placeholder="Describe a vibe, mood, or genre…"
              value={mainInput}
              onChange={e => setMainInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") generateFromMain(); }}
            />
            <button className="gen-btn" onClick={generateFromMain} disabled={loading || !mainInput.trim()}>
              {loading ? "…" : "Generate"}
            </button>
            <button className={`ai-btn${aiOpen ? " active" : ""}`} onClick={() => setAiOpen(o => !o)}>
              {aiOpen ? "✕" : "✦ AI"}
            </button>
          </div>
        </div>

        {/* AI DRAWER */}
        <div className={`backdrop${aiOpen ? "" : " hidden"}`} onClick={() => setAiOpen(false)} />
        <div className={`ai-drawer ${aiOpen ? "open" : "closed"}`} style={{ top: headerRef.current?.offsetHeight || 90 }}>
          <div className="drawer-head">
            <span className="drawer-label">AI Curator</span>
            <button className="drawer-x" onClick={() => setAiOpen(false)}>✕</button>
          </div>
          <div className="chat-scroll">
            {msgs.map((m, i) => (
              <div key={i} className="msg">
                <div className={`msg-av ${m.role}`}>{m.role === "ai" ? "AI" : "↑"}</div>
                <div>
                  <div className="msg-name">{m.role === "ai" ? "Playlist AI" : "You"}</div>
                  <div className="msg-text">{m.text}</div>
                  {m.tracks?.length > 0 && (
                    <div className="mini-tracks">
                      {m.tracks.map((t, ti) => (
                        <div key={ti} className="mini-row" onClick={() => addTrack(t)}>
                          <div className="mini-n">{ti + 1}</div>
                          <div className="mini-info">
                            <div className="mini-title">{t.title}</div>
                            <div className="mini-artist">{t.artist} · {t.duration}</div>
                          </div>
                          <div className="mini-plus">+</div>
                        </div>
                      ))}
                      <button className="add-all" onClick={() => addAll(m.tracks)}>+ Add all {m.tracks.length} tracks</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="msg">
                <div className="msg-av ai">AI</div>
                <div><div className="msg-name">Playlist AI</div><div className="dots"><span /><span /><span /></div></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="chips">
            {PROMPTS.map((p, i) => <button key={i} className="chip" onClick={() => sendMsg(p)}>{p}</button>)}
          </div>
          <div className="chat-foot">
            <textarea
              className="chat-in"
              placeholder="Describe a mood or genre…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
              rows={1}
            />
            <button className="send-btn" onClick={() => sendMsg()} disabled={loading || !chatInput.trim()}>↑</button>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          <button className={`tab${tab === "playlist" ? " active" : ""}`} onClick={() => setTab("playlist")}>
            Playlist {playlist.length > 0 && <span className="tab-badge">{playlist.length}</span>}
          </button>
          <button className={`tab${tab === "downloads" ? " active" : ""}`} onClick={() => setTab("downloads")}>
            Downloads {downloads.length > 0 && <span className="tab-badge">{downloads.length}</span>}
          </button>
        </div>

        {/* MAIN */}
        <div className="main">
          {tab === "playlist" && (
            <div className="section">
              <div className="pl-head">
                <div className="pl-name-wrap">
                  <input className="pl-name" value={plName} onChange={e => setPlName(e.target.value)} maxLength={40} placeholder="Playlist name…" />
                  <div className="pl-meta">
                    {playlist.length > 0
                      ? `${playlist.length} tracks · ${totalDur(playlist)} · songs auto-save when played`
                      : "Type a vibe above and hit Generate"}
                  </div>
                </div>
                <div className="pl-actions">
                  <button className="btn btn-p" onClick={() => setAddOpen(true)}>+ Add Song</button>
                  {playlist.length > 0 && <button className="btn btn-p" onClick={exportPlaylist}>↓ Export</button>}
                  <button className="btn btn-g" onClick={() => {
                    setPlaylist([]);
                    try { if (activePlayer.current === "yt") ytPlayer.current?.stopVideo?.(); else audioEl.current.pause(); } catch {}
                    setNowPlaying(null); setIsPlaying(false);
                  }}>Clear</button>
                </div>
              </div>
              <div className="track-list">
                {playlist.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">🎬</div>
                    <div className="empty-title">No tracks yet</div>
                    <div className="empty-sub">Type a vibe above and hit Generate<br />or tap ✦ AI to chat with the curator.</div>
                  </div>
                ) : playlist.map((t, i) => renderRow(t, i, false))}
              </div>
            </div>
          )}

          {tab === "downloads" && (
            <div className="section">
              <div className="dl-head">
                <div>
                  <div className="dl-title">Downloads</div>
                  <div className="dl-sub">
                    {downloads.length > 0
                      ? `${downloads.length} track${downloads.length !== 1 ? "s" : ""} saved · plays without internet`
                      : "No offline tracks yet — play any song to auto-save it"}
                  </div>
                </div>
                {downloads.length > 0 && (
                  <div className="offline-pill">
                    <span className="offline-dot" />offline ready
                  </div>
                )}
              </div>
              <div className="track-list">
                {downloads.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">⬇</div>
                    <div className="empty-title">No downloads yet</div>
                    <div className="empty-sub">Play any song and it will automatically<br />save here for offline listening.</div>
                  </div>
                ) : downloads.map((t, i) => renderRow(t, i, true))}
              </div>
            </div>
          )}
        </div>

        {/* PLAYER */}
        <div className={`player ${nowPlaying ? "visible" : "hidden"}`}>
          {nowPlaying && (
            <div className="player-inner">
              <div className="player-art">
                {nowPlaying.thumbnail
                  ? <img src={nowPlaying.thumbnail} alt="" />
                  : <span>🎵</span>}
              </div>
              <div className="player-info">
                <div className="player-title">{nowPlaying.title}</div>
                <div className="player-artist">{nowPlaying.artist}</div>
                <div className={`player-mode ${isOfflinePlaying ? "offline" : autoSaving ? "saving" : ytLoading ? "loading" : "stream"}`}>
                  {isOfflinePlaying ? "⚡ offline" : autoSaving ? "↻ saving…" : ytLoading ? "○ loading…" : "▶ youtube"}
                </div>
              </div>
              <div className="ctrls">
                <button className="ctrl" onClick={() => skip(-1)}>⏮</button>
                <button className="play-btn" onClick={togglePlay}>{isPlaying ? "⏸" : "▶"}</button>
                <button className="ctrl" onClick={() => skip(1)}>⏭</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
