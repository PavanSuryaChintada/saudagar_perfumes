// Premium UI sound feedback (Web Audio API, no audio files needed).
// Glass-pluck voices with a shared concert-hall style reverb.
// Browsers only allow audio after a user gesture; every caller here is triggered by a click.

let audioCtx = null;
let reverbIn = null;

// Synthetic impulse response: stereo noise with an exponential tail, like a small hall.
function buildImpulse(ctx, seconds = 2.6, decay = 3.2) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buffer;
}

function getContext() {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();

      // Shared reverb bus: wet signal only, mixed under the dry notes.
      const convolver = audioCtx.createConvolver();
      convolver.buffer = buildImpulse(audioCtx);
      const wet = audioCtx.createGain();
      wet.gain.value = 0.32;
      reverbIn = audioCtx.createGain();
      reverbIn.connect(convolver);
      convolver.connect(wet);
      wet.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

// A single glass/marimba-like pluck: soft attack, long natural decay, a faint
// slightly-detuned twin for warmth, and an inharmonic overtone that rings briefly.
function pluck(ctx, { freq, start = 0, dur = 1.6, vol = 0.07 }) {
  const t0 = ctx.currentTime + start;

  const voice = ctx.createGain();
  voice.gain.value = vol;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 3400;
  lowpass.Q.value = 0.3;

  const dry = ctx.createGain();
  dry.gain.value = 0.85;
  const send = ctx.createGain();
  send.gain.value = 0.6;

  voice.connect(lowpass);
  lowpass.connect(dry);
  lowpass.connect(send);
  dry.connect(ctx.destination);
  send.connect(reverbIn);

  // [frequency, level, decay seconds, detune in cents]
  const partials = [
    [freq, 1, dur, 0],
    [freq, 0.5, dur * 0.9, 4], // slightly detuned twin for warmth
    [freq * 2.76, 0.16, dur * 0.35, 0] // glassy inharmonic overtone
  ];

  partials.forEach(([f, level, decay, detune]) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    osc.detune.value = detune;

    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(level, t0 + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);

    osc.connect(env);
    env.connect(voice);
    osc.start(t0);
    osc.stop(t0 + decay + 0.05);
  });
}

// Each cue is a short, restrained phrase in a major key so it feels bright and calm.
const CUES = {
  // Add to bag: two rising notes, the second ringing out
  bag: [
    { freq: 659.25, dur: 1.4, vol: 0.075 }, // E5
    { freq: 987.77, start: 0.11, dur: 1.9, vol: 0.065 } // B5
  ],
  // Save to wishlist: single warm pluck with a high shimmer
  wishlist: [
    { freq: 783.99, dur: 1.8, vol: 0.07 }, // G5
    { freq: 1174.66, start: 0.1, dur: 1.4, vol: 0.035 } // D6
  ],
  // Remove from wishlist / bag: two falling notes
  remove: [
    { freq: 587.33, dur: 1.1, vol: 0.06 }, // D5
    { freq: 440, start: 0.12, dur: 1.4, vol: 0.05 } // A4
  ],
  // Theme switch: airy open fifth
  theme: [
    { freq: 523.25, dur: 1.5, vol: 0.06 }, // C5
    { freq: 783.99, start: 0.14, dur: 1.8, vol: 0.05 } // G5
  ],
  // Currency change: one quiet note
  currency: [{ freq: 880, dur: 0.9, vol: 0.04 }],
  // Quantity change: very soft tap
  tap: [{ freq: 1046.5, dur: 0.5, vol: 0.03 }],
  // Order confirmed: gentle major arpeggio that resolves
  success: [
    { freq: 523.25, dur: 1.6, vol: 0.06 }, // C5
    { freq: 659.25, start: 0.14, dur: 1.6, vol: 0.06 }, // E5
    { freq: 783.99, start: 0.28, dur: 1.6, vol: 0.06 }, // G5
    { freq: 1046.5, start: 0.44, dur: 2.4, vol: 0.065 } // C6
  ]
};

export function playSound(name) {
  const cue = CUES[name];
  const ctx = getContext();
  if (!cue || !ctx) return;
  cue.forEach((note) => pluck(ctx, note));
}
