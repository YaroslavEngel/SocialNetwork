document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('first-login-modal');
    if (modal) {
    document.getElementById('fl-save-btn').addEventListener('click', async () => {
        const pseudonym = document.getElementById('fl-pseudonym').value.trim();
        const username = document.getElementById('fl-username').value.trim();
        const errorEl = document.getElementById('fl-error');


        const res = await fetch('/user/first-login/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `username=${encodeURIComponent(username)}&pseudonym=${encodeURIComponent(pseudonym)}`
        });

        const result = await res.json();

        if (result.message === 'Saved') {
        modal.style.display = 'none';
        } else {
        errorEl.textContent = result.error || 'Помилка збереження.';
        errorEl.style.display = 'block';
        }
    });
    }

    function getCookie(name) {
    return document.cookie.split(';').map(c => c.trim())
        .find(c => c.startsWith(name + '='))?.split('=')[1] || '';
    }
    const closeBtn = document.getElementById('fl-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('first-login-modal').style.display = 'none';
    });
    }
});