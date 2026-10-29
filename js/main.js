/* Hành Trình Của Kraken — điều hướng theo registry game, tiến độ v2 (localStorage), màn hoàn thành.
   Danh sách đảo/game nằm ở js/registry.js (KrakenRegistry) — file này chỉ lo chạy game và lưu tiến độ. */
window.Kraken = (function () {
  const STORAGE_KEY = "krakenProgress";
  const PRAISES = ["Giỏi quá Kraken! 🎉", "Tuyệt vời! 🌟", "Con làm được rồi! 💪", "Xuất sắc! 🏆", "Hoan hô Kraken! 👏"];
  let progress = loadProgress();
  let currentLevel = 0;
  let activeCleanup = null;

  /* Tiến độ v2: { version: 2, stars: {gameId: sao}, completed: {gameId: true}, difficulty: {gameId: cấp D} }
     Dữ liệu v1 (chưa có version, khóa theo màn 1..5) được TỰ ĐỘNG nâng lên v2, giữ nguyên sao/cấp đã lưu. */
  function loadProgress() {
    let p = { version: 2, stars: {}, completed: {}, difficulty: {} };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          // gộp với mặc định để dữ liệu cũ (chưa có difficulty) không bị mất
          if (parsed.stars) p.stars = parsed.stars;
          if (parsed.completed) p.completed = parsed.completed;
          if (parsed.difficulty) p.difficulty = parsed.difficulty;
          if (parsed.version !== 2) {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) {} // ghi lại dạng v2
          }
        }
      }
    } catch (e) { /* bỏ qua nếu localStorage bị chặn */ }
    return p;
  }
  function getDifficulty(id) {
    const d = Math.floor(Number(progress.difficulty[id]));
    return isFinite(d) && d >= 1 ? d : 1;
  }
  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (e) {}
  }

  function $(id) { return document.getElementById(id); }
  function show(id) {
    ["screen-home", "screen-level", "screen-complete"].forEach(s => $(s).classList.toggle("hidden", s !== id));
  }

  /* ---------- Trang chủ: bản đồ đảo dựng từ registry ---------- */
  function gameButton(g) {
    const btn = document.createElement("button");
    btn.className = "level-btn";
    btn.setAttribute("data-game", g.id);
    if (typeof g.id === "number") btn.setAttribute("data-level", g.id); // tương thích ngược cho 5 màn chuột
    btn.innerHTML =
      `<span class="level-icon">${g.icon}</span>` +
      `<span class="level-text"><span class="level-name">${g.name}</span>` +
      `<span class="level-skill">${g.skill}</span></span>` +
      `<span class="level-stars" data-stars-for="${g.id}"></span>` +
      `<span class="level-badge" data-diff-for="${g.id}">Cấp 1</span>`;
    btn.addEventListener("click", () => {
      window.KrakenAudio.unlock();
      startLevel(g.id);
    });
    return btn;
  }

  function renderHome() {
    const wrap = $("islands");
    if (!wrap) return;
    wrap.innerHTML = "";
    for (const isl of window.KrakenRegistry.islands) {
      const sec = document.createElement("section");
      sec.className = "island" + (isl.locked ? " island-locked" : "");
      sec.id = "island-" + isl.id;
      let html = `<h2 class="island-title">${isl.emoji} ${isl.title}${isl.locked ? " 🔒" : ""}</h2>`;
      if (isl.note) html += `<p class="island-note">${isl.note}</p>`;
      sec.innerHTML = html;
      if (isl.locked) {
        const soon = document.createElement("p");
        soon.className = "island-soon";
        soon.textContent = "Sắp ra mắt — Kraken hãy chờ nhé! 🐙";
        sec.appendChild(soon);
      } else {
        const nav = document.createElement("nav");
        nav.className = "level-menu";
        for (const g of window.KrakenRegistry.gamesOfIsland(isl.id)) nav.appendChild(gameButton(g));
        sec.appendChild(nav);
      }
      wrap.appendChild(sec);
    }
  }

  function refreshHome() {
    let total = 0;
    document.querySelectorAll("[data-stars-for]").forEach(el => {
      const n = progress.stars[el.getAttribute("data-stars-for")] || 0;
      total += n;
      el.textContent = n ? "⭐".repeat(n) : "☆☆☆";
    });
    $("total-stars").textContent = "⭐ " + total;
    document.querySelectorAll("[data-diff-for]").forEach(el => {
      el.textContent = "Cấp " + getDifficulty(el.getAttribute("data-diff-for"));
    });
  }

  function startLevel(id) {
    const game = window.KrakenRegistry.gameById(id);
    if (!game) return;
    currentLevel = id;
    if (activeCleanup) { try { activeCleanup(); } catch (e) {} activeCleanup = null; }
    $("level-stage").innerHTML = "";
    $("level-hud").textContent = "";
    $("level-title").textContent = game.title;
    $("level-instruction").textContent = game.instruction;
    const D = getDifficulty(id);
    $("diff-label").textContent = "Cấp " + D;
    $("btn-diff-minus").disabled = D <= 1;
    show("screen-level");
    if (typeof game.start === "function") {
      activeCleanup = game.start($("level-stage"), {
        hud: $("level-hud"),
        difficulty: D,
        params: window.KrakenDifficulty.params(id, D),
        complete: (stars, extra) => completeLevel(id, stars, extra)
      }) || null;
    }
  }

  function changeDifficulty(delta) {
    if (!currentLevel) return;
    const next = Math.max(1, getDifficulty(currentLevel) + delta);
    if (next === getDifficulty(currentLevel)) return;
    progress.difficulty[currentLevel] = next;
    saveProgress();
    window.KrakenAudio.unlock();
    startLevel(currentLevel); // khởi động lại màn với thông số mới
  }

  function completeLevel(id, stars, extra) {
    if (activeCleanup) { try { activeCleanup(); } catch (e) {} activeCleanup = null; }
    stars = Math.max(1, Math.min(3, stars || 1));
    if (!progress.stars[id] || stars > progress.stars[id]) progress.stars[id] = stars;
    progress.completed[id] = true;

    /* ---- lên / xuống cấp theo kết quả (công thức đã chốt) ---- */
    const playedD = getDifficulty(id);
    let delta = 0;
    if (extra && typeof extra.goals === "number" && typeof extra.needGoals === "number") {
      // Màn 5 dùng luật riêng theo số bàn thắng so với số bàn cần
      if (extra.goals >= extra.needGoals) delta = 1;
      else if (extra.goals <= extra.needGoals - 2) delta = -1;
    } else if (extra && typeof extra.perf === "number") {
      if (extra.perf >= 0.8) delta = 1;
      else if (extra.perf < 0.45) delta = -1;
    }
    const newD = Math.max(1, playedD + delta);
    if (newD !== playedD) progress.difficulty[id] = newD;
    saveProgress();

    window.KrakenAudio.jingle();
    $("complete-stars").textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
    $("complete-emoji").textContent = (extra && extra.emoji) || "🎉";
    $("complete-title").textContent = (extra && extra.title) || "Giỏi quá Kraken!";
    $("complete-message").textContent = (extra && extra.message) || "Con đã hoàn thành màn chơi rồi!";
    let diffHtml = `Con vừa chơi ở <b>Cấp ${playedD}</b>.`;
    if (delta > 0) diffHtml += `<br>🎉 Lên Cấp ${newD}! Lần sau sẽ khó hơn một chút nhé!`;
    else if (delta < 0) diffHtml += `<br>Mình quay lại Cấp ${newD} cho dễ hơn nhé 💙`;
    else diffHtml += `<br>Giữ nguyên Cấp ${playedD} nhé!`;
    $("complete-diff").innerHTML = diffHtml;
    $("complete-extra").innerHTML = (extra && extra.html) || "";
    $("btn-next").style.display = window.KrakenRegistry.nextInIsland(id) === null ? "none" : "";
    show("screen-complete");
  }

  function goHome() {
    if (activeCleanup) { try { activeCleanup(); } catch (e) {} activeCleanup = null; }
    currentLevel = 0;
    refreshHome();
    show("screen-home");
  }

  function floatText(container, x, y, text) {
    const el = document.createElement("div");
    el.className = "float-text";
    el.textContent = text || PRAISES[Math.floor(Math.random() * PRAISES.length)];
    el.style.left = x + "px"; el.style.top = y + "px";
    container.appendChild(el);
    setTimeout(() => el.remove(), 1150);
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHome();
    $("btn-diff-minus").addEventListener("click", () => changeDifficulty(-1));
    $("btn-diff-plus").addEventListener("click", () => changeDifficulty(1));
    $("btn-home").addEventListener("click", goHome);
    $("btn-complete-home").addEventListener("click", goHome);
    $("btn-replay").addEventListener("click", () => startLevel(currentLevel));
    $("btn-next").addEventListener("click", () => {
      const nx = window.KrakenRegistry.nextInIsland(currentLevel);
      if (nx !== null && nx !== undefined) startLevel(nx);
    });
    $("btn-fullscreen").addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else document.documentElement.requestFullscreen().catch(() => {});
    });
    refreshHome();
  });

  return {
    floatText,
    rand: (min, max) => min + Math.random() * (max - min),
    randInt: (min, max) => Math.floor(min + Math.random() * (max - min + 1)),
    PRAISES
  };
})();
