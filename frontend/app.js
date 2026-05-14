// QUAN TRỌNG: 
// Khi bạn deploy Backend lên mạng (ví dụ Render.com), hãy đổi URL này thành URL của Backend.
// Ví dụ: const BACKEND_URL = 'https://my-chat-backend.onrender.com';
const BACKEND_URL = 'https://congnghephanmen-webchatonline.onrender.com';

const socket = io(BACKEND_URL);

// Lấy các element trên giao diện
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const onlineStatus = document.getElementById('online-status');
const myIdentity = document.getElementById('my-identity');
const pulseDot = document.querySelector('.pulse-dot');

let myIpLabel = "";

// 1. Lắng nghe sự kiện kết nối
socket.on('connect', () => {
    onlineStatus.textContent = 'Đã kết nối';
    onlineStatus.style.color = '#4ade80';
    pulseDot.style.backgroundColor = '#4ade80';
    pulseDot.style.boxShadow = '0 0 8px #4ade80';
});

socket.on('disconnect', () => {
    onlineStatus.textContent = 'Mất kết nối...';
    onlineStatus.style.color = '#f87171';
    pulseDot.style.backgroundColor = '#f87171';
    pulseDot.style.boxShadow = 'none';
});

// 2. Nhận danh tính (IP) từ Server cấp cho
socket.on('your_identity', (data) => {
    myIpLabel = data.username;
    myIdentity.textContent = `Danh tính: ${myIpLabel}`;
});

// 3. Tải lịch sử chat khi vừa vào
socket.on('chat_history', (messages) => {
    chatMessages.innerHTML = ''; // Xoá sạch
    messages.forEach(msg => appendMessage(msg));
});

// 4. Lắng nghe tin nhắn mới
socket.on('receive_message', (msg) => {
    appendMessage(msg);
});

// 5. Hàm gửi tin nhắn
function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    // Gửi qua WebSocket
    socket.emit('send_message', { content });
    
    // Xoá ô nhập và focus lại
    messageInput.value = '';
    messageInput.focus();
}

// Bắt sự kiện click nút gửi
sendBtn.addEventListener('click', sendMessage);

// Bắt sự kiện nhấn Enter
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Hàm chèn tin nhắn vào giao diện
function appendMessage(msg) {
    const isSelf = msg.user === myIpLabel;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isSelf ? 'msg-self' : 'msg-other'}`;
    
    const infoSpan = document.createElement('span');
    infoSpan.className = 'msg-info';
    infoSpan.textContent = isSelf ? 'Bạn' : msg.user;
    
    const textNode = document.createTextNode(msg.content);
    
    msgDiv.appendChild(infoSpan);
    msgDiv.appendChild(textNode);
    
    chatMessages.appendChild(msgDiv);
    
    // Tự động cuộn xuống cuối cùng
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
