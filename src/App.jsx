import { useState, useRef, useEffect, useCallback } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d0d14; --surface: #13131f; --card: #1a1a2e; --border: #2a2a45;
    --purple: #7c3aed; --purple-light: #a78bfa; --purple-dim: rgba(124,58,237,0.12);
    --text: #f1f0f9; --muted: #6b6a85; --font: 'Inter', sans-serif;
  }
  body { background:var(--bg); color:var(--text); font-family:var(--font); min-height:100vh; }
  .app { display:grid; grid-template-rows:auto 1fr auto; height:100vh; max-width:900px; margin:0 auto; position:relative; }

  /* HEADER */
  .header { display:flex; align-items:center; gap:12px; padding:16px 24px; border-bottom:1px solid var(--border); }
  .logo { font-size:17px; font-weight:600; letter-spacing:-.3px; }
  .logo span { color:var(--purple-light); }
  .yt-badge { font-size:10px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#ff6b6b; background:rgba(255,0,0,.1); border:1px solid rgba(255,0,0,.25); padding:3px 9px; border-radius:20px; }
  .header-right { margin-left:auto; display:flex; align-items:center; gap:10px; }
  .track-count-label { font-size:12px; color:var(--muted); }
  .track-count-label strong { color:var(--text); font-weight:500; }
  .ai-toggle-btn { display:flex; align-items:center; gap:7px; padding:8px 16px; border-radius:20px; background:var(--purple-dim); border:1px solid var(--purple); color:var(--purple-light); font-family:var(--font); font-size:12px; font-weight:500; cursor:pointer; transition:all .15s; }
  .ai-toggle-btn:hover { background:rgba(124,58,237,.22); }
  .ai-toggle-btn.active { background:var(--purple); color:white; border-color:var(--purple); }
  .ai-dot { width:6px; height:6px; background:currentColor; border-radius:50%; animation:pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

  /* MAIN */
  .main { padding:24px; overflow-y:auto; display:flex; flex-direction:column; gap:20px; }

  /* AI DRAWER */
  .backdrop { position:fixed; inset:0; z-index:40; background:rgba(0,0,0,.45); }
  .backdrop.hidden { display:none; }
  .ai-drawer { position:fixed; top:57px; left:0; right:0; max-width:900px; margin:0 auto; background:var(--surface); border:1px solid var(--border); border-top:none; border-radius:0 0 16px 16px; z-index:50; overflow:hidden; transition:max-height .3s ease, opacity .25s ease; box-shadow:0 24px 60px rgba(0,0,0,.6); }
  .ai-drawer.open { max-height:540px; opacity:1; }
  .ai-drawer.closed { max-height:0; opacity:0; pointer-events:none; }
  .drawer-header { padding:14px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .drawer-title { font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:var(--muted); }
  .drawer-close { width:26px; height:26px; border-radius:6px; border:1px solid var(--border); background:transparent; color:var(--muted); cursor:pointer; font-size:13px; transition:all .12s; display:flex; align-items:center; justify-content:center; }
  .drawer-close:hover { border-color:var(--purple); color:var(--purple-light); }

  /* CHAT */
  .chat-area { overflow-y:auto; padding:16px 18px; display:flex; flex-direction:column; gap:12px; max-height:290px; }
  .chat-area::-webkit-scrollbar { width:3px; }
  .chat-area::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }
  .msg { display:flex; gap:9px; animation:fadeUp .25s ease; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .msg-avatar { width:26px; height:26px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:600; }
  .msg-avatar.ai { background:var(--purple-dim); border:1px solid var(--purple); color:var(--purple-light); }
  .msg-avatar.user { background:rgba(255,255,255,.05); border:1px solid var(--border); color:var(--muted); }
  .msg-name { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); margin-bottom:4px; }
  .msg-text { font-size:13px; line-height:1.65; color:#c4c2d8; }
  .msg-tracks { margin-top:9px; display:flex; flex-direction:column; gap:4px; }
  .mini-track { display:flex; align-items:center; gap:9px; background:var(--card); border:1px solid var(--border); border-radius:8px; padding:7px 10px; cursor:pointer; transition:all .12s; }
  .mini-track:hover { border-color:var(--purple); background:var(--purple-dim); }
  .mini-track-num { color:var(--muted); font-size:11px; width:14px; flex-shrink:0; }
  .mini-track-info { flex:1; min-width:0; }
  .mini-track-title { font-size:12px; font-weight:500; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mini-track-artist { font-size:11px; color:var(--muted); margin-top:1px; }
  .mini-track-add { color:var(--purple-light); font-size:15px; opacity:.6; flex-shrink:0; transition:opacity .1s; }
  .mini-track:hover .mini-track-add { opacity:1; }
  .add-all-btn { margin-top:6px; width:100%; padding:8px; background:var(--purple-dim); border:1px solid var(--purple); color:var(--purple-light); border-radius:8px; font-size:12px; font-weight:500; cursor:pointer; font-family:var(--font); transition:all .12s; }
  .add-all-btn:hover { background:rgba(124,58,237,.22); }

  .suggestions-row { display:flex; gap:6px; flex-wrap:wrap; padding:8px 18px; border-top:1px solid var(--border); }
  .chip { padding:5px 11px; border-radius:20px; border:1px solid var(--border); background:transparent; color:var(--muted); font-size:11px; cursor:pointer; transition:all .12s; white-space:nowrap; font-family:var(--font); }
  .chip:hover { border-color:var(--purple); color:var(--purple-light); }

  .input-wrap { padding:12px 18px; border-top:1px solid var(--border); display:flex; gap:8px; align-items:flex-end; }
  .chat-input { flex:1; background:var(--card); border:1px solid var(--border); border-radius:10px; padding:9px 13px; font-size:13px; color:var(--text); font-family:var(--font); resize:none; outline:none; line-height:1.5; transition:border-color .15s; max-height:80px; min-height:38px; }
  .chat-input:focus { border-color:var(--purple); }
  .chat-input::placeholder { color:var(--muted); }
  .send-btn { width:38px; height:38px; background:var(--purple); border:none; border-radius:10px; color:white; font-size:14px; cursor:pointer; transition:all .15s; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  .send-btn:hover { background:#6d28d9; }
  .send-btn:disabled { opacity:.35; cursor:not-allowed; }
  .loading-dots { display:inline-flex; gap:4px; align-items:center; padding:5px 0; }
  .loading-dots span { width:5px; height:5px; background:var(--purple); border-radius:50%; animation:bounce 1.1s ease-in-out infinite; }
  .loading-dots span:nth-child(2){animation-delay:.18s} .loading-dots span:nth-child(3){animation-delay:.36s}
  @keyframes bounce { 0%,80%,100%{transform:scale(.5);opacity:.3} 40%{transform:scale(1);opacity:1} }

  /* PLAYLIST */
  .pl-name { font-size:24px; font-weight:600; letter-spacing:-.4px; background:transparent; border:none; border-bottom:1.5px solid var(--border); color:var(--text); outline:none; width:100%; padding-bottom:4px; transition:border-color .2s; }
  .pl-name:focus { border-color:var(--purple); }
  .pl-meta { font-size:12px; color:var(--muted); margin-top:5px; }
  .actions { display:flex; gap:8px; }
  .btn { padding:8px 16px; border-radius:8px; font-size:12px; font-weight:500; cursor:pointer; font-family:var(--font); transition:all .15s; }
  .btn-primary { background:var(--purple); border:1px solid var(--purple); color:white; }
  .btn-primary:hover { background:#6d28d9; }
  .btn-ghost { background:transparent; border:1px solid var(--border); color:var(--muted); }
  .btn-ghost:hover { border-color:var(--purple); color:var(--purple-light); }

  .track-list { display:flex; flex-direction:column; gap:3px; }
  .empty { text-align:center; padding:60px 20px; border:1.5px dashed var(--border); border-radius:12px; color:var(--muted); }
  .empty-icon { font-size:40px; margin-bottom:14px; opacity:.3; }
  .empty-title { font-size:15px; font-weight:600; color:var(--text); margin-bottom:6px; opacity:.4; }
  .empty-sub { font-size:13px; line-height:1.6; }

  .track-row { display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--card); border:1px solid var(--border); border-radius:10px; transition:all .12s; animation:fadeUp .2s ease; }
  .track-row:hover { border-color:rgba(124,58,237,.4); }
  .track-row.playing { border-color:var(--purple); background:var(--purple-dim); }
  .track-num { width:20px; text-align:center; font-size:12px; color:var(--muted); flex-shrink:0; }
  .track-thumb { width:52px; height:38px; border-radius:6px; overflow:hidden; flex-shrink:0; background:var(--border); display:flex; align-items:center; justify-content:center; font-size:15px; cursor:pointer; position:relative; transition:transform .1s; }
  .track-thumb:hover { transform:scale(1.05); }
  .track-thumb img { width:100%; height:100%; object-fit:cover; }
  .thumb-overlay { position:absolute; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .12s; }
  .track-thumb:hover .thumb-overlay, .track-row.playing .thumb-overlay { opacity:1; }
  .yt-icon { width:20px; height:20px; background:#ff0000; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:9px; color:white; }
  .track-info { flex:1; min-width:0; }
  .track-title { font-size:13.5px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .track-artist { font-size:11.5px; color:var(--muted); margin-top:2px; }
  .track-status { font-size:9px; text-transform:uppercase; letter-spacing:1px; margin-top:2px; }
  .track-status.found { color:var(--purple-light); }
  .track-status.searching { color:var(--muted); }
  .track-status.notfound { color:var(--muted); opacity:.5; }
  .track-genre { font-size:10px; background:var(--purple-dim); border:1px solid rgba(124,58,237,.25); color:var(--purple-light); padding:2px 8px; border-radius:20px; white-space:nowrap; flex-shrink:0; }
  .track-dur { font-size:12px; color:var(--muted); flex-shrink:0; }
  .track-del { width:26px; height:26px; border-radius:6px; border:none; background:transparent; color:var(--muted); cursor:pointer; font-size:13px; flex-shrink:0; opacity:0; transition:all .1s; display:flex; align-items:center; justify-content:center; }
  .track-row:hover .track-del { opacity:1; }
  .track-del:hover { background:rgba(124,58,237,.15); color:var(--purple-light); }
  .bars { display:inline-flex; gap:2px; align-items:flex-end; height:13px; }
  .bars span { width:3px; background:var(--purple-light); border-radius:1px; animation:bar .65s ease-in-out infinite alternate; }
  .bars span:nth-child(1){height:5px} .bars span:nth-child(2){height:10px;animation-delay:.15s} .bars span:nth-child(3){height:13px;animation-delay:.3s}
  @keyframes bar { from{transform:scaleY(.3)} to{transform:scaleY(1)} }

  /* PLAYER */
  .player { background:var(--surface); border-top:1px solid var(--border); display:flex; align-items:stretch; overflow:hidden; transition:max-height .3s ease; }
  .player.hidden { max-height:0; border-top:none; }
  .player.visible { max-height:180px; }
  .yt-wrap { width:200px; flex-shrink:0; background:#000; }
  .yt-wrap > div { width:100%; height:100%; }
  .player-info { flex:1; padding:16px 24px; display:flex; align-items:center; gap:24px; }
  .player-text { flex:1; min-width:0; }
  .player-title { font-size:14px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .player-artist { font-size:12px; color:var(--muted); margin-top:2px; }
  .player-badge { font-size:9px; color:var(--purple-light); letter-spacing:1.5px; text-transform:uppercase; margin-top:4px; }
  .controls { display:flex; align-items:center; gap:10px; flex-shrink:0; }
  .ctrl { width:34px; height:34px; border-radius:50%; border:1px solid var(--border); background:var(--card); color:var(--text); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; transition:all .12s; }
  .ctrl:hover { border-color:var(--purple); color:var(--purple-light); }
  .ctrl:disabled { opacity:.25; cursor:not-allowed; }
  .play { width:42px; height:42px; border-radius:50%; border:none; background:var(--purple); color:white; cursor:pointer; font-size:15px; transition:all .15s; display:flex; align-items:center; justify-content:center; }
  .play:hover { background:#6d28d9; transform:scale(1.05); }
`;

const EMOJIS = ["🎵","🎸","🎹","🎷","🎺","🥁","🎻","🎤","🎧","🎼"];
const PROMPTS = ["Late night lo-fi 📚","Road trip bangers 🚗","90s hip-hop 🎤","Dark ambient 🌑","Indie pop ☀️","Workout mix 💪"];

function totalDur(tracks) {
  const s = tracks.reduce((a,t)=>{ const [m,s]=(t.duration||"0:00").split(":").map(Number); return a+m*60+(s||0); },0);
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  return h>0?`${h}h ${m}m`:`${m}m ${sec.toString().padStart(2,"0")}s`;
}

async function ytSearch(title, artist) {
  try {
    const q = encodeURIComponent(`${title} ${artist} official audio`);
    const r = await fetch(`/api/youtube-search?q=${q}`);
    const d = await r.json();
    const item = d?.items?.[0];
    if (!item) return null;
    return { videoId:item.id?.videoId, thumbnail:item.snippet?.thumbnails?.medium?.url };
  } catch { return null; }
}

let ytLoaded=false, ytReady=false;
const ytCbs=[];
function loadYT() {
  if (ytLoaded) return; ytLoaded=true;
  const s=document.createElement("script"); s.src="https://www.youtube.com/iframe_api"; document.head.appendChild(s);
  window.onYouTubeIframeAPIReady=()=>{ ytReady=true; ytCbs.forEach(c=>c()); };
}
function onYT(cb) { if(ytReady) cb(); else ytCbs.push(cb); }

export default function App() {
  const [playlist, setPlaylist] = useState([]);
  const [name, setName] = useState("My Playlist");
  const [aiOpen, setAiOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role:"ai", text:"Hi! Tell me a vibe, mood, or genre and I'll build your playlist. Click any track to play on YouTube 🎬", tracks:null }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [playing, setPlaying] = useState(false);
  const chatEnd = useRef(null);
  const playerRef = useRef(null);
  const playerDiv = useRef(null);

  useEffect(()=>{ if(aiOpen) chatEnd.current?.scrollIntoView({behavior:"smooth"}); },[msgs,loading,aiOpen]);
  useEffect(()=>{ loadYT(); },[]);

  const initPlayer = useCallback((videoId)=>{
    onYT(()=>{
      if (playerRef.current) { playerRef.current.loadVideoById(videoId); playerRef.current.playVideo(); setPlaying(true); return; }
      playerRef.current = new window.YT.Player(playerDiv.current, {
        height:"100%", width:"100%", videoId,
        playerVars:{ autoplay:1, controls:1, rel:0, modestbranding:1 },
        events:{ onStateChange:(e)=>{
          const S=window.YT.PlayerState;
          if(e.data===S.PLAYING) setPlaying(true);
          if(e.data===S.PAUSED) setPlaying(false);
          if(e.data===S.ENDED){
            setPlaying(false);
            setNowPlaying(prev=>{
              if(!prev) return prev;
              setPlaylist(pl=>{
                const i=pl.findIndex(t=>t.id===prev.id);
                const next=pl[i+1];
                if(next?.videoId) setTimeout(()=>{ setNowPlaying(next); playerRef.current?.loadVideoById(next.videoId); playerRef.current?.playVideo(); setPlaying(true); },500);
                return pl;
              });
              return prev;
            });
          }
        }}
      });
    });
  },[]);

  const playTrack = useCallback((t)=>{ if(!t.videoId) return; setNowPlaying(t); initPlayer(t.videoId); },[initPlayer]);
  const togglePlay = ()=>{ if(!playerRef.current) return; if(playing){playerRef.current.pauseVideo();setPlaying(false);}else{playerRef.current.playVideo();setPlaying(true);} };
  const skip = (d)=>{ if(!nowPlaying) return; const i=playlist.findIndex(t=>t.id===nowPlaying.id); const n=playlist[i+d]; if(n) playTrack(n); };

  const addTrack = useCallback(async(track)=>{
    if(playlist.find(t=>t.title===track.title&&t.artist===track.artist)) return;
    const id=Date.now()+Math.random();
    setPlaylist(p=>[...p,{...track,id,videoId:null,thumbnail:null,ytStatus:"searching"}]);
    const yt=await ytSearch(track.title,track.artist);
    setPlaylist(p=>p.map(t=>t.id===id?{...t,videoId:yt?.videoId||null,thumbnail:yt?.thumbnail||null,ytStatus:yt?.videoId?"found":"notfound"}:t));
  },[playlist]);

  const addAll=(tracks)=>tracks.forEach(t=>addTrack(t));
  const remove=(id)=>{ if(nowPlaying?.id===id){setNowPlaying(null);playerRef.current?.stopVideo();setPlaying(false);} setPlaylist(p=>p.filter(t=>t.id!==id)); };

  const send=async(text)=>{
    const t=text||input.trim(); if(!t||loading) return;
    setInput(""); setMsgs(p=>[...p,{role:"user",text:t}]); setLoading(true);
    try {
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        system:`You are a music playlist curator. Respond with a 1-2 sentence intro, then exactly 8 songs as JSON:\n\`\`\`json\n[{"title":"Song Title","artist":"Artist Name","genre":"Genre","duration":"3:42"}]\n\`\`\`\nShort genres, realistic durations. End with one sentence about the selection.`,
        messages:[{role:"user",content:t}]
      })});
      const raw=await res.text();
      let data; try { data=JSON.parse(raw); } catch { throw new Error(raw.slice(0,100)); }
      const full=data.content?.map(b=>b.text||"").join("")||"";
      const match=full.match(/```json\s*([\s\S]*?)```/);
      let tracks=null,display=full;
      if(match){try{tracks=JSON.parse(match[1].trim());display=full.replace(/```json[\s\S]*?```/,"").trim();}catch{}}
      setMsgs(p=>[...p,{role:"ai",text:display,tracks}]);
    } catch(e){ setMsgs(p=>[...p,{role:"ai",text:`Error: ${e.message}`,tracks:null}]); }
    setLoading(false);
  };

  const exportPl=()=>{
    const text=`${name}\n${"─".repeat(30)}\n\n`+playlist.map((t,i)=>`${i+1}. ${t.title} — ${t.artist} [${t.duration}]${t.videoId?`\n   https://youtube.com/watch?v=${t.videoId}`:""}`).join("\n\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"})); a.download=`${name.replace(/\s+/g,"_").toLowerCase()}.txt`; a.click();
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        <div className="header">
          <div className="logo">Playlist<span>.ai</span></div>
          <div className="yt-badge">▶ YouTube</div>
          <div className="header-right">
            <div className="track-count-label">
              <strong>{playlist.length}</strong> tracks{playlist.length>0&&<> · <strong>{totalDur(playlist)}</strong></>}
            </div>
            <button className={`ai-toggle-btn${aiOpen?" active":""}`} onClick={()=>setAiOpen(o=>!o)}>
              <span className="ai-dot"/>
              {aiOpen?"Close AI":"✦ Ask AI"}
            </button>
          </div>
        </div>

        <div className={`backdrop${aiOpen?"":" hidden"}`} onClick={()=>setAiOpen(false)}/>

        <div className={`ai-drawer ${aiOpen?"open":"closed"}`}>
          <div className="drawer-header">
            <span className="drawer-title">AI Curator</span>
            <button className="drawer-close" onClick={()=>setAiOpen(false)}>✕</button>
          </div>
          <div className="chat-area">
            {msgs.map((m,i)=>(
              <div key={i} className="msg">
                <div className={`msg-avatar ${m.role}`}>{m.role==="ai"?"AI":"↑"}</div>
                <div>
                  <div className="msg-name">{m.role==="ai"?"Playlist AI":"You"}</div>
                  <div className="msg-text">{m.text}</div>
                  {m.tracks?.length>0&&(
                    <div className="msg-tracks">
                      {m.tracks.map((t,ti)=>(
                        <div key={ti} className="mini-track" onClick={()=>addTrack(t)}>
                          <div className="mini-track-num">{ti+1}</div>
                          <div className="mini-track-info">
                            <div className="mini-track-title">{t.title}</div>
                            <div className="mini-track-artist">{t.artist} · {t.duration}</div>
                          </div>
                          <div className="mini-track-add">+</div>
                        </div>
                      ))}
                      <button className="add-all-btn" onClick={()=>addAll(m.tracks)}>+ Add all {m.tracks.length} tracks</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading&&<div className="msg"><div className="msg-avatar ai">AI</div><div><div className="msg-name">Playlist AI</div><div className="loading-dots"><span/><span/><span/></div></div></div>}
            <div ref={chatEnd}/>
          </div>
          <div className="suggestions-row">
            {PROMPTS.map((p,i)=><button key={i} className="chip" onClick={()=>send(p)}>{p}</button>)}
          </div>
          <div className="input-wrap">
            <textarea className="chat-input" placeholder="Describe a mood or genre..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} rows={1}/>
            <button className="send-btn" onClick={()=>send()} disabled={loading||!input.trim()}>↑</button>
          </div>
        </div>

        <div className="main">
          <div>
            <input className="pl-name" value={name} onChange={e=>setName(e.target.value)} maxLength={40} placeholder="Playlist name..."/>
            <div className="pl-meta">{playlist.length>0?`${playlist.length} tracks · ${totalDur(playlist)} · Click artwork to play`:'Tap "✦ Ask AI" to get started'}</div>
          </div>

          {playlist.length>0&&(
            <div className="actions">
              <button className="btn btn-primary" onClick={exportPl}>↓ Export</button>
              <button className="btn btn-ghost" onClick={()=>{setPlaylist([]);setNowPlaying(null);playerRef.current?.stopVideo();setPlaying(false);}}>Clear</button>
            </div>
          )}

          <div className="track-list">
            {playlist.length===0?(
              <div className="empty">
                <div className="empty-icon">🎬</div>
                <div className="empty-title">No tracks yet</div>
                <div className="empty-sub">Tap "✦ Ask AI" to describe your vibe<br/>and build your playlist.</div>
              </div>
            ):playlist.map((track,i)=>{
              const isPlaying=nowPlaying?.id===track.id;
              return (
                <div key={track.id} className={`track-row${isPlaying?" playing":""}`}>
                  <div className="track-num">{isPlaying&&playing?<span className="bars"><span/><span/><span/></span>:i+1}</div>
                  <div className="track-thumb" onClick={()=>track.videoId&&playTrack(track)}>
                    {track.thumbnail?<img src={track.thumbnail} alt=""/>:<span>{EMOJIS[i%EMOJIS.length]}</span>}
                    <div className="thumb-overlay"><div className="yt-icon">{isPlaying&&playing?"⏸":"▶"}</div></div>
                  </div>
                  <div className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artist}</div>
                    <div className={`track-status ${track.ytStatus}`}>
                      {track.ytStatus==="found"&&"● ready"}
                      {track.ytStatus==="searching"&&"○ searching..."}
                      {track.ytStatus==="notfound"&&"○ not found"}
                    </div>
                  </div>
                  {track.genre&&<div className="track-genre">{track.genre}</div>}
                  <div className="track-dur">{track.duration}</div>
                  <button className="track-del" onClick={()=>remove(track.id)}>✕</button>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`player ${nowPlaying?"visible":"hidden"}`}>
          <div className="yt-wrap"><div ref={playerDiv}/></div>
          {nowPlaying&&(
            <div className="player-info">
              <div className="player-text">
                <div className="player-title">{nowPlaying.title}</div>
                <div className="player-artist">{nowPlaying.artist}</div>
                <div className="player-badge">▶ Playing on YouTube</div>
              </div>
              <div className="controls">
                <button className="ctrl" onClick={()=>skip(-1)} disabled={!playlist.length}>⏮</button>
                <button className="play" onClick={togglePlay}>{playing?"⏸":"▶"}</button>
                <button className="ctrl" onClick={()=>skip(1)} disabled={!playlist.length}>⏭</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
