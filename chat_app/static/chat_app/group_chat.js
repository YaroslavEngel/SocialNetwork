const groupCsrfToken = document.querySelector("meta[name='csrf-token']").content

const openGroupModalButton = document.querySelector(".chat-create-btn")
const groupModal = document.querySelector("#group-modal")
const groupStepUsers = document.querySelector("#group-step-users")
const groupStepName = document.querySelector("#group-step-name")
const closeGroupModalButton = document.querySelector("#close-group-modal")
const closeGroupNameModalButton = document.querySelector("#close-group-name-modal")
const cancelGroupModalButton = document.querySelector("#cancel-group-modal")
const nextGroupStepButton = document.querySelector("#next-group-step")
const backGroupStepButton = document.querySelector("#back-group-step")
const createGroupButton = document.querySelector("#create-group")
const groupNameInput = document.querySelector("#group-name")
const selectedCount = document.querySelector("#selected-count")
const selectedUsersList = document.querySelector("#selected-users-list")
const groupUserCheckboxes = document.querySelectorAll(".group-user-checkbox")
const groupList = document.querySelector("#group-list")

// Элементы управления аватаркой группы
const groupAvatarInput = document.getElementById('group-avatar-input');
const groupAvatarPreview = document.getElementById('group-avatar-preview');
const btnAddAvatar = document.getElementById('btn-add-avatar');
const btnChooseAvatar = document.getElementById('btn-choose-avatar');
let isAvatarUploaded = false; 

// Функция сброса превью к текстовым инициалам (используется при закрытии модалки)
function resetAvatarPreview() {
    groupAvatarPreview.style.backgroundImage = 'none';
    const val = groupNameInput.value.trim();
    groupAvatarPreview.textContent = val.slice(0, 2).toUpperCase() || "НГ";
    groupAvatarInput.value = '';
    isAvatarUploaded = false;
}

// Обе кнопки выполняют только одну задачу — открывают выбор файла
if (btnAddAvatar) {
    btnAddAvatar.addEventListener('click', function() {
        groupAvatarInput.click();
    });
}

if (btnChooseAvatar) {
    btnChooseAvatar.addEventListener('click', function() {
        groupAvatarInput.click();
    });
}

// Обработка выбора файла (только добавление/изменение превью)
groupAvatarInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            groupAvatarPreview.style.backgroundImage = `url('${e.target.result}')`;
            groupAvatarPreview.style.backgroundSize = 'cover';
            groupAvatarPreview.style.backgroundPosition = 'center';
            groupAvatarPreview.textContent = ''; // Скрываем "НГ"
            isAvatarUploaded = true;
        };
        reader.readAsDataURL(file);
    }
});

// Полная очистка при закрытии или отмене модального окна
[closeGroupModalButton, closeGroupNameModalButton, cancelGroupModalButton].forEach(btn => {
    if (btn) btn.addEventListener('click', resetAvatarPreview);
});

openGroupModalButton.addEventListener("click", function() {
    groupModal.removeAttribute("hidden")
})

closeGroupModalButton.addEventListener("click", function() {
    groupModal.setAttribute("hidden", "")
})

closeGroupNameModalButton.addEventListener("click", function() {
    groupModal.setAttribute("hidden", "")
})

cancelGroupModalButton.addEventListener("click", function() {
    groupModal.setAttribute("hidden", "")
})

groupUserCheckboxes.forEach(function(checkbox) {
    checkbox.addEventListener("change", function() {
        const checked = document.querySelectorAll(".group-user-checkbox:checked")
        selectedCount.textContent = checked.length
        nextGroupStepButton.disabled = checked.length < 2

        const hint = document.querySelector("#group-min-hint")
        if (checked.length === 0) {
            hint.textContent = "— оберіть мінімум 2"
            hint.style.color = "#aaa"
        } else if (checked.length === 1) {
            hint.textContent = "— потрібен ще 1"
            hint.style.color = "#e05555"
        } else {
            hint.textContent = "✓"
            hint.style.color = "#4caf50"
        }
        selectedUsersList.innerHTML = ""
        checked.forEach(function(cb) {
            const row = document.createElement("div")
            row.className = "group-user-row"
            row.style.width = "100%"
            row.innerHTML = `
                <div class="group-user-avatar" style="background:#543C52;color:#fff;">${cb.dataset.userName.slice(0, 2).toUpperCase()}</div>
                <span class="group-user-name">${cb.dataset.userName}</span>
                <button type="button" class="group-remove-btn" data-id="${cb.value}">
                    <img src="/static/chat_app/images/Deluser.svg" alt="Видалити">
                </button>
            `
            row.querySelector(".group-remove-btn").addEventListener("click", function() {
                const id = this.dataset.id
                const originalCb = document.querySelector(`.group-user-checkbox[value="${id}"]`)
                if (originalCb) {
                    originalCb.checked = false
                    originalCb.dispatchEvent(new Event("change"))
                }
            })
            selectedUsersList.appendChild(row)
        })
    })
})

