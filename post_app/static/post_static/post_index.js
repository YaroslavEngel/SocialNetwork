const openBtn = document.querySelector('.open-post-modal-btn');
const closeBtn = document.querySelector('.close-post-modal');
const overlay = document.querySelector('.modal-overlay');

const addTagBtn = document.querySelector('.add-tag-btn');
const tagOverlay = document.querySelector('.tag-modal-overlay');
const closeTagBtn = document.querySelector('.close-tag-modal');
const tagCancelBtn = document.querySelector('.tag-cancel-btn');
const tagSaveBtn = document.querySelector('.tag-save-btn');
const newTagInput = document.getElementById('new-tag-input');
const tagsContainer = document.querySelector('.tags-container');

const textarea = document.getElementById('id_content');
const scrollbar = document.querySelector('.custom-scrollbar');
const container = document.querySelector('.textarea-container');

if (openBtn) {
  openBtn.addEventListener('click', () => {
    overlay.style.display = 'flex';
  });
}

if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
  });
}

// if (overlay) {
//   overlay.addEventListener('click', (e) => {
//     if (e.target === overlay) overlay.style.display = 'none';
//   });
// }

if (addTagBtn) {
  addTagBtn.addEventListener('click', () => {
    tagOverlay.style.display = 'flex';
  });
}

const closeTagModal = () => {
  tagOverlay.style.display = 'none';
  newTagInput.value = '';
};

if (closeTagBtn) closeTagBtn.addEventListener('click', closeTagModal);
if (tagCancelBtn) tagCancelBtn.addEventListener('click', closeTagModal);

if (tagOverlay) {
  tagOverlay.addEventListener('click', (e) => {
    if (e.target === tagOverlay) closeTagModal();
  });
}

// Обработчик клика для тега
function addTagClickHandler(label) {
  label.addEventListener('click', () => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    label.classList.toggle('tag-selected', checkbox.checked);
  });
}

// Добавить обработчик для уже существующих тегов (из Django)
document.querySelectorAll('.tag-label').forEach(label => {
  addTagClickHandler(label);
});

if (tagSaveBtn) {
  tagSaveBtn.addEventListener('click', async () => {
    const tagName = newTagInput.value.trim().replace(/^#/, '');
    if (!tagName) return;

    const res = await fetch('/post/create-tag/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: tagName })
    });

    const result = await res.json();
    if (result.id) {
      const label = document.createElement('label');
      label.className = 'tag-label tag-selected';
      label.innerHTML = `
        <input type="checkbox" name="tags" value="${result.id}" checked>
        <span class="tag">#${result.name}</span>`;

      addTagClickHandler(label);
      tagsContainer.insertBefore(label, addTagBtn);
      closeTagModal();
    }
  });
}


const postForm = document.querySelector('.post-form');
if (postForm) {
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(postForm);

    document.querySelectorAll('input[name="links"]').forEach(input => {
      if (input.value.trim()) formData.append('links', input.value.trim());
    });

    const res = await fetch('/post/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
      body: formData
    });

    const result = await res.json();

    if (result.message === 'Created') {
      document.querySelector('.modal-overlay').style.display = 'none';
      postForm.reset();
      window.location.href = '/';
    } else {
      console.error('Помилка:', result.error);
    }
  });
}

function getCookie(name) {
  return document.cookie.split(';').map(c => c.trim())
    .find(c => c.startsWith(name + '='))?.split('=')[1] || '';
}
if (textarea && scrollbar) {
  textarea.addEventListener('scroll', () => {
    const ratio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
    const maxTop = container.clientHeight - scrollbar.clientHeight;
    scrollbar.style.top = (ratio * maxTop) + 'px';
  });
}
