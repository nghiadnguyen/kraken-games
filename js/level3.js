/* Màn 3 — Kéo & thả: xếp ô tô / máy bay chiến đấu / tàu chiến về đúng nơi (pointer events) */
window.KrakenLevel3 = function (stage, api) {
  const I = window.KrakenIcons;
  const VEHICLES = [
    { icon: I.car("#e63946"), type: "car" }, { icon: I.car("#3a86ff"), type: "car" }, { icon: I.car("#ffbe0b"), type: "car" },
    { icon: I.jet("#7f8ea3"), type: "jet" }, { icon: I.jet("#2a9d8f"), type: "jet" }, { icon: I.jet("#e76f51"), type: "jet" },
    { icon: I.warship("#5b6b7f"), type: "ship" }, { icon: I.warship("#3a6ea5"), type: "ship" }, { icon: I.warship("#6a994e"), type: "ship" }
  ];
  const TOTAL = VEHICLES.length;
  let parked = 0, wrong = 0, done = false;

  stage.classList.add("sort-stage");
  stage.innerHTML = `
    <div class="sort-yard" id="l3-yard"></div>
    <div class="sort-zones">
      <div class="sort-zone" data-type="car"><span class="zone-icon">🏠</span><span class="zone-name">Ga-ra Ô Tô</span><div class="zone-parked"></div></div>
      <div class="sort-zone" data-type="jet"><span class="zone-icon">🛬</span><span class="zone-name">Đường Băng Trên Tàu Sân Bay</span><div class="zone-parked"></div></div>
      <div class="sort-zone" data-type="ship"><span class="zone-icon">⚓</span><span class="zone-name">Bến Cảng Tàu Chiến</span><div class="zone-parked"></div></div>
    </div>`;
  const yard = stage.querySelector("#l3-yard");
  const zones = Array.from(stage.querySelectorAll(".sort-zone"));

  function updateHud() { api.hud.textContent = `🚗 Đã xếp: ${parked}/${TOTAL}`; }
  updateHud();

  // xáo trộn vị trí xuất phát trong sân
  const shuffled = VEHICLES.slice().sort(() => Math.random() - 0.5);
  shuffled.forEach((v, i) => {
    const el = document.createElement("div");
    el.className = "drag-item";
    el.innerHTML = v.icon;
    el._svg = v.icon;
    el.dataset.type = v.type;
    const col = i % 5, row = Math.floor(i / 5);
    el.style.left = (30 + col * (stage.clientWidth - 160) / 4) + "px";
    el.style.top = (18 + row * 120) + "px";
    el.dataset.homeX = el.style.left; el.dataset.homeY = el.style.top;
    yard.appendChild(el);
    makeDraggable(el);
  });

  function makeDraggable(el) {
    let startX = 0, startY = 0, origLeft = 0, origTop = 0, dragging = false;
    el.addEventListener("pointerdown", (e) => {
      if (done || el.classList.contains("parked")) return;
      e.preventDefault();
      window.KrakenAudio.unlock();
      dragging = true;
      el.classList.add("dragging");
      el.setPointerCapture(e.pointerId);
      const r = el.getBoundingClientRect(), yr = yard.getBoundingClientRect();
      origLeft = r.left - yr.left; origTop = r.top - yr.top;
      startX = e.clientX; startY = e.clientY;
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      el.style.left = (origLeft + e.clientX - startX) + "px";
      el.style.top = (origTop + e.clientY - startY) + "px";
      zones.forEach(z => z.classList.toggle("zone-over", isOver(el, z)));
    });
    el.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("dragging");
      zones.forEach(z => z.classList.remove("zone-over"));
      const hit = zones.find(z => isOver(el, z));
      if (hit && hit.dataset.type === el.dataset.type) {
        el.classList.add("parked");
        const span = document.createElement("span");
        span.className = "parked-icon";
        span.innerHTML = el._svg;
        hit.querySelector(".zone-parked").appendChild(span);
        const zr = hit.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        window.Kraken.floatText(stage, zr.left - sr.left + zr.width / 2, zr.top - sr.top + 20, "Đúng nhà rồi! 🎉");
        window.KrakenAudio.catchIt();
        el.remove();
        parked++; updateHud();
        if (parked >= TOTAL) {
          done = true;
          const stars = wrong === 0 ? 3 : wrong <= 3 ? 2 : 1;
          setTimeout(() => api.complete(stars, { message: "Tất cả xe, máy bay và tàu chiến đã về đúng nhà! Kraken sắp xếp siêu giỏi! 🏆" }), 600);
        }
      } else {
        if (hit) { wrong++; window.KrakenAudio.gentle(); window.Kraken.floatText(stage, e.clientX - stage.getBoundingClientRect().left, e.clientY - stage.getBoundingClientRect().top - 30, "Chưa đúng nhà, thử lại nhé! 💙"); }
        el.style.transition = "left .45s ease, top .45s ease";
        el.style.left = el.dataset.homeX; el.style.top = el.dataset.homeY;
        setTimeout(() => { el.style.transition = ""; }, 480);
      }
    });
  }
  function isOver(el, zone) {
    const r = el.getBoundingClientRect(), z = zone.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return cx > z.left && cx < z.right && cy > z.top && cy < z.bottom;
  }

  return function cleanup() { done = true; stage.classList.remove("sort-stage"); };
};
