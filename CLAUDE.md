# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Monorepo for a **student grade & counseling management system** (중·고 교사용 성적/학생부/피드백/상담 관리).

```
backend/    Spring Boot 4.0.6 / Java 25 / Gradle REST API — see backend/CLAUDE.md
frontend/   React 19 + Vite + TypeScript + Tailwind + Chart.js SPA
Design/     Source-of-truth design artifacts: 요구사항 명세서(PDF), API 명세 v2,
            ERD, 아키텍처 다이어그램, UI 와이어프레임. Read these before scoping a feature.
docker-compose.yml   Local infra (PostgreSQL 16 + Redis 7)
```

`backend/CLAUDE.md` holds the detailed backend architecture (domains, auth flow, Flyway, security). Read it before touching backend code.

## Local startup (full stack)

```bash
docker compose up -d                 # PostgreSQL (5433) + Redis (6379, password redis1234)
cd backend && ./gradlew bootRun      # API on :8080 (auto-loads backend/.env)
cd frontend && npm install && npm run dev   # SPA on :5173
```

Backend `.env` requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET` (DB/Redis vars have defaults matching docker-compose). Frontend `.env` needs `VITE_API_URL=http://localhost:8080/api`.

## Commands

```bash
# backend (from backend/)
./gradlew bootRun                    # run (:8080)
./gradlew build                      # build
./gradlew test                       # all tests (JUnit 5)
./gradlew test --tests "com.softwaredesign.schoolsystem.SomeTest"   # single test

# frontend (from frontend/)
npm run dev / npm run build / npm run lint / npm run preview
```

API docs (Swagger UI) at `http://localhost:8080/swagger-ui.html` when the backend is running. Frontend has no test runner configured yet.

## Cross-cutting conventions

- **DB schema changes are Flyway-only** (`ddl-auto: none`). Add `backend/src/main/resources/db/migration/V{n}__*.sql` — never modify a committed migration.
- **Backend feature pattern**: `domain/<x>/{controller,service,repository,entity,dto}`; entities extend `BaseEntity`; REST responses wrap in `ApiResponse<T>`; soft-delete via `is_deleted` (filter in queries). Mirror the most recent finished domains `domain/grade/` and `domain/attendance/`.
- **Auth**: Google OAuth2 + JWT, role-based `@PreAuthorize` (TEACHER/STUDENT/PARENT/ADMIN). Student/parent self-access validates the authenticated user against the target (parents via `parent_student`).
- **Frontend**: API calls go through `src/api/client.ts` (JWT interceptor) and `src/services/*`; types in `src/types/*`. Charts use Chart.js / react-chartjs-2.

## Git workflow

Feature branches off `dev` (not `main`). Commit/PR titles: `[Feat] <설명> #<issue>` (also `[Fix]`, `[Refactor]`). Use the `gh-workflow` skill for issue→branch→commit→PR.
