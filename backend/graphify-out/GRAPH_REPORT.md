# Graph Report - .  (2026-05-13)

## Corpus Check
- 92 files · ~141,889 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 365 nodes · 434 edges · 48 communities (13 shown, 35 thin omitted)
- Extraction: 71% EXTRACTED · 29% INFERRED · 0% AMBIGUOUS · INFERRED: 125 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_REST Controllers|REST Controllers]]
- [[_COMMUNITY_DTOs & Auth Services|DTOs & Auth Services]]
- [[_COMMUNITY_Domain Entities|Domain Entities]]
- [[_COMMUNITY_User & OAuth2|User & OAuth2]]
- [[_COMMUNITY_Architecture Docs|Architecture Docs]]
- [[_COMMUNITY_DB Schema & Patterns|DB Schema & Patterns]]
- [[_COMMUNITY_Student Repository & Service|Student Repository & Service]]
- [[_COMMUNITY_ClassGroup Repository|ClassGroup Repository]]
- [[_COMMUNITY_ParentStudent Mapping|ParentStudent Mapping]]
- [[_COMMUNITY_School Repository & Service|School Repository & Service]]
- [[_COMMUNITY_JWT Auth Filter|JWT Auth Filter]]
- [[_COMMUNITY_Teacher Service|Teacher Service]]
- [[_COMMUNITY_Admin Service|Admin Service]]
- [[_COMMUNITY_Security Config|Security Config]]
- [[_COMMUNITY_Admin Repository|Admin Repository]]
- [[_COMMUNITY_Teacher Repository|Teacher Repository]]
- [[_COMMUNITY_OAuth2 Failure Handler|OAuth2 Failure Handler]]
- [[_COMMUNITY_Application Tests|Application Tests]]
- [[_COMMUNITY_Application Entry|Application Entry]]
- [[_COMMUNITY_Flyway Config|Flyway Config]]
- [[_COMMUNITY_Redis Config|Redis Config]]
- [[_COMMUNITY_Token Response DTO|Token Response DTO]]
- [[_COMMUNITY_OAuth2 Success Handler|OAuth2 Success Handler]]
- [[_COMMUNITY_Parent Repository|Parent Repository]]
- [[_COMMUNITY_JPA Config|JPA Config]]
- [[_COMMUNITY_Refresh Request DTO|Refresh Request DTO]]
- [[_COMMUNITY_Profile Setup DTO|Profile Setup DTO]]
- [[_COMMUNITY_Admin Login DTO|Admin Login DTO]]
- [[_COMMUNITY_Base Entity|Base Entity]]
- [[_COMMUNITY_ParentStudent Create DTO|ParentStudent Create DTO]]
- [[_COMMUNITY_Student Create DTO|Student Create DTO]]
- [[_COMMUNITY_Student Update DTO|Student Update DTO]]
- [[_COMMUNITY_User Update DTO|User Update DTO]]
- [[_COMMUNITY_School Update DTO|School Update DTO]]
- [[_COMMUNITY_School Create DTO|School Create DTO]]
- [[_COMMUNITY_Teacher Update DTO|Teacher Update DTO]]
- [[_COMMUNITY_ClassGroup Create DTO|ClassGroup Create DTO]]
- [[_COMMUNITY_Admin Update DTO|Admin Update DTO]]
- [[_COMMUNITY_ClassGroup Update DTO|ClassGroup Update DTO]]
- [[_COMMUNITY_Report Table|Report Table]]
- [[_COMMUNITY_RDD Diagram|RDD Diagram]]

