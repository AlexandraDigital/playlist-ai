import { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // When current track changes, fetch its YouTube video ID
  useEffect(() => {
    if (currentIndex === null || !playlist[currentIndex]) {
      setVideoId(null);
      return;
    }
    const song = playlist[currentIndex];
    setVideoId(null);
    setVideoLoading(true);
    setError('');

    fetch('/api/youtube-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `${song.title} ${song.artist} official audio` }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setVideoId(data.videoId);
        setVideoLoading(false);
      })
      .catch(err => {
        setError(`Couldn't find video: ${err.message}`);
        setVideoLoading(false);
      });
  }, [currentIndex, playlist]);

  const generateSuggestions = async () => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const jsonMatch = data.reply.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('AI returned unexpected format. Please try again.');
      const songs = JSON.parse(jsonMatch[0]);
      setSuggestions(songs);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const addToPlaylist = (song) => {
    if (playlist.find(s => s.title === song.title && s.artist === song.artist)) return;
    setPlaylist(prev => [...prev, song]);
  };

  const removeFromPlaylist = (index) => {
    setPlaylist(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (currentIndex === index) setCurrentIndex(null);
      else if (currentIndex > index) setCurrentIndex(c => c - 1);
      return next;
    });
  };

  const playSong = (index) => setCurrentIndex(index);

  const playNext = () => {
    if (!playlist.length) return;
    setCurrentIndex(prev => prev === null ? 0 : (prev + 1) % playlist.length);
  };

  const playPrev = () => {
    if (!playlist.length) return;
    setCurrentIndex(prev => prev === null ? 0 : (prev - 1 + playlist.length) % playlist.length);
  };

  const isInPlaylist = (song) => playlist.some(s => s.title === song.title && s.artist === song.artist);
  const currentSong = currentIndex !== null ? playlist[currentIndex] : null;

  return (
    <div className="app">
      <header className="header">
        <h1>🎵 Playlist AI</h1>
        <p>Describe your vibe — AI picks the songs, you build the playlist</p>
      </header>

      {/* Search */}
      <div className="search-bar">
        <input
          ref={inputRef}
          type="text"
          placeholder="e.g. late night chill vibes, 2000s R&B, gym hype songs..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generateSuggestions()}
        />
        <button onClick={generateSuggestions} disabled={aiLoading} className="generate-btn">
          {aiLoading ? <span className="spinner" /> : '✨ Generate'}
        </button>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="content">
        {/* AI Suggestions */}
        <div className="suggestions-panel">
          <h2>AI Suggestions {suggestions.length > 0 && <span className="count">{suggestions.length}</span>}</h2>
          {aiLoading && (
            <div className="loading-grid">
              {Array(12).fill(0).map((_, i) => <div key={i} className="skeleton-card" />)}
            </div>
          )}
          {!aiLoading && suggestions.length === 0 && (
            <div className="empty-state">
              <span>🎶</span>
              <p>Describe a vibe above and hit Generate</p>
            </div>
          )}
          <div className="songs-grid">
            {suggestions.map((song, i) => (
              <div key={i} className={`song-card ${isInPlaylist(song) ? 'in-playlist' : ''}`}>
                <div className="song-details">
                  <span className="song-title">{song.title}</span>
                  <span className="song-artist">{song.artist}</span>
                </div>
                <button
                  className={`add-btn ${isInPlaylist(song) ? 'added' : ''}`}
                  onClick={() => addToPlaylist(song)}
                  title={isInPlaylist(song) ? 'Already in playlist' : 'Add to playlist'}
                >
                  {isInPlaylist(song) ? '✓' : '+'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* My Playlist */}
        <div className="playlist-panel">
          <h2>My Playlist {playlist.length > 0 && <span className="count">{playlist.length}</span>}</h2>
          {playlist.length === 0 ? (
            <div className="empty-state">
              <span>📋</span>
              <p>Add songs from the suggestions</p>
            </div>
          ) : (
            <div className="track-list">
              {playlist.map((song, i) => (
                <div
                  key={i}
                  className={`track ${currentIndex === i ? 'active' : ''}`}
                  onClick={() => playSong(i)}
                >
                  <span className="track-num">
                    {currentIndex === i ? '▶' : i + 1}
                  </span>
                  <div className="track-details">
                    <span className="track-title">{song.title}</span>
                    <span className="track-artist">{song.artist}</span>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={e => { e.stopPropagation(); removeFromPlaylist(i); }}
                    title="Remove"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Player */}
      {currentSong && (
        <div className="player">
          <div className="player-meta">
            <div className="now-playing-label">Now Playing</div>
            <div className="now-playing-title">{currentSong.title}</div>
            <div className="now-playing-artist">{currentSong.artist}</div>
          </div>

          <div className="player-controls">
            <button onClick={playPrev} className="ctrl-btn" title="Previous">⏮</button>
            <button onClick={playNext} className="ctrl-btn" title="Next">⏭</button>
          </div>

          <div className="video-container">
            {videoLoading && (
              <div className="video-loading">
                <div className="spinner large" />
                <p>Finding on YouTube...</p>
              </div>
            )}
            {videoId && !videoLoading && (
              <iframe
                key={videoId}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title={`${currentSong.title} - ${currentSong.artist}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
