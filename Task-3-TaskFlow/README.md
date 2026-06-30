# TaskFlow

A full-stack project & task management app (MERN) with JWT auth, role-based
project permissions, and a drag-and-drop Kanban board.

## Stack
- **Client:** React + Vite, Tailwind CSS, React Router, Axios, Socket.io-client
- **Server:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Socket.io

## Project structure
```
TaskFlow/
├── client/   # React frontend
└── server/   # Express API
```

## Getting started

### 1. Backend
```bash
cd server
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm install
npm run dev             # nodemon, http://localhost:5000
```

### 2. Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000`, and the
client also reads `VITE_API_URL` directly via the Axios instance — set
both `.env` files to match your backend's port if you change it.

## Auth flow
- Register/login return a JWT, stored in `localStorage` (`taskflow_token`).
- Axios attaches it to every request via an interceptor.
- A 401 response anywhere automatically clears the session and redirects to `/login`.

## Data model
- **User** — name, email (unique), hashed password, avatar, global role
- **Project** — owner + members (each with a per-project role: owner/admin/member)
- **Task** — belongs to a project; status drives Kanban columns (todo / in-progress / review / completed)
- **Comment** — belongs to a task

## Role-based authorization
- `protect` middleware verifies the JWT and loads `req.user`.
- `requireProjectRole(...roles)` checks the user's role *within a specific project*
  (used for update/delete project, invite/remove members).
- `requireGlobalRole(...roles)` is available for app-wide admin-only routes.

## API overview
| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/profile | Get current user |
| PUT | /api/auth/profile | Update current user |
| POST | /api/projects | Create project |
| GET | /api/projects | List my projects |
| GET | /api/projects/:id | Get project |
| PUT | /api/projects/:id | Update project (owner/admin) |
| DELETE | /api/projects/:id | Delete project (owner) |
| POST | /api/projects/:id/invite | Invite member by email (owner/admin) |
| DELETE | /api/projects/:id/members/:memberId | Remove member (owner/admin) |
| POST | /api/tasks | Create task |
| GET | /api/tasks/project/:projectId | List tasks for Kanban board |
| GET | /api/tasks/:id | Task detail + comments |
| PUT | /api/tasks/:id | Update task fields |
| PATCH | /api/tasks/:id/status | Move task between columns (drag-and-drop) |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/comments | Add comment |
| GET | /api/comments/task/:taskId | List comments |
| DELETE | /api/comments/:id | Delete own comment |
| GET | /api/dashboard | Aggregated stats |
| GET | /api/search?q= | Search projects + tasks |

## Real-time (Socket.io)
The server attaches Socket.io to the same HTTP server (`server/src/sockets/socket.js`).
Rooms are namespaced per project (`project:<id>`). The structure is in place;
wire `io.to(...).emit(...)` calls into `taskController.js` (e.g. after
`updateTaskStatus`) to broadcast live board updates, and connect with
`socket.io-client` from the frontend (already a dependency) when you're ready
to enable it.

## Notes on design decisions
- Soft-delete (`isArchived`) on Project rather than hard delete, to keep room
  for an "archive" view later without losing data.
- Task status updates have a dedicated lightweight `PATCH /status` endpoint
  separate from the general `PUT` update, since drag-and-drop fires frequently
  and shouldn't pay the cost of re-validating the whole task payload.
- Password field uses `select: false` in the schema so it's never accidentally
  leaked through normal queries; it's explicitly re-selected only at login.
