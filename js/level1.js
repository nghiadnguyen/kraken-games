/* Màn 1 — Di chuột: Kraken bơi theo chuột, chạm vào bong bóng / vỏ sò / kho báu
   Độ khó theo công thức (api.params): số món, cỡ món, tỉ lệ món trôi + tốc độ trôi. */
window.KrakenLevel1 = function (stage, api) {
  const P = api.params;
  const TOTAL = P.count, MAX_ON_SCREEN = 6;
  const ITEMS = ["🫧", "🫧", "🐚", "⭐", "🪙", "💎", "🐠", "🦀"];
  let collected = 0, spawned = 0, done = false, raf = null;
  let mouseX = stage.clientWidth / 2, mouseY = stage.clientHeight / 2;
  let kx = mouseX, ky = mouseY;
  const items = []; // {el,x,y,vx,vy,moving,got}
  const t0 = performance.now();

  stage.classList.add("sea-stage");
  stage.innerHTML = `
    <div class="sea-surface"><span>🚢 Tàu chiến của Kraken</span><span>☀️</span></div>
    <div class="sea-floor"><span>🪸</span><span>🧰 Kho báu</span><span>🪸</span><span>⚓</span><span>🪸</span></div>
    <div class="kraken-friend" id="l1-kraken">🐙</div>`;
  const kraken = stage.querySelector("#l1-kraken");

  function updateHud() { api.hud.textContent = `🫧 Đã nhặt: ${collected}/${TOTAL}`; }
  updateHud();

  function spawnItem() {
    if (done || spawned >= TOTAL) return;
    spawned++;
    const el = document.createElement("div");
    el.className = "sea-item";
    el.textContent = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    el.style.fontSize = P.sizePx + "px";
    const w = stage.clientWidth, h = stage.clientHeight;
    const size = P.sizePx + 16;
    const it = {
      el: el, got: false,
      x: window.Kraken.rand(20, Math.max(60, w - 40 - size)),
      y: window.Kraken.rand(95, Math.max(140, h - 80 - size)),
      moving: P.moveSpeed > 0 && Math.random() < P.movingFrac,
      vx: 0, vy: 0
    };
    if (it.moving) {
      const ang = Math.random() * Math.PI * 2;
      it.vx = Math.cos(ang) * P.moveSpeed;
      it.vy = Math.sin(ang) * P.moveSpeed;
    }
    el.style.left = it.x + "px";
    el.style.top = it.y + "px";
    el.addEventListener("pointerenter", () => collect(it));
    stage.appendChild(el);
    items.push(it);
  }
  function collect(it) {
    if (done || it.got) return;
    it.got = true;
    const el = it.el;
    window.KrakenAudio.pop();
    el.classList.add("collected-pop");
    window.Kraken.floatText(stage, it.x + 30, it.y, "🎉 +1");
    setTimeout(() => el.remove(), 280);
    collected++; updateHud();
    if (collected >= TOTAL) {
      done = true;
      const actualSec = Math.max(1, (performance.now() - t0) / 1000);
      const parTime = 10 + TOTAL * 1.6;
      const perf = Math.max(0, Math.min(1, parTime / actualSec));
      setTimeout(() => api.complete(3, { perf: perf, message: "Con đã nhặt hết kho báu dưới biển! Kraken bơi rất khéo! 🐙" }), 500);
    } else {
      setTimeout(spawnItem, 250);
      if (items.filter(i => !i.got).length < 3) setTimeout(spawnItem, 450);
    }
  }

  function onMove(e) {
    const r = stage.getBoundingClientRect();
    mouseX = e.clientX - r.left; mouseY = e.clientY - r.top;
  }
  stage.addEventListener("pointermove", onMove);

  function loop() {
    kx += (mouseX - kx) * 0.16; ky += (mouseY - ky) * 0.16;
    kraken.style.left = kx + "px"; kraken.style.top = ky + "px";
    // món trôi: di chuyển + nảy tường trong vùng nước
    const w = stage.clientWidth, h = stage.clientHeight, size = P.sizePx + 16;
    for (const it of items) {
      if (it.got || !it.moving) continue;
      it.x += it.vx; it.y += it.vy;
      if (it.x < 8) { it.x = 8; it.vx = Math.abs(it.vx); }
      if (it.x > w - size - 8) { it.x = w - size - 8; it.vx = -Math.abs(it.vx); }
      if (it.y < 88) { it.y = 88; it.vy = Math.abs(it.vy); }
      if (it.y > h - size - 64) { it.y = h - size - 64; it.vy = -Math.abs(it.vy); }
      it.el.style.left = it.x + "px"; it.el.style.top = it.y + "px";
    }
    raf = requestAnimationFrame(loop);
  }
  loop();
  for (let i = 0; i < MAX_ON_SCREEN; i++) setTimeout(spawnItem, i * 180);

  return function cleanup() {
    done = true;
    stage.removeEventListener("pointermove", onMove);
    if (raf) cancelAnimationFrame(raf);
    stage.classList.remove("sea-stage");
  };
};
