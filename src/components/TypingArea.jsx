import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Smartphone, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/sound';

export default function TypingArea({
  text = '',
  mode = 'words', // 'words' | 'time'
  timeLimit = null, // e.g. 120, 60, 30, 15
  isRace = false,
  raceStarted = true,
  onProgressUpdate,
  onFinish,
  onRestart,
  disabled = false,
}) {
  const words = React.useMemo(() => (text ? text.trim().split(/\s+/) : []), [text]);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedWords, setTypedWords] = useState([]);
  const [currentInputVal, setCurrentInputVal] = useState('');
  
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit || 120);

  const [wpm, setWpm] = useState(0);
  const [rawWpm, setRawWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const [isFocused, setIsFocused] = useState(true);
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 28 });
  const [containerOffset, setContainerOffset] = useState(0);

  // Keystroke statistics for accurate accuracy & WPM
  const totalKeystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);
  const mistakesRef = useRef(0);
  const timelineRef = useRef([]);

  const inputRef = useRef(null);
  const wordsContainerRef = useRef(null);
  const wordsWrapperRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Initialize state when text or timeLimit changes
  useEffect(() => {
    resetState();
  }, [text, timeLimit, mode]);

  const resetState = () => {
    setCurrentWordIndex(0);
    setCurrentInputVal('');
    setTypedWords(new Array(words.length).fill(''));
    setStartTime(null);
    setElapsedTime(0);
    setTimeLeft(timeLimit || (mode === 'time' ? 120 : 0));
    setWpm(0);
    setRawWpm(0);
    setAccuracy(100);
    setContainerOffset(0);

    totalKeystrokesRef.current = 0;
    correctKeystrokesRef.current = 0;
    mistakesRef.current = 0;
    timelineRef.current = [];

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  // Timer loop
  useEffect(() => {
    if (startTime && raceStarted) {
      timerIntervalRef.current = setInterval(() => {
        const seconds = (Date.now() - startTime) / 1000;
        setElapsedTime(seconds);

        // If time mode, handle countdown
        if (mode === 'time' && timeLimit) {
          const remaining = Math.max(0, Math.ceil(timeLimit - seconds));
          setTimeLeft(remaining);
          if (remaining <= 0) {
            finishTypingTest();
            return;
          }
        }

        // Live WPM calculation
        const mins = seconds / 60;
        const correctChars = correctKeystrokesRef.current;
        const totalChars = totalKeystrokesRef.current;

        const liveWpm = mins > 0 ? Math.round((correctChars / 5) / mins) : 0;
        const liveRawWpm = mins > 0 ? Math.round((totalChars / 5) / mins) : 0;
        
        const totalAttempts = correctKeystrokesRef.current + mistakesRef.current;
        const liveAcc = totalAttempts > 0
          ? Math.max(0, Math.min(100, Math.round((correctKeystrokesRef.current / totalAttempts) * 100)))
          : 100;

        setWpm(liveWpm);
        setRawWpm(liveRawWpm);
        setAccuracy(liveAcc);

        // Record timeline
        if (seconds >= timelineRef.current.length) {
          timelineRef.current.push({
            second: Math.round(seconds),
            wpm: liveWpm,
            rawWpm: liveRawWpm,
            errors: mistakesRef.current,
          });
        }

        // Emit race progress update
        if (isRace && onProgressUpdate) {
          const progressPercent = mode === 'time' && timeLimit
            ? Math.min(100, Math.round((seconds / timeLimit) * 100))
            : Math.min(100, Math.round((currentWordIndex / words.length) * 100));

          onProgressUpdate({
            progress: progressPercent,
            charProgress: correctChars,
            wpm: liveWpm,
            rawWpm: liveRawWpm,
            accuracy: liveAcc,
            errors: mistakesRef.current,
            isFinished: false,
          });
        }
      }, 500);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [startTime, raceStarted, mode, timeLimit, words.length, currentWordIndex, isRace, onProgressUpdate]);

  // Caret positioning & smooth rolling line scroll
  const updateCaretPosition = useCallback(() => {
    if (!wordsContainerRef.current) return;

    const wordEl = wordsContainerRef.current.querySelector(`[data-word-index="${currentWordIndex}"]`);
    if (!wordEl) return;

    const containerRect = wordsContainerRef.current.getBoundingClientRect();
    const charElements = wordEl.querySelectorAll('.char');
    const currentTyped = currentInputVal || '';

    let targetLeft = 0;
    let targetTop = 0;
    let targetHeight = 28;

    if (currentTyped.length === 0) {
      // Position caret at the beginning of the active word
      if (charElements.length > 0) {
        const firstCharRect = charElements[0].getBoundingClientRect();
        targetLeft = firstCharRect.left - containerRect.left;
        targetTop = firstCharRect.top - containerRect.top;
        targetHeight = firstCharRect.height || 28;
      } else {
        const wordRect = wordEl.getBoundingClientRect();
        targetLeft = wordRect.left - containerRect.left;
        targetTop = wordRect.top - containerRect.top;
        targetHeight = wordRect.height || 28;
      }
    } else {
      // Position caret immediately after the last typed character in the active word
      const charIdx = currentTyped.length - 1;
      if (charIdx < charElements.length) {
        const charRect = charElements[charIdx].getBoundingClientRect();
        targetLeft = charRect.right - containerRect.left;
        targetTop = charRect.top - containerRect.top;
        targetHeight = charRect.height || 28;
      } else {
        // Extra characters typed past target word length
        const lastChar = charElements[charElements.length - 1];
        if (lastChar) {
          const lastCharRect = lastChar.getBoundingClientRect();
          targetLeft = lastCharRect.right - containerRect.left;
          targetTop = lastCharRect.top - containerRect.top;
          targetHeight = lastCharRect.height || 28;
        } else {
          const wordRect = wordEl.getBoundingClientRect();
          targetLeft = wordRect.right - containerRect.left;
          targetTop = wordRect.top - containerRect.top;
          targetHeight = wordRect.height || 28;
        }
      }
    }

    setCaretPos({
      left: Math.round(targetLeft),
      top: Math.round(targetTop),
      height: Math.round(targetHeight),
    });

    // Dynamic 3-line rolling scroll: keep the active line on line 2 (middle)
    if (wordsWrapperRef.current && wordsContainerRef.current) {
      const firstWord = wordsContainerRef.current.querySelector('[data-word-index="0"]');
      const baseTop = firstWord ? firstWord.offsetTop : 0;
      const currentWordTop = wordEl.offsetTop;

      // Group words by distinct vertical line offsets
      const lineTops = [];
      const allWordEls = wordsContainerRef.current.querySelectorAll('.word');
      for (let i = 0; i <= currentWordIndex; i++) {
        const el = allWordEls[i];
        if (el) {
          const top = el.offsetTop;
          if (!lineTops.includes(top)) {
            lineTops.push(top);
          }
        }
      }

      const currentLineIdx = lineTops.indexOf(currentWordTop);
      if (currentLineIdx >= 2) {
        // Show line above as top line, active line as middle line
        const scrollTargetTop = lineTops[currentLineIdx - 1];
        setContainerOffset(scrollTargetTop - baseTop);
      } else {
        setContainerOffset(0);
      }
    }
  }, [currentWordIndex, currentInputVal]);

  useEffect(() => {
    updateCaretPosition();
    window.addEventListener('resize', updateCaretPosition);
    document.fonts?.ready?.then(updateCaretPosition);
    return () => {
      window.removeEventListener('resize', updateCaretPosition);
    };
  }, [updateCaretPosition]);

  // Handle Control Keys: Tab, Space, Backspace
  const handleKeyDown = (e) => {
    if (disabled || !raceStarted) return;

    // Tab: Instant restart
    if (e.key === 'Tab') {
      e.preventDefault();
      handleRestartClick();
      return;
    }

    // Space: Submit current word and advance
    if (e.key === ' ') {
      e.preventDefault();
      const currentVal = inputRef.current ? inputRef.current.value : currentInputVal;
      
      // Do nothing if current word is empty (prevent consecutive spaces)
      if (!currentVal || currentVal.length === 0) return;

      // Start timer on first word submission if not started
      if (!startTime) setStartTime(Date.now());

      soundEngine.playKeySound(true);

      // Check current word accuracy
      const targetWord = words[currentWordIndex] || '';
      totalKeystrokesRef.current += 1; // space counts as keystroke
      if (currentVal === targetWord) {
        correctKeystrokesRef.current += 1;
      } else {
        mistakesRef.current += 1;
      }

      // Record finished word in array
      const newTypedWords = [...typedWords];
      newTypedWords[currentWordIndex] = currentVal;
      setTypedWords(newTypedWords);

      // Clear input element and current input state
      if (inputRef.current) inputRef.current.value = '';
      setCurrentInputVal('');

      // Advance to next word
      const nextWordIndex = currentWordIndex + 1;
      if (nextWordIndex >= words.length) {
        finishTypingTest();
      } else {
        setCurrentWordIndex(nextWordIndex);
      }
      return;
    }

    // Backspace on empty input: Jump back to previous word
    if (e.key === 'Backspace') {
      const currentVal = inputRef.current ? inputRef.current.value : currentInputVal;
      if (currentVal.length === 0 && currentWordIndex > 0) {
        e.preventDefault();
        soundEngine.playKeySound(false);

        const prevIndex = currentWordIndex - 1;
        const prevWord = typedWords[prevIndex] || '';

        setCurrentWordIndex(prevIndex);
        setCurrentInputVal(prevWord);
        if (inputRef.current) {
          inputRef.current.value = prevWord;
        }
        return;
      }
    }
  };

  // Main input handler for both physical & virtual/mobile keyboards
  const handleInput = (e) => {
    if (disabled || !raceStarted) return;

    if (!startTime) {
      setStartTime(Date.now());
    }

    let val = e.target.value;

    // Handle space entered via soft keyboard / mobile autocomplete
    if (val.endsWith(' ') || val.includes(' ')) {
      soundEngine.playKeySound(true);
      const parts = val.split(' ');
      const completedWord = parts[0];

      if (completedWord.length > 0) {
        const targetWord = words[currentWordIndex] || '';
        totalKeystrokesRef.current += 1;
        if (completedWord === targetWord) {
          correctKeystrokesRef.current += 1;
        } else {
          mistakesRef.current += 1;
        }

        const newTypedWords = [...typedWords];
        newTypedWords[currentWordIndex] = completedWord;
        setTypedWords(newTypedWords);

        if (inputRef.current) inputRef.current.value = '';
        setCurrentInputVal('');

        const nextIndex = currentWordIndex + 1;
        if (nextIndex >= words.length) {
          finishTypingTest();
        } else {
          setCurrentWordIndex(nextIndex);
        }
      } else {
        if (inputRef.current) inputRef.current.value = '';
        setCurrentInputVal('');
      }
      return;
    }

    // Normal typing update
    soundEngine.playKeySound(false);

    // Track real-time accuracy on every single keystroke
    if (val.length > currentInputVal.length) {
      // User typed a new character
      const charIndex = val.length - 1;
      const targetWord = words[currentWordIndex] || '';
      const typedChar = val[charIndex];
      const expectedChar = targetWord[charIndex];

      totalKeystrokesRef.current += 1;
      if (typedChar === expectedChar) {
        correctKeystrokesRef.current += 1;
      } else {
        mistakesRef.current += 1;
      }
    }

    // Immediately recalculate live accuracy
    const totalAttempts = correctKeystrokesRef.current + mistakesRef.current;
    if (totalAttempts > 0) {
      const currentAcc = Math.max(0, Math.min(100, Math.round((correctKeystrokesRef.current / totalAttempts) * 100)));
      setAccuracy(currentAcc);
    }

    setCurrentInputVal(val);

    // If last word typed completely and matches
    if (currentWordIndex === words.length - 1 && val === words[currentWordIndex]) {
      finishTypingTest();
    }
  };

  const finishTypingTest = () => {
    soundEngine.playFinishSound();
    const finalSeconds = startTime ? Math.max(1, (Date.now() - startTime) / 1000) : 1;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const totalChars = totalKeystrokesRef.current;
    const correctChars = correctKeystrokesRef.current;
    const finalMins = finalSeconds / 60;

    const finalWpm = Math.round((correctChars / 5) / finalMins);
    const finalRawWpm = Math.round((totalChars / 5) / finalMins);
    const totalAttempts = correctChars + mistakesRef.current;
    const finalAcc = totalAttempts > 0 ? Math.round((correctChars / totalAttempts) * 100) : 100;

    const stats = {
      wpm: finalWpm,
      rawWpm: finalRawWpm,
      accuracy: finalAcc,
      errors: mistakesRef.current,
      time: Math.round(finalSeconds * 10) / 10,
      characters: {
        correct: correctChars,
        incorrect: mistakesRef.current,
        extra: 0,
        missed: 0,
      },
      timeline: timelineRef.current,
    };

    if (onFinish) {
      onFinish(stats);
    }
    if (isRace && onProgressUpdate) {
      onProgressUpdate({
        progress: 100,
        charProgress: totalChars,
        wpm: finalWpm,
        rawWpm: finalRawWpm,
        accuracy: finalAcc,
        errors: mistakesRef.current,
        isFinished: true,
      });
    }
  };

  const handleRestartClick = () => {
    resetState();
    if (onRestart) onRestart();
  };

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value ? inputRef.current.value.length : 0;
      try {
        inputRef.current.setSelectionRange(len, len);
      } catch (err) {}
      setIsFocused(true);
    }
  };

  // Format timer seconds into mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m > 0 ? `${m}:${s < 10 ? '0' : ''}${s}` : `${s}s`;
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
        disabled={disabled || !raceStarted}
      />

      {/* Live Metrics Bar */}
      <div className="live-metrics">
        {/* Timer / Words counter */}
        {mode === 'time' ? (
          <div className="metric-item" style={{ color: timeLeft <= 10 && startTime ? 'var(--error-color)' : 'var(--main-color)' }}>
            <Clock size={22} style={{ marginRight: 4 }} />
            <span>{formatTime(timeLeft)}</span>
            <span className="metric-label">left</span>
          </div>
        ) : (
          <div className="metric-item">
            <span>{currentWordIndex}/{words.length}</span>
            <span className="metric-label">words</span>
          </div>
        )}

        {/* Live WPM */}
        <div className="metric-item">
          <span>{wpm}</span>
          <span className="metric-label">wpm</span>
        </div>

        {/* Live Accuracy */}
        <div className="metric-item" style={{ color: accuracy < 90 ? 'var(--error-color)' : 'var(--main-color)' }}>
          <span>{accuracy}%</span>
          <span className="metric-label">acc</span>
        </div>
      </div>

      {/* 3-Line Monkeytype Rolling Words Display */}
      <div className="words-wrapper" ref={wordsWrapperRef}>
        <div
          className="words-container"
          ref={wordsContainerRef}
          style={{ transform: `translateY(-${containerOffset}px)` }}
        >
          {/* Smooth Caret */}
          {isFocused && (
            <div
              className={`smooth-caret ${!startTime ? 'blink' : ''}`}
              style={{
                left: `${caretPos.left}px`,
                top: `${caretPos.top}px`,
                height: `${caretPos.height}px`,
              }}
            />
          )}

          {/* Words */}
          {words.map((word, wordIdx) => {
            const isCurrent = wordIdx === currentWordIndex;
            const isPast = wordIdx < currentWordIndex;
            const typedWord = isCurrent ? currentInputVal : (typedWords[wordIdx] || '');
            const hasError = isPast && typedWord !== word;

            return (
              <div
                key={wordIdx}
                data-word-index={wordIdx}
                className={`word ${hasError ? 'error-word' : ''}`}
              >
                {/* Standard characters in target word */}
                {word.split('').map((char, charIdx) => {
                  let charClass = 'char';
                  if (isPast) {
                    charClass += typedWord[charIdx] === char ? ' correct' : ' incorrect';
                  } else if (isCurrent) {
                    if (charIdx < typedWord.length) {
                      charClass += typedWord[charIdx] === char ? ' correct' : ' incorrect';
                    }
                  }
                  return (
                    <span key={charIdx} className={charClass}>
                      {char}
                    </span>
                  );
                })}

                {/* Extra characters typed past word length */}
                {typedWord.length > word.length && (
                  typedWord.slice(word.length).split('').map((char, extraIdx) => (
                    <span key={`extra-${extraIdx}`} className="char extra">
                      {char}
                    </span>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Focus Hint / Tap to Type Alert */}
      {!isFocused && (
        <div className="click-to-focus-hint" onClick={focusInput}>
          <Smartphone size={16} />
          <span>Tap anywhere or click here to focus typing keyboard</span>
        </div>
      )}

      {/* Restart Button & Keyboard Shortcut */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
        <button
          className="btn-secondary"
          onClick={handleRestartClick}
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
