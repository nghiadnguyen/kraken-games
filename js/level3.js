/* Màn 3 — Kéo & thả: xếp ô tô / máy bay chiến đấu / tàu chiến về đúng nơi (pointer events)
   Độ khó theo công thức (api.params): số xe mỗi loại, cỡ xe, mức gợi ý ở zone,
   và từ Cấp 5 có ô đỗ cụ thể với bán kính thả trúng thu hẹp dần. */
window.KrakenLevel3 = function (stage, api) {
  const I = window.KrakenIcons;
  const P = api.params;
  const COLORS = {
    car: ["#e63946", "#3a86ff", "#ffbe0b", "#6a994e", "#9b5de5", "#f15bb5"],
    jet: ["#7f8ea3", "#2a9d8f", "#e76f51", "#3a86ff", "#ffb703", "#6c757d"],
    ship: ["#5b6b7f", "#3a6ea5", "#6a994e", "#845ec2", "#b5651d", "#2a9d8f"]
  };
  const MAKERS = { car: I.car, jet: I.jet, ship: I.warship };
  const ZONES = [
    { type: "car", icon: "🏠", name: "Ga-ra Ô Tô", tint: "rgba(230,57,70,.20)" },
    { type: "jet", icon: "🛬", name: "Đường Băng Trên Tàu Sân Bay", tint: "rgba(58,134,255,.20)" },
    { type: "ship", icon: "⚓", name: "Bến Cảng Tàu Chiến", tint: "rgba(42,157,143,.20)" }
  ];
  const VEHICLES = [];
  ZONES.forEach(z => {
    for (let i = 0; i < P.perType; i++) {
      VEHICLES.push({ icon: MAKERS[z.type](COLORS[z.type][i % COLORS[z.type].length]), type: z.type });
    }
  });
  const TOTAL = VEHICLES.length;
  let parked = 0, wrong = 0, done = false;

  stage.classList.add("sort-stage");
  stage.innerHTML = `
    <div class="sort-yard" id="l3-yard"></div>
    <div class="sort-zones">${ZONES.map(z => `
      <div class="sort-zone" data-type="${z.type}"${P.hintLevel === 2 ? ` style="background:${z.tint}"` : ""}>
        ${P.hintLevel >= 1 ? `<span class="zone-icon">${z.icon}</span>` : ""}
        <span class="zone-name">${z.name}</span>
        ${P.slotsOn ? `<div class="zone-slots"></div>` : `<div class="zone-parked"></div>`}
      </div>`).join("")}
    </div>`;
  const yard = stage.querySelector("#l3-yard");
  const zones = Array.from(stage.querySelectorAll(".sort-zone"));

  // ô đỗ cho từng zone (chỉ khi slotsOn)
  const slotsByType = {};
  if (P.slotsOn) {
    zones.forEach(z => {
      const wrap = z.querySelector(".zone-slots");
      slotsByType[z.dataset.type] = [];
      for (let i = 0; i < P.perType; i++) {
        const s = document.createElement("div");
        s.className = "slot";
        wrap.appendChild(s);
        slotsByType[z.dataset.type].push({ el: s, filled: false });
      }
    });
  }

  function updateHud() { api.hud.textContent = `🚗 Đã xếp: ${parked}/${TOTAL}`; }
  updateHud();

  // xáo trộn vị trí xuất phát trong sân (lưới đều theo số lượng hiện tại)
  const shuffled = VEHICLES.slice().sort(() => Math.random() - 0.5);
  const itemW = P.itemWPx, itemH = Math.round(itemW * 78 / 112);
  const cols = TOTAL <= 6 ? 3 : TOTAL <= 12 ? 5 : 6;
  const rows = Math.ceil(TOTAL / cols);
  const yardW = yard.clientWidth || stage.clientWidth, yardH = yard.clientHeight || stage.clientHeight * 0.58;
  shuffled.forEach((v, i) => {
    const el = document.createElement("div");
    el.className = "drag-item";
    el.innerHTML = v.icon;
    el._svg = v.icon;
    el.dataset.type = v.type;
    el.style.width = itemW + "px";
    el.style.height = itemH + "px";
    const col = i % cols, row = Math.floor(i / cols);
    const stepX = cols > 1 ? (yardW - itemW - 28) / (cols - 1) : 0;
    // khoảng cách hàng thích ứng: tối đa 120px, sân thấp thì thu hẹp lại theo chiều cao
    // thật của sân chứa để hàng cuối không bao giờ tràn xuống khu vực zone
    const stepY = rows > 1 ? Math.min(120, Math.max(0, (yardH - 96) / (rows - 1))) : 0;
    el.style.left = (14 + col * stepX) + "px";
    el.style.top = (10 + row * stepY) + "px";
    el.dataset.homeX = el.style.left; el.dataset.homeY = el.style.top;
    yard.appendChild(el);
    makeDraggable(el);
  });

  function finishPark(el) {
    el.remove();
    parked++; updateHud();
    window.KrakenAudio.catchIt();
    if (parked >= TOTAL) {
      done = true;
      const stars = wrong === 0 ? 3 : wrong <= 3 ? 2 : 1;
      const perf = TOTAL / (TOTAL + wrong);
      setTimeout(() => api.complete(stars, { perf: perf, message: "Tất cả xe, máy bay và tàu chiến đã về đúng nhà! Kraken sắp xếp siêu giỏi! 🏆" }), 600);
    }
  }

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
      const sr = stage.getBoundingClientRect();
      const hit = zones.find(z => isOver(el, z));
      let parkedOk = false;
      if (hit && hit.dataset.type === el.dataset.type) {
        if (P.slotsOn) {
          // phải thả gần tâm 1 ô trống của đúng zone mới được đỗ
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          let best = null, bestDist = Infinity;
          slotsByType[el.dataset.type].forEach(s => {
            if (s.filled) return;
            const zr = s.el.getBoundingClientRect();
            const d = Math.hypot(cx - (zr.left + zr.width / 2), cy - (zr.top + zr.height / 2));
            if (d < bestDist) { bestDist = d; best = s; }
          });
          if (best && bestDist <= P.slotTolPx) {
            best.filled = true;
            best.el.classList.add("filled");
            const span = document.createElement("span");
            span.className = "parked-icon";
            span.innerHTML = el._svg;
            best.el.appendChild(span);
            window.Kraken.floatText(stage, cx - sr.left, cy - sr.top - 24, "Đúng ô rồi! 🎉");
            parkedOk = true;
            finishPark(el);
          } else {
            window.KrakenAudio.gentle();
            window.Kraken.floatText(stage, e.clientX - sr.left, e.clientY - sr.top - 30, "Thả vào giữa ô trống nhé! 🅿️");
          }
        } else {
          const span = document.createElement("span");
          span.className = "parked-icon";
          span.innerHTML = el._svg;
          hit.querySelector(".zone-parked").appendChild(span);
          const zr = hit.getBoundingClientRect();
          window.Kraken.floatText(stage, zr.left - sr.left + zr.width / 2, zr.top - sr.top + 20, "Đúng nhà rồi! 🎉");
          parkedOk = true;
          finishPark(el);
        }
      }
      if (!parkedOk) {
        if (hit && hit.dataset.type !== el.dataset.type) {
          wrong++; window.KrakenAudio.gentle();
          window.Kraken.floatText(stage, e.clientX - sr.left, e.clientY - sr.top - 30, "Chưa đúng nhà, thử lại nhé! 💙");
        }
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
