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

function showConfirmModal(text, onConfirm) {
    const existing = document.querySelector("#confirm-modal-overlay")
    if (existing) existing.remove()

    const overlay = document.createElement("div")
    overlay.id = "confirm-modal-overlay"
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `

    overlay.innerHTML = `
        <div style="
            background: #fff;
            border-radius: 20px;
            padding: 36px 32px 28px;
            min-width: 320px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 8px 40px rgba(0,0,0,0.18);
            font-family: inherit;
        ">
            <h2 style="
                margin: 0 0 18px;
                font-size: 20px;
                font-weight: 700;
                color: #222;
            ">Підтвердити дію</h2>
            <p style="
                margin: 0 0 28px;
                font-size: 15px;
                color: #444;
                line-height: 1.5;
            ">${text}</p>
            <div style="display: flex; gap: 12px; justify-content: center; align-items: center;">
                <button id="confirm-modal-cancel" style="background:none;border:none;padding:0;cursor:pointer;line-height:0;">
                    <img src="/static/images/CancelButton.svg" alt="Скасувати" style="height:40px;">
                </button>
                <button id="confirm-modal-accept" style="background:none;border:none;padding:0;cursor:pointer;line-height:0;">
                    <img src="/static/images/AcceptButton.svg" alt="Підтвердити" style="height:40px;">
                </button>
            </div>
        </div>
    `

    document.body.appendChild(overlay)

    document.querySelector("#confirm-modal-cancel").addEventListener("click", () => {
        overlay.remove()
    })

    document.querySelector("#confirm-modal-accept").addEventListener("click", () => {
        overlay.remove()
        onConfirm()
    })

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove()
    })
}

chatButtons.forEach((button) => {
    button.addEventListener("click", async () => {
        await openChatWithUser(button.dataset.chatUser, button.dataset.chatUsername);
    });
});

async function openChatWithUser(userId, username) {
    const response = await fetch(`/chat/chat_with/${userId}/`, {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
    });
    const data = await response.json();
    if (!data.success) return;

    const btn = document.querySelector(`[data-chat-user="${userId}"]`);
    if (btn) {
        const badge = btn.querySelector(".chat-unread-badge");
        if (badge) badge.remove();
        moveContactToTop(btn);
    }

    await openChatById(data.chat_id, data.username || username, null, false);
}

function moveContactToTop(btn) {
    const parent = btn.parentElement;
    if (!parent) return;
    const firstBtn = parent.querySelector(".chat-user-button--rich");
    if (firstBtn && firstBtn !== btn) {
        parent.insertBefore(btn, firstBtn);
    }
}

async function markChatRead(chatId) {
    try {
        await fetch(`/chat/${chatId}/mark_read/`, {
            method: "POST",
            headers: { "X-CSRFToken": csrfToken },
        });
    } catch (err) {
        console.error("Failed to mark chat as read:", err);
    }

    const personalBtn = document.querySelector(`.chat-user-button--rich[data-chat-id="${chatId}"]`);
    if (personalBtn) {
        const badge = personalBtn.querySelector(".chat-unread-badge");
        if (badge) badge.remove();
    }

    const groupItem = document.querySelector(`#group-list [data-chat-id="${chatId}"]`);
    if (groupItem) {
        const badge = groupItem.querySelector(".group-unread-badge");
        if (badge) badge.remove();
    }
}

