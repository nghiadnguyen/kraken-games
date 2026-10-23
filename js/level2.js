/* Màn 2 — Click: bấm vào thùng hàng cứu trợ thả dù từ máy bay trước khi chạm nước
   Độ khó theo công thức (api.params): tốc độ rơi, nhịp thả, mục tiêu, lắc gió, rơi đôi. */
window.KrakenLevel2 = function (stage, api) {
  const P = api.params;
  const GOAL = P.goal;
  let caught = 0, missed = 0, done = false, raf = null, spawnTimer = null;
  const crates = [];

  stage.classList.add("sky-stage");
  stage.innerHTML = `
    <div class="sky-plane" id="l2-plane">✈️</div>
    <div class="sky-ship" id="l2-ship">${window.KrakenIcons.warship()}</div>`;
  const plane = stage.querySelector("#l2-plane");
  const ship = stage.querySelector("#l2-ship");
  ship.style.left = "42%";
  let planeX = -120, planeDir = 1;

  function updateHud() { api.hud.textContent = `📦 Đã hứng: ${caught}/${GOAL}`; }
  updateHud();

  function randX() { return window.Kraken.rand(70, Math.max(120, stage.clientWidth - 70)); }

  function createCrate(baseX) {
    if (done) return;
    const el = document.createElement("div");
    el.className = "crate";
    el.innerHTML = `<span class="chute">🪂</span><span class="box">📦</span>`;
    const crate = {
      el: el, baseX: baseX, x: baseX, y: -30, age: 0,
      speed: window.Kraken.rand(P.speedBase * 0.85, P.speedBase * 1.3),
      swayFreq: window.Kraken.rand(0.025, 0.05), got: false
    };
    el.style.left = crate.x + "px";
    el.style.top = crate.y + "px";
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (crate.got || done) return;
      crate.got = true;
      window.KrakenAudio.catchIt();
      el.classList.add("crate-caught");
      const sr = stage.getBoundingClientRect();
      window.Kraken.floatText(stage, crate.x, crate.y + 40, "Hứng được rồi! 🎉");
      el.style.left = (sr.width * 0.47) + "px";
      el.style.top = (sr.height - 130) + "px";
      el.style.opacity = "0.2";
      el.style.transform = "translate(-50%,0) scale(.5)";
      setTimeout(() => el.remove(), 480);
      caught++; updateHud();
      if (caught >= GOAL) {
        done = true;
        const stars = missed <= 3 ? 3 : missed <= 7 ? 2 : 1;
        const perf = (caught + missed) > 0 ? caught / (caught + missed) : 1;
        setTimeout(() => api.complete(stars, { perf: perf, message: `Kraken đã hứng đủ ${GOAL} thùng hàng cho tàu chiến! Giỏi lắm! 🚢` }), 600);
      }
    });
    stage.appendChild(el);
    crates.push(crate);
  }

  function spawnCycle() {
    if (done) return;
    const x1 = randX();
    createCrate(x1);
    if (P.doubleChance > 0 && Math.random() < P.doubleChance) {
      let x2 = randX(), tries = 0;
      while (Math.abs(x2 - x1) < 130 && tries++ < 6) x2 = randX();
      createCrate(x2);
    }
    const delay = window.Kraken.rand(P.spawnBaseMs * 0.6, P.spawnBaseMs * 1.05);
    spawnTimer = setTimeout(spawnCycle, delay);
  }

  function loop() {
    const w = stage.clientWidth, h = stage.clientHeight;
    planeX += planeDir * 1.4;
    if (planeX > w + 60) { planeDir = -1; plane.style.transform = "scaleX(-1)"; }
    if (planeX < -140) { planeDir = 1; plane.style.transform = "scaleX(1)"; }
    plane.style.left = planeX + "px"; plane.style.top = "12px";

    for (let i = crates.length - 1; i >= 0; i--) {
      const c = crates[i];
      if (c.got) { crates.splice(i, 1); continue; }
      c.age++;
      c.y += c.speed;
      c.x = c.baseX + (P.swayAmpPx > 0 ? Math.sin(c.age * c.swayFreq * 2.4) * P.swayAmpPx : 0);
      c.el.style.left = c.x + "px";
      c.el.style.top = c.y + "px";
      if (c.y > h * 0.52 + 60) { // chạm nước
        missed++;
        const splash = document.createElement("div");
        splash.className = "splash"; splash.textContent = "💦";
        splash.style.left = (c.x - 20) + "px"; splash.style.top = (h * 0.52 + 30) + "px";
        stage.appendChild(splash);
        setTimeout(() => splash.remove(), 800);
        window.KrakenAudio.gentle();
        window.Kraken.floatText(stage, c.x, h * 0.52, "Không sao, thùng khác tới nè! 💙");
        c.el.remove();
        crates.splice(i, 1);
      }
    }
    if (!done) raf = requestAnimationFrame(loop);
  }
  loop();
  spawnTimer = setTimeout(spawnCycle, 500);

  return function cleanup() {
    done = true;
    if (raf) cancelAnimationFrame(raf);
    if (spawnTimer) clearTimeout(spawnTimer);
    stage.classList.remove("sky-stage");
  };
};
