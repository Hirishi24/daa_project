let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

function playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1, delay: number = 0) {
  if (!soundEnabled) return;
  
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

export function playNodeVisit() {
  // Simple short mid-frequency blip
  playTone(440, 'triangle', 0.1, 0.15);
}

export function playRelaxation() {
  // Upward double-chime
  playTone(523.25, 'sine', 0.15, 0.1); // C5
  playTone(659.25, 'sine', 0.15, 0.1, 0.06); // E5
}

export function playSuccess() {
  // Arpeggio major chord
  getAudioContext();
  
  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
  notes.forEach((freq, idx) => {
    playTone(freq, 'sine', 0.4, 0.1, idx * 0.08);
  });
}

export function playFailure() {
  // Low downward buzz
  playTone(180, 'sawtooth', 0.3, 0.12);
  playTone(140, 'sawtooth', 0.3, 0.12, 0.08);
}

export function playCycleWarning() {
  // Alarm sirens: alternating high/low notes
  playTone(300, 'sawtooth', 0.25, 0.1);
  playTone(200, 'sawtooth', 0.25, 0.1, 0.15);
  playTone(300, 'sawtooth', 0.25, 0.1, 0.3);
  playTone(200, 'sawtooth', 0.25, 0.1, 0.45);
}

export function playClick() {
  // Tiny mechanical tick
  playTone(800, 'sine', 0.04, 0.05);
}
