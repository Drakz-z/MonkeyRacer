import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, memo } from 'react';
import { RotateCcw, Smartphone, Clock } from 'lucide-react';
import { soundEngine } from '../utils/sound';
import {
  computeCharStats,
  wpmFromChars,
  rawFromChars,
  accuracyFromKeys,
  consistencyFromRaw,
} from '../utils/stats';

const TICK_MS = 100;
const PROGRESS_EMIT_MS = 500;

// Memoized so a keystroke only re-renders the active word, not the whole word list
const Word = memo(function Word({ word, typed, status, index }) {
  const isPast = status === 'past';
  const isCurrent = status === 'current';
  const hasError = isPast && typed !== word;

  return (
    <div data-word-index={index} className={`word ${hasError ? 'error-word' : ''}`}>
      {word.split('').map((char, i) => {
        let cls = 'char';
        if ((isPast || isCurrent) && i < typed.length) {
          cls += typed[i] === char ? ' correct' : ' incorrect';
        }
        return (
          <span key={i} className={cls}>
            {char}
          </span>
        );
      })}
      {typed.length > word.length &&
        typed.slice(word.length).split('').map((char, i) => (
          <span key={`x${i}`} className="char extra">
            {char}
          </span>
        ))}
    </div>
  );
});

export default function TypingArea({
  text = '',
  mode = 'words', // 'words' | 'time'
  timeLimit = null,
  isRace = false,
  raceStarted = true,
  onProgressUpdate,
  onFinish,
  onRestart,
  onStart,
  disabled = false,
}) {
  const words = React.useMemo(() => (text ? text.trim().split(/\s+/) : []), [text]);
  const inputDisabled = disabled || !raceStarted;

  // Render state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedWords, setTypedWords] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAcc, setLiveAcc] = useState(100);
  const [isFocused, setIsFocused] = useState(true);
  const [caret, setCaret] = useState({ x: 0, y: 0, h: 28 });
  const [containerOffset, setContainerOffset] = useState(0);

  // Source of truth for the typing engine (refs never go stale between fast keystrokes)
  const engine = useRef(null);
  const resetEngine = () => {
    engine.current = {
      index: 0,
      typed: [],
      input: '',
      startAt: null,
      correctKeys: 0,
      incorrectKeys: 0,
      secondKeys: 0,
      secondErrors: 0,
      nextSecond: 1,
      timeline: [],
      lastEmit: 0,
      finished: false,
    };
  };
  if (engine.current === null) resetEngine();

  // Latest props for the clock callback
  const propsRef = useRef({});
  propsRef.current = { words, mode, timeLimit, isRace, onProgressUpdate, onFinish, onStart };

  const inputRef = useRef(null);
  const wordsContainerRef = useRef(null);
  const clockRef = useRef(null);

  const stopClock = () => {
    if (clockRef.current) clearInterval(clockRef.current);
    clockRef.current = null;
  };

  const resetState = useCallback(() => {
    stopClock();
    resetEngine();
    setCurrentWordIndex(0);
    setTypedWords([]);
    setCurrentInput('');
    setStarted(false);
    setElapsed(0);
    setLiveWpm(0);
    setLiveAcc(100);
    setContainerOffset(0);
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    resetState();
  }, [text, timeLimit, mode, resetState]);

  useEffect(() => stopClock, []);

  // Focus as soon as typing becomes possible (e.g. when a race countdown ends)
  useEffect(() => {
    if (!inputDisabled) inputRef.current?.focus();
  }, [inputDisabled]);

  // Any printable key refocuses the test, like Monkeytype
  useEffect(() => {
    const onKey = (e) => {
      if (inputDisabled || document.activeElement === inputRef.current) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inputDisabled]);

  /* ---------------- stats ---------------- */

  const elapsedSeconds = () => {
    const e = engine.current;
    return e.startAt ? (performance.now() - e.startAt) / 1000 : 0;
  };

  const currentChars = () => {
    const e = engine.current;
    return computeCharStats(propsRef.current.words, e.typed, e.index, e.input);
  };

  const pushSecond = (second, fraction = 1) => {
    const e = engine.current;
    const chars = currentChars();
    e.timeline.push({
      second,
      wpm: wpmFromChars(chars, second),
      rawWpm: Math.round((e.secondKeys / 5) * 60 / fraction),
      errors: e.secondErrors,
    });
    e.secondKeys = 0;
    e.secondErrors = 0;
  };

  const finishTest = () => {
    const e = engine.current;
    if (e.finished || !e.startAt) return;
    e.finished = true;
    stopClock();
    soundEngine.playFinishSound();

    const { mode: m, timeLimit: limit, isRace: race, onFinish: finishCb, onProgressUpdate: progressCb } = propsRef.current;
    const measured = Math.max(0.5, elapsedSeconds());
    // A timed test that ran out the clock lasted exactly its limit
    const seconds = m === 'time' && limit && measured >= limit - 0.2 ? limit : measured;

    // Close out the per-second timeline (scale a trailing partial second)
    while (e.nextSecond <= Math.floor(seconds)) {
      pushSecond(e.nextSecond);
      e.nextSecond += 1;
    }
    const partial = seconds - Math.floor(seconds);
    if (partial >= 0.25 && e.secondKeys > 0) pushSecond(Math.round(seconds * 10) / 10, partial);

    const chars = currentChars();
    const wpm = wpmFromChars(chars, seconds);
    const rawWpm = rawFromChars(chars, seconds);
    const accuracy = accuracyFromKeys(e.correctKeys, e.incorrectKeys);
    const consistency = consistencyFromRaw(e.timeline.map((t) => t.rawWpm));

    const stats = {
      wpm,
      rawWpm,
      accuracy,
      consistency,
      errors: e.incorrectKeys,
      time: Math.round(seconds * 10) / 10,
      characters: {
        correct: chars.correct,
        incorrect: chars.incorrect,
        extra: chars.extra,
        missed: chars.missed,
      },
      timeline: e.timeline,
    };

    setLiveWpm(wpm);
    setLiveAcc(accuracy);
    finishCb?.(stats);
    if (race && progressCb) {
      progressCb({ progress: 100, charProgress: chars.correct, wpm, rawWpm, accuracy, errors: e.incorrectKeys, isFinished: true });
    }
  };

  const tick = () => {
    const e = engine.current;
    if (!e.startAt || e.finished) return;
    const secs = elapsedSeconds();
    const { mode: m, timeLimit: limit, words: w, isRace: race, onProgressUpdate: progressCb } = propsRef.current;

    while (secs >= e.nextSecond && !(m === 'time' && limit && e.nextSecond > limit)) {
      pushSecond(e.nextSecond);
      e.nextSecond += 1;
    }

    if (m === 'time' && limit && secs >= limit) {
      finishTest();
      return;
    }

    const chars = currentChars();
    const wpm = wpmFromChars(chars, secs);
    const acc = accuracyFromKeys(e.correctKeys, e.incorrectKeys);
    setElapsed(secs);
    setLiveWpm(wpm);
    setLiveAcc(acc);

    const now = performance.now();
    if (race && progressCb && now - e.lastEmit >= PROGRESS_EMIT_MS) {
      e.lastEmit = now;
      const progress = m === 'time' && limit
        ? Math.min(100, Math.round((secs / limit) * 100))
        : Math.min(100, Math.round((e.index / w.length) * 100));
      progressCb({
        progress,
        charProgress: chars.correct,
        wpm,
        rawWpm: rawFromChars(chars, secs),
        accuracy: acc,
        errors: e.incorrectKeys,
        isFinished: false,
      });
    }
  };

  const startClock = () => {
    const e = engine.current;
    if (e.startAt) return;
    e.startAt = performance.now();
    setStarted(true);
    stopClock();
    clockRef.current = setInterval(tick, TICK_MS);
    propsRef.current.onStart?.();
  };

  /* ---------------- input handling ---------------- */

  const syncRender = () => {
    const e = engine.current;
    setCurrentWordIndex(e.index);
    setTypedWords(e.typed.slice());
    setCurrentInput(e.input);
  };

  const recordKey = (isCorrect) => {
    const e = engine.current;
    if (isCorrect) e.correctKeys += 1;
    else {
      e.incorrectKeys += 1;
      e.secondErrors += 1;
    }
    e.secondKeys += 1;
  };

  const submitWord = () => {
    const e = engine.current;
    if (!e.input) return; // Ignore space on an empty word
    const target = words[e.index] || '';
    recordKey(e.input === target);
    soundEngine.playKeySound(true);

    e.typed[e.index] = e.input;
    e.input = '';
    if (inputRef.current) inputRef.current.value = '';

    if (e.index + 1 >= words.length) {
      e.index += 1;
      syncRender();
      finishTest();
      return;
    }
    e.index += 1;
    syncRender();
  };

  const handleKeyDown = (ev) => {
    if (inputDisabled || engine.current.finished) return;

    if (ev.key === 'Tab') {
      ev.preventDefault();
      handleRestartClick();
      return;
    }

    if (ev.key === ' ') {
      ev.preventDefault();
      submitWord();
      return;
    }

    // Backspace on an empty word goes back — only into a word that was typed wrong (Monkeytype rule)
    if (ev.key === 'Backspace') {
      const e = engine.current;
      if (e.input.length === 0 && e.index > 0) {
        ev.preventDefault();
        const prev = e.typed[e.index - 1] || '';
        if (prev === words[e.index - 1]) return;
        e.index -= 1;
        e.input = ev.ctrlKey || ev.altKey || ev.metaKey ? '' : prev;
        e.typed.length = e.index;
        if (inputRef.current) inputRef.current.value = e.input;
        soundEngine.playKeySound(false);
        syncRender();
      }
    }
  };

  const handleInput = (ev) => {
    if (inputDisabled || engine.current.finished) return;
    const e = engine.current;
    let val = ev.target.value;

    // Soft keyboards / autocomplete can insert spaces — split them into word submissions
    if (val.includes(' ')) {
      const [first] = val.split(' ');
      if (first.length > e.input.length) {
        if (!e.startAt) startClock();
        const target = words[e.index] || '';
        for (let i = e.input.length; i < first.length; i++) recordKey(first[i] === target[i]);
      }
      e.input = first;
      submitWord();
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (!e.startAt && val.length > 0) startClock();

    const target = words[e.index] || '';
    if (val.length > e.input.length) {
      for (let i = e.input.length; i < val.length; i++) recordKey(val[i] === target[i]);
    }
    soundEngine.playKeySound(false);

    e.input = val;
    setCurrentInput(val);

    // Finishing the last word exactly ends a words test without needing a space
    if (e.index === words.length - 1 && val === target) {
      finishTest();
    }
  };

  const handleRestartClick = () => {
    resetState();
    onRestart?.();
  };

  const focusInput = () => {
    if (!inputRef.current) return;
    inputRef.current.focus();
    const len = inputRef.current.value.length;
    try {
      inputRef.current.setSelectionRange(len, len);
    } catch {
      // Some mobile inputs don't support selection ranges
    }
    setIsFocused(true);
  };

  /* ---------------- caret & line scrolling ---------------- */

  const updateCaret = useCallback(() => {
    const container = wordsContainerRef.current;
    if (!container) return;
    const wordEl = container.querySelector(`[data-word-index="${currentWordIndex}"]`);
    if (!wordEl) return;

    const containerRect = container.getBoundingClientRect();
    const chars = wordEl.querySelectorAll('.char');
    let rect;
    let atEnd = false;
    if (currentInput.length === 0) {
      rect = (chars[0] || wordEl).getBoundingClientRect();
    } else {
      const idx = Math.min(currentInput.length, chars.length) - 1;
      rect = (chars[idx] || wordEl).getBoundingClientRect();
      atEnd = true;
    }
    setCaret({
      x: Math.round((atEnd ? rect.right : rect.left) - containerRect.left),
      y: Math.round(rect.top - containerRect.top),
      h: Math.round(rect.height) || 28,
    });
  }, [currentWordIndex, currentInput]);

  // Keep the active line as the 2nd visible line (3-line Monkeytype window)
  const updateScroll = useCallback(() => {
    const container = wordsContainerRef.current;
    if (!container) return;
    const wordEl = container.querySelector(`[data-word-index="${currentWordIndex}"]`);
    if (!wordEl) return;
    const lineTops = [];
    const all = container.children;
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (!el.classList.contains('word')) continue;
      const top = el.offsetTop;
      if (lineTops[lineTops.length - 1] !== top) lineTops.push(top);
      if (el === wordEl) break;
    }
    const lineIdx = lineTops.length - 1;
    setContainerOffset(lineIdx >= 2 ? lineTops[lineIdx - 1] - lineTops[0] : 0);
  }, [currentWordIndex]);

  useLayoutEffect(() => {
    updateCaret();
  }, [updateCaret, words]);

  useLayoutEffect(() => {
    updateScroll();
  }, [updateScroll, words]);

  useEffect(() => {
    const onResize = () => {
      updateScroll();
      updateCaret();
    };
    window.addEventListener('resize', onResize);
    document.fonts?.ready?.then(onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateCaret, updateScroll]);

  /* ---------------- render ---------------- */

  const timeLeft = mode === 'time' && timeLimit ? Math.max(0, Math.ceil(timeLimit - elapsed)) : 0;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m > 0 ? `${m}:${s < 10 ? '0' : ''}${s}` : `${s}`;
  };

  return (
    <div className="test-container" onClick={focusInput}>
      {/* Hidden input - handles all physical and mobile soft keyboard keystrokes */}
      <input
        ref={inputRef}
        type="text"
        className="hidden-typing-input"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        inputMode="text"
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={inputDisabled}
      />

      {/* Live Metrics Bar */}
      <div className={`live-metrics ${started ? 'active' : ''}`}>
        {mode === 'time' ? (
          <div className="metric-item" style={{ color: timeLeft <= 5 && started ? 'var(--error-color)' : 'var(--main-color)' }}>
            <Clock size={22} style={{ marginRight: 4, alignSelf: 'center' }} />
            <span>{formatTime(started ? timeLeft : (timeLimit || 0))}</span>
          </div>
        ) : (
          <div className="metric-item">
            <span>{currentWordIndex}/{words.length}</span>
          </div>
        )}

        <div className="metric-item">
          <span>{liveWpm}</span>
          <span className="metric-label">wpm</span>
        </div>

        <div className="metric-item" style={{ color: liveAcc < 90 ? 'var(--error-color)' : 'var(--main-color)' }}>
          <span>{liveAcc}%</span>
          <span className="metric-label">acc</span>
        </div>
      </div>

      {/* 3-Line Monkeytype Rolling Words Display */}
      <div className={`words-wrapper ${isFocused || inputDisabled ? '' : 'blurred'}`}>
        <div
          className="words-container"
          ref={wordsContainerRef}
          style={{ transform: `translate3d(0, -${containerOffset}px, 0)` }}
        >
          {isFocused && !inputDisabled && (
            <div
              className={`smooth-caret ${!started ? 'blink' : ''}`}
              style={{
                transform: `translate3d(${caret.x}px, ${caret.y}px, 0)`,
                height: `${caret.h}px`,
              }}
            />
          )}

          {words.map((word, i) => (
            <Word
              key={i}
              index={i}
              word={word}
              status={i < currentWordIndex ? 'past' : i === currentWordIndex ? 'current' : 'future'}
              typed={i < currentWordIndex ? (typedWords[i] || '') : i === currentWordIndex ? currentInput : ''}
            />
          ))}
        </div>

        {!isFocused && !inputDisabled && (
          <div className="focus-overlay" onClick={focusInput}>
            Click here or press any key to focus
          </div>
        )}
      </div>

      {!isFocused && !inputDisabled && (
        <div className="click-to-focus-hint" onClick={focusInput}>
          <Smartphone size={16} />
          <span>Tap to type</span>
        </div>
      )}

      {/* Restart Button & Keyboard Shortcut */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
        <button
          className="btn-secondary"
          onClick={(ev) => {
            ev.stopPropagation();
            handleRestartClick();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.6rem 1.4rem',
            borderRadius: '999px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            border: '1px solid var(--card-border)',
            background: 'var(--sub-alt-color)',
            color: 'var(--text-color)',
            transition: 'all 0.2s ease',
          }}
          title="Restart Test (or press Tab)"
        >
          <RotateCcw size={16} color="var(--main-color)" />
          <span>Restart Test</span>
        </button>

        <span style={{ fontSize: '0.75rem', color: 'var(--sub-color)' }}>
          press <kbd style={{ background: 'var(--sub-alt-color)', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--card-border)', color: 'var(--text-color)' }}>Tab</kbd> to quickly restart
        </span>
      </div>
    </div>
  );
}
