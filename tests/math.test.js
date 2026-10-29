/* Test trình duyệt cho Đảo Toán + bản đồ đảo + migrate tiến độ v1->v2 + iPad cảm ứng — chạy:
   node tests/math.test.js   (cần server tĩnh ở http://localhost:8901) */
const { chromium } = require("/home/hatch/workspace/planning-poker/app/node_modules/playwright");
const BASE = "http://localhost:8901/";
let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log("  ✓ " + msg); }
  else { failed++; console.log("  ✗ FAIL: " + msg); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function newPage(browser, seedProgress, ctxOpts) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 800 } }, ctxOpts || {}));
  if (seedProgress) {
    await ctx.addInitScript((p) => { localStorage.setItem("krakenProgress", JSON.stringify(p)); }, seedProgress);
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  await page.goto(BASE, { waitUntil: "load" });
  await sleep(500);
  return { ctx, page, errors };
}
async function openGame(page, id) {
  await page.click(`.level-btn[data-game="${id}"]`);
  await sleep(700);
}
async function debug(page) { return page.evaluate(() => window.__mathDebug || null); }
async function clickChoice(page, value) {
  return page.evaluate((v) => {
    const b = [...document.querySelectorAll(".math-choice")].find(x => !x.disabled && x.textContent.trim() === String(v));
    if (!b) return false;
    b.click();
    return true;
  }, value);
}
async function wrongValue(page) {
  return page.evaluate(() => {
    const ans = window.__mathDebug.answer;
    const b = [...document.querySelectorAll(".math-choice")].find(x => x.textContent.trim() !== String(ans));
    return b ? parseInt(b.textContent.trim(), 10) : null;
  });
}
async function answerAllCorrect(page, maxRounds) {
  for (let i = 0; i < (maxRounds || 14); i++) {
    const vis = await page.locator("#screen-complete:not(.hidden)").isVisible().catch(() => false);
    if (vis) return true;
    const d = await debug(page);
    if (!d) { await sleep(400); continue; }
    await clickChoice(page, d.answer);
    await sleep(1250);
  }
  return page.locator("#screen-complete:not(.hidden)").isVisible().catch(() => false);
}

