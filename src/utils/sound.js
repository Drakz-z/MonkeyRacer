// Web Audio API Synthesizer for keyboard sound effects
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.soundType = 'thock'; // 'thock' | 'clicky' | 'typewriter' | 'bubble' | 'off'
    this.volume = 0.35;
    this.noiseBuffer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.generateNoiseBuffer();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  generateNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.05; // 50ms buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  playKeySound(isSpace = false) {
    if (this.soundType === 'off' || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, now);
    masterGain.connect(this.ctx.destination);

    if (this.soundType === 'thock') {
      // Deep mechanical switch sound (Gateron Ink Black / Holy Panda feel)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      const pitch = isSpace ? 110 : (140 + Math.random() * 25);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.04);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.05);

      // Noise punch
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start(now);
        noise.stop(now + 0.03);
      }
    } else if (this.soundType === 'clicky') {
      // Crisp clicky switch (Cherry MX Blue)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      const pitch = isSpace ? 750 : (1100 + Math.random() * 200);
      osc.type = 'square';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.015);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.02);
    } else if (this.soundType === 'typewriter') {
      // Metallic mechanical strike
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isSpace ? 350 : 520, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.06);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (this.soundType === 'bubble') {
      // Soft playful bubble pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSpace ? 320 : (440 + Math.random() * 120), now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  playFinishSound() {
    if (this.soundType === 'off' || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A chord chime
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = this.ctx.currentTime + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.3 * this.volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.4);
    });
  }

  playTone(freq, duration = 0.18, gainAmount = 0.25) {
    if (this.soundType === 'off' || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const time = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(gainAmount * this.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + duration);
  }

  playCountdownSound() {
    this.playTone(523.25, 0.15);
  }

  playStartSound() {
    this.playTone(1046.5, 0.35, 0.3);
  }

  setSoundType(type) {
    this.soundType = type;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }
}

export const soundEngine = new SoundEngine();
