/* Tìm Số Bí Ẩn — game Đảo Toán (ES module, tự đăng ký vào KrakenRegistry).
   Phương trình thiếu một số: a + ? = c, ? + b = c, a − ? = c, ? − b = c (phạm vi 100,
   tham số theo công thức D ở js/difficulty.js, kiểu vị trí thiếu mở dần theo cấp).
   Bé BẤM hoặc CHẠM vào số đúng. Sai -> gợi ý phép tính ngược và chọn lại, không bao giờ "thua".
   Chạy tốt trên máy tính và iPad (chỉ dùng click, không hover/di chuột). */

const VEHICLES = [
  { svg: () => window.KrakenIcons.car("#3a86ff"), label: "Thám tử Kraken điều tra cùng đoàn xe!" },
  { svg: () => window.KrakenIcons.jet("#7f8ea3"), label: "Thám tử Kraken điều tra cùng phi đội!" },
  { svg: () => window.KrakenIcons.warship("#5b6b7f"), label: "Thám tử Kraken điều tra cùng hạm đội!" }
];

function startSoBiAn(stage, api) {
  const P = api.params;
  const TOTAL = P.questions;
  let qIndex = 0, firstTry = 0, wrongThisQ = false, done = false, timer = null;

  stage.classList.add("math-stage");
  stage.innerHTML = `
    <div class="math-wrap">
      <div class="math-chip"><span class="math-chip-icon"></span><span class="math-chip-label"></span></div>
      <div class="math-eq"></div>
      <div class="math-choices"></div>
      <div class="math-hint"></div>
    </div>`;
  const chipIcon = stage.querySelector(".math-chip-icon");
  const chipLabel = stage.querySelector(".math-chip-label");
  const eqEl = stage.querySelector(".math-eq");
  const choicesEl = stage.querySelector(".math-choices");
  const hintEl = stage.querySelector(".math-hint");

  function updateHud() {
    api.hud.textContent = `🔍 Câu ${Math.min(qIndex + 1, TOTAL)}/${TOTAL} · Đúng ngay: ${firstTry}`;
  }

  function equationHtml(q) {
    const blank = `<span class="math-blank">?</span>`;
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

  function pick(btn, value, q) {
    if (done || btn.disabled) return;
    if (value === q.missing) {
      window.KrakenAudio.pop();
      btn.classList.add("correct");
      choicesEl.querySelectorAll(".math-choice").forEach(x => { x.disabled = true; });
      const blankEl = eqEl.querySelector(".math-blank");
      if (blankEl) { blankEl.textContent = q.missing; blankEl.classList.add("found"); }
      if (!wrongThisQ) firstTry++;
      window.Kraken.floatText(stage, stage.clientWidth / 2, stage.clientHeight * 0.28);
      qIndex++;
      updateHud();
      timer = setTimeout(nextQuestion, 900);
    } else {
      wrongThisQ = true;
      window.KrakenAudio.gentle();
      btn.classList.add("wrong");
      btn.disabled = true;
      hintEl.textContent = hintFor(q);
    }
  }

  function nextQuestion() {
    if (done) return;
    if (qIndex >= TOTAL) { finish(); return; }
    wrongThisQ = false;
    hintEl.textContent = "";
    const q = window.KrakenMath.makeMissing(P);
    const v = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
    chipIcon.innerHTML = v.svg();
    chipLabel.textContent = v.label;
    eqEl.innerHTML = equationHtml(q);
    choicesEl.innerHTML = "";
    for (const value of window.KrakenMath.makeChoices(q.missing, P.choices, P.distGap)) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "math-choice";
      b.textContent = value;
      b.addEventListener("click", () => pick(b, value, q));
      choicesEl.appendChild(b);
    }
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
    stage.classList.remove("math-stage");
    if (window.__mathDebug && window.__mathDebug.id === "so-bi-an") delete window.__mathDebug;
  };
}

window.KrakenRegistry.registerGame({
  id: "so-bi-an", island: "toan", icon: "🔍",
  name: "Tìm Số Bí Ẩn", skill: "Tìm số còn thiếu trong phép cộng/trừ",
  title: "Tìm Số Bí Ẩn — Đảo Toán",
  instruction: "👆 Tìm xem số bí ẩn ? là số mấy rồi CHẠM vào đáp án đúng nhé!",
  start: startSoBiAn
});
