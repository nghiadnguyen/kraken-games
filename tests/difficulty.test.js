/* Test tính chất của js/difficulty.js — chạy: node tests/difficulty.test.js
   Với D = 1..30, mọi màn: thông số hữu hạn, đơn điệu đúng chiều, không vượt trần/sàn. */
const assert = require("assert");
const { params } = require("../js/difficulty.js");

let checks = 0;
function ok(cond, msg) { checks++; assert.ok(cond, msg); }
function mono(level, key, dir, Ds) {
  let prev = null;
  for (const D of Ds) {
    const v = params(level, D)[key];
    ok(Number.isFinite(v), `L${level}.${key} hữu hạn ở D=${D} (=${v})`);
    if (prev !== null) {
      if (dir === "up") ok(v >= prev, `L${level}.${key} không giảm: D=${D - 1}:${prev} -> D=${D}:${v}`);
      else ok(v <= prev, `L${level}.${key} không tăng: D=${D - 1}:${prev} -> D=${D}:${v}`);
    }
    prev = v;
  }
}
const Ds = []; for (let d = 1; d <= 30; d++) Ds.push(d);

/* Màn 1 */
mono(1, "count", "up", Ds); mono(1, "sizePx", "down", Ds);
mono(1, "movingFrac", "up", Ds); mono(1, "moveSpeed", "up", Ds);
for (const D of Ds) { const p = params(1, D); ok(p.sizePx >= 36 && p.count <= 30 && p.movingFrac <= 0.7 && p.moveSpeed <= 1.6, `L1 trần/sàn D=${D}`); }
assert.strictEqual(params(1, 1).count, 12); assert.strictEqual(params(1, 1).sizePx, 78);
assert.strictEqual(params(1, 2).movingFrac, 0); assert.ok(params(1, 3).movingFrac > 0);

/* Màn 2 */
mono(2, "speedBase", "up", Ds); mono(2, "spawnBaseMs", "down", Ds); mono(2, "goal", "up", Ds);
mono(2, "swayAmpPx", "up", Ds); mono(2, "doubleChance", "up", Ds);
for (const D of Ds) { const p = params(2, D); ok(p.speedBase <= 2.0 && p.spawnBaseMs >= 650 && p.goal <= 30 && p.swayAmpPx <= 60 && p.doubleChance <= 0.5, `L2 trần/sàn D=${D}`); }
assert.strictEqual(params(2, 1).goal, 10); assert.strictEqual(params(2, 1).spawnBaseMs, 1700);
assert.strictEqual(params(2, 3).swayAmpPx, 0); assert.ok(params(2, 4).swayAmpPx > 0);

/* Màn 3 */
mono(3, "perType", "up", Ds); mono(3, "total", "up", Ds); mono(3, "itemWPx", "down", Ds);
for (const D of Ds) {
  const p = params(3, D);
  ok(p.itemWPx >= 72 && p.perType <= 6 && p.total === 3 * p.perType, `L3 trần/sàn D=${D}`);
  ok(p.slotsOn === (D >= 5), `L3 slotsOn D=${D}`);
  if (p.slotsOn) ok(p.slotTolPx >= 22 && p.slotTolPx <= 70, `L3 slotTol D=${D}: ${p.slotTolPx}`);
}
assert.strictEqual(params(3, 1).total, 6); assert.strictEqual(params(3, 6).total, 15); assert.strictEqual(params(3, 9).total, 18);
assert.strictEqual(params(3, 2).hintLevel, 2); assert.strictEqual(params(3, 5).hintLevel, 1); assert.strictEqual(params(3, 6).hintLevel, 0);
{ let prev = Infinity; for (const D of [5, 8, 12, 20, 30]) { const t = params(3, D).slotTolPx; ok(t <= prev, "L3 slotTol không tăng"); prev = t; } }

/* Màn 4 */
mono(4, "roadWidth", "down", Ds); mono(4, "ctrlCount", "up", Ds); mono(4, "coins", "up", Ds);
mono(4, "swingHalf", "up", Ds); mono(4, "obstacles", "up", Ds); mono(4, "dropMs", "down", Ds);
for (const D of Ds) { const p = params(4, D); ok(p.roadWidth >= 64 && p.ctrlCount <= 15 && p.coins <= 16 && p.obstacles <= 6 && p.swingHalf <= 0.40 && p.dropMs >= 600, `L4 trần/sàn D=${D}`); }
assert.strictEqual(params(4, 1).roadWidth, 128); assert.strictEqual(params(4, 1).coins, 8);
assert.strictEqual(params(4, 1).dropMs, 1300);
assert.strictEqual(params(4, 8).dropMs, Math.round(1300 * Math.pow(0.96, 7)));
assert.ok(Math.abs(params(4, 8).roadWidth - 128 * Math.pow(0.95, 7)) < 1e-9, "L4 D=8 roadWidth ≈ 89");
assert.strictEqual(params(4, 8).ctrlCount, 15); assert.strictEqual(params(4, 8).coins, 15);

