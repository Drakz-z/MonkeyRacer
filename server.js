const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const qrcode = require('qrcode');
const os = require('os');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Helper to determine Local Network IP
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (!iface) continue;
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal && !alias.address.startsWith('127.')) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

const LAN_IP = getLocalIpAddress();
const PORT = process.env.PORT || 3001;

// Vocabulary list for generating authentic Monkeytype race texts
const COMMON_WORDS = [
  'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for', 'they', 'I', 'with', 'as', 'not',
  'on', 'she', 'at', 'by', 'this', 'we', 'you', 'do', 'but', 'from', 'or', 'which', 'one', 'would', 'all', 'will',
  'there', 'say', 'who', 'make', 'when', 'can', 'more', 'if', 'no', 'man', 'out', 'other', 'so', 'what', 'time',
  'up', 'go', 'about', 'than', 'into', 'could', 'state', 'only', 'new', 'year', 'some', 'take', 'come', 'these',
  'know', 'see', 'use', 'get', 'like', 'then', 'first', 'any', 'work', 'now', 'may', 'such', 'give', 'over', 'think',
  'most', 'even', 'find', 'day', 'also', 'after', 'way', 'many', 'must', 'look', 'before', 'great', 'back', 'through',
  'long', 'where', 'much', 'should', 'well', 'people', 'down', 'own', 'just', 'because', 'good', 'each', 'those',
  'feel', 'seem', 'how', 'high', 'too', 'place', 'little', 'world', 'very', 'still', 'nation', 'hand', 'old', 'life',
  'tell', 'write', 'become', 'here', 'show', 'house', 'both', 'between', 'need', 'mean', 'call', 'develop', 'under',
  'last', 'right', 'move', 'thing', 'general', 'school', 'never', 'same', 'another', 'begin', 'while', 'number',
  'part', 'turn', 'real', 'leave', 'might', 'want', 'point', 'form', 'off', 'child', 'few', 'small', 'since', 'against',
  'ask', 'late', 'home', 'interest', 'large', 'person', 'end', 'open', 'public', 'follow', 'during', 'present', 'without',
  'again', 'hold', 'govern', 'around', 'possible', 'head', 'consider', 'word', 'program', 'problem', 'however', 'lead',
  'system', 'set', 'order', 'eye', 'plan', 'run', 'keep', 'face', 'fact', 'group', 'play', 'stand', 'increase', 'early',
  'course', 'change', 'help', 'line', 'speed', 'racer', 'monkey', 'focus', 'flow', 'finger', 'keyboard', 'cloud', 'swift'
];

const CODE_WORDS = [
  'const', 'function', 'return', 'async', 'await', 'import', 'export', 'default', 'class', 'extends', 'super',
  'constructor', 'this', 'let', 'var', 'if', 'else', 'switch', 'case', 'break', 'try', 'catch', 'finally',
  'throw', 'new', 'typeof', 'instanceof', 'void', 'delete', 'null', 'undefined', 'true', 'false', 'map',
  'filter', 'reduce', 'forEach', 'find', 'includes', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice',
  'length', 'keys', 'values', 'entries', 'promise', 'resolve', 'reject', 'then', 'catch', 'response', 'request',
  'socket', 'emit', 'listen', 'connect', 'disconnect', 'status', 'payload', 'buffer', 'stream', 'pipe'
];

const QUOTES = [
  "The quick brown fox jumps over the lazy dog and never looks back at the past.",
  "Simplicity is the soul of efficiency, especially when typing with pure momentum.",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
  "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
  "Speed is great, but accuracy is the foundation of genuine typing mastery and effortless velocity.",
  "Do not go where the path may lead, go instead where there is no path and leave a trail."
];

function generateWords(mode = 'words', amount = 25, type = 'standard') {
  if (type === 'quote') {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    return randomQuote;
  }
  const source = type === 'code' ? CODE_WORDS : COMMON_WORDS;
  const count = mode === 'time' ? 350 : (parseInt(amount, 10) || 25);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(source[Math.floor(Math.random() * source.length)]);
  }
  return result.join(' ');
}

// Bot racer names pool
const BOT_NAMES = [
  'SpeedyKong', 'CyberApe', 'ChimpDriver', 'NeonGibbon', 'DriftGorilla',
  'TurboBaboon', 'KeyMaster', 'TypeNinja', 'VelocityChimp', 'GlitchMonkey',
  'ApexRacer', 'QuantumApe', 'ThunderKeys', 'BananaRacer', 'SonicMandrill',
  'ViperTypist', 'RocketOrangutan', 'EchoChimp', 'PulsePrimate', 'ShiftSlammer',
  'MatrixMonkey', 'ZenRacer', 'BlazeGorilla', 'CosmicApe', 'HyperTypist',
  'PhantomChimp', 'SilverbackPro', 'PixelPrimate', 'ShadowRacer', 'LaserMonkey'
];

