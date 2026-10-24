/* Test bố cục khung chơi bung theo màn hình (16:10 kiểu MacBook) — chạy:
   node tests/layout.test.js   (cần server tĩnh ở http://localhost:8901) */
const { chromium } = require("/home/hatch/workspace/planning-poker/app/node_modules/playwright");
const BASE = "http://localhost:8901/";
let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log("  ✓ " + msg); }
  else { failed++; console.log("  ✗ FAIL: " + msg); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function newPage(browser, w, h, seedDiff) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
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

async function stageBoxCheck(browser, vw, vh, expW, expH, label) {
  const { ctx, page } = await newPage(browser, vw, vh, null);
  await openLevel(page, 1);
  const box = await page.locator("#level-stage").boundingBox();
  ok(box && Math.abs(box.width - expW) <= 32, `${label}: bề ngang sân = ${box && Math.round(box.width)} (kỳ vọng ~${expW})`);
  ok(box && Math.abs(box.height - expH) <= 24, `${label}: chiều cao sân = ${box && Math.round(box.height)} (kỳ vọng ~${expH})`);
  ok(box && Math.abs(box.width / box.height - 1.6) <= 0.03, `${label}: tỉ lệ = ${box && (box.width / box.height).toFixed(3)} (kỳ vọng 1.6)`);
  const fit = await page.evaluate(() => ({
    scrollH: document.documentElement.scrollHeight,
    innerH: window.innerHeight
  }));
  ok(box && box.y + box.height <= vh + 1, `${label}: đáy sân = ${box && Math.round(box.y + box.height)} ≤ ${vh}`);
  ok(fit.scrollH <= fit.innerH + 1, `${label}: trang không cuộn dọc (scrollHeight=${fit.scrollH}, viewport=${fit.innerH})`);
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();

  /* ===== Đo khung sân ở 2 cỡ MacBook ===== */
  console.log("Đo khung sân");
  await stageBoxCheck(browser, 1512, 982, Math.min(1512 - 28, (982 - 150) * 1.6), Math.min(1512 - 28, (982 - 150) * 1.6) / 1.6, "1512×982");
  await stageBoxCheck(browser, 1440, 900, 1200, 750, "1440×900");

  /* ===== Cả 5 màn ở viewport MacBook 14" 1512×982 ===== */
  console.log("Smoke 5 màn ở 1512×982");
  {
    const { ctx, page, errors } = await newPage(browser, 1512, 982, null);
    // Màn 1
    await openLevel(page, 1);
    await page.mouse.move(400, 300); await page.mouse.move(1000, 650, { steps: 25 }); await sleep(500);
    ok(await page.locator(".sea-item").count() > 0, "L1 có đồ vật, di chuột được ở sân lớn");
    await page.screenshot({ path: "qa-shots/layout-l1-mac.png" });
    await goHome(page);
    // Màn 2
    await openLevel(page, 2);
    await sleep(1200);
    ok(await page.locator(".crate").count() > 0, "L2 có thùng hàng rơi ở sân lớn");
    {
      const ship = await page.locator("#l2-ship").boundingBox();
      const st = await page.locator("#level-stage").boundingBox();
      ok(ship && ship.y + ship.height <= st.y + st.height + 1 && ship.x >= st.x - 1,
        "L2 tàu nằm trọn trong sân lớn");
    }
    await goHome(page);
    // Màn 3
    await openLevel(page, 3);
    ok(await page.locator(".drag-item").count() === 6, "L3 có 6 vật ở sân lớn");
    {
      const items = page.locator(".drag-item");
      const n = await items.count();
      let dragged = false;
      for (let i = 0; i < n && !dragged; i++) {
        if (!(await items.nth(i).evaluate(el => el.dataset.type === "car"))) continue;
        const ib = await items.nth(i).boundingBox();
        const zb = await page.locator('.sort-zone[data-type="car"]').boundingBox();
        await page.mouse.move(ib.x + ib.width / 2, ib.y + ib.height / 2);
        await page.mouse.down();
        await page.mouse.move(zb.x + zb.width / 2, zb.y + zb.height / 2, { steps: 18 });
        await page.mouse.up();
        dragged = true;
      }
      await sleep(600);
      ok(dragged && (await page.locator("#level-hud").innerText()).includes("1/6"), "L3 kéo ô tô vào ga-ra được ở sân lớn");
    }
    await goHome(page);
    // Màn 4: lái theo đường vài giây ở khung lớn
    await openLevel(page, 4);
    {
      const sb = await page.locator("#level-stage").boundingBox();
      const samples = await page.evaluate(() => window.__l4samples.slice(0, 140));
      await page.mouse.move(sb.x + samples[0].x, sb.y + samples[0].y);
      await page.mouse.down();
      for (const p of samples) { await page.mouse.move(sb.x + p.x, sb.y + p.y); await sleep(10); }
      const car = await page.evaluate(() => window.__l4debug.carPos);
      const moved = Math.hypot(car.x - samples[0].x, car.y - samples[0].y) > 150;
      ok(moved, `L4 xe chạy được ở sân lớn (vị trí xe: ${JSON.stringify(car)})`);
      await page.mouse.up();
      await page.screenshot({ path: "qa-shots/layout-l4-mac.png" });
    }
    await goHome(page);
    // Màn 5: khung thành lớn hơn, thủ môn nằm trong khung thành, sút được 1 quả
    await openLevel(page, 5);
    {
      const geo = await page.evaluate(() => {
        const g = document.querySelector("#l5-goal").getBoundingClientRect();
        const k = document.querySelector("#l5-keeper").getBoundingClientRect();
        return { goalH: g.height, goalTop: g.top, goalBottom: g.bottom, kTop: k.top, kBottom: k.bottom, kH: k.height };
      });
      ok(geo.goalH > 380, `L5 khung thành cao hơn bản cũ 300px (=${Math.round(geo.goalH)}px)`);
      ok(geo.kTop >= geo.goalTop - 2 && geo.kBottom <= geo.goalBottom + 24,
        `L5 thủ môn nằm trong khung thành (keeper ${Math.round(geo.kTop)}..${Math.round(geo.kBottom)} vs goal ${Math.round(geo.goalTop)}..${Math.round(geo.goalBottom)})`);
      const sb = await page.locator("#level-stage").boundingBox();
      const goal = await page.evaluate(() => {
        const g = document.querySelector("#l5-goal").getBoundingClientRect();
        const s = document.querySelector("#level-stage").getBoundingClientRect();
        return { left: g.left - s.left, top: g.top - s.top, width: g.width };
      });
      await page.mouse.move(sb.x + goal.left + 44, sb.y + goal.top + 60);
      await page.mouse.down(); await sleep(480); await page.mouse.up();
      await sleep(1400);
      ok((await page.locator("#level-hud").innerText()).includes("Quả 2/5"), "L5 sút được quả đầu ở sân lớn (HUD Quả 2/5)");
      await page.screenshot({ path: "qa-shots/layout-l5-mac.png" });
    }
    ok(errors.length === 0, `Smoke Mac: 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  await browser.close();
  console.log(`\nlayout.test.js: ${passed} đạt, ${failed} trượt`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error("TEST CRASH:", e); process.exit(2); });
