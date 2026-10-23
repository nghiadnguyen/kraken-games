/* Màn 1 — Di chuột: Kraken bơi theo chuột, chạm vào bong bóng / vỏ sò / kho báu */
window.KrakenLevel1 = function (stage, api) {
  const TOTAL = 20, MAX_ON_SCREEN = 6;
  const ITEMS = ["🫧", "🫧", "🐚", "⭐", "🪙", "💎", "🐠", "🦀"];
  let collected = 0, spawned = 0, done = false, raf = null;
  let mouseX = stage.clientWidth / 2, mouseY = stage.clientHeight / 2;
  let kx = mouseX, ky = mouseY;

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
    const w = stage.clientWidth, h = stage.clientHeight;
    el.style.left = window.Kraken.rand(20, Math.max(60, w - 120)) + "px";
    el.style.top = window.Kraken.rand(95, Math.max(140, h - 160)) + "px";
    el.addEventListener("pointerenter", () => collect(el));
    stage.appendChild(el);
  }
  function collect(el) {
    if (done || el.dataset.got) return;
    el.dataset.got = "1";
    window.KrakenAudio.pop();
    el.classList.add("collected-pop");
    const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    window.Kraken.floatText(stage, r.left - sr.left + 30, r.top - sr.top, "🎉 +1");
    setTimeout(() => el.remove(), 280);
    collected++; updateHud();
    if (collected >= TOTAL) {
      done = true;
      setTimeout(() => api.complete(3, { message: "Con đã nhặt hết kho báu dưới biển! Kraken bơi rất khéo! 🐙" }), 500);
    } else {
      setTimeout(spawnItem, 250);
      if (stage.querySelectorAll(".sea-item:not([data-got])").length < 3) setTimeout(spawnItem, 450);
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
