export function createSound() {
  let context;
  let master;
  let muted = false;
  let noise;

  function unlock() {
    const Audio = window.AudioContext ?? window.webkitAudioContext;
    if (!Audio) return;
    if (!context) {
      context = new Audio();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.24;
      master.connect(context.destination);
      noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.4), context.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
  }

  function tone(from, to, length, volume, wave = 'sine') {
    if (!context || muted) return;
    const now = context.currentTime;
    const voice = context.createOscillator();
    const gain = context.createGain();
    voice.type = wave;
    voice.frequency.setValueAtTime(from, now);
    voice.frequency.exponentialRampToValueAtTime(to, now + length);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + length);
    voice.connect(gain).connect(master);
    voice.start(now);
    voice.stop(now + length);
  }

  function brush(length, volume, frequency) {
    if (!context || muted) return;
    const now = context.currentTime;
    const voice = context.createBufferSource();
    voice.buffer = noise;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + length);
    voice.connect(filter).connect(gain).connect(master);
    voice.start(now);
    voice.stop(now + length);
  }

  return {
    unlock,
    mute(value) {
      muted = value;
      if (master) master.gain.value = muted ? 0 : 0.24;
    },
    theme(theme, beat) {
      if (theme === 'silent') return;
      const accent = beat % 4 === 0;
      if (theme === 'drum') {
        tone(accent ? 119 : 91, 43, accent ? 0.36 : 0.19, accent ? 0.69 : 0.29);
        if (beat % 2) brush(0.11, 0.15, 1300);
      } else if (theme === 'pulse') {
        const note = [110, 110, 130.81, 98, 110, 146.83, 130.81, 98][beat % 8];
        tone(note, note * 0.997, 0.26, 0.25, 'triangle');
        if (accent) tone(110, 49, 0.34, 0.56);
      } else {
        if (beat % 2 === 0) tone(accent ? 523.25 : 392, accent ? 516 : 385, 0.36, 0.21, 'triangle');
        tone(accent ? 128 : 85, 42, 0.24, accent ? 0.49 : 0.22);
      }
    },
    impact() {
      tone(82, 37, 0.22, 0.66);
      brush(0.21, 0.43, 680);
    },
    decision() {
      tone(440, 422, 0.28, 0.20, 'triangle');
      brush(0.36, 0.30, 1550);
    },
  };
}
