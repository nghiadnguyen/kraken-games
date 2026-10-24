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
  // khung thành co giãn theo sân (CSS %): đo trực tiếp từ vị trí thật của .goal so với sân
  function goalRect() {
    const gr = goalEl.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    return { left: gr.left - sr.left, top: gr.top - sr.top, width: gr.width, height: gr.height };
  }
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

  /* ===== Ăn mừng SIUUU (chỉ khi thắng): Ronaldo chạy -> trượt cỏ -> overlay -> hoàn thành =====
     Timeline bằng requestAnimationFrame, vị trí tính theo tỉ lệ sân (co giãn theo responsive stage).
     Bấm vào sân bất cứ lúc nào = bỏ qua, vào thẳng màn hoàn thành. api.complete chỉ gọi đúng 1 lần. */
  const ACTOR_W = 200, ACTOR_H = 160;
  let celebRaf = null, celebEls = [], celebOverlay = null, celebrating = false, celebDone = false;

  function winComplete() {
    if (celebDone) return;
    celebDone = true;
    api.complete(3, { goals: goals, needGoals: NEED_GOALS, emoji: "🏆", title: "SIUUU! Ronaldo vô địch!", message: `Tiền đạo Ronaldo số 7 đã ghi ${goals}/${TOTAL_SHOTS} bàn thắng!` });
  }
  function teardownCeleb() {
    celebrating = false;
    if (celebRaf) { cancelAnimationFrame(celebRaf); celebRaf = null; }
    celebEls.forEach(el => el.remove()); celebEls = [];
    if (celebOverlay) { celebOverlay.remove(); celebOverlay = null; }
    stage.removeEventListener("pointerdown", onSkipCeleb);
  }
  function onSkipCeleb() {
    if (!celebrating) return;
    teardownCeleb();
    winComplete();
  }
  function startCelebration() {
    celebrating = true; celebDone = false;
    stage.addEventListener("pointerdown", onSkipCeleb);
    const W = stage.clientWidth, H = stage.clientHeight;
    const groundBottom = 12;                    // chân/gối cách đáy sân
    const groundY = H - groundBottom;           // y mặt cỏ (tọa độ sân)
    const runFrom = W * 0.30, runTo = W * 0.72; // tâm nhân vật: chạy 30% -> 72%
    const slideDist = W * 0.13;                 // trượt thêm 13% bề ngang
    const RUN_MS = 1400, SLIDE_MS = 1200, HOLD_MS = 1600;
    const kneeOff = ACTOR_W * 0.68;             // vị trí đầu gối trong khung nhân vật khi trượt

    const strikerEl = stage.querySelector("#l5-striker");
    if (strikerEl) strikerEl.style.visibility = "hidden";
    ball.style.visibility = "hidden";
    const powerWrap = stage.querySelector(".power-wrap");
    if (powerWrap) { powerWrap.style.transition = "opacity .4s"; powerWrap.style.opacity = "0.3"; }

    const skid = document.createElement("div");
    skid.className = "skid"; skid.style.opacity = "0";
    stage.appendChild(skid); celebEls.push(skid);

    const actor = document.createElement("div");
    actor.className = "celeb-actor";
    actor.innerHTML = window.KrakenIcons.ronaldoRun();
    actor.style.left = (runFrom - ACTOR_W / 2) + "px";
    actor.style.top = (groundY - ACTOR_H) + "px";
    stage.appendChild(actor); celebEls.push(actor);

    const particles = [];
    function spawnGrass() {
      const kx = runTo - ACTOR_W / 2 + kneeOff, ky = groundY - 4;
      const greens = ["#2d6a4f", "#40916c", "#52b788", "#74c69d"];
      for (let i = 0; i < 26; i++) {
        const el = document.createElement("div");
        el.className = "grass-bit";
        const s = 5 + Math.random() * 6;
        el.style.width = s + "px"; el.style.height = (s * 0.6) + "px";
        el.style.background = greens[i % greens.length];
        el.style.left = kx + "px"; el.style.top = ky + "px";
        stage.appendChild(el); celebEls.push(el);
        particles.push({
          el, x: kx, y: ky,
          vx: -(30 + Math.random() * 150), vy: -(60 + Math.random() * 210),
          age: 0, life: 0.7 + Math.random() * 0.45
        });
      }
    }
    function updateParticles(dt) {
      for (const p of particles) {
        if (p.age >= p.life) continue;
        p.age += dt;
        if (p.age >= p.life) { p.el.remove(); continue; }
        p.vy += 720 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.el.style.left = p.x + "px"; p.el.style.top = p.y + "px";
        p.el.style.opacity = String(Math.max(0, 1 - p.age / p.life));
        p.el.style.transform = `rotate(${p.age * 260}deg)`;
      }
    }

    let slid = false, overlayShown = false, lastNow = null;
    const tStart = performance.now();
    function celebFrame(now) {
      if (!celebrating) return;
      const dt = lastNow == null ? 0.016 : Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;
      const t = now - tStart;
      if (t < RUN_MS) {
        const p = t / RUN_MS;
        const e = Math.pow(p, 1.6);                       // tăng tốc dần (ease-in)
        const cx = runFrom + (runTo - runFrom) * e;
        const bob = -Math.abs(Math.sin(t / 95)) * 10;     // nhún theo nhịp chạy
        const rock = Math.sin(t / 95) * 3;
        actor.style.left = (cx - ACTOR_W / 2) + "px";
        actor.style.top = (groundY - ACTOR_H + bob) + "px";
        actor.style.transform = `rotate(${rock}deg)`;
      } else if (t < RUN_MS + SLIDE_MS) {
        if (!slid) {
          slid = true;
          actor.classList.add("slide");
          actor.innerHTML = window.KrakenIcons.ronaldoSlide();
          actor.style.transform = "rotate(0deg)";
          actor.style.top = (groundY - ACTOR_H) + "px";
          window.KrakenAudio.whoosh();
          window.KrakenAudio.jingle();
          skid.style.left = (runTo - ACTOR_W / 2 + kneeOff) + "px";
          skid.style.top = (groundY - 4) + "px";
          skid.style.width = "8px";
          skid.style.opacity = "1";
          spawnGrass();
        }
        const p = (t - RUN_MS) / SLIDE_MS;
        const e = 1 - Math.pow(1 - p, 3);                 // easeOutCubic: trượt chậm dần
        const cx = runTo + slideDist * e;
        actor.style.left = (cx - ACTOR_W / 2) + "px";
        skid.style.width = (slideDist * e + 14) + "px";
      } else if (t < RUN_MS + SLIDE_MS + HOLD_MS) {
        if (!overlayShown) {
          overlayShown = true;
          celebOverlay = document.createElement("div");
          celebOverlay.className = "siuuu";
          celebOverlay.innerHTML = `<div class="cup">🏆</div><div class="big">SIUUU!</div><div class="sub">Ronaldo ghi ${goals} bàn và giành Cúp Vàng! ⚽</div>`;
          stage.appendChild(celebOverlay);
        }
      } else {
        teardownCeleb();
        winComplete();
        return;
      }
      updateParticles(dt);
      celebRaf = requestAnimationFrame(celebFrame);
    }
    celebRaf = requestAnimationFrame(celebFrame);
  }

  function finish() {
    done = true;
    if (goals >= NEED_GOALS) {
      startCelebration();
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
    teardownCeleb();
    if (raf) cancelAnimationFrame(raf);
    stage.removeEventListener("pointermove", onMove);
    stage.removeEventListener("pointerdown", onDown);
    stage.removeEventListener("pointerup", onUp);
    stage.classList.remove("pitch-stage");
  };
};
