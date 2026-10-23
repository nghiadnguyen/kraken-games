/* Màn 2 — Click: bấm vào thùng hàng cứu trợ thả dù từ máy bay trước khi chạm nước */
window.KrakenLevel2 = function (stage, api) {
  const GOAL = 15;
  let caught = 0, missed = 0, done = false, raf = null, spawnTimer = null;
  const crates = [];

  stage.classList.add("sky-stage");
  stage.innerHTML = `
    <div class="sky-plane" id="l2-plane">✈️</div>
    <div class="sky-ship" id="l2-ship">🚢</div>`;
  const plane = stage.querySelector("#l2-plane");
  const ship = stage.querySelector("#l2-ship");
  ship.style.left = "42%";
  let planeX = -120, planeDir = 1;

  function updateHud() { api.hud.textContent = `📦 Đã hứng: ${caught}/${GOAL}`; }
  updateHud();

  function spawnCrate() {
    if (done) return;
    const el = document.createElement("div");
    el.className = "crate";
    el.innerHTML = `<span class="chute">🪂</span><span class="box">📦</span>`;
    const x = window.Kraken.rand(70, Math.max(120, stage.clientWidth - 70));
    el.style.left = x + "px";
    el.style.top = "-30px";
    const crate = { el, x, y: -30, speed: window.Kraken.rand(0.55, 0.95), got: false };
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
        setTimeout(() => api.complete(stars, { message: `Kraken đã hứng đủ ${GOAL} thùng hàng cho tàu chiến! Giỏi lắm! 🚢` }), 600);
      }
    });
    stage.appendChild(el);
    crates.push(crate);
    spawnTimer = setTimeout(spawnCrate, window.Kraken.rand(900, 1700));
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
      c.y += c.speed;
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
  spawnTimer = setTimeout(spawnCrate, 500);

  return function cleanup() {
    done = true;
    if (raf) cancelAnimationFrame(raf);
    if (spawnTimer) clearTimeout(spawnTimer);
    stage.classList.remove("sky-stage");
  };
};
