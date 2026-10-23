# Hành Trình Của Kraken 🐙

Game tĩnh (static HTML/CSS/JS, không build, không backend) giúp bé 6 tuổi luyện dùng chuột:

| Màn | Tên | Kỹ năng chuột |
|---|---|---|
| 1 | Lặn Biển Tìm Kho Báu | Di chuột |
| 2 | Hứng Hàng Cứu Trợ | Click |
| 3 | Xếp Xe, Máy Bay, Tàu Chiến | Kéo & thả (pointer events) |
| 4 | Đua Xe Ăn Xu Vàng | Giữ chuột & lái theo đường |
| 5 | Kraken Sút Phạt — Tiền Đạo Số 7 | Ngắm + giữ nạp lực + thả để sút |

- Tiến độ (sao + cấp độ khó) lưu trong `localStorage` với khóa `krakenProgress`.
- Âm thanh tự tạo bằng Web Audio API, không có file ngoài, không CDN, không hình ảnh bản quyền.

## Độ khó theo công thức (không có mức cứng)

Mỗi màn có **Cấp độ khó D = 1, 2, 3, ...** không giới hạn. Mọi thông số (tốc độ, kích thước,
số lượng, bề rộng đường, vùng lực sút...) đều được tính từ D bằng công thức riêng của từng
màn trong `js/difficulty.js` (`KrakenDifficulty.params(màn, D)`), có trần/sàn an toàn cho bé.
Chơi tốt → tự lên 1 cấp, chơi kém → lùi 1 cấp (không thấp hơn 1); ba mẹ cũng chỉnh tay được
bằng nút − / + "Cấp D" ngay trong màn chơi. Test: `node tests/difficulty.test.js` và
`node tests/playwright.test.js` (cần server tĩnh ở cổng 8901).

## Chạy thử ở máy nhà

```bash
cd kraken-games
python3 -m http.server 8901
# mở http://localhost:8901
```

## Lên GitHub Pages (bước sau, do chủ repo thực hiện)

1. Tạo repo GitHub, push thư mục này lên branch `main`.
2. Trong repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → main / (root)**.
3. Trang sẽ có địa chỉ dạng `https://<username>.github.io/<repo>/`.
