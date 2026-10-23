# Hành Trình Của Kraken 🐙

Game tĩnh (static HTML/CSS/JS, không build, không backend) giúp bé 6 tuổi luyện dùng chuột:

| Màn | Tên | Kỹ năng chuột |
|---|---|---|
| 1 | Lặn Biển Tìm Kho Báu | Di chuột |
| 2 | Hứng Hàng Cứu Trợ | Click |
| 3 | Xếp Xe, Máy Bay, Tàu Chiến | Kéo & thả (pointer events) |
| 4 | Đua Xe Ăn Xu Vàng | Giữ chuột & lái theo đường |
| 5 | Kraken Sút Phạt — Tiền Đạo Số 7 | Ngắm + giữ nạp lực + thả để sút |

- Tiến độ (sao) lưu trong `localStorage` với khóa `krakenProgress`.
- Âm thanh tự tạo bằng Web Audio API, không có file ngoài, không CDN, không hình ảnh bản quyền.

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
