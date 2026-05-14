# 🌐 Nền Tảng Chat Realtime Đa Người Dùng (Anonymous Global Chat)

Dự án này là một ứng dụng Web Chat thời gian thực (Real-time), cho phép nhiều người dùng kết nối và nhắn tin ẩn danh ngay lập tức mà không cần đăng nhập phức tạp. Hệ thống được thiết kế theo kiến trúc Microservices cơ bản, tách biệt hoàn toàn giữa Frontend và Backend, hỗ trợ khả năng mở rộng (Scale) qua Redis và lưu trữ vĩnh viễn thông qua MongoDB.

## 🛠 Công Nghệ Sử Dụng
*   **Frontend:** HTML5, CSS3 (Giao diện Glassmorphism), JavaScript thuần, Socket.io-client.
*   **Backend:** Node.js, Express.js, Socket.io.
*   **Database:** MongoDB (Lưu trữ lịch sử tin nhắn vĩnh viễn).
*   **Message Broker:** Redis Pub/Sub (Đồng bộ tin nhắn giữa nhiều máy chủ Node.js).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Trực Tiếp Trên Máy (Local)

### 1. Yêu cầu môi trường
*   Máy tính đã cài đặt [Node.js](https://nodejs.org/) (Khuyên dùng bản LTS).
*   Đã cài đặt [Git](https://git-scm.com/).

### 2. Tải Source Code (Clone)
Mở Terminal/Command Prompt tại nơi bạn muốn lưu code và chạy lệnh:
```bash
git clone https://github.com/ROYCE-8425/CongNghePhanMen_webchatonline.git
cd CongNghePhanMen_webchatonline
```

### 3. Khởi động Backend (Máy chủ xử lý)
Bạn cần mở Terminal, di chuyển vào thư mục `backend` và cài đặt thư viện:
```bash
cd backend
npm install
npm start
```
*Lưu ý: Mặc định Backend sẽ chạy ở cổng `3000` (`http://localhost:3000`). Nếu không có link Database, hệ thống sẽ tự động bật "Chế độ lưu tạm vào RAM" để bạn vẫn có thể test chat bình thường mà không bị crash.*

### 4. Khởi động Frontend (Giao diện người dùng)
*   Đảm bảo Backend ở bước 3 đang chạy.
*   Mở thư mục `frontend` trên máy tính.
*   Click đúp chuột vào file `index.html` để mở nó bằng trình duyệt (Chrome, Edge,...).
*   **Mẹo:** Hãy mở 2 cửa sổ trình duyệt đặt cạnh nhau để tự chat qua lại, trải nghiệm tốc độ phản hồi của WebSockets!

---

## ☁️ Hướng Dẫn Triển Khai Lên Mạng (Deploy Internet)

Để ứng dụng có thể cho mọi người trên thế giới truy cập, bạn cần deploy (đưa lên mạng) tách biệt 2 phần Frontend và Backend.

### Giai Đoạn 1: Deploy Backend lên Render.com
1. Đăng ký tài khoản tại [Render.com](https://render.com/).
2. Bấm nút **New** > Chọn **Web Service** và kết nối với kho GitHub chứa source code này.
3. Ở màn hình cài đặt, cuộn xuống và thiết lập các thông số ĐẶC BIỆT QUAN TRỌNG sau:
   *   **Root Directory:** Gõ `backend`
   *   **Build Command:** Gõ `npm install`
   *   **Start Command:** Gõ `npm start`
4. (Tuỳ chọn) Ở phần **Environment**, thêm các biến môi trường nếu bạn muốn lưu dữ liệu vĩnh viễn:
   *   `MONGO_URI`: Đường link kết nối MongoDB Atlas (https://console.upstash.com/) (VD: `mongodb+srv://...`).
   *   `REDIS_URL`: Đường link kết nối Redis Upstash (https://www.mongodb.com/) (VD: `rediss://...`).
5. Cuộn xuống dưới cùng và bấm **Deploy**. Đợi Render tải xong báo chữ `Live` màu xanh lá cây.
6. Copy đường link URL mà Render cấp cho máy chủ của bạn (Ví dụ: `https://ten-app.onrender.com`).

### Giai Đoạn 2: Kết nối Frontend và Deploy lên GitHub Pages
1. Trở lại source code trên máy tính của bạn, mở file `frontend/app.js`.
2. Ở dòng số 4, bạn xoá cái `http://localhost:3000` đi và dán đường link Render bạn vừa copy ở Giai Đoạn 1 vào:
   ```javascript
   const BACKEND_URL = 'https://ten-app.onrender.com'; // Thay bằng link Render thật của bạn
   ```
3. Lưu file lại. Mở Terminal và đẩy đoạn code vừa sửa lên GitHub:
   ```bash
   git add .
   git commit -m "Update Backend URL cho Frontend"
   git push
   ```
4. Vào trang GitHub của dự án của bạn trên trình duyệt -> Chọn mục **Settings** -> Chọn **Pages** ở menu bên trái.
5. Tại mục Source (Build and deployment), đảm bảo chọn Deploy from a branch. Ở ô Branch, chọn nhánh `main` và thư mục `/(root)`. Bấm **Save**.
6. Chờ khoảng 1-2 phút, GitHub sẽ cấp cho bạn một đường link có đuôi `.github.io` ở trên cùng. 
7. Gửi đường link đó cho bạn bè và giảng viên, mọi người truy cập vào là có thể chat ẩn danh realtime ngay lập tức!

---
*Dự án hoàn thiện được đóng gói và cấu hình tối ưu. Chúc bạn bảo vệ đồ án thành công và đạt điểm tối đa!* 🌟