nextGroupStepButton.addEventListener("pointerdown", function() {
    if (nextGroupStepButton.disabled) {
        nextGroupStepButton.classList.remove("group-modal-btn--shake")
        void nextGroupStepButton.offsetWidth
        nextGroupStepButton.classList.add("group-modal-btn--shake")
        setTimeout(() => nextGroupStepButton.classList.remove("group-modal-btn--shake"), 400)
    }
})

nextGroupStepButton.addEventListener("click", function() {
    const checked = document.querySelectorAll(".group-user-checkbox:checked")
    if (checked.length < 2) return
    groupStepUsers.setAttribute("hidden", "")
    groupStepName.removeAttribute("hidden")
})

backGroupStepButton.addEventListener("click", function() {
    groupStepName.setAttribute("hidden", "")
    groupStepUsers.removeAttribute("hidden")
})

groupNameInput.addEventListener("input", function() {
    const val = this.value.trim()
    if (!isAvatarUploaded && groupAvatarPreview) {
        groupAvatarPreview.textContent = val.slice(0, 2).toUpperCase() || "НГ"
    }
    const counter = document.querySelector("#group-name-counter-val")
    if (counter) {
        counter.textContent = this.value.length
        counter.parentElement.classList.toggle("warn", this.value.length > 25)
    }
})

createGroupButton.addEventListener("click", async function() {
    const name = groupNameInput.value.trim()
    if (!name) return

    const checked = document.querySelectorAll(".group-user-checkbox:checked")
    const formData = new FormData()
    formData.append("name", name)
    checked.forEach(cb => formData.append("users", cb.value))

    if (groupAvatarInput.files[0]) {
        formData.append("avatar", groupAvatarInput.files[0])
    }

    const response = await fetch("/chat/create_group/", {
        method: "POST",
        headers: { "X-CSRFToken": groupCsrfToken },
        body: formData
    })

    const data = await response.json()
if (!data.success) {
    if (data.error === "min_2_users_required") {
        alert("Оберіть мінімум 2 учасники для створення групи.")
    }
    return
}
    // ИСПРАВЛЕНО: Генерация полноценного элемента списка с аватаркой для мгновенного отображения
    const li = document.createElement("li")
    li.dataset.chatId = data.chat_id
    li.dataset.chatName = data.name
    li.dataset.avatarUrl = data.avatar_url || ""
    
    // Получаем текущее время для отображения плашки времени
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    let avatarHTML = ''
    if (data.avatar_url) {
        avatarHTML = `<img src="${data.avatar_url}" alt="">`
    } else {
        avatarHTML = `${data.name.slice(0, 2).toUpperCase()}`
    }

    li.className = "group-chat-item"
    li.innerHTML = `
        <div class="group-chat-avatar" ${data.avatar_url ? `style="background-image:url('${data.avatar_url}');background-size:cover;background-position:center;"` : ''}>
            ${data.avatar_url ? '' : data.name.slice(0, 2).toUpperCase()}
        </div>
        <div class="group-chat-info">
            <div class="group-chat-top">
                <span class="group-chat-name">${data.name}</span>
                <span class="group-chat-time">${timeStr}</span>
            </div>
            <div class="group-chat-preview">Немає повідомлень</div>
        </div>
    `

    li.addEventListener("click", function() {
        openGroupChat(data.chat_id, data.name, data.avatar_url)
    })
    groupList.appendChild(li)

    groupModal.setAttribute("hidden", "")
    groupNameInput.value = ""
    resetAvatarPreview();
    groupUserCheckboxes.forEach(cb => cb.checked = false)
    selectedCount.textContent = "0"
    groupStepName.setAttribute("hidden", "")
    groupStepUsers.removeAttribute("hidden")
})

document.querySelectorAll("#group-list li").forEach(function(li) {
    li.addEventListener("click", function() {
        openGroupChat(li.dataset.chatId, li.dataset.chatName, li.dataset.avatarUrl)
    })
})

function openGroupChat(chatId, name, avatarUrl) {
    openChatById(chatId, name, avatarUrl, true)
}