/* Tính Nhanh — game Đảo Toán (ES module, tự đăng ký vào KrakenRegistry).
   Hiện phép CỘNG/TRỪ trong phạm vi 100 (tham số theo công thức D ở js/difficulty.js),
   bé TỰ GÕ đáp án bằng bàn phím số trong game (hoặc phím thật) — không còn trắc nghiệm.
   Sai -> gợi ý nhẹ (sai lần 2 có mẹo tách số) và gõ lại, không bao giờ "thua".
   Chạy tốt trên máy tính và iPad (chạm/click + phím số, không hover). */
import { createKeypad, decomposeHint } from "./keypad.js";

const VEHICLES = [
  { svg: () => window.KrakenIcons.car("#e63946"), add: "Đoàn xe đón thêm bạn mới! 🚗", sub: "Một vài chiếc xe rời đoàn đi chơi! 🚗" },
  { svg: () => window.KrakenIcons.jet("#7f8ea3"), add: "Phi đội đón thêm máy bay chiến đấu! ✈️", sub: "Một vài máy bay bay đi làm nhiệm vụ! ✈️" },
  { svg: () => window.KrakenIcons.warship("#5b6b7f"), add: "Hạm đội có thêm tàu chiến về cảng! 🚢", sub: "Một vài tàu chiến ra khơi làm nhiệm vụ! 🚢" }
];

function startTinhNhanh(stage, api) {
  const P = api.params;
  const TOTAL = P.questions;
  let qIndex = 0, firstTry = 0, wrongThisQ = false, wrongCount = 0, done = false, timer = null;
  let currentQ = null;

  stage.classList.add("math-stage");
  stage.innerHTML = `
    <div class="math-wrap">
      <div class="math-chip"><span class="math-chip-icon"></span><span class="math-chip-label"></span></div>
      <div class="math-main">
        <div class="math-eq"></div>
        <div class="math-pad-holder"></div>
      </div>
      <div class="math-hint"></div>
    </div>`;
  const chipIcon = stage.querySelector(".math-chip-icon");
  const chipLabel = stage.querySelector(".math-chip-label");
  const eqEl = stage.querySelector(".math-eq");
  const hintEl = stage.querySelector(".math-hint");

  const kp = createKeypad({ onSubmit: submitAnswer });
  stage.querySelector(".math-pad-holder").appendChild(kp.el);

  function updateHud() {
    api.hud.textContent = `🧮 Câu ${Math.min(qIndex + 1, TOTAL)}/${TOTAL} · Đúng ngay: ${firstTry}`;
  }

  function hintFor(q) {
    if (q.op === "+") return q.carry
      ? "Gần đúng rồi! Cộng hàng đơn vị trước, nhớ thì cộng thêm 1 vào hàng chục nhé 💙"
      : "Gần đúng rồi! Thử cộng lại thật chậm nhé 💙";
    return q.carry
      ? "Gần đúng rồi! Hàng đơn vị trừ không được thì mượn 1 chục nhé 💙"
      : "Gần đúng rồi! Thử trừ lại thật chậm nhé 💙";
  }

  function submitAnswer(value) {
    if (done || !currentQ) return;
    const q = currentQ;
    if (value === q.answer) {
      window.KrakenAudio.pop();
      kp.slot.classList.add("found");
      kp.setEnabled(false);
      if (!wrongThisQ) firstTry++;
      window.Kraken.floatText(stage, stage.clientWidth / 2, stage.clientHeight * 0.28);
      qIndex++;
      updateHud();
      timer = setTimeout(nextQuestion, 900);
    } else {
      wrongThisQ = true;
      wrongCount++;
      window.KrakenAudio.gentle();
      eqEl.classList.remove("shake");
      void eqEl.offsetWidth;
      eqEl.classList.add("shake");
      kp.clear();
      hintEl.textContent = wrongCount >= 2
        ? (decomposeHint(q.a, q.op, q.b) || hintFor(q))
        : hintFor(q);
    }
  }

  function nextQuestion() {
    if (done) return;
    if (qIndex >= TOTAL) { finish(); return; }
    wrongThisQ = false;
    wrongCount = 0;
    hintEl.textContent = "";
    const q = window.KrakenMath.makeAddSub(P);
    currentQ = q;
    const v = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
    chipIcon.innerHTML = v.svg();
    chipLabel.textContent = q.op === "+" ? v.add : v.sub;
    eqEl.innerHTML = `<span>${q.a}</span><span class="math-op">${q.op === "+" ? "+" : "−"}</span><span>${q.b}</span><span class="math-op">=</span>`;
    eqEl.appendChild(kp.slot);
    kp.slot.classList.remove("found");
    kp.clear();
    kp.setEnabled(true);
    window.__mathDebug = { id: "tinh-nhanh", answer: q.answer, q: qIndex + 1, total: TOTAL };
    updateHud();
  }

  function finish() {
    done = true;
    const perf = firstTry / TOTAL;
    const stars = perf >= 0.8 ? 3 : perf >= 0.45 ? 2 : 1;
    api.complete(stars, {
      perf: perf, emoji: "🚀",
      message: `Con tính đúng ngay ${firstTry}/${TOTAL} câu! Kraken tính nhanh siêu quá! 🧮`
    });
  }

  nextQuestion();

  return function cleanup() {
    done = true;
    if (timer) clearTimeout(timer);
    kp.destroy();
    stage.classList.remove("math-stage");
    if (window.__mathDebug && window.__mathDebug.id === "tinh-nhanh") delete window.__mathDebug;
  };
}

window.KrakenRegistry.registerGame({
  id: "tinh-nhanh", island: "toan", icon: "🚀",
  name: "Tính Nhanh", skill: "Cộng trừ trong phạm vi 100 — tự gõ đáp án",
  title: "Tính Nhanh — Đảo Toán",
  instruction: "⌨️ Nhìn phép tính rồi GÕ đáp án bằng bàn phím số nhé!",
  start: startTinhNhanh
});
