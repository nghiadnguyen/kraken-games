/* Tìm Số Bí Ẩn — game Đảo Toán (ES module, tự đăng ký vào KrakenRegistry).
   Phương trình thiếu một số: a + ? = c, ? + b = c, a − ? = c, ? − b = c (phạm vi 100,
   tham số theo công thức D ở js/difficulty.js, kiểu vị trí thiếu mở dần theo cấp).
   Bé TỰ GÕ số bí ẩn bằng bàn phím số trong game (hoặc phím thật) — không còn trắc nghiệm.
   Sai -> gợi ý phép tính ngược (sai lần 2 có mẹo tách số) và gõ lại, không bao giờ "thua".
   Chạy tốt trên máy tính và iPad (chạm/click + phím số, không hover). */
import { createKeypad, decomposeHint } from "./keypad.js";

const VEHICLES = [
  { svg: () => window.KrakenIcons.car("#3a86ff"), label: "Thám tử Kraken điều tra cùng đoàn xe!" },
  { svg: () => window.KrakenIcons.jet("#7f8ea3"), label: "Thám tử Kraken điều tra cùng phi đội!" },
  { svg: () => window.KrakenIcons.warship("#5b6b7f"), label: "Thám tử Kraken điều tra cùng hạm đội!" }
];

function startSoBiAn(stage, api) {
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
    api.hud.textContent = `🔍 Câu ${Math.min(qIndex + 1, TOTAL)}/${TOTAL} · Đúng ngay: ${firstTry}`;
  }

  function equationHtml(q) {
    const blank = `<span class="kp-anchor"></span>`;
    const op = q.op === "+" ? "+" : "−";
    const left = q.blank === "a" ? blank : `<span>${q.a}</span>`;
    const right = q.blank === "b" ? blank : `<span>${q.b}</span>`;
    return `${left}<span class="math-op">${op}</span>${right}<span class="math-op">=</span><span>${q.c}</span>`;
  }

  function hintFor(q) {
    switch (q.type) {
      case 0: return `Gợi ý: ? = ${q.c} − ${q.a} — lấy kết quả trừ đi số đã biết nhé 💙`;
      case 1: return `Gợi ý: ? = ${q.c} − ${q.b} — lấy kết quả trừ đi số đã biết nhé 💙`;
      case 2: return `Gợi ý: ? = ${q.a} − ${q.c} — lấy số đầu trừ đi kết quả nhé 💙`;
      default: return `Gợi ý: ? = ${q.c} + ${q.b} — cộng ngược lại nhé 💙`;
    }
  }

  /* Mẹo tách số cho phép tính NGƯỢC dùng để tìm số bí ẩn (theo từng kiểu vị trí thiếu). */
  function decomposeFor(q) {
    switch (q.type) {
      case 0: return decomposeHint(q.c, "-", q.a);
      case 1: return decomposeHint(q.c, "-", q.b);
      case 2: return decomposeHint(q.a, "-", q.c);
      default: return decomposeHint(q.c, "+", q.b);
    }
  }

  function submitAnswer(value) {
    if (done || !currentQ) return;
    const q = currentQ;
    if (value === q.missing) {
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
        ? (decomposeFor(q) || hintFor(q))
        : hintFor(q);
    }
  }

  function nextQuestion() {
    if (done) return;
    if (qIndex >= TOTAL) { finish(); return; }
    wrongThisQ = false;
    wrongCount = 0;
    hintEl.textContent = "";
    const q = window.KrakenMath.makeMissing(P);
    currentQ = q;
    const v = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
    chipIcon.innerHTML = v.svg();
    chipLabel.textContent = v.label;
    eqEl.innerHTML = equationHtml(q);
    const anchor = eqEl.querySelector(".kp-anchor");
    if (anchor) anchor.replaceWith(kp.slot);
    kp.slot.classList.remove("found");
    kp.clear();
    kp.setEnabled(true);
    window.__mathDebug = { id: "so-bi-an", answer: q.missing, q: qIndex + 1, total: TOTAL };
    updateHud();
  }

  function finish() {
    done = true;
    const perf = firstTry / TOTAL;
    const stars = perf >= 0.8 ? 3 : perf >= 0.45 ? 2 : 1;
    api.complete(stars, {
      perf: perf, emoji: "🔍",
      message: `Con tìm ra số bí ẩn đúng ngay ${firstTry}/${TOTAL} câu! Thám tử Kraken giỏi quá! 🕵️`
    });
  }

  nextQuestion();

  return function cleanup() {
    done = true;
    if (timer) clearTimeout(timer);
    kp.destroy();
    stage.classList.remove("math-stage");
    if (window.__mathDebug && window.__mathDebug.id === "so-bi-an") delete window.__mathDebug;
  };
}

window.KrakenRegistry.registerGame({
  id: "so-bi-an", island: "toan", icon: "🔍",
  name: "Tìm Số Bí Ẩn", skill: "Tìm số còn thiếu trong phép cộng/trừ — tự gõ đáp án",
  title: "Tìm Số Bí Ẩn — Đảo Toán",
  instruction: "⌨️ Tìm xem số bí ẩn ? là số mấy rồi GÕ vào bàn phím số nhé!",
  start: startSoBiAn
});
