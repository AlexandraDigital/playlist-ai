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
      line.match(/^\d*[.)]\s*(.+?)\s*[-–—]\s*(.+)$/) ||
      line.match(/^\d*[.)]\s*(.+?)\s+by\s+(.+)$/i);
    if (m) songs.push({ title: m[1].trim(), artist: m[2].trim(), videoId: null });
  }
  return songs.slice(0, 50);
}

// ── Batch helper ───────────────────────────────────────────────────
async function batchRun(items, fn, batchSize = 5) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map(fn));
    settled.forEach((r, j) => results.push(r.status === 'fulfilled' ? r.value : items[i + j]));
  }
  return results;
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

  // Manual search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [spotifyStatus, setSpotifyStatus] = useState(''); // 'loading' | 'done' | 'failed' | ''

  // ── Smart Offline Picks state ──────────────────────────────────
  const [isSmartDl, setIsSmartDl] = useState(false);
  const [smartDlDone, setSmartDlDone] = useState(false);

  const audioRef = useRef(null);
  const blobUrls = useRef({});
  const previewUrlRef = useRef(null);

  useEffect(() => {
    dbKeys().then(ids => setOfflineIds(new Set(ids))).catch(() => {});
  }, []);

  // ── Spotify enrichment (batched to avoid rate limits) ────────────
  async function enrichWithSpotify(songs) {
    return batchRun(songs, async song => {
      try {
        const res = await fetch(
          `/api/spotify?q=${encodeURIComponent(`${song.title} ${song.artist}`)}`
        );
        if (!res.ok) return song;
        const data = await res.json();
        if (data.error) return song;
        return {
          ...song,
          albumArt: data.albumArt || null,
          previewUrl: data.previewUrl || null,
          spotifyUrl: data.spotifyUrl || null,
          albumName: data.albumName || null,
          spotifyId: data.spotifyId || null,
        };
      } catch {
        return song;
      }
    }, 5);
  }

  // ── Manual song search ───────────────────────────────────────────
  async function searchSongs() {
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `/api/spotify?q=${encodeURIComponent(searchQuery)}&limit=10&type=search`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.tracks?.length) {
          setSearchResults(data.tracks.map(t => ({ ...t, videoId: null })));
          return;
        }
      }
      // Fallback: YouTube search
      const ytRes = await fetch(`/api/youtube-search?q=${encodeURIComponent(searchQuery)}`);
      if (ytRes.ok) {
        const ytData = await ytRes.json();
        if (ytData.videoId) {
          const parts = searchQuery.split(' - ');
          setSearchResults([{
            title: parts[0]?.trim() || searchQuery,
            artist: parts[1]?.trim() || '',
            videoId: ytData.videoId,
            albumArt: null,
            previewUrl: null,
          }]);
        }
      }
    } catch (e) {
      setError(`Search failed: ${e.message}`);
    } finally {
      setIsSearching(false);
    }
  }

  // ── Generate playlist ────────────────────────────────────────────
  async function generate() {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError('');
    setSuggestions([]);
    setSpotifyStatus('');
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
      setSuggestions(songs);
      setIsGenerating(false);

      // Enrich with Spotify in batches
      setSpotifyStatus('loading');
      try {
        const enriched = await enrichWithSpotify(songs);
        setSuggestions(enriched);

        const seeds = enriched
          .map(s => s.spotifyId)
          .filter(Boolean)
          .slice(0, 5);

        if (seeds.length > 0) {
          try {
            const recRes = await fetch(`/api/spotify?seeds=${seeds.join(',')}&limit=20`);
            if (recRes.ok) {
              const recData = await recRes.json();
              const recTracks = recData.tracks || [];
              if (recTracks.length > 0) {
                setSuggestions(prev => {
                  const existing = new Set(prev.map(s => `${s.title}__${s.artist}`.toLowerCase()));
                  const newOnes = recTracks.filter(
                    t => !existing.has(`${t.title}__${t.artist}`.toLowerCase())
                  );
                  return [...prev, ...newOnes];
                });
              }
            }
          } catch {}
        }
        setSpotifyStatus('done');
      } catch {
        setSpotifyStatus('failed');
      }
    } catch (e) {
      setError(e.message);
      setIsGenerating(false);
    }
  }

  // ── Add song to playlist ─────────────────────────────────────────
  async function addToPlaylist(song) {
    if (!song?.title) return;
    const key = `${song.title}__${song.artist}`;

    let alreadyAdded = false;
    let hasVideoId = false;

    setPlaylist(prev => {
      if (prev.some(t => `${t.title}__${t.artist}` === key)) {
        alreadyAdded = true;
        return prev;
      }
      if (song.videoId) {
        hasVideoId = true;
        return [...prev, { ...song, loading: false }];
      }
      return [...prev, { ...song, videoId: null, loading: true }];
    });

    await new Promise(r => setTimeout(r, 0));
    if (alreadyAdded || hasVideoId) return;

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
    } catch {
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

    previewUrlRef.current = track.previewUrl || null;

    try {
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
        audio.src = `/api/stream-audio?videoId=${track.videoId}`;
        audio.load();
        setPlaying(true);
        await audio.play();
        return;
      }

      if (track.previewUrl) {
        audio.src = track.previewUrl;
        previewUrlRef.current = null;
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

  // ── Download for offline ─────────────────────────────────────────
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
        setDlProgress(prev => ({ ...prev, [track.videoId]: { received, total } }));
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

  // ── AI Smart Offline Picks ────────────────────────────────────────
  async function aiDownloadPicks() {
    if (!playlist.length || isSmartDl) return;
    setIsSmartDl(true);
    setSmartDlDone(false);
    try {
      const res = await fetch('/api/suggest-downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songs: playlist.map(t => ({ title: t.title, artist: t.artist })),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const suggestions = data.suggestions || [];
      // Immediately download all suggested tracks
      suggestions.forEach(s => {
        const track = playlist.find(
          t =>
            t.title.toLowerCase() === s.title.toLowerCase() &&
            t.artist.toLowerCase() === s.artist.toLowerCase()
        );
        if (track?.videoId && !offlineIds.has(track.videoId) && !downloading.has(track.videoId)) {
          downloadOffline({ stopPropagation: () => {} }, track);
        }
      });
      setSmartDlDone(true);
    } catch (e) {
      setError(`AI download error: ${e.message}`);
    } finally {
      setIsSmartDl(false);
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

      {/* ── AI Prompt bar ── */}
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

      {/* ── Spotify enrichment status ── */}
      {spotifyStatus === 'loading' && (
        <div className="spotify-status">
          <span className="spinner" style={{ width: 14, height: 14 }} />
          Adding album art &amp; Spotify recommendations…
        </div>
      )}
      {spotifyStatus === 'done' && suggestions.some(s => s.albumArt) && (
        <div className="spotify-status done">✓ Spotify enrichment complete — {suggestions.length} songs</div>
      )}
      {spotifyStatus === 'failed' && (
        <div className="spotify-status failed">⚠ Spotify unavailable — showing AI suggestions only</div>
      )}

      {/* ── Manual search toggle ── */}
      <div className="manual-search-toggle">
        <button
          className="toggle-search-btn"
          onClick={() => { setShowSearch(s => !s); setSearchResults([]); setSearchQuery(''); }}
        >
          {showSearch ? '✕ Close search' : '🔍 Add any song manually'}
        </button>
      </div>

      {/* ── Manual search panel ── */}
      {showSearch && (
        <div className="manual-search-panel">
          <div className="search-bar">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchSongs()}
              placeholder="Search any song or artist (e.g. Hotel California, Kendrick Lamar...)"
              autoFocus
            />
            <button className="generate-btn" onClick={searchSongs} disabled={isSearching}>
              {isSearching ? <><span className="spinner" /> Searching…</> : '🔍 Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results songs-grid">
              {searchResults.map((song, i) => {
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

          {!isSearching && searchQuery && searchResults.length === 0 && (
            <div className="empty-state" style={{ padding: '20px' }}>
              <p>No results — try a different search term</p>
            </div>
          )}
        </div>
      )}

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
              {[...Array(12)].map((_, i) => <div key={i} className="skeleton-card" />)}
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

          {/* ── AI Smart Offline Picks ── */}
          {playlist.length > 0 && (
            <div className="smart-dl-section">
              <button
                className="ai-offline-btn"
                onClick={aiDownloadPicks}
                disabled={isSmartDl}
                title="AI picks and downloads the best songs from your playlist for offline listening"
              >
                {isSmartDl
                  ? <><span className="spinner" /> AI picking songs…</>
                  : smartDlDone
                  ? '✅ AI Downloads Started!'
                  : '🤖 AI Download Picks'}
              </button>
            </div>
          )}

          {playlist.length === 0 ? (
            <div className="empty-state">
              <span>📋</span>
              <p>Add songs from suggestions or search above</p>
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
