const editGroupModal = document.querySelector("#edit-group-modal")
const editGroupStepMain = document.querySelector("#edit-group-step-main")
const editGroupStepAdd = document.querySelector("#edit-group-step-add")
const editGroupNameInput = document.querySelector("#edit-group-name")
const editGroupAvatarInput = document.querySelector("#edit-group-avatar-input")
const editGroupAvatarPreview = document.querySelector("#edit-group-avatar-preview")
const editMembersList = document.querySelector("#edit-members-list")
const editAddCount = document.querySelector("#edit-add-count")

let editChatId = null
let editRemovedUsers = []
let editAddedUsers = []
let editAvatarUploaded = false

document.querySelector("#edit-btn-add-avatar").addEventListener("click", () => editGroupAvatarInput.click())
document.querySelector("#edit-btn-choose-avatar").addEventListener("click", () => editGroupAvatarInput.click())

editGroupAvatarInput.addEventListener("change", function() {
    const file = this.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = function(e) {
        editGroupAvatarPreview.style.backgroundImage = `url('${e.target.result}')`
        editGroupAvatarPreview.style.backgroundSize = "cover"
        editGroupAvatarPreview.style.backgroundPosition = "center"
        editGroupAvatarPreview.textContent = ""
        editAvatarUploaded = true
    }
    reader.readAsDataURL(file)
})

document.querySelector("#close-edit-group-modal").addEventListener("click", closeEditModal)
document.querySelector("#cancel-edit-group-modal").addEventListener("click", closeEditModal)
document.querySelector("#close-edit-add-step").addEventListener("click", closeEditModal)

document.querySelector("#edit-add-member-btn").addEventListener("click", () => {
    editGroupStepMain.setAttribute("hidden", "")
    editGroupStepAdd.removeAttribute("hidden")
    updateAddCheckboxes()
})

document.querySelector("#back-edit-add-step").addEventListener("click", () => {
    editGroupStepAdd.setAttribute("hidden", "")
    editGroupStepMain.removeAttribute("hidden")
})

document.querySelector("#confirm-edit-add").addEventListener("click", () => {
    const checked = document.querySelectorAll(".edit-add-checkbox:checked")
    editAddedUsers = Array.from(checked).map(cb => ({ id: cb.value, name: cb.dataset.userName }))
    editAddCount.textContent = editAddedUsers.length
    renderEditMembers()
    editGroupStepAdd.setAttribute("hidden", "")
    editGroupStepMain.removeAttribute("hidden")
})

document.querySelectorAll(".edit-add-checkbox").forEach(cb => {
    cb.addEventListener("change", function() {
        const checked = document.querySelectorAll(".edit-add-checkbox:checked")
        editAddCount.textContent = checked.length
    })
})

document.querySelector("#edit-add-search").addEventListener("input", function() {
    const val = this.value.toLowerCase()
    document.querySelectorAll("#edit-add-users-list .group-user-row").forEach(row => {
        const name = row.querySelector(".group-user-name").textContent.toLowerCase()
        row.classList.toggle("gm-hidden", !name.includes(val))
    })
})

document.querySelector("#save-edit-group").addEventListener("click", async function() {
    const name = editGroupNameInput.value.trim()
    if (!name) return

    const formData = new FormData()
    formData.append("name", name)
    editRemovedUsers.forEach(id => formData.append("remove_users", id))
    editAddedUsers.forEach(u => formData.append("add_users", u.id))
    if (editGroupAvatarInput.files[0]) formData.append("avatar", editGroupAvatarInput.files[0])

    const response = await fetch(`/chat/${editChatId}/edit_group/`, {
        method: "POST",
        headers: { "X-CSRFToken": window.csrfToken },
        body: formData
    })
    const data = await response.json()
    if (!data.success) return

    const groupItem = document.querySelector(`#group-list [data-chat-id="${editChatId}"]`)
    if (groupItem) {
        const nameEl = groupItem.querySelector(".group-chat-name")
        const avatarEl = groupItem.querySelector(".group-chat-avatar")
        if (nameEl) nameEl.textContent = data.name
        if (avatarEl && data.avatar_url) {
            avatarEl.style.backgroundImage = `url('${data.avatar_url}')`
            avatarEl.style.backgroundSize = "cover"
            avatarEl.style.backgroundPosition = "center"
            avatarEl.textContent = ""
        }
    }

    const activeTitle = document.querySelector(".chat-active-title")
    if (activeTitle) activeTitle.textContent = data.name

    closeEditModal()
})