## God Nodes (most connected - your core abstractions)
1. `Student Table` - 10 edges
2. `JwtProvider` - 8 edges
3. `User` - 8 edges
4. `UserAdminService` - 8 edges
5. `Spring Boot Application (Docker on EC2)` - 8 edges
6. `CustomOAuth2User` - 7 edges
7. `UserAdminController` - 7 edges
8. `AuthService` - 6 edges
9. `Student` - 6 edges
10. `StudentController` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Spring Boot Application (Docker on EC2)` --semantically_similar_to--> `Spring Boot Backend`  [INFERRED] [semantically similar]
  backend/design/SystemArchitecture.png → backend/CLAUDE.md
- `PostgreSQL (Docker on separate EC2)` --semantically_similar_to--> `PostgreSQL 16 Database`  [INFERRED] [semantically similar]
  backend/design/SystemArchitecture.png → backend/CLAUDE.md
- `Redis Container (Docker on EC2)` --semantically_similar_to--> `Redis (Refresh Token Store)`  [INFERRED] [semantically similar]
  backend/design/SystemArchitecture.png → backend/CLAUDE.md
- `User Status Progression (PENDING -> WAITING_APPROVAL -> ACTIVE)` --references--> `Users Table`  [INFERRED]
  backend/CLAUDE.md → backend/design/ERD.png
- `Soft-Delete Pattern (is_deleted flag)` --references--> `School Table`  [EXTRACTED]
  backend/CLAUDE.md → backend/design/ERD.png

## Hyperedges (group relationships)
- **JWT Authentication Request Flow** — claudemd_jwt_auth_filter, claudemd_jwt_provider, claudemd_auth_service, claudemd_redis, claudemd_security_config [EXTRACTED 0.90]
- **Production Deployment Stack (EC2 + Docker)** — sysarch_nginx, sysarch_spring_boot, sysarch_redis_container, sysarch_prometheus_grafana, sysarch_postgresql_ec2, sysarch_github_actions [EXTRACTED 0.95]
- **Student Academic Data Model** — erd_student_table, erd_enrollment_table, erd_grade_table, erd_attendance_table, erd_grade_summary_table, erd_course_table [EXTRACTED 0.90]

## Communities (48 total, 35 thin omitted)

### Community 0 - "REST Controllers"
Cohesion: 0.05
Nodes (9): AdminController, AuthController, ClassGroupController, ParentStudentController, SchoolController, StudentController, TeacherController, UserAdminController (+1 more)

### Community 1 - "DTOs & Auth Services"
Cohesion: 0.07
Nodes (12): AdminResponse, ClassGroupResponse, ParentOfStudentResponse, ParentStudentResponse, SchoolResponse, StudentOfParentResponse, StudentResponse, TeacherResponse (+4 more)

### Community 2 - "Domain Entities"
Cohesion: 0.07
Nodes (8): BaseEntity, Admin, ClassGroup, Parent, ParentStudent, School, Student, Teacher

### Community 3 - "User & OAuth2"
Cohesion: 0.09
Nodes (7): DefaultOAuth2UserService, User, CustomOAuth2User, CustomOAuth2UserService, OAuth2User, UserRepository, UserAdminService

### Community 4 - "Architecture Docs"
Cohesion: 0.08
Nodes (29): ApiResponse<T> Wrapper, AuthController, Auth Module (Google OAuth2 + JWT), AuthService, BaseEntity (createdAt/updatedAt), CustomOAuth2UserService, Domain Modules (user, school, classgroup, student), Dual-Mode Auth (OAuth2 + Admin Password) (+21 more)

### Community 5 - "DB Schema & Patterns"
Cohesion: 0.16
Nodes (20): Rationale: Soft Delete Over Hard Delete, Soft-Delete Pattern (is_deleted flag), User Status Progression (PENDING -> WAITING_APPROVAL -> ACTIVE), Approval Request Table, Attendance Table, Class Group Table, Counseling Table, Course Table (+12 more)

## Knowledge Gaps
- **37 isolated node(s):** `JpaConfig`, `RefreshRequest`, `ProfileSetupRequest`, `AdminLoginRequest`, `TokenResponse` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User & OAuth2` to `Domain Entities`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `ParentStudent` connect `Domain Entities` to `ParentStudent Mapping`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Teacher` connect `Domain Entities` to `Teacher Service`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Student Table` (e.g. with `Feedback Table` and `Counseling Table`) actually correct?**
  _`Student Table` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `JpaConfig`, `RefreshRequest`, `ProfileSetupRequest` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `REST Controllers` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `DTOs & Auth Services` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._