/* Bàn phím số GÕ ĐÁP ÁN — dùng chung cho mọi game Đảo Toán (ES module).
   Bé tự GÕ đáp án thay vì chọn trắc nghiệm: bấm/chạm các nút số to trong game,
   hoặc gõ bằng bàn phím thật (0-9, Backspace, Enter) — chạy cả máy tính lẫn iPad.
   createKeypad({ maxDigits, onSubmit }) -> { el, slot, getValue, clear, setEnabled, destroy }
   - el: cụm nút số (1..9, ⌫, 0, ✓) để game gắn vào thanh trả lời.
   - slot: ô hiển thị số đang gõ, game gắn thẳng vào trong phép tính (vd "23 + 15 = [38]").
   - destroy(): gỡ listener phím thật — game PHẢI gọi trong cleanup. */

export function createKeypad(opts) {
  const maxDigits = (opts && opts.maxDigits) || 3;
  const onSubmit = (opts && opts.onSubmit) || function () {};
  let value = "";
  let enabled = true;
  let shakeTimer = null;

  const slot = document.createElement("span");
  slot.className = "math-blank kp-slot";
  slot.textContent = "?";

  const el = document.createElement("div");
  el.className = "kp-pad";
  const buttons = [];
  function makeBtn(label, cls, fn, dataKey) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "kp-btn" + (cls ? " " + cls : "");
    b.textContent = label;
    if (dataKey) b.setAttribute("data-d", dataKey);
    b.addEventListener("click", () => { fn(); b.blur(); }); // blur: tránh Enter sau đó "bấm lại" nút đang focus
    el.appendChild(b);
    buttons.push(b);
    return b;
  }
  for (let d = 1; d <= 9; d++) makeBtn(String(d), "", () => press(String(d)), String(d));
  makeBtn("⌫", "kp-back", back, "back");
  makeBtn("0", "", () => press("0"), "0");
  makeBtn("✓", "kp-ok", submit, "ok");

  function render() {
    slot.textContent = value === "" ? "?" : value;
    slot.classList.toggle("kp-has", value !== "");
  }
  function press(d) {
    if (!enabled) return;
    if (value.length >= maxDigits) return;
    value += d;
    render();
  }
  function back() {
    if (!enabled) return;
    value = value.slice(0, -1);
    render();
  }
  function shake() {
    slot.classList.remove("shake");
    void slot.offsetWidth; // khởi động lại animation
    slot.classList.add("shake");
    if (shakeTimer) clearTimeout(shakeTimer);
    shakeTimer = setTimeout(() => slot.classList.remove("shake"), 400);
  }
  function submit() {
    if (!enabled) return;
    if (value === "") { shake(); return; } // chưa gõ gì: rung nhẹ nhắc bé, KHÔNG tính là trả lời sai
    onSubmit(parseInt(value, 10));
  }
  function onKey(e) {
    if (!enabled || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === "Backspace") { e.preventDefault(); back(); }
    else if (e.key === "Enter") { e.preventDefault(); submit(); }
  }
  window.addEventListener("keydown", onKey);

  return {
    el: el,
    slot: slot,
    getValue: function () { return value === "" ? null : parseInt(value, 10); },
    clear: function () { value = ""; render(); },
    setEnabled: function (b) {
      enabled = !!b;
      el.classList.toggle("kp-disabled", !enabled);
      buttons.forEach(x => { x.disabled = !enabled; });
    },
    destroy: function () {
      window.removeEventListener("keydown", onKey);
      if (shakeTimer) clearTimeout(shakeTimer);
      el.remove();
    }
  };
}

/* Gợi ý mức 2 — TÁCH SỐ theo hàng chục khi bé sai lần 2 ở 1 câu:
   x + y (y >= 10, có phần lẻ) -> "x + chục(y) = ..., rồi cộng thêm lẻ(y)".
   Trả về null khi không tách được (y < 10 hoặc y tròn chục) để game dùng gợi ý thường. */
export function decomposeHint(x, op, y) {
  if (y < 10) return null;
  const tens = Math.floor(y / 10) * 10;
  const ones = y % 10;
  if (ones === 0) return null;
  if (op === "+") return `💡 Mẹo hay: ${x} + ${tens} = ${x + tens}, rồi cộng thêm ${ones} nữa là ra đáp án!`;
  return `💡 Mẹo hay: ${x} − ${tens} = ${x - tens}, rồi trừ thêm ${ones} nữa là ra đáp án!`;
}
