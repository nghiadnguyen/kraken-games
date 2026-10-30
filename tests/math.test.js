/* Test trình duyệt cho Đảo Toán (gõ đáp án bằng bàn phím số) + bản đồ đảo + migrate
   tiến độ v1->v2 + iPad cảm ứng — chạy:
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
async function completeVisible(page) {
  return page.locator("#screen-complete:not(.hidden)").isVisible().catch(() => false);
}
/* Gõ đáp án bằng cách BẤM các nút của bàn phím số trong game, kết thúc bằng nút ✓ */
async function typeAnswer(page, value) {
  for (const ch of String(value)) {
    await page.click(`.kp-btn[data-d="${ch}"]`);
    await sleep(50);
  }
  await page.click('.kp-btn[data-d="ok"]');
}
/* Gõ đáp án bằng click DOM trực tiếp (không chờ actionability) — dùng cho Đua Xe,
   nơi cuộc đua vẫn chạy trong lúc gõ và bàn phím có thể vừa bị khóa khi xe về đích. */
async function typeAnswerFast(page, value) {
  return page.evaluate((v) => {
    const pad = document.querySelector(".kp-pad");
    if (!pad) return false;
    for (const ch of String(v)) {
      const b = pad.querySelector(`.kp-btn[data-d="${ch}"]`);
      if (!b || b.disabled) return false;
      b.click();
    }
    const okBtn = pad.querySelector('.kp-btn[data-d="ok"]');
    if (!okBtn || okBtn.disabled) return false;
    okBtn.click();
    return true;
  }, value).catch(() => false);
}
/* Giải phép tính đọc từ chữ hiển thị trên màn hình: "a + b = ?", "? − b = c", "a + ? = c"... */
function solveEq(txt) {
  const toks = String(txt).replace(/\s+/g, "").match(/(\d+|\?|\+|−|=)/g);
  if (!toks) return null;
  const eq = toks.indexOf("=");
  const A = toks[0], OP = toks[1], B = toks[2], C = toks[eq + 1];
  const num = t => (t === "?" || t === undefined ? null : parseInt(t, 10));
  const a = num(A), b = num(B), c = num(C);
  if (a === null && b === null) return null;
  if (c === null) return OP === "+" ? a + b : a - b;
  if (a === null) return OP === "+" ? c - b : c + b;
  if (b === null) return OP === "+" ? c - a : a - c;
  return null;
}
async function readEqAnswer(page, eqSelector) {
  const txt = await page.locator(eqSelector).innerText();
  return solveEq(txt);
}
/* Trả lời đúng liên tục (theo đáp án debug) cho các game hỏi-đáp từng câu một */
async function answerAllTyped(page, maxRounds) {
  for (let i = 0; i < (maxRounds || 14); i++) {
    if (await completeVisible(page)) return true;
    const d = await debug(page);
    if (!d) { await sleep(400); continue; }
    await typeAnswer(page, d.answer);
    await sleep(1250);
  }
  return completeVisible(page);
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
    ok(await page.locator("#island-toan .level-btn").count() === 6, "Đảo Toán có 6 game");
    for (const id of ["tinh-nhanh", "so-bi-an", "dua-xe-toan", "penalty-toan", "thap-phao", "kho-bau"]) {
      ok(await page.locator(`.level-btn[data-game="${id}"]`).count() === 1, `Có nút game: ${id}`);
    }
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

  /* ============ (c) Tính Nhanh D=1: gõ đáp án bằng BÀN PHÍM SỐ, sai->gợi ý->gõ lại ============ */
  console.log("(c) Tính Nhanh D=1 gõ đáp án (bàn phím số)");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    await openGame(page, "tinh-nhanh");
    ok((await page.locator("#diff-label").innerText()) === "Cấp 1", "Tính Nhanh stepper hiện Cấp 1");
    ok(await page.locator(".math-eq").isVisible(), "Tính Nhanh hiện phép tính");
    ok((await page.locator(".math-choice").count()) === 0, "Không còn nút trắc nghiệm nữa");
    ok((await page.locator(".kp-btn").count()) === 12, "Bàn phím số có đủ 12 phím (1-9, ⌫, 0, ✓)");
    ok(await page.locator(".kp-slot").isVisible(), "Ô gõ đáp án nằm ngay trong phép tính");
    const d0 = await debug(page);
    ok(d0 && d0.id === "tinh-nhanh" && d0.q === 1 && d0.total === 5, `Debug câu 1/5: ${JSON.stringify(d0)}`);
    await page.screenshot({ path: "qa-shots/math-keypad.png" });
    ok(true, "Đã chụp math-keypad.png");
    await page.screenshot({ path: "qa-shots/math-tinh-nhanh-d1.png" });
    ok(true, "Đã chụp math-tinh-nhanh-d1.png");
    // gõ SAI: gợi ý hiện, vẫn ở câu 1, firstTry không tăng
    await typeAnswer(page, d0.answer + 7);
    await sleep(350);
    ok((await page.locator(".math-hint").innerText()).length > 0, "Gõ sai -> hiện gợi ý nhẹ");
    ok((await debug(page)).q === 1, "Gõ sai -> vẫn ở câu 1 (không thua, gõ lại)");
    ok((await page.locator(".kp-slot").innerText()).trim() === "?", "Gõ sai -> ô đáp án được xóa để gõ lại");
    // gõ ĐÚNG: sang câu 2 nhưng "Đúng ngay" vẫn 0 vì câu 1 đã sai trước
    await typeAnswer(page, d0.answer);
    await sleep(1250);
    ok((await debug(page)).q === 2, "Gõ đúng -> sang câu 2");
    ok((await page.locator("#level-hud").innerText()).includes("Đúng ngay: 0"), "Câu 1 sai trước nên không tính 'Đúng ngay'");
    // đúng hết phần còn lại: perf = 4/5 = 0.8 -> vẫn lên cấp
    ok(await answerAllTyped(page), "Tính Nhanh: chơi hết lượt -> hiện màn hoàn thành");
    await page.screenshot({ path: "qa-shots/math-complete.png" });
    ok(true, "Đã chụp math-complete.png");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")));
    ok(stored.difficulty["tinh-nhanh"] === 2, `Tính Nhanh lên Cấp 2 sau lượt tốt (lưu=${stored.difficulty["tinh-nhanh"]})`);
    ok(stored.stars["tinh-nhanh"] >= 1 && stored.completed["tinh-nhanh"] === true, "Tính Nhanh lưu sao + hoàn thành");
    ok(errors.length === 0, `(c) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (c2) Tính Nhanh: gõ bằng PHÍM THẬT (0-9, Backspace, Enter) ============ */
  console.log("(c2) Tính Nhanh gõ bằng phím thật");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    await openGame(page, "tinh-nhanh");
    const d0 = await debug(page);
    await page.locator(".math-eq").click();
    await page.keyboard.press("9");            // gõ nhầm 1 số...
    await page.keyboard.press("Backspace");    // ...xóa đi
    await page.keyboard.type(String(d0.answer));
    ok((await page.locator(".kp-slot").innerText()).trim() === String(d0.answer), "Phím thật: số đã gõ hiện trong ô đáp án");
    await page.keyboard.press("Enter");
    await sleep(1250);
    ok((await debug(page)).q === 2, "Phím thật: Enter nộp bài -> sang câu 2");
    ok((await page.locator("#level-hud").innerText()).includes("Đúng ngay: 1"), "Phím thật: tính 'Đúng ngay' cho câu 1");
    ok(await answerAllTyped(page), "Phím thật + bàn phím số: chơi hết lượt -> hoàn thành");
    ok(errors.length === 0, `(c2) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
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
    ok((await page.locator(".kp-btn").count()) === 12, "Tính Nhanh D=8 dùng bàn phím số 12 phím");
    const eq = await page.locator(".math-eq").innerText();
    ok(/\d+/.test(eq), `Phép tính hiện số: "${eq.replace(/\n/g, " ")}"`);
    await page.screenshot({ path: "qa-shots/math-tinh-nhanh-d8.png" });
    ok(true, "Đã chụp math-tinh-nhanh-d8.png");
    ok(errors.length === 0, `(d) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (e) Tìm Số Bí Ẩn ở D=1: gõ đáp án trọn vòng ============ */
  console.log("(e) Tìm Số Bí Ẩn D=1 gõ đáp án");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    await openGame(page, "so-bi-an");
    ok(await page.locator(".kp-slot").isVisible(), "Số Bí Ẩn: ô gõ đáp án ở vị trí số bí ẩn");
    ok((await page.locator(".kp-slot").innerText()).trim() === "?", "Ô bí ẩn hiện dấu ? khi chưa gõ");
    ok((await page.locator(".math-choice").count()) === 0, "Số Bí Ẩn: không còn nút trắc nghiệm");
    const d0 = await debug(page);
    ok(d0 && d0.id === "so-bi-an" && d0.total === 5, `Debug Số Bí Ẩn: ${JSON.stringify(d0)}`);
    await page.screenshot({ path: "qa-shots/math-so-bi-an-d1.png" });
    ok(true, "Đã chụp math-so-bi-an-d1.png");
    // gõ SAI trước: phải có gợi ý phép tính ngược, vẫn ở câu 1
    await typeAnswer(page, d0.answer + 3);
    await sleep(350);
    ok((await page.locator(".math-hint").innerText()).includes("Gợi ý"), "Số Bí Ẩn gõ sai -> hiện gợi ý phép tính ngược");
    ok((await debug(page)).q === 1, "Số Bí Ẩn gõ sai -> vẫn ở câu 1");
    await typeAnswer(page, d0.answer);
    await sleep(1250);
    ok((await debug(page)).q === 2, "Số Bí Ẩn gõ đúng -> sang câu 2");
    ok(await answerAllTyped(page), "Số Bí Ẩn: chơi hết lượt -> hiện màn hoàn thành");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")));
    ok(stored.stars["so-bi-an"] >= 1 && stored.completed["so-bi-an"] === true, "Số Bí Ẩn lưu sao + hoàn thành");
    ok(errors.length === 0, `(e) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (g) Đua Xe Toán D=1: đọc phép tính hiển thị, gõ đáp án, đua tới đích ============ */
  console.log("(g) Đua Xe Toán D=1 trọn cuộc đua");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    await openGame(page, "dua-xe-toan");
    ok(await page.locator(".race2-canvas").isVisible(), "Đua Xe: hiện canvas đường đua");
    ok((await page.locator(".race2-car").count()) === 3, "Đua Xe: 3 xe trên đường (Kraken + 2 đối thủ)");
    const rd = await page.evaluate(() => window.__raceDebug || null);
    ok(rd && rd.raceDist === 4400, `Đua Xe D=1: quãng đường 4400px theo công thức (=${rd && rd.raceDist})`);
    let shotTaken = false, hudSeen = "";
    for (let i = 0; i < 70 && !(await completeVisible(page)); i++) {
      const ans = await readEqAnswer(page, ".race2-eq").catch(() => null);
      if (ans === null) { await sleep(500); continue; }
      await typeAnswerFast(page, ans);
      if (i === 1) hudSeen = await page.locator("#level-hud").innerText();
      if (!shotTaken && i === 0) {
        await sleep(400); // Kraken vừa vọt lên, 2 đối thủ còn ở ngay phía sau trong khung hình
        await page.screenshot({ path: "qa-shots/race-mid.png" });
        shotTaken = true;
      }
      await sleep(850);
    }
    ok(hudSeen.includes("thứ"), `Đua Xe: HUD hiện vị trí đua ("${hudSeen}")`);
    ok(await completeVisible(page), "Đua Xe: đua tới đích -> hiện màn hoàn thành");
    const rdEnd = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")));
    ok(rdEnd.stars["dua-xe-toan"] >= 1 && rdEnd.completed["dua-xe-toan"] === true, "Đua Xe lưu sao + hoàn thành");
    ok(errors.length === 0, `(g) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (h) Penalty Toán D=1: gõ đúng -> chọn góc sút, đủ 5 quả ============ */
  console.log("(h) Penalty Toán D=1 trọn 5 quả");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    await openGame(page, "penalty-toan");
    ok(await page.locator(".pen-goal").isVisible(), "Penalty: hiện khung thành + thủ môn");
    let aimShot = false;
    for (let shot = 0; shot < 5; shot++) {
      await page.waitForFunction(() => {
        const b = document.querySelector('.kp-btn[data-d="ok"]');
        return b && !b.disabled;
      }, null, { timeout: 10000 }).catch(() => {});
      await sleep(200);
      const ans = await readEqAnswer(page, ".pen-eq").catch(() => null);
      ok(ans !== null, `Penalty quả ${shot + 1}: đọc được phép tính hiển thị`);
      if (ans === null) break;
      await typeAnswer(page, ans);
      await page.waitForSelector(".pen-goal.aiming", { timeout: 6000 }).catch(() => {});
      ok(await page.locator(".pen-goal.aiming").count() === 1, `Penalty quả ${shot + 1}: gõ đúng -> hiện 3 góc sút`);
      if (!aimShot) { await page.screenshot({ path: "qa-shots/penalty-aim.png" }); aimShot = true; }
      await page.click('.pen-zone[data-zone="1"]');
      await sleep(1550);
    }
    await page.waitForSelector("#screen-complete:not(.hidden)", { timeout: 25000 }).catch(() => {});
    ok(await completeVisible(page), "Penalty: sút đủ 5 quả -> hiện màn hoàn thành");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")));
    ok(stored.stars["penalty-toan"] >= 1 && stored.completed["penalty-toan"] === true, "Penalty lưu sao + hoàn thành");
    ok(errors.length === 0, `(h) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (i) Tháp Pháo D=1: bắn hạ từng máy bay bằng đáp án đúng ============ */
  console.log("(i) Tháp Pháo Tàu Chiến D=1 trọn 5 đợt");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    await openGame(page, "thap-phao");
    ok(await page.locator(".tur-ship").isVisible(), "Tháp Pháo: hiện tàu chiến + tháp pháo");
    let shotTaken = false;
    for (let w = 0; w < 5; w++) {
      await page.waitForSelector(".tur-plane", { timeout: 15000 }).catch(() => {});
      if (!shotTaken) {
        await sleep(2800); // chờ máy bay bay vào giữa sân cho chip phép tính hiện trọn
        await page.screenshot({ path: "qa-shots/turret-plane.png" });
        shotTaken = true;
        const chip = await page.locator(".tur-chip").innerText().catch(() => "");
        ok(/\d+/.test(chip), `Tháp Pháo: máy bay mang phép tính trên mình ("${chip}")`);
      }
      const ans = await readEqAnswer(page, ".tur-eq").catch(() => null);
      ok(ans !== null, `Tháp Pháo đợt ${w + 1}: đọc được phép tính hiển thị`);
      if (ans === null) break;
      await typeAnswer(page, ans);
      await page.waitForFunction((n) => {
        const c = document.querySelector("#screen-complete");
        if (c && !c.classList.contains("hidden")) return true;
        return window.__turDebug && window.__turDebug.shotDown >= n;
      }, w + 1, { timeout: 15000 }).catch(() => {});
      if (await completeVisible(page)) break;
      await sleep(1600); // chờ máy bay rơi + chiếc tiếp theo bay vào
    }
    await page.waitForSelector("#screen-complete:not(.hidden)", { timeout: 20000 }).catch(() => {});
    ok(await completeVisible(page), "Tháp Pháo: bắn hạ đủ 5 đợt -> hiện màn hoàn thành");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")));
    ok(stored.stars["thap-phao"] >= 1 && stored.completed["thap-phao"] === true, "Tháp Pháo lưu sao + hoàn thành");
    ok(errors.length === 0, `(i) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (j) Săn Kho Báu D=1: lặn đủ số đoạn tới rương kho báu ============ */
  console.log("(j) Săn Kho Báu Biển Sâu D=1 trọn hành trình");
  {
    const { ctx, page, errors } = await newPage(browser, null);
    await openGame(page, "kho-bau");
    ok(await page.locator(".tre-sub").isVisible(), "Kho Báu: hiện tàu ngầm vàng");
    ok((await page.locator(".tre-dot").count()) === 5, "Kho Báu D=1: thước độ sâu có 5 đoạn (= số câu)");
    let shotTaken = false;
    for (let i = 0; i < 5; i++) {
      const ans = await readEqAnswer(page, ".tre-eq").catch(() => null);
      ok(ans !== null, `Kho Báu đoạn ${i + 1}: đọc được phép tính hiển thị`);
      if (ans === null) break;
      await typeAnswer(page, ans);
      if (!shotTaken && i === 1) {
        await sleep(450);
        await page.screenshot({ path: "qa-shots/treasure-dive.png" });
        shotTaken = true;
      }
      await sleep(1150);
    }
    await page.waitForSelector("#screen-complete:not(.hidden)", { timeout: 20000 }).catch(() => {});
    ok(await completeVisible(page), "Kho Báu: lặn tới đáy, mở rương -> hiện màn hoàn thành");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("krakenProgress")));
    ok(stored.stars["kho-bau"] >= 1 && stored.completed["kho-bau"] === true, "Kho Báu lưu sao + hoàn thành");
    ok(errors.length === 0, `(j) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  /* ============ (f) iPad (1024x768, cảm ứng): chạm gõ đáp án + chạm đua xe ============ */
  console.log("(f) iPad cảm ứng 1024x768");
  {
    const { ctx, page, errors } = await newPage(browser, null, {
      viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true
    });
    async function tapPad(value) {
      for (const ch of String(value)) {
        const box = await page.locator(`.kp-btn[data-d="${ch}"]`).boundingBox();
        if (!box) return false;
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(70);
      }
      const okBox = await page.locator('.kp-btn[data-d="ok"]').boundingBox();
      if (!okBox) return false;
      await page.touchscreen.tap(okBox.x + okBox.width / 2, okBox.y + okBox.height / 2);
      return true;
    }
    // chạm mở Tính Nhanh từ bản đồ đảo
    await page.locator('.level-btn[data-game="tinh-nhanh"]').tap();
    await sleep(700);
    const stageBox = await page.locator("#level-stage").boundingBox();
    ok(stageBox && stageBox.x >= 0 && stageBox.x + stageBox.width <= 1024 + 1,
      `iPad: sân chơi lọt trong màn hình 1024 (x=${stageBox && Math.round(stageBox.x)}, w=${stageBox && Math.round(stageBox.width)})`);
    let d = await debug(page);
    ok(await tapPad(d.answer), "iPad: chạm gõ đáp án đúng câu 1 (Tính Nhanh)");
    await sleep(1250);
    ok((await debug(page)).q === 2, "iPad: Tính Nhanh sang câu 2 sau chạm đúng");
    d = await debug(page);
    ok(await tapPad(d.answer), "iPad: chạm gõ đáp án đúng câu 2 (Tính Nhanh)");
    await sleep(1250);
    ok((await debug(page)).q === 3, "iPad: Tính Nhanh sang câu 3");
    // về trang chủ bằng chạm, mở Tìm Số Bí Ẩn
    await page.locator("#btn-home").tap();
    await sleep(500);
    await page.locator('.level-btn[data-game="so-bi-an"]').tap();
    await sleep(700);
    ok((await debug(page)).id === "so-bi-an", "iPad: mở được Tìm Số Bí Ẩn bằng chạm");
    d = await debug(page);
    ok(await tapPad(d.answer), "iPad: chạm gõ đáp án đúng câu 1 (Số Bí Ẩn)");
    await sleep(1250);
    ok((await debug(page)).q === 2, "iPad: Số Bí Ẩn sang câu 2 sau chạm đúng");
    // mở Đua Xe Toán bằng chạm, chạm gõ 2 đáp án cho xe chạy
    await page.locator("#btn-home").tap();
    await sleep(500);
    await page.locator('.level-btn[data-game="dua-xe-toan"]').tap();
    await sleep(700);
    ok((await page.locator(".race2-car").count()) === 3, "iPad: Đua Xe hiện đủ 3 xe");
    for (let i = 0; i < 2; i++) {
      const ans = await readEqAnswer(page, ".race2-eq").catch(() => null);
      if (ans === null) break;
      ok(await tapPad(ans), `iPad: Đua Xe chạm gõ đáp án ${i + 1}`);
      await sleep(400);
    }
    const rdIpad = await page.evaluate(() => window.__raceDebug || null);
    ok(rdIpad && rdIpad.answered >= 1, `iPad: Đua Xe nhận đáp án chạm, xe đã tăng tốc (answered=${rdIpad && rdIpad.answered})`);
    ok(errors.length === 0, `(f) 0 lỗi console${errors.length ? ": " + errors.join(" | ") : ""}`);
    await ctx.close();
  }

  await browser.close();
  console.log(`\nmath.test.js: ${passed} đạt, ${failed} trượt`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error("TEST CRASH:", e); process.exit(2); });
