/* Săn Kho Báu Biển Sâu — game Đảo Toán (ES module, tự đăng ký vào KrakenRegistry).
   Game NHỊP CHẬM, không đồng hồ, không áp lực: tàu ngầm vàng lặn xuống đáy biển tìm kho báu.
   Mỗi phép cộng/trừ (phạm vi 100) gõ đúng = tàu lặn sâu thêm 1 đoạn kèm bong bóng;
   cứ 3 câu ĐÚNG NGAY liên tiếp được 1 viên ngọc bay vào bộ sưu tập. Gõ sai chỉ rung nhẹ
   + gợi ý (sai lần 2 có mẹo tách số) rồi gõ lại — không bao giờ "thua".
   Tới đáy: rương kho báu mở tung xu vàng và ngọc. */
import { createKeypad, decomposeHint } from "./keypad.js";

function startKhoBau(stage, api) {
  const P = api.params;
  const TOTAL = P.segments;
  let depth = 0, firstTry = 0, streak = 0, gems = 0;
  let wrongThisQ = false, wrongCount = 0, currentQ = null, done = false;
  let timers = [];

  stage.classList.add("tre-stage");
  stage.innerHTML = `
    <div class="tre-wrap">
      <div class="tre-scene">
        <div class="tre-surface"><span>⛵</span><span>🌊</span><span>🐙</span></div>
        <div class="tre-gems">💎 × 0</div>
        <div class="tre-sub">${window.KrakenIcons.submarine()}</div>
        <div class="tre-meter"></div>
        <div class="tre-chest">🎁</div>
      </div>
      <div class="math-bar tre-bar">
        <div class="math-eq tre-eq"></div>
        <div class="math-pad-holder"></div>
      </div>
      <div class="math-hint tre-hint"></div>
    </div>`;
  const scene = stage.querySelector(".tre-scene");
  const subEl = stage.querySelector(".tre-sub");
  const meterEl = stage.querySelector(".tre-meter");
  const chestEl = stage.querySelector(".tre-chest");
  const gemsEl = stage.querySelector(".tre-gems");
  const eqEl = stage.querySelector(".tre-eq");
  const hintEl = stage.querySelector(".tre-hint");

  const dots = [];
  for (let i = 0; i < TOTAL; i++) {
    const d = document.createElement("div");
    d.className = "tre-dot";
    meterEl.appendChild(d);
    dots.push(d);
  }

  const kp = createKeypad({ onSubmit: submitAnswer });
  stage.querySelector(".math-pad-holder").appendChild(kp.el);

  function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
  function updateHud() {
    api.hud.textContent = `🤿 Độ sâu: ${depth}/${TOTAL} · 💎 ${gems}`;
    gemsEl.textContent = `💎 × ${gems}`;
  }
  function subTopPct() { return 8 + (depth / TOTAL) * 62; }
  function placeSub(animate) {
    subEl.style.top = subTopPct() + "%";
  }
  function hintFor(q) {
    if (q.op === "+") return q.carry
      ? "Cộng hàng đơn vị trước, nhớ thì cộng thêm 1 vào hàng chục nhé 💙"
      : "Thử cộng lại thật chậm nhé 💙";
    return q.carry
      ? "Hàng đơn vị trừ không được thì mượn 1 chục nhé 💙"
      : "Thử trừ lại thật chậm nhé 💙";
  }
  function bubbles() {
    const r = subEl.getBoundingClientRect(), sr = scene.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const b = document.createElement("span");
      b.className = "tre-bubble";
      b.textContent = "🫧";
      b.style.left = (r.left - sr.left + r.width - 16 + window.Kraken.rand(-8, 14)) + "px";
      b.style.top = (r.top - sr.top + window.Kraken.rand(-4, 20)) + "px";
      scene.appendChild(b);
      later(() => b.remove(), 950);
    }
  }
  function gemFly() {
    const sr = scene.getBoundingClientRect();
    const r = subEl.getBoundingClientRect(), gr = gemsEl.getBoundingClientRect();
    const g = document.createElement("span");
    g.className = "tre-gem-fly";
    g.textContent = "💎";
    g.style.left = (r.left - sr.left + r.width / 2) + "px";
    g.style.top = (r.top - sr.top) + "px";
    scene.appendChild(g);
    requestAnimationFrame(() => {
      g.style.transition = "left .7s ease, top .7s ease, transform .7s ease";
      g.style.left = (gr.left - sr.left + 10) + "px";
      g.style.top = (gr.top - sr.top) + "px";
      g.style.transform = "scale(1.3) rotate(20deg)";
    });
    later(() => {
      g.remove();
      gems++;
      window.KrakenAudio.coin();
      updateHud();
    }, 730);
  }
  function openChest() {
    chestEl.textContent = "💰";
    window.KrakenAudio.jingle();
    window.KrakenAudio.goal();
    const sr = scene.getBoundingClientRect();
    const r = chestEl.getBoundingClientRect();
    const cx = r.left - sr.left + r.width / 2, cy = r.top - sr.top + 10;
    const bits = ["🪙", "💎", "⭐", "👑", "🪙", "💎"];
    for (let i = 0; i < 18; i++) {
      const b = document.createElement("span");
      b.className = "tre-coin-bit";
      b.textContent = bits[i % bits.length];
      b.style.left = cx + "px"; b.style.top = cy + "px";
      scene.appendChild(b);
      const dx = window.Kraken.rand(-150, 150), dy = window.Kraken.rand(-190, -50);
      requestAnimationFrame(() => {
        b.style.transition = "transform .95s cubic-bezier(.17,.67,.35,1), opacity .95s ease";
        b.style.transform = `translate(${dx}px, ${dy}px) rotate(${window.Kraken.rand(-160, 160)}deg)`;
        b.style.opacity = "0";
      });
      later(() => b.remove(), 1000);
    }
  }

  function submitAnswer(value) {
    if (done || !currentQ) return;
    const q = currentQ;
    if (value === q.answer) {
      window.KrakenAudio.pop();
      kp.slot.classList.add("found");
      kp.setEnabled(false);
      if (!wrongThisQ) { firstTry++; streak++; } else { streak = 0; }
      depth++;
      if (dots[depth - 1]) dots[depth - 1].classList.add("on");
      placeSub(true);
      bubbles();
      if (streak > 0 && streak % P.gemEvery === 0) gemFly();
      updateHud();
      if (depth >= TOTAL) {
        later(() => { openChest(); later(finish, 1250); }, 900);
      } else {
        later(newQuestion, 900);
      }
    } else {
      wrongThisQ = true;
      wrongCount++;
      streak = 0;
      window.KrakenAudio.gentle();
      subEl.classList.remove("shake");
      void subEl.offsetWidth;
      subEl.classList.add("shake");
      eqEl.classList.remove("shake");
      void eqEl.offsetWidth;
      eqEl.classList.add("shake");
      kp.clear();
      hintEl.textContent = wrongCount >= 2
        ? (decomposeHint(q.a, q.op, q.b) || hintFor(q))
        : hintFor(q);
    }
  }

  function newQuestion() {
    if (done) return;
    wrongThisQ = false;
    wrongCount = 0;
    hintEl.textContent = "";
    const q = window.KrakenMath.makeAddSub(P);
    currentQ = q;
    eqEl.innerHTML = `<span>${q.a}</span><span class="math-op">${q.op === "+" ? "+" : "−"}</span><span>${q.b}</span><span class="math-op">=</span>`;
    eqEl.appendChild(kp.slot);
    kp.slot.classList.remove("found");
    kp.clear();
    kp.setEnabled(true);
    window.__mathDebug = { id: "kho-bau", answer: q.answer, q: depth + 1, total: TOTAL };
    updateHud();
  }

  function finish() {
    if (done) return;
    done = true;
    const perf = firstTry / TOTAL;
    const stars = perf >= 0.8 ? 3 : perf >= 0.45 ? 2 : 1;
    api.complete(stars, {
      perf: perf, emoji: "💰",
      message: `Con lặn tới được kho báu rồi! Đúng ngay ${firstTry}/${TOTAL} câu và nhặt được ${gems} viên ngọc 💎!`
    });
  }

  placeSub(false);
  newQuestion();

  return function cleanup() {
    done = true;
    timers.forEach(clearTimeout);
    timers = [];
    kp.destroy();
    stage.classList.remove("tre-stage");
    if (window.__mathDebug && window.__mathDebug.id === "kho-bau") delete window.__mathDebug;
  };
}

window.KrakenRegistry.registerGame({
  id: "kho-bau", island: "toan", icon: "💰",
  name: "Săn Kho Báu Biển Sâu", skill: "Lặn sâu tìm kho báu bằng phép cộng trừ",
  title: "Săn Kho Báu Biển Sâu — Đảo Toán",
  instruction: "🤿 GÕ đúng đáp án để tàu ngầm lặn sâu thêm 1 đoạn tới kho báu! Đúng ngay 3 câu liền được 1 viên ngọc 💎!",
  start: startKhoBau
});
