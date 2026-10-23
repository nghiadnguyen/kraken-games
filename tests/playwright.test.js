/* Test trình duyệt cho hệ độ khó theo công thức — chạy:
   node tests/playwright.test.js   (cần server tĩnh ở http://localhost:8901) */
const { chromium } = require("/home/hatch/workspace/planning-poker/app/node_modules/playwright");
const BASE = "http://localhost:8901/";
let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log("  ✓ " + msg); }
  else { failed++; console.log("  ✗ FAIL: " + msg); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function newPage(browser, seedDiff) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  if (seedDiff) {
    await ctx.addInitScript((diff) => {
      localStorage.setItem("krakenProgress", JSON.stringify({ stars: {}, completed: {}, difficulty: diff }));
    }, seedDiff);
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  await page.goto(BASE, { waitUntil: "load" });
  await sleep(400);
  return { ctx, page, errors };
}
async function openLevel(page, n) {
  await page.click(`.level-btn[data-level="${n}"]`);
  await sleep(700);
}
async function goHome(page) { await page.click("#btn-home"); await sleep(400); }

(async () => {
  const browser = await chromium.launch();

  /* ============ (a) mặc định D=1: cả 5 màn ============ */
  console.log("(a) Mặc định D=1");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    // Màn 1
    await openLevel(page, 1);
    ok(await page.locator("#diff-label").innerText() === "Cấp 1", "L1 stepper hiện Cấp 1");
    ok((await page.locator("#btn-diff-minus").isDisabled()), "L1 nút − bị khóa ở Cấp 1");
    ok((await page.locator("#level-hud").innerText()).includes("/12"), "L1 HUD tổng 12 món (công thức D=1)");
    await page.mouse.move(300, 300); await page.mouse.move(800, 500, { steps: 25 }); await sleep(600);
    ok(await page.locator(".sea-item").count() > 0, "L1 có đồ vật trên sân, chuột di chuyển được");
    await goHome(page);
    // Màn 2
    await openLevel(page, 2);
    ok((await page.locator("#level-hud").innerText()).includes("0/10"), "L2 HUD mục tiêu /10 ở D=1");
    await sleep(1200);
    const crate = page.locator(".crate").first();
    ok(await page.locator(".crate").count() > 0, "L2 có thùng hàng rơi");
    try { await crate.click({ timeout: 3000 }); } catch (e) {
      await crate.evaluate(el => el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
    }
    await sleep(700);
    ok((await page.locator("#level-hud").innerText()).includes("1/10"), "L2 click hứng được 1 thùng (HUD 1/10)");
    await goHome(page);
    // Màn 3
    await openLevel(page, 3);
    ok(await page.locator(".drag-item").count() === 6, "L3 có đúng 6 vật ở D=1");
    ok(await page.locator(".zone-icon").count() === 3, "L3 hintLevel=2: zone có icon gợi ý");
    {
      // kéo 1 chiếc ô tô vào ga-ra
      const items = page.locator(".drag-item");
      const n = await items.count();
      let dragged = false;
      for (let i = 0; i < n && !dragged; i++) {
        const hasCar = await items.nth(i).evaluate(el => el.dataset.type === "car");
        if (!hasCar) continue;
        const ib = await items.nth(i).boundingBox();
        const zb = await page.locator('.sort-zone[data-type="car"]').boundingBox();
        await page.mouse.move(ib.x + ib.width / 2, ib.y + ib.height / 2);
        await page.mouse.down();
        await page.mouse.move(zb.x + zb.width / 2, zb.y + zb.height / 2, { steps: 18 });
        await page.mouse.up();
        dragged = true;
      }
      await sleep(600);
      ok(dragged && (await page.locator("#level-hud").innerText()).includes("1/6"), "L3 kéo ô tô vào ga-ra thành công (HUD 1/6)");
    }
    await goHome(page);
    // Màn 4
    await openLevel(page, 4);
    const dbg1 = await page.evaluate(() => window.__l4debug);
    ok(dbg1 && dbg1.D === 1 && dbg1.roadWidth === 128 && dbg1.ctrlCount === 8 && dbg1.coins === 8,
      `L4 debug D=1 đúng công thức: ${JSON.stringify(dbg1)}`);
    {
      const sb = await page.locator("#level-stage").boundingBox();
      const samples = await page.evaluate(() => window.__l4samples.slice(0, 60));
      await page.mouse.move(sb.x + samples[0].x, sb.y + samples[0].y);
      await page.mouse.down();
      for (const p of samples) { await page.mouse.move(sb.x + p.x, sb.y + p.y); await sleep(12); }
      const tr = await page.locator("#l4-car").evaluate(el => el.style.transform);
      ok(/rotate\(-?[0-9.]+deg\)/.test(tr), `L4 xe di chuyển + xoay theo hướng (${tr})`);
      await page.mouse.up();
    }
    await goHome(page);
    // Màn 5
    await openLevel(page, 5);
    ok((await page.locator("#level-hud").innerText()).includes("Cần vào: 2"), "L5 HUD Cần vào: 2 ở D=1");
    {
      const sb = await page.locator("#level-stage").boundingBox();
      await page.mouse.move(sb.x + sb.width * 0.30, sb.y + 190);
      await page.mouse.down(); await sleep(480); await page.mouse.up();
      await sleep(1400);
      ok((await page.locator("#level-hud").innerText()).includes("Quả 2/5"), "L5 sút được quả đầu, HUD sang Quả 2/5");
    }
    ok(errors.length === 0, `(a) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (b) L4 ở D=8 ============ */
  console.log("(b) Màn 4 ở D=8");
  {
    const { ctx, page, errors } = await newPage(browser, { 4: 8 });
    ok((await page.locator('.level-badge[data-diff-for="4"]').innerText()) === "Cấp 8", "Trang chủ: badge Màn 4 hiện Cấp 8");
    await openLevel(page, 4);
    const dbg = await page.evaluate(() => window.__l4debug);
    ok(dbg && dbg.D === 8, `L4 debug D=8 (${JSON.stringify(dbg)})`);
    ok(dbg && Math.abs(dbg.roadWidth - 128 * Math.pow(0.95, 7)) < 0.6, `L4 roadWidth ≈ 89 (=${dbg && dbg.roadWidth})`);
    ok(dbg && dbg.ctrlCount === 15, `L4 ctrlCount = 15 (=${dbg && dbg.ctrlCount})`);
    ok(dbg && dbg.coins === 15, `L4 coins = 15 (=${dbg && dbg.coins})`);
    ok(errors.length === 0, "(b) 0 lỗi console");
    await ctx.close();
  }

  /* ============ (c) L3 ở D=6 (công thức: perType=5 → 15 vật) và D=9 (18 vật) ============ */
  console.log("(c) Màn 3 ở D=6 và D=9");
  {
    const { ctx, page, errors } = await newPage(browser, { 3: 6 });
    await openLevel(page, 3);
    ok(await page.locator(".drag-item").count() === 15, "L3 D=6: 15 vật (perType=5 theo công thức)");
    ok(await page.locator(".zone-icon").count() === 0, "L3 D=6: hintLevel=0, zone không còn icon");
    ok(await page.locator(".slot").count() === 15, "L3 D=6: có ô đỗ (3 zone × 5 ô = 15)");
    ok(errors.length === 0, "(c1) 0 lỗi console");
    await ctx.close();
  }
  {
    const { ctx, page } = await newPage(browser, { 3: 9 });
    await openLevel(page, 3);
    ok(await page.locator(".drag-item").count() === 18, "L3 D=9: 18 vật (perType=6, mức tối đa)");
    await ctx.close();
  }

  /* ============ (d) Màn 5: hoàn thành -> cấp thay đổi đúng luật ============ */
  console.log("(d) Màn 5 trọn vòng lên/xuống cấp");
  {
    const { ctx, page, errors } = await newPage(browser, { 5: 1 });
    await openLevel(page, 5);
    const sb = await page.locator("#level-stage").boundingBox();
    const goal = await page.evaluate(() => {
      const g = document.querySelector("#l5-goal").getBoundingClientRect();
      const s = document.querySelector("#level-stage").getBoundingClientRect();
      return { left: g.left - s.left, top: g.top - s.top, width: g.width, height: g.height };
    });
    for (let shot = 0; shot < 5; shot++) {
      const cornerX = shot % 2 === 0 ? goal.left + 44 : goal.left + goal.width - 44;
      await page.mouse.move(sb.x + cornerX, sb.y + goal.top + 52);
      await sleep(250 + shot * 160);
      await page.mouse.down(); await sleep(480); await page.mouse.up();
      await sleep(1500);
    }
    await page.waitForSelector("#screen-complete:not(.hidden)", { timeout: 12000 });
    const msg = await page.locator("#complete-message").innerText();
    const m = msg.match(/(\d+)\/5/);
    const goals = m ? parseInt(m[1], 10) : -1;
    const need = 2; // D=1
    const expectedDelta = goals >= need ? 1 : goals <= need - 2 ? -1 : 0;
    const expectedD = Math.max(1, 1 + expectedDelta);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")).difficulty[5]);
    ok(goals >= 0, `L5 đọc được số bàn thắng từ màn hoàn thành: ${goals}`);
    ok(stored === expectedD, `L5 cấp lưu = ${stored}, kỳ vọng ${expectedD} (goals=${goals}, need=${need})`);
    const diffText = await page.locator("#complete-diff").innerText();
    const lineOk = expectedDelta > 0 ? diffText.includes(`Lên Cấp ${expectedD}`)
      : expectedDelta < 0 ? diffText.includes(`quay lại Cấp ${expectedD}`)
      : diffText.includes("Giữ nguyên Cấp 1");
    ok(lineOk, `L5 dòng cấp ở màn hoàn thành đúng: "${diffText.replace(/\n/g, " / ")}"`);
    // Chơi lại phải dùng cấp MỚI
    await page.click("#btn-replay");
    await sleep(700);
    ok((await page.locator("#diff-label").innerText()) === `Cấp ${expectedD}`, `L5 chơi lại dùng cấp mới (${expectedD})`);
    ok(errors.length === 0, "(d) 0 lỗi console");
    await ctx.close();
  }

  /* ============ Ảnh chụp độ khó ============ */
  console.log("(e) Screenshots");
  {
    const { ctx, page } = await newPage(browser, null);
    await openLevel(page, 4); await sleep(500);
    await page.screenshot({ path: "qa-shots/difficulty-l4-d1.png" });
    ok(true, "Đã chụp difficulty-l4-d1.png");
    await ctx.close();
  }
  {
    const { ctx, page } = await newPage(browser, { 4: 10 });
    await openLevel(page, 4); await sleep(500);
    await page.screenshot({ path: "qa-shots/difficulty-l4-d10.png" });
    ok(true, "Đã chụp difficulty-l4-d10.png");
    await ctx.close();
  }
  {
    const { ctx, page } = await newPage(browser, { 2: 10 });
    await openLevel(page, 2); await sleep(2200);
    await page.screenshot({ path: "qa-shots/difficulty-l2-d10.png" });
    ok(true, "Đã chụp difficulty-l2-d10.png");
    await ctx.close();
  }

  await browser.close();
  console.log(`\nplaywright.test.js: ${passed} đạt, ${failed} trượt`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error("TEST CRASH:", e); process.exit(2); });