function closeEditModal() {
    editGroupModal.setAttribute("hidden", "")
    editGroupStepAdd.setAttribute("hidden", "")
    editGroupStepMain.removeAttribute("hidden")
    editRemovedUsers = []
    editAddedUsers = []
    editAvatarUploaded = false
    editGroupAvatarPreview.style.backgroundImage = "none"
    editGroupAvatarPreview.textContent = "НГ"
    editGroupAvatarInput.value = ""
}

function renderEditMembers() {
    editMembersList.innerHTML = ""
    currentMembers.forEach(member => {
        if (editRemovedUsers.includes(String(member.id))) return
        const row = document.createElement("div")
        row.className = "group-user-row"
        row.innerHTML = `
            <div class="group-user-avatar" style="background:#D4CAEE;color:#543C52;">${member.name.slice(0, 2).toUpperCase()}</div>
            <span class="group-user-name">${member.name}</span>
            <button type="button" class="group-remove-btn" data-id="${member.id}">
                <img src="/static/chat_app/images/Deluser.svg" alt="Видалити">
            </button>
        `
        row.querySelector(".group-remove-btn").addEventListener("click", function() {
            editRemovedUsers.push(this.dataset.id)
            renderEditMembers()
        })
        editMembersList.appendChild(row)
    })

    editAddedUsers.forEach(user => {
        const row = document.createElement("div")
        row.className = "group-user-row"
        row.innerHTML = `
            <div class="group-user-avatar" style="background:#543C52;color:#fff;">${user.name.slice(0, 2).toUpperCase()}</div>
            <span class="group-user-name">${user.name}</span>
            <button type="button" class="group-remove-btn" data-id="${user.id}" data-added="true">
                <img src="/static/chat_app/images/Deluser.svg" alt="Видалити">
            </button>
        `
        row.querySelector(".group-remove-btn").addEventListener("click", function() {
            editAddedUsers = editAddedUsers.filter(u => u.id !== this.dataset.id)
            renderEditMembers()
        })
        editMembersList.appendChild(row)
    })
}

function updateAddCheckboxes() {
    const currentIds = currentMembers.map(m => String(m.id))
    document.querySelectorAll(".edit-add-checkbox").forEach(cb => {
        const row = cb.closest(".group-user-row")
        if (currentIds.includes(cb.value) && !editRemovedUsers.includes(cb.value)) {
            row.classList.add("gm-hidden")
        } else {
            row.classList.remove("gm-hidden")
        }
    })
    // ← приховуємо порожні літери
    document.querySelectorAll("#edit-add-users-list .group-letter-label").forEach(label => {
        let next = label.nextElementSibling
        let hasVisible = false
        while (next && !next.classList.contains("group-letter-label")) {
            if (!next.classList.contains("gm-hidden")) hasVisible = true
            next = next.nextElementSibling
        }
        label.style.display = hasVisible ? "" : "none"
    })
}

let currentMembers = []

window.openEditGroupModal = async function(chatId) {
    editChatId = chatId
    editRemovedUsers = []
    editAddedUsers = []

    const data = await fetch(`/chat/${chatId}/edit_group/`).then(r => r.json())
    if (!data.success) return

    currentMembers = data.members
    editGroupNameInput.value = data.name

    if (data.avatar_url) {
        editGroupAvatarPreview.style.backgroundImage = `url('${data.avatar_url}')`
        editGroupAvatarPreview.style.backgroundSize = "cover"
        editGroupAvatarPreview.style.backgroundPosition = "center"
        editGroupAvatarPreview.textContent = ""
    } else {
        editGroupAvatarPreview.style.backgroundImage = "none"
        editGroupAvatarPreview.textContent = data.name.slice(0, 2).toUpperCase()
    }

    renderEditMembers()
    editGroupModal.removeAttribute("hidden")
}