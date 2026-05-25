let ws = null;
const csrfToken = document.querySelector("meta[name=csrf-token]").content;
const chatTitle = document.getElementById("chat-title");
const chatStatus = document.getElementById("chat-status");
const chatButtons = document.querySelectorAll("[data-chat-user]");

async function openChatWithUser(userId){
    const response = await fetch(`/chat/chat_with/${userId}/`, {
        method: "POST",
        headers: {'X-CSRFToken': csrfToken}
    })
    const data = await response.json()
    if (!data.success){
        return
    }
    chatTitle.textContent = data.username
    connectWebSocket(data.chatId)
}

function connectWebSocket(chatId){
    if (ws){
        ws.close()
    }
    const url = `ws://${window.location.host}/chat/${chatId}`
    ws = new WebSocket(url)
    ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        chatStatus.textContent = eventData.message
    }
}

chatButtons.forEach((button) => {
    button.addEventListener('click', async () => {
        await openChatWithUser(button.dataset.chatUser)
    })
})