const AVATAR_COLORS = [
  '#e2b714', '#00ffc2', '#ff5252', '#bd93f9', '#4fc3f7',
  '#f39c12', '#a8ff78', '#ff79c6', '#50fa7b', '#ffb86c'
];

// Room state store
// rooms[roomId] = { ... }
const rooms = new Map();

function createRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RACE-${code}`;
}

// API Routes
app.get('/api/info', (req, res) => {
  res.json({
    lanIp: LAN_IP,
    port: PORT,
    activeRooms: rooms.size,
  });
});

app.get('/api/qr', async (req, res) => {
  const { text } = req.query;
  if (!text) return res.status(400).send('Missing text parameter');
  try {
    const qrDataUrl = await qrcode.toDataURL(text, {
      margin: 2,
      width: 280,
      color: {
        dark: '#e2b714',
        light: '#1e2022',
      },
    });
    res.json({ qr: qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR' });
  }
});

// Socket.IO Logic
io.on('connection', (socket) => {
  let currentRoomId = null;

  socket.on('CREATE_ROOM', ({ username, config, customRoomId }) => {
    const roomId = (customRoomId && customRoomId.trim()) ? customRoomId.trim().toUpperCase() : createRoomId();
    
    // Default room configuration
    const roomConfig = {
      mode: config?.mode || 'words',
      amount: config?.amount || 25,
      type: config?.type || 'standard',
    };

    const text = generateWords(roomConfig.mode, roomConfig.amount, roomConfig.type);

    const room = {
      id: roomId,
      hostId: socket.id,
      config: roomConfig,
      text: text,
      words: text.split(' '),
      status: 'lobby', // 'lobby' | 'countdown' | 'racing' | 'finished'
      countdown: 5,
      startTime: null,
      raceDuration: roomConfig.mode === 'time' ? parseInt(roomConfig.amount, 10) : 60,
      participants: new Map(),
      rankCounter: 1,
      botInterval: null,
      tickInterval: null,
    };

    rooms.set(roomId, room);
    joinRoom(socket, roomId, username, true);
  });

  socket.on('JOIN_ROOM', ({ roomId, username }) => {
    const formattedId = roomId ? roomId.trim().toUpperCase() : '';
    if (!rooms.has(formattedId)) {
      socket.emit('ERROR', { message: 'Room not found. Check code or create a new room.' });
      return;
    }
    const room = rooms.get(formattedId);
    if (room.participants.size >= 200) {
      socket.emit('ERROR', { message: 'Room is full! Maximum capacity is 200 racers.' });
      return;
    }
    joinRoom(socket, formattedId, username, false);
  });

  function joinRoom(sock, roomId, username, isHost = false) {
    currentRoomId = roomId;
    sock.join(roomId);

    const room = rooms.get(roomId);
    const assignedName = (username && username.trim()) ? username.trim().slice(0, 18) : `Racer_${Math.floor(100 + Math.random() * 900)}`;
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const participant = {
      id: sock.id,
      username: assignedName,
      color: avatarColor,
      isHost: isHost || room.hostId === sock.id,
      isBot: false,
      progress: 0,
      charProgress: 0,
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      errors: 0,
      isFinished: false,
      finishTime: null,
      rank: null,
      device: sock.handshake.headers['user-agent']?.match(/Mobile|Android|iPhone/i) ? 'mobile' : 'desktop',
    };

    room.participants.set(sock.id, participant);

    // If host reconnected or was transferred
    if (isHost) room.hostId = sock.id;

    sock.emit('ROOM_JOINED', {
      roomId,
      isHost: participant.isHost,
      config: room.config,
      text: room.text,
      status: room.status,
      participants: serializeParticipants(room),
      selfId: sock.id,
      lanIp: LAN_IP,
      port: PORT,
    });

    // Notify room of new participant
    sock.to(roomId).emit('PARTICIPANT_JOINED', participant);
  }

  socket.on('ADD_BOTS', ({ count }) => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const room = rooms.get(currentRoomId);
    if (room.hostId !== socket.id) return; // Only host can add bots

    const currentCount = room.participants.size;
    const toAdd = Math.min(count, 200 - currentCount);
    if (toAdd <= 0) return;

    for (let i = 0; i < toAdd; i++) {
      const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const baseName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const botName = `${baseName}_${Math.floor(10 + Math.random() * 89)}`;
      
      // Target WPM realistic distribution (35 WPM to 135 WPM)
      const targetWpm = Math.floor(40 + Math.random() * 85);

      const bot = {
        id: botId,
        username: botName,
        color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        isHost: false,
        isBot: true,
        targetWpm: targetWpm,
        progress: 0,
        charProgress: 0,
        wpm: 0,
        rawWpm: 0,
        accuracy: Math.floor(94 + Math.random() * 6),
        errors: 0,
        isFinished: false,
        finishTime: null,
        rank: null,
        device: Math.random() > 0.5 ? 'mobile' : 'desktop',
      };
      room.participants.set(botId, bot);
    }

    io.to(currentRoomId).emit('PARTICIPANTS_UPDATED', {
      participants: serializeParticipants(room),
    });
  });

  socket.on('CLEAR_BOTS', () => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const room = rooms.get(currentRoomId);
    if (room.hostId !== socket.id) return;

    for (const [id, p] of room.participants.entries()) {
      if (p.isBot) {
        room.participants.delete(id);
      }
    }

    io.to(currentRoomId).emit('PARTICIPANTS_UPDATED', {
      participants: serializeParticipants(room),
    });
  });

  socket.on('UPDATE_CONFIG', (newConfig) => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const room = rooms.get(currentRoomId);
    if (room.hostId !== socket.id) return;
    if (room.status !== 'lobby') return;

    room.config = { ...room.config, ...newConfig };
    room.text = generateWords(room.config.mode, room.config.amount, room.config.type);
    room.words = room.text.split(' ');
    room.raceDuration = room.config.mode === 'time' ? parseInt(room.config.amount, 10) : 60;

    // Reset participant race stats
    resetRaceStats(room);

    io.to(currentRoomId).emit('CONFIG_UPDATED', {
      config: room.config,
      text: room.text,
      participants: serializeParticipants(room),
    });
  });

  socket.on('START_RACE', () => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const room = rooms.get(currentRoomId);
    if (room.hostId !== socket.id) return;
    if (room.status !== 'lobby' && room.status !== 'finished') return;

    room.status = 'countdown';
    room.countdown = 5;
    room.rankCounter = 1;
    resetRaceStats(room);

    io.to(currentRoomId).emit('COUNTDOWN_STARTED', {
      countdown: room.countdown,
      text: room.text,
      participants: serializeParticipants(room),
    });

    const countdownTimer = setInterval(() => {
      room.countdown -= 1;
      if (room.countdown > 0) {
        io.to(currentRoomId).emit('COUNTDOWN_TICK', { countdown: room.countdown });
      } else {
        clearInterval(countdownTimer);
        startRaceExecution(room);
      }
    }, 1000);
  });

  function startRaceExecution(room) {
    room.status = 'racing';
    room.startTime = Date.now();
    io.to(room.id).emit('RACE_STARTED', { startTime: room.startTime });

    // Start 100ms broadcasting loop for buttery 60fps client interpolation
    if (room.tickInterval) clearInterval(room.tickInterval);
    room.tickInterval = setInterval(() => {
      const elapsedSec = (Date.now() - room.startTime) / 1000;
      
      // Update bots
      updateBotsSimulation(room, elapsedSec);

      // Check if time-based race is over
      if (room.config.mode === 'time' && elapsedSec >= room.raceDuration) {
        finishRace(room);
        return;
      }

      // Check if all active participants have finished
      const allDone = Array.from(room.participants.values()).every(p => p.isFinished);
      if (allDone && room.participants.size > 0) {
        finishRace(room);
        return;
      }

      // Broadcast throttled snapshot
      io.to(room.id).emit('RACE_TICK', {
        elapsed: Math.round(elapsedSec * 10) / 10,
        participants: serializeParticipants(room),
      });
    }, 100);
  }

  function updateBotsSimulation(room, elapsedSec) {
    const totalChars = room.text.length;
    for (const p of room.participants.values()) {
      if (!p.isBot || p.isFinished) continue;

      // Realistic typing curve: slight start hesitation, natural typing speed, micro variation
      const cps = (p.targetWpm * 5) / 60; // chars per second
      // add natural random variation +/- 10%
      const jitter = (Math.sin(elapsedSec * 2 + p.targetWpm) * 0.15) + 1;
      const effectiveChars = Math.min(totalChars, Math.floor(elapsedSec * cps * jitter));

      p.charProgress = effectiveChars;
      p.progress = Math.min(100, Math.round((effectiveChars / totalChars) * 100));
      
      if (elapsedSec > 0.5) {
        p.wpm = Math.round((effectiveChars / 5) / (elapsedSec / 60));
        p.rawWpm = Math.round(p.wpm * 1.05);
      }

      if (effectiveChars >= totalChars && !p.isFinished) {
        p.isFinished = true;
        p.finishTime = Date.now();
        p.rank = room.rankCounter++;
        p.progress = 100;
        io.to(room.id).emit('RACER_FINISHED', {
          id: p.id,
          rank: p.rank,
          wpm: p.wpm,
          username: p.username,
        });
      }
    }
  }

  function finishRace(room) {
    if (room.tickInterval) {
      clearInterval(room.tickInterval);
      room.tickInterval = null;
    }
    room.status = 'finished';

    // Assign rank to any unfinished racers based on progress
    const sorted = Array.from(room.participants.values())
      .sort((a, b) => {
        if (a.isFinished && !b.isFinished) return -1;
        if (!a.isFinished && b.isFinished) return 1;
        if (a.isFinished && b.isFinished) return (a.finishTime || 0) - (b.finishTime || 0);
        return b.progress - a.progress;
      });

    sorted.forEach((p, idx) => {
      if (!p.rank) p.rank = idx + 1;
    });

    io.to(room.id).emit('RACE_FINISHED', {
      participants: serializeParticipants(room),
    });
  }

  socket.on('RACER_UPDATE', ({ progress, charProgress, wpm, rawWpm, accuracy, errors, isFinished }) => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const room = rooms.get(currentRoomId);
    if (room.status !== 'racing') return;

    const participant = room.participants.get(socket.id);
    if (!participant) return;

    participant.progress = Math.min(100, Math.max(0, progress));
    participant.charProgress = charProgress || 0;
    participant.wpm = Math.max(0, Math.round(wpm || 0));
    participant.rawWpm = Math.max(0, Math.round(rawWpm || 0));
    participant.accuracy = accuracy !== undefined ? Math.round(accuracy) : 100;
    participant.errors = errors || 0;

    if (isFinished && !participant.isFinished) {
      participant.isFinished = true;
      participant.finishTime = Date.now();
      participant.rank = room.rankCounter++;
      participant.progress = 100;

      io.to(currentRoomId).emit('RACER_FINISHED', {
        id: socket.id,
        rank: participant.rank,
        wpm: participant.wpm,
        username: participant.username,
      });

      // Check if all racers finished
      const allDone = Array.from(room.participants.values()).every(p => p.isFinished);
      if (allDone) {
        finishRace(room);
      }
    }
  });

  socket.on('RESET_ROOM', () => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const room = rooms.get(currentRoomId);
    if (room.hostId !== socket.id) return;

    if (room.tickInterval) clearInterval(room.tickInterval);
    room.status = 'lobby';
    room.rankCounter = 1;
    room.text = generateWords(room.config.mode, room.config.amount, room.config.type);
    room.words = room.text.split(' ');
    resetRaceStats(room);

    io.to(currentRoomId).emit('ROOM_RESET', {
      text: room.text,
      participants: serializeParticipants(room),
    });
  });

  socket.on('disconnect', () => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const room = rooms.get(currentRoomId);
    
    room.participants.delete(socket.id);

    // If host left, assign new host or delete empty room
    if (room.hostId === socket.id) {
      const remaining = Array.from(room.participants.values()).filter(p => !p.isBot);
      if (remaining.length > 0) {
        room.hostId = remaining[0].id;
        remaining[0].isHost = true;
        io.to(room.id).emit('HOST_CHANGED', { newHostId: room.hostId });
      } else {
        // Clear all timers and delete room if no human players remain
        if (room.tickInterval) clearInterval(room.tickInterval);
        rooms.delete(currentRoomId);
        return;
      }
    }

    io.to(currentRoomId).emit('PARTICIPANT_LEFT', {
      id: socket.id,
      participants: serializeParticipants(room),
    });
  });
});

function resetRaceStats(room) {
  for (const p of room.participants.values()) {
    p.progress = 0;
    p.charProgress = 0;
    p.wpm = 0;
    p.rawWpm = 0;
    p.accuracy = 100;
    p.errors = 0;
    p.isFinished = false;
    p.finishTime = null;
    p.rank = null;
  }
}

function serializeParticipants(room) {
  return Array.from(room.participants.values()).map(p => ({
    id: p.id,
    username: p.username,
    color: p.color,
    isHost: p.isHost,
    isBot: p.isBot,
    progress: p.progress,
    charProgress: p.charProgress,
    wpm: p.wpm,
    rawWpm: p.rawWpm,
    accuracy: p.accuracy,
    errors: p.errors,
    isFinished: p.isFinished,
    finishTime: p.finishTime,
    rank: p.rank,
    device: p.device,
  }));
}

// Serve production client build if exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use('/MonkeyRacer', express.static(distPath));
  app.use(express.static(distPath));
  app.get('/MonkeyRacer*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MonkeyRacer Server running at http://localhost:${PORT}`);
  console.log(`📱 LAN Network IP: http://${LAN_IP}:${PORT}`);
  console.log(`🏁 Ready for up to 200 live racers!`);
});
