function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getInitial(username) {
  return username ? username.charAt(0).toUpperCase() : '?';
}

function avatarColor(username) {
  const colors = [
    ['#3b82f6', '#8b5cf6'],
    ['#ec4899', '#f43f5e'],
    ['#10b981', '#06b6d4'],
    ['#f59e0b', '#ef4444'],
    ['#6366f1', '#a855f7'],
    ['#14b8a6', '#3b82f6'],
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const pair = colors[Math.abs(hash) % colors.length];
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
}

function renderAvatar(username, size = 'md') {
  const sizeClass = size === 'lg' ? 'avatar-lg' : size === 'sm' ? 'avatar-sm' : '';
  return `<div class="avatar ${sizeClass}" style="background:${avatarColor(username)}">${getInitial(username)}</div>`;
}

function profileUrl(username) {
  return `/profile.html?u=${encodeURIComponent(username)}`;
}

function showMessage(text, type = 'error', elementId = 'message') {
  const messageEl = document.getElementById(elementId);
  if (!messageEl) return;

  messageEl.textContent = text;
  messageEl.className = `message show ${type}`;

  setTimeout(() => {
    messageEl.className = 'message';
  }, 4000);
}

async function checkAuth() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      window.location.href = '/login.html';
      return null;
    }
    const data = await response.json();
    return data.user;
  } catch {
    window.location.href = '/login.html';
    return null;
  }
}

function setupNavbar(user, activePage = 'feed') {
  const nav = document.getElementById('navbar');
  if (!nav || !user) return;

  nav.innerHTML = `
    <div class="navbar-inner">
      <a href="/feed.html" class="navbar-brand">
        <span class="brand-icon">◉</span> ConnectHub
      </a>
      <div class="navbar-links">
        <a href="/feed.html" class="nav-link ${activePage === 'feed' ? 'active' : ''}">
          <span class="nav-icon">🏠</span><span class="nav-label">Feed</span>
        </a>
        <a href="${profileUrl(user.username)}" class="nav-link ${activePage === 'profile' ? 'active' : ''}">
          <span class="nav-icon">👤</span><span class="nav-label">Profile</span>
        </a>
      </div>
      <div class="navbar-user">
        ${renderAvatar(user.username, 'sm')}
        <span class="navbar-username">@${escapeHtml(user.username)}</span>
        <button id="logoutBtn" class="btn btn-ghost btn-sm">Log Out</button>
      </div>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
}

function renderPostCard(post, options = {}) {
  const { showComments = true, compact = false, currentUsername = '' } = options;
  const commentAvatar = currentUsername
    ? renderAvatar(currentUsername, 'sm')
    : `<div class="avatar avatar-sm" style="background:var(--surface-hover)">+</div>`;
  const commentsHtml = showComments
    ? `
    <div class="comments-section" data-post-id="${post.id}">
      <div class="comments-list" id="comments-${post.id}">
        ${renderComments(post.comments || [])}
      </div>
      <form class="comment-form" data-comment-form="${post.id}">
        ${commentAvatar}
        <input type="text" placeholder="Write a comment..." maxlength="300" required aria-label="Comment">
        <button type="submit" class="btn btn-primary btn-sm">Post</button>
      </form>
    </div>`
    : '';

  return `
    <article class="post-card ${compact ? 'post-card-compact' : ''}" data-id="${post.id}">
      <div class="post-header">
        <a href="${profileUrl(post.username)}" class="avatar-link">
          ${renderAvatar(post.username)}
        </a>
        <div class="post-meta">
          <a href="${profileUrl(post.username)}" class="post-username">@${escapeHtml(post.username)}</a>
          <div class="post-time">${formatTime(post.createdAt)}</div>
        </div>
      </div>
      <p class="post-content">${escapeHtml(post.content)}</p>
      <div class="post-actions">
        <button class="action-btn btn-like ${post.likedByMe ? 'liked' : ''}" data-like-id="${post.id}" aria-label="Like">
          <span class="action-icon">${post.likedByMe ? '❤️' : '🤍'}</span>
          <span class="like-count">${post.likeCount}</span>
        </button>
        <button class="action-btn btn-comment-toggle" data-toggle-comments="${post.id}" aria-label="Comments">
          <span class="action-icon">💬</span>
          <span class="comment-count">${post.commentCount || (post.comments || []).length}</span>
        </button>
      </div>
      ${commentsHtml}
    </article>
  `;
}

function renderComments(comments) {
  if (!comments.length) {
    return '<p class="comments-empty">No comments yet. Be the first!</p>';
  }

  return comments
    .map(
      (c) => `
    <div class="comment">
      <a href="${profileUrl(c.username)}" class="avatar-link">
        ${renderAvatar(c.username, 'sm')}
      </a>
      <div class="comment-body">
        <a href="${profileUrl(c.username)}" class="comment-username">@${escapeHtml(c.username)}</a>
        <span class="comment-time">${formatTime(c.createdAt)}</span>
        <p class="comment-text">${escapeHtml(c.content)}</p>
      </div>
    </div>
  `
    )
    .join('');
}

function bindPostInteractions(container, onUpdate) {
  container.querySelectorAll('[data-like-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const postId = btn.dataset.likeId;
      try {
        const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) return showMessage(data.error);
        btn.classList.toggle('liked', data.likedByMe);
        btn.querySelector('.action-icon').textContent = data.likedByMe ? '❤️' : '🤍';
        btn.querySelector('.like-count').textContent = data.likeCount;
      } catch {
        showMessage('Could not update like.');
      }
    });
  });

  container.querySelectorAll('[data-toggle-comments]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const postId = btn.dataset.toggleComments;
      const section = container.querySelector(`.comments-section[data-post-id="${postId}"]`);
      if (section) section.classList.toggle('open');
    });
  });

  container.querySelectorAll('[data-comment-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const postId = form.dataset.commentForm;
      const input = form.querySelector('input');
      const content = input.value.trim();
      if (!content) return;

      try {
        const res = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        const data = await res.json();
        if (!res.ok) return showMessage(data.error);

        input.value = '';
        const list = container.querySelector(`#comments-${postId}`);
        const section = container.querySelector(`.comments-section[data-post-id="${postId}"]`);
        if (section) section.classList.add('open');

        const res2 = await fetch(`/api/posts/${postId}/comments`);
        const data2 = await res2.json();
        if (list) list.innerHTML = renderComments(data2.comments);

        const countEl = container.querySelector(
          `[data-toggle-comments="${postId}"] .comment-count`
        );
        if (countEl) countEl.textContent = data.commentCount;

        if (onUpdate) onUpdate();
      } catch {
        showMessage('Could not add comment.');
      }
    });
  });

  container.querySelectorAll('.comments-section').forEach((section) => {
    section.classList.add('open');
  });
}
