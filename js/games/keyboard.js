/* Bàn phím QWERTY TRONG GAME — dùng chung cho mọi game Đảo Bàn Phím (ES module).
   MỘT đường nhập duy nhất: bé GÕ PHÍM THẬT (A-Z, 0-9) hoặc CHẠM/BẤM vào phím ảo
   đều gọi onKey(chữ) — game không cần biết chữ đến từ đâu. Phím ảo cũng là bản đồ
   vị trí trực quan: game gọi setTarget(chữ) cho phím cần tìm phát sáng,
   pulseKey(chữ, "good"/"bad") để nhá xanh/đỏ khi bé bấm.
   createKeyboard({ onKey }) -> { el, setTarget, pulseKey, destroy }
   - destroy(): gỡ listener phím thật + dọn timer — game PHẢI gọi trong cleanup. */

const ROWS = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export function createKeyboard(opts) {
  const onKey = (opts && opts.onKey) || function () {};
  const keys = {};        // chữ -> phần tử phím ảo
  let target = null;      // chữ đang được gợi ý phát sáng (hoặc null)
  const pulseTimers = {}; // chữ -> id timer dọn class nhá màu

  const el = document.createElement("div");
  el.className = "kb-keyboard";
  ROWS.forEach((rowText, ri) => {
    const row = document.createElement("div");
    row.className = "kb-row kb-row-" + ri;
    for (const ch of rowText) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "kb-key";
      b.textContent = ch;
      b.setAttribute("data-key", ch);
      b.setAttribute("aria-label", "Phím " + ch);
      // pointerdown + preventDefault: nhận chạm/bấm ngay, không cướp focus,
      // không để sự kiện lọt xuống các handler khác của khung chơi
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        emit(ch);
      });
      keys[ch] = b;
      row.appendChild(b);
    }
    el.appendChild(row);
  });

  function emit(ch) { onKey(ch); }

  function onKeyDown(e) {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (typeof e.key !== "string" || e.key.length !== 1) return;
    const ch = e.key.toUpperCase();
    if (/^[A-Z0-9]$/.test(ch)) emit(ch);
  }
  window.addEventListener("keydown", onKeyDown);

  function setTarget(letter) {
    if (target && keys[target]) keys[target].classList.remove("kb-target");
    target = letter || null;
    if (target && keys[target]) keys[target].classList.add("kb-target");
  }

  function pulseKey(letter, kind) {
    const b = keys[letter];
    if (!b) return;
    const cls = kind === "good" ? "kb-good" : "kb-bad";
    b.classList.remove("kb-good", "kb-bad");
    void b.offsetWidth; // khởi động lại animation
    b.classList.add(cls);
    if (pulseTimers[letter]) clearTimeout(pulseTimers[letter]);
    pulseTimers[letter] = setTimeout(() => b.classList.remove(cls), 480);
  }

  return {
    el: el,
    setTarget: setTarget,
    pulseKey: pulseKey,
    destroy: function () {
      window.removeEventListener("keydown", onKeyDown);
      for (const ch in pulseTimers) clearTimeout(pulseTimers[ch]);
      el.remove();
    }
  };
}
