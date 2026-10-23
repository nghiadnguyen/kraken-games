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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* bỏ qua nếu localStorage bị chặn */ }
    return { stars: {}, completed: {} };
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
  }

  function startLevel(n) {
    currentLevel = n;
    if (activeCleanup) { try { activeCleanup(); } catch (e) {} activeCleanup = null; }
    $("level-stage").innerHTML = "";
    $("level-hud").textContent = "";
    $("level-title").textContent = LEVELS[n].title;
    $("level-instruction").textContent = LEVELS[n].instruction;
    show("screen-level");
    const fn = window["KrakenLevel" + n];
    if (typeof fn === "function") {
      activeCleanup = fn($("level-stage"), {
        hud: $("level-hud"),
        complete: (stars, extra) => completeLevel(n, stars, extra)
      }) || null;
    }
  }

  function completeLevel(n, stars, extra) {
    if (activeCleanup) { try { activeCleanup(); } catch (e) {} activeCleanup = null; }
    stars = Math.max(1, Math.min(3, stars || 1));
    if (!progress.stars[n] || stars > progress.stars[n]) progress.stars[n] = stars;
    progress.completed[n] = true;
    saveProgress();
    window.KrakenAudio.jingle();
    $("complete-stars").textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
    $("complete-emoji").textContent = (extra && extra.emoji) || "🎉";
    $("complete-title").textContent = (extra && extra.title) || "Giỏi quá Kraken!";
    $("complete-message").textContent = (extra && extra.message) || "Con đã hoàn thành màn chơi rồi!";
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
