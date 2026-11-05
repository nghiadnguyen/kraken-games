/* Tìm Phím Nhanh — game Đảo Bàn Phím (ES module, tự đăng ký vào KrakenRegistry).
   Bước đầu tiên của luyện gõ: NHẬN DIỆN VỊ TRÍ PHÍM. Một chữ cái hiện thật to,
   bé tìm đúng phím đó trên bàn phím (gõ phím thật hoặc chạm vào phím ảo đều được).
   Đứng lâu quá (hintMs) hoặc bấm sai 1 lần thì phím đích tự phát sáng gợi ý.
   Phím đích "sạch" = bấm đúng ngay, không sai, không cần gợi ý -> điểm cho bé.
   Độ khó theo công thức D (difficulty.js -> huntParams): hồ phím lớn dần, gợi ý đến muộn dần. */
import { createKeyboard } from "./keyboard.js";

function startTimPhim(stage, api) {
  const P = api.params;
  const TOTAL = P.targets;
  const POOL = P.pool;
  let done = false, accepting = false;
  let found = 0, clean = 0, streak = 0;
  let target = null, targetClean = true, hintShown = false;
  let hintTimer = null, nextTimer = null;

  stage.classList.add("hunt-stage");
  stage.innerHTML = `
    <div class="hunt-wrap">
      <div class="hunt-card">
        <div class="hunt-face">🐙</div>
        <div class="hunt-mid">
          <div class="hunt-prompt">Tìm phím này nhé!</div>
          <div class="hunt-target">?</div>
          <div class="hunt-streak"></div>
        </div>
        <div class="hunt-star">⭐</div>
      </div>
      <div class="hunt-kb"></div>
    </div>`;
  const targetEl = stage.querySelector(".hunt-target");
  const faceEl = stage.querySelector(".hunt-face");
  const streakEl = stage.querySelector(".hunt-streak");

  const kb = createKeyboard({ onKey: handleKey });
  stage.querySelector(".hunt-kb").appendChild(kb.el);

  function updateHud() {
    api.hud.textContent = `🔍 Đã tìm: ${found}/${TOTAL} · Đúng ngay: ${clean}`;
  }

  function showHint() {
    if (!accepting || !target || hintShown) return;
    hintShown = true;
    targetClean = false;
    kb.setTarget(target);
  }

  function armHintTimer() {
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = setTimeout(showHint, P.hintMs);
  }

  function nextTarget() {
    if (done) return;
    if (found >= TOTAL) { finish(); return; }
    let next = POOL[Math.floor(Math.random() * POOL.length)];
    if (POOL.length > 1) { while (next === target) next = POOL[Math.floor(Math.random() * POOL.length)]; }
    target = next;
    targetClean = true;
    hintShown = false;
    targetEl.textContent = target;
    targetEl.classList.remove("hunt-pop");
    void targetEl.offsetWidth;
    targetEl.classList.add("hunt-pop");
    faceEl.textContent = "🐙";
    streakEl.textContent = streak >= 2 ? `🔥 Đúng liền ${streak} phím!` : "";
    accepting = true;
    window.__typingDebug = { id: "tim-phim", target: target };
    armHintTimer();
    updateHud();
  }

  function handleKey(ch) {
    if (done || !accepting || !target) return;
    if (ch === target) {
      accepting = false;
      if (hintTimer) clearTimeout(hintTimer);
      kb.pulseKey(ch, "good");
      kb.setTarget(null);
      window.KrakenAudio.pop();
      if (targetClean) { clean++; streak++; } else { streak = 0; }
      found++;
      faceEl.textContent = "😄";
      const r = targetEl.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      window.Kraken.floatText(stage, r.left - sr.left + r.width / 2, r.top - sr.top - 6, "⭐");
      updateHud();
      nextTimer = setTimeout(nextTarget, 350);
    } else {
      kb.pulseKey(ch, "bad");
      window.KrakenAudio.gentle();
      targetClean = false;
      streak = 0;
      faceEl.textContent = "🤔";
      streakEl.textContent = "Gần đúng rồi, nhìn phím phát sáng nhé! 💙";
      showHint(); // bấm sai lần đầu -> gợi ý luôn
    }
  }

  function finish() {
    done = true;
    const perf = clean / TOTAL;
    const stars = perf >= 0.8 ? 3 : perf >= 0.45 ? 2 : 1;
    api.complete(stars, {
      perf: perf, emoji: "🔍",
      message: `Con tìm đúng ngay ${clean}/${TOTAL} phím không cần gợi ý! Kraken nhớ vị trí phím siêu quá! ⌨️`
    });
  }

  nextTarget();

  return function cleanup() {
    done = true;
    accepting = false;
    if (hintTimer) clearTimeout(hintTimer);
    if (nextTimer) clearTimeout(nextTimer);
    kb.destroy();
    stage.classList.remove("hunt-stage");
    if (window.__typingDebug && window.__typingDebug.id === "tim-phim") delete window.__typingDebug;
  };
}

window.KrakenRegistry.registerGame({
  id: "tim-phim", island: "ban-phim", icon: "🔍",
  name: "Tìm Phím Nhanh", skill: "Làm quen vị trí các phím chữ và số",
  title: "Tìm Phím Nhanh — Đảo Bàn Phím",
  instruction: "⌨️ Nhìn chữ thật to rồi GÕ đúng phím đó trên bàn phím (hoặc chạm vào phím trong game) nhé!",
  start: startTimPhim
});
