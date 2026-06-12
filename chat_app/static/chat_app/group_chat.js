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
        nextGroupStepButton.disabled = checked.length === 0
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

nextGroupStepButton.addEventListener("click", function() {
    const checked = document.querySelectorAll(".group-user-checkbox:checked")
    if (checked.length === 0) return
    groupStepUsers.setAttribute("hidden", "")
    groupStepName.removeAttribute("hidden")
})

backGroupStepButton.addEventListener("click", function() {
    groupStepName.setAttribute("hidden", "")
    groupStepUsers.removeAttribute("hidden")
})

document.querySelector("#group-name").addEventListener("input", function() {
    const val = this.value.trim()
    const preview = document.querySelector("#group-avatar-preview")
    if (preview) preview.textContent = val.slice(0, 2).toUpperCase() || "НГ"
})

createGroupButton.addEventListener("click", async function() {
    const name = groupNameInput.value.trim()
    if (!name) return

    const checked = document.querySelectorAll(".group-user-checkbox:checked")
    const formData = new FormData()
    formData.append("name", name)
    checked.forEach(cb => formData.append("users", cb.value))

    const response = await fetch("/chat/create_group/", {
        method: "POST",
        headers: { "X-CSRFToken": groupCsrfToken },
        body: formData
    })

    const data = await response.json()
    if (!data.success) return

    const li = document.createElement("li")
    li.dataset.chatId = data.chat_id
    li.dataset.chatName = data.name
    li.textContent = data.name
    li.addEventListener("click", function() {
        openGroupChat(data.chat_id, data.name)
    })
    groupList.appendChild(li)

    groupModal.setAttribute("hidden", "")
    groupNameInput.value = ""
    groupUserCheckboxes.forEach(cb => cb.checked = false)
    selectedCount.textContent = "0"
    groupStepName.setAttribute("hidden", "")
    groupStepUsers.removeAttribute("hidden")
})

document.querySelectorAll("#group-list li").forEach(function(li) {
    li.addEventListener("click", function() {
        openGroupChat(li.dataset.chatId, li.dataset.chatName)
    })
})

function openGroupChat(chatId, name) {
    const chatTitle = document.querySelector("#chat-title")
    if (chatTitle) chatTitle.textContent = name
    connectWebSocket(chatId)
}