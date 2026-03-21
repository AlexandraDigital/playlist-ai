import { useState, useRef, useEffect, useCallback } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #000; color: #fff; font-family: 'Inter', sans-serif; min-height: 100vh; }

  .app { max-width: 480px; margin: 0 auto; padding: 48px 20px 120px; display: flex; flex-direction: column; gap: 20px; }

  /* HEADER */
  .hero { text-align: center; margin-bottom: 8px; }
  .hero-title { font-size: 38px; font-weight: 700; letter-spacing: -1px; background: linear-gradient(135deg, #a855f7, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; display: inline-flex; align-items: center; gap: 10px; }
  .hero-note { -webkit-text-fill-color: #a855f7; }
  .hero-sub { color: #888; font-size: 15px; margin-top: 10px; line-height: 1.5; }

  /* INPUT ROW */
  .input-row { display: flex; gap: 10px; align-items: center; }
  .vibe-input { flex: 1; background: #1a1a1a; border: none; border-radius: 12px; padding: 14px 16px; font-size: 14px; color: #fff; font-family: 'Inter', sans-serif; outline: none; }
  .vibe-input::placeholder { color: #555; }
  .gen-btn { background: #7c3aed; border: none; border-radius: 12px; padding: 14px 20px; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; font-family: 'Inter', sans-serif; transition: background .15s; flex-shrink: 0; }
  .gen-btn:hover { background: #6d28d9; }
  .gen-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* SEARCH PILL */
  .search-pill { display: flex; align-items: center; justify-content: center; gap: 8px; border: 1.5px solid #2a2a2a; border-radius: 999px; padding: 10px 24px; color: #aaa; font-size: 14px; cursor: pointer; background: transparent; font-family: 'Inter', sans-serif; transition: all .15s; width: fit-content; margin: 0 auto; }
  .search-pill:hover { border-color: #7c3aed; color: #c084fc; }

  /* CARDS */
  .card { background: #111; border-radius: 16px; overflow: hidden; }
  .card-header { padding: 18px 20px 14px; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #fff; }
  .card-body { padding: 0 20px 20px; }
  .card-empty { text-align: center; padding: 40px 20px 48px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .card-empty-icon { font-size: 42px; }
  .card-empty-text { color: #555; font-size: 14px; }

  /* AI MESSAGES */
  .ai-msg-text { font-size: 14px; color: #bbb; line-height: 1.6; padding: 0 0 14px; }
  .mini-tracks { display: flex; flex-direction: column; gap: 6px; }
  .mini-track { display: flex; align-items: center; gap: 10px; background: #1a1a1a; border-radius: 10px; padding: 10px 12px; cursor: pointer; transition: background .12s; }
  .mini-track:hover { background: #222; }
  .mini-track-num { color: #555; font-size: 12px; width: 16px; flex-shrink: 0; }
  .mini-track-info { flex: 1; min-width: 0; }
  .mini-track-title { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mini-track-artist { font-size: 12px; color: #666; margin-top: 2px; }
  .mini-track-add { color: #7c3aed; font-size: 18px; flex-shrink: 0; }
  .add-all-btn { width: 100%; margin-top: 10px; padding: 10px; background: #7c3aed; border: none; border-radius: 10px; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background .15s; }
  .add-all-btn:hover { background: #6d28d9; }
  .loading-dots { display: inline-flex; gap: 5px; align-items: center; padding: 16px 0 24px; }
  .loading-dots span { width: 6px; height: 6px; background: #7c3aed; border-radius: 50%; animation: bounce 1.1s ease-in-out infinite; }
  .loading-dots span:nth-child(2) { animation-delay: .18s; } .loading-dots span:nth-child(3) { animation-delay: .36s; }
  @keyframes bounce { 0%,80%,100%{transform:scale(.4);opacity:.3} 40%{transform:scale(1);opacity:1} }

  /* PLAYLIST TRACKS */
  .pl-tracks { display: flex; flex-direction: column; gap: 4px; }
  .track-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #1a1a1a; border-radius: 10px; transition: background .12s; }
  .track-row:hover { background: #222; }
  .track-row.playing { background: rgba(124,58,237,.15); }
  .track-num { width: 18px; text-align: center; font-size: 12px; color: #555; flex-shrink: 0; }
  .track-thumb { width: 44px; height: 34px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background: #2a2a2a; display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer; position: relative; }
  .track-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .thumb-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .12s; border-radius: 6px; }
  .track-thumb:hover .thumb-overlay, .track-row.playing .thumb-overlay { opacity: 1; }
  .yt-icon { font-size: 12px; }
  .track-info { flex: 1; min-width: 0; }
  .track-title { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .track-artist { font-size: 11px; color: #666; margin-top: 2px; }
  .track-dur { font-size: 12px; color: #555; flex-shrink: 0; }
  .track-del { background: transparent; border: none; color: #444; cursor: pointer; font-size: 14px; flex-shrink: 0; opacity: 0; transition: all .1s; padding: 2px 4px; }
  .track-row:hover .track-del { opacity: 1; }
  .track-del:hover { color: #a855f7; }
  .bars { display: inline-flex; gap: 2px; align-items: flex-end; height: 12px; }
  .bars span { width: 3px; background: #a855f7; border-radius: 1px; animation: bar .65s ease-in-out infinite alternate; }
  .bars span:nth-child(1){height:4px} .bars span:nth-child(2){height:9px;animation-delay:.15s} .bars span:nth-child(3){height:12px;animation-delay:.3s}
  @keyframes bar { from{transform:scaleY(.3)} to{transform:scaleY(1)} }

  /* SEARCH MODAL */
  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
  .modal-bg.hidden { display: none; }
  .modal { background: #111; border-radius: 20px 20px 0 0; width: 100%; max-width: 480px; padding: 20px; max-height: 70vh; overflow-y: auto; }
  .modal-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px; }
  .modal-input { width: 100%; background: #1a1a1a; border: none; border-radius: 10px; padding: 12px 14px; font-size: 14px; color: #fff; font-family: 'Inter', sans-serif; outline: none; margin-bottom: 12px; }
  .modal-input::placeholder { color: #555; }
  .modal-result { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #1a1a1a; border-radius: 10px; cursor: pointer; margin-bottom: 6px; }
  .modal-result:hover { background: #222; }
  .modal-close { width: 100%; padding: 12px; background: #1a1a1a; border: none; border-radius: 10px; color: #888; font-family: 'Inter', sans-serif; font-size: 14px; cursor: pointer; margin-top: 8px; }

  /* PLAYER */
  .player { position: fixed; bottom: 0; left: 0; right: 0; background: #111; border-top: 1px solid #1e1e1e; padding: 12px 20px; display: flex; align-items: center; gap: 14px; max-width: 480px; margin: 0 auto; transition: transform .3s ease; }
  .player.hidden { transform: translateY(100%); }
  .player-thumb { width: 44px; height: 34px; border-radius: 6px; overflow: hidden; background: #222; flex-shrink: 0; }
  .player-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .player-info { flex: 1; min-width: 0; }
  .player-title { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .player-artist { font-size: 11px; color: #666; }
  .player-controls { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .ctrl { background: transparent; border: none; color: #aaa; cursor: pointer; font-size: 14px; padding: 4px; transition: color .12s; }
  .ctrl:hover { color: #fff; }
  .ctrl:disabled { opacity: .25; cursor: not-allowed; }
  .play-btn { width: 38px; height: 38px; border-radius: 50%; background: #7c3aed; border: none; color: #fff; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: background .15s; }
  .play-btn:hover { background: #6d28d9; }
  .yt-hidden { position: fixed; bottom: -200px; left: -200px; width: 1px; height: 1px; overflow: hidden; }

  /* PLAYLIST ACTIONS */
  .pl-actions { display: flex; gap: 8px; margin-bottom: 14px; }
  .pl-name-input { flex: 1; background: transparent; border: none; border-bottom: 1.5px solid #222; color: #fff; font-size: 16px; font-weight: 600; font-family: 'Inter', sans-serif; outline: none; padding-bottom: 4px; }
  .pl-name-input:focus { border-color: #7c3aed; }
  .action-btn { background: #1a1a1a; border: none; border-radius: 8px; padding: 7px 14px; color: #aaa; font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all .12s; }
  .action-btn:hover { color: #fff; background: #222; }
`;

const EMOJIS = ["🎵","🎸","🎹","🎷","🎺","🥁","🎻","🎤","🎧","🎼"];

function totalDur(tracks) {
  const s = tracks.reduce((a,t)=>{ const [m,sec]=(t.duration||"0:00").split(":").map(Number); return a+m*60+(sec||0); },0);
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
  const [aiTracks, setAiTracks] = useState(null);
  const [aiText, setAiText] = useState("");
  const [vibe, setVibe] = useState("");
  const [loading, setLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const playerRef = useRef(null);
  const playerDiv = useRef(null);

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
          if(e.data===S.PAUSED||e.data===S.ENDED) setPlaying(false);
          if(e.data===S.ENDED){
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
  const togglePlay = ()=>{ if(!playerRef.current) return; if(playing){playerRef.current.pauseVideo();}else{playerRef.current.playVideo();} };
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

  const generate=async()=>{
    const t=vibe.trim(); if(!t||loading) return;
    setLoading(true); setAiTracks(null); setAiText("");
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
      setAiText(display); setAiTracks(tracks);
    } catch(e){ setAiText(`Error: ${e.message}`); }
    setLoading(false);
  };

  const doSearch=async(q)=>{
    if(!q.trim()) return;
    setSearching(true); setSearchResults([]);
    try {
      const r=await fetch(`/api/youtube-search?q=${encodeURIComponent(q)}`);
      const d=await r.json();
      setSearchResults(d?.items||[]);
    } catch {}
    setSearching(false);
  };

  const addFromSearch=(item)=>{
    const track={
      title: item.snippet?.title||"Unknown",
      artist: item.snippet?.channelTitle||"",
      duration: "?",
      videoId: item.id?.videoId,
      thumbnail: item.snippet?.thumbnails?.medium?.url
    };
    const id=Date.now()+Math.random();
    setPlaylist(p=>[...p,{...track,id,ytStatus:"found"}]);
    setSearchOpen(false); setSearchQ(""); setSearchResults([]);
  };

  const exportPl=()=>{
    const text=`${name}\n${"─".repeat(30)}\n\n`+playlist.map((t,i)=>`${i+1}. ${t.title} — ${t.artist}${t.videoId?`\n   https://youtube.com/watch?v=${t.videoId}`:""}`).join("\n\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"})); a.download=`${name.replace(/\s+/g,"_").toLowerCase()}.txt`; a.click();
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        {/* HERO */}
        <div className="hero">
          <div className="hero-title"><span className="hero-note">♫</span> Playlist AI</div>
          <div className="hero-sub">Describe your vibe — AI curates the songs, you own the playlist</div>
        </div>

        {/* INPUT ROW */}
        <div className="input-row">
          <input
            className="vibe-input"
            placeholder="e.g. chill lo-fi beats for late night..."
            value={vibe}
            onChange={e=>setVibe(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") generate(); }}
          />
          <button className="gen-btn" onClick={generate} disabled={loading||!vibe.trim()}>✦ Generate</button>
        </div>

        {/* SEARCH PILL */}
        <button className="search-pill" onClick={()=>setSearchOpen(true)}>🔍 Search any song</button>

        {/* AI SUGGESTIONS CARD */}
        <div className="card">
          <div className="card-header">AI Suggestions</div>
          {loading ? (
            <div className="card-body"><div className="loading-dots"><span/><span/><span/></div></div>
          ) : aiTracks?.length > 0 ? (
            <div className="card-body">
              {aiText ? <div className="ai-msg-text">{aiText}</div> : null}
              <div className="mini-tracks">
                {aiTracks.map((t,i)=>(
                  <div key={i} className="mini-track" onClick={()=>addTrack(t)}>
                    <div className="mini-track-num">{i+1}</div>
                    <div className="mini-track-info">
                      <div className="mini-track-title">{t.title}</div>
                      <div className="mini-track-artist">{t.artist} · {t.duration}</div>
                    </div>
                    <div className="mini-track-add">+</div>
                  </div>
                ))}
              </div>
              <button className="add-all-btn" onClick={()=>addAll(aiTracks)}>+ Add all {aiTracks.length} tracks to playlist</button>
            </div>
          ) : (
            <div className="card-empty">
              <div className="card-empty-icon">🎧</div>
              <div className="card-empty-text">Generate a playlist to see suggestions here</div>
            </div>
          )}
        </div>

        {/* MY PLAYLIST CARD */}
        <div className="card">
          <div className="card-header">My Playlist</div>
          {playlist.length > 0 ? (
            <div className="card-body">
              <div className="pl-actions">
                <input className="pl-name-input" value={name} onChange={e=>setName(e.target.value)} maxLength={40}/>
                <button className="action-btn" onClick={exportPl}>↓ Export</button>
                <button className="action-btn" onClick={()=>{setPlaylist([]);setNowPlaying(null);playerRef.current?.stopVideo();setPlaying(false);}}>Clear</button>
              </div>
              <div className="pl-tracks">
                {playlist.map((track,i)=>{
                  const isPlaying=nowPlaying?.id===track.id;
                  return (
                    <div key={track.id} className={`track-row${isPlaying?" playing":""}`}>
                      <div className="track-num">{isPlaying&&playing?<span className="bars"><span/><span/><span/></span>:i+1}</div>
                      <div className="track-thumb" onClick={()=>track.videoId&&playTrack(track)}>
                        {track.thumbnail?<img src={track.thumbnail} alt=""/>:<span>{EMOJIS[i%EMOJIS.length]}</span>}
                        <div className="thumb-overlay"><span className="yt-icon">{isPlaying&&playing?"⏸":"▶"}</span></div>
                      </div>
                      <div className="track-info">
                        <div className="track-title">{track.title}</div>
                        <div className="track-artist">{track.artist}</div>
                      </div>
                      <div className="track-dur">{track.duration}</div>
                      <button className="track-del" onClick={()=>remove(track.id)}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="card-empty">
              <div className="card-empty-icon">📋</div>
              <div className="card-empty-text">Add songs from suggestions or search above</div>
            </div>
          )}
        </div>

      </div>

      {/* SEARCH MODAL */}
      <div className={`modal-bg${searchOpen?"":" hidden"}`} onClick={e=>{ if(e.target===e.currentTarget){setSearchOpen(false);setSearchQ("");setSearchResults([]);} }}>
        <div className="modal">
          <div className="modal-title">Search any song</div>
          <input
            className="modal-input"
            placeholder="Artist, song title..."
            value={searchQ}
            onChange={e=>setSearchQ(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") doSearch(searchQ); }}
            autoFocus
          />
          {searching && <div className="loading-dots" style={{paddingBottom:"14px"}}><span/><span/><span/></div>}
          {searchResults.map((item,i)=>(
            <div key={i} className="modal-result" onClick={()=>addFromSearch(item)}>
              {item.snippet?.thumbnails?.default?.url && <img src={item.snippet.thumbnails.default.url} alt="" style={{width:48,height:36,borderRadius:6,objectFit:"cover",flexShrink:0}}/>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.snippet?.title}</div>
                <div style={{fontSize:11,color:"#666",marginTop:2}}>{item.snippet?.channelTitle}</div>
              </div>
              <span style={{color:"#7c3aed",fontSize:18}}>+</span>
            </div>
          ))}
          <button className="modal-close" onClick={()=>{setSearchOpen(false);setSearchQ("");setSearchResults([]);}}>Close</button>
        </div>
      </div>

      {/* HIDDEN YT PLAYER */}
      <div className="yt-hidden"><div ref={playerDiv}/></div>

      {/* PLAYER BAR */}
      <div className={`player${nowPlaying?"":" hidden"}`}>
        {nowPlaying?.thumbnail && <div className="player-thumb"><img src={nowPlaying.thumbnail} alt=""/></div>}
        <div className="player-info">
          <div className="player-title">{nowPlaying?.title}</div>
          <div className="player-artist">{nowPlaying?.artist}</div>
        </div>
        <div className="player-controls">
          <button className="ctrl" onClick={()=>skip(-1)}>⏮</button>
          <button className="play-btn" onClick={togglePlay}>{playing?"⏸":"▶"}</button>
          <button className="ctrl" onClick={()=>skip(1)}>⏭</button>
        </div>
      </div>
    </>
  );
}
