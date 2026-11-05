/* Test trình duyệt cho Đảo Bàn Phím (Tìm Phím, Bong Bóng Chữ, Gõ Từ Tiếng Anh) —
   chạy: node tests/typing.test.js   (cần server tĩnh ở http://localhost:8901)
   Mọi game được lái bằng window.__typingDebug + phím thật (page.keyboard),
   riêng Tìm Phím có thêm kiểm chứng CHẠM vào phím ảo. */
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
async function debug(page) { return page.evaluate(() => window.__typingDebug || null); }
async function completeVisible(page) {
  return page.locator("#screen-complete:not(.hidden)").isVisible().catch(() => false);
}

(async () => {
  const browser = await chromium.launch();

  /* ============ (a) Trang chủ: Đảo Bàn Phím đã mở khóa, đủ 3 game ============ */
  console.log("(a) Bản đồ đảo — Đảo Bàn Phím");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    ok(await page.locator("#island-ban-phim").count() === 1, "Có Đảo Bàn Phím");
    ok(await page.locator("#island-ban-phim .level-btn").count() === 3, "Đảo Bàn Phím có đủ 3 game");
    for (const id of ["tim-phim", "bong-bong-chu", "go-tu-tieng-anh"]) {
      ok(await page.locator(`.level-btn[data-game="${id}"]`).count() === 1, `Có nút game: ${id}`);
    }
    const txt = await page.locator("#island-ban-phim").innerText();
    ok(!txt.includes("Sắp ra mắt") && !txt.includes("🔒"), "Đảo Bàn Phím không còn khóa");
    for (const isl of ["chu", "tu-duy"]) {
      ok(await page.locator(`#island-${isl} .island-soon, #island-${isl}.island-locked`).count() >= 1 ||
         (await page.locator(`#island-${isl}`).innerText()).includes("Sắp ra mắt"), `Đảo ${isl} vẫn khóa như cũ`);
    }
    ok(errors.length === 0, `(a) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (b) Tìm Phím D=1 bằng PHÍM THẬT (+ 1 lần bấm sai) ============ */
  console.log("(b) Tìm Phím Nhanh D=1 — phím thật");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    await openGame(page, "tim-phim");
    ok((await page.locator("#diff-label").innerText()) === "Cấp 1", "Tìm Phím stepper hiện Cấp 1");
    ok((await page.locator(".kb-key").count()) === 36, "Bàn phím ảo đủ 36 phím (chữ + số)");
    const d0 = await debug(page);
    ok(d0 && d0.id === "tim-phim" && "ASDFGHJKL".includes(d0.target), `Phím đích đầu tiên thuộc hàng nhà D=1: ${JSON.stringify(d0)}`);
    // bấm SAI 1 phím khác trong hồ phím: đích không đổi + phím đích phát sáng gợi ý
    const wrong = "ASDFGHJKL".split("").find(c => c !== d0.target);
    await page.keyboard.press(wrong);
    await sleep(350);
    ok((await debug(page)).target === d0.target, "Bấm sai -> vẫn ở phím đích cũ (không thua)");
    ok(await page.locator(`.kb-key[data-key="${d0.target}"].kb-target`).count() === 1, "Bấm sai -> phím đích phát sáng gợi ý");
    ok((await page.locator("#level-hud").innerText()).includes("Đã tìm: 0/10"), "Bấm sai -> chưa tính là tìm được");
    await page.screenshot({ path: "qa-shots/typing-hunt.png" });
    ok(true, "Đã chụp typing-hunt.png (phím đích đang phát sáng gợi ý)");
    // bấm đúng liên tục tới hết lượt (10 đích ở D=1, đã tính cả đích đầu)
    let doneAll = false;
    for (let i = 0; i < 16 && !doneAll; i++) {
      if (await completeVisible(page)) { doneAll = true; break; }
      const d = await debug(page);
      if (!d) { await sleep(300); continue; }
      await page.keyboard.press(d.target);
      await sleep(480);
    }
    ok(doneAll || await completeVisible(page), "Tìm Phím: tìm đủ 10 phím -> hiện màn hoàn thành");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")));
    ok(stored.completed["tim-phim"] === true && stored.stars["tim-phim"] >= 1, "Tìm Phím lưu hoàn thành + sao");
    ok(errors.length === 0, `(b) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (c) Tìm Phím: CHẠM phím ảo cũng tính ============ */
  console.log("(c) Tìm Phím Nhanh — chạm phím ảo");
  {
    const { ctx, page, errors } = await newPage(browser, null, { hasTouch: true });
    await page.locator('.level-btn[data-game="tim-phim"]').tap();
    await sleep(700);
    const d0 = await debug(page);
    ok(d0 && d0.id === "tim-phim", "Chạm mở được Tìm Phím");
    await page.tap(`.kb-key[data-key="${d0.target}"]`);
    await sleep(550);
    ok((await page.locator("#level-hud").innerText()).includes("Đã tìm: 1/10"), "Chạm đúng phím ảo -> tính là tìm được 1 phím");
    const d1 = await debug(page);
    ok(d1 && d1.target !== d0.target, `Chạm đúng -> sang phím đích mới (${d0.target} -> ${d1 && d1.target})`);
    ok(errors.length === 0, `(c) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (d) Bong Bóng Chữ Cái D=1: vỡ hết bằng phím thật ============ */
  console.log("(d) Bong Bóng Chữ Cái D=1");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    await openGame(page, "bong-bong-chu");
    const d0 = await debug(page);
    ok(d0 && d0.id === "bong-bong-chu" && Array.isArray(d0.letters), `Debug bong bóng sẵn sàng: ${JSON.stringify(d0)}`);
    let sawBubble = false, doneAll = false;
    for (let i = 0; i < 260 && !doneAll; i++) {
      if (await completeVisible(page)) { doneAll = true; break; }
      const d = await debug(page);
      if (d && d.letters.length) {
        sawBubble = true;
        await page.keyboard.press(d.letters[0]);
      }
      await sleep(300);
    }
    ok(sawBubble, "Có bong bóng chữ xuất hiện trong cảnh biển");
    ok(doneAll || await completeVisible(page), "Bong Bóng: vỡ/hết 12 quả -> hiện màn hoàn thành");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")));
    ok(stored.completed["bong-bong-chu"] === true, "Bong Bóng lưu hoàn thành");
    ok(errors.length === 0, `(d) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (d2) Ảnh chụp Bong Bóng ở D=7 (3 quả cùng lúc) ============ */
  console.log("(d2) Bong Bóng D=7 — chụp ảnh nhiều bong bóng");
  {
    const seed = { version: 2, stars: {}, completed: {}, difficulty: { "bong-bong-chu": 7 } };
    const { ctx, page, errors } = await newPage(browser, seed);
    await openGame(page, "bong-bong-chu");
    await sleep(2900); // D=7: thả mỗi 1s, tối đa 3 quả cùng lúc, nổi ~6.6s -> có 3 quả trong khung
    const n = await page.locator(".bub-bubble").count();
    ok(n >= 2, `Có ít nhất 2 bong bóng cùng nổi (thấy ${n})`);
    await page.screenshot({ path: "qa-shots/typing-bubbles.png" });
    ok(true, "Đã chụp typing-bubbles.png");
    ok(errors.length === 0, `(d2) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (e) Gõ Từ Tiếng Anh D=1: gõ trọn các từ bằng phím thật ============ */
  console.log("(e) Gõ Từ Tiếng Anh D=1");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    await openGame(page, "go-tu-tieng-anh");
    const d0 = await debug(page);
    ok(d0 && d0.id === "go-tu-tieng-anh" && d0.word.length === 3 && d0.index === 0,
      `Từ đầu tiên ở D=1 có đúng 3 chữ: ${JSON.stringify(d0)}`);
    ok(await page.locator(`.kb-key[data-key="${d0.word[0]}"].kb-target`).count() === 1,
      "D=1 (gợi ý 'always'): phím chữ đầu tiên đang phát sáng");
    // gõ 1 chữ rồi chụp ảnh giữa chừng
    await page.keyboard.press(d0.word[0]);
    await sleep(300);
    ok((await debug(page)).index === 1, "Gõ đúng chữ 1 -> ô chữ 1 xanh, sang chữ 2");
    ok((await page.locator(".word-slot.filled").count()) === 1, "Có đúng 1 ô chữ đã tô xanh");
    await page.screenshot({ path: "qa-shots/typing-word.png" });
    ok(true, "Đã chụp typing-word.png (gõ dở 1 từ)");
    // gõ hết các từ còn lại; kiểm chứng ít nhất 1 lần thấy banner "WORD = nghĩa"
    let bannerSeen = false, doneAll = false;
    for (let i = 0; i < 12 && !doneAll; i++) {
      if (await completeVisible(page)) { doneAll = true; break; }
      const d = await debug(page);
      if (!d) { await sleep(300); continue; }
      for (let k = d.index; k < d.word.length; k++) {
        await page.keyboard.press(d.word[k]);
        await sleep(90);
      }
      // banner hiện ngay khi gõ xong từ, giữ ~1.4s
      for (let t = 0; t < 8 && !bannerSeen; t++) {
        const b = await page.locator(".word-banner").innerText().catch(() => "");
        if (b.includes("=")) { bannerSeen = true; break; }
        await sleep(120);
      }
      await sleep(1500);
    }
    ok(bannerSeen, "Ít nhất 1 lần hiện banner 'WORD = nghĩa tiếng Việt'");
    ok(doneAll || await completeVisible(page), "Gõ Từ: gõ xong 5 từ -> hiện màn hoàn thành");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")));
    ok(stored.completed["go-tu-tieng-anh"] === true && stored.stars["go-tu-tieng-anh"] >= 1, "Gõ Từ lưu hoàn thành + sao");
    ok(errors.length === 0, `(e) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  await browser.close();
  console.log(`\ntyping.test.js: ${passed} đạt, ${failed} trượt`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error("TEST CRASH:", e); process.exit(2); });