(async () => {
  const browser = await chromium.launch();

  /* ============ (a) Bản đồ đảo ở trang chủ ============ */
  console.log("(a) Bản đồ đảo");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    ok(await page.locator("#island-chuot").count() === 1, "Có Đảo Chuột");
    ok(await page.locator("#island-toan").count() === 1, "Có Đảo Toán");
    ok(await page.locator("#island-chuot .level-btn").count() === 5, "Đảo Chuột có đủ 5 màn (data-level tương thích)");
    ok(await page.locator('#island-chuot .level-btn[data-level="5"]').count() === 1, "Nút Màn 5 vẫn có data-level=5");
    ok(await page.locator("#island-toan .level-btn").count() === 2, "Đảo Toán có 2 game");
    ok(await page.locator('.level-btn[data-game="tinh-nhanh"]').count() === 1, "Có nút Tính Nhanh");
    ok(await page.locator('.level-btn[data-game="so-bi-an"]').count() === 1, "Có nút Tìm Số Bí Ẩn");
    for (const isl of ["ban-phim", "chu", "tu-duy"]) {
      ok(await page.locator(`#island-${isl}`).count() === 1, `Có đảo sắp ra mắt: ${isl}`);
      ok(await page.locator(`#island-${isl} a, #island-${isl} button`).count() === 0, `Đảo ${isl}: không có link/nút chết`);
      const txt = await page.locator(`#island-${isl}`).innerText();
      ok(txt.includes("Sắp ra mắt") && txt.includes("🔒"), `Đảo ${isl}: hiện khóa + "Sắp ra mắt"`);
    }
    await page.screenshot({ path: "qa-shots/island-map.png", fullPage: true });
    ok(true, "Đã chụp island-map.png");
    ok(errors.length === 0, `(a) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (b) Migrate tiến độ v1 -> v2 ============ */
  console.log("(b) Migrate v1 -> v2");
  {
    const v1 = { stars: { 3: 2 }, completed: { 3: true }, difficulty: { 1: 4, 3: 7, 5: 2 } }; // v1: không có "version"
    const { ctx, page, errors } = await newPage(browser, v1);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")));
    ok(stored.version === 2, `Tiến độ đã nâng lên v2 (version=${stored.version})`);
    ok(stored.difficulty[1] === 4 && stored.difficulty[3] === 7 && stored.difficulty[5] === 2,
      `Cấp D cũ giữ nguyên sau migrate: ${JSON.stringify(stored.difficulty)}`);
    ok(stored.stars[3] === 2 && stored.completed[3] === true, "Sao/hoàn thành cũ giữ nguyên sau migrate");
    ok((await page.locator('.level-badge[data-diff-for="1"]').innerText()) === "Cấp 4", "Trang chủ: badge Màn 1 hiện Cấp 4 (từ dữ liệu v1)");
    ok((await page.locator('.level-badge[data-diff-for="3"]').innerText()) === "Cấp 7", "Trang chủ: badge Màn 3 hiện Cấp 7 (từ dữ liệu v1)");
    ok((await page.locator('.level-badge[data-diff-for="tinh-nhanh"]').innerText()) === "Cấp 1", "Game toán mới mặc định Cấp 1");
    ok(errors.length === 0, `(b) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (c) Tính Nhanh ở D=1: sai->gợi ý->làm lại, đúng hết -> lên cấp ============ */
  console.log("(c) Tính Nhanh D=1 trọn vòng");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    await openGame(page, "tinh-nhanh");
    ok((await page.locator("#diff-label").innerText()) === "Cấp 1", "Tính Nhanh stepper hiện Cấp 1");
    ok(await page.locator(".math-eq").isVisible(), "Tính Nhanh hiện phép tính");
    ok((await page.locator(".math-choice").count()) === 3, "Tính Nhanh D=1 có 3 đáp án để chọn (công thức)");
    const d0 = await debug(page);
    ok(d0 && d0.id === "tinh-nhanh" && d0.q === 1 && d0.total === 5, `Debug câu 1/5: ${JSON.stringify(d0)}`);
    await page.screenshot({ path: "qa-shots/math-tinh-nhanh-d1.png" });
    ok(true, "Đã chụp math-tinh-nhanh-d1.png");
    // chọn SAI: phải có gợi ý, nút sai bị khóa, câu hỏi không trôi đi
    const wv = await wrongValue(page);
    ok(await clickChoice(page, wv), `Bấm được đáp án sai (${wv})`);
    await sleep(300);
    ok((await page.locator(".math-hint").innerText()).length > 0, "Sai -> hiện gợi ý nhẹ");
    ok((await debug(page)).q === 1, "Sai -> vẫn ở câu 1 (không thua, làm lại)");
    ok(await page.locator(".math-choice.wrong").isDisabled(), "Nút đáp án sai bị khóa sau khi chọn");
    // chọn ĐÚNG: sang câu 2
    ok(await clickChoice(page, d0.answer), `Bấm đáp án đúng (${d0.answer})`);
    await sleep(1250);
    ok((await debug(page)).q === 2, "Đúng -> sang câu 2");
    // trả lời đúng hết phần còn lại (câu 1 đã sai 1 lần nên perf = 4/5 = 0.8 -> vẫn lên cấp)
    ok(await answerAllCorrect(page), "Tính Nhanh: chơi hết lượt -> hiện màn hoàn thành");
    await page.screenshot({ path: "qa-shots/math-complete.png" });
    ok(true, "Đã chụp math-complete.png");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")));
    ok(stored.difficulty["tinh-nhanh"] === 2, `Tính Nhanh lên Cấp 2 sau lượt tốt (lưu=${stored.difficulty["tinh-nhanh"]})`);
    ok(stored.stars["tinh-nhanh"] >= 1 && stored.completed["tinh-nhanh"] === true, "Tính Nhanh lưu sao + hoàn thành");
    ok(errors.length === 0, `(c) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (d) Tính Nhanh ở D=8 (seed tiến độ v2) ============ */
  console.log("(d) Tính Nhanh D=8");
  {
    const seed = { version: 2, stars: {}, completed: {}, difficulty: { "tinh-nhanh": 8 } };
    const { ctx, page, errors } = await newPage(browser, seed);
    ok((await page.locator('.level-badge[data-diff-for="tinh-nhanh"]').innerText()) === "Cấp 8", "Trang chủ: badge Tính Nhanh hiện Cấp 8");
    await openGame(page, "tinh-nhanh");
    const d = await debug(page);
    ok(d && d.total === 8, `Tính Nhanh D=8 có 8 câu/lượt (công thức) (=${d && d.total})`);
    ok((await page.locator(".math-choice").count()) === 4, "Tính Nhanh D=8 có 4 đáp án để chọn (công thức)");
    const eq = await page.locator(".math-eq").innerText();
    ok(/\d+/.test(eq), `Phép tính hiện số: "${eq.replace(/\n/g, " ")}"`);
    await page.screenshot({ path: "qa-shots/math-tinh-nhanh-d8.png" });
    ok(true, "Đã chụp math-tinh-nhanh-d8.png");
    ok(errors.length === 0, `(d) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (e) Tìm Số Bí Ẩn ở D=1 trọn vòng ============ */
  console.log("(e) Tìm Số Bí Ẩn D=1 trọn vòng");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    await openGame(page, "so-bi-an");
    ok(await page.locator(".math-blank").isVisible(), "Số Bí Ẩn: hiện ô ? bí ẩn");
    ok((await page.locator(".math-blank").innerText()) === "?", "Ô bí ẩn hiện dấu ?");
    ok((await page.locator(".math-choice").count()) === 3, "Số Bí Ẩn D=1 có 3 đáp án để chọn");
    const d0 = await debug(page);
    ok(d0 && d0.id === "so-bi-an" && d0.total === 5, `Debug Số Bí Ẩn: ${JSON.stringify(d0)}`);
    await page.screenshot({ path: "qa-shots/math-so-bi-an-d1.png" });
    ok(true, "Đã chụp math-so-bi-an-d1.png");
    ok(await answerAllCorrect(page), "Số Bí Ẩn: chơi hết lượt -> hiện màn hoàn thành");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")));
    ok(stored.difficulty["so-bi-an"] === 2, `Số Bí Ẩn lên Cấp 2 sau lượt đúng hết (lưu=${stored.difficulty["so-bi-an"]})`);
    ok(errors.length === 0, `(e) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (f) iPad (1024x768, cảm ứng): chạm chơi cả 2 game toán ============ */
  console.log("(f) iPad cảm ứng 1024x768");
  {
    const { ctx, page, errors } = await newPage(browser, null, {
      viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true
    });
    async function tapChoiceCorrect() {
      const d = await debug(page);
      const box = await page.evaluate((ans) => {
        const b = [...document.querySelectorAll(".math-choice")].find(x => !x.disabled && x.textContent.trim() === String(ans));
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, d.answer);
      if (!box) return false;
      await page.touchscreen.tap(box.x, box.y);
      return true;
    }
    // chạm mở Tính Nhanh từ bản đồ đảo
    await page.locator('.level-btn[data-game="tinh-nhanh"]').tap();
    await sleep(700);
    const stageBox = await page.locator("#level-stage").boundingBox();
    ok(stageBox && stageBox.x >= 0 && stageBox.x + stageBox.width <= 1024 + 1,
      `iPad: sân chơi lọt trong màn hình 1024 (x=${stageBox && Math.round(stageBox.x)}, w=${stageBox && Math.round(stageBox.width)})`);
    ok(await tapChoiceCorrect(), "iPad: chạm đáp án đúng câu 1 (Tính Nhanh)");
    await sleep(1250);
    ok((await debug(page)).q === 2, "iPad: Tính Nhanh sang câu 2 sau chạm đúng");
    ok(await tapChoiceCorrect(), "iPad: chạm đáp án đúng câu 2 (Tính Nhanh)");
    await sleep(1250);
    ok((await debug(page)).q === 3, "iPad: Tính Nhanh sang câu 3");
    // về trang chủ bằng chạm, mở game 2
    await page.locator("#btn-home").tap();
    await sleep(500);
    await page.locator('.level-btn[data-game="so-bi-an"]').tap();
    await sleep(700);
    ok((await debug(page)).id === "so-bi-an", "iPad: mở được Tìm Số Bí Ẩn bằng chạm");
    ok(await tapChoiceCorrect(), "iPad: chạm đáp án đúng câu 1 (Số Bí Ẩn)");
    await sleep(1250);
    ok((await debug(page)).q === 2, "iPad: Số Bí Ẩn sang câu 2 sau chạm đúng");
    ok(errors.length === 0, `(f) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  await browser.close();
  console.log(`\nmath.test.js: ${passed} đạt, ${failed} trượt`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error("TEST CRASH:", e); process.exit(2); });
