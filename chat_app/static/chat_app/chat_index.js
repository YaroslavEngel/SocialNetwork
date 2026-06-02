window.currentUserEmail = document.querySelector("meta[name='current-user']").content;
let chatSocket = null;
let activeChatId = null;
let currentPage = 1;
let isLoading = false;
let hasNext = false;
let observer = null;

const csrfToken = document.querySelector("meta[name='csrf-token']").content;
window.csrfToken = csrfToken;

const chatButtons = document.querySelectorAll("[data-chat-user]");
const chatMain = document.querySelector(".chat-main");

chatButtons.forEach((button) => {
    button.addEventListener("click", async () => {
        await openChatWithUser(
            button.dataset.chatUser,
            button.dataset.chatUsername,
        );
    });
});

async function openChatWithUser(userId, username) {
    const response = await fetch(`/chat/chat_with/${userId}/`, {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
    });
    const data = await response.json();
    if (!data.success) return;
    await openChatById(data.chat_id, data.username || username);
}

async function openChatById(chatId, title) {
    activeChatId = chatId;
    addToMessagesList(title);
    currentPage = 1;
    hasNext = false;
    if (observer) observer.disconnect();

    chatMain.innerHTML = `
        <div class="chat-active-header">
            <div class="chat-active-avatar"></div>
            <span class="chat-active-title">${title}</span>
        </div>
        <div id="messages-load-sentinel"></div>
        <div id="messages" class="chat-messages-list"></div>
        <form id="message-form" class="chat-message-form">
            <input type="text" id="message-input" placeholder="Повідомлення..." autocomplete="off">
            <button type="button" class="chat-form-btn">
                <img src="/static/chat_app/images/Component 4.svg" alt="">
            </button>
            <button type="button" class="chat-form-btn">
                <img src="/static/chat_app/images/Component 3.svg" alt="">
            </button>
            <button type="submit" class="chat-send-btn">
                <img src="/static/chat_app/images/Send.svg" alt="">
            </button>
        </form>
    `;

    chatMain.style.justifyContent = "flex-start";
    chatMain.style.alignItems = "stretch";
    chatMain.style.padding = "0";

    document.querySelector("#message-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = document.querySelector("#message-input");
        const text = input.value.trim();
        if (!text || !chatSocket) return;
        if (chatSocket.readyState === WebSocket.OPEN) {
            chatSocket.send(JSON.stringify({ message: text }));
            input.value = "";
        } else {
            console.warn("WebSocket ще не підключено");
        }
    });

    await loadMessages();
    connectWebSocket(chatId);
    startObserver();
}

function connectWebSocket(chatId) {
    if (chatSocket) chatSocket.close();
    chatSocket = new WebSocket(`ws://${window.location.host}/ws/chat/${chatId}/`);
    
    chatSocket.onopen = () => {
        console.log("WebSocket підключено");
    };
    
    chatSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const messages = document.querySelector("#messages");
        if (!messages) return;
        messages.appendChild(renderMessage(data));
        messages.scrollTop = messages.scrollHeight;
    };

    chatSocket.onerror = (error) => {
        console.error("WebSocket помилка:", error);
    };

    chatSocket.onclose = () => {
        console.log("WebSocket закрито");
    };
}

async function loadMessages(prerend = false) {
    const messages = document.querySelector("#messages");
    if (!messages) return;
    const oldHeight = messages.scrollHeight;
    const response = await fetch(
        `/chat/${activeChatId}/messages?page=${currentPage}`,
        { headers: { "X-Requested-With": "XMLHttpRequest" } },
    );
    const data = await response.json();
    const fragment = document.createDocumentFragment();
    data.messages.forEach((message) => {
        fragment.appendChild(renderMessage(message));
    });
    const sentinel = document.querySelector("#messages-load-sentinel");
    if (prerend) {
        sentinel.after(fragment);
    } else {
        messages.appendChild(fragment);
    }
    hasNext = data.has_next;
    currentPage++;
    if (prerend) {
        messages.scrollTop = messages.scrollHeight - oldHeight;
    } else {
        messages.scrollTop = messages.scrollHeight;
    }
}

function startObserver() {
    const sentinel = document.querySelector("#messages-load-sentinel");
    if (!sentinel) return;
    observer = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting && hasNext && !isLoading) {
            isLoading = true;
            await loadMessages(true);
            isLoading = false;
        }
    });
    observer.observe(sentinel);
}

function renderMessage(data) {
    const currentUser = document.querySelector("meta[name='csrf-token']") ? window.currentUserEmail : null;
    const message = document.createElement('div');
    const isOwn = data.sender === window.currentUserEmail;
    message.className = `message ${isOwn ? 'message-own' : 'message-other'}`;
    message.textContent = data.text;
    return message;
}

function addToMessagesList(username) {
    const messagesList = document.querySelector(".chat-messages-block");
    if (!messagesList) return;
    
    // Перевіряємо чи вже є цей юзер в списку
    const existing = [...messagesList.querySelectorAll(".chat-user-button")]
        .find(btn => btn.dataset.chatUsername === username);
    if (existing) return;

    const btn = document.createElement("button");
    btn.className = "chat-user-button";
    btn.dataset.chatUsername = username;
    btn.textContent = username;
    btn.addEventListener("click", async () => {
        await openChatWithUser(btn.dataset.chatUser, username);
    });
    messagesList.appendChild(btn);
}