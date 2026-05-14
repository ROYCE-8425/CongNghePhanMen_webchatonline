const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Quan trọng: Cấu hình CORS để Frontend từ GitHub Pages có thể gọi vào
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép mọi domain kết nối (bao gồm cả GitHub Pages)
        methods: ["GET", "POST"]
    }
});

// Cho phép các request HTTP thông thường (nếu cần)
app.use(cors());

// ==========================================
// 1. KẾT NỐI MONGODB LƯU TRỮ VĨNH VIỄN
// ==========================================
// Thay chuỗi này bằng chuỗi kết nối MongoDB Atlas của bạn khi deploy thực tế
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB thành công!'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// Schema Tin nhắn
const messageSchema = new mongoose.Schema({
    user: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// ==========================================
// 2. KẾT NỐI REDIS LÀM PUB/SUB BROKER
// ==========================================
// Thay bằng URL của Redis Labs / Upstash khi deploy
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
      // Tích hợp Redis vào hệ thống Socket.io để scale nhiều server
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Đã kết nối Redis Pub/Sub thành công!');
  })
  .catch(err => console.error('❌ Lỗi kết nối Redis:', err));


// Route cơ bản để ping kiểm tra server có sống không
app.get('/', (req, res) => {
    res.send('Backend Hệ thống Chat Realtime đã hoạt động (WS + Redis + Mongo)');
});

// ==========================================
// 3. XỬ LÝ WEBSOCKET LÕI
// ==========================================
io.on('connection', (socket) => {
    // Thu thập IP thật của người dùng
    let clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    
    // Rút gọn IP để hiển thị đẹp hơn
    if (clientIp === '::1' || clientIp.includes('127.0.0.1')) {
        clientIp = 'Local';
    } else {
        // Cắt bớt đuôi IP để bảo mật (VD: 113.22.x.x)
        const parts = clientIp.split('.');
        if(parts.length === 4) clientIp = `${parts[0]}.${parts[1]}.x.x`;
    }
    
    const username = `ẨnDanh_${clientIp}`;
    console.log(`🔌 Kết nối mới: ${username}`);

    // Báo cho chính client biết họ đang mang định danh gì
    socket.emit('your_identity', { username: username });

    // Truy xuất 50 tin nhắn gần nhất từ MongoDB và gửi xuống cho Client
    Message.find().sort({createdAt: 1}).limit(50).then(messages => {
        socket.emit('chat_history', messages);
    });

    // Xử lý khi Client gửi tin nhắn lên
    socket.on('send_message', async (data) => {
        if (!data.content || data.content.trim() === '') return;
        
        // 1. Lưu vào cơ sở dữ liệu MongoDB
        const newMsg = new Message({ 
            user: username, 
            content: data.content 
        });
        await newMsg.save();

        // 2. Phát sóng (Broadcast) tin nhắn này tới toàn bộ Client
        // Nhờ có Redis, lệnh emit này sẽ chọc sang các Node Server khác để phát chung
        io.emit('receive_message', newMsg);
    });

    // Khi người dùng đóng tab
    socket.on('disconnect', () => {
        console.log(`❌ Đã thoát: ${username}`);
    });
});

// ==========================================
// KHỞI CHẠY SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Máy chủ Backend đang chạy tại port ${PORT}`);
});
