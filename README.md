# ConnectHub — Mini Social Media Platform

A full-featured social media app built with HTML, CSS, JavaScript, Node.js, and Express. All data is stored in local JSON files.

## Features

- **Sign up / Log in / Log out** — Secure session-based authentication
- **Create & view posts** — Share updates in a social feed
- **Like posts** — Like or unlike any post
- **Comments** — Add and view comments on posts
- **User profiles** — Username, bio, post count, followers & following counts
- **Follow / Unfollow** — Connect with other users
- **Modern UI** — Responsive design with avatars, post cards, and sticky navbar

## Project Structure

```
SocialMediaApp/
├── server.js
├── package.json
├── data/
│   ├── users.json         # Users, bios, followers, following
│   └── posts.json         # Posts, likes, comments
├── routes/
│   ├── auth.js            # Signup, login, logout
│   ├── posts.js           # Posts, likes, comments
│   └── users.js           # Profiles, bio, follow/unfollow
├── middleware/auth.js
├── utils/dataStore.js
└── public/
    ├── feed.html
    ├── profile.html
    ├── login.html
    ├── signup.html
    ├── css/style.css
    └── js/
        ├── utils.js       # Shared UI helpers
        ├── feed.js
        ├── profile.js
        └── auth.js
```

## How to Run

### 1. Install Node.js

Download from [https://nodejs.org](https://nodejs.org) (LTS version).

### 2. Install dependencies

```bash
cd SocialMediaApp
npm install
```

### 3. Start the server

```bash
npm start
```

Open **http://localhost:3000** in your browser.

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/posts` | Get all posts (with comments) |
| POST | `/api/posts` | Create a post |
| POST | `/api/posts/:id/like` | Like/unlike a post |
| GET | `/api/posts/:id/comments` | Get comments on a post |
| POST | `/api/posts/:id/comments` | Add a comment |
| GET | `/api/users/:username` | Get user profile |
| GET | `/api/users/:username/posts` | Get user's posts |
| PUT | `/api/users/bio` | Update your bio |
| POST | `/api/users/:id/follow` | Follow a user |
| POST | `/api/users/:id/unfollow` | Unfollow a user |

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Feed | `/feed.html` | Main timeline with posts & comments |
| Profile | `/profile.html?u=username` | User profile with stats & posts |
| Login | `/login.html` | Log in |
| Sign up | `/signup.html` | Create account |

## License

MIT