/* Màn 5 */
mono(5, "keeperSpeed", "up", Ds); mono(5, "saveRadius", "up", Ds); mono(5, "keeperAmpFrac", "up", Ds);
mono(5, "chargeRate", "up", Ds); mono(5, "needGoals", "up", Ds);
for (const D of Ds) {
  const p = params(5, D);
  ok(p.greenLow < p.greenHigh, `L5 vùng xanh hợp lệ D=${D}: ${p.greenLow} < ${p.greenHigh}`);
  ok(p.keeperSpeed <= 2.6 && p.saveRadius <= 110 && p.needGoals <= 5 && p.chargeRate <= 3.2, `L5 trần D=${D}`);
  ok(p.weakSaveRadius === Math.round(p.saveRadius * 1.31), `L5 weakSaveRadius D=${D}`);
  ok(p.shots === 5, "L5 luôn 5 quả");
}
{ let prev = Infinity; for (const D of Ds) { const w = params(5, D).greenHigh - params(5, D).greenLow; ok(w <= prev + 1e-12, `L5 vùng xanh không nở: D=${D}`); prev = w; } }
assert.strictEqual(params(5, 1).needGoals, 2); assert.strictEqual(params(5, 1).greenLow, 30); assert.strictEqual(params(5, 1).greenHigh, 85);

/* ===== Đảo Toán: Tính Nhanh & Tìm Số Bí Ẩn ===== */
function monoId(id, key, dir) {
  let prev = null;
  for (const D of Ds) {
    const v = params(id, D)[key];
    ok(Number.isFinite(v), `${id}.${key} hữu hạn ở D=${D} (=${v})`);
    if (prev !== null) {
      if (dir === "up") ok(v >= prev, `${id}.${key} không giảm: D=${D - 1}:${prev} -> D=${D}:${v}`);
      else ok(v <= prev, `${id}.${key} không tăng: D=${D - 1}:${prev} -> D=${D}:${v}`);
    }
    prev = v;
  }
}
for (const id of ["tinh-nhanh", "so-bi-an"]) {
  monoId(id, "maxNum", "up"); monoId(id, "carryP", "up"); monoId(id, "questions", "up");
  monoId(id, "choices", "up"); monoId(id, "distGap", "down");
  for (const D of Ds) {
    const p = params(id, D);
    ok(p.maxNum >= 10 && p.maxNum <= 100, `${id} maxNum trong [10,100] ở D=${D} (=${p.maxNum})`);
    ok(p.carryP >= 0 && p.carryP <= 1, `${id} carryP trong [0,1] ở D=${D} (=${p.carryP})`);
    ok(p.questions >= 5 && p.questions <= 10, `${id} questions trong [5,10] ở D=${D}`);
    ok(p.choices === 3 || p.choices === 4, `${id} choices là 3 hoặc 4 ở D=${D}`);
    ok(p.distGap >= 1, `${id} distGap >= 1 ở D=${D}`);
  }
  assert.strictEqual(params(id, 1).maxNum, 10);
  assert.strictEqual(params(id, 1).carryP, 0);
  assert.strictEqual(params(id, 1).questions, 5);
  assert.strictEqual(params(id, 1).choices, 3);
  assert.strictEqual(params(id, 1).distGap, 10);
  assert.strictEqual(params(id, 10).maxNum, 100);
  assert.strictEqual(params(id, 30).maxNum, 100);
  assert.ok(Math.abs(params(id, 10).carryP - 0.7) < 1e-9, `${id} carryP chạm trần 0.7 ở D=10`);
}
monoId("tinh-nhanh", "subFrac", "up");
for (const D of Ds) { const p = params("tinh-nhanh", D); ok(p.subFrac > 0 && p.subFrac <= 0.5, `tinh-nhanh subFrac trong (0, 0.5] ở D=${D}`); }
assert.strictEqual(params("tinh-nhanh", 1).subFrac, 0.3);
monoId("so-bi-an", "blankTypes", "up");
assert.strictEqual(params("so-bi-an", 1).blankTypes, 2);
assert.strictEqual(params("so-bi-an", 2).blankTypes, 2);
assert.strictEqual(params("so-bi-an", 3).blankTypes, 4);
assert.strictEqual(params("so-bi-an", 30).blankTypes, 4);

/* ===== Đảo Toán: 4 game mới (Đua Xe, Penalty, Tháp Pháo, Kho Báu) ===== */
for (const id of ["dua-xe-toan", "penalty-toan", "thap-phao", "kho-bau"]) {
  monoId(id, "maxNum", "up"); monoId(id, "carryP", "up"); monoId(id, "questions", "up"); monoId(id, "subFrac", "up");
  for (const D of Ds) {
    const p = params(id, D);
    ok(p.maxNum >= 10 && p.maxNum <= 100, `${id} maxNum trong [10,100] ở D=${D}`);
    ok(p.carryP >= 0 && p.carryP <= 0.7, `${id} carryP trong [0,0.7] ở D=${D}`);
    ok(p.questions >= 5 && p.questions <= 10, `${id} questions trong [5,10] ở D=${D}`);
    ok(p.subFrac > 0 && p.subFrac <= 0.5, `${id} subFrac trong (0,0.5] ở D=${D}`);
  }
  assert.strictEqual(params(id, 1).maxNum, 10);
  assert.strictEqual(params(id, 1).questions, 5);
}

