/* Đua Xe Toán — game Đảo Toán (ES module, tự đăng ký vào KrakenRegistry).
   Ý tưởng của phụ huynh: đua xe nhìn ngang trên canvas — TRẢ LỜI ĐÚNG thì xe Kraken
   VỌT lên một đoạn (tăng tốc), càng nghĩ lâu xe càng CHẬM dần về tốc độ bò và 2 đối thủ
   sẽ vượt lên; trả lời sai xe chỉ khựng nhẹ (không đâm, không thua).
   Toán vẫn là cộng/trừ phạm vi 100, gõ đáp án bằng bàn phím số dùng chung (keypad.js).
   Tốc độ đối thủ / nhịp tụt tốc / quãng đường đều theo công thức D (difficulty.js). */
import { createKeypad, decomposeHint } from "./keypad.js";

const OPP_DEFS = [
  { name: "Thỏ Sấm Sét", color: "#7b2cbf" },
  { name: "Rùa Tốc Độ", color: "#2a9d8f" }
];

function startDuaXe(stage, api) {
  const P = api.params;
  const TOTAL = P.questions;
  let done = false, raf = null, timer = null;
  let answered = 0, firstTry = 0, wrongThisQ = false, wrongCount = 0;
  let currentQ = null;
  let kraken = { dist: 0, v: P.crawlPxS };
  let opps = OPP_DEFS.map((o, i) => ({
    name: o.name, color: o.color, dist: 0,
    speed: i === 0 ? P.oppSpeed1 : P.oppSpeed2, finishAt: null
  }));
  let firstOppFinishAt = null, raceStart = performance.now(), dipUntil = 0, boostUntil = 0;

  stage.classList.add("race2-stage");
  stage.innerHTML = `
    <div class="race2-wrap">
      <div class="race2-scene">
        <canvas class="race2-canvas"></canvas>
        <div class="race2-progress"></div>
      </div>
      <div class="math-bar race2-bar">
        <div class="math-eq race2-eq"></div>
        <div class="math-pad-holder"></div>
      </div>
      <div class="math-hint race2-hint"></div>
    </div>`;
  const scene = stage.querySelector(".race2-scene");
  const canvas = stage.querySelector(".race2-canvas");
  const ctx = canvas.getContext("2d");
  const progressEl = stage.querySelector(".race2-progress");
  const eqEl = stage.querySelector(".race2-eq");
  const hintEl = stage.querySelector(".race2-hint");

  function makeCarEl(color, name, isKraken) {
    const d = document.createElement("div");
    d.className = "race2-car";
    d.innerHTML = `<span class="race2-car-name">${name}</span><span class="race2-flame">🔥</span>${window.KrakenIcons.carSide(color)}`;
    if (isKraken) d.classList.add("race2-car-kraken");
    scene.appendChild(d);
    return d;
  }
  const krakenEl = makeCarEl("#e63946", "⭐ Kraken", true);
  const oppEls = opps.map(o => makeCarEl(o.color, o.name, false));
  const markers = [krakenEl, ...oppEls].map((_, i) => {
    const m = document.createElement("div");
    m.className = "race2-marker";
    m.style.background = i === 0 ? "#e63946" : opps[i - 1].color;
    progressEl.appendChild(m);
    return m;
  });

  const kp = createKeypad({ onSubmit: submitAnswer });
  stage.querySelector(".math-pad-holder").appendChild(kp.el);

  function hintFor(q) {
    if (q.op === "+") return q.carry
      ? "Cộng hàng đơn vị trước, nhớ thì cộng thêm 1 vào hàng chục nhé 💙"
      : "Thử cộng lại thật chậm nào, xe đang chờ con đó! 💙";
    return q.carry
      ? "Hàng đơn vị trừ không được thì mượn 1 chục nhé 💙"
      : "Thử trừ lại thật chậm nào, xe đang chờ con đó! 💙";
  }

  function placementNow() {
    return 1 + opps.filter(o => o.dist > kraken.dist).length;
  }
  function updateHud() {
    api.hud.textContent = `🏁 Đang thứ ${placementNow()}/3 · Câu ${answered + 1}`;
  }

  function submitAnswer(value) {
    if (done || !currentQ) return;
    const q = currentQ;
    if (value === q.answer) {
      if (!wrongThisQ) firstTry++;
      answered++;
      kraken.v = P.boostPxS;
      dipUntil = 0;
      boostUntil = performance.now() + 600;
      window.KrakenAudio.vroom();
      window.KrakenAudio.pop();
      const r = krakenEl.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      window.Kraken.floatText(stage, r.left - sr.left + 40, r.top - sr.top - 16, "⚡ Vùùù!");
      newQuestion();
    } else {
      wrongThisQ = true;
      wrongCount++;
      kraken.v *= 0.65;                       // khựng nhẹ một nhịp, không đâm xe
      dipUntil = performance.now() + 600;
      window.KrakenAudio.gentle();
      eqEl.classList.remove("shake");
      void eqEl.offsetWidth;
      eqEl.classList.add("shake");
      kp.clear();
      hintEl.textContent = wrongCount >= 2
        ? (decomposeHint(q.a, q.op, q.b) || hintFor(q))
        : hintFor(q);
    }
    updateHud();
  }

  function newQuestion() {
    wrongThisQ = false;
    wrongCount = 0;
    hintEl.textContent = "";
    const q = window.KrakenMath.makeAddSub(P);
    currentQ = q;
    eqEl.innerHTML = `<span>${q.a}</span><span class="math-op">${q.op === "+" ? "+" : "−"}</span><span>${q.b}</span><span class="math-op">=</span>`;
    eqEl.appendChild(kp.slot);
    kp.slot.classList.remove("found");
    kp.clear();
    window.__mathDebug = { id: "dua-xe-toan", answer: q.answer, q: answered + 1, total: TOTAL };
    updateHud();
  }

  function sizeCanvas() {
    canvas.width = scene.clientWidth;
    canvas.height = scene.clientHeight;
  }
  sizeCanvas();
  window.addEventListener("resize", sizeCanvas);

  function drawBackground(w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.4);
    sky.addColorStop(0, "#8ecae6"); sky.addColorStop(1, "#caf0f8");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.42);
    // mặt trời + mây trôi chậm (parallax 0.2)
    ctx.fillStyle = "#ffd60a";
    ctx.beginPath(); ctx.arc(w - 90, 52, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.92)";
    const cloudOff = (kraken.dist * 0.2) % (w + 320);
    for (let i = 0; i < 3; i++) {
      const cx = w + 160 - ((cloudOff + i * (w / 2.6)) % (w + 320));
      const cy = 36 + (i % 2) * 34;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 52, 17, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 30, cy + 5, 34, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 32, cy + 5, 36, 13, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // đồi xa (parallax 0.45)
    ctx.fillStyle = "#95d5b2";
    const hillOff = (kraken.dist * 0.45) % 420;
    ctx.beginPath(); ctx.moveTo(0, h * 0.42);
    for (let x = -420; x < w + 420; x += 420) {
      ctx.quadraticCurveTo(x + 210 - hillOff, h * 0.16, x + 420 - hillOff, h * 0.42);
    }
    ctx.lineTo(w, h * 0.42); ctx.closePath(); ctx.fill();
    // mặt đường + vạch kẻ trôi theo tốc độ xe
    ctx.fillStyle = "#6c757d"; ctx.fillRect(0, h * 0.42, w, h * 0.58);
    ctx.fillStyle = "#ffd60a"; ctx.fillRect(0, h * 0.42, w, 6);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    const dashOff = kraken.dist % 76;
    for (const fy of [0.56, 0.72, 0.88]) {
      for (let x = -76; x < w + 76; x += 76) ctx.fillRect(x - dashOff, h * fy, 44, 6);
    }
    // cột đích khi sắp tới nơi
    const finX = w * 0.26 + (P.raceDistPx - kraken.dist);
    if (finX < w + 60 && finX > -60) {
      ctx.fillStyle = "#22223b"; ctx.fillRect(finX, h * 0.30, 7, h * 0.68);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        ctx.fillStyle = (r + c) % 2 ? "#fff" : "#22223b";
        ctx.fillRect(finX + 7 + c * 13, h * 0.30 + r * 13, 13, 13);
      }
    }
  }

  let lastTs = null;
  function loop(ts) {
    if (done) return;
    const now = typeof ts === "number" ? ts : performance.now();
    const dt = lastTs == null ? 0 : Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now;
    const w = scene.clientWidth, h = scene.clientHeight;

    // xe Kraken: tốc độ tụt dần về tốc độ bò (nghĩ càng lâu càng chậm), khựng khi vừa sai
    const target = now < dipUntil ? P.crawlPxS * 0.55 : P.crawlPxS;
    kraken.v += (target - kraken.v) * (1 - Math.exp(-dt / P.decayTauS));
    kraken.dist += kraken.v * dt;
    for (const o of opps) {
      if (o.finishAt === null) {
        o.dist += o.speed * dt;
        if (o.dist >= P.raceDistPx) {
          o.dist = P.raceDistPx;
          o.finishAt = now;
          if (firstOppFinishAt === null) firstOppFinishAt = now;
        }
      }
    }

    // vị trí xe trên màn hình: camera bám theo Kraken (neo ở 26% chiều ngang)
    const anchorX = w * 0.26;
    const lanes = [0.80, 0.50, 0.65]; // tỉ lệ chiều cao cảnh cho Kraken, đối thủ 1, đối thủ 2
    krakenEl.style.left = anchorX + "px";
    krakenEl.style.top = (h * lanes[0] - 64) + "px";
    krakenEl.classList.toggle("boosting", now < boostUntil);
    oppEls.forEach((el, i) => {
      const x = anchorX + (opps[i].dist - kraken.dist);
      el.style.left = x + "px";
      el.style.top = (h * lanes[i + 1] - 64) + "px";
      el.style.visibility = x < -180 || x > w + 180 ? "hidden" : "visible";
    });
    const allDists = [kraken.dist, ...opps.map(o => o.dist)];
    markers.forEach((m, i) => { m.style.left = Math.min(100, allDists[i] / P.raceDistPx * 100) + "%"; });
    drawBackground(w, h);
    updateHud();

    window.__raceDebug = {
      placement: placementNow(), krakenDist: Math.round(kraken.dist),
      krakenSpeed: Math.round(kraken.v), answered: answered, firstTry: firstTry,
      oppDist: opps.map(o => Math.round(o.dist)), raceDist: P.raceDistPx
    };

    if (kraken.dist >= P.raceDistPx) { finishRace(now); return; }
    if (firstOppFinishAt !== null && now - firstOppFinishAt > 20000) { finishRace(now); return; }
    if (now - raceStart > 300000) { finishRace(now); return; }
    raf = requestAnimationFrame(loop);
  }

  function finishRace(now) {
    if (done) return;
    done = true;
    const krakenFinished = kraken.dist >= P.raceDistPx;
    const place = 1 + opps.filter(o => o.finishAt !== null && (!krakenFinished || o.finishAt <= now)).length;
    const placeScore = place === 1 ? 1 : place === 2 ? 0.65 : 0.4;
    const firstTryRatio = answered ? firstTry / answered : 0;
    const perf = 0.6 * placeScore + 0.4 * firstTryRatio;
    const stars = perf >= 0.8 ? 3 : perf >= 0.45 ? 2 : 1;
    kp.setEnabled(false);
    window.KrakenAudio.goal();
    const placeText = place === 1 ? "về NHẤT 🏆" : place === 2 ? "về NHÌ 🥈" : "về BA 🥉";
    timer = setTimeout(() => {
      api.complete(stars, {
        perf: perf, emoji: "🏎️",
        message: `Xe của Kraken ${placeText}! Con trả lời đúng ngay ${firstTry}/${answered} câu trên đường đua! 🏁`
      });
    }, 900);
  }

  newQuestion();
  raf = requestAnimationFrame(loop);

  return function cleanup() {
    done = true;
    if (raf) cancelAnimationFrame(raf);
    if (timer) clearTimeout(timer);
    window.removeEventListener("resize", sizeCanvas);
    kp.destroy();
    stage.classList.remove("race2-stage");
    if (window.__mathDebug && window.__mathDebug.id === "dua-xe-toan") delete window.__mathDebug;
    delete window.__raceDebug;
  };
}

window.KrakenRegistry.registerGame({
  id: "dua-xe-toan", island: "toan", icon: "🏎️",
  name: "Đua Xe Toán", skill: "Trả lời đúng để xe tăng tốc về đích",
  title: "Đua Xe Toán — Đảo Toán",
  instruction: "🏁 GÕ đáp án đúng để xe Kraken VỌT lên! Nghĩ lâu là xe chậm lại, bạn khác vượt đó!",
  start: startDuaXe
});
