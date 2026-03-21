import { useState, useEffect, useRef } from 'react';
import './App.css';

// ── IndexedDB helpers ──────────────────────────────────────────────
const DB_NAME = 'playlist-ai-offline';
const STORE = 'tracks';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE, { keyPath: 'videoId' });
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}
async function dbSave(record) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => res();
    tx.onerror = e => rej(e.target.error);
  });
}
async function dbGet(videoId) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(videoId);
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e.target.error);
  });
}
async function dbDelete(videoId) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(videoId);
    tx.oncomplete = () => res();
    tx.onerror = e => rej(e.target.error);
  });
}
async function dbKeys() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e.target.error);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Parse AI response into song list ──────────────────────────────
function parseSongs(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const songs = [];
  for (const line of lines) {
    const m =
      line.match(/^\d*[\.)] *(.+?) *[-–—] *(.+)$/) ||
      line.match(/^\d*[\.)] *(.+?) +by +(.+)$/i);
    if (m) songs.push({ title: m[1].trim(), artist: m[2].trim(), videoId: null });
  }
  return songs.slice(0, 15);
}

// ── Main App ───────────────────────────────────────────────────────
export default function App() {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [offlineIds, setOfflineIds] = useState(new Set());
  const [downloading, setDownloading] = useState(new Set());
  const [dlProgress, setDlProgress] = useState({});

  const audioRef = useRef(null);
  const blobUrls = useRef({});
  const previewUrlRef = useRef(null); // Spotify preview fallback

  useEffect(() => {
    dbKeys().then(ids => setOfflineIds(new Set(ids))).catch(() => {});
  }, []);

  // ── Spotify enrichment ───────────────────────────────────────────
  async function enrichWithSpotify(songs) {
    const results = await Promise.allSettled(
      songs.map(async song => {
        try {
          const res = await fetch(
            `/api/spotify?q=${encodeURIComponent(`${song.title} ${song.artist}`)}`
          );
          if (!res.ok) return song;
          const data = await res.json();
          return {
            ...song,
            albumArt: data.albumArt || null,
            previewUrl: data.previewUrl || null,
            spotifyUrl: data.spotifyUrl || null,
            albumName: data.albumName || null,
          };
        } catch {
          return song;
        }
      })
    );
    return results.map((r, i) => (r.status === 'fulfilled' ? r.value : songs[i]));
  }

  // ── Generate playlist ────────────────────────────────────────────
  async function generate() {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError('');
    setSuggestions([]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const text = data.content || data.message || data.reply || '';
      const songs = parseSongs(text);
      if (!songs.length) throw new Error('No songs in response — try a different prompt.');
      setSuggestions(songs); // show immediately
      // enrich with Spotify album art in background
      enrichWithSpotify(songs).then(enriched => setSuggestions(enriched));
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Add song to playlist ─────────────────────────────────────────
  async function addToPlaylist(song) {
    if (!song?.title || !song?.artist) return;
    const key = `${song.title}__${song.artist}`;

    // Use updater fn so the duplicate check always sees latest state (no stale closure)
    let alreadyAdded = false;
    setPlaylist(prev => {
      if (prev.some(t => `${t.title}__${t.artist}` === key)) {
        alreadyAdded = true;
        return prev;
      }
      return [...prev, { ...song, videoId: null, loading: true }];
    });

    // Give React a tick to flush the state update
    await new Promise(r => setTimeout(r, 0));
    if (alreadyAdded) return;

    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(`${song.title} ${song.artist}`)}`);
      if (!res.ok) throw new Error(`Search ${res.status}`);
      const data = await res.json();
      setPlaylist(prev =>
        prev.map(t =>
          `${t.title}__${t.artist}` === key
            ? { ...t, videoId: data.videoId || null, loading: false }
            : t
        )
      );
    } catch (err) {
      setPlaylist(prev =>
        prev.map(t => `${t.title}__${t.artist}` === key ? { ...t, loading: false } : t)
      );
    }
  }

  // ── Select & play track ──────────────────────────────────────────
  async function selectTrack(idx) {
    setCurrentIdx(idx);
    const track = playlist[idx];
    if (!track || track.loading) return;

    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();

    // Store preview URL for fallback in onError
    previewUrlRef.current = track.previewUrl || null;

    try {
      // Try offline blob first
      if (track.videoId) {
        const stored = await dbGet(track.videoId);
        if (stored?.blob) {
          if (blobUrls.current[track.videoId]) URL.revokeObjectURL(blobUrls.current[track.videoId]);
          const url = URL.createObjectURL(stored.blob);
          blobUrls.current[track.videoId] = url;
          audio.src = url;
          audio.load();
          setPlaying(true);
          await audio.play();
          return;
        }
        // Stream via proxy
        audio.src = `/api/stream-audio?videoId=${track.videoId}`;
        audio.load();
        setPlaying(true);
        await audio.play();
        return;
      }

      // No videoId yet — try Spotify preview
      if (track.previewUrl) {
        audio.src = track.previewUrl;
        previewUrlRef.current = null; // don't double-fallback
        audio.load();
        setPlaying(true);
        await audio.play();
      }
    } catch (e) {
      setError(`Playback error: ${e.message}`);
      setPlaying(false);
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) { audio.play(); setPlaying(true); }
    else { audio.pause(); setPlaying(false); }
  }

  function playNext() {
    if (!playlist.length) return;
    selectTrack(currentIdx === null ? 0 : (currentIdx + 1) % playlist.length);
  }
  function playPrev() {
    if (!playlist.length) return;
    selectTrack(currentIdx === null ? 0 : (currentIdx - 1 + playlist.length) % playlist.length);
  }

  // ── Download for offline (with progress) ────────────────────────
  async function downloadOffline(e, track) {
    e.stopPropagation();
    if (!track.videoId || downloading.has(track.videoId)) return;

    setDownloading(prev => new Set([...prev, track.videoId]));
    setDlProgress(prev => ({ ...prev, [track.videoId]: { received: 0, total: null } }));

    try {
      const res = await fetch(`/api/stream-audio?videoId=${track.videoId}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const contentLength = res.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : null;

      const reader = res.body.getReader();
      const chunks = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        setDlProgress(prev => ({
          ...prev,
          [track.videoId]: { received, total },
        }));
      }

      const blob = new Blob(chunks);
      await dbSave({
        videoId: track.videoId,
        blob,
        title: track.title,
        artist: track.artist,
        albumArt: track.albumArt || null,
      });
      setOfflineIds(prev => new Set([...prev, track.videoId]));
    } catch (err) {
      setError(`Download failed: ${err.message}`);
    } finally {
      setDownloading(prev => { const s = new Set(prev); s.delete(track.videoId); return s; });
      setDlProgress(prev => { const n = { ...prev }; delete n[track.videoId]; return n; });
    }
  }

  async function removeOffline(e, videoId) {
    e.stopPropagation();
    await dbDelete(videoId);
    if (blobUrls.current[videoId]) {
      URL.revokeObjectURL(blobUrls.current[videoId]);
      delete blobUrls.current[videoId];
    }
    setOfflineIds(prev => { const s = new Set(prev); s.delete(videoId); return s; });
  }

  function removeFromPlaylist(e, idx) {
    e.stopPropagation();
    setPlaylist(prev => { const n = [...prev]; n.splice(idx, 1); return n; });
    if (currentIdx === idx) {
      audioRef.current?.pause();
      setCurrentIdx(null);
      setPlaying(false);
    } else if (currentIdx > idx) {
      setCurrentIdx(c => c - 1);
    }
  }

  const currentTrack = currentIdx !== null ? playlist[currentIdx] : null;
  const inPlaylist = new Set(playlist.map(t => `${t.title}__${t.artist}`));

  return (
    <div className="app">
      <audio
        ref={audioRef}
        onEnded={playNext}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onError={e => {
          const preview = previewUrlRef.current;
          if (preview) {
            // Fallback to Spotify 30-sec preview
            previewUrlRef.current = null;
            const audio = audioRef.current;
            audio.src = preview;
            audio.load();
            audio.play().catch(() => setPlaying(false));
            return;
          }
          const err = e.target.error;
          setError(`Audio error: ${err ? err.message : 'failed to load stream'}`);
          setPlaying(false);
        }}
      />

      <div className="header">
        <h1>🎵 Playlist AI</h1>
        <p>Describe your vibe — AI curates the songs, you own the playlist</p>
      </div>

      <div className="search-bar">
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder="e.g. chill lo-fi beats for late nights, 90s R&B classics..."
          disabled={isGenerating}
        />
        <button className="generate-btn" onClick={generate} disabled={isGenerating}>
          {isGenerating ? <><span className="spinner" /> Thinking…</> : '✨ Generate'}
        </button>
      </div>

      {error && (
        <div className="error-banner" onClick={() => setError('')}>
          ⚠️ {error} <span className="dismiss">✕</span>
        </div>
      )}

      <div className="content">
        {/* ── Suggestions ── */}
        <div className="suggestions-panel">
          <h2>AI Suggestions {suggestions.length > 0 && <span className="count">{suggestions.length}</span>}</h2>
          {isGenerating ? (
            <div className="loading-grid">
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton-card" />)}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="empty-state">
              <span>🎧</span>
              <p>Generate a playlist to see suggestions here</p>
            </div>
          ) : (
            <div className="songs-grid">
              {suggestions.map((song, i) => {
                const key = `${song.title}__${song.artist}`;
                const added = inPlaylist.has(key);
                return (
                  <div key={i} className={`song-card ${added ? 'in-playlist' : ''}`}>
                    {song.albumArt
                      ? <img className="song-art" src={song.albumArt} alt="" loading="lazy" />
                      : <div className="song-art-placeholder">🎵</div>
                    }
                    <div className="song-details">
                      <div className="song-title">{song.title}</div>
                      <div className="song-artist">{song.artist}</div>
                    </div>
                    <button
                      className={`add-btn ${added ? 'added' : ''}`}
                      onClick={() => !added && addToPlaylist(song)}
                    >
                      {added ? '✓' : '+'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Playlist ── */}
        <div className="playlist-panel">
          <h2>
            My Playlist
            {playlist.length > 0 && <span className="count">{playlist.length}</span>}
            {offlineIds.size > 0 && <span className="offline-count">💾 {offlineIds.size} offline</span>}
          </h2>
          {playlist.length === 0 ? (
            <div className="empty-state">
              <span>📋</span>
              <p>Add songs from suggestions</p>
            </div>
          ) : (
            <div className="track-list">
              {playlist.map((track, i) => {
                const prog = track.videoId ? dlProgress[track.videoId] : null;
                const isDownloading = track.videoId && downloading.has(track.videoId);
                const pct = prog?.total
                  ? Math.min(100, Math.round((prog.received / prog.total) * 100))
                  : null;

                return (
                  <div
                    key={i}
                    className={`track ${currentIdx === i ? 'active' : ''}`}
                    onClick={() => selectTrack(i)}
                  >
                    {track.albumArt
                      ? <img className="track-art" src={track.albumArt} alt="" loading="lazy" />
                      : <div className="track-num">
                          {track.loading
                            ? <span className="spinner" style={{ width: 12, height: 12 }} />
                            : currentIdx === i && playing ? '▶' : i + 1}
                        </div>
                    }
                    <div className="track-details">
                      <div className="track-title">{track.title}</div>
                      <div className="track-artist">{track.artist}</div>
                      {isDownloading && (
                        <div className="dl-progress-wrap">
                          <div
                            className={`dl-progress-bar ${pct === null ? 'indeterminate' : ''}`}
                            style={pct !== null ? { width: `${pct}%` } : {}}
                          />
                          <span className="dl-progress-label">
                            {pct !== null
                              ? `${pct}%`
                              : prog?.received
                              ? formatBytes(prog.received)
                              : 'Saving…'}
                          </span>
                        </div>
                      )}
                    </div>
                    {track.albumArt && (
                      <div className="track-playing-indicator">
                        {track.loading
                          ? <span className="spinner" style={{ width: 12, height: 12 }} />
                          : currentIdx === i && playing ? '▶' : null}
                      </div>
                    )}
                    {track.videoId && !track.loading && !isDownloading && (
                      offlineIds.has(track.videoId) ? (
                        <button
                          className="offline-badge"
                          onClick={e => removeOffline(e, track.videoId)}
                          title="Saved offline — click to remove"
                        >💾</button>
                      ) : (
                        <button
                          className="download-btn"
                          onClick={e => downloadOffline(e, track)}
                          title="Save for offline"
                        >⬇️</button>
                      )
                    )}
                    <button className="remove-btn" onClick={e => removeFromPlaylist(e, i)}>✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Player bar ── */}
      {currentTrack && (
        <div className="player">
          {currentTrack.albumArt && (
            <img className="player-art" src={currentTrack.albumArt} alt="" />
          )}
          <div className="player-meta">
            <div className="now-playing-label">
              NOW PLAYING
              {currentTrack.videoId && offlineIds.has(currentTrack.videoId) && ' · 💾 OFFLINE'}
              {currentTrack.previewUrl && !currentTrack.videoId && ' · 🎵 PREVIEW'}
            </div>
            <div className="now-playing-title">{currentTrack.title}</div>
            <div className="now-playing-artist">{currentTrack.artist}</div>
          </div>
          <div className="player-controls">
            <button className="ctrl-btn" onClick={playPrev} title="Previous">⏮</button>
            <button className="ctrl-btn play-pause" onClick={togglePlay}>
              {playing ? '⏸' : '▶'}
            </button>
            <button className="ctrl-btn" onClick={playNext} title="Next">⏭</button>
          </div>
        </div>
      )}
    </div>
  );
}
