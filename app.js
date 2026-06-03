// Sample data
let chats = [
    { id: 1, name: "Alice Johnson", avatar: "👩", lastMessage: "See you tomorrow!", time: "2:45 PM", online: true },
    { id: 2, name: "Bob Smith", avatar: "👨", lastMessage: "Thanks for the update", time: "1:20 PM", online: false },
    { id: 3, name: "Team Project", avatar: "👥", lastMessage: "Meeting at 3 PM", time: "12:30 PM", online: true },
    { id: 4, name: "Sarah Davis", avatar: "👩‍🦰", lastMessage: "Sounds good!", time: "11:00 AM", online: true },
    { id: 5, name: "Mike Wilson", avatar: "👨‍💼", lastMessage: "Let me check", time: "Yesterday", online: false },
];

let messages = {
    1: [
        { id: 1, text: "Hi! How are you?", sent: false, time: "2:30 PM" },
        { id: 2, text: "I'm doing great! How about you?", sent: true, time: "2:31 PM" },
        { id: 3, text: "All good! See you tomorrow!", sent: false, time: "2:45 PM" },
    ],
    2: [
        { id: 1, text: "Did you get my email?", sent: false, time: "1:15 PM" },
        { id: 2, text: "Yes, I did! Thanks for the update", sent: false, time: "1:20 PM" },
    ],
    3: [
        { id: 1, text: "Hi everyone!", sent: false, time: "12:20 PM" },
        { id: 2, text: "Meeting at 3 PM", sent: false, time: "12:30 PM" },
        { id: 3, text: "Got it!", sent: true, time: "12:32 PM" },
    ],
};

let currentChat = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderChats();
    setupEventListeners();
});

function renderChats() {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = '';

    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        if (currentChat === chat.id) chatItem.classList.add('active');

        chatItem.innerHTML = `
            <div class="chat-avatar">${chat.avatar}</div>
            <div class="chat-preview">
                <h3>${chat.name}</h3>
                <p>${chat.lastMessage}</p>
            </div>
            <div class="chat-time">${chat.time}</div>
        `;

        chatItem.addEventListener('click', () => selectChat(chat.id));
        chatList.appendChild(chatItem);
    });
}

function selectChat(chatId) {
    currentChat = chatId;
    renderChats();
    renderMessages();

    const chat = chats.find(c => c.id === chatId);
    document.getElementById('chatName').textContent = chat.name;
    document.getElementById('chatStatus').textContent = chat.online ? 'Online' : 'Offline';
    document.getElementById('messageInputArea').style.display = 'flex';
}

function renderMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';

    const chatMessages = messages[currentChat] || [];

    chatMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sent ? 'sent' : 'received'}`;

        messageDiv.innerHTML = `
            <div>
                <div class="message-bubble">${escapeHtml(msg.text)}</div>
                <div class="message-time">${msg.time}</div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
    });

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (!text || !currentChat) return;

    // Add message
    if (!messages[currentChat]) messages[currentChat] = [];

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    messages[currentChat].push({
        id: Date.now(),
        text: text,
        sent: true,
        time: time
    });

    // Update last message in chat
    const chat = chats.find(c => c.id === currentChat);
    if (chat) {
        chat.lastMessage = text;
        chat.time = 'Just now';
    }

    input.value = '';
    renderMessages();
    renderChats();

    // Simulate response
    setTimeout(() => {
        messages[currentChat].push({
            id: Date.now(),
            text: "That's great! 👍",
            sent: false,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        });
        renderMessages();
    }, 1000);
}

function setupEventListeners() {
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    document.getElementById('newChatBtn').addEventListener('click', () => {
        alert('New chat feature coming soon!');
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
        alert('Settings feature coming soon!');
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = chats.filter(chat =>
            chat.name.toLowerCase().includes(query)
        );
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';
        filtered.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            if (currentChat === chat.id) chatItem.classList.add('active');
            chatItem.innerHTML = `
                <div class="chat-avatar">${chat.avatar}</div>
                <div class="chat-preview">
                    <h3>${chat.name}</h3>
                    <p>${chat.lastMessage}</p>
                </div>
                <div class="chat-time">${chat.time}</div>
            `;
            chatItem.addEventListener('click', () => selectChat(chat.id));
            chatList.appendChild(chatItem);
        });
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}