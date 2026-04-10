// synthetic UI sound effects via Web Audio API — zero dependencies, zero files

let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

function playTone(options: {
  frequency: number;
  duration: number;
  volume?: number;
  type?: OscillatorType;
  decay?: number;
}) {
  const audio = getContext();
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = options.type ?? "sine";
  osc.frequency.setValueAtTime(options.frequency, audio.currentTime);

  const vol = options.volume ?? 0.03;
  gain.gain.setValueAtTime(vol, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audio.currentTime + options.duration * (options.decay ?? 0.8)
  );

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + options.duration);
}

// hover on countries/globe
export function playHover() {
  playTone({ frequency: 900, duration: 0.05, volume: 0.025, type: "sine", decay: 0.95 });
}

// hover on UI elements (dropdowns, list items)
export function playHoverSoft() {
  playTone({ frequency: 600, duration: 0.04, volume: 0.015, type: "sine", decay: 0.95 });
}

// click on buttons/links
export function playClick() {
  playTone({ frequency: 700, duration: 0.06, volume: 0.035, type: "sine", decay: 0.8 });
}

// select country — two-tone ascending
export function playSelect() {
  playTone({ frequency: 550, duration: 0.07, volume: 0.03, type: "sine", decay: 0.85 });
  setTimeout(() => {
    playTone({ frequency: 750, duration: 0.09, volume: 0.03, type: "sine", decay: 0.8 });
  }, 55);
}

// notification — louder three-tone chime
export function playNotification() {
  playTone({ frequency: 600, duration: 0.1, volume: 0.07, type: "sine", decay: 0.8 });
  setTimeout(() => {
    playTone({ frequency: 800, duration: 0.1, volume: 0.07, type: "sine", decay: 0.8 });
  }, 80);
  setTimeout(() => {
    playTone({ frequency: 1000, duration: 0.14, volume: 0.06, type: "sine", decay: 0.7 });
  }, 160);
}

// glitch transition — soft white noise hiss, like a distant TV
export function playGlitch() {
  const audio = getContext();
  const now = audio.currentTime;

  const duration = 0.4;
  const bufferSize = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const noise = audio.createBufferSource();
  noise.buffer = buffer;

  // gentle lowpass — removes the harsh high frequencies
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3000, now);
  filter.Q.setValueAtTime(0.3, now);

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.004, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  noise.start(now);
  noise.stop(now + duration);
}

// deselect country — two-tone descending
export function playDeselect() {
  playTone({ frequency: 600, duration: 0.08, volume: 0.025, type: "sine", decay: 0.8 });
  setTimeout(() => {
    playTone({ frequency: 400, duration: 0.06, volume: 0.02, type: "sine", decay: 0.85 });
  }, 45);
}
