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
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.use(cors());

// ---- BIẾN LƯU TẠM (Trường hợp chưa điền Link Database) ----
const memoryMessages = [];
let isMongoConnected = false;

// ==========================================
// 1. KẾT NỐI MONGODB
// ==========================================
const MONGO_URI = process.env.MONGO_URI;

// Schema Tin nhắn
const messageSchema = new mongoose.Schema({
    user: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// CHỐNG CRASH: Chỉ kết nối nếu có link xịn, nếu điền chữ "value" thì bỏ qua
if (MONGO_URI && MONGO_URI !== 'value' && MONGO_URI.startsWith('mongodb')) {
    mongoose.connect(MONGO_URI)
      .then(() => {
          console.log('✅ Đã kết nối MongoDB Cloud!');
          isMongoConnected = true;
      })
      .catch(err => console.error('❌ Lỗi MongoDB:', err));
} else {
    console.log('⚠️ Đang chạy chế độ KHÔNG-DATABASE (Lưu tạm vào RAM).');
}

// ==========================================
// 2. KẾT NỐI REDIS PUB/SUB
// ==========================================
const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL && REDIS_URL !== 'value' && (REDIS_URL.startsWith('redis') || REDIS_URL.startsWith('rediss'))) {
    const pubClient = createClient({ url: REDIS_URL });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
          io.adapter(createAdapter(pubClient, subClient));
          console.log('✅ Đã kết nối Redis Cloud!');
      })
      .catch(err => console.error('❌ Lỗi kết nối Redis:', err));
} else {
    console.log('⚠️ Không dùng Redis Pub/Sub (Chạy Server đơn).');
}

// Route cơ bản
app.get('/', (req, res) => {
    res.send('Backend Realtime Chat đang hoạt động tốt!');
});

// ==========================================
// 3. XỬ LÝ WEBSOCKET
// ==========================================
io.on('connection', (socket) => {
    let clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    
    if (clientIp === '::1' || clientIp.includes('127.0.0.1')) {
        clientIp = 'Local';
    } else {
        const parts = clientIp.split('.');
        if(parts.length === 4) clientIp = `${parts[0]}.${parts[1]}.x.x`;
    }
    
    const username = `ẨnDanh_${clientIp}`;
    console.log(`🔌 Kết nối mới: ${username}`);

    socket.emit('your_identity', { username: username });

    // Gửi lịch sử chat
    if (isMongoConnected) {
        Message.find().sort({createdAt: 1}).limit(50).then(messages => {
            socket.emit('chat_history', messages);
        });
    } else {
        // Trả về mảng lưu tạm nếu chưa có DB
        socket.emit('chat_history', memoryMessages);
    }

    // Nhận tin nhắn
    socket.on('send_message', async (data) => {
        if (!data.content || data.content.trim() === '') return;
        
        const newMsgObj = { user: username, content: data.content, createdAt: new Date() };

        if (isMongoConnected) {
            const newMsg = new Message(newMsgObj);
            await newMsg.save();
            io.emit('receive_message', newMsg);
        } else {
            // Chế độ lưu tạm
            memoryMessages.push(newMsgObj);
            if (memoryMessages.length > 50) memoryMessages.shift(); // Chỉ giữ 50 tin mới nhất
            io.emit('receive_message', newMsgObj);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Đã thoát: ${username}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Máy chủ Backend đang chạy tại port ${PORT}`);
});
