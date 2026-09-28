# CyberHead Academy

**Learn Cybersecurity. Build. Break. Defend.**

A production-style cybersecurity education platform (React + FastAPI + MongoDB) that doubles as a **controlled security-testing lab** for demonstrating how a Web Application Firewall (SafeLine WAF) inspects and handles suspicious traffic.

> This application is **secure by default**. It contains **no intentionally exploitable vulnerabilities**. All "Security Lab" endpoints safely classify and log input for demonstration — they never execute user input as code or SQL.

---

## 1. Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 19, React Router, Tailwind CSS, shadcn/ui, Recharts, Framer Motion |
| Backend   | FastAPI (Python), Motor (async MongoDB) |
| Database  | MongoDB                             |
| Auth      | JWT (HS256) + bcrypt password hashing |

## 2. Folder Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI app: auth, courses, security-lab, admin, logging
│   ├── seed_data.py       # Courses, instructors, testimonials, FAQs
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/          # Home, Courses, CourseDetails, Search, Login, Register,
│   │   │                   # Dashboard, Profile, Contact, SecurityLab,
│   │   │                   # SecurityLabDashboard, Admin, ApiDocs, NotFound
│   │   ├── components/      # Navbar, Footer, CourseCard, ProtectedRoute, Layout, Logo
│   │   ├── context/AuthContext.jsx
│   │   └── lib/api.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env
├── docker-compose.yml
├── .env.example
└── README.md
```

## 3. Environment Variables

See `.env.example`. Required:

- `MONGO_URL`, `DB_NAME` — MongoDB connection
- `JWT_SECRET` — long random secret (`openssl rand -hex 32`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — first-run admin seed
- `CORS_ORIGINS` — allowed origin(s) for the frontend
- `REACT_APP_BACKEND_URL` — public base URL the frontend calls

**Never hardcode secrets.** All secrets come from environment variables.

## 4. Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend
yarn install
yarn start
```

The backend seeds courses, an admin, and a demo student **automatically on startup** (no separate migration/seed step needed for MongoDB).

## 5. Database & Seed

MongoDB is schema-flexible; indexes and seed data are created on FastAPI startup:
- Unique index on `users.email`, `courses.slug`
- Indexes on `request_logs.timestamp`, `request_logs.classification`
- Seeds 8 courses, an admin account, and a demo student with progress

## 6. Docker Deployment

```bash
cp .env.example .env      # edit values
docker compose up --build -d
```

Services: `mongo`, `backend` (FastAPI on 8001), `frontend` (static build served by nginx on 80, proxies `/api` → backend).

## 7. Production Deployment

1. Provision a small VPS (1–2 vCPU, 2 GB RAM is comfortable).
2. Set strong `JWT_SECRET` and `ADMIN_PASSWORD` in `.env`.
3. `docker compose up --build -d`.
4. Point DNS `cyberheadacademy.com` → your server.

## 8. Reverse Proxy / SafeLine WAF

Target architecture:

```
Internet → cyberheadacademy.com → SafeLine WAF → Application → MongoDB
```

- Install SafeLine WAF and add `cyberheadacademy.com` as a protected site.
- Set the **upstream** to the application server (frontend :80, which proxies `/api` to backend :8001).
- Once SafeLine is the public entrypoint, the application server does **not** need to be directly exposed to the internet — restrict it to the WAF's IP with a firewall.

## 9. HTTPS

- Terminate TLS at SafeLine (recommended) or at a fronting nginx.
- When HTTPS is enabled, cookies are issued `Secure` + `HttpOnly` + `SameSite`, and set `Strict-Transport-Security` at the proxy.

## 10. API Endpoints

**Auth:** `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`

**Courses:** `GET /api/courses` · `GET /api/courses/:id` · `GET /api/courses/search?q=` · `POST /api/courses/:id/enroll`

**User:** `GET /api/user/profile` · `PUT /api/user/profile` · `GET /api/user/enrollments` · `GET /api/user/dashboard`

**Contact:** `POST /api/contact`

**Security Lab (safe):** `GET /api/security-test/search?q=` · `POST /api/security-test/input` · `GET /api/security-test/resource?id=` · `GET|POST /api/security-test/traffic` · `GET /api/security-test/stats`

**Admin (admin JWT required):** `GET /api/admin/overview` · `GET /api/admin/users` · `GET /api/admin/enrollments` · `GET /api/admin/messages` · `GET /api/admin/logs`

**Docs:** `GET /api/docs-spec` · Swagger UI at `/api/swagger`

## 11. Admin Login

Seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Default for local dev (change in production):
- Email: `admin@cyberheadacademy.com`
- Password: set via `.env`

## 12. Security Notes

- Passwords hashed with **bcrypt**; JWT signed with `JWT_SECRET`.
- All DB queries are parameterized (MongoDB documents / escaped regex) — **no string-concatenated queries**.
- Login errors are generic (`Invalid email or password.`) and never reveal whether an email exists.
- Rate limiting on auth, contact and traffic endpoints.
- Structured request logging (request_id, method, path, status, response time, UA, source IP) — **never logs passwords, tokens, or cookies**.
- Security headers set on every response.
