/* Màn 4 — Giữ chuột & lái theo đường: kéo xe đua theo đường quanh co, ăn xu vàng, về đích
   Độ khó theo công thức (api.params): bề rộng đường, số điểm cua, biên dao động,
   số xu + độ lệch xu khỏi tim đường, số chướng ngại làm chậm xe. */
window.KrakenLevel4 = function (stage, api) {
  const P = api.params;
  const COIN_TOTAL = P.coins;
  let done = false, raf = null, holding = false;
  let coinsGot = 0;
  let target = null;

  stage.classList.add("race-stage");
  stage.innerHTML = `
    <canvas class="race-canvas" id="l4-canvas"></canvas>
    <div class="race-hint" id="l4-hint">🚦 Nhấn GIỮ chuột để xe chạy theo chuột của con!</div>
    <div class="race-car" id="l4-car">${window.KrakenIcons.raceCar()}</div>`;
  const canvas = stage.querySelector("#l4-canvas");
  const ctx = canvas.getContext("2d");
  const carEl = stage.querySelector("#l4-car");
  const hint = stage.querySelector("#l4-hint");

  function updateHud() { api.hud.textContent = `🪙 Xu vàng: ${coinsGot}/${COIN_TOTAL}`; }
  updateHud();

  // đường đua NGẪU NHIÊN mỗi lần chơi: ctrlCount điểm điều khiển, x tăng dần đều 5%→95%,
  // y luân phiên quanh 0.5 ± swingHalf (có nhiễu), đầu/cuối ở giữa cho dễ vào cua
  function genCtrl() {
    const n = P.ctrlCount;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const fx = 0.05 + 0.90 * (i / (n - 1));
      let fy;
      if (i === 0 || i === n - 1) fy = window.Kraken.rand(0.44, 0.56);
      else {
        const sign = i % 2 === 1 ? -1 : 1;
        fy = 0.5 + sign * P.swingHalf * window.Kraken.rand(0.8, 1.0);
        fy = Math.max(0.08, Math.min(0.92, fy));
      }
      pts.push([fx, fy]);
    }
    return pts;
  }
  let samples = [], coins = [], obstacles = [], car = { x: 0, y: 0, angle: 0 }, endPoint = { x: 0, y: 0 }, trackCanvas = null;

  function catmull(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }
  function buildTrack() {
    const w = stage.clientWidth, h = stage.clientHeight;
    canvas.width = w; canvas.height = h;
    const pts = genCtrl().map(p => ({ x: p[0] * w, y: p[1] * h }));
    window.__l4ctrl = pts;
    samples = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let t = 0; t < 1; t += 0.02) samples.push({ x: catmull(p0.x, p1.x, p2.x, p3.x, t), y: catmull(p0.y, p1.y, p2.y, p3.y, t) });
    }
    samples.push({ ...pts[pts.length - 1] });
    window.__l4samples = samples;
    endPoint = samples[samples.length - 1];
    const startAngle = Math.atan2(samples[1].y - samples[0].y, samples[1].x - samples[0].x) * 180 / Math.PI;
    car = { x: samples[0].x, y: samples[0].y, angle: startAngle };
    target = { x: car.x, y: car.y };

    function sampleAt(idx) { return samples[Math.max(0, Math.min(samples.length - 1, idx))]; }
    function normalAt(idx) {
      const a = sampleAt(idx - 3), b = sampleAt(idx + 3);
      let tx = b.x - a.x, ty = b.y - a.y;
      const len = Math.hypot(tx, ty) || 1; tx /= len; ty /= len;
      return { x: -ty, y: tx };
    }

    // xu đặt ở vị trí ngẫu nhiên dọc đường, lệch khỏi tim đường theo coinOffFrac
    coins = [];
    const usedIdx = new Set();
    for (let i = 0; i < COIN_TOTAL; i++) {
      let idx = Math.floor(samples.length * window.Kraken.rand(0.10, 0.92));
      let guard = 0;
      while (usedIdx.has(idx) && guard++ < 20) idx = (idx + 7) % samples.length;
      usedIdx.add(idx);
      const base = sampleAt(idx);
      let cx = base.x, cy = base.y;
      if (P.coinOffFrac > 0) {
        const nrm = normalAt(idx);
        const mag = window.Kraken.rand(0, P.coinOffFrac) * Math.max(0, P.roadWidth / 2 - 16);
        const dir = Math.random() < 0.5 ? -1 : 1;
        cx += nrm.x * mag * dir; cy += nrm.y * mag * dir;
      }
      coins.push({ x: Math.max(20, Math.min(w - 20, cx)), y: Math.max(20, Math.min(h - 20, cy)), got: false });
    }
    // chướng ngại trên đường (chỉ làm chậm xe), tránh chỗ có xu và đầu/cuối đường
    obstacles = [];
    for (let i = 0; i < P.obstacles; i++) {
      let idx = Math.floor(samples.length * window.Kraken.rand(0.18, 0.88)), guard = 0;
      const farFromCoins = () => coins.every(c => Math.hypot(c.x - samples[idx].x, c.y - samples[idx].y) > 56)
        && obstacles.every(o => Math.hypot(o.x - samples[idx].x, o.y - samples[idx].y) > 90);
      while (!farFromCoins() && guard++ < 24) idx = (idx + 11) % samples.length;
      obstacles.push({ x: samples[idx].x, y: samples[idx].y });
    }

    window.__l4debug = {
      D: api.difficulty, roadWidth: P.roadWidth, ctrlCount: pts.length,
      coins: COIN_TOTAL, swingHalf: P.swingHalf, obstacles: obstacles.length
    };

    // vẽ đường tĩnh ra canvas phụ
    trackCanvas = document.createElement("canvas");
    trackCanvas.width = w; trackCanvas.height = h;
    const tc = trackCanvas.getContext("2d");
    tc.fillStyle = "#95d5b2"; tc.fillRect(0, 0, w, h);
    tc.font = "40px serif";
    ["🌳", "🌲", "🌳", "🌲", "🌳"].forEach((t, i) => tc.fillText(t, 30 + i * (w / 5), 52));
    ["🌲", "🌳", "🌻", "🌲", "🌻"].forEach((t, i) => tc.fillText(t, 30 + i * (w / 5), h - 18));
    // ống xanh + khối ? trang trí kiểu chung (không sao chép hình ảnh bản quyền)
    tc.font = "46px serif"; tc.fillText("🟩", w * 0.30, h * 0.88); tc.fillText("❓", w * 0.66, h * 0.14);
    tc.lineCap = "round"; tc.lineJoin = "round";
    tc.strokeStyle = "#6c757d"; tc.lineWidth = P.roadWidth;
    tc.beginPath(); samples.forEach((p, i) => i ? tc.lineTo(p.x, p.y) : tc.moveTo(p.x, p.y)); tc.stroke();
    tc.strokeStyle = "#ffffff"; tc.lineWidth = 5; tc.setLineDash([26, 30]);
    tc.beginPath(); samples.forEach((p, i) => i ? tc.lineTo(p.x, p.y) : tc.moveTo(p.x, p.y)); tc.stroke();
    tc.setLineDash([]);
    tc.font = "52px serif";
    tc.fillText("🚦", samples[0].x - 26, samples[0].y - 58);
    tc.fillText("🏁", endPoint.x - 26, endPoint.y - 58);
  }
  buildTrack();

  function distToTrack(x, y) {
    let min = Infinity;
    for (const p of samples) { const d = Math.hypot(p.x - x, p.y - y); if (d < min) min = d; }
    return min;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (trackCanvas) ctx.drawImage(trackCanvas, 0, 0);
    // chướng ngại 🚧 trên mặt đường
    ctx.font = "38px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    obstacles.forEach(o => ctx.fillText("🚧", o.x, o.y));
    // xu VÀNG vẽ bằng canvas: vòng tròn gradient vàng + sao ở giữa
    coins.forEach(c => {
      if (c.got) return;
      const g = ctx.createRadialGradient(c.x - 5, c.y - 5, 2, c.x, c.y, 17);
      g.addColorStop(0, "#fff3b0"); g.addColorStop(0.55, "#ffd60a"); g.addColorStop(1, "#e0a800");
      ctx.beginPath(); ctx.arc(c.x, c.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = "#b8860b"; ctx.stroke();
      ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#8a6108"; ctx.fillText("★", c.x, c.y + 1);
    });
  }
  function placeCar() {
    carEl.style.left = car.x + "px"; carEl.style.top = car.y + "px";
    carEl.style.transform = `translate(-50%,-50%) rotate(${car.angle}deg)`;
  }

  function loop() {
    if (done) return;
    if (holding && target) {
      const dx = target.x - car.x, dy = target.y - car.y;
      const d = Math.hypot(dx, dy);
      if (d > 2) {
        // xoay xe theo hướng chạy thật (nội suy góc cho mượt, đi vòng cung ngắn nhất)
        const desired = Math.atan2(dy, dx) * 180 / Math.PI;
        let diff = ((desired - car.angle + 540) % 360) - 180;
        car.angle += diff * 0.25;
        const onTrack = distToTrack(car.x, car.y) < P.roadWidth / 2 + 10;
        const nearObstacle = obstacles.some(o => Math.hypot(o.x - car.x, o.y - car.y) < 42);
        let speed = onTrack ? 6.2 : 2.1; // ra khỏi đường chỉ chạy chậm lại, không phạt
        if (nearObstacle) speed *= 0.45;  // gần chướng ngại: chậm lại thôi
        const step = Math.min(speed, d);
        car.x += (dx / d) * step; car.y += (dy / d) * step;
        if (!onTrack) hint.textContent = "🐢 Ra khỏi đường nên xe chạy chậm nè, quay lại đường xám nhé!";
        else hint.textContent = "🏎️ Đang lái... ăn xu vàng và về cờ đích 🏁 nào!";
      }
      coins.forEach(c => {
        if (!c.got && Math.hypot(c.x - car.x, c.y - car.y) < 48) {
          c.got = true; coinsGot++; updateHud(); window.KrakenAudio.coin();
          window.Kraken.floatText(stage, c.x, c.y - 10, "🪙 +1");
        }
      });
      if (Math.hypot(endPoint.x - car.x, endPoint.y - car.y) < Math.max(48, P.roadWidth / 2)) {
        done = true;
        window.KrakenAudio.jingle();
        const frac = coinsGot / COIN_TOTAL;
        const stars = frac >= 0.9 ? 3 : frac >= 0.55 ? 2 : 1;
        setTimeout(() => api.complete(stars, { perf: frac, emoji: "🏎️", message: `Xe của Kraken đã về đích và ăn được ${coinsGot}/${COIN_TOTAL} xu vàng! 🎉` }), 400);
      }
    }
    draw(); placeCar();
    raf = requestAnimationFrame(loop);
  }
  loop();

  function pos(e) { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function onDown(e) { window.KrakenAudio.unlock(); holding = true; target = pos(e); try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
  function onMove(e) { if (holding) target = pos(e); }
  function onUp() { holding = false; if (!done) hint.textContent = "🚦 Nhấn GIỮ chuột để xe chạy tiếp nào!"; }
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);
  function onResize() { buildTrack(); coinsGot = 0; updateHud(); }
  window.addEventListener("resize", onResize);

  return function cleanup() {
    done = true;
    if (raf) cancelAnimationFrame(raf);
    stage.removeEventListener("pointerdown", onDown);
    stage.removeEventListener("pointermove", onMove);
    stage.removeEventListener("pointerup", onUp);
    stage.removeEventListener("pointercancel", onUp);
    window.removeEventListener("resize", onResize);
    stage.classList.remove("race-stage");
  };
};
