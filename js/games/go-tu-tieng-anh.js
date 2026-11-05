/* Gõ Từ Tiếng Anh — game Đảo Bàn Phím (ES module, tự đăng ký vào KrakenRegistry).
   Đỉnh của lộ trình gõ: nhìn TRANH, gõ trọn một TỪ TIẾNG ANH từng chữ một.
   Gõ sai chữ nào thì kẹt ở chữ đó (đúng chuẩn luyện gõ) — rung nhẹ, gõ lại chữ đúng.
   Gõ xong từ: tranh "bay/vút" qua sân khấu + hiện "CAR = ô tô 🚗" để bé học luôn nghĩa.
   Gợi ý phím kế tiếp theo hintMode của công thức D (difficulty.js -> wordParams):
   cấp thấp phím cần gõ luôn phát sáng, cấp giữa đứng yên 1.5s mới sáng, cấp cao tự nhớ. */
import { createKeyboard } from "./keyboard.js";
import { pickWords } from "./wordbank.js";

const HINT_DELAY_MS = 1500;

function startGoTu(stage, api) {
  const P = api.params;
  const words = pickWords(P.words, P.maxLen);
  const TOTAL = words.length;
  let done = false, accepting = false;
  let wi = 0, index = 0;              // từ thứ mấy, chữ thứ mấy trong từ
  let presses = 0, correctPresses = 0;
  let hintTimer = null, nextTimer = null;

  stage.classList.add("word-stage");
  stage.innerHTML = `
    <div class="word-wrap">
      <div class="word-card">
        <div class="word-pic"></div>
        <div class="word-slots"></div>
        <div class="word-banner"></div>
      </div>
      <div class="word-kb"></div>
    </div>`;
  const cardEl = stage.querySelector(".word-card");
  const picEl = stage.querySelector(".word-pic");
  const slotsEl = stage.querySelector(".word-slots");
  const bannerEl = stage.querySelector(".word-banner");

  const kb = createKeyboard({ onKey: handleKey });
  stage.querySelector(".word-kb").appendChild(kb.el);

  function accuracy() { return presses ? correctPresses / presses : 1; }
  function updateHud() {
    api.hud.textContent = `✈️ Từ ${Math.min(wi + 1, TOTAL)}/${TOTAL} · Đúng: ${Math.round(accuracy() * 100)}%`;
  }

  function armHint() {
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
    if (done || !accepting) return;
    const cur = words[wi];
    if (!cur || index >= cur.w.length) return;
    if (P.hintMode === "always") kb.setTarget(cur.w[index]);
    else if (P.hintMode === "delayed") {
      hintTimer = setTimeout(() => { if (!done && accepting) kb.setTarget(cur.w[index]); }, HINT_DELAY_MS);
    }
  }

  function showWord() {
    if (done) return;
    if (wi >= TOTAL) { finish(); return; }
    const cur = words[wi];
    index = 0;
    picEl.textContent = cur.e;
    picEl.classList.remove("word-zoom");
    bannerEl.textContent = "";
    slotsEl.innerHTML = "";
    for (const ch of cur.w) {
      const s = document.createElement("span");
      s.className = "word-slot";
      s.textContent = ch;
      slotsEl.appendChild(s);
    }
    markCurrent();
    accepting = true;
    window.__typingDebug = { id: "go-tu-tieng-anh", word: cur.w, index: index };
    armHint();
    updateHud();
  }

  function markCurrent() {
    const slots = slotsEl.children;
    for (let i = 0; i < slots.length; i++) {
      slots[i].classList.toggle("filled", i < index);
      slots[i].classList.toggle("current", i === index);
    }
  }

  function handleKey(ch) {
    if (done || !accepting) return;
    const cur = words[wi];
    if (!cur || index >= cur.w.length) return;
    presses++;
    if (ch === cur.w[index]) {
      correctPresses++;
      kb.pulseKey(ch, "good");
      window.KrakenAudio.pop();
      index++;
      markCurrent();
      window.__typingDebug = { id: "go-tu-tieng-anh", word: cur.w, index: index };
      if (index >= cur.w.length) { wordDone(); return; }
      kb.setTarget(null);
      armHint();
    } else {
      kb.pulseKey(ch, "bad");
      window.KrakenAudio.gentle();
      cardEl.classList.remove("shake");
      void cardEl.offsetWidth;
      cardEl.classList.add("shake");
      // chữ sai không làm mất gợi ý: ở chế độ delayed, sai xong vẫn chờ như thường
    }
    updateHud();
  }

  function wordDone() {
    accepting = false;
    if (hintTimer) clearTimeout(hintTimer);
    kb.setTarget(null);
    const cur = words[wi];
    bannerEl.textContent = `${cur.w} = ${cur.vi} ${cur.e}`;
    window.KrakenAudio.goal();
    picEl.classList.remove("word-zoom");
    void picEl.offsetWidth;
    picEl.classList.add("word-zoom");
    window.__typingDebug = { id: "go-tu-tieng-anh", word: cur.w, index: index };
    nextTimer = setTimeout(() => { wi++; showWord(); }, 1400);
  }

  function finish() {
    done = true;
    const perf = accuracy();
    const stars = perf >= 0.8 ? 3 : perf >= 0.45 ? 2 : 1;
    api.complete(stars, {
      perf: perf, emoji: "✈️",
      message: `Con gõ xong ${TOTAL} từ tiếng Anh, gõ đúng ${Math.round(perf * 100)}% số phím! Kraken gõ giỏi quá! ⌨️`
    });
  }

  showWord();

  return function cleanup() {
    done = true;
    accepting = false;
    if (hintTimer) clearTimeout(hintTimer);
    if (nextTimer) clearTimeout(nextTimer);
    kb.destroy();
    stage.classList.remove("word-stage");
    if (window.__typingDebug && window.__typingDebug.id === "go-tu-tieng-anh") delete window.__typingDebug;
  };
}

window.KrakenRegistry.registerGame({
  id: "go-tu-tieng-anh", island: "ban-phim", icon: "✈️",
  name: "Gõ Từ Tiếng Anh", skill: "Gõ trọn từ tiếng Anh theo tranh",
  title: "Gõ Từ Tiếng Anh — Đảo Bàn Phím",
  instruction: "✈️ Nhìn tranh rồi GÕ từng chữ của từ tiếng Anh nhé! Gõ xong Kraken đọc nghĩa cho con nghe!",
  start: startGoTu
});
