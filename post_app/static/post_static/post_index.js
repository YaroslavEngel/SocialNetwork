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

function addTagClickHandler(label) {
  label.addEventListener('click', () => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    label.classList.toggle('tag-selected', checkbox.checked);
  });
}

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

    const res = await fetch('/post/create/', {
      method: 'POST',
      headers: { 'X-CSRFToken': getCookie('csrftoken') },
      body: formData
    });

    const result = await res.json();

    if (result.message === 'Created') {
      overlay.style.display = 'none';
      postForm.reset();
      selectedFiles = [];
      const oldPreview = document.querySelector('.image-preview-container');
      if (oldPreview) oldPreview.remove();

      const feed = document.getElementById('post-list');
      if (feed && result.post) {
        const card = createPostCard(result.post);
        feed.insertBefore(card, feed.firstChild);
      }
    } else {
      console.error('Помилка:', JSON.stringify(result));
    }
  });
}

function createPostCard(post) {
  const card = document.createElement('div');
  card.className = 'post-card';

  const avatarHTML = post.avatar
    ? `<img src="${post.avatar}" class="post-author-avatar" alt="">`
    : '';

  const tagsHTML = post.tags.length ? `
    <div class="post-card-tags">
      ${post.tags.map(tag => `<span class="post-card-tag">#${tag}</span>`).join('')}
    </div>` : '';

  const linksHTML = post.links.length ? `
    <div class="post-card-links">
      ${post.links.map(url => `<a href="${url}" class="post-card-link" target="_blank">${url}</a>`).join('')}
    </div>` : '';

  const imagesHTML = post.images.length ? `
    <div class="post-card-images">
      ${post.images.map(url => `<img src="${url}" class="post-card-image" alt="">`).join('')}
    </div>` : '';

  card.innerHTML = `
    <div class="post-card-header">
      <div class="post-card-author">
        ${avatarHTML}
        <span class="post-author-name">${post.author}</span>
      </div>
    </div>
    <div class="post-card-body">
      <h2 class="post-card-title">${post.title}</h2>
      <p class="post-card-content">${post.content}</p>
      ${tagsHTML}
      ${linksHTML}
      ${imagesHTML}
    </div>
    <div class="post-card-footer">
      <span class="post-card-stat">
        <img src="/static/images/Component 5 (2).svg" alt="">
        0 Вподобань
      </span>
      <span class="post-card-stat">
        <img src="/static/images/Component 5 (3).svg" alt="">
        0 Вподобань
      </span>
      <span class="post-card-stat">
        <img src="/static/images/eye.svg" alt="">
        0 Переглядів
      </span>
    </div>
  `;

  return card;
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

const imageBtn = document.querySelector('.image-btn');
const imageInput = document.querySelector('#id_image');
let selectedFiles = [];

if (imageBtn && imageInput) {
  imageBtn.addEventListener('click', () => {
    imageInput.click();
  });

  imageInput.addEventListener('change', () => {
    Array.from(imageInput.files).forEach(file => {
      selectedFiles.push(file);
    });
    renderPreviews();
    syncFilesToInput();
  });
}

function renderPreviews() {
  const oldPreview = document.querySelector('.image-preview-container');
  if (oldPreview) oldPreview.remove();

  if (!selectedFiles.length) return;

  const previewContainer = document.createElement('div');
  previewContainer.className = 'image-preview-container';

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'image-preview-wrapper';

      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'image-preview';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'image-preview-remove';
      removeBtn.innerHTML = '×';
      removeBtn.addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        renderPreviews();
        syncFilesToInput();
      });

      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);
      previewContainer.appendChild(wrapper);
    };
    reader.readAsDataURL(file);
  });

  const footer = document.querySelector('.post-modal-footer');
  footer.parentNode.insertBefore(previewContainer, footer);
}

function syncFilesToInput() {
  const dt = new DataTransfer();
  selectedFiles.forEach(file => dt.items.add(file));
  imageInput.files = dt.files;
}

// Infinite scroll
const postList = document.getElementById("post-list");
const entryDiv = document.getElementById("entry-div");
let currentPage = 1;

const observer = new IntersectionObserver(async (entry) => {
  if (entry[0].isIntersecting) {
    currentPage++;
    const url = entryDiv.dataset.url;
    const result = await fetch(`${url}?page=${currentPage}`, {
      method: "GET",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const data = await result.json();
    if (data.success) {
      entryDiv.insertAdjacentHTML("beforebegin", data.html);
    } else {
      observer.disconnect();
    }
  }
});

if (entryDiv) {
  observer.observe(entryDiv);
}