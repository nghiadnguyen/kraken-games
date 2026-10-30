/* Tháp Pháo Tàu Chiến — game Đảo Toán (ES module, tự đăng ký vào KrakenRegistry).
   Máy bay địch bay từ phải sang mang theo 1 phép cộng/trừ (phạm vi 100) trên mình —
   chiếc máy bay CHÍNH LÀ câu hỏi. Bé gõ đúng đáp án bằng bàn phím số dùng chung thì
   tháp pháo trên tàu chiến bắn hạ nó; gõ sai thì đạn rơi xuống nước, gõ lại trong lúc
   nó vẫn bay tới. Máy bay chạm tàu thì tàu mất 1 tim — mất hết tim cũng KHÔNG thua,
   chỉ ảnh hưởng điểm sao. Tốc độ bay theo công thức D (difficulty.js), từ D>=5 máy
   bay còn lượn lên xuống. Vòng lặp rAF dọn sạch khi thoát game. */
import { createKeypad, decomposeHint } from "./keypad.js";

function startThapPhao(stage, api) {
  const P = api.params;
  const WAVES = P.waves;
  let wave = 0, shotDown = 0, firstTry = 0, hearts = P.hearts;
  let wrongThisQ = false, wrongCount = 0, currentQ = null;
  let done = false, raf = null, timers = [];
  let plane = null; // { el, startAt, baseY, state: "fly" | "boom" | "fall" | "bomb" | "gone" }

  stage.classList.add("tur-stage");
  stage.innerHTML = `
    <div class="tur-wrap">
      <div class="tur-scene">
        <div class="tur-hearts"></div>
        <div class="tur-ship">
          <div class="tur-cannon"></div>
          <div class="tur-ship-icon">${window.KrakenIcons.warship("#5b6b7f")}</div>
        </div>
      </div>
      <div class="math-bar tur-bar">
        <div class="math-eq tur-eq"></div>
        <div class="math-pad-holder"></div>
      </div>
      <div class="math-hint tur-hint"></div>
    </div>`;
  const scene = stage.querySelector(".tur-scene");
  const heartsEl = stage.querySelector(".tur-hearts");
  const cannonEl = stage.querySelector(".tur-cannon");
  const eqEl = stage.querySelector(".tur-eq");
  const hintEl = stage.querySelector(".tur-hint");

  const kp = createKeypad({ onSubmit: submitAnswer });
  stage.querySelector(".math-pad-holder").appendChild(kp.el);

  function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
  function updateHud() {
    api.hud.textContent = `🚢 Đợt ${Math.min(Math.max(wave, 1), WAVES)}/${WAVES} · Bắn hạ: ${shotDown} · ❤️ ${Math.max(0, hearts)}`;
    heartsEl.textContent = "❤️".repeat(Math.max(0, hearts)) + "🖤".repeat(Math.max(0, P.hearts - hearts));
  }
  function hintFor(q) {
    if (q.op === "+") return q.carry
      ? "Cộng hàng đơn vị trước, nhớ thì cộng thêm 1 vào hàng chục nhé 💙"
      : "Thử cộng lại thật chậm nhé 💙";
    return q.carry
      ? "Hàng đơn vị trừ không được thì mượn 1 chục nhé 💙"
      : "Thử trừ lại thật chậm nhé 💙";
  }
  function eqText(q) { return `${q.a} ${q.op === "+" ? "+" : "−"} ${q.b} = ?`; }
  function splash(x, y, text) {
    const s = document.createElement("div");
    s.className = "tur-splash";
    s.textContent = text || "💦";
    s.style.left = x + "px"; s.style.top = y + "px";
    scene.appendChild(s);
    later(() => s.remove(), 850);
  }

  function submitAnswer(value) {
    if (done || !currentQ || !plane || plane.state !== "fly") return;
    const q = currentQ;
    if (value === q.answer) {
      if (!wrongThisQ) firstTry++;
      kp.setEnabled(false);
      fireCannon();
    } else {
      wrongThisQ = true;
      wrongCount++;
      window.KrakenAudio.gentle();
      eqEl.classList.remove("shake");
      void eqEl.offsetWidth;
      eqEl.classList.add("shake");
      kp.clear();
      const r = plane.el.getBoundingClientRect(), sr = scene.getBoundingClientRect();
      splash(r.left - sr.left + window.Kraken.rand(-20, 90), r.top - sr.top + window.Kraken.rand(46, 70));
      hintEl.textContent = wrongCount >= 2
        ? (decomposeHint(q.a, q.op, q.b) || hintFor(q))
        : hintFor(q);
    }
  }

  function fireCannon() {
    if (!plane) return;
    plane.state = "boom";
    const sr = scene.getBoundingClientRect();
    const cr = cannonEl.getBoundingClientRect();
    const pr = plane.el.getBoundingClientRect();
    const sx = cr.left - sr.left + cr.width - 4, sy = cr.top - sr.top + cr.height / 2;
    const tx = pr.left - sr.left + pr.width / 2, ty = pr.top - sr.top + pr.height / 2;
    const dot = document.createElement("div");
    dot.className = "tur-shot";
    dot.style.left = sx + "px"; dot.style.top = sy + "px";
    scene.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.transition = "left .15s linear, top .15s linear";
      dot.style.left = tx + "px"; dot.style.top = ty + "px";
    });
    const targetPlane = plane;
    later(() => {
      dot.remove();
      if (done || plane !== targetPlane) return;
      const boom = document.createElement("div");
      boom.className = "tur-boom";
      boom.textContent = "💥";
      targetPlane.el.appendChild(boom);
      window.KrakenAudio.drop();
      window.KrakenAudio.pop();
      window.Kraken.floatText(stage, stage.clientWidth / 2, 96, "💥 Bắn hạ rồi!");
      shotDown++;
      updateHud();
      later(() => {
        if (done || plane !== targetPlane) return;
        targetPlane.state = "fall";
        targetPlane.el.style.transition = "transform .9s ease-in, opacity .9s ease-in";
        targetPlane.el.style.transform = `translateY(${scene.clientHeight * 0.52}px) rotate(520deg)`;
        targetPlane.el.style.opacity = "0.25";
        later(() => {
          const r = targetPlane.el.getBoundingClientRect();
          splash(r.left - sr.left + 40, scene.clientHeight * 0.52, "💦");
          targetPlane.el.remove();
          if (plane === targetPlane) plane = null;
          if (!done) nextPlane();
        }, 950);
      }, 380);
    }, 170);
  }

  function planeBomb() {
    if (!plane || plane.state !== "fly") return;
    plane.state = "bomb";
    const sr = scene.getBoundingClientRect();
    const shipEl = stage.querySelector(".tur-ship");
    const r = shipEl.getBoundingClientRect();
    splash(r.left - sr.left + r.width * 0.55, r.top - sr.top - 6, "💧");
    splash(r.left - sr.left + r.width * 0.3, r.top - sr.top + 10, "💦");
    hearts = Math.max(0, hearts - 1);
    window.KrakenAudio.drop();
    window.Kraken.floatText(stage, stage.clientWidth / 2, 96, "Tàu bị dội nước rồi! 💧");
    hintEl.textContent = "Máy bay thoát mất rồi! Chiếc tiếp theo đang tới, sẵn sàng nào! 💪";
    kp.setEnabled(false);
    updateHud();
    const p = plane;
    p.el.style.transition = "transform .6s ease-in, opacity .6s ease-in";
    p.el.style.transform = "translate(-140px,-170px) rotate(-14deg)";
    p.el.style.opacity = "0";
    later(() => { p.el.remove(); if (plane === p) plane = null; if (!done) nextPlane(); }, 700);
  }

  function nextPlane() {
    if (done) return;
    if (wave >= WAVES) { finish(); return; }
    wave++;
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

    const el = document.createElement("div");
    el.className = "tur-plane";
    el.innerHTML = `<div class="tur-chip">${eqText(q)}</div><div class="tur-jet">${window.KrakenIcons.jet("#7f8ea3")}</div>`;
    el.style.left = scene.clientWidth + "px";
    el.style.top = "12%";
    scene.appendChild(el);
    plane = {
      el: el, startAt: performance.now(),
      baseY: window.Kraken.rand(0.09, 0.32), state: "fly"
    };
    window.__mathDebug = { id: "thap-phao", answer: q.answer, q: wave, total: WAVES };
    updateHud();
  }

  let lastTs = null;
  function loop(ts) {
    if (done) return;
    const now = typeof ts === "number" ? ts : performance.now();
    lastTs = now;
    if (plane && plane.state === "fly") {
      const w = scene.clientWidth, h = scene.clientHeight;
      const t = (now - plane.startAt) / P.approachMs;
      if (t >= 1) {
        planeBomb();
      } else {
        const startX = w - 6, endX = w * 0.30;
        const x = startX + (endX - startX) * t;
        const y = plane.baseY * h + (P.wiggleAmp ? Math.sin(now / 300) * P.wiggleAmp : 0);
        plane.el.style.left = x + "px";
        plane.el.style.top = y + "px";
        // nòng pháo ngắm theo máy bay
        const sr = scene.getBoundingClientRect();
        const cr = cannonEl.getBoundingClientRect();
        const cx = cr.left - sr.left + 6, cy = cr.top - sr.top + cr.height / 2;
        const ang = Math.atan2(y + 26 - cy, x + 70 - cx) * 180 / Math.PI;
        cannonEl.style.transform = `rotate(${Math.max(-70, Math.min(12, ang))}deg)`;
        window.__turDebug = { progress: Math.round(t * 100) / 100, shotDown: shotDown, hearts: hearts, wave: wave };
      }
    }
    raf = requestAnimationFrame(loop);
  }

  function finish() {
    done = true;
    kp.setEnabled(false);
    const perf = 0.6 * (shotDown / WAVES) + 0.4 * (firstTry / WAVES);
    const stars = perf >= 0.8 ? 3 : perf >= 0.45 ? 2 : 1;
    api.complete(stars, {
      perf: perf, emoji: "🚢",
      message: `Con bắn hạ ${shotDown}/${WAVES} máy bay địch và tính đúng ngay ${firstTry}/${WAVES} câu! Tàu chiến của Kraken an toàn! 🎉`
    });
  }

  nextPlane();
  raf = requestAnimationFrame(loop);

  return function cleanup() {
    done = true;
    if (raf) cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    timers = [];
    kp.destroy();
    stage.classList.remove("tur-stage");
    if (window.__mathDebug && window.__mathDebug.id === "thap-phao") delete window.__mathDebug;
    delete window.__turDebug;
  };
}

window.KrakenRegistry.registerGame({
  id: "thap-phao", island: "toan", icon: "🚢",
  name: "Tháp Pháo Tàu Chiến", skill: "Gõ đúng phép tính để bắn hạ máy bay địch",
  title: "Tháp Pháo Tàu Chiến — Đảo Toán",
  instruction: "✈️ Máy bay địch mang phép tính bay tới! GÕ đúng đáp án để tháp pháo bắn hạ nó trước khi nó tới tàu!",
  start: startThapPhao
});