/* Đua Xe Toán */
monoId("dua-xe-toan", "oppSpeed1", "up"); monoId("dua-xe-toan", "oppSpeed2", "up");
monoId("dua-xe-toan", "decayTauS", "down"); monoId("dua-xe-toan", "raceDistPx", "up");
for (const D of Ds) {
  const p = params("dua-xe-toan", D);
  ok(p.oppSpeed1 <= 190 && p.oppSpeed2 <= 170 && p.decayTauS >= 1.4, `dua-xe trần/sàn D=${D}`);
  ok(p.raceDistPx === 880 * p.questions, `dua-xe raceDistPx = 880 x questions ở D=${D}`);
  ok(p.boostPxS > p.oppSpeed1, `dua-xe: vọt (${p.boostPxS}) nhanh hơn đối thủ 1 ở D=${D}`);
  ok(p.crawlPxS < p.oppSpeed2, `dua-xe: bò (${p.crawlPxS}) chậm hơn đối thủ 2 ở D=${D}`);
}
assert.strictEqual(params("dua-xe-toan", 1).oppSpeed1, 95);
assert.strictEqual(params("dua-xe-toan", 1).oppSpeed2, 80);
assert.strictEqual(params("dua-xe-toan", 1).decayTauS, 2.3);
assert.strictEqual(params("dua-xe-toan", 1).raceDistPx, 4400);

/* Penalty Toán */
monoId("penalty-toan", "saveP", "up"); monoId("penalty-toan", "fastMs", "down"); monoId("penalty-toan", "needGoals", "up");
for (const D of Ds) {
  const p = params("penalty-toan", D);
  ok(p.saveP >= 0.45 && p.saveP <= 0.85, `penalty saveP trong [0.45,0.85] ở D=${D} (=${p.saveP})`);
  ok(p.fastMs >= 3000 && p.fastMs <= 9000, `penalty fastMs trong [3000,9000] ở D=${D}`);
  ok(p.needGoals <= 5 && p.shots === 5, `penalty needGoals<=5, luôn 5 quả ở D=${D}`);
  ok(p.needGoals === params(5, D).needGoals, `penalty needGoals khớp công thức Màn 5 ở D=${D}`);
}
assert.strictEqual(params("penalty-toan", 1).saveP, 0.45);
assert.strictEqual(params("penalty-toan", 1).fastMs, 9000);
assert.strictEqual(params("penalty-toan", 1).needGoals, 2);

/* Tháp Pháo Tàu Chiến */
monoId("thap-phao", "approachMs", "down"); monoId("thap-phao", "wiggleAmp", "up");
for (const D of Ds) {
  const p = params("thap-phao", D);
  ok(p.approachMs >= 4500 && p.approachMs <= 9500, `thap-phao approachMs trong [4500,9500] ở D=${D} (=${p.approachMs})`);
  ok(p.wiggleAmp <= 26 && p.hearts === 3 && p.waves === p.questions, `thap-phao trần/sàn ở D=${D}`);
  ok(D < 5 ? p.wiggleAmp === 0 : p.wiggleAmp > 0, `thap-phao wiggle chỉ từ D>=5 (D=${D}: ${p.wiggleAmp})`);
}
assert.strictEqual(params("thap-phao", 1).approachMs, 9500);
assert.strictEqual(params("thap-phao", 4).wiggleAmp, 0);
assert.ok(params("thap-phao", 5).wiggleAmp > 0);

/* Săn Kho Báu Biển Sâu */
monoId("kho-bau", "segments", "up");
for (const D of Ds) {
  const p = params("kho-bau", D);
  ok(p.segments === p.questions, `kho-bau segments = questions ở D=${D}`);
  ok(p.gemEvery === 3, `kho-bau gemEvery = 3 ở D=${D}`);
}

/* D không hợp lệ -> kẹp về 1 */
assert.deepStrictEqual(params(2, 0), params(2, 1));
assert.deepStrictEqual(params(4, -3), params(4, 1));
assert.deepStrictEqual(params("tinh-nhanh", 0), params("tinh-nhanh", 1));
assert.deepStrictEqual(params("dua-xe-toan", 0), params("dua-xe-toan", 1));
assert.deepStrictEqual(params("thap-phao", -2), params("thap-phao", 1));

console.log(`difficulty.test.js: ${checks} assertions đạt (D=1..30, 5 màn + 6 game toán)`);
