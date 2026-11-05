/* Bong Bóng Chữ Cái — game Đảo Bàn Phím (ES module, tự đăng ký vào KrakenRegistry).
   Bong bóng mang chữ cái nổi dần lên mặt nước dưới đáy biển. Bé bấm đúng phím
   (phím thật hoặc chạm phím ảo) thì bong bóng VỠ — luyện phản xạ tìm phím.
   Bong bóng nổi lên đỉnh thì bay mất (không phạt, chỉ không được điểm quả đó).
   Trong các bong bóng đang nổi không bao giờ trùng chữ -> 1 lần bấm chỉ vỡ đúng 1 quả.
   Độ khó theo công thức D (difficulty.js -> bubbleParams): nổi nhanh dần, nhiều quả cùng lúc dần. */
import { createKeyboard } from "./keyboard.js";

function startBongBong(stage, api) {
  const P = api.params;
  const TOTAL = P.total;
  const POOL = P.pool;
  let done = false, raf = null;
  let spawned = 0, popped = 0, escaped = 0;
  let presses = 0, correctPresses = 0;
  let lastSpawnAt = -Infinity, lastTs = null;
  const alive = []; // {letter, el, bornAt, xPct, swayPhase}

  stage.classList.add("bub-stage");
  stage.innerHTML = `
    <div class="bub-wrap">
      <div class="bub-scene">
        <div class="bub-floor"><span>🪸</span><span>🐚</span><span>🪸</span><span>⭐</span><span>🐚</span></div>
      </div>
      <div class="bub-kb"></div>
    </div>`;
  const scene = stage.querySelector(".bub-scene");

  const kb = createKeyboard({ onKey: handleKey });
  stage.querySelector(".bub-kb").appendChild(kb.el);

  function updateHud() {
    api.hud.textContent = `🫧 Bắt được: ${popped}/${TOTAL} · Trượt: ${escaped}`;
  }
  function updateDebug() {
    window.__typingDebug = { id: "bong-bong-chu", letters: alive.map(b => b.letter) };
  }

  function pickLetter() {
    const used = alive.map(b => b.letter);
    const free = POOL.split("").filter(c => !used.includes(c));
    const bag = free.length ? free : POOL.split("");
    return bag[Math.floor(Math.random() * bag.length)];
  }

  function spawnBubble(now) {
    const letter = pickLetter();
    const el = document.createElement("div");
    el.className = "bub-bubble";
    el.textContent = letter;
    const xPct = 8 + Math.random() * 84; // % bề ngang cảnh biển
    el.style.left = xPct + "%";
    scene.appendChild(el);
    alive.push({ letter: letter, el: el, bornAt: now, xPct: xPct, swayPhase: Math.random() * Math.PI * 2 });
    spawned++;
    updateDebug();
  }

  function removeBubble(b) {
    const i = alive.indexOf(b);
    if (i >= 0) alive.splice(i, 1);
    b.el.remove();
    updateDebug();
  }

  function handleKey(ch) {
    if (done) return;
    presses++;
    const b = alive.find(x => x.letter === ch); // chữ không trùng nhau -> tối đa 1 quả khớp
    if (b) {
      correctPresses++;
      popped++;
      kb.pulseKey(ch, "good");
      window.KrakenAudio.pop();
      b.el.classList.add("bub-pop");
      const el = b.el;
      setTimeout(() => el.remove(), 240);
      const i = alive.indexOf(b);
      if (i >= 0) alive.splice(i, 1);
      updateDebug();
      updateHud();
    } else {
      kb.pulseKey(ch, "bad");
      window.KrakenAudio.gentle();
    }
  }

  function loop(ts) {
    if (done) return;
    const now = typeof ts === "number" ? ts : performance.now();
    const dt = lastTs == null ? 0 : Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now;
    const w = scene.clientWidth, h = scene.clientHeight;

    // thả bong bóng mới theo nhịp spawnMs, không quá `concurrent` quả cùng lúc
    if (spawned < TOTAL && alive.length < P.concurrent && now - lastSpawnAt >= P.spawnMs) {
      spawnBubble(now);
      lastSpawnAt = now;
    }

    // cập nhật vị trí: nổi từ dưới đáy (top ~110%) lên trên đỉnh (top ~-12%)
    for (let i = alive.length - 1; i >= 0; i--) {
      const b = alive[i];
      const p = (now - b.bornAt) / P.riseMs;
      if (p >= 1) { // nổi hết lên mặt nước -> bay mất
        escaped++;
        removeBubble(b);
        updateHud();
        continue;
      }
      const y = (1.12 - 1.24 * p) * h;                 // px từ mép trên cảnh
      const sway = Math.sin(now / 620 + b.swayPhase) * 9; // lắc ngang nhẹ
      b.el.style.transform = `translate(${sway}px, 0)`;
      b.el.style.top = (y - 38) + "px";
      b.el.style.left = b.xPct + "%";
    }

    if (spawned >= TOTAL && alive.length === 0) { finish(); return; }
    raf = requestAnimationFrame(loop);
  }

  function finish() {
    done = true;
    const accuracy = presses ? correctPresses / presses : 0;
    const perf = 0.7 * (popped / TOTAL) + 0.3 * accuracy;
    const stars = perf >= 0.8 ? 3 : perf >= 0.45 ? 2 : 1;
    api.complete(stars, {
      perf: perf, emoji: "🫧",
      message: `Con làm vỡ ${popped}/${TOTAL} bong bóng chữ! Bấm phím nhanh như bong bóng bay! 🫧`
    });
  }

  updateHud();
  updateDebug();
  raf = requestAnimationFrame(loop);

  return function cleanup() {
    done = true;
    if (raf) cancelAnimationFrame(raf);
    kb.destroy();
    stage.classList.remove("bub-stage");
    if (window.__typingDebug && window.__typingDebug.id === "bong-bong-chu") delete window.__typingDebug;
  };
}

window.KrakenRegistry.registerGame({
  id: "bong-bong-chu", island: "ban-phim", icon: "🫧",
  name: "Bong Bóng Chữ Cái", skill: "Phản xạ tìm phím — làm vỡ bong bóng chữ",
  title: "Bong Bóng Chữ Cái — Đảo Bàn Phím",
  instruction: "🫧 Bong bóng mang chữ đang nổi lên! GÕ đúng phím chữ đó để làm vỡ bong bóng trước khi nó bay mất nhé!",
  start: startBongBong
});
