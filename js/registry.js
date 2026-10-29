/* KrakenRegistry — NƠI DUY NHẤT khai báo các đảo và các game.
   Mỗi game: { id, island, icon, name, skill, title, instruction, start(stage, api) }.
   - 5 màn chuột khai báo sẵn ở đây, start() gọi lại hàm KrakenLevelN cũ (không đổi cách chơi).
   - Game mới (module riêng, vd js/games/*.js) tự gọi KrakenRegistry.registerGame(...) để đăng ký.
   Đảo chưa có game thì locked: true — trang chủ hiện "Sắp ra mắt", không tạo liên kết chết. */
window.KrakenRegistry = (function () {
  const islands = [
    { id: "chuot", title: "Đảo Chuột", emoji: "🐭", note: "Luyện chuột như cao thủ qua 5 màn vui nhộn!" },
    { id: "toan", title: "Đảo Toán", emoji: "➕", note: "Cộng trừ trong phạm vi 100 cùng xe, máy bay và tàu chiến!" },
    { id: "ban-phim", title: "Đảo Bàn Phím", emoji: "⌨️", locked: true },
    { id: "chu", title: "Đảo Chữ", emoji: "🔤", locked: true },
    { id: "tu-duy", title: "Đảo Tư Duy", emoji: "🧩", locked: true }
  ];

  const games = [
    { id: 1, island: "chuot", icon: "🫧", name: "Màn 1: Lặn Biển Tìm Kho Báu", skill: "Luyện: Di chuột",
      title: "Màn 1: Lặn Biển Tìm Kho Báu",
      instruction: "🖱️ Chỉ cần DI CHUỘT cho bạn Kraken chạm vào bong bóng và kho báu nhé!",
      start: (stage, api) => window.KrakenLevel1(stage, api) },
    { id: 2, island: "chuot", icon: "🪂", name: "Màn 2: Hứng Hàng Cứu Trợ", skill: "Luyện: Bấm chuột (click)",
      title: "Màn 2: Hứng Hàng Cứu Trợ",
      instruction: "🖱️ BẤM CHUỘT vào thùng hàng đang rơi để Kraken hứng lấy mang về tàu!",
      start: (stage, api) => window.KrakenLevel2(stage, api) },
    { id: 3, island: "chuot", icon: "🚗", name: "Màn 3: Xếp Xe, Máy Bay, Tàu Chiến", skill: "Luyện: Kéo và thả",
      title: "Màn 3: Xếp Xe, Máy Bay, Tàu Chiến",
      instruction: "🖱️ GIỮ CHUỘT kéo từng chiếc xe, máy bay, tàu về đúng nhà của nó rồi THẢ ra!",
      start: (stage, api) => window.KrakenLevel3(stage, api) },
    { id: 4, island: "chuot", icon: "🏎️", name: "Màn 4: Đua Xe Ăn Xu Vàng", skill: "Luyện: Giữ chuột và lái theo đường",
      title: "Màn 4: Đua Xe Ăn Xu Vàng",
      instruction: "🖱️ GIỮ CHUỘT và lái xe theo đường đua, ăn xu vàng, về tới cờ đích nhé! Đi ra ngoài đường là rớt xu đó, quay lại đường nhặt lại nhé!",
      start: (stage, api) => window.KrakenLevel4(stage, api) },
    { id: 5, island: "chuot", icon: "⚽", name: "Màn 5: Kraken Sút Phạt — Tiền Đạo Số 7", skill: "Luyện: Ngắm, giữ chuột nạp lực, thả ra sút!",
      title: "Màn 5: Kraken Sút Phạt — Tiền Đạo Số 7",
      instruction: "🖱️ Di chuột để NGẮM, GIỮ chuột nạp lực ở vùng XANH, THẢ ra để sút!",
      start: (stage, api) => window.KrakenLevel5(stage, api) }
  ];

  function registerGame(g) { games.push(g); }
  function gameById(id) {
    for (const g of games) if (String(g.id) === String(id)) return g;
    return null;
  }
  function gamesOfIsland(islandId) { return games.filter(g => g.island === islandId); }
  /* Game kế tiếp trong CÙNG đảo (cho nút "Màn tiếp theo"); null nếu đã là game cuối đảo. */
  function nextInIsland(id) {
    const g = gameById(id);
    if (!g) return null;
    const list = gamesOfIsland(g.island);
    const i = list.indexOf(g);
    return i >= 0 && i < list.length - 1 ? list[i + 1].id : null;
  }

  return { islands: islands, games: games, registerGame: registerGame, gameById: gameById, gamesOfIsland: gamesOfIsland, nextInIsland: nextInIsland };
})();
