# Hành Trình Của Kraken 🐙

Game tĩnh (static HTML/CSS/JS, không build, không backend) cho bé 6 tuổi, tổ chức theo
**bản đồ đảo**: mỗi môn/kỹ năng là một đảo, mỗi đảo gồm nhiều game nhỏ. Danh sách đảo/game
khai báo ở một nơi duy nhất: `js/registry.js` (`KrakenRegistry`); game mới là một ES module
riêng trong `js/games/` tự đăng ký vào registry.

## Đảo Chuột — luyện dùng chuột

| Màn | Tên | Kỹ năng chuột |
|---|---|---|
| 1 | Lặn Biển Tìm Kho Báu | Di chuột |
| 2 | Hứng Hàng Cứu Trợ | Click |
| 3 | Xếp Xe, Máy Bay, Tàu Chiến | Kéo & thả (pointer events) |
| 4 | Đua Xe Ăn Xu Vàng | Giữ chuột & lái theo đường |
| 5 | Kraken Sút Phạt — Tiền Đạo Số 7 | Ngắm + giữ nạp lực + thả để sút |

## Đảo Toán — cộng/trừ trong phạm vi 100 (chơi được trên máy tính VÀ iPad)

| Game | Cách chơi |
|---|---|
| Tính Nhanh | Hiện phép cộng/trừ, chạm/bấm vào đáp án đúng |
| Tìm Số Bí Ẩn | Phương trình thiếu một số (a + ? = c, ? − b = c...), chọn số còn thiếu |

Sai thì được gợi ý và chọn lại — không có trạng thái "thua". Mọi game ngoài Đảo Chuột/Đảo Bàn Phím
đều phải chơi được bằng cảm ứng trên iPad (chỉ dùng click/chạm trên nút to, không phụ thuộc di chuột/hover).

Các đảo Bàn Phím, Chữ, Tư Duy đang hiện "Sắp ra mắt" trên bản đồ đảo.

- Tiến độ (sao + cấp độ khó) lưu trong `localStorage` với khóa `krakenProgress`, cấu trúc **v2**
  (`{version: 2, stars, completed, difficulty}` khóa theo id game). Dữ liệu v1 của 5 màn chuột
  được tự động migrate lên v2, không mất sao/cấp đã lưu.
- Âm thanh tự tạo bằng Web Audio API, không có file ngoài, không CDN, không hình ảnh bản quyền.

## Độ khó theo công thức (không có mức cứng)

Mỗi game có **Cấp độ khó D = 1, 2, 3, ...** không giới hạn. Mọi thông số (tốc độ, kích thước,
số lượng, phạm vi số, xác suất có nhớ/có mượn, độ gần của đáp án nhiễu...) đều được tính từ D
bằng công thức riêng của từng game trong `js/difficulty.js` (`KrakenDifficulty.params(game, D)`),
có trần/sàn an toàn cho bé. Chơi tốt → tự lên 1 cấp, chơi kém → lùi 1 cấp (không thấp hơn 1);
ba mẹ cũng chỉnh tay được bằng nút − / + "Cấp D" ngay trong màn chơi.

Câu hỏi toán được sinh bởi `js/mathbank.js` (thuần, test được bằng Node): số hạng và kết quả
luôn trong phạm vi 100, phép trừ không bao giờ âm.

Test (cần server tĩnh ở cổng 8901 cho các test trình duyệt):

```bash
node tests/difficulty.test.js   # tính chất công thức độ khó, D=1..30
node tests/mathbank.test.js     # tính chất sinh câu hỏi toán
node tests/playwright.test.js   # 5 màn chuột trên trình duyệt
node tests/layout.test.js       # bố cục khung chơi 16:10
node tests/math.test.js         # bản đồ đảo, Đảo Toán, migrate v1->v2, iPad cảm ứng
```

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