async function openChatById(chatId, title, avatarUrl = null, isGroup = false) {
    activeChatId = chatId;
    currentPage = 1;
    hasNext = true;
    isLoading = false;
    if (observer) observer.disconnect();

    chatMain.innerHTML = `
        <div class="chat-active-header">
            <div class="chat-active-avatar" id="chat-active-avatar">
                ${avatarUrl ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : title.slice(0, 2).toUpperCase()}
            </div>
            <span class="chat-active-title">${title}</span>
            ${isGroup ? `
                <button id="chat-menu-btn" style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:22px;color:#543C52;padding:0 8px;z-index:101;">⋮</button>
                <div id="chat-menu-dropdown" style="display:none;position:absolute;right:16px;top:35px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:100;min-width:200px;overflow:hidden;"></div>
            ` : ''}
        </div>
        <div id="messages" class="chat-messages-list">
            <div id="messages-load-sentinel"></div>
        </div>
        <form id="message-form" class="chat-message-form">
            <input type="text" id="message-input" placeholder="Повідомлення..." autocomplete="off">
            <input type="file" id="image-input" accept="image/*" multiple style="position:absolute;opacity:0;width:0;height:0">
            <button type="button" class="chat-form-btn">
                <img src="/static/chat_app/images/Component 4.svg" alt="">
            </button>
            <button type="button" class="chat-form-btn" id="image-btn">
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

    await markChatRead(chatId);

    if (isGroup) {
        const menuBtn = document.querySelector("#chat-menu-btn")
        const menuDropdown = document.querySelector("#chat-menu-dropdown")

        menuBtn.addEventListener("click", async (e) => {
            e.stopPropagation()
            if (menuDropdown.style.display === "block") {
                menuDropdown.style.display = "none"
                return
            }
            const info = await fetch(`/chat/${chatId}/group_info/`).then(r => r.json()).catch(() => null)
            if (!info || !info.success) {
                menuDropdown.style.display = "none"
                return
            }

            if (info.is_admin) {
                menuDropdown.innerHTML = `
                    <img src="/static/chat_app/images/MediaEdit.svg" class="chat-menu-svg" id="menu-media">
                    <img src="/static/chat_app/images/Editgroup.svg" class="chat-menu-svg" id="menu-edit">
                    <div class="chat-menu-divider"></div>
                    <img src="/static/chat_app/images/Deletechat.svg" class="chat-menu-svg chat-menu-svg--danger" id="menu-delete">
                `
                menuDropdown.style.minHeight = "144px"

                menuDropdown.querySelector("#menu-edit").addEventListener("click", (e) => {
                    e.stopPropagation()
                    menuDropdown.style.display = "none"
                    window.openEditGroupModal(chatId)
                })

                menuDropdown.querySelector("#menu-delete").addEventListener("click", (e) => {
                    e.stopPropagation()
                    menuDropdown.style.display = "none"
                    showConfirmModal("Ви дійсно хочете видалити групу для всіх учасників?", async () => {
                        const res = await fetch(`/chat/${chatId}/delete_group/`, {
                            method: "POST",
                            headers: { "X-CSRFToken": csrfToken },
                        })
                        const data = await res.json()
                        if (data.success) {
                            const item = document.querySelector(`#group-list [data-chat-id="${chatId}"]`)
                            if (item) item.remove()
                            chatMain.innerHTML = `
                                <div class="chat-main-welcome">
                                    <h1 id="chat-title">Почніть нове спілкування</h1>
                                    <p id="chat-status">Оберіть контакт зі списку ліворуч або створіть групу, щоб почати спілкування</p>
                                </div>
                            `
                            activeChatId = null
                            if (chatSocket) chatSocket.close()
                        } else {
                            alert("Не вдалося видалити групу.")
                        }
                    })
                })

            } else {
                menuDropdown.innerHTML = `
                    <img src="/static/chat_app/images/MediaEdit.svg" class="chat-menu-svg" id="menu-media">
                    <div class="chat-menu-divider"></div>
                    <img src="/static/chat_app/images/Leavechat.svg" class="chat-menu-svg chat-menu-svg--danger" id="menu-leave">
                `
                menuDropdown.style.minHeight = "108px"

                menuDropdown.querySelector("#menu-leave").addEventListener("click", (e) => {
                    e.stopPropagation()
                    menuDropdown.style.display = "none"
                    showConfirmModal("Ви дійсно хочете покинути групу?", async () => {
                        const res = await fetch(`/chat/${chatId}/leave_group/`, {
                            method: "POST",
                            headers: { "X-CSRFToken": csrfToken },
                        })
                        const data = await res.json()
                        if (data.success) {
                            const item = document.querySelector(`#group-list [data-chat-id="${chatId}"]`)
                            if (item) item.remove()
                            chatMain.innerHTML = `
                                <div class="chat-main-welcome">
                                    <h1 id="chat-title">Почніть нове спілкування</h1>
                                    <p id="chat-status">Оберіть контакт зі списку ліворуч або створіть групу, щоб почати спілкування</p>
                                </div>
                            `
                            activeChatId = null
                            if (chatSocket) chatSocket.close()
                        } else {
                            alert("Не вдалося покинути групу.")
                        }
                    })
                })
            }

            menuDropdown.style.display = "block"
        })

        document.addEventListener("click", () => {
            if (menuDropdown) menuDropdown.style.display = "none"
        })
    }

    document.querySelector("#message-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = document.querySelector("#message-input");
        const imageInput = document.querySelector("#image-input");
        const text = input.value.trim();
        const hasImages = imageInput.files.length > 0;

        if (!text && !hasImages) return;
        if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not connected");
            return;
        }

        if (hasImages) {
            const files = Array.from(imageInput.files);
            for (const file of files) {
                await sendImageViaWebSocket(file, text);
            }
            imageInput.value = "";
            input.value = "";
            return;
        }

        chatSocket.send(JSON.stringify({ message: text }));
        input.value = "";
    });

    document.querySelector("#image-btn").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelector("#image-input").click();
    });

    await loadMessages();
    connectWebSocket(chatId);
    startObserver();
}

function sendImageViaWebSocket(file, text = "") {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            chatSocket.send(JSON.stringify({
                message: text,
                image: e.target.result,
            }));
            resolve();
        };
        reader.readAsDataURL(file);
    });
}

