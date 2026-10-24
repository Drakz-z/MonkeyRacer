import React, { useState, useEffect } from 'react';
import TypingArea from './TypingArea';
import ResultsPodium from './ResultsPodium';
import { getRandomWords } from '../utils/words';
import { loadSettings, saveSettings } from '../utils/cookies';
import { Clock, FileText } from 'lucide-react';

export default function SoloMode() {
  const [config, setConfig] = useState(() => {
    const saved = loadSettings();
    return { mode: saved.soloMode, amount: saved.soloAmount }; // 'words' | 'time'
  });

  const [text, setText] = useState('');
  const [testState, setTestState] = useState('typing'); // 'typing' | 'finished'
  const [stats, setStats] = useState(null);

  // Generate words on config change or restart
  useEffect(() => {
    generateNewTest();
    saveSettings({ soloMode: config.mode, soloAmount: config.amount });
  }, [config]);

  const generateNewTest = () => {
    // For time mode, generate enough words (350 words) so 2 minutes never runs out
    const wordCount = config.mode === 'words' ? config.amount : 350;
    const words = getRandomWords(wordCount);
    setText(words);
    setTestState('typing');
    setStats(null);
  };

  const handleFinish = (finalStats) => {
    setStats(finalStats);
    setTestState('finished');
  };

  return (
    <div style={{ width: '100%', maxWidth: '1050px', margin: '0 auto' }}>
      {/* Top Test Config Bar (Monkeytype style) */}
      {testState === 'typing' && (
        <div className="config-bar-wrapper">
          <div className="config-bar">
            {/* Mode selection */}
            <div className="config-group">
              <button
                className={`config-btn ${config.mode === 'time' ? 'active' : ''}`}
                onClick={() => setConfig({ mode: 'time', amount: 120 })}
              >
                <Clock size={14} />
                <span>time</span>
              </button>
              <button
                className={`config-btn ${config.mode === 'words' ? 'active' : ''}`}
                onClick={() => setConfig({ mode: 'words', amount: 25 })}
              >
                <FileText size={14} />
                <span>words</span>
              </button>
            </div>

            <div className="config-divider" />

            {/* Word / Time Counts */}
            <div className="config-group">
              {config.mode === 'time' ? (
                [
                  { val: 15, label: '15s' },
                  { val: 30, label: '30s' },
                  { val: 60, label: '60s (1m)' },
                  { val: 120, label: '120s (2m)' },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    className={`config-btn ${config.amount === val ? 'active' : ''}`}
                    onClick={() => setConfig({ mode: 'time', amount: val })}
                  >
                    {label}
                  </button>
                ))
              ) : (
                [10, 25, 50, 100].map((num) => (
                  <button
                    key={num}
                    className={`config-btn ${config.amount === num ? 'active' : ''}`}
                    onClick={() => setConfig({ mode: 'words', amount: num })}
                  >
                    {num} words
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test Area or Results Screen */}
      {testState === 'typing' ? (
        <TypingArea
          text={text}
          mode={config.mode}
          timeLimit={config.mode === 'time' ? config.amount : null}
          isRace={false}
          raceStarted={true}
          onFinish={handleFinish}
          onRestart={generateNewTest}
        />
      ) : (
        <ResultsPodium
          stats={stats}
          isRace={false}
          onPlayAgain={generateNewTest}
        />
      )}
    </div>
  );
}
