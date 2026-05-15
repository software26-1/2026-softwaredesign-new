# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See also the parent `../CLAUDE.md` for monorepo-level context (frontend, infrastructure, git conventions).

## Commands

```bash
./gradlew bootRun                    # Run (port 8080, loads .env automatically)
./gradlew build                      # Build
./gradlew test                       # All tests (JUnit 5)
./gradlew test --tests "com.softwaredesign.schoolsystem.SomeTest"  # Single test
```

Requires `.env` with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`. The `bootRun` task auto-reads `.env` and injects vars as environment variables. Infrastructure (PostgreSQL on port 5433, Redis on port 6379) must be running via `docker compose up -d` from the repo root.

## Architecture

Spring Boot 4.0.6 / Java 25 / Gradle (Groovy DSL `build.gradle`)

Root package: `com.softwaredesign.schoolsystem`

```
auth/                    # Google OAuth2 + JWT authentication
  controller/            # AuthController (/api/auth/*)
  service/               # AuthService (token issuance, refresh rotation, logout)
  jwt/                   # JwtProvider, JwtAuthFilter
  oauth2/                # OAuth2 handlers, CustomOAuth2UserService
  dto/                   # TokenResponse, ProfileSetupRequest, AuthUser (record)

domain/
  user/                  # Base User entity, UserAdminController/Service, approval workflow
  school/                # School, ClassGroup, Teacher, Admin — full CRUD for all four
  student/               # Student, Parent, ParentStudent — full CRUD
  academic/              # Curriculum, Course, Enrollment — in progress (controller stub, no service yet)
  # Placeholder domains (DB tables exist, code not yet implemented):
  # approval, attendance, counseling, feedback, grade, notification, record, report

config/                  # SecurityConfig, RedisConfig, JpaConfig, FlywayConfig
common/                  # ApiResponse<T> wrapper, BaseEntity (createdAt/updatedAt)
```

### Key patterns

- **All REST responses** use `ApiResponse<T>` with `ok(data)` / `fail(message)` factory methods.
- **All entities** extend `BaseEntity` which provides `createdAt`/`updatedAt` via JPA auditing.
- **Domain modules** follow controller → service → repository → entity with separate DTOs.
- **Admin endpoints** use `@PreAuthorize("hasRole('ADMIN')")`.
- **Soft-delete entities** (School, ClassGroup, Student, Parent, ParentStudent, Curriculum, Course, Enrollment) use `is_deleted` flag — filter these in queries.
- **Enums:** `UserRole` (TEACHER, STUDENT, PARENT, ADMIN), `UserStatus` (PENDING, WAITING_APPROVAL, ACTIVE, INACTIVE), `SchoolType` (MIDDLE, HIGH), `CourseType` (COMMON, ELECTIVE, CAREER), `Relationship` (FATHER, MOTHER, GUARDIAN).
- **Entity inheritance:** Teacher, Student, Parent, Admin all extend `User`. Course has a ratio constraint (midtermRatio + finalRatio + taskRatio = 100).

## Database

PostgreSQL 16. Hibernate ddl-auto is `none` — **all schema changes must be Flyway migrations** in `src/main/resources/db/migration/`. Current version: V9 (9 migration files). Next migration should be `V10__description.sql`.

Key tables: `users`, `school`, `teacher`, `student`, `parent`, `admin`, `class_group`, `parent_student`, `curriculum`, `course`, `enrollment`, `grade`, `grade_summary`, `attendance`, `feedback`, `counseling`, `student_record`, `approval_request`, `notification`, `report`.

**Soft-delete pattern:** Many entities use `is_deleted` (boolean, default false). Use this flag instead of hard deletes for these entities.

**Recent migrations:**
- V8 removed role-specific columns (grade, class_num, student_num, position, etc.) from `users` table.
- V9 renamed `course.category` → `course_type`, added ratio sum check constraint, removed `enrollment.enrolled_at`.

## Authentication flow

**Dual-mode auth:**
1. **Google OAuth2** — primary login for teachers/students/parents. New users go through status progression: `PENDING` → (profile setup) → `WAITING_APPROVAL` → (admin approves) → `ACTIVE`.
2. **Admin password login** — `POST /api/auth/admin/login` with BCrypt-hashed password.

**JWT details:** Access tokens (HS256, 30min) carry userId/email/role claims. Refresh tokens (7-day expiry) are random hex strings stored in Redis with SHA-256 hashing. Token rotation: old refresh token is invalidated on each refresh.

**Redis keys:** `RT:{hashedToken}` → userId, `RTU:{userId}` → hashedToken.

**Request auth:** `Authorization: Bearer <accessToken>` → `JwtAuthFilter` → `AuthUser` principal in SecurityContext.

## Security notes

**Public endpoints (no auth required):**
- `/oauth2/**`, `/login/oauth2/**` — OAuth2 flow
- `/api/auth/refresh`, `/api/auth/admin/login` — Token management
- `/swagger-ui/**`, `/api-docs/**` — API documentation

**CORS:** Allows `http://localhost:5173` only. Methods: GET/POST/PUT/DELETE/PATCH/OPTIONS. Session management is STATELESS (JWT-based), CSRF is disabled.