function connectWebSocket(chatId) {
    if (chatSocket) chatSocket.close();
    chatSocket = new WebSocket(`ws://${window.location.host}/ws/chat/${chatId}/`);

    const currentUserId = document.querySelector("meta[name='current-user-id']").content;
    if (!window.presenceSocket || window.presenceSocket.readyState !== WebSocket.OPEN) {
        window.presenceSocket = new WebSocket(
            `ws://${window.location.host}/ws/presence/${currentUserId}/`
        );
        window.presenceSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === "presence_update") {
                updateStatusDot(data.user_id, data.is_online);
            }
        };
    }

    chatSocket.onopen = () => console.log("WebSocket connected");

    chatSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "presence_update") {
            updateStatusDot(data.user_id, data.is_online);
            return;
        }

        const messages = document.querySelector("#messages");
        if (!messages) return;
        messages.appendChild(renderMessage(data));
        requestAnimationFrame(() => {
            messages.scrollTop = messages.scrollHeight;
        });
    };

    chatSocket.onerror = (error) => console.error("WebSocket error:", error);
    chatSocket.onclose = () => console.log("WebSocket closed");
}

function updateStatusDot(userId, isOnline) {
    document.querySelectorAll(`[data-status-id="${userId}"]`).forEach(dot => {
        const size = dot.dataset.statusSize || "small";
        dot.src = isOnline
            ? `/static/chat_app/images/status_online_${size}.svg`
            : `/static/chat_app/images/status_offline_${size}.svg`;
    });
}

async function loadMessages(prepend = false) {
    const messages = document.querySelector("#messages");
    if (!messages || isLoading || !hasNext) return;
    isLoading = true;
    const oldHeight = messages.scrollHeight;
    const response = await fetch(
        `/chat/${activeChatId}/messages/?page=${currentPage}`,
        { headers: { "X-Requested-With": "XMLHttpRequest" } }
    );
    const data = await response.json();
    const fragment = document.createDocumentFragment();
    data.messages.forEach((msg) => fragment.appendChild(renderMessage(msg)));
    const sentinel = document.querySelector("#messages-load-sentinel");
    if (prepend) {
        sentinel.after(fragment);
    } else {
        messages.appendChild(fragment);
    }
    hasNext = data.has_next;
    currentPage++;
    if (prepend) {
        messages.scrollTop = messages.scrollHeight - oldHeight;
    } else {
        requestAnimationFrame(() => {
            messages.scrollTop = messages.scrollHeight;
        });
    }
    isLoading = false;
}

function startObserver() {
    const sentinel = document.querySelector("#messages-load-sentinel");
    if (!sentinel) return;
    observer = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting && hasNext && !isLoading) {
            await loadMessages(true);
        }
    }, { root: document.querySelector("#messages"), rootMargin: "20px" });
    observer.observe(sentinel);
}

function padNum(n) {
    return String(n).padStart(2, "0");
}

function formatTime(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    return `${padNum(d.getHours())}:${padNum(d.getMinutes())}`;
}

function renderMessage(data) {
    const message = document.createElement("div");
    const isOwn = data.sender === window.currentUserEmail;
    message.className = `message ${isOwn ? "message-own" : "message-other"}`;

    if (!isOwn) {
        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = data.sender.slice(0, 2).toUpperCase();
        message.appendChild(avatar);
    }

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    if (!isOwn) {
        const senderName = document.createElement("span");
        senderName.className = "message-sender-name";
        senderName.textContent = data.sender;
        messageContent.appendChild(senderName);
    }

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (data.text) {
        const textSpan = document.createElement("span");
        textSpan.className = "message-text";
        textSpan.textContent = data.text;
        bubble.appendChild(textSpan);
    }

    if (Array.isArray(data.images) && data.images.length > 0) {
        data.images.forEach((url) => {
            const img = document.createElement("img");
            img.src = url;
            img.style.maxWidth = "200px";
            img.style.borderRadius = "8px";
            img.style.display = "block";
            bubble.appendChild(img);
        });
    }

    if (data.created_at) {
        const time = document.createElement("span");
        time.className = "message-time";
        time.textContent = formatTime(data.created_at);
        bubble.appendChild(time);
    }

    messageContent.appendChild(bubble);
    message.appendChild(messageContent);
    return message;
}

window.openChatById = openChatById;
window.bindGroupChatButtons = function () {
    document.querySelectorAll("[data-chat-id]").forEach((button) => {
        if (button.dataset.groupBound === "true") return;
        button.dataset.groupBound = "true";
        button.addEventListener("click", async () => {
            await openChatById(
                button.dataset.chatId,
                button.dataset.chatName,
                button.dataset.avatarUrl || null,
                true
            );
        });
    });
};
window.bindGroupChatButtons();