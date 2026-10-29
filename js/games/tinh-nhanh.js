/* Tính Nhanh — game Đảo Toán (ES module, tự đăng ký vào KrakenRegistry).
   Hiện phép CỘNG/TRỪ trong phạm vi 100 (tham số theo công thức D ở js/difficulty.js),
   bé BẤM hoặc CHẠM vào đáp án đúng trong các nút to. Sai -> gợi ý nhẹ và chọn lại,
   không bao giờ "thua". Chạy tốt trên máy tính và iPad (chỉ dùng click, không hover/di chuột). */

const VEHICLES = [
  { svg: () => window.KrakenIcons.car("#e63946"), add: "Đoàn xe đón thêm bạn mới! 🚗", sub: "Một vài chiếc xe rời đoàn đi chơi! 🚗" },
  { svg: () => window.KrakenIcons.jet("#7f8ea3"), add: "Phi đội đón thêm máy bay chiến đấu! ✈️", sub: "Một vài máy bay bay đi làm nhiệm vụ! ✈️" },
  { svg: () => window.KrakenIcons.warship("#5b6b7f"), add: "Hạm đội có thêm tàu chiến về cảng! 🚢", sub: "Một vài tàu chiến ra khơi làm nhiệm vụ! 🚢" }
];

function startTinhNhanh(stage, api) {
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

  function pick(btn, value, q) {
    if (done || btn.disabled) return;
    if (value === q.answer) {
      window.KrakenAudio.pop();
      btn.classList.add("correct");
      choicesEl.querySelectorAll(".math-choice").forEach(x => { x.disabled = true; });
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
    const q = window.KrakenMath.makeAddSub(P);
    const v = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
    chipIcon.innerHTML = v.svg();
    chipLabel.textContent = q.op === "+" ? v.add : v.sub;
    eqEl.innerHTML = `<span>${q.a}</span><span class="math-op">${q.op === "+" ? "+" : "−"}</span><span>${q.b}</span><span class="math-op">=</span><span class="math-q">?</span>`;
    choicesEl.innerHTML = "";
    for (const value of window.KrakenMath.makeChoices(q.answer, P.choices, P.distGap)) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "math-choice";
      b.textContent = value;
      b.addEventListener("click", () => pick(b, value, q));
      choicesEl.appendChild(b);
    }
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
    stage.classList.remove("math-stage");
    if (window.__mathDebug && window.__mathDebug.id === "tinh-nhanh") delete window.__mathDebug;
  };
}

window.KrakenRegistry.registerGame({
  id: "tinh-nhanh", island: "toan", icon: "🚀",
  name: "Tính Nhanh", skill: "Cộng trừ trong phạm vi 100",
  title: "Tính Nhanh — Đảo Toán",
  instruction: "👆 Nhìn phép tính rồi CHẠM vào đáp án đúng nhé!",
  start: startTinhNhanh
});
