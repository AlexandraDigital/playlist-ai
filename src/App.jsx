import { useState, useRef, useEffect, useCallback } from "react";

const PAYPAL_CLIENT_ID = "AXNMWGjP12GGzjRS4hXihdVeXUZNsvT38UqJzJSoI0N9WsV67zo5fyV46CbB5Sp_f2wKnLzvfgyoieI8";
const FREE_GEN_LIMIT = 5;

const TRANSLATIONS = {
  en: {
    install: "⬇ Install",
    placeholder: "Type a vibe, genre, or mood…",
    generate: "Generate",
    freeLeft: (n) => `${n} free generation${n === 1 ? "" : "s"} left today`,
    upgradePro: "Upgrade to Pro for unlimited →",
    tabPlaylist: "Playlist",
    tabDownloads: "Downloads",
    tabMyPlaylists: "My Playlists",
    tabStats: "Stats",
    aiPlaceholder: "Ask for any playlist…",
    addSongs: (n) => `Add ${n} song${n !== 1 ? "s" : ""} →`,
    all: "All", none: "None",
    songTitle: "Song title *", artist: "Artist", duration: "Duration (e.g. 3:24)",
    addSong: "Add Song", cancel: "Cancel",
    addSongBtn: "+ Add Song", save: "Save ✦", clear: "Clear",
    emptyPlaylist: "Your playlist is empty",
    emptySub: "Type a vibe above or add songs manually",
    uploadFile: "+ Upload File",
    noOffline: "No offline tracks yet",
    offlineSubPro: "Songs auto-download as you play them",
    offlineSubFree: "Hit ⬇ on any song to save it offline",
    syncTitle: "🔄 Cross-Device Sync",
    syncCodeLabel: "Your sync code:",
    copy: "Copy", push: "↑ Push", pull: "↓ Pull Sync",
    syncPlaceholder: "Enter code to import…",
    copied: "Copied!",
    syncLockText: "Cross-device sync — access playlists on any device",
    syncLockCta: "Upgrade to Pro →",
    newPlaceholder: "New playlist name…",
    newBtn: "+ New",
    noPlaylists: "No saved playlists yet",
    noPlaylistsSub: "Build a playlist and hit Save ✦ to keep it",
    songs: (n) => `${n} song${n !== 1 ? "s" : ""}`,
    load: "Load",
    statsTitle: "📊 Listening Stats",
    noPlays: "No plays yet",
    noPlaysSub: "Start listening to see your top tracks",
    topTracks: "Your top tracks",
    plays: (n) => `${n} play${n !== 1 ? "s" : ""}`,
    proTitle: "Playlist AI Pro",
    proSubtitle: "Unlock the full experience — one time, forever",
    proFeatures: [
      ["🎵","Unlimited AI Generations","No daily limits on playlist creation"],
      ["⚡","Auto-Offline Everything","Songs download automatically as you play"],
      ["🎧","Background Playback","Music keeps playing when you switch apps"],
      ["🔄","Cross-Device Sync","Your playlists on every device with a sync code"],
      ["📊","Listening Stats","See your most played tracks"],
      ["🎵","Priority Song Search","Faster YouTube matching & better results"],
    ],
    proPrice: "$9.99",
    proOneTime: "✓ Lifetime access — no subscription",
    maybeLater: "Maybe later",
    proSuccess: "You're Pro!",
    proSuccessSub: "All features are unlocked. Enjoy unlimited music ✦",
    letsGo: "Let's Go →",
    chips: ["chill vibes","hype workout","late night drive","sad hours","focus mode","k-pop bops"],
    savedOffline: "Saved offline", retryDownload: "Retry download", saveOffline: "Save offline",
    retrySearch: "Retry search", uploadAudio: "Upload audio file", remove: "Remove",
    noSyncCode: "No playlists to sync", enterCode: "Enter a sync code",
    langLabel: "EN",
  },
  es: {
    install: "⬇ Instalar",
    placeholder: "Escribe un ambiente, género o estado de ánimo…",
    generate: "Generar",
    freeLeft: (n) => `${n} generación${n === 1 ? "" : "es"} gratuita${n === 1 ? "" : "s"} hoy`,
    upgradePro: "Actualiza a Pro para ilimitadas →",
    tabPlaylist: "Lista",
    tabDownloads: "Descargas",
    tabMyPlaylists: "Mis Listas",
    tabStats: "Estadísticas",
    aiPlaceholder: "Pide cualquier lista de música…",
    addSongs: (n) => `Agregar ${n} canción${n !== 1 ? "es" : ""} →`,
    all: "Todo", none: "Ninguna",
    songTitle: "Título de canción *", artist: "Artista", duration: "Duración (ej. 3:24)",
    addSong: "Agregar", cancel: "Cancelar",
    addSongBtn: "+ Agregar", save: "Guardar ✦", clear: "Limpiar",
    emptyPlaylist: "Tu lista está vacía",
    emptySub: "Escribe un ambiente arriba o añade canciones",
    uploadFile: "+ Subir Archivo",
    noOffline: "Sin pistas sin conexión",
    offlineSubPro: "Las canciones se descargan automáticamente",
    offlineSubFree: "Presiona ⬇ en cualquier canción para guardarla",
    syncTitle: "🔄 Sync Entre Dispositivos",
    syncCodeLabel: "Tu código de sync:",
    copy: "Copiar", push: "↑ Subir", pull: "↓ Importar",
    syncPlaceholder: "Ingresa código para importar…",
    copied: "¡Copiado!",
    syncLockText: "Sync entre dispositivos — accede desde cualquier lugar",
    syncLockCta: "Actualiza a Pro →",
    newPlaceholder: "Nombre de nueva lista…",
    newBtn: "+ Nueva",
    noPlaylists: "Sin listas guardadas",
    noPlaylistsSub: "Crea una lista y presiona Guardar ✦",
    songs: (n) => `${n} canción${n !== 1 ? "es" : ""}`,
    load: "Cargar",
    statsTitle: "📊 Estadísticas",
    noPlays: "Sin reproducciones aún",
    noPlaysSub: "Empieza a escuchar para ver tus más tocadas",
    topTracks: "Tus canciones favoritas",
    plays: (n) => `${n} vez${n !== 1 ? " veces" : ""}`,
    proTitle: "Playlist AI Pro",
    proSubtitle: "Desbloquea todo — un pago, para siempre",
    proFeatures: [
      ["🎵","Generaciones IA Ilimitadas","Sin límites diarios en la creación de listas"],
      ["⚡","Todo Auto-Offline","Las canciones se descargan al reproducir"],
      ["🎧","Reproducción en Fondo","La música sigue al cambiar de app"],
      ["🔄","Sync Entre Dispositivos","Tus listas en cada dispositivo con un código"],
      ["📊","Estadísticas de Escucha","Ve tus canciones más reproducidas"],
      ["🎵","Búsqueda Prioritaria","Mejor búsqueda en YouTube & mejores resultados"],
    ],
    proPrice: "$9.99",
    proOneTime: "✓ Acceso de por vida — sin suscripción",
    maybeLater: "Tal vez después",
    proSuccess: "¡Eres Pro!",
    proSuccessSub: "Todas las funciones activas. ¡Disfruta la música ilimitada ✦",
    letsGo: "¡Vamos! →",
    chips: ["ambiente tranquilo","entrenamiento intenso","conducción nocturna","horas tristes","modo concentración","k-pop hits"],
    savedOffline: "Guardado offline", retryDownload: "Reintentar", saveOffline: "Guardar offline",
    retrySearch: "Buscar de nuevo", uploadAudio: "Subir archivo de audio", remove: "Eliminar",
    noSyncCode: "Sin listas para sincronizar", enterCode: "Ingresa un código de sync",
    langLabel: "ES",
  },
  zh: {
    install: "⬇ 安装",
    placeholder: "输入氛围、曲风或心情…",
    generate: "生成",
    freeLeft: (n) => `今日剩余 ${n} 次免费生成`,
    upgradePro: "升级Pro获得无限次数 →",
    tabPlaylist: "播放列表",
    tabDownloads: "下载",
    tabMyPlaylists: "我的列表",
    tabStats: "统计",
    aiPlaceholder: "请求任何播放列表…",
    addSongs: (n) => `添加 ${n} 首歌曲 →`,
    all: "全部", none: "全不选",
    songTitle: "歌曲名 *", artist: "艺术家", duration: "时长（如 3:24）",
    addSong: "添加歌曲", cancel: "取消",
    addSongBtn: "+ 添加", save: "保存 ✦", clear: "清空",
    emptyPlaylist: "播放列表为空",
    emptySub: "在上方输入氛围或手动添加歌曲",
    uploadFile: "+ 上传文件",
    noOffline: "暂无离线曲目",
    offlineSubPro: "歌曲播放时自动下载",
    offlineSubFree: "点击 ⬇ 保存歌曲到离线",
    syncTitle: "🔄 跨设备同步",
    syncCodeLabel: "你的同步码：",
    copy: "复制", push: "↑ 上传", pull: "↓ 拉取同步",
    syncPlaceholder: "输入同步码以导入…",
    copied: "已复制！",
    syncLockText: "跨设备同步 — 在任何设备访问你的列表",
    syncLockCta: "升级Pro →",
    newPlaceholder: "新播放列表名称…",
    newBtn: "+ 新建",
    noPlaylists: "暂无保存的播放列表",
    noPlaylistsSub: "创建播放列表并点击保存 ✦",
    songs: (n) => `${n} 首歌`,
    load: "加载",
    statsTitle: "📊 听歌统计",
    noPlays: "暂无播放记录",
    noPlaysSub: "开始听歌以查看你的热门曲目",
    topTracks: "你的热门曲目",
    plays: (n) => `${n} 次`,
    proTitle: "Playlist AI Pro",
    proSubtitle: "解锁全部功能 — 一次付费，永久使用",
    proFeatures: [
      ["🎵","无限AI生成","无每日创建限制"],
      ["⚡","自动离线保存","播放时自动下载歌曲"],
      ["🎧","后台播放","切换应用时音乐继续播放"],
      ["🔄","跨设备同步","用同步码在任何设备访问"],
      ["📊","听歌统计","查看最常播放的曲目"],
      ["🎵","优先歌曲搜索","更快的YouTube匹配与更好的结果"],
    ],
    proPrice: "$9.99",
    proOneTime: "✓ 终身访问 — 无需订阅",
    maybeLater: "稍后再说",
    proSuccess: "你是Pro用户！",
    proSuccessSub: "所有功能已解锁，享受无限音乐 ✦",
    letsGo: "开始使用 →",
    chips: ["轻松氛围","高强度健身","深夜驾车","伤感时光","专注模式","K-pop热曲"],
    savedOffline: "已离线保存", retryDownload: "重试下载", saveOffline: "保存离线",
    retrySearch: "重新搜索", uploadAudio: "上传音频文件", remove: "移除",
    noSyncCode: "没有播放列表可同步", enterCode: "请输入同步码",
    langLabel: "中文",
  },
};



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
  .app { display:grid; grid-template-rows:auto auto 1fr auto; height:100vh; max-width:100%; margin:0 auto; }
  ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }

  @media (min-width:900px) {
    .header { padding:28px 60px 18px; }
    .tabs { padding:0 60px; }
    .scroll-area { padding:0 60px 16px; }
    .player { padding:16px 60px; }
    .ai-drawer { padding:16px 60px; }
    .add-form { padding:16px 60px; }
    .logo { font-size:36px; }
    .main-input { font-size:15px; padding:13px 18px; }
    .gen-btn { padding:13px 30px; font-size:15px; }
    .track-title { font-size:15px; }
    .track-artist { font-size:13px; }
    .tab { font-size:14px; padding:13px 18px; }
  }

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
  .gen-limit { font-size:11px; color:var(--muted); margin-top:2px; }

  /* ADD SONG FORM */
  .add-form { background:var(--surface); border-bottom:1px solid var(--border); padding:14px 24px; display:flex; flex-direction:column; gap:10px; }
  .add-form-row { display:flex; gap:8px; flex-wrap:wrap; }
  .add-input { flex:1; min-width:120px; background:var(--card); border:1px solid var(--border); border-radius:8px;
    padding:9px 12px; font-size:13px; color:var(--text); font-family:var(--font); outline:none; }
  .add-input:focus { border-color:#2a2a2a; }
  .add-input::placeholder { color:var(--muted); }
  .add-submit { padding:9px 18px; background:var(--purple); border:none; border-radius:8px;
    color:#fff; font-family:var(--font); font-size:13px; font-weight:500; cursor:pointer; white-space:nowrap; }
  .add-cancel { padding:9px 14px; background:transparent; border:1px solid var(--border); border-radius:8px;
    color:var(--muted); font-family:var(--font); font-size:13px; cursor:pointer; }

  /* PLAYLIST AREA */
  .scroll-area { overflow-y:auto; padding:0 24px 12px; }
  .pl-header { display:flex; align-items:center; justify-content:space-between; padding:14px 0 10px; flex-wrap:wrap; gap:8px; }
  .pl-name { background:transparent; border:none; color:var(--text); font-family:var(--font);
    font-size:15px; font-weight:600; outline:none; width:200px; }
  .pl-name::placeholder { color:var(--muted); }
  .pl-actions { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
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

  /* SYNC PANEL */
  .sync-panel { background:var(--surface); border:1px solid var(--border); border-radius:10px;
    padding:14px 16px; margin-bottom:14px; display:flex; flex-direction:column; gap:10px; }
  .sync-panel-title { font-size:13px; font-weight:600; color:var(--purple-light); }
  .sync-code-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .sync-code { font-size:18px; font-weight:700; letter-spacing:3px; color:var(--text);
    background:var(--card); border:1px solid var(--border); border-radius:8px; padding:6px 14px; font-family:monospace; }
  .sync-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .sync-input { flex:1; min-width:140px; background:var(--card); border:1px solid var(--border); border-radius:8px;
    padding:8px 12px; font-size:13px; color:var(--text); font-family:var(--font); outline:none; text-transform:uppercase; letter-spacing:2px; }
  .sync-input::placeholder { letter-spacing:0; text-transform:none; }
  .sync-btn { padding:8px 14px; background:transparent; border:1px solid var(--border); border-radius:8px;
    color:var(--sub); font-family:var(--font); font-size:12px; cursor:pointer; white-space:nowrap; transition:all .15s; }
  .sync-btn:hover { border-color:var(--purple); color:var(--purple-light); }
  .sync-status { font-size:12px; color:var(--sub); }
  .sync-status.ok { color:var(--green); }
  .sync-status.err { color:var(--red); }
  .pro-lock { display:flex; align-items:center; gap:8px; background:var(--card); border:1px dashed var(--border);
    border-radius:10px; padding:12px 16px; margin-bottom:14px; cursor:pointer; }
  .pro-lock:hover { border-color:var(--purple); }
  .pro-lock-icon { font-size:18px; }
  .pro-lock-text { font-size:13px; color:var(--sub); }
  .pro-lock-cta { font-size:12px; color:var(--purple-light); font-weight:500; }

  /* STATS */
  .stats-panel { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
  .stats-title { font-size:13px; font-weight:600; color:var(--sub); margin-bottom:4px; }
  .stats-row { display:flex; align-items:center; gap:10px; padding:7px 0; border-bottom:1px solid var(--border); }
  .stats-rank { width:20px; font-size:11px; color:var(--muted); text-align:right; }
  .stats-info { flex:1; min-width:0; }
  .stats-song { font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .stats-artist { font-size:11px; color:var(--sub); }
  .stats-plays { font-size:12px; color:var(--purple-light); }

  /* UPLOAD */
  .t-btn.upload:hover { border-color:rgba(168,85,247,.4); color:var(--purple-light); }

  /* DRAG AND DROP */
  .drag-handle { color:var(--muted); cursor:grab; font-size:15px; flex-shrink:0; padding:0 4px; user-select:none; line-height:1; }
  .drag-handle:hover { color:var(--sub); }
  .drag-handle:active { cursor:grabbing; }
  .track-row.dragging { opacity:0.35; background:var(--purple-dim); }
  .track-row.drag-over { border-bottom:2px solid var(--purple); background:rgba(168,85,247,0.07); }

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

  /* LANGUAGE BUTTONS */
  .lang-btns { display:flex; gap:6px; align-items:center; margin-top:8px; }
  .lang-btn { padding:5px 11px; background:var(--card); border:1px solid var(--border); border-radius:20px;
    font-size:12px; color:var(--sub); cursor:pointer; transition:all .15s; font-family:var(--font); white-space:nowrap; }
  .lang-btn:hover { border-color:var(--purple); color:var(--purple-light); }
  .lang-btn.active { background:var(--purple-dim); border-color:var(--purple); color:var(--purple-light); font-weight:500; }

  /* INSTALL + PRO HEADER */
  .header-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .header-badges { display:flex; gap:8px; align-items:center; }
  .ios-guide-overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:9999; display:flex; align-items:flex-end; justify-content:center; padding:24px; }
  .ios-guide-box { background:#1a1a1a; border:1px solid #333; border-radius:16px; padding:24px; max-width:360px; width:100%; }
  .ios-guide-title { font-size:17px; font-weight:600; color:var(--fg); margin-bottom:16px; }
  .ios-guide-steps { color:var(--sub); font-size:14px; line-height:1.8; padding-left:20px; margin:0 0 20px; }
  .ios-guide-steps li { margin-bottom:8px; }
  .ios-share-icon { font-size:16px; }
  .ios-guide-close { width:100%; padding:12px; background:#6C63FF; border:none; border-radius:10px; color:#fff; font-size:15px; font-weight:600; cursor:pointer; }
  .install-btn { padding:6px 12px; background:transparent; border:1px solid var(--border); border-radius:8px;
    color:var(--muted); font-family:var(--font); font-size:12px; cursor:pointer; transition:all .15s; }
  .install-btn:hover { border-color:#333; color:var(--sub); }
  .pro-btn { padding:6px 12px; background:linear-gradient(135deg,#a855f7,#7c3aed); border:none; border-radius:8px;
    color:#fff; font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; letter-spacing:.3px; }
  .pro-badge { padding:6px 12px; background:linear-gradient(135deg,#a855f7,#7c3aed); border:none; border-radius:8px;
    color:#fff; font-family:var(--font); font-size:12px; font-weight:600; letter-spacing:.3px; }

  /* PRO MODAL */
  .pro-overlay { position:fixed; inset:0; background:rgba(0,0,0,.88); backdrop-filter:blur(10px); z-index:100;
    display:flex; align-items:center; justify-content:center; padding:20px; }
  .pro-modal { background:#0c0c0c; border:1px solid #2a1f3d; border-radius:20px; width:100%; max-width:420px; overflow:hidden; max-height:90vh; overflow-y:auto; }
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
  .pro-one-time { font-size:11px; color:var(--green); margin-top:3px; }
  .pro-actions { padding:14px 24px 22px; display:flex; flex-direction:column; gap:8px; }
  .pro-cta { width:100%; padding:14px; background:linear-gradient(135deg,#a855f7,#7c3aed); border:none; border-radius:12px;
    color:#fff; font-family:var(--font); font-size:15px; font-weight:600; cursor:pointer; }
  .pro-skip { width:100%; padding:10px; background:transparent; border:1px solid var(--border); border-radius:12px;
    color:var(--muted); font-family:var(--font); font-size:13px; cursor:pointer; }
  .paypal-container { min-height:48px; }
  .pro-success { text-align:center; padding:40px 24px; }
  .pro-success-icon { font-size:48px; margin-bottom:12px; }
  .pro-success-title { font-size:20px; font-weight:700; color:var(--purple-light); margin-bottom:8px; }
  .pro-success-sub { font-size:13px; color:var(--sub); margin-bottom:20px; }

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

/* ── Audio download via /api/download ───────────────────────── */
async function downloadAudio(videoId) {
  const r = await fetch(`/api/download?videoId=${videoId}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const { url } = await r.json();
  if (!url) throw new Error("No download URL returned");
  const audioRes = await fetch(url);
  if (!audioRes.ok) throw new Error(`Audio fetch failed: ${audioRes.status}`);
  const blob = await audioRes.blob();
  if (blob.size < 10000) throw new Error("blob too small");
  return blob;
}

/* ── AI chat ────────────────────────────────────────────────── */
async function aiChat(system, messages) {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages }),
  });
  const d = await r.json();
  if (!r.ok) {
    // Show actual error from server/Groq for easier debugging
    const errMsg = d?.error || `HTTP ${r.status}`;
    throw new Error(errMsg);
  }
  return d?.content?.[0]?.text || d?.choices?.[0]?.message?.content || "";
}

/* ── Sync helpers ───────────────────────────────────────────── */
async function syncPush(code, playlists) {
  const r = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, playlists }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function syncPull(code) {
  const r = await fetch(`/api/sync?code=${encodeURIComponent(code)}`);
  if (!r.ok) throw new Error(r.status === 404 ? "No playlists found for this code" : `HTTP ${r.status}`);
  return r.json();
}

/* ── Free gen counter helpers ───────────────────────────────── */
function getGenCount() {
  try {
    const data = JSON.parse(localStorage.getItem("playlist-ai-gen") || "{}");
    const today = new Date().toDateString();
    return data.date === today ? (data.count || 0) : 0;
  } catch { return 0; }
}

function bumpGenCount() {
  const count = getGenCount() + 1;
  localStorage.setItem("playlist-ai-gen", JSON.stringify({ date: new Date().toDateString(), count }));
  return count;
}

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
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiSelected, setAiSelected] = useState(new Set());
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  const [showPro, setShowPro] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem("playlist-ai-lang") || 'en');
  const tr = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [isPro, setIsPro] = useState(() => localStorage.getItem("playlist-ai-pro") === "true");
  const [aiGenCount, setAiGenCount] = useState(getGenCount);

  const [syncCode] = useState(() => {
    let code = localStorage.getItem("playlist-ai-sync-code");
    if (!code) {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
      localStorage.setItem("playlist-ai-sync-code", code);
    }
    return code;
  });
  const [importCode, setImportCode] = useState("");
  const [syncStatus, setSyncStatus] = useState({ msg: "", type: "" });

  const [stats, setStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem("playlist-ai-stats") || "{}"); } catch { return {}; }
  });

  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const playlistRef = useRef(playlist);
  const plNameRef = useRef(plName);
  const blobUrlsRef = useRef({});
  const audioRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const uploadFileRef = useRef(null);
  const uploadTargetRef = useRef(null);
  const paypalContainerRef = useRef(null);
  const paypalBtnRenderedRef = useRef(false);
  const currentIdxRef = useRef(currentIdx);
  const playingRef = useRef(playing);
  const isProRef = useRef(isPro);
  const tabRef = useRef(tab);
  // Refs so lock-screen / background handlers always call the latest version
  const skipNextRef = useRef(null);
  const skipPrevRef = useRef(null);
  const togglePlayRef = useRef(null);

  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { isProRef.current = isPro; }, [isPro]);
  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => { plNameRef.current = plName; }, [plName]);
  useEffect(() => { localStorage.setItem("playlist-ai-lang", language); }, [language]);

  // Auto-save current playlist to localStorage whenever it changes
  useEffect(() => {
    if (playlist.length > 0) {
      const toSave = playlist.map(({ title, artist, videoId, thumbnail, duration, hasSpotify }) =>
        ({ title, artist, videoId, thumbnail, duration, hasSpotify }));
      localStorage.setItem("playlist-ai-current", JSON.stringify({ name: plName, songs: toSave }));
    }
  }, [playlist, plName]);

  // Restore current playlist on load
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("playlist-ai-current") || "null");
      if (saved?.songs?.length) {
        setPlaylist(saved.songs.map((s) => ({ ...s, id: Date.now() + Math.random(), ytStatus: s.videoId ? "found" : "notfound" })));
        if (saved.name) setPlName(saved.name);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    // Always delegate through refs so handlers stay current after re-renders
    navigator.mediaSession.setActionHandler("play",          () => togglePlayRef.current?.());
    navigator.mediaSession.setActionHandler("pause",         () => togglePlayRef.current?.());
    navigator.mediaSession.setActionHandler("nexttrack",     () => skipNextRef.current?.());
    navigator.mediaSession.setActionHandler("previoustrack", () => skipPrevRef.current?.());
  }, []); // refs handle freshness — no deps needed

  useEffect(() => {
    IDB.getAll().then((tracks) => {
      setOfflineTracks(tracks);
      const statusMap = {};
      tracks.forEach((t) => {
        if (t.blobUrl) {
          blobUrlsRef.current[t.videoId] = t.blobUrl;
          statusMap[t.videoId] = "done";
        }
      });
      setDlStatus(statusMap);
    }).catch(() => {});
  }, []);

  // Save state when browser/tab closes (safety net for any unsaved changes)
  useEffect(() => {
    const saveState = () => {
      const pl = playlistRef.current;
      const toSave = pl.map(({ title, artist, videoId, thumbnail, duration, hasSpotify }) =>
        ({ title, artist, videoId, thumbnail, duration, hasSpotify }));
      localStorage.setItem("playlist-ai-current", JSON.stringify({ name: plNameRef.current, songs: toSave }));
    };
    window.addEventListener("beforeunload", saveState);
    window.addEventListener("pagehide", saveState);
    return () => {
      window.removeEventListener("beforeunload", saveState);
      window.removeEventListener("pagehide", saveState);
    };
  }, []);

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
          onReady: (e) => { e.target.setVolume(100); e.target.unMute(); },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) setPlaying(true);
            if (e.data === window.YT.PlayerState.PAUSED) setPlaying(false);
            if (e.data === window.YT.PlayerState.ENDED) skipNextRef.current?.();
          },
        },
      });
    };
  }, []);

  useEffect(() => {
    if (!showPro || isPro) return;
    paypalBtnRenderedRef.current = false;

    const renderBtn = () => {
      if (!paypalContainerRef.current || paypalBtnRenderedRef.current) return;
      paypalBtnRenderedRef.current = true;
      paypalContainerRef.current.innerHTML = "";
      window.paypal.Buttons({
        createOrder: (data, actions) =>
          actions.order.create({
            purchase_units: [{
              amount: { value: "9.99", currency_code: "USD" },
              description: "Playlist AI Pro – Lifetime Access",
            }],
          }),
        onApprove: async (data) => {
          try {
            const res = await fetch("/api/paypal-verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderID: data.orderID }),
            });
            const result = await res.json();
            if (result.success) {
              localStorage.setItem("playlist-ai-pro", "true");
              setIsPro(true);
            } else {
              alert("Payment could not be verified. Please contact support.");
            }
          } catch {
            alert("Verification error. Please contact support.");
          }
        },
        onError: () => alert("PayPal encountered an error. Please try again."),
        style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
      }).render(paypalContainerRef.current);
    };

    if (window.paypal) {
      renderBtn();
    } else {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
      script.onload = renderBtn;
      document.head.appendChild(script);
    }
  }, [showPro, isPro]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // ── Screen locked / tab hidden ────────────────────────────────────────
        if (!playingRef.current) return;
        const idx = currentIdxRef.current;
        if (idx === null) return;
        const list = playlistRef.current;
        const track = list[idx];
        if (!track?.videoId) return;

        const blobUrl = blobUrlsRef.current[track.videoId];
        if (!blobUrl) {
          // No local blob — let the YT player keep running in background.
          // Signal the OS that playback is still active so it doesn't kill the session.
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
          return;
        }

        // Prefer time from an already-running audio element, fall back to YT
        const currentTime = audioRef.current
          ? audioRef.current.currentTime
          : (ytPlayerRef.current?.getCurrentTime?.() || 0);

        // Start the <audio> element first, then pause YT once it's playing —
        // this closes the gap that caused the audible cut.
        if (audioRef.current) { audioRef.current.pause(); }
        const a = new Audio(blobUrl);
        audioRef.current = a;
        a.currentTime = currentTime;
        a._tlEnded = false;
        a.onended = () => { a._tlEnded = true; skipNextRef.current?.(); };
        // Recover from OS audio-session interruptions (screen-off / charging on iOS+Android)
        a.onpause = () => {
          if (playingRef.current && !a._tlEnded && audioRef.current === a) {
            setTimeout(() => {
              if (playingRef.current && !a._tlEnded && audioRef.current === a) {
                a.play().catch(() => {});
              }
            }, 200);
          }
        };
        a.addEventListener("playing", () => {
          ytPlayerRef.current?.pauseVideo?.();
        }, { once: true });
        a.play().catch(() => { ytPlayerRef.current?.pauseVideo?.(); });

        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }
      } else {
        // ── Screen unlocked / tab visible ─────────────────────────────────────
        // Stop the background <audio> fallback so the YT player can take over
        // without both sources playing simultaneously (the source of the glitch).
        if (!audioRef.current) return;
        const t = audioRef.current.currentTime;
        audioRef.current.pause();
        audioRef.current = null;

        if (!playingRef.current) return; // user had paused while locked — keep paused

        const idx = currentIdxRef.current;
        if (idx === null) return;
        const list = playlistRef.current;
        const track = list[idx];

        // For offline-only tracks there is no YT player — re-play from blob
        if (!track?.videoId) {
          const url = track?.blobUrl || blobUrlsRef.current?.[track?.videoId];
          if (!url) return;
          const a = new Audio(url);
          audioRef.current = a;
          a.currentTime = t;
          a._tlEnded = false;
          a.onended = () => { a._tlEnded = true; skipNextRef.current?.(); };
          a.onpause = () => {
            if (playingRef.current && !a._tlEnded && audioRef.current === a) {
              setTimeout(() => {
                if (playingRef.current && !a._tlEnded && audioRef.current === a) {
                  a.play().catch(() => {});
                }
              }, 200);
            }
          };
          a.play().catch(() => {});
          return;
        }

        // Hand playback back to the YT player
        if (ytPlayerRef.current?.seekTo) {
          ytPlayerRef.current.seekTo(t, true);
          ytPlayerRef.current.playVideo();
        }
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const currentTrack = tab === "offline"
    ? offlineTracks[currentIdx] || null
    : playlist[currentIdx] || null;

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
        thumbnail: track.thumbnail, duration: track.duration, audioBlob: blob,
      };
      await IDB.save(rec);
      setOfflineTracks(await IDB.getAll());
    } catch {
      setDlStatus((s) => ({ ...s, [track.videoId]: "error" }));
    }
  }, [dlStatus]);

  /* ── Play track ─────────────────────────────────────────────── */
  const playTrack = useCallback((idx, trackList) => {
    const list = trackList || (tabRef.current === "offline" ? offlineTracks : playlistRef.current);
    const t = list[idx];
    if (!t) return;
    setCurrentIdx(idx);
    setPlaying(true);

    setStats((prev) => {
      const key = t.videoId || t.title;
      const updated = { ...prev, [key]: { ...(prev[key] || {}), plays: (prev[key]?.plays || 0) + 1, title: t.title, artist: t.artist } };
      localStorage.setItem("playlist-ai-stats", JSON.stringify(updated));
      return updated;
    });

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title || "Unknown",
        artist: t.artist || "",
        album: "Playlist AI",
        artwork: t.thumbnail ? [{ src: t.thumbnail, sizes: "640x640", type: "image/jpeg" }] : [],
      });
      navigator.mediaSession.playbackState = "playing";
    }

    clearTimeout(autoSaveTimerRef.current);

    if (t.blobUrl || blobUrlsRef.current[t.videoId]) {
      const url = t.blobUrl || blobUrlsRef.current[t.videoId];
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const a = new Audio(url);
      audioRef.current = a;
      a._tlEnded = false;
      a.onended = () => { a._tlEnded = true; skipNextRef.current?.(); };
      // Recover from OS audio-session interruptions (screen-off / charging)
      a.onpause = () => {
        if (playingRef.current && !a._tlEnded && audioRef.current === a) {
          setTimeout(() => {
            if (playingRef.current && !a._tlEnded && audioRef.current === a) {
              a.play().catch(() => {});
            }
          }, 200);
        }
      };
      a.play().catch(() => {});
      return;
    }

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
          if (ytPlayerRef.current?.loadVideoById) { doPlay(ytPlayerRef.current); clearInterval(check); }
        }, 200);
      }

      // Pro: auto-download immediately; Free: only on manual ⬇ tap (no auto-download that interrupts stream)
      if (isProRef.current && !blobUrlsRef.current[t.videoId]) {
        downloadAndSave(t);
      }
    }
  }, [offlineTracks, downloadAndSave]);

  const skipNext = useCallback(() => {
    const list = tabRef.current === "offline" ? offlineTracks : playlistRef.current;
    if (!list.length) return;
    setCurrentIdx((i) => {
      const next = ((i ?? -1) + 1) % list.length;   // wrap around → playlist loops
      setTimeout(() => playTrack(next, list), 100);
      return next;
    });
  }, [offlineTracks, playTrack]);
  useEffect(() => { skipNextRef.current = skipNext; }, [skipNext]);

  const skipPrev = useCallback(() => {
    setCurrentIdx((i) => {
      const prev = (i ?? 1) - 1;
      if (prev >= 0) { setTimeout(() => playTrack(prev), 100); return prev; }
      return i;
    });
  }, [playTrack]);
  useEffect(() => { skipPrevRef.current = skipPrev; }, [skipPrev]);

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
  useEffect(() => { togglePlayRef.current = togglePlay; }, [togglePlay]);

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

    if (!isPro && aiGenCount >= FREE_GEN_LIMIT) {
      setShowPro(true);
      return;
    }

    setAiInput("");
    setAiLoading(true);
    setShowAI(true);
    const newMsgs = [...aiMsgs, { role: "user", content: msg }];
    setAiMsgs([...newMsgs, { role: "thinking", content: "thinking…" }]);

    try {
      const langInstruction = language === 'es' ? ' Suggest songs primarily by Spanish-language artists or popular in Spanish-speaking countries.' : language === 'zh' ? ' Suggest songs primarily by Mandarin/Cantonese artists or popular in Chinese-speaking regions.' : '';
      const systemPrompt = `You are a music playlist AI.${langInstruction} When asked for a playlist, respond ONLY with a JSON array like:\n[{"title":"Song Name","artist":"Artist Name","duration":"3:45"},...]\nInclude 6-10 songs. No explanations, just the JSON array.`;

      // Send system as separate field, conversation history as messages (without system role)
      const reply = await aiChat(systemPrompt, newMsgs.filter(m => m.role !== 'thinking'));

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
        setAiSelected(new Set(songs.map((_, i) => i)));
      }

      if (!isPro) {
        const newCount = bumpGenCount();
        setAiGenCount(newCount);
      }
    } catch (e) {
      setAiMsgs([...newMsgs, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, aiLoading, aiMsgs, isPro, aiGenCount, language]);

  const handleGenerate = () => {
    if (query.trim()) { sendAI(query.trim()); setQuery(""); }
    else setShowAI((v) => !v);
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
      const title = file.name.replace(/\.[^/.]+$/, "");
      const videoId = `upload_${Date.now()}`;
      blobUrlsRef.current[videoId] = url;
      const rec = { videoId, title, artist: "", thumbnail: null, duration: null, audioBlob: file };
      await IDB.save(rec);
      setOfflineTracks(await IDB.getAll());
    } else {
      const t = target.track;
      const videoId = t.videoId || `upload_${Date.now()}`;
      blobUrlsRef.current[videoId] = url;
      setDlStatus((s) => ({ ...s, [videoId]: "done" }));
      const rec = { videoId, title: t.title, artist: t.artist, thumbnail: t.thumbnail, duration: t.duration, audioBlob: file };
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

  /* ── Cross-device sync ──────────────────────────────────────── */
  const handlePushSync = useCallback(async () => {
    if (!savedPlaylists.length) { setSyncStatus({ msg: tr.noSyncCode, type: "err" }); return; }
    setSyncStatus({ msg: "Syncing…", type: "" });
    try {
      await syncPush(syncCode, savedPlaylists);
      setSyncStatus({ msg: "✓ Synced successfully!", type: "ok" });
    } catch (e) {
      setSyncStatus({ msg: `Error: ${e.message}`, type: "err" });
    }
  }, [syncCode, savedPlaylists, tr]);

  const handlePullSync = useCallback(async () => {
    const code = importCode.trim().toUpperCase();
    if (!code) { setSyncStatus({ msg: tr.enterCode, type: "err" }); return; }
    setSyncStatus({ msg: "Loading…", type: "" });
    try {
      const data = await syncPull(code);
      const remote = data.playlists || [];
      if (!remote.length) { setSyncStatus({ msg: "No playlists found for that code", type: "err" }); return; }
      const merged = [...remote, ...savedPlaylists.filter((p) => !remote.find((r) => r.name === p.name))];
      setSavedPlaylists(merged);
      localStorage.setItem("saved-playlists", JSON.stringify(merged));
      setSyncStatus({ msg: `✓ Loaded ${remote.length} playlist${remote.length !== 1 ? "s" : ""}!`, type: "ok" });
      setImportCode("");
    } catch (e) {
      setSyncStatus({ msg: `Error: ${e.message}`, type: "err" });
    }
  }, [importCode, savedPlaylists, tr]);

  /* ── Drag and drop reorder ──────────────────────────────────── */
  const handleDrop = useCallback((toIdx) => {
    if (dragIdx === null || dragIdx === toIdx) return;
    const newPlaylist = [...playlistRef.current];
    const [removed] = newPlaylist.splice(dragIdx, 1);
    newPlaylist.splice(toIdx, 0, removed);
    setPlaylist(newPlaylist);
    if (currentIdx !== null) {
      if (currentIdx === dragIdx) {
        setCurrentIdx(toIdx);
      } else if (dragIdx < currentIdx && toIdx >= currentIdx) {
        setCurrentIdx(currentIdx - 1);
      } else if (dragIdx > currentIdx && toIdx <= currentIdx) {
        setCurrentIdx(currentIdx + 1);
      }
    }
    setDragIdx(null);
    setDragOverIdx(null);
  }, [dragIdx, currentIdx]);

  /* ── Render track row ───────────────────────────────────────── */
  const renderRow = (t, idx, isOffline = false) => {
    const isPlaying = currentIdx === idx && playing && tab === (isOffline ? "offline" : "playlist");
    const dl = dlStatus[t.videoId];
    const isOfflineSaved = !!offlineTracks.find((o) => o.videoId === t.videoId);
    const isDragging = !isOffline && dragIdx === idx;
    const isDragOver = !isOffline && dragOverIdx === idx && dragIdx !== idx;

    return (
      <div
        key={t.id || t.videoId}
        className={`track-row${isPlaying ? " playing" : ""}${isDragging ? " dragging" : ""}${isDragOver ? " drag-over" : ""}`}
        draggable={!isOffline}
        onDragStart={!isOffline ? (e) => { setDragIdx(idx); e.dataTransfer.effectAllowed = "move"; } : undefined}
        onDragOver={!isOffline ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverIdx(idx); } : undefined}
        onDrop={!isOffline ? (e) => { e.preventDefault(); handleDrop(idx); } : undefined}
        onDragEnd={!isOffline ? () => { setDragIdx(null); setDragOverIdx(null); } : undefined}
        onClick={() => { setTab(isOffline ? "offline" : "playlist"); playTrack(idx); }}
      >
        {!isOffline && (
          <div className="drag-handle" onMouseDown={(e) => e.stopPropagation()} title="Drag to reorder">⠿</div>
        )}
        <div className="track-num">{isPlaying ? "▶" : idx + 1}</div>

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

        {t.ytStatus === "searching" && <span className="track-status">searching…</span>}
        {t.ytStatus === "notfound" && <span className="track-status">not found</span>}
        {t.duration && <div className="track-dur">{t.duration}</div>}

        <div className="track-actions" onClick={(e) => e.stopPropagation()}>
          {!isOffline && t.videoId && (
            <button
              className={`t-btn${dl === "done" || isOfflineSaved ? " dl-done" : dl === "error" ? " dl-err" : dl === "loading" ? " dl-ing" : ""}`}
              title={dl === "done" || isOfflineSaved ? tr.savedOffline : dl === "error" ? tr.retryDownload : tr.saveOffline}
              onClick={() => downloadAndSave(t)}
              disabled={dl === "loading"}
            >
              {dl === "done" || isOfflineSaved ? "⚡" : dl === "loading" ? "…" : dl === "error" ? "!" : "⬇"}
            </button>
          )}
          {!isOffline && t.ytStatus === "notfound" && (
            <button className="t-btn retry" title={tr.retrySearch} onClick={() => {
              setPlaylist((p) => p.map((x) => x.id === t.id ? { ...x, ytStatus: "searching" } : x));
              ytSearch(t.title, t.artist).then((yt) => {
                if (yt?.videoId) setPlaylist((p) => p.map((x) => x.id === t.id ? { ...x, videoId: yt.videoId, thumbnail: x.thumbnail || yt.thumbnail, ytStatus: "found" } : x));
              });
            }}>↺</button>
          )}
          {!isOffline && (
            <button className="t-btn upload" title={tr.uploadAudio}
              onClick={() => { uploadTargetRef.current = { track: t }; uploadFileRef.current?.click(); }}>⬆</button>
          )}
          <button className="t-btn remove" title={tr.remove} onClick={() => {
            if (isOffline) {
              IDB.del(t.videoId).then(() => IDB.getAll().then(setOfflineTracks));
            } else {
              setPlaylist((p) => p.filter((_, i) => i !== idx));
            }
          }}>×</button>
        </div>
      </div>
    );
  };

  const topTracks = Object.entries(stats)
    .sort((a, b) => (b[1].plays || 0) - (a[1].plays || 0))
    .slice(0, 8);

  return (
    <>
      <style>{STYLES}</style>
      <div id="yt-player-wrap"><div id="yt-player" /></div>
      <input ref={uploadFileRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleUploadFile} />

      <div className="app">
        {/* HEADER */}
        <div className="header">
          <div className="header-top">
            <div className="logo">Playlist AI</div>
            <div className="header-badges">
              {!isStandalone && (
                <button className="install-btn" onClick={async () => {
                  if (installPrompt) {
                    installPrompt.prompt();
                    const { outcome } = await installPrompt.userChoice;
                    if (outcome === "accepted") setInstallPrompt(null);
                  } else {
                    setShowIOSGuide(true);
                  }
                }}>{tr.install}</button>
              )}
              {showIOSGuide && (
                <div className="ios-guide-overlay" onClick={() => setShowIOSGuide(false)}>
                  <div className="ios-guide-box" onClick={e => e.stopPropagation()}>
                    <div className="ios-guide-title">Install Playlist AI</div>
                    <ol className="ios-guide-steps">
                      <li>Tap the <strong>Share</strong> button <span className="ios-share-icon">⎋</span> at the bottom of Safari</li>
                      <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                      <li>Tap <strong>Add</strong> — done! 🎉</li>
                    </ol>
                    <button className="ios-guide-close" onClick={() => setShowIOSGuide(false)}>Got it</button>
                  </div>
                </div>
              )}
              {isPro ? (
                <span className="pro-badge">👑 Pro</span>
              ) : (
                <button className="pro-btn" onClick={() => setShowPro(true)}>✦ Pro</button>
              )}
            </div>
          </div>
          <div className="input-row">
            <input
              className="main-input"
              placeholder={tr.placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button className="gen-btn" onClick={handleGenerate} disabled={aiLoading}>
              {aiLoading ? "…" : tr.generate}
            </button>
          </div>
          <div className="lang-btns">
            {["en","es","zh"].map((l) => (
              <button key={l} className={`lang-btn${language === l ? " active" : ""}`} onClick={() => setLanguage(l)}>
                {l === "en" ? "🇺🇸 EN" : l === "es" ? "🇪🇸 ES" : "🇨🇳 中文"}
              </button>
            ))}
          </div>
          {!isPro && (
            <div className="gen-limit">
              {tr.freeLeft(Math.max(0, FREE_GEN_LIMIT - aiGenCount))}
              {aiGenCount >= FREE_GEN_LIMIT && " — "}
              {aiGenCount >= FREE_GEN_LIMIT && <span style={{ color: "var(--purple-light)", cursor: "pointer" }} onClick={() => setShowPro(true)}>{tr.upgradePro}</span>}
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="tabs">
          <button className={`tab${tab === "playlist" ? " active" : ""}`} onClick={() => setTab("playlist")}>
            {tr.tabPlaylist} {playlist.length > 0 && <span className="tab-badge">{playlist.length}</span>}
          </button>
          <button className={`tab${tab === "offline" ? " active" : ""}`} onClick={() => setTab("offline")}>
            {tr.tabDownloads} {offlineTracks.length > 0 && <span className="tab-badge">{offlineTracks.length}</span>}
          </button>
          <button className={`tab${tab === "myplaylists" ? " active" : ""}`} onClick={() => setTab("myplaylists")}>
            {tr.tabMyPlaylists} {savedPlaylists.length > 0 && <span className="tab-badge">{savedPlaylists.length}</span>}
          </button>
          {isPro && topTracks.length > 0 && (
            <button className={`tab${tab === "stats" ? " active" : ""}`} onClick={() => setTab("stats")}>
              {tr.tabStats}
            </button>
          )}
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
                {tr.chips.map((c) => <button key={c} className="chip" onClick={() => sendAI(c)}>{c}</button>)}
              </div>
            )}
            {aiSuggestions.length > 0 && (
              <>
                <div className="suggest-list">
                  {aiSuggestions.map((s, i) => (
                    <div key={i} className={`suggest-row${aiSelected.has(i) ? " selected" : ""}`}
                      onClick={() => setAiSelected((prev) => {
                        const next = new Set(prev);
                        next.has(i) ? next.delete(i) : next.add(i);
                        return next;
                      })}>
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
                  <button className="suggest-add-btn" disabled={aiSelected.size === 0}
                    onClick={() => {
                      const toAdd = aiSuggestions.filter((_, i) => aiSelected.has(i));
                      toAdd.forEach((s) => addTrack(s));
                      setAiSuggestions([]);
                      setAiSelected(new Set());
                      setTab("playlist");
                    }}>
                    {tr.addSongs(aiSelected.size)}
                  </button>
                  <button className="suggest-all-btn" onClick={() => setAiSelected(new Set(aiSuggestions.map((_, i) => i)))}>{tr.all}</button>
                  <button className="suggest-all-btn" onClick={() => setAiSelected(new Set())}>{tr.none}</button>
                </div>
              </>
            )}
            <div className="ai-input-row">
              <input
                className="ai-input"
                placeholder={tr.aiPlaceholder}
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
              <input className="add-input" placeholder={tr.songTitle} value={addForm.title}
                onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && submitAdd()} autoFocus />
              <input className="add-input" placeholder={tr.artist} value={addForm.artist}
                onChange={(e) => setAddForm((f) => ({ ...f, artist: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && submitAdd()} />
              <input className="add-input" placeholder={tr.duration} value={addForm.duration}
                style={{ maxWidth: 140 }}
                onChange={(e) => setAddForm((f) => ({ ...f, duration: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && submitAdd()} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="add-submit" onClick={submitAdd}>{tr.addSong}</button>
              <button className="add-cancel" onClick={() => setShowAdd(false)}>{tr.cancel}</button>
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
                  <button className="icon-btn" onClick={() => { setShowAdd((v) => !v); setShowAI(false); }}>{tr.addSongBtn}</button>
                  {playlist.length > 0 && <button className="save-pl-btn" onClick={savePlaylist}>{tr.save}</button>}
                  {playlist.length > 0 && (
                    <button className="icon-btn danger" onClick={() => { setPlaylist([]); setCurrentIdx(null); }}>{tr.clear}</button>
                  )}
                </div>
              </div>
              {playlist.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">♫</div>
                  <div className="empty-text">{tr.emptyPlaylist}</div>
                  <div className="empty-sub">{tr.emptySub}</div>
                </div>
              ) : (
                playlist.map((t, i) => renderRow(t, i, false))
              )}
            </>
          )}

          {tab === "offline" && (
            <>
              <div className="pl-header">
                <span style={{ fontSize: 15, fontWeight: 600 }}>{tr.tabDownloads}</span>
                <div className="pl-actions">
                  <button className="icon-btn" onClick={() => { uploadTargetRef.current = { isNew: true }; uploadFileRef.current?.click(); }}>
                    {tr.uploadFile}
                  </button>
                </div>
              </div>
              {offlineTracks.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">⚡</div>
                  <div className="empty-text">{tr.noOffline}</div>
                  <div className="empty-sub">
                    {isPro ? tr.offlineSubPro : tr.offlineSubFree}
                  </div>
                </div>
              ) : (
                offlineTracks.map((t, i) => renderRow(t, i, true))
              )}
            </>
          )}

          {tab === "myplaylists" && (
            <>
              <div className="pl-header">
                <span style={{ fontSize: 15, fontWeight: 600 }}>{tr.tabMyPlaylists}</span>
              </div>

              {isPro ? (
                <div className="sync-panel">
                  <div className="sync-panel-title">{tr.syncTitle}</div>
                  <div className="sync-code-row">
                    <span style={{ fontSize: 12, color: "var(--sub)" }}>{tr.syncCodeLabel}</span>
                    <span className="sync-code">{syncCode}</span>
                    <button className="sync-btn" onClick={() => { navigator.clipboard.writeText(syncCode); setSyncStatus({ msg: tr.copied, type: "ok" }); }}>{tr.copy}</button>
                    <button className="sync-btn" onClick={handlePushSync}>{tr.push}</button>
                  </div>
                  <div className="sync-row">
                    <input
                      className="sync-input"
                      placeholder={tr.syncPlaceholder}
                      value={importCode}
                      onChange={(e) => setImportCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handlePullSync()}
                      maxLength={6}
                    />
                    <button className="sync-btn" onClick={handlePullSync}>{tr.pull}</button>
                  </div>
                  {syncStatus.msg && <span className={`sync-status${syncStatus.type ? ` ${syncStatus.type}` : ""}`}>{syncStatus.msg}</span>}
                </div>
              ) : (
                <div className="pro-lock" onClick={() => setShowPro(true)}>
                  <span className="pro-lock-icon">🔄</span>
                  <div>
                    <div className="pro-lock-text">{tr.syncLockText}</div>
                    <div className="pro-lock-cta">{tr.syncLockCta}</div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input className="add-input" placeholder={tr.newPlaceholder} value={newPlName}
                  onChange={(e) => setNewPlName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createNewPlaylist()} />
                <button className="save-pl-btn" onClick={createNewPlaylist}>{tr.newBtn}</button>
              </div>

              {savedPlaylists.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">🎵</div>
                  <div className="empty-text">{tr.noPlaylists}</div>
                  <div className="empty-sub">{tr.noPlaylistsSub}</div>
                </div>
              ) : (
                <div className="pl-list">
                  {savedPlaylists.map((pl) => (
                    <div key={pl.id} className="pl-card" onClick={() => loadPlaylist(pl)}>
                      <div className="pl-card-icon">🎵</div>
                      <div className="pl-card-info">
                        <div className="pl-card-name">{pl.name}</div>
                        <div className="pl-card-count">{tr.songs(pl.songs.length)}</div>
                      </div>
                      <div className="pl-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="save-pl-btn" onClick={() => loadPlaylist(pl)}>{tr.load}</button>
                        <button className="icon-btn danger" onClick={() => deletePlaylist(pl.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "stats" && isPro && (
            <>
              <div className="pl-header">
                <span style={{ fontSize: 15, fontWeight: 600 }}>{tr.statsTitle}</span>
              </div>
              {topTracks.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📊</div>
                  <div className="empty-text">{tr.noPlays}</div>
                  <div className="empty-sub">{tr.noPlaysSub}</div>
                </div>
              ) : (
                <div className="stats-panel">
                  <div className="stats-title">{tr.topTracks}</div>
                  {topTracks.map(([, data], i) => (
                    <div key={i} className="stats-row">
                      <div className="stats-rank">{i + 1}</div>
                      <div className="stats-info">
                        <div className="stats-song">{data.title}</div>
                        <div className="stats-artist">{data.artist}</div>
                      </div>
                      <div className="stats-plays">{tr.plays(data.plays)}</div>
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
            {isPro ? (
              <div className="pro-success">
                <div className="pro-success-icon">👑</div>
                <div className="pro-success-title">{tr.proSuccess}</div>
                <div className="pro-success-sub">{tr.proSuccessSub}</div>
                <button className="pro-cta" onClick={() => setShowPro(false)}>{tr.letsGo}</button>
              </div>
            ) : (
              <>
                <div className="pro-header">
                  <div className="pro-crown">👑</div>
                  <div className="pro-title">{tr.proTitle}</div>
                  <div className="pro-subtitle">{tr.proSubtitle}</div>
                </div>
                <div className="pro-features">
                  {tr.proFeatures.map(([icon, name, desc]) => (
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
                  <div className="pro-price">{tr.proPrice} <span>one-time</span></div>
                  <div className="pro-one-time">{tr.proOneTime}</div>
                </div>
                <div className="pro-actions">
                  <div ref={paypalContainerRef} className="paypal-container" />
                  <button className="pro-skip" onClick={() => setShowPro(false)}>{tr.maybeLater}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
