/* Test tính chất của js/mathbank.js — chạy: node tests/mathbank.test.js
   Với D = 1..30: mọi phép tính sinh ra đều hợp lệ trong phạm vi 100,
   trừ không âm, đáp án đúng luôn có mặt trong các lựa chọn, lựa chọn phân biệt. */
const assert = require("assert");
const { params } = require("../js/difficulty.js");
const M = require("../js/mathbank.js");

let checks = 0;
function ok(cond, msg) { checks++; assert.ok(cond, msg); }
const SAMPLES = 200;

for (let D = 1; D <= 30; D++) {
  /* --- Tính Nhanh --- */
  const P1 = params("tinh-nhanh", D);
  for (let i = 0; i < SAMPLES; i++) {
    const q = M.makeAddSub(P1);
    ok(q.a >= 0 && q.a <= 100 && q.b >= 0 && q.b <= 100, `TN D=${D}: số hạng trong [0,100] (${q.a} ${q.op} ${q.b})`);
    ok(q.a <= P1.maxNum && q.b <= P1.maxNum, `TN D=${D}: số hạng <= maxNum=${P1.maxNum}`);
    ok(q.answer >= 0 && q.answer <= 100, `TN D=${D}: kết quả trong [0,100] (=${q.answer})`);
    ok(q.answer <= P1.maxNum, `TN D=${D}: kết quả <= maxNum`);
    if (q.op === "+") ok(q.answer === q.a + q.b, `TN D=${D}: cộng đúng`);
    else { ok(q.answer === q.a - q.b && q.a >= q.b, `TN D=${D}: trừ đúng, không âm`); }
    const ch = M.makeChoices(q.answer, P1.choices, P1.distGap);
    ok(ch.length === P1.choices, `TN D=${D}: đủ ${P1.choices} lựa chọn`);
    ok(new Set(ch).size === ch.length, `TN D=${D}: lựa chọn phân biệt`);
    ok(ch.includes(q.answer), `TN D=${D}: có đáp án đúng trong lựa chọn`);
    ok(ch.every(v => v >= 0 && v <= 100 && Number.isInteger(v)), `TN D=${D}: lựa chọn nguyên trong [0,100]`);
  }
  /* --- Tìm Số Bí Ẩn --- */
  const P2 = params("so-bi-an", D);
  for (let i = 0; i < SAMPLES; i++) {
    const q = M.makeMissing(P2);
    ok(q.a >= 0 && q.a <= 100 && q.b >= 0 && q.b <= 100 && q.c >= 0 && q.c <= 100, `BA D=${D}: mọi số trong [0,100]`);
    if (q.op === "+") ok(q.a + q.b === q.c, `BA D=${D}: a + b = c`);
    else ok(q.a - q.b === q.c && q.a >= q.b, `BA D=${D}: a - b = c, không âm`);
    ok(q.missing === (q.blank === "a" ? q.a : q.b), `BA D=${D}: số bí ẩn khớp vị trí giấu`);
    if (P2.blankTypes < 4) ok(q.blank === "b", `BA D=${D}: cấp thấp chỉ giấu số thứ hai`);
    if (q.op === "+") ok(q.type === 0 || q.type === 1, `BA D=${D}: kiểu cộng hợp lệ`);
    else ok(q.type === 2 || q.type === 3, `BA D=${D}: kiểu trừ hợp lệ`);
    const ch = M.makeChoices(q.missing, P2.choices, P2.distGap);
    ok(ch.length === P2.choices && new Set(ch).size === ch.length && ch.includes(q.missing),
      `BA D=${D}: lựa chọn hợp lệ, có số bí ẩn`);
  }
}

/* Tần suất có nhớ/có mượn bám theo carryP (kiểm tra thống kê, biên rộng) */
{
  const P = params("tinh-nhanh", 1); // carryP = 0
  let carries = 0;
  for (let i = 0; i < 400; i++) { const q = M.buildEquation(P, "+", false); if (q.carry) carries++; }
  assert.strictEqual(carries, 0); checks++;
  let borrows = 0;
  for (let i = 0; i < 400; i++) { const q = M.buildEquation(P, "-", false); if (q.carry) borrows++; }
  assert.strictEqual(borrows, 0); checks++;
}
{
  const P = params("tinh-nhanh", 10); // carryP = 0.7
  let carries = 0, N = 600;
  for (let i = 0; i < N; i++) { if (M.buildEquation(P, "+", true).carry) carries++; }
  ok(carries / N > 0.9, `cộng có nhớ ở D=10 khi yêu cầu: ${carries}/${N}`);
  let plain = 0;
  for (let i = 0; i < N; i++) { if (!M.buildEquation(P, "+", false).carry) plain++; }
  ok(plain / N > 0.9, `cộng không nhớ ở D=10 khi yêu cầu: ${plain}/${N}`);
  let borrows = 0;
  for (let i = 0; i < N; i++) { if (M.buildEquation(P, "-", true).carry) borrows++; }
  ok(borrows / N > 0.9, `trừ có mượn ở D=10 khi yêu cầu: ${borrows}/${N}`);
}

console.log(`mathbank.test.js: ${checks} assertions đạt (D=1..30, ${SAMPLES} mẫu/game/cấp)`);
