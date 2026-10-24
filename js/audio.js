/* Âm thanh tự tạo bằng Web Audio API — không cần file nhạc */
window.KrakenAudio = (function () {
  let ctx = null;
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type, vol) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    const t = c.currentTime + start;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function sweep(f0, f1, start, dur, type, vol) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine";
    const t = c.currentTime + start;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  return {
    unlock: ensure,
    pop() { tone(520, 0, 0.12, "sine", 0.2); tone(880, 0.05, 0.14, "sine", 0.18); },
    catchIt() { tone(392, 0, 0.12, "triangle", 0.2); tone(587, 0.09, 0.16, "triangle", 0.2); },
    coin() { tone(988, 0, 0.09, "square", 0.1); tone(1319, 0.08, 0.18, "square", 0.1); },
    drop() { tone(760, 0, 0.09, "square", 0.09); tone(540, 0.07, 0.09, "square", 0.09); tone(330, 0.14, 0.16, "square", 0.09); },
    kick() { tone(150, 0, 0.15, "sine", 0.3); tone(90, 0.02, 0.2, "sine", 0.25); },
    goal() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.22, "triangle", 0.2)); },
    gentle() { tone(330, 0, 0.15, "sine", 0.12); },
    whoosh() { sweep(850, 220, 0, 0.5, "sine", 0.16); sweep(520, 160, 0.05, 0.45, "triangle", 0.08); },
    jingle() { [523, 587, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.25, "triangle", 0.2)); }
  };
})();
