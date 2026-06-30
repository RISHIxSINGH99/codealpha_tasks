let currentUser = null;
let profileData = null;

function getProfileUsername() {
  const params = new URLSearchParams(window.location.search);
  return params.get('u') || params.get('username') || '';
}

async function init() {
  currentUser = await checkAuth();
  if (!currentUser) return;

  setupNavbar(currentUser, 'profile');

  const username = getProfileUsername() || currentUser.username;
  if (!username) {
    window.location.href = profileUrl(currentUser.username);
    return;
  }

  await loadProfile(username);
}

async function loadProfile(username) {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
    const data = await res.json();
    if (!res.ok) return showMessage(data.error || 'Profile not found.');

    profileData = data.profile;
    document.title = `@${profileData.username} — ConnectHub`;
    renderProfileHeader();
    renderBioSection();
    await loadProfilePosts(username);
  } catch {
    showMessage('Could not load profile.');
  }
}

function renderProfileHeader() {
  const p = profileData;
  const followBtn = p.isOwnProfile
    ? `<span class="badge profile-badge">Your Profile</span>`
    : p.isFollowing
      ? `<button id="followBtn" class="btn btn-secondary btn-sm" data-action="unfollow">Unfollow</button>`
      : `<button id="followBtn" class="btn btn-primary btn-sm" data-action="follow">Follow</button>`;

  document.getElementById('profileHeader').innerHTML = `
    <div class="profile-banner"></div>
    <div class="profile-info">
      <div class="profile-avatar-wrap">
        ${renderAvatar(p.username, 'lg')}
      </div>
      <div class="profile-details">
        <div class="profile-top-row">
          <div>
            <h1 class="profile-name">@${escapeHtml(p.username)}</h1>
            <p class="profile-bio-text">${escapeHtml(p.bio || 'No bio yet.')}</p>
          </div>
          <div class="profile-actions">${followBtn}</div>
        </div>
        <div class="profile-stats">
          <div class="profile-stat">
            <strong id="statTotalPosts">${p.totalPosts}</strong>
            <span>Posts</span>
          </div>
          <div class="profile-stat">
            <strong id="statFollowers">${p.followersCount}</strong>
            <span>Followers</span>
          </div>
          <div class="profile-stat">
            <strong id="statFollowing">${p.followingCount}</strong>
            <span>Following</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const followBtnEl = document.getElementById('followBtn');
  if (followBtnEl && followBtnEl.dataset.action) {
    followBtnEl.addEventListener('click', handleFollowToggle);
  }
}

function renderBioSection() {
  const section = document.getElementById('bioSection');
  if (!profileData.isOwnProfile) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  const bioInput = document.getElementById('bioInput');
  bioInput.value = profileData.bio || '';
  document.getElementById('bioCharCount').textContent = bioInput.value.length;

  bioInput.addEventListener('input', () => {
    document.getElementById('bioCharCount').textContent = bioInput.value.length;
  });
}

async function loadProfilePosts(username) {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(username)}/posts`);
    const data = await res.json();
    if (!res.ok) return showMessage(data.error);

    document.getElementById('postCountLabel').textContent = data.posts.length;
    renderProfilePosts(data.posts);
  } catch {
    showMessage('Could not load posts.');
  }
}

function renderProfilePosts(posts) {
  const container = document.getElementById('profilePosts');

  if (!posts.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <strong>No posts yet</strong>
        <p>${profileData.isOwnProfile ? 'Share your first post from the feed!' : 'This user hasn\'t shared anything yet.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = posts.map((post) => renderPostCard(post, { currentUsername: currentUser.username })).join('');
  bindPostInteractions(container);
}

async function handleFollowToggle() {
  const btn = document.getElementById('followBtn');
  const action = btn.dataset.action;
  const endpoint = action === 'follow' ? 'follow' : 'unfollow';

  try {
    const res = await fetch(`/api/users/${profileData.id}/${endpoint}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return showMessage(data.error);

    profileData.isFollowing = data.isFollowing;
    profileData.followersCount = data.followersCount;
    document.getElementById('statFollowers').textContent = data.followersCount;

    if (data.isFollowing) {
      btn.textContent = 'Unfollow';
      btn.className = 'btn btn-secondary btn-sm';
      btn.dataset.action = 'unfollow';
    } else {
      btn.textContent = 'Follow';
      btn.className = 'btn btn-primary btn-sm';
      btn.dataset.action = 'follow';
    }

    showMessage(data.message, 'success');
  } catch {
    showMessage('Could not update follow status.');
  }
}

document.getElementById('bioForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const bio = document.getElementById('bioInput').value.trim();

  try {
    const res = await fetch('/api/users/bio', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio }),
    });
    const data = await res.json();
    if (!res.ok) return showMessage(data.error);

    profileData.bio = data.bio;
    document.querySelector('.profile-bio-text').textContent = data.bio || 'No bio yet.';
    showMessage('Bio updated!', 'success');
  } catch {
    showMessage('Could not update bio.');
  }
});

init();
