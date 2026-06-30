let currentUser = null;

async function init() {
  currentUser = await checkAuth();
  if (!currentUser) return;

  setupNavbar(currentUser, 'feed');
  renderSidebar();
  await loadPosts();
}

function renderSidebar() {
  document.getElementById('sidebarUser').innerHTML = `
    ${renderAvatar(currentUser.username, 'lg')}
    <div>
      <a href="${profileUrl(currentUser.username)}" class="sidebar-name">@${escapeHtml(currentUser.username)}</a>
      <p class="sidebar-bio">${escapeHtml(currentUser.bio || 'No bio yet')}</p>
    </div>
  `;
  document.getElementById('composeAvatar').innerHTML = renderAvatar(currentUser.username);

  document.getElementById('statPosts').textContent = '—';
  document.getElementById('statFollowers').textContent = currentUser.followersCount ?? 0;
  document.getElementById('statFollowing').textContent = currentUser.followingCount ?? 0;

  fetch(`/api/users/${currentUser.username}`)
    .then((r) => r.json())
    .then((data) => {
      if (data.profile) {
        document.getElementById('statPosts').textContent = data.profile.totalPosts;
        document.getElementById('statFollowers').textContent = data.profile.followersCount;
        document.getElementById('statFollowing').textContent = data.profile.followingCount;
      }
    })
    .catch(() => {});
}

async function loadPosts() {
  try {
    const response = await fetch('/api/posts');
    if (!response.ok) {
      if (response.status === 401) window.location.href = '/login.html';
      return;
    }
    const data = await response.json();
    renderPosts(data.posts);
  } catch {
    showMessage('Could not load posts.');
  }
}

function renderPosts(posts) {
  const postsList = document.getElementById('postsList');

  if (!posts.length) {
    postsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <strong>No posts yet</strong>
        <p>Be the first to share something with the community!</p>
      </div>
    `;
    return;
  }

  postsList.innerHTML = posts.map((post) => renderPostCard(post, { currentUsername: currentUser.username })).join('');
  bindPostInteractions(postsList);
}

async function createPost(event) {
  event.preventDefault();
  const contentInput = document.getElementById('postContent');
  const content = contentInput.value.trim();
  if (!content) return;

  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const data = await response.json();
    if (!response.ok) return showMessage(data.error || 'Could not create post.');

    contentInput.value = '';
    showMessage('Post published!', 'success');
    await loadPosts();
    renderSidebar();
  } catch {
    showMessage('Could not create post.');
  }
}

document.getElementById('createPostForm').addEventListener('submit', createPost);
init();
