/* KrakenDifficulty — độ khó theo CÔNG THỨC (không có mức cứng Dễ/Vừa/Khó).
   D là số nguyên >= 1, không giới hạn trên. Mỗi màn có 1 hàm tính thông số riêng từ D,
   có trần/sàn để không bao giờ thành không-chơi-được với bé.
   Module thuần: dùng được trên trình duyệt (window.KrakenDifficulty) và trong Node (module.exports). */
(function (root) {
  "use strict";

  function normD(D) {
    D = Math.floor(Number(D));
    return isFinite(D) && D >= 1 ? D : 1;
  }

  /* Thông số chung cho các game TOÁN (Đảo Toán): cộng/trừ trong phạm vi 100.
     - maxNum: trần của số hạng và kết quả, lớn dần 10 -> 100 theo D.
     - carryP: xác suất phép tính "có nhớ" (cộng) / "có mượn" (trừ), 0 ở D=1 rồi tăng dần.
     - questions: số câu mỗi lượt; choices: số đáp án để chọn; distGap: độ "gần" của đáp án nhiễu (càng cao cấp càng gần đáp án đúng). */
  function mathParams(D) {
    return {
      maxNum: Math.min(100, 10 * D),
      carryP: D < 2 ? 0 : Math.min(0.7, 0.15 * (D - 1)),
      questions: Math.min(10, 5 + Math.floor((D - 1) / 2)),
      choices: D < 4 ? 3 : 4,
      distGap: Math.max(1, 11 - D)
    };
  }

  function params(level, D) {
    D = normD(D);

    /* Đảo Toán — Tính Nhanh: hiện phép cộng/trừ, chọn đáp án đúng.
       subFrac: tỉ lệ câu trừ trong một lượt. */
    if (level === "tinh-nhanh") {
      const p = mathParams(D);
      p.subFrac = Math.min(0.5, 0.3 + 0.05 * (D - 1));
      return p;
    }

    /* Đảo Toán — Tìm Số Bí Ẩn: phương trình thiếu một số (a + ? = c, ? − b = c...).
       blankTypes: số kiểu vị trí thiếu được phép dùng — cấp thấp chỉ thiếu số hạng thứ hai,
       từ D=3 mở thêm thiếu số hạng đầu / số bị trừ. */
    if (level === "so-bi-an") {
      const p = mathParams(D);
      p.blankTypes = D < 3 ? 2 : 4;
      return p;
    }

    switch (Number(level)) {

      /* Màn 1 — Di chuột */
      case 1: return {
        count: Math.min(30, 12 + 2 * (D - 1)),
        sizePx: Math.max(36, 78 * Math.pow(0.93, D - 1)),
        movingFrac: D < 3 ? 0 : Math.min(0.7, 0.2 * (D - 2)),
        moveSpeed: D < 3 ? 0 : Math.min(1.6, 0.4 + 0.2 * (D - 3))
      };

      /* Màn 2 — Click hứng hàng */
      case 2: return {
        speedBase: Math.min(2.0, 0.55 * Math.pow(1.13, D - 1)),
        spawnBaseMs: Math.max(650, 1700 * Math.pow(0.91, D - 1)),
        goal: Math.min(30, 10 + 2 * (D - 1)),
        swayAmpPx: D < 4 ? 0 : Math.min(60, 12 * (D - 3)),
        doubleChance: D < 5 ? 0 : Math.min(0.5, 0.12 * (D - 4))
      };

      /* Màn 3 — Kéo & thả */
      case 3: {
        const perType = Math.min(6, 2 + Math.ceil((D - 1) / 2));
        const slotsOn = D >= 5;
        return {
          perType: perType,
          total: 3 * perType,
          itemWPx: Math.max(72, 112 * Math.pow(0.96, D - 1)),
          hintLevel: D <= 2 ? 2 : D <= 5 ? 1 : 0,
          slotsOn: slotsOn,
          slotTolPx: slotsOn ? Math.max(22, 70 - 6 * (D - 5)) : Math.max(22, 70)
        };
      }

      /* Màn 4 — Đua xe */
      case 4: return {
        roadWidth: Math.max(64, 128 * Math.pow(0.95, D - 1)),
        ctrlCount: Math.min(15, 8 + (D - 1)),
        swingHalf: Math.min(0.40, 0.30 + 0.015 * (D - 1)),
        coins: Math.min(16, 8 + (D - 1)),
        coinOffFrac: D < 3 ? 0 : Math.min(1, 0.25 * (D - 2)),
        obstacles: D < 5 ? 0 : Math.min(6, D - 4),
        dropMs: Math.max(600, Math.round(1300 * Math.pow(0.96, D - 1)))
      };

      /* Màn 5 — Sút phạt */
      case 5: {
        const saveRadius = Math.min(110, 44 + 6 * (D - 1));
        return {
          keeperSpeed: Math.min(2.6, 0.8 * Math.pow(1.15, D - 1)),
          keeperAmpFrac: Math.min(0.42, 0.20 + 0.03 * (D - 1)),
          saveRadius: saveRadius,
          weakSaveRadius: Math.round(saveRadius * 1.31),
          greenLow: Math.min(48, 30 + 2.5 * (D - 1)),
          greenHigh: Math.max(66, 85 - 2.5 * (D - 1)),
          chargeRate: Math.min(3.2, 1.6 * Math.pow(1.06, D - 1)),
          needGoals: Math.min(5, 2 + Math.floor((D - 1) / 3)),
          shots: 5
        };
      }
    }
    return {};
  }

  const api = { params: params };
  root.KrakenDifficulty = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
