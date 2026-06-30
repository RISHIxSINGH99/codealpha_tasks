function showMessage(text, type = 'error') {
  const messageEl = document.getElementById('message');
  if (!messageEl) return;

  messageEl.textContent = text;
  messageEl.className = `message show ${type}`;

  setTimeout(() => {
    messageEl.className = 'message';
  }, 4000);
}

async function handleSignup(event) {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || 'Signup failed.');
      return;
    }

    showMessage(data.message, 'success');
    setTimeout(() => {
      window.location.href = '/feed.html';
    }, 800);
  } catch (error) {
    showMessage('Could not connect to the server. Is it running?');
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || 'Login failed.');
      return;
    }

    showMessage(data.message, 'success');
    setTimeout(() => {
      window.location.href = '/feed.html';
    }, 800);
  } catch (error) {
    showMessage('Could not connect to the server. Is it running?');
  }
}
