/* Penalty Toán — game Đảo Toán (ES module, tự đăng ký vào KrakenRegistry).
   Mượn sân + thủ môn + ăn mừng SIUUU của Màn 5 nhưng sút bằng TOÁN:
   mỗi quả sút = 1 phép cộng/trừ phạm vi 100, gõ đáp án bằng bàn phím số dùng chung.
   - Gõ SAI: bóng bay ra ngoài luôn ("Trượt rồi!") — kèm đáp án đúng + mẹo để học, sút quả tiếp theo.
   - Gõ ĐÚNG: chọn 1 trong 3 góc khung thành để sút; thủ môn bay ngẫu nhiên 1 góc —
     bay đúng góc vẫn có thể bị cản (xác suất saveP theo công thức D), nhưng nếu bé
     TRẢ LỜI NHANH (dưới fastMs) thì saveP giảm một nửa: nghĩ nhanh thắng được thủ môn!
   Thắng (vào đủ needGoals/5) -> ăn mừng SIUUU như Màn 5. Không bao giờ "thua". */
import { createKeypad, decomposeHint } from "./keypad.js";

function startPenalty(stage, api) {
  const P = api.params;
  const TOTAL = P.shots;           // luôn 5 quả
  const NEED = P.needGoals;
  let shots = 0, goals = 0, firstTry = 0, done = false;
  let phase = "question";          // question -> aim -> anim
  let currentQ = null, qStart = 0, answerFast = false;
  let timers = [];
  let overlay = null;

  stage.classList.add("pen-stage");
  stage.innerHTML = `
    <div class="pen-wrap">
      <div class="pen-pitch">
        <div class="pen-goal">
          <div class="pen-keeper">${window.KrakenIcons.goalkeeper()}</div>
          <div class="pen-zones">
            <button type="button" class="pen-zone" data-zone="0">◀</button>
            <button type="button" class="pen-zone" data-zone="1">🎯</button>
            <button type="button" class="pen-zone" data-zone="2">▶</button>
          </div>
        </div>
        <div class="pen-ball">⚽</div>
      </div>
      <div class="math-bar pen-bar">
        <div class="math-eq pen-eq"></div>
        <div class="math-pad-holder"></div>
      </div>
      <div class="math-hint pen-hint"></div>
    </div>`;
  const pitch = stage.querySelector(".pen-pitch");
  const goalEl = stage.querySelector(".pen-goal");
  const keeperEl = stage.querySelector(".pen-keeper");
  const ballEl = stage.querySelector(".pen-ball");
  const eqEl = stage.querySelector(".pen-eq");
  const hintEl = stage.querySelector(".pen-hint");
  const zoneBtns = [...stage.querySelectorAll(".pen-zone")];

  const kp = createKeypad({ onSubmit: submitAnswer });
  stage.querySelector(".math-pad-holder").appendChild(kp.el);

  function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
  function updateHud() {
    api.hud.textContent = `⚽ Quả ${Math.min(shots + 1, TOTAL)}/${TOTAL} • Vào: ${goals} • Cần vào: ${NEED}`;
  }
  function hintFor(q) {
    if (q.op === "+") return q.carry
      ? "Cộng hàng đơn vị trước, nhớ thì cộng thêm 1 vào hàng chục nhé 💙"
      : "Thử cộng lại thật chậm nhé 💙";
    return q.carry
      ? "Hàng đơn vị trừ không được thì mượn 1 chục nhé 💙"
      : "Thử trừ lại thật chậm nhé 💙";
  }
  function pitchRect() { return pitch.getBoundingClientRect(); }
  function goalRect() {
    const g = goalEl.getBoundingClientRect(), p = pitchRect();
    return { left: g.left - p.left, top: g.top - p.top, width: g.width, height: g.height };
  }
  function resetBallAndKeeper() {
    ballEl.style.transition = "none";
    ballEl.style.left = "50%";
    ballEl.style.top = (pitch.clientHeight - 46) + "px";
    ballEl.style.transform = "translate(-50%,-50%) scale(1)";
    ballEl.style.opacity = "1";
    keeperEl.style.transition = "none";
    keeperEl.style.transform = "translateX(0) rotate(0deg)";
    void ballEl.offsetWidth;
    ballEl.style.transition = "all .45s ease-in";
    keeperEl.style.transition = "transform .35s ease-in";
  }

  function submitAnswer(value) {
    if (done || phase !== "question" || !currentQ) return;
    const q = currentQ;
    if (value === q.answer) {
      firstTry++;
      answerFast = (performance.now() - qStart) < P.fastMs;
      window.KrakenAudio.pop();
      kp.slot.classList.add("found");
      kp.setEnabled(false);
      phase = "aim";
      goalEl.classList.add("aiming");
      hintEl.textContent = answerFast
        ? "⚡ Trả lời siêu nhanh! Giờ CHẠM vào 1 góc khung thành để sút nhé!"
        : "Đúng rồi! Giờ CHẠM vào 1 góc khung thành để sút nhé! 🎯";
    } else {
      // gõ sai = sút trượt luôn, nhưng được xem đáp án đúng + mẹo để học cho quả sau
      phase = "anim";
      kp.setEnabled(false);
      window.KrakenAudio.gentle();
      const dec = decomposeHint(q.a, q.op, q.b);
      hintEl.textContent = `Đáp án đúng là ${q.answer} nhé! ${dec ? dec.replace("💡 Mẹo hay: ", "Mẹo: ") : hintFor(q)}`;
      const g = goalRect();
      const wideLeft = Math.random() < 0.5;
      ballEl.style.left = (wideLeft ? g.left - 40 : g.left + g.width + 40) + "px";
      ballEl.style.top = Math.max(8, g.top - 26) + "px";
      ballEl.style.transform = "translate(-50%,-50%) scale(.55) rotate(160deg)";
      window.Kraken.floatText(stage, stage.clientWidth / 2, 110, "Trượt rồi! 😆");
      later(() => { shots++; updateHud(); newShot(); }, 1150);
    }
    updateHud();
  }

  function shoot(zone) {
    if (done || phase !== "aim") return;
    phase = "anim";
    goalEl.classList.remove("aiming");
    hintEl.textContent = "";
    window.KrakenAudio.kick();
    const g = goalRect();
    const keeperZone = window.Kraken.randInt(0, 2);
    const saveP = answerFast ? P.saveP / 2 : P.saveP;
    const saved = keeperZone === zone && Math.random() < saveP;
    keeperEl.style.transform = `translateX(${(keeperZone - 1) * g.width * 0.30}px) rotate(${(keeperZone - 1) * 35}deg)`;
    const zx = g.left + g.width * (zone * 2 + 1) / 6;
    const zy = g.top + g.height * 0.45;
    if (saved) {
      ballEl.style.left = zx + "px";
      ballEl.style.top = zy + "px";
      ballEl.style.transform = "translate(-50%,-50%) scale(.6)";
      later(() => {
        window.KrakenAudio.gentle();
        window.Kraken.floatText(stage, stage.clientWidth / 2, 110, "Thủ môn bắt được! 🧤");
        ballEl.style.transition = "all .3s ease-in";
        ballEl.style.top = (zy + 74) + "px"; // bóng bị đẩy văng xuống
      }, 470);
    } else {
      goals++;
      ballEl.style.left = zx + "px";
      ballEl.style.top = zy + "px";
      ballEl.style.transform = "translate(-50%,-50%) scale(.55)";
      later(() => {
        window.KrakenAudio.goal();
        window.Kraken.floatText(stage, zx, Math.max(60, zy - 54), "VÀO RỒI! ⚽🎉");
      }, 470);
    }
    later(() => { shots++; updateHud(); newShot(); }, 1350);
    updateHud();
  }
  zoneBtns.forEach(b => b.addEventListener("click", () => { shoot(parseInt(b.getAttribute("data-zone"), 10)); b.blur(); }));

  function newShot() {
    if (done) return;
    if (shots >= TOTAL) { finish(); return; }
    phase = "question";
    goalEl.classList.remove("aiming");
    resetBallAndKeeper();
    const q = window.KrakenMath.makeAddSub(P);
    currentQ = q;
    qStart = performance.now();
    eqEl.innerHTML = `<span>${q.a}</span><span class="math-op">${q.op === "+" ? "+" : "−"}</span><span>${q.b}</span><span class="math-op">=</span>`;
    eqEl.appendChild(kp.slot);
    kp.slot.classList.remove("found");
    kp.clear();
    kp.setEnabled(true);
    hintEl.textContent = "";
    window.__mathDebug = { id: "penalty-toan", answer: q.answer, q: shots + 1, total: TOTAL };
    updateHud();
  }

  function finish() {
    done = true;
    phase = "done";
    kp.setEnabled(false);
    const perf = 0.5 * (goals / TOTAL) + 0.5 * (firstTry / TOTAL);
    const stars = perf >= 0.8 ? 3 : perf >= 0.45 ? 2 : 1;
    const win = goals >= NEED;
    const complete = () => {
      if (overlay) { overlay.remove(); overlay = null; }
      api.complete(stars, {
        perf: perf,
        emoji: win ? "🏆" : "⚽",
        title: win ? "SIUUU! Kraken vô địch!" : "Kraken sút rất cố gắng!",
        message: win
          ? `Con ghi ${goals}/${TOTAL} bàn và giành Cúp Vàng! Tính đúng ${firstTry}/${TOTAL} quả sút! ⚽`
          : `Con ghi được ${goals}/${TOTAL} bàn (cần ${NEED} bàn để vô địch). Tính đúng ${firstTry}/${TOTAL} quả — chơi lại nào! 💪`
      });
    };
    if (win) {
      window.KrakenAudio.jingle();
      overlay = document.createElement("div");
      overlay.className = "siuuu";
      overlay.innerHTML = `<div class="cup">🏆</div><div class="big">SIUUU!</div><div class="sub">Kraken ghi ${goals} bàn và giành Cúp Vàng! ⚽</div>`;
      pitch.appendChild(overlay);
      later(complete, 1600);
    } else {
      later(complete, 500);
    }
  }

  newShot();
  requestAnimationFrame(resetBallAndKeeper);

  return function cleanup() {
    done = true;
    timers.forEach(clearTimeout);
    timers = [];
    kp.destroy();
    if (overlay) { overlay.remove(); overlay = null; }
    stage.classList.remove("pen-stage");
    if (window.__mathDebug && window.__mathDebug.id === "penalty-toan") delete window.__mathDebug;
  };
}

window.KrakenRegistry.registerGame({
  id: "penalty-toan", island: "toan", icon: "⚽",
  name: "Penalty Toán", skill: "Tính đúng để sút, tính nhanh để thắng thủ môn",
  title: "Penalty Toán — Đảo Toán",
  instruction: "⚽ GÕ đúng đáp án rồi CHẠM vào góc khung thành để sút! Trả lời càng NHANH thủ môn càng khó bắt!",
  start: startPenalty
});
