/* Ngân hàng TỪ TIẾNG ANH cho game Gõ Từ Tiếng Anh (Đảo Bàn Phím).
   Mỗi từ: { w: từ IN HOA chỉ gồm A-Z, vi: nghĩa tiếng Việt, e: tranh emoji }.
   Chủ đề bé thích: xe cộ/máy bay/tàu, con vật, đồ ăn & thiên nhiên.
   Độ dài 3..7 chữ — game lọc theo maxLen của cấp D rồi chọn không trùng. */

export const WORDS = [
  /* Phương tiện */
  { w: "CAR", vi: "ô tô", e: "🚗" },
  { w: "BUS", vi: "xe buýt", e: "🚌" },
  { w: "JET", vi: "máy bay chiến đấu", e: "✈️" },
  { w: "TAXI", vi: "xe taxi", e: "🚕" },
  { w: "BOAT", vi: "thuyền", e: "⛵" },
  { w: "SHIP", vi: "tàu thủy", e: "🚢" },
  { w: "TRAIN", vi: "tàu hỏa", e: "🚂" },
  { w: "PLANE", vi: "máy bay", e: "🛩️" },
  { w: "ROCKET", vi: "tên lửa", e: "🚀" },
  /* Con vật */
  { w: "CAT", vi: "con mèo", e: "🐱" },
  { w: "DOG", vi: "con chó", e: "🐶" },
  { w: "FISH", vi: "con cá", e: "🐟" },
  { w: "BIRD", vi: "con chim", e: "🐦" },
  { w: "DUCK", vi: "con vịt", e: "🦆" },
  { w: "FROG", vi: "con ếch", e: "🐸" },
  { w: "BEAR", vi: "con gấu", e: "🐻" },
  { w: "LION", vi: "sư tử", e: "🦁" },
  { w: "HORSE", vi: "con ngựa", e: "🐴" },
  { w: "MOUSE", vi: "con chuột", e: "🐭" },
  { w: "SNAKE", vi: "con rắn", e: "🐍" },
  { w: "PANDA", vi: "gấu trúc", e: "🐼" },
  { w: "TIGER", vi: "con hổ", e: "🐯" },
  { w: "MONKEY", vi: "con khỉ", e: "🐵" },
  { w: "TURTLE", vi: "con rùa", e: "🐢" },
  /* Đồ ăn, thiên nhiên, đồ vật */
  { w: "EGG", vi: "quả trứng", e: "🥚" },
  { w: "SUN", vi: "mặt trời", e: "☀️" },
  { w: "MILK", vi: "sữa", e: "🥛" },
  { w: "CAKE", vi: "bánh ngọt", e: "🍰" },
  { w: "MOON", vi: "mặt trăng", e: "🌙" },
  { w: "BALL", vi: "quả bóng", e: "⚽" },
  { w: "APPLE", vi: "quả táo", e: "🍎" },
  { w: "LEMON", vi: "quả chanh", e: "🍋" },
  { w: "GRAPE", vi: "quả nho", e: "🍇" },
  { w: "BANANA", vi: "quả chuối", e: "🍌" },
  { w: "ORANGE", vi: "quả cam", e: "🍊" },
  { w: "STAR", vi: "ngôi sao", e: "⭐" }
];

/* Chọn `count` từ có độ dài <= maxLen, không trùng nhau trong 1 lượt.
   Nếu kho từ ngắn hơn count (không xảy ra với công thức hiện tại) thì lấy hết kho. */
export function pickWords(count, maxLen) {
  const ok = WORDS.filter(x => x.w.length <= maxLen);
  const bag = ok.slice();
  for (let i = bag.length - 1; i > 0; i--) { // xáo trộn Fisher-Yates
    const j = Math.floor(Math.random() * (i + 1));
    const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
  }
  return bag.slice(0, Math.min(count, bag.length));
}
