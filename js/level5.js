/* Màn 5 — Kraken TIỀN ĐẠO số 7 sút phạt: ngắm bằng chuột, giữ nạp lực, thả để sút */
window.KrakenLevel5 = function (stage, api) {
  const P = api.params;
  const TOTAL_SHOTS = P.shots, NEED_GOALS = P.needGoals;
  let shots = 0, goals = 0, done = false, raf = null;
  let charging = false, power = 0, shooting = false;
  let aim = { x: 0, y: 120 }, keeperX = 0, t0 = performance.now();

  stage.classList.add("pitch-stage");
  stage.innerHTML = `
    <div class="goal" id="l5-goal"><div class="keeper" id="l5-keeper">${window.KrakenIcons.goalkeeper()}</div></div>
    <div class="aim" id="l5-aim">🎯</div>
    <div class="ball" id="l5-ball">⚽</div>
    <div class="striker" id="l5-striker">${window.KrakenIcons.striker()}</div>
    <div class="power-wrap">
      <div class="power-label">Lực sút 💪</div>
      <div class="power-bar" id="l5-powerbar"><div class="power-fill" id="l5-power"></div></div>
      <div class="power-zones"><span>Nhẹ</span><span>XANH = ĐẸP!</span><span>Mạnh quá!</span></div>
    </div>`;
  const goalEl = stage.querySelector("#l5-goal");
  const keeper = stage.querySelector("#l5-keeper");
  const aimEl = stage.querySelector("#l5-aim");
  const ball = stage.querySelector("#l5-ball");
  const powerFill = stage.querySelector("#l5-power");
  // vùng lực vẽ theo công thức của cấp hiện tại: vàng (nhẹ) → XANH (đẹp) → đỏ (quá mạnh)
  stage.querySelector("#l5-powerbar").style.background =
    `linear-gradient(90deg, #ffe66d 0 ${P.greenLow}%, #80ed99 ${P.greenLow}% ${P.greenHigh}%, #ef476f ${P.greenHigh}% 100%)`;
  let ballHome = null;

  function updateHud() { api.hud.textContent = `⚽ Quả ${Math.min(shots + 1, TOTAL_SHOTS)}/${TOTAL_SHOTS} • Vào: ${goals} • Cần vào: ${NEED_GOALS}`; }
  function goalRect() { return { left: stage.clientWidth * 0.19, width: stage.clientWidth * 0.62, top: 36, height: 300 }; }
  function resetBall() {
    ball.style.transition = "none";
    ball.style.left = "50%"; ball.style.top = ""; ball.style.bottom = "64px";
    ball.style.transform = "translateX(-50%) scale(1)"; ball.style.opacity = "1";
    const r = ball.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    ballHome = { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2 };
  }
  updateHud();
  requestAnimationFrame(resetBall);
  aim = { x: stage.clientWidth / 2, y: 150 };

  function loop(now) {
    if (done) return;
    const g = goalRect();
    const t = (now - t0) / 1000;
    keeperX = g.left + g.width / 2 + Math.sin(t * P.keeperSpeed) * g.width * P.keeperAmpFrac;
    keeper.style.left = (keeperX - g.left) + "px";
    if (charging) {
      power = Math.min(100, power + P.chargeRate);
      powerFill.style.width = (100 - power) + "%";
    }
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  function onMove(e) {
    const r = stage.getBoundingClientRect();
    const g = goalRect();
    aim.x = Math.max(g.left + 30, Math.min(g.left + g.width - 30, e.clientX - r.left));
    aim.y = Math.max(g.top + 30, Math.min(g.top + g.height - 20, e.clientY - r.top));
    aimEl.style.left = aim.x + "px"; aimEl.style.top = aim.y + "px";
  }
  function onDown(e) {
    if (done || shooting) return;
    window.KrakenAudio.unlock();
    charging = true; power = 0; powerFill.style.width = "100%";
  }
  function onUp() {
    if (!charging || done || shooting) return;
    charging = false; shooting = true;
    shoot();
  }

  function shoot() {
    window.KrakenAudio.kick();
    const over = power > P.greenHigh;
    const tooWeak = power < P.greenLow;
    // vùng bắt bóng của thủ môn theo công thức (sút yếu thì vùng bắt còn rộng hơn)
    const saved = !over && Math.abs(aim.x - keeperX) < (tooWeak ? P.weakSaveRadius : P.saveRadius);
    const isGoal = !over && !saved;
    const target = over ? { x: aim.x, y: 6 } : { x: aim.x, y: aim.y };
    ball.style.transition = "all .38s ease-in";
    ball.style.left = target.x + "px"; ball.style.bottom = "";
    ball.style.top = (target.y - 30) + "px";
    ball.style.transform = "translateX(-50%) scale(.55)";
    setTimeout(() => {
      shots++;
      const sr = stage.getBoundingClientRect();
      if (isGoal) {
        goals++;
        window.KrakenAudio.goal();
        window.Kraken.floatText(stage, target.x, Math.max(60, target.y - 40), "VÀO RỒI! ⚽🎉");
      } else if (over) {
        window.KrakenAudio.gentle();
        window.Kraken.floatText(stage, sr.width / 2, 90, "Ối! Mạnh quá bay qua xà rồi! 😆");
      } else {
        window.KrakenAudio.gentle();
        window.Kraken.floatText(stage, target.x, Math.max(60, target.y - 40), "Thủ môn bắt được! Thử góc khác nhé! 💪");
      }
      updateHud();
      setTimeout(() => {
        shooting = false; power = 0; powerFill.style.width = "100%";
        resetBall();
        if (shots >= TOTAL_SHOTS && !done) finish();
      }, 650);
    }, 420);
  }

  function finish() {
    done = true;
    if (goals >= NEED_GOALS) {
      const overlay = document.createElement("div");
      overlay.className = "siuuu";
      overlay.innerHTML = `<div class="cup">🏆</div><div class="big">SIUUU!</div><div class="sub">Ronaldo ghi ${goals} bàn và giành Cúp Vàng! ⚽</div>`;
      stage.appendChild(overlay);
      window.KrakenAudio.jingle();
      setTimeout(() => api.complete(3, { goals: goals, needGoals: NEED_GOALS, emoji: "🏆", title: "SIUUU! Ronaldo vô địch!", message: `Tiền đạo Ronaldo số 7 đã ghi ${goals}/${TOTAL_SHOTS} bàn thắng!` }), 3000);
    } else {
      const stars = goals >= NEED_GOALS - 1 ? 2 : 1;
      setTimeout(() => api.complete(stars, { goals: goals, needGoals: NEED_GOALS, emoji: "⚽", title: "Kraken sút rất cố gắng!", message: `Con ghi được ${goals}/${TOTAL_SHOTS} bàn. Chơi lại để ghi ${NEED_GOALS} bàn giành Cúp Vàng nhé!` }), 500);
    }
  }

  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointerup", onUp);
  onMove({ clientX: stage.getBoundingClientRect().left + stage.clientWidth / 2, clientY: stage.getBoundingClientRect().top + 150 });

  return function cleanup() {
    done = true;
    if (raf) cancelAnimationFrame(raf);
    stage.removeEventListener("pointermove", onMove);
    stage.removeEventListener("pointerdown", onDown);
    stage.removeEventListener("pointerup", onUp);
    stage.classList.remove("pitch-stage");
  };
};
