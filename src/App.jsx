import { useState, useRef, useEffect, useCallback } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0c; --surface: #111115; --card: #18181e; --border: #2a2a35;
    --red: #ff2d4e; --red-dim: rgba(255,45,78,0.15); --red-glow: rgba(255,45,78,0.35);
    --gold: #f5c842; --text: #f0eee8; --muted: #7a7885;
    --yt: #ff0000; --yt-dim: rgba(255,0,0,0.12);
    --font-display: 'Bebas Neue', sans-serif; --font-body: 'DM Sans', sans-serif;
  }
  body { background:var(--bg); color:var(--text); font-family:var(--font-body); min-height:100vh; overflow-x:hidden; }

  .app { display:grid; grid-template-columns:1fr 380px; grid-template-rows:auto 1fr auto; height:100vh; max-width:1400px; margin:0 auto; }

  /* HEADER */
  .header { grid-column:1/-1; display:flex; align-items:center; gap:16px; padding:18px 32px; border-bottom:1px solid var(--border); background:var(--bg); position:relative; z-index:10; }
  .header::after { content:''; position:absolute; bottom:-1px; left:0; width:100%; height:1px; background:linear-gradient(90deg,transparent,var(--red),transparent); opacity:.5; }
  .logo { font-family:var(--font-display); font-size:28px; letter-spacing:2px; }
  .logo span { color:var(--red); text-shadow:0 0 20px var(--red-glow); }
  .logo-badge { font-size:10px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:var(--gold); background:rgba(245,200,66,.1); border:1px solid rgba(245,200,66,.3); padding:3px 8px; border-radius:2px; }
  .yt-badge { font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--yt); background:var(--yt-dim); border:1px solid rgba(255,0,0,.3); padding:3px 10px; border-radius:2px; }
  .header-right { margin-left:auto; display:flex; align-items:center; gap:12px; }
  .track-count { font-size:13px; color:var(--muted); }
  .track-count strong { color:var(--text); font-weight:500; }

  /* LAYOUT */
  .main { padding:28px 32px; overflow-y:auto; display:flex; flex-direction:column; gap:24px; }
  .ai-panel { border-left:1px solid var(--border); display:flex; flex-direction:column; background:var(--surface); overflow:hidden; }

  /* AI PANEL */
  .ai-header { padding:18px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; }
  .ai-dot { width:8px; height:8px; background:var(--red); border-radius:50%; animation:pulse 2s ease-in-out infinite; box-shadow:0 0 8px var(--red-glow); }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
  .ai-title { font-size:12px; letter-spacing:3px; text-transform:uppercase; color:var(--muted); font-weight:500; }
  .chat-area { flex:1; overflow-y:auto; padding:18px; display:flex; flex-direction:column; gap:14px; }
  .chat-area::-webkit-scrollbar { width:4px; }
  .chat-area::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }
  .msg { display:flex; gap:10px; animation:fadeUp .3s ease; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .msg-avatar { width:28px; height:28px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; margin-top:2px; font-weight:700; }
  .msg-avatar.ai { background:var(--red-dim); border:1px solid var(--red); color:var(--red); }
  .msg-avatar.user { background:rgba(245,200,66,.1); border:1px solid rgba(245,200,66,.4); color:var(--gold); }
  .msg-body { flex:1; }
  .msg-name { font-size:10px; text-transform:uppercase; letter-spacing:2px; color:var(--muted); margin-bottom:5px; font-weight:500; }
  .msg-text { font-size:13px; line-height:1.65; color:#d8d6d0; }
  .msg-tracks { margin-top:10px; display:flex; flex-direction:column; gap:5px; }
  .mini-track { display:flex; align-items:center; gap:10px; background:var(--card); border:1px solid var(--border); border-radius:6px; padding:7px 11px; cursor:pointer; transition:all .15s; }
  .mini-track:hover { border-color:var(--red); background:var(--red-dim); }
  .mini-track-num { color:var(--muted); font-size:11px; width:16px; flex-shrink:0; }
  .mini-track-thumb { width:36px; height:27px; border-radius:3px; overflow:hidden; flex-shrink:0; background:var(--border); display:flex; align-items:center; justify-content:center; font-size:12px; }
  .mini-track-thumb img { width:100%; height:100%; object-fit:cover; }
  .mini-track-info { flex:1; min-width:0; }
  .mini-track-title { font-size:12px; font-weight:500; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mini-track-artist { font-size:11px; color:var(--muted); margin-top:1px; }
  .mini-track-add { color:var(--red); font-size:16px; opacity:.7; flex-shrink:0; transition:opacity .1s; }
  .mini-track:hover .mini-track-add { opacity:1; }
  .add-all-btn { margin-top:6px; width:100%; padding:8px; background:var(--red-dim); border:1px solid var(--red); color:var(--red); border-radius:6px; font-size:12px; font-weight:500; letter-spacing:1px; cursor:pointer; transition:all .15s; font-family:var(--font-body); }
  .add-all-btn:hover { background:rgba(255,45,78,.25); }
  .suggestions-row { display:flex; gap:7px; flex-wrap:wrap; padding:0 18px 12px; }
  .suggestion-chip { padding:5px 11px; border-radius:20px; border:1px solid var(--border); background:var(--card); color:var(--muted); font-size:11.5px; cursor:pointer; transition:all .12s; white-space:nowrap; }
  .suggestion-chip:hover { border-color:var(--red); color:var(--text); }
  .chat-input-wrap { padding:14px 18px; border-top:1px solid var(--border); display:flex; gap:10px; align-items:flex-end; }
  .chat-input { flex:1; background:var(--card); border:1px solid var(--border); border-radius:8px; padding:10px 13px; font-size:13px; color:var(--text); font-family:var(--font-body); resize:none; outline:none; line-height:1.5; transition:border-color .15s; max-height:100px; min-height:42px; }
  .chat-input:focus { border-color:var(--red); }
  .chat-input::placeholder { color:var(--muted); }
  .send-btn { width:42px; height:42px; background:var(--red); border:none; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; flex-shrink:0; color:white; font-size:16px; }
  .send-btn:hover { background:#ff4d69; transform:scale(1.05); }
  .send-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; }
  .loading-dots { display:inline-flex; gap:4px; align-items:center; padding:6px 0; }
  .loading-dots span { width:5px; height:5px; background:var(--red); border-radius:50%; animation:bounce 1.2s ease-in-out infinite; }
  .loading-dots span:nth-child(2){animation-delay:.2s} .loading-dots span:nth-child(3){animation-delay:.4s}
  @keyframes bounce { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }

  /* PLAYLIST */
  .playlist-name-input { font-family:var(--font-display); font-size:34px; letter-spacing:2px; background:transparent; border:none; border-bottom:2px solid var(--border); color:var(--text); outline:none; width:100%; padding-bottom:4px; transition:border-color .2s; }
  .playlist-name-input:focus { border-color:var(--red); }
  .playlist-meta { font-size:12px; color:var(--muted); letter-spacing:1px; margin-top:6px; }
  .actions-bar { display:flex; gap:10px; flex-wrap:wrap; }
  .action-btn { padding:9px 18px; border-radius:6px; font-size:13px; font-weight:500; cursor:pointer; transition:all .15s; font-family:var(--font-body); }
  .btn-primary { background:var(--red); border:1px solid var(--red); color:white; }
  .btn-primary:hover { background:#ff4d69; box-shadow:0 0 20px var(--red-glow); }
  .btn-ghost { background:transparent; border:1px solid var(--border); color:var(--muted); }
  .btn-ghost:hover { border-color:var(--text); color:var(--text); }
  .track-list { display:flex; flex-direction:column; gap:4px; }
  .empty-state { text-align:center; padding:60px 20px; border:2px dashed var(--border); border-radius:12px; color:var(--muted); }
  .empty-icon { font-size:48px; margin-bottom:16px; opacity:.4; }
  .empty-title { font-family:var(--font-display); font-size:22px; letter-spacing:2px; color:var(--text); margin-bottom:8px; opacity:.5; }
  .empty-sub { font-size:13px; line-height:1.6; }

  /* TRACK ROW */
  .track-row { display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--card); border:1px solid var(--border); border-radius:8px; transition:all .15s; animation:fadeUp .25s ease; position:relative; overflow:hidden; }
  .track-row::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--red); opacity:0; transition:opacity .15s; }
  .track-row:hover::before, .track-row.playing::before { opacity:1; }
  .track-row:hover { border-color:rgba(255,45,78,.3); }
  .track-row.playing { border-color:var(--red); background:var(--red-dim); }
  .track-index { width:20px; text-align:center; font-size:12px; color:var(--muted); flex-shrink:0; font-weight:500; }
  .track-thumb { width:56px; height:42px; border-radius:5px; overflow:hidden; flex-shrink:0; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:16px; cursor:pointer; position:relative; transition:transform .1s; background:var(--border); }
  .track-thumb:hover { transform:scale(1.05); }
  .track-thumb img { width:100%; height:100%; object-fit:cover; }
  .thumb-overlay { position:absolute; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .15s; }
  .track-thumb:hover .thumb-overlay, .track-row.playing .thumb-overlay { opacity:1; }
  .yt-play-icon { width:22px; height:22px; background:var(--yt); border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; }
  .track-info { flex:1; min-width:0; }
  .track-title { font-size:13.5px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .track-artist { font-size:11.5px; color:var(--muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .track-yt-status { font-size:9px; text-transform:uppercase; letter-spacing:1.5px; margin-top:3px; }
  .track-yt-status.found { color:var(--yt); }
  .track-yt-status.searching { color:var(--muted); }
  .track-yt-status.notfound { color:var(--muted); }
  .track-genre { font-size:10px; background:rgba(245,200,66,.1); border:1px solid rgba(245,200,66,.2); color:var(--gold); padding:2px 8px; border-radius:20px; letter-spacing:1px; text-transform:uppercase; white-space:nowrap; flex-shrink:0; }
  .track-duration { font-size:12px; color:var(--muted); flex-shrink:0; font-variant-numeric:tabular-nums; }
  .track-remove { width:26px; height:26px; border-radius:4px; border:1px solid transparent; background:transparent; color:var(--muted); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .1s; font-size:13px; flex-shrink:0; opacity:0; }
  .track-row:hover .track-remove { opacity:1; }
  .track-remove:hover { background:rgba(255,45,78,.15); border-color:var(--red); color:var(--red); }

  /* YOUTUBE PLAYER BAR */
  .player-bar { grid-column:1/-1; background:var(--surface); border-top:1px solid var(--border); display:flex; align-items:stretch; min-height:0; transition:max-height .3s ease; overflow:hidden; }
  .player-bar.hidden { max-height:0; border-top:none; }
  .player-bar.visible { max-height:300px; }
  .yt-embed-wrap { width:240px; flex-shrink:0; background:#000; position:relative; }
  .yt-embed-wrap iframe { width:100%; height:100%; display:block; border:none; }
  .player-info-wrap { flex:1; padding:16px 24px; display:flex; flex-direction:column; justify-content:center; gap:10px; min-width:0; }
  .player-now { display:flex; align-items:center; gap:12px; }
  .player-text { min-width:0; flex:1; }
  .player-title { font-size:14px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .player-artist { font-size:12px; color:var(--muted); margin-top:2px; }
  .player-badge { font-size:9px; color:var(--yt); letter-spacing:1.5px; text-transform:uppercase; margin-top:3px; }
  .player-controls { display:flex; align-items:center; gap:10px; }
  .ctrl-btn { width:34px; height:34px; border-radius:50%; border:1px solid var(--border); background:var(--card); color:var(--text); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; font-size:12px; }
  .ctrl-btn:hover { border-color:var(--red); color:var(--red); }
  .ctrl-btn:disabled { opacity:.3; cursor:not-allowed; }
  .play-btn { width:44px; height:44px; border-radius:50%; border:none; background:var(--red); color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:16px; transition:all .15s; box-shadow:0 0 16px var(--red-glow); }
  .play-btn:hover { background:#ff4d69; transform:scale(1.05); }
  .bars { display:inline-flex; gap:2px; align-items:flex-end; height:14px; }
  .bars span { width:3px; background:var(--red); border-radius:1px; animation:barAnim .7s ease-in-out infinite alternate; }
  .bars span:nth-child(1){height:6px;animation-delay:0s} .bars span:nth-child(2){height:11px;animation-delay:.15s} .bars span:nth-child(3){height:14px;animation-delay:.3s}
  @keyframes barAnim { from{transform:scaleY(.3)} to{transform:scaleY(1)} }
`;

const EMOJIS = ["🎵","🎸","🎹","🎷","🎺","🥁","🎻","🎤","🎧","🎼"];
const BG_COLORS = ["rgba(255,45,78,.15)","rgba(100,149,237,.15)","rgba(50,205,50,.15)","rgba(255,165,0,.15)","rgba(138,43,226,.15)","rgba(255,215,0,.15)"];
const PROMPTS = ["Late night lo-fi study mix 📚","Summer road trip bangers 🚗","90s hip-hop classics 🎤","Dark ambient for focus 🌑","Feel-good indie pop ☀️","Epic workout motivation 💪"];

function totalDuration(tracks) {
  const secs = tracks.reduce((a,t) => {
    const [m,s] = (t.duration||"0:00").split(":").map(Number);
    return a + m*60 + (s||0);
  }, 0);
  const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=secs%60;
  return h>0 ? `${h}h ${m}m` : `${m}m ${s.toString().padStart(2,"0")}s`;
}

async function searchYouTube(title, artist) {
  try {
    const q = encodeURIComponent(`${title} ${artist} official audio`);
    const res = await fetch(`/api/youtube-search?q=${q}`);
    const data = await res.json();
    const item = data?.items?.[0];
    if (!item) return null;
    return {
      videoId: item.id?.videoId,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      ytTitle: item.snippet?.title,
    };
  } catch {
    return null;
  }
}

// YouTube IFrame API loader
let ytApiLoaded = false;
let ytApiReady = false;
const ytReadyCallbacks = [];

function loadYTApi() {
  if (ytApiLoaded) return;
  ytApiLoaded = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
  window.onYouTubeIframeAPIReady = () => {
    ytApiReady = true;
    ytReadyCallbacks.forEach(cb => cb());
  };
}

function onYTReady(cb) {
  if (ytApiReady) cb();
  else ytReadyCallbacks.push(cb);
}

export default function App() {
  const [playlist, setPlaylist] = useState([]);
  const [playlistName, setPlaylistName] = useState("MY PLAYLIST");
  const [messages, setMessages] = useState([{
    role:"ai",
    text:"Hey! I'm your AI playlist curator powered by YouTube 🎬 Describe a vibe, mood, genre, or activity — I'll build the perfect tracklist. Click any track to play it via YouTube!",
    tracks:null
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const chatEndRef = useRef(null);
  const playerRef = useRef(null);
  const playerDivRef = useRef(null);
  const playerInitialized = useRef(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, loading]);

  useEffect(() => { loadYTApi(); }, []);

  const initPlayer = useCallback((videoId) => {
    onYTReady(() => {
      if (playerRef.current) {
        playerRef.current.loadVideoById(videoId);
        playerRef.current.playVideo();
        setIsPlaying(true);
        return;
      }
      playerRef.current = new window.YT.Player(playerDivRef.current, {
        height: "100%",
        width: "100%",
        videoId,
        playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
            if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
            if (e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              // auto advance
              setNowPlaying(prev => {
                if (!prev) return prev;
                setPlaylist(pl => {
                  const idx = pl.findIndex(t => t.id === prev.id);
                  const next = pl[idx + 1];
                  if (next?.videoId) {
                    setTimeout(() => {
                      setNowPlaying(next);
                      playerRef.current?.loadVideoById(next.videoId);
                      playerRef.current?.playVideo();
                      setIsPlaying(true);
                    }, 500);
                  }
                  return pl;
                });
                return prev;
              });
            }
          }
        }
      });
      playerInitialized.current = true;
    });
  }, []);

  const playTrack = useCallback((track) => {
    if (!track.videoId) return;
    setNowPlaying(track);
    setIsPlaying(true);
    initPlayer(track.videoId);
  }, [initPlayer]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) { playerRef.current.pauseVideo(); setIsPlaying(false); }
    else { playerRef.current.playVideo(); setIsPlaying(true); }
  };

  const skipTrack = (dir) => {
    if (!nowPlaying) return;
    const idx = playlist.findIndex(t => t.id === nowPlaying.id);
    const next = playlist[idx + dir];
    if (next) playTrack(next);
  };

  const addTrack = useCallback(async (track) => {
    if (playlist.find(t => t.title===track.title && t.artist===track.artist)) return;
    const id = Date.now() + Math.random();
    const newTrack = { ...track, id, videoId: null, thumbnail: null, ytStatus: "searching" };
    setPlaylist(p => [...p, newTrack]);
    const yt = await searchYouTube(track.title, track.artist);
    setPlaylist(p => p.map(t => t.id === id ? {
      ...t,
      videoId: yt?.videoId || null,
      thumbnail: yt?.thumbnail || null,
      ytTitle: yt?.ytTitle || null,
      ytStatus: yt?.videoId ? "found" : "notfound",
    } : t));
  }, [playlist]);

  const addAll = (tracks) => tracks.forEach(t => addTrack(t));

  const removeTrack = (id) => {
    if (nowPlaying?.id === id) { setNowPlaying(null); playerRef.current?.stopVideo(); setIsPlaying(false); }
    setPlaylist(p => p.filter(t => t.id !== id));
  };

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    setMessages(p => [...p, { role:"user", text:userText }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          system:`You are a music playlist curator AI. When the user describes a mood, genre, activity, or vibe, respond with:
1. A brief enthusiastic 1-2 sentence intro
2. Exactly 8 songs as a JSON block:
\`\`\`json
[{"title":"Song Title","artist":"Artist Name","genre":"Genre","duration":"3:42"}]
\`\`\`
Durations between 2:30-6:00. Short genre labels. Mix popular and lesser-known artists. End with one sentence about what makes this selection special.`,
          messages:[{ role:"user", content:userText }]
        })
      });
      const data = await res.json();
      const full = data.content?.map(b=>b.text||"").join("") || "";
      const match = full.match(/```json\s*([\s\S]*?)```/);
      let tracks = null, display = full;
      if (match) {
        try {
          tracks = JSON.parse(match[1].trim());
          display = full.replace(/```json[\s\S]*?```/,"").replace(/\n\n+/g,"\n\n").trim();
        } catch {}
      }
      setMessages(p => [...p, { role:"ai", text:display, tracks }]);
    } catch {
      setMessages(p => [...p, { role:"ai", text:"Couldn't connect right now. Try again!", tracks:null }]);
    }
    setLoading(false);
  };

  const exportPlaylist = () => {
    const text = `${playlistName}\n${"=".repeat(playlistName.length)}\n\n` +
      playlist.map((t,i) => `${i+1}. ${t.title} — ${t.artist} [${t.duration}]${t.videoId ? `\n   https://youtube.com/watch?v=${t.videoId}` : ""}`).join("\n\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text],{type:"text/plain"}));
    a.download = `${playlistName.replace(/\s+/g,"_").toLowerCase()}.txt`;
    a.click();
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        {/* HEADER */}
        <div className="header">
          <div className="logo">PLAY<span>LIST</span>.AI</div>
          <div className="logo-badge">OFFLINE BUILDER</div>
          <div className="yt-badge">▶ YOUTUBE</div>
          <div className="header-right">
            <div className="track-count">
              <strong>{playlist.length}</strong> tracks
              {playlist.length > 0 && <> · <strong>{totalDuration(playlist)}</strong></>}
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div>
            <input className="playlist-name-input" value={playlistName} onChange={e=>setPlaylistName(e.target.value.toUpperCase())} maxLength={40}/>
            <div className="playlist-meta">
              {playlist.length > 0
                ? `${playlist.length} tracks · ${totalDuration(playlist)} · Click artwork to play on YouTube`
                : "Ask the AI to build your playlist →"}
            </div>
          </div>

          <div className="actions-bar">
            {playlist.length > 0 && <>
              <button className="action-btn btn-primary" onClick={exportPlaylist}>↓ Export Playlist</button>
              <button className="action-btn btn-ghost" onClick={()=>{ setPlaylist([]); setNowPlaying(null); playerRef.current?.stopVideo(); setIsPlaying(false); }}>Clear All</button>
            </>}
          </div>

          <div className="track-list">
            {playlist.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎬</div>
                <div className="empty-title">NO TRACKS YET</div>
                <div className="empty-sub">Describe your vibe to the AI →<br/>Add songs and watch them play on YouTube.</div>
              </div>
            ) : playlist.map((track, i) => {
              const playing = nowPlaying?.id === track.id;
              const emoji = EMOJIS[i % EMOJIS.length];
              const bg = BG_COLORS[i % BG_COLORS.length];
              return (
                <div key={track.id} className={`track-row${playing?" playing":""}`}>
                  <div className="track-index">
                    {playing && isPlaying ? <span className="bars"><span/><span/><span/></span> : i+1}
                  </div>
                  <div className="track-thumb" style={{background: track.thumbnail ? "transparent" : bg}} onClick={()=>track.videoId && playTrack(track)}>
                    {track.thumbnail ? <img src={track.thumbnail} alt=""/> : <span>{emoji}</span>}
                    <div className="thumb-overlay">
                      <div className="yt-play-icon">{playing && isPlaying ? "⏸" : "▶"}</div>
                    </div>
                  </div>
                  <div className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artist}</div>
                    <div className={`track-yt-status ${track.ytStatus}`}>
                      {track.ytStatus === "found" && "● YouTube ready"}
                      {track.ytStatus === "searching" && "○ Finding on YouTube..."}
                      {track.ytStatus === "notfound" && "○ Not found"}
                    </div>
                  </div>
                  {track.genre && <div className="track-genre">{track.genre}</div>}
                  <div className="track-duration">{track.duration}</div>
                  <button className="track-remove" onClick={()=>removeTrack(track.id)}>✕</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI SIDEBAR */}
        <div className="ai-panel">
          <div className="ai-header">
            <div className="ai-dot"/>
            <div className="ai-title">AI Curator</div>
          </div>
          <div className="chat-area">
            {messages.map((msg,i) => (
              <div key={i} className="msg">
                <div className={`msg-avatar ${msg.role}`}>{msg.role==="ai"?"AI":"ME"}</div>
                <div className="msg-body">
                  <div className="msg-name">{msg.role==="ai"?"Playlist AI":"You"}</div>
                  <div className="msg-text">{msg.text}</div>
                  {msg.tracks?.length > 0 && (
                    <div className="msg-tracks">
                      {msg.tracks.map((t,ti) => (
                        <div key={ti} className="mini-track" onClick={()=>addTrack(t)}>
                          <div className="mini-track-num">{ti+1}</div>
                          <div className="mini-track-thumb">🎵</div>
                          <div className="mini-track-info">
                            <div className="mini-track-title">{t.title}</div>
                            <div className="mini-track-artist">{t.artist} · {t.duration}</div>
                          </div>
                          <div className="mini-track-add">+</div>
                        </div>
                      ))}
                      <button className="add-all-btn" onClick={()=>addAll(msg.tracks)}>
                        + ADD ALL {msg.tracks.length} TRACKS
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="msg">
                <div className="msg-avatar ai">AI</div>
                <div className="msg-body">
                  <div className="msg-name">Playlist AI</div>
                  <div className="loading-dots"><span/><span/><span/></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>
          <div className="suggestions-row">
            {PROMPTS.map((p,i) => <div key={i} className="suggestion-chip" onClick={()=>sendMessage(p)}>{p}</div>)}
          </div>
          <div className="chat-input-wrap">
            <textarea className="chat-input" placeholder="Describe a mood, genre, activity..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} rows={1}/>
            <button className="send-btn" onClick={()=>sendMessage()} disabled={loading||!input.trim()}>↑</button>
          </div>
        </div>

        {/* YOUTUBE PLAYER BAR */}
        <div className={`player-bar ${nowPlaying ? "visible" : "hidden"}`}>
          <div className="yt-embed-wrap">
            <div ref={playerDivRef}/>
          </div>
          {nowPlaying && (
            <div className="player-info-wrap">
              <div className="player-now">
                <div className="player-text">
                  <div className="player-title">{nowPlaying.title}</div>
                  <div className="player-artist">{nowPlaying.artist}</div>
                  <div className="player-badge">▶ Playing on YouTube</div>
                </div>
              </div>
              <div className="player-controls">
                <button className="ctrl-btn" onClick={()=>skipTrack(-1)} disabled={!playlist.length}>⏮</button>
                <button className="play-btn" onClick={togglePlay}>{isPlaying?"⏸":"▶"}</button>
                <button className="ctrl-btn" onClick={()=>skipTrack(1)} disabled={!playlist.length}>⏭</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
