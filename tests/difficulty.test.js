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

/* D không hợp lệ -> kẹp về 1 */
assert.deepStrictEqual(params(2, 0), params(2, 1));
assert.deepStrictEqual(params(4, -3), params(4, 1));

console.log(`difficulty.test.js: ${checks} assertions đạt (D=1..30, 5 màn)`);
