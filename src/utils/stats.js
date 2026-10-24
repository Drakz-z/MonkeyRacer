// Monkeytype-style scoring.
//
// WPM      = (characters of correctly typed words + spaces after correct words) / 5 / minutes.
//            A word with any mistake earns nothing, so errors directly cost you speed.
//            The in-progress word counts only while everything typed so far is correct.
// Raw WPM  = every character typed (correct, incorrect, extra, spaces) / 5 / minutes.
// Accuracy = correct keypresses / all keypresses — mistakes you fix with backspace still count.
// Consistency = how steady your per-second raw speed was (100% = perfectly even).

export function computeCharStats(words, typedWords, currentIndex, currentInput) {
  let correctWordChars = 0;
  let correctSpaces = 0;
  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;
  let spaces = 0;

  const compare = (target, typed) => {
    let c = 0;
    let inc = 0;
    const len = Math.min(target.length, typed.length);
    for (let i = 0; i < len; i++) {
      if (typed[i] === target[i]) c += 1;
      else inc += 1;
    }
    return {
      c,
      inc,
      ex: Math.max(0, typed.length - target.length),
      miss: Math.max(0, target.length - typed.length),
    };
  };

  for (let i = 0; i < currentIndex && i < words.length; i++) {
    const target = words[i];
    const typed = typedWords[i] || '';
    spaces += 1;
    if (typed === target) {
      correctWordChars += target.length;
      correctSpaces += 1;
      correct += target.length;
    } else {
      const r = compare(target, typed);
      correct += r.c;
      incorrect += r.inc;
      extra += r.ex;
      missed += r.miss;
    }
  }

  if (currentIndex < words.length && currentInput) {
    const r = compare(words[currentIndex], currentInput);
    correct += r.c;
    incorrect += r.inc;
    extra += r.ex;
    if (r.inc === 0 && r.ex === 0) correctWordChars += currentInput.length;
  }

  return {
    correctWordChars,
    correctSpaces,
    correct,
    incorrect,
    extra,
    missed,
    spaces,
    allChars: correct + incorrect + extra + spaces,
  };
}

export function wpmFromChars(chars, seconds) {
  if (seconds <= 0) return 0;
  return Math.max(0, Math.round(((chars.correctWordChars + chars.correctSpaces) / 5) / (seconds / 60)));
}

export function rawFromChars(chars, seconds) {
  if (seconds <= 0) return 0;
  return Math.max(0, Math.round((chars.allChars / 5) / (seconds / 60)));
}

export function accuracyFromKeys(correctKeys, incorrectKeys) {
  const total = correctKeys + incorrectKeys;
  if (total === 0) return 100;
  return Math.max(0, Math.min(100, Math.round((correctKeys / total) * 100)));
}

// Monkeytype's "kogasa" mapping of the coefficient of variation to a 0–100 score
export function consistencyFromRaw(rawPerSecond) {
  const values = rawPerSecond.filter((v) => Number.isFinite(v));
  if (values.length < 2) return 100;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean <= 0) return 0;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  const cov = Math.sqrt(variance) / mean;
  return Math.max(0, Math.round(100 * (1 - Math.tanh(cov + cov ** 3 / 3 + cov ** 5 / 5))));
}
