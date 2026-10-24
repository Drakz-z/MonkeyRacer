export const SOLO_COMMON_WORDS = [
  'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for', 'they', 'with', 'as', 'not',
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

export function getRandomWords(count = 25) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(SOLO_COMMON_WORDS[Math.floor(Math.random() * SOLO_COMMON_WORDS.length)]);
  }
  return result.join(' ');
}

export const CODE_WORDS = [
  'const', 'function', 'return', 'async', 'await', 'import', 'export', 'default', 'class', 'extends', 'super',
  'constructor', 'this', 'let', 'var', 'if', 'else', 'switch', 'case', 'break', 'try', 'catch', 'finally',
  'throw', 'new', 'typeof', 'void', 'delete', 'null', 'undefined', 'true', 'false', 'map',
  'filter', 'reduce', 'forEach', 'find', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice',
  'length', 'keys', 'values', 'entries', 'promise', 'resolve', 'reject', 'then', 'response', 'request',
  'socket', 'emit', 'listen', 'connect', 'status', 'payload', 'buffer', 'stream', 'pipe'
];

export const QUOTES = [
  'The quick brown fox jumps over the lazy dog and never looks back at the past.',
  'Simplicity is the soul of efficiency, especially when typing with pure momentum.',
  'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
  'To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.',
  'Speed is great, but accuracy is the foundation of genuine typing mastery and effortless velocity.',
  'Do not go where the path may lead, go instead where there is no path and leave a trail.'
];

// Generate test text for a vocabulary type ('standard' | 'code' | 'quote')
export function generateText(type = 'standard', count = 25) {
  if (type === 'quote') {
    // Chain shuffled quotes until there are enough words for the test
    const parts = [];
    let words = 0;
    while (words < count) {
      const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      parts.push(quote);
      words += quote.split(' ').length;
    }
    return parts.join(' ');
  }
  if (type === 'code') {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)]);
    }
    return result.join(' ');
  }
  return getRandomWords(count);
}

export function calculateWpm(correctChars, elapsedSeconds) {
  if (elapsedSeconds <= 0) return 0;
  const minutes = elapsedSeconds / 60;
  return Math.round((correctChars / 5) / minutes);
}

export function calculateRawWpm(totalTypedChars, elapsedSeconds) {
  if (elapsedSeconds <= 0) return 0;
  const minutes = elapsedSeconds / 60;
  return Math.round((totalTypedChars / 5) / minutes);
}

export function calculateAccuracy(correctChars, totalTypedChars) {
  if (totalTypedChars <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((correctChars / totalTypedChars) * 100)));
}

export const BOT_NAMES = [
  'SpeedyKong', 'CyberApe', 'ChimpDriver', 'NeonGibbon', 'DriftGorilla',
  'TurboBaboon', 'KeyMaster', 'TypeNinja', 'VelocityChimp', 'GlitchMonkey',
  'ApexRacer', 'QuantumApe', 'ThunderKeys', 'BananaRacer', 'SonicMandrill',
  'ViperTypist', 'RocketOrangutan', 'EchoChimp', 'PulsePrimate', 'ShiftSlammer',
  'MatrixMonkey', 'ZenRacer', 'BlazeGorilla', 'CosmicApe', 'HyperTypist',
  'PhantomChimp', 'SilverbackPro', 'PixelPrimate', 'ShadowRacer', 'LaserMonkey'
];

export const AVATAR_COLORS = [
  '#e2b714', '#f66e0d', '#bd93f9', '#ff007f', '#88c0d0', '#50fa7b',
  '#ffb86c', '#ff5555', '#4caf50', '#2196f3', '#9c27b0', '#00bcd4'
];

