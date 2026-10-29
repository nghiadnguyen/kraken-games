/* KrakenMath — sinh câu hỏi toán cho Đảo Toán (thuần, không chạm DOM).
   Mọi phép tính đều nằm trong phạm vi 100: số hạng và kết quả thuộc [0, 100],
   phép trừ không bao giờ âm. Tham số lấy từ KrakenDifficulty.params(id, D).
   Dùng được trên trình duyệt (window.KrakenMath) và trong Node (module.exports) như difficulty.js. */
(function (root) {
  "use strict";

  function randInt(min, max) {
    if (max < min) max = min;
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  /* Dựng 1 phép tính a (op) b = answer thỏa: số hạng & kết quả <= P.maxNum (<= 100),
     và cờ carry/borrow đúng như wantCarry yêu cầu (lấy mẫu loại suy, có dự phòng). */
  function buildEquation(P, op, wantCarry) {
    const M = P.maxNum;
    let last = null;
    for (let t = 0; t < 300; t++) {
      let a, b;
      if (op === "+") {
        a = randInt(1, M - 1);
        b = randInt(1, M - a);
      } else {
        a = randInt(2, M);
        b = randInt(1, a);
      }
      const carry = op === "+" ? (a % 10) + (b % 10) >= 10 : (a % 10) < (b % 10);
      last = { a: a, op: op, b: b, answer: op === "+" ? a + b : a - b, carry: carry };
      if (carry === wantCarry) return last;
    }
    return last; // cực hiếm: vẫn là phép tính hợp lệ trong phạm vi, chỉ lệch cờ nhớ/mượn
  }

  /* Game "Tính Nhanh": 1 phép cộng/trừ hoàn chỉnh. P cần có subFrac + carryP. */
  function makeAddSub(P) {
    const op = Math.random() < P.subFrac ? "-" : "+";
    return buildEquation(P, op, Math.random() < P.carryP);
  }

  /* Game "Tìm Số Bí Ẩn": dựng phép tính đầy đủ rồi giấu 1 vị trí.
     Kiểu vị trí (theo P.blankTypes): 0: a + ? = c · 1: ? + b = c · 2: a − ? = c · 3: ? − b = c.
     Cấp thấp (blankTypes=2) chỉ dùng kiểu 0 và 2 — thiếu số hạng/thừa số thứ hai. */
  function makeMissing(P) {
    const op = Math.random() < 0.5 ? "-" : "+";
    const eq = buildEquation(P, op, Math.random() < P.carryP);
    const allowed = (P.blankTypes >= 4 ? [0, 1, 2, 3] : [0, 2]).filter(t => (t < 2) === (op === "+"));
    const type = allowed[randInt(0, allowed.length - 1)];
    const blank = type % 2 === 0 ? "b" : "a";
    return {
      a: eq.a, op: op, b: eq.b, c: eq.answer, carry: eq.carry,
      blank: blank, type: type,
      missing: blank === "a" ? eq.a : eq.b
    };
  }

  /* Danh sách đáp án để chọn: gồm đáp án đúng + (count-1) đáp án nhiễu "gần" đáp án đúng
     (lệch gap, lệch 1-2, lệch tròn chục...), tất cả phân biệt, nằm trong [0, 100], đã xáo trộn. */
  function makeChoices(correct, count, gap) {
    const seen = new Set([correct]);
    const out = [correct];
    const offsets = [gap, -gap, 1, -1, 2 * gap, -2 * gap, 10, -10, 2, -2, 20, -20];
    for (const off of offsets) {
      if (out.length >= count) break;
      const v = correct + off;
      if (v >= 0 && v <= 100 && !seen.has(v)) { seen.add(v); out.push(v); }
    }
    let k = 3;
    while (out.length < count) { // dự phòng khi đáp án đúng sát biên 0/100
      const v = correct + k;
      if (v >= 0 && v <= 100 && !seen.has(v)) { seen.add(v); out.push(v); }
      k++;
    }
    for (let i = out.length - 1; i > 0; i--) { // Fisher-Yates
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  const api = { buildEquation: buildEquation, makeAddSub: makeAddSub, makeMissing: makeMissing, makeChoices: makeChoices };
  root.KrakenMath = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
