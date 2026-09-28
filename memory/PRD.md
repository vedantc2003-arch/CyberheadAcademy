# CyberHead Academy — PRD

## Original Problem Statement
Build "CyberHead Academy" (cyberheadacademy.com): a production-style cybersecurity education platform that also serves as a controlled security-testing lab for a YouTube demo of SafeLine WAF handling suspicious traffic. Must look like a legitimate modern SaaS security-education platform (not DVWA), be secure by default (no real exploitable vulnerabilities), and expose realistic endpoints/logging so a WAF can be demonstrated.

Requested stack was Node/Express/PostgreSQL/Prisma; user approved building on the platform stack (React + FastAPI + MongoDB) with identical features, pages, API routes and security controls.

## Architecture
- Frontend: React 19, React Router, Tailwind, shadcn/ui, Recharts, Framer Motion, sonner. Dark cybersecurity SaaS aesthetic (Outfit/Inter/JetBrains Mono).
- Backend: FastAPI + Motor (async MongoDB). JWT (HS256) + bcrypt auth (token in body + httpOnly cookie; frontend uses Bearer from localStorage `ch_token`).
- DB: MongoDB. Collections: users, courses, enrollments, contact_messages, request_logs, (login handled via in-memory rate limiter).
- Security: parameterized/escaped queries, generic auth errors, rate limiting (auth/contact/traffic), request-logging middleware (no secrets), security headers, consistent JSON error envelope, Starlette 404 handler.

## User Personas
- Prospective/enrolled student: browses courses, enrolls, tracks progress.
- Admin: manages users, courses, enrollments, messages, request logs.
- Security demonstrator (WAF video): uses Security Lab to generate classified test traffic.

## Core Requirements (static)
Public pages (Home, Courses, Course Details, Search, Contact, Security Lab, Security Lab Dashboard, API Docs), Auth (register/login/logout), Protected (Dashboard, Profile), Admin panel, full REST API under /api, Security Lab safe test endpoints + live stats, Docker deployment docs.

## Implemented (2026-06)
- All public + protected + admin pages, responsive dark UI. ✅
- Auth: register/login/logout/me, JWT+bcrypt, generic errors, rate limit, brute-force protection. ✅
- Courses: 8 seeded courses w/ modules/lessons/instructors, list + filters, details w/ curriculum accordion, parameterized search, enroll (idempotent). ✅
- Student dashboard (security score, enrolled, progress bars, recent lab activity), profile view/update. ✅
- Contact form → stored + admin view. ✅
- Security Lab: safe search/input/resource/traffic endpoints w/ SQLi/XSS/CMD/path classification (never executed), burst generator. ✅
- Security Lab dashboard: total/today/suspicious/WAF status, GET/POST bar chart, traffic timeline area chart, live request log table (8s auto-refresh). ✅
- Admin panel: overview stats + Users/Enrollments/Messages/Request Logs tabs, RBAC (401/403). ✅
- API Docs page (route `/docs`, since `/api/*` is reserved by ingress) + Swagger at /api/swagger. ✅
- Request logging middleware; security headers; consistent error envelope. ✅
- Docker: backend Dockerfile, frontend Dockerfile+nginx, docker-compose, .env.example, README. ✅
- Verified: backend 36/36 pytest pass; frontend e2e walkthrough pass after route fix.

## Backlog / Remaining
- P1: Persist rate-limiting & login attempts in MongoDB (currently in-memory, resets on reload / not multi-worker).
- P1: Real lesson player + progress updates (progress is currently seeded/static per enrollment).
- P2: Password reset (forgot/reset) flow.
- P2: Contact message status management in admin (mark read/resolved).
- P2: Profile photo upload via object storage (currently URL field).

## Test Credentials
- Admin: admin@cyberheadacademy.com / CyberHead@Admin2025
- Student: sanket@cyberheadacademy.com / Student@2025

## Next Tasks
See backlog P1 items first (persist rate limiting, lesson progress).
