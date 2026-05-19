const friendsHome = document.querySelector("#friends-home");
const friendsSection = document.querySelector("#friends-section");
const friendsTitle = document.querySelector("#friends-section-title");
const friendsSectionList = document.querySelector("#friends-section-list");
const friendsLoad = document.querySelector("#friends-load-sentinel");
const friendsBackHome = document.querySelector("#friends-back-home");

const sectionTitles = {
    requests: "Запити",
    recommendations: "Рекомендації",
    friends: "Друзі",
};

let currentSection = "";
let pageNumber = 1;
let hasNext = false;
let isLoading = false;

friendsSection.style.display = "none";
friendsHome.style.display = "block";

// Обновляет превью одной секции на главной
async function refreshHomeSection(section) {
    const response = await fetch(`/friends/section/${section}/?page=1`, {
        headers: {"X-Requested-With": "XMLHttpRequest"}
    });
    const data = await response.json();
    const grid = document.querySelector(`[data-home-section="${section}"]`);
    if (grid) {
        grid.innerHTML = data.html;
    }
}

async function loadSectionPage(section, page) {
    isLoading = true;
    const response = await fetch(`/friends/section/${section}/?page=${page}`, {
        headers: {"X-Requested-With": "XMLHttpRequest"}
    });
    const data = await response.json();
    friendsSectionList.insertAdjacentHTML("beforeend", data.html);
    hasNext = data.has_next;
    isLoading = false;
}

async function friendAction(action, userId, card) {
    const response = await fetch(`/friends/action/${action}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({user_id: userId})
    });
    const data = await response.json();

    if (data.remove) {
        card.remove();
    }
    if (data.label) {
        card.querySelector('[data-action]').textContent = data.label;
    }

    // Обновляем нужные секции в зависимости от действия
    if (action === 'accept') {
        // Принял запрос — обновить Запити и Друзі
        await refreshHomeSection('requests');
        await refreshHomeSection('friends');
    } else if (action === 'reject') {
        // Отклонил запрос — обновить Запити и Рекомендації
        await refreshHomeSection('requests');
        await refreshHomeSection('recommendations');
    } else if (action === 'request') {
        // Отправил запрос из рекомендаций — обновить Рекомендації
        await refreshHomeSection('recommendations');
    } else if (action === 'delete') {
        // Удалил друга — обновить Друзі и Рекомендації
        await refreshHomeSection('friends');
        await refreshHomeSection('recommendations');
    } else if (action === 'hide') {
        // Скрыл из рекомендаций — обновить Рекомендації
        await refreshHomeSection('recommendations');
    }

    // Если мы в секции — обновляем и её тоже
    if (currentSection) {
        friendsSectionList.innerHTML = "";
        pageNumber = 1;
        await loadSectionPage(currentSection, pageNumber);
    }
}

// Кнопки nav — открывают секцию
document.querySelectorAll("[data-section-link]").forEach(btn => {
    btn.addEventListener("click", () => {
        const section = btn.dataset.sectionLink;
        currentSection = section;
        pageNumber = 1;
        friendsSectionList.innerHTML = "";
        friendsHome.style.display = "none";
        friendsSection.style.display = "block";
        friendsTitle.textContent = sectionTitles[section];
        loadSectionPage(section, pageNumber);
    });
});

// Кнопка "Повернутись на головну"
friendsBackHome.addEventListener("click", () => {
    friendsSection.style.display = "none";
    friendsHome.style.display = "block";
    currentSection = "";
    pageNumber = 1;
});

// Кнопки действий на карточках
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('[data-person-id]');
    const userId = card.dataset.personId;
    const action = btn.dataset.action;
    friendAction(action, userId, card);
});

// Подгрузка при скролле
const observer = new IntersectionObserver(async (entries) => {
    if (entries[0].isIntersecting && hasNext && !isLoading && currentSection) {
        pageNumber++;
        loadSectionPage(currentSection, pageNumber);
    }
});
observer.observe(friendsLoad);

async function pollAll() {
    if (!currentSection) {
        await refreshHomeSection('requests');
        await refreshHomeSection('recommendations');
        await refreshHomeSection('friends');
    }
}

setInterval(pollAll, 5000);

document.querySelector('#friends-nav-home').addEventListener('click', () => {
    friendsSection.style.display = "none";
    friendsHome.style.display = "block";
    currentSection = "";
    pageNumber = 1;
});