/* Hành Trình Của Kraken — điều hướng, tiến độ (localStorage), màn hoàn thành */
window.Kraken = (function () {
  const STORAGE_KEY = "krakenProgress";
  const PRAISES = ["Giỏi quá Kraken! 🎉", "Tuyệt vời! 🌟", "Con làm được rồi! 💪", "Xuất sắc! 🏆", "Hoan hô Kraken! 👏"];
  let progress = loadProgress();
  let currentLevel = 0;
  let activeCleanup = null;

  const LEVELS = {
    1: { title: "Màn 1: Lặn Biển Tìm Kho Báu", instruction: "🖱️ Chỉ cần DI CHUỘT cho bạn Kraken chạm vào bong bóng và kho báu nhé!" },
    2: { title: "Màn 2: Hứng Hàng Cứu Trợ", instruction: "🖱️ BẤM CHUỘT vào thùng hàng đang rơi để Kraken hứng lấy mang về tàu!" },
    3: { title: "Màn 3: Xếp Xe, Máy Bay, Tàu Chiến", instruction: "🖱️ GIỮ CHUỘT kéo từng chiếc xe, máy bay, tàu về đúng nhà của nó rồi THẢ ra!" },
    4: { title: "Màn 4: Đua Xe Ăn Xu Vàng", instruction: "🖱️ GIỮ CHUỘT và lái xe theo đường đua, ăn xu vàng, về tới cờ đích nhé!" },
    5: { title: "Màn 5: Kraken Sút Phạt — Tiền Đạo Số 7", instruction: "🖱️ Di chuột để NGẮM, GIỮ chuột nạp lực ở vùng XANH, THẢ ra để sút!" }
  };

  function loadProgress() {
    let p = { stars: {}, completed: {}, difficulty: {} };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          // gộp với mặc định để dữ liệu cũ (chưa có difficulty) không bị mất
          if (parsed.stars) p.stars = parsed.stars;
          if (parsed.completed) p.completed = parsed.completed;
          if (parsed.difficulty) p.difficulty = parsed.difficulty;
        }
      }
    } catch (e) { /* bỏ qua nếu localStorage bị chặn */ }
    return p;
  }
  function getDifficulty(n) {
    const d = Math.floor(Number(progress.difficulty[n]));
    return isFinite(d) && d >= 1 ? d : 1;
  }
  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (e) {}
  }

  function $(id) { return document.getElementById(id); }
  function show(id) {
    ["screen-home", "screen-level", "screen-complete"].forEach(s => $(s).classList.toggle("hidden", s !== id));
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

  function startLevel(n) {
    currentLevel = n;
    if (activeCleanup) { try { activeCleanup(); } catch (e) {} activeCleanup = null; }
    $("level-stage").innerHTML = "";
    $("level-hud").textContent = "";
    $("level-title").textContent = LEVELS[n].title;
    $("level-instruction").textContent = LEVELS[n].instruction;
    const D = getDifficulty(n);
    $("diff-label").textContent = "Cấp " + D;
    $("btn-diff-minus").disabled = D <= 1;
    show("screen-level");
    const fn = window["KrakenLevel" + n];
    if (typeof fn === "function") {
      activeCleanup = fn($("level-stage"), {
        hud: $("level-hud"),
        difficulty: D,
        params: window.KrakenDifficulty.params(n, D),
        complete: (stars, extra) => completeLevel(n, stars, extra)
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

  function completeLevel(n, stars, extra) {
    if (activeCleanup) { try { activeCleanup(); } catch (e) {} activeCleanup = null; }
    stars = Math.max(1, Math.min(3, stars || 1));
    if (!progress.stars[n] || stars > progress.stars[n]) progress.stars[n] = stars;
    progress.completed[n] = true;

    /* ---- lên / xuống cấp theo kết quả (công thức đã chốt) ---- */
    const playedD = getDifficulty(n);
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
    if (newD !== playedD) progress.difficulty[n] = newD;
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
    $("btn-next").style.display = n >= 5 ? "none" : "";
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
    document.querySelectorAll(".level-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        window.KrakenAudio.unlock();
        startLevel(parseInt(btn.getAttribute("data-level"), 10));
      });
    });
    $("btn-diff-minus").addEventListener("click", () => changeDifficulty(-1));
    $("btn-diff-plus").addEventListener("click", () => changeDifficulty(1));
    $("btn-home").addEventListener("click", goHome);
    $("btn-complete-home").addEventListener("click", goHome);
    $("btn-replay").addEventListener("click", () => startLevel(currentLevel));
    $("btn-next").addEventListener("click", () => startLevel(Math.min(5, currentLevel + 1)));
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
