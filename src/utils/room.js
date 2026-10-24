import Peer from 'peerjs';
import { BOT_NAMES, AVATAR_COLORS } from './words';

// Multiplayer rooms run peer-to-peer over WebRTC (PeerJS), so they work on a static
// host like GitHub Pages with no backend. The host's browser is the authoritative
// room: it tracks the session clock, collects every racer's test results and
// broadcasts snapshots to all guests.

const PEER_PREFIX = 'monkeyracer-v2-';
const PEER_OPTIONS = {
  debug: 0,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ],
  },
};

const MAX_RACERS = 200;
const TICK_MS = 250;
const BROADCAST_MS = 1000;
const HEARTBEAT_MS = 4000;
const PEER_TIMEOUT_MS = 15000;
const COUNTDOWN_MS = 5000;
// Results that arrive just after the session ends (network latency) still count
const RESULT_GRACE_MS = 3000;

export const SESSION_MINUTE_OPTIONS = [1, 2, 3, 5, 10];
export const TEST_SECOND_OPTIONS = [15, 30, 60, 120];
export const DEFAULT_ROOM_CONFIG = { sessionMinutes: 5, testSeconds: 15, type: 'standard' };

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createRoomCode() {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return `RACE-${code}`;
}

// Accepts "RACE-ABCD", "abcd", or a full share link containing ?room=RACE-ABCD
export function normalizeRoomCode(input) {
  if (!input) return '';
  let value = String(input).trim();
  try {
    if (/^https?:\/\//i.test(value)) {
      value = new URL(value).searchParams.get('room') || '';
    }
  } catch {
    // Not a URL — treat as a code
  }
  value = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!value) return '';
  if (!value.startsWith('RACE-')) value = `RACE-${value.replace(/^RACE/, '').replace(/^-/, '')}`;
  return value;
}

export function getRoomShareUrl(roomId) {
  const { origin, pathname } = window.location;
  const base = pathname.endsWith('/') ? pathname : pathname.replace(/[^/]*$/, '');
  return `${origin}${base}?room=${encodeURIComponent(roomId)}`;
}

