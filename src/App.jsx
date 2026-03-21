import { useState, useRef, useEffect } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0c;
    --surface: #111115;
    --card: #18181e;
    --border: #2a2a35;
    --red: #ff2d4e;
    --red-dim: rgba(255,45,78,0.15);
    --red-glow: rgba(255,45,78,0.35);
    --gold: #f5c842;
    --text: #f0eee8;
    --muted: #7a7885;
    --font-display: 'Bebas Neue', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    min-height: 100vh;
    overflow-x: hidden;
  }

  .app {
    display: grid;
    grid-template-columns: 1fr 380px;
    grid-template-rows: auto 1fr;
    height: 100vh;
    max-width: 1400px;
    margin: 0 auto;
  }

  .header {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 32px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    position: relative;
    z-index: 10;
  }

  .header::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--red), transparent);
    opacity: 0.5;
  }

  .logo {
    font-family: var(--font-display);
    font-size: 28px;
    letter-spacing: 2px;
    color: var(--text);
  }

  .logo span { color: var(--red); text-shadow: 0 0 20px var(--red-glow); }

  .logo-badge {
    font-size: 10px;
    font-family: var(--font-body);
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    background: rgba(245,200,66,0.1);
    border: 1px solid rgba(245,200,66,0.3);
    padding: 3px 8px;
    border-radius: 2px;
  }

  .header-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }

  .track-count { font-size: 13px; color: var(--muted); }
  .track-count strong { color: var(--text); font-weight: 500; }

  .main {
    padding: 32px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .ai-panel {
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    background: var(--surface);
  }

  .ai-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ai-dot {
    width: 8px; height: 8px;
    background: var(--red);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
    box-shadow: 0 0 8px var(--red-glow);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .ai-title {
    font-size: 12px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 500;
  }

  .chat-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .chat-area::-webkit-scrollbar { width: 4px; }
  .chat-area::-webkit-scrollbar-track { background: transparent; }
  .chat-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .msg { display: flex; gap: 10px; animation: fadeUp 0.3s ease; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .msg-avatar {
    width: 28px; height: 28px;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; flex-shrink: 0; margin-top: 2px;
  }

  .msg-avatar.ai { background: var(--red-dim); border: 1px solid var(--red); color: var(--red); font-weight: 700; }
  .msg-avatar.user { background: rgba(245,200,66,0.1); border: 1px solid rgba(245,200,66,0.4); color: var(--gold); font-weight: 700; }

  .msg-body { flex: 1; }

  .msg-name {
    font-size: 10px; text-transform: uppercase;
    letter-spacing: 2px; color: var(--muted);
    margin-bottom: 5px; font-weight: 500;
  }

  .msg-text { font-size: 13.5px; line-height: 1.6; color: var(--text); }
  .msg-text.ai-msg { color: #d8d6d0; }

  .msg-tracks { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }

  .mini-track {
    display: flex; align-items: center; gap: 10px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 6px; padding: 8px 12px;
    cursor: pointer; transition: all 0.15s ease; font-size: 12.5px;
  }

  .mini-track:hover { border-color: var(--red); background: var(--red-dim); }

  .mini-track-num { color: var(--muted); font-size: 11px; width: 16px; flex-shrink: 0; }
  .mini-track-info { flex: 1; min-width: 0; }
  .mini-track-title { font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mini-track-artist { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .mini-track-add { color: var(--red); font-size: 16px; font-weight: 300; opacity: 0.7; transition: opacity 0.1s; flex-shrink: 0; }
  .mini-track:hover .mini-track-add { opacity: 1; }

  .add-all-btn {
    margin-top: 8px; width: 100%; padding: 8px;
    background: var(--red-dim); border: 1px solid var(--red);
    color: var(--red); border-radius: 6px; font-size: 12px;
    font-weight: 500; letter-spacing: 1px; cursor: pointer;
    transition: all 0.15s ease; font-family: var(--font-body);
  }

  .add-all-btn:hover { background: rgba(255,45,78,0.25); }

  .chat-input-wrap {
    padding: 16px 20px; border-top: 1px solid var(--border);
    display: flex; gap: 10px; align-items: flex-end;
  }

  .chat-input {
    flex: 1; background: var(--card); border: 1px solid var(--border);
    border-radius: 8px; padding: 10px 14px; font-size: 13.5px;
    color: var(--text); font-family: var(--font-body);
    resize: none; outline: none; line-height: 1.5;
    transition: border-color 0.15s; max-height: 100px; min-height: 42px;
  }

  .chat-input:focus { border-color: var(--red); }
  .chat-input::placeholder { color: var(--muted); }

  .send-btn {
    width: 42px; height: 42px; background: var(--red);
    border: none; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
    flex-shrink: 0; color: white; font-size: 16px;
  }

  .send-btn:hover { background: #ff4d69; transform: scale(1.05); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .playlist-name-input {
    font-family: var(--font-display); font-size: 36px;
    letter-spacing: 2px; background: transparent; border: none;
    border-bottom: 2px solid var(--border); color: var(--text);
    outline: none; width: 100%; padding-bottom: 4px;
    transition: border-color 0.2s;
  }

  .playlist-name-input:focus { border-color: var(--red); }

  .playlist-meta { font-size: 12px; color: var(--muted); letter-spacing: 1px; margin-top: 6px; }

  .track-list { display: flex; flex-direction: column; gap: 4px; }

  .empty-state {
    text-align: center; padding: 60px 20px;
    border: 2px dashed var(--border); border-radius: 12px; color: var(--muted);
  }

  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
  .empty-title { font-family: var(--font-display); font-size: 22px; letter-spacing: 2px; color: var(--text); margin-bottom: 8px; opacity: 0.5; }
  .empty-sub { font-size: 13px; line-height: 1.6; }

  .track-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 16px; background: var(--card);
    border: 1px solid var(--border); border-radius: 8px;
    cursor: default; transition: all 0.15s ease;
    animation: fadeUp 0.25s ease; position: relative; overflow: hidden;
  }

  .track-row::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; background: var(--red); opacity: 0; transition: opacity 0.15s;
  }

  .track-row:hover::before { opacity: 1; }
  .track-row:hover { border-color: rgba(255,45,78,0.3); padding-left: 18px; }

  .track-index { width: 22px; text-align: center; font-size: 12px; color: var(--muted); flex-shrink: 0; font-weight: 500; }

  .track-thumb {
    width: 44px; height: 44px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0; border: 1px solid var(--border);
  }

  .track-info { flex: 1; min-width: 0; }
  .track-title { font-size: 14px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .track-artist { font-size: 12px; color: var(--muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .track-genre {
    font-size: 10px; background: rgba(245,200,66,0.1);
    border: 1px solid rgba(245,200,66,0.2); color: var(--gold);
    padding: 2px 8px; border-radius: 20px; letter-spacing: 1px;
    text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
  }

  .track-duration { font-size: 12px; color: var(--muted); flex-shrink: 0; font-variant-numeric: tabular-nums; }

  .track-remove {
    width: 28px; height: 28px; border-radius: 4px;
    border: 1px solid transparent; background: transparent;
    color: var(--muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.1s; font-size: 14px; flex-shrink: 0; opacity: 0;
  }

  .track-row:hover .track-remove { opacity: 1; }
  .track-remove:hover { background: rgba(255,45,78,0.15); border-color: var(--red); color: var(--red); }

  .actions-bar { display: flex; gap: 10px; flex-wrap: wrap; }

  .action-btn {
    padding: 10px 20px; border-radius: 6px; font-size: 13px;
    font-weight: 500; cursor: pointer; transition: all 0.15s;
    font-family: var(--font-body); letter-spacing: 0.5px;
  }

  .btn-primary { background: var(--red); border: 1px solid var(--red); color: white; }
  .btn-primary:hover { background: #ff4d69; box-shadow: 0 0 20px var(--red-glow); }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--muted); }
  .btn-ghost:hover { border-color: var(--text); color: var(--text); }

  .loading-dots { display: inline-flex; gap: 4px; align-items: center; padding: 6px 0; }
  .loading-dots span { width: 5px; height: 5px; background: var(--red); border-radius: 50%; animation: bounce 1.2s ease-in-out infinite; }
  .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }

  .suggestions-row { display: flex; gap: 8px; flex-wrap: wrap; padding: 0 20px 12px; }

  .suggestion-chip {
    padding: 5px 12px; border-radius: 20px;
    border: 1px solid var(--border); background: var(--card);
    color: var(--muted); font-size: 12px; cursor: pointer;
    transition: all 0.12s; white-space: nowrap;
  }

  .suggestion-chip:hover { border-color: var(--red); color: var(--text); }
`;

const EMOJIS = ["🎵","🎸","🎹","🎷","🎺","🥁","🎻","🎤","🎧","🎼"];
const BG_COLORS = [
  "rgba(255,45,78,0.15)","rgba(100,149,237,0.15)","rgba(50,205,50,0.15)",
  "rgba(255,165,0,0.15)","rgba(138,43,226,0.15)","rgba(255,215,0,0.15)"
];

const PROMPTS = [
  "Late night lo-fi study mix 📚",
  "Summer road trip bangers 🚗",
  "90s hip-hop classics 🎤",
  "Dark ambient for focus 🌑",
  "Feel-good indie pop ☀️",
  "Epic workout motivation 💪",
];

function getThumb(i) {
  return { emoji: EMOJIS[i % EMOJIS.length], bg: BG_COLORS[i % BG_COLORS.length] };
}

const TOTAL_DURATION = (tracks) => {
  const secs = tracks.reduce((acc, t) => {
    const [m, s] = t.duration.split(":").map(Number);
    return acc + m * 60 + s;
  }, 0);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s.toString().padStart(2,"0")}s`;
};

export default function App() {
  const [playlist, setPlaylist] = useState([]);
  const [playlistName, setPlaylistName] = useState("MY PLAYLIST");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hey! I'm your AI playlist curator. Tell me a vibe, genre, mood, or activity — I'll craft the perfect tracklist for you.",
      tracks: null,
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const addTrack = (track) => {
    setPlaylist(prev => {
      if (prev.find(t => t.title === track.title && t.artist === track.artist)) return prev;
      return [...prev, { ...track, id: Date.now() + Math.random() }];
    });
  };

  const addAll = (tracks) => tracks.forEach(t => addTrack(t));
  const removeTrack = (id) => setPlaylist(prev => prev.filter(t => t.id !== id));
  const clearPlaylist = () => setPlaylist([]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: `You are a music playlist curator AI. When the user describes a mood, genre, activity, or vibe, respond with:\n1. A brief, enthusiastic 1-2 sentence intro about the vibe\n2. Exactly 8 song suggestions in this JSON block:\n\n\`\`\`json\n[\n  {"title": "Song Title", "artist": "Artist Name", "genre": "Genre", "duration": "3:42"},\n  ...\n]\n\`\`\`\n\nKeep durations realistic (between 2:30 and 6:00). Genres should be short (e.g. "Hip-Hop", "Indie Rock", "Lo-Fi", "Electronic"). Mix well-known and lesser-known artists. After the JSON, add one sentence about what makes this selection special. Return ONLY this format.`,
          messages: [{ role: "user", content: userText }]
        })
      });

      const data = await response.json();
      const fullText = data.content.map(b => b.text || "").join("");

      const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
      let tracks = null;
      let displayText = fullText;

      if (jsonMatch) {
        try {
          tracks = JSON.parse(jsonMatch[1].trim());
          displayText = fullText.replace(/```json[\s\S]*?```/, "").replace(/\n\n+/g, "\n\n").trim();
        } catch {}
      }

      setMessages(prev => [...prev, { role: "ai", text: displayText, tracks }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "ai",
        text: "Hmm, couldn't connect right now. Try again in a moment!",
        tracks: null
      }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const exportPlaylist = () => {
    const text = `${playlistName}\n${"=".repeat(playlistName.length)}\n\n` +
      playlist.map((t, i) => `${i + 1}. ${t.title} — ${t.artist} [${t.duration}]`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${playlistName.replace(/\s+/g, "_").toLowerCase()}.txt`;
    a.click();
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <div className="header">
          <div className="logo">PLAY<span>LIST</span>.AI</div>
          <div className="logo-badge">OFFLINE BUILDER</div>
          <div className="header-right">
            <div className="track-count">
              <strong>{playlist.length}</strong> tracks
              {playlist.length > 0 && <> · <strong>{TOTAL_DURATION(playlist)}</strong></>}
            </div>
          </div>
        </div>

        <div className="main">
          <div>
            <input
              className="playlist-name-input"
              value={playlistName}
              onChange={e => setPlaylistName(e.target.value.toUpperCase())}
              maxLength={40}
            />
            <div className="playlist-meta">
              {playlist.length > 0
                ? `${playlist.length} tracks · ${TOTAL_DURATION(playlist)} · Offline playlist`
                : "Ask the AI to build your playlist →"}
            </div>
          </div>

          <div className="actions-bar">
            {playlist.length > 0 && (
              <>
                <button className="action-btn btn-primary" onClick={exportPlaylist}>↓ Export Playlist</button>
                <button className="action-btn btn-ghost" onClick={clearPlaylist}>Clear All</button>
              </>
            )}
          </div>

          <div className="track-list">
            {playlist.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎧</div>
                <div className="empty-title">NO TRACKS YET</div>
                <div className="empty-sub">
                  Describe your vibe to the AI on the right<br />
                  and add songs to build your perfect playlist.
                </div>
              </div>
            ) : (
              playlist.map((track, i) => {
                const { emoji, bg } = getThumb(i);
                return (
                  <div key={track.id} className="track-row">
                    <div className="track-index">{i + 1}</div>
                    <div className="track-thumb" style={{ background: bg }}>{emoji}</div>
                    <div className="track-info">
                      <div className="track-title">{track.title}</div>
                      <div className="track-artist">{track.artist}</div>
                    </div>
                    {track.genre && <div className="track-genre">{track.genre}</div>}
                    <div className="track-duration">{track.duration}</div>
                    <button className="track-remove" onClick={() => removeTrack(track.id)}>✕</button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="ai-panel">
          <div className="ai-header">
            <div className="ai-dot" />
            <div className="ai-title">AI Curator</div>
          </div>

          <div className="chat-area">
            {messages.map((msg, i) => (
              <div key={i} className="msg">
                <div className={`msg-avatar ${msg.role}`}>{msg.role === "ai" ? "AI" : "ME"}</div>
                <div className="msg-body">
                  <div className="msg-name">{msg.role === "ai" ? "Playlist AI" : "You"}</div>
                  <div className={`msg-text ${msg.role === "ai" ? "ai-msg" : ""}`}>{msg.text}</div>
                  {msg.tracks && msg.tracks.length > 0 && (
                    <div className="msg-tracks">
                      {msg.tracks.map((t, ti) => (
                        <div key={ti} className="mini-track" onClick={() => addTrack(t)} title="Click to add">
                          <div className="mini-track-num">{ti + 1}</div>
                          <div className="mini-track-info">
                            <div className="mini-track-title">{t.title}</div>
                            <div className="mini-track-artist">{t.artist} · {t.duration}</div>
                          </div>
                          <div className="mini-track-add">+</div>
                        </div>
                      ))}
                      <button className="add-all-btn" onClick={() => addAll(msg.tracks)}>
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
                  <div className="loading-dots"><span /><span /><span /></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="suggestions-row">
            {PROMPTS.map((p, i) => (
              <div key={i} className="suggestion-chip" onClick={() => sendMessage(p)}>{p}</div>
            ))}
          </div>

          <div className="chat-input-wrap">
            <textarea
              className="chat-input"
              placeholder="Describe a mood, genre, activity..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}>↑</button>
          </div>
        </div>
      </div>
    </>
  );
}