export function isLocalhostUrl() {
  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

export function detectDevice() {
  return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

function cleanUsername(name) {
  const trimmed = (name || '').trim().slice(0, 18);
  return trimmed || `Racer_${Math.floor(100 + Math.random() * 900)}`;
}

function summarizeTests(tests) {
  if (!tests.length) {
    return { testsCompleted: 0, bestWpm: 0, avgWpm: 0, avgAcc: 0, bestAcc: 0, lastWpm: 0 };
  }
  const sum = (key) => tests.reduce((acc, t) => acc + t[key], 0);
  return {
    testsCompleted: tests.length,
    bestWpm: Math.max(...tests.map((t) => t.wpm)),
    avgWpm: Math.round(sum('wpm') / tests.length),
    avgAcc: Math.round(sum('accuracy') / tests.length),
    bestAcc: Math.max(...tests.map((t) => t.accuracy)),
    lastWpm: tests[tests.length - 1].wpm,
  };
}

// Ranking used for live leaderboard and final podium: best WPM, then accuracy, then consistency
export function rankParticipants(participants, metric = 'bestWpm') {
  const secondary = metric === 'avgAcc' ? 'bestWpm' : 'avgAcc';
  return [...participants].sort((a, b) => {
    if (!!b.testsCompleted !== !!a.testsCompleted) return b.testsCompleted ? 1 : -1;
    if ((b[metric] || 0) !== (a[metric] || 0)) return (b[metric] || 0) - (a[metric] || 0);
    if ((b[secondary] || 0) !== (a[secondary] || 0)) return (b[secondary] || 0) - (a[secondary] || 0);
    return (b.testsCompleted || 0) - (a.testsCompleted || 0);
  });
}

function sanitizeResult(data) {
  const num = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  return {
    wpm: num(data?.wpm, 400),
    rawWpm: num(data?.rawWpm, 400),
    accuracy: num(data?.accuracy, 100),
    errors: num(data?.errors, 10000),
  };
}

/* ------------------------------------------------------------------ */
/*  Host                                                               */
/* ------------------------------------------------------------------ */

export class RoomHost {
  constructor({ username, onState, onEvent }) {
    this.isHost = true;
    this.onState = onState;
    this.onEvent = onEvent;
    this.peer = null;
    this.offline = false;
    this.connections = new Map(); // peerId -> { conn, lastSeen }
    this.tickTimer = null;
    this.lastBroadcast = 0;

    this.room = {
      id: null,
      config: { ...DEFAULT_ROOM_CONFIG },
      status: 'lobby', // 'lobby' | 'countdown' | 'running' | 'finished'
      round: 1,
      countdownEndsAt: null,
      sessionEndsAt: null,
      participants: new Map(),
    };

    this.selfId = 'host';
    this.addParticipant(this.selfId, { username, device: detectDevice(), isHost: true });
  }

  // Register a peer with a fresh room code. Falls back to offline (bots-only) mode
  // when the signalling server is unreachable.
  start() {
    return new Promise((resolve) => {
      let attempts = 0;
      const tryOpen = () => {
        attempts += 1;
        const code = createRoomCode();
        const peer = new Peer(PEER_PREFIX + code, PEER_OPTIONS);
        let settled = false;

        const goOffline = () => {
          if (settled) return;
          settled = true;
          peer.destroy();
          this.offline = true;
          this.room.id = code;
          this.startTicking();
          this.broadcast(true);
          resolve({ roomId: code, offline: true });
        };
        const timeout = setTimeout(goOffline, 10000);

        peer.on('open', () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          this.peer = peer;
          this.room.id = code;
          peer.on('connection', (conn) => this.handleConnection(conn));
          // Keep the room reachable if the signalling socket drops
          peer.on('disconnected', () => {
            if (!peer.destroyed) peer.reconnect();
          });
          this.startTicking();
          this.broadcast(true);
          resolve({ roomId: code, offline: false });
        });

        peer.on('error', (err) => {
          if (settled) {
            console.warn('[room host]', err.type, err.message);
            return;
          }
          if (err.type === 'unavailable-id' && attempts < 5) {
            settled = true;
            clearTimeout(timeout);
            peer.destroy();
            tryOpen();
            return;
          }
          clearTimeout(timeout);
          goOffline();
        });
      };
      tryOpen();
    });
  }

  handleConnection(conn) {
    conn.on('open', () => {
      this.connections.set(conn.peer, { conn, lastSeen: Date.now() });
    });
    conn.on('data', (msg) => this.handleMessage(conn, msg));
    conn.on('close', () => this.dropConnection(conn.peer));
    conn.on('error', () => this.dropConnection(conn.peer));
  }

  handleMessage(conn, msg) {
    if (!msg || typeof msg !== 'object') return;
    const entry = this.connections.get(conn.peer);
    if (entry) entry.lastSeen = Date.now();
    const id = conn.peer;

    switch (msg.type) {
      case 'JOIN': {
        if (this.room.participants.has(id)) return;
        if (this.room.participants.size >= MAX_RACERS) {
          conn.send({ type: 'REJECTED', reason: `Room is full (max ${MAX_RACERS} racers).` });
          setTimeout(() => conn.close(), 300);
          return;
        }
        const p = this.addParticipant(id, { username: msg.username, device: msg.device });
        conn.send({ type: 'WELCOME', selfId: id });
        this.emitEvent(`${p.username} joined the room`);
        this.broadcast(true);
        break;
      }
      case 'LIVE':
        this.applyLive(id, msg);
        break;
      case 'RESULT':
        this.applyResult(id, msg);
        break;
      case 'RENAME':
        this.renameParticipant(id, msg.username);
        break;
      default:
        break;
    }
  }

  dropConnection(peerId) {
    if (!this.connections.has(peerId)) return;
    this.connections.delete(peerId);
    const p = this.room.participants.get(peerId);
    if (!p) return;
    // Keep results of racers who leave mid-session so the leaderboard stays fair
    if (this.room.status === 'running' && p.tests.length > 0) {
      p.connected = false;
      p.live = null;
    } else {
      this.room.participants.delete(peerId);
    }
    this.emitEvent(`${p.username} left the room`);
    this.broadcast(true);
  }

  // Make a name unique within the room (ignoring the racer's own current name)
  uniqueName(username, excludeId = null) {
    const name = cleanUsername(username);
    const taken = new Set(
      Array.from(this.room.participants.values())
        .filter((p) => p.id !== excludeId)
        .map((p) => p.username)
    );
    if (!taken.has(name)) return name;
    let n = 2;
    while (taken.has(`${name.slice(0, 15)}_${n}`)) n += 1;
    return `${name.slice(0, 15)}_${n}`;
  }

  renameParticipant(id, username) {
    const p = this.room.participants.get(id);
    if (!p || p.isBot || !(username || '').trim()) return;
    const next = this.uniqueName(username, id);
    if (next === p.username) return;
    const old = p.username;
    p.username = next;
    this.emitEvent(`${old} is now ${next}`);
    this.broadcast(true);
  }

  addParticipant(id, { username, device, isHost = false, isBot = false, targetWpm = null }) {
    const participant = {
      id,
      username: this.uniqueName(username),
      color: AVATAR_COLORS[this.room.participants.size % AVATAR_COLORS.length],
      isHost,
      isBot,
      device: device === 'mobile' ? 'mobile' : 'desktop',
      connected: true,
      live: null, // { wpm, accuracy, progress, typing }
      tests: [],
      targetWpm,
      botNextTestAt: null,
      botTestStartedAt: null,
    };
    this.room.participants.set(id, participant);
    return participant;
  }

  applyLive(id, data) {
    if (this.room.status !== 'running') return;
    const p = this.room.participants.get(id);
    if (!p) return;
    p.live = {
      wpm: Math.max(0, Math.min(400, Math.round(Number(data.wpm) || 0))),
      accuracy: Math.max(0, Math.min(100, Math.round(Number(data.accuracy) || 0))),
      progress: Math.max(0, Math.min(100, Math.round(Number(data.progress) || 0))),
      typing: !!data.typing,
    };
  }

  applyResult(id, data) {
    if (this.room.status !== 'running' && this.room.status !== 'finished') return;
    if (Date.now() > this.room.sessionEndsAt + RESULT_GRACE_MS) return;
    const p = this.room.participants.get(id);
    if (!p) return;
    const result = sanitizeResult(data);
    p.tests.push(result);
    p.live = null;
    const best = Math.max(...p.tests.map((t) => t.wpm));
    if (result.wpm === best && p.tests.length > 1) {
      this.emitEvent(`🔥 ${p.username} set a new best: ${result.wpm} wpm`);
    }
    this.broadcast(true);
  }

  /* ---------- host controls ---------- */

  updateConfig(partial) {
    if (this.room.status !== 'lobby' && this.room.status !== 'finished') return;
    const next = { ...this.room.config, ...partial };
    if (!SESSION_MINUTE_OPTIONS.includes(next.sessionMinutes)) next.sessionMinutes = DEFAULT_ROOM_CONFIG.sessionMinutes;
    if (!TEST_SECOND_OPTIONS.includes(next.testSeconds)) next.testSeconds = DEFAULT_ROOM_CONFIG.testSeconds;
    if (next.testSeconds > next.sessionMinutes * 60) next.testSeconds = 15;
    this.room.config = next;
    this.broadcast(true);
  }

  addBots(count) {
    const toAdd = Math.min(count, MAX_RACERS - this.room.participants.size);
    for (let i = 0; i < toAdd; i++) {
      const id = `bot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const base = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      this.addParticipant(id, {
        username: `${base}_${Math.floor(10 + Math.random() * 89)}`,
        device: Math.random() > 0.5 ? 'mobile' : 'desktop',
        isBot: true,
        targetWpm: Math.floor(40 + Math.random() * 80),
      });
    }
    this.broadcast(true);
    return toAdd;
  }

  clearBots() {
    for (const [id, p] of this.room.participants) {
      if (p.isBot) this.room.participants.delete(id);
    }
    this.broadcast(true);
  }

  startSession() {
    if (this.room.status !== 'lobby' && this.room.status !== 'finished') return;
    this.resetResults();
    this.room.status = 'countdown';
    this.room.countdownEndsAt = Date.now() + COUNTDOWN_MS;
    this.room.sessionEndsAt = null;
    this.broadcast(true);
  }

  // Restart without anyone leaving: wipe results and return everyone to the lobby
  restartRoom() {
    this.resetResults();
    this.room.status = 'lobby';
    this.room.round += 1;
    this.room.countdownEndsAt = null;
    this.room.sessionEndsAt = null;
    this.emitEvent('Host restarted the room');
    this.broadcast(true);
  }

  endSessionNow() {
    if (this.room.status !== 'running') return;
    this.room.sessionEndsAt = Date.now();
    this.finishSession();
  }

  resetResults() {
    for (const p of this.room.participants.values()) {
      p.tests = [];
      p.live = null;
      p.botNextTestAt = null;
      p.botTestStartedAt = null;
    }
    // Drop racers who disconnected during the previous session
    for (const [id, p] of this.room.participants) {
      if (!p.connected) this.room.participants.delete(id);
    }
  }

  finishSession() {
    this.room.status = 'finished';
    for (const p of this.room.participants.values()) p.live = null;
    this.broadcast(true);
  }

  /* ---------- local (host's own) racing ---------- */

  sendLive(data) {
    this.applyLive(this.selfId, data);
  }

  submitResult(data) {
    this.applyResult(this.selfId, data);
  }

  rename(username) {
    this.renameParticipant(this.selfId, username);
  }

  /* ---------- loop ---------- */

  startTicking() {
    if (this.tickTimer) return;
    this.tickTimer = setInterval(() => this.tick(), TICK_MS);
  }

  tick() {
    const now = Date.now();
    const room = this.room;

    if (room.status === 'countdown' && now >= room.countdownEndsAt) {
      room.status = 'running';
      room.sessionEndsAt = now + room.config.sessionMinutes * 60 * 1000;
      this.broadcast(true);
    }

    if (room.status === 'running') {
      this.simulateBots(now);
      if (now >= room.sessionEndsAt) {
        this.finishSession();
        return;
      }
    }

    // Prune guests we have not heard from (closed tab without a clean disconnect)
    for (const [peerId, entry] of this.connections) {
      if (now - entry.lastSeen > PEER_TIMEOUT_MS) {
        try { entry.conn.close(); } catch { /* already closed */ }
        this.dropConnection(peerId);
      }
    }

    const interval = room.status === 'countdown' ? TICK_MS : (room.status === 'running' ? BROADCAST_MS : HEARTBEAT_MS);
    if (now - this.lastBroadcast >= interval) this.broadcast();
  }

  simulateBots(now) {
    const testMs = this.room.config.testSeconds * 1000;
    for (const p of this.room.participants.values()) {
      if (!p.isBot) continue;

      if (p.botTestStartedAt === null) {
        if (p.botNextTestAt === null) p.botNextTestAt = now + 500 + Math.random() * 2500;
        // Bots, like people, can only start a test that fits in the remaining time
        if (now >= p.botNextTestAt && this.room.sessionEndsAt - now >= testMs) {
          p.botTestStartedAt = now;
        } else {
          p.live = null;
          continue;
        }
      }

      const elapsed = now - p.botTestStartedAt;
      const jitter = Math.sin(now / 900 + p.targetWpm) * 6;
      p.live = {
        wpm: Math.max(10, Math.round(p.targetWpm + jitter)),
        accuracy: 92 + Math.round(Math.random() * 7),
        progress: Math.min(100, Math.round((elapsed / testMs) * 100)),
        typing: true,
      };

      if (elapsed >= testMs) {
        const wpm = Math.max(10, Math.round(p.targetWpm + (Math.random() - 0.5) * 18));
        p.tests.push({
          wpm,
          rawWpm: Math.round(wpm * (1.02 + Math.random() * 0.06)),
          accuracy: Math.min(100, 90 + Math.round(Math.random() * 10)),
          errors: Math.round(Math.random() * 6),
        });
        p.live = null;
        p.botTestStartedAt = null;
        p.botNextTestAt = now + 1500 + Math.random() * 3000;
      }
    }
  }

  snapshot() {
    const now = Date.now();
    const room = this.room;
    const includeTests = room.status === 'finished';
    return {
      id: room.id,
      config: room.config,
      status: room.status,
      round: room.round,
      offline: this.offline,
      countdownRemainingMs: room.countdownEndsAt ? Math.max(0, room.countdownEndsAt - now) : null,
      sessionRemainingMs: room.sessionEndsAt ? Math.max(0, room.sessionEndsAt - now) : null,
      participants: Array.from(room.participants.values()).map((p) => ({
        id: p.id,
        username: p.username,
        color: p.color,
        isHost: p.isHost,
        isBot: p.isBot,
        device: p.device,
        connected: p.connected,
        live: p.live,
        ...summarizeTests(p.tests),
        ...(includeTests ? { tests: p.tests.map((t) => ({ wpm: t.wpm, accuracy: t.accuracy })) } : {}),
      })),
    };
  }

  broadcast() {
    this.lastBroadcast = Date.now();
    const snap = this.snapshot();
    for (const { conn } of this.connections.values()) {
      if (conn.open) conn.send({ type: 'STATE', state: snap });
    }
    this.onState?.(snap, this.selfId);
  }

  emitEvent(message) {
    for (const { conn } of this.connections.values()) {
      if (conn.open) conn.send({ type: 'EVENT', message });
    }
    this.onEvent?.(message);
  }

  destroy() {
    clearInterval(this.tickTimer);
    this.tickTimer = null;
    for (const { conn } of this.connections.values()) {
      try { conn.send({ type: 'CLOSED', reason: 'The host closed the room.' }); } catch { /* ignore */ }
    }
    // Give the goodbye message a moment to flush before tearing down
    const peer = this.peer;
    setTimeout(() => peer?.destroy(), 200);
    this.connections.clear();
  }
}

/* ------------------------------------------------------------------ */
/*  Guest                                                              */
/* ------------------------------------------------------------------ */

export class RoomClient {
  constructor({ code, username, onState, onEvent, onClose }) {
    this.isHost = false;
    this.code = code;
    this.username = username;
    this.onState = onState;
    this.onEvent = onEvent;
    this.onClose = onClose;
    this.peer = null;
    this.conn = null;
    this.selfId = null;
    this.closed = false;
    this.lastHeard = Date.now();
    this.heartbeatTimer = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = (message) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this.teardown();
        reject(new Error(message));
      };
      const timeout = setTimeout(
        () => fail('Could not reach the room. Check the code and make sure the host is still in the room.'),
        15000
      );

      const peer = new Peer(PEER_OPTIONS);
      this.peer = peer;

      peer.on('open', () => {
        const conn = peer.connect(PEER_PREFIX + this.code, { reliable: true });
        this.conn = conn;

        conn.on('open', () => {
          conn.send({ type: 'JOIN', username: this.username, device: detectDevice() });
        });

        conn.on('data', (msg) => {
          if (!msg || typeof msg !== 'object') return;
          this.lastHeard = Date.now();
          switch (msg.type) {
            case 'WELCOME':
              this.selfId = msg.selfId;
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                this.startHeartbeat();
                resolve({ selfId: msg.selfId });
              }
              break;
            case 'STATE':
              if (this.selfId) this.onState?.(msg.state, this.selfId);
              break;
            case 'EVENT':
              this.onEvent?.(msg.message);
              break;
            case 'REJECTED':
              fail(msg.reason || 'The room rejected the join request.');
              break;
            case 'CLOSED':
              this.close(msg.reason || 'The host closed the room.');
              break;
            default:
              break;
          }
        });

        conn.on('close', () => this.close('Lost connection to the host.'));
        conn.on('error', () => this.close('Lost connection to the host.'));
      });

      peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') {
          fail(`Room ${this.code} was not found. Check the code — the host must keep the room open.`);
        } else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type)) {
          fail('Could not reach the matchmaking server. Check your internet connection.');
        } else if (err.type === 'browser-incompatible') {
          fail('This browser does not support WebRTC multiplayer.');
        } else if (!settled) {
          fail(err.message || 'Failed to join room.');
        }
      });
    });
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'PING' });
      if (Date.now() - this.lastHeard > PEER_TIMEOUT_MS) {
        this.close('Lost connection to the host.');
      }
    }, HEARTBEAT_MS);
  }

  send(msg) {
    if (this.conn?.open) this.conn.send(msg);
  }

  sendLive(data) {
    this.send({ type: 'LIVE', ...data });
  }

  submitResult(data) {
    this.send({ type: 'RESULT', ...data });
  }

  rename(username) {
    this.send({ type: 'RENAME', username });
  }

  // Host-only controls are no-ops for guests
  updateConfig() {}
  addBots() { return 0; }
  clearBots() {}
  startSession() {}
  restartRoom() {}
  endSessionNow() {}

  close(reason) {
    if (this.closed) return;
    this.closed = true;
    this.teardown();
    this.onClose?.(reason);
  }

  teardown() {
    clearInterval(this.heartbeatTimer);
    try { this.conn?.close(); } catch { /* ignore */ }
    try { this.peer?.destroy(); } catch { /* ignore */ }
  }

  destroy() {
    this.closed = true;
    this.teardown();
  }
}
