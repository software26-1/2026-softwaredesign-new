# 배포 가이드 (Deployment)

학생 성적·상담 관리 시스템의 실제 배포 절차. 아키텍처: **Vercel(프론트)** + **AWS EC2/Docker(Nginx·Spring·Redis·Kafka·Prometheus·Grafana)** + **PostgreSQL(EC2 또는 RDS)** + **S3** + **AWS SES·Firebase** + **GitHub Actions CI/CD**.

코드/설정은 이미 준비됨. 아래는 **계정 발급 → 값 주입 → 스위치 ON → 검증** 순서다.

---

## 0. 준비물 한눈에

| 구분 | 필요한 것 |
|---|---|
| 계정 | AWS, Vercel, Firebase, Google Cloud(OAuth), Anthropic, 도메인 |
| GitHub | Secrets(EC2 접속), Variable `DEPLOY_ENABLED=true` |
| 시크릿 | JWT_SECRET, Google OAuth, DB/Redis 비밀번호, (선택)Anthropic/SES/Firebase/S3 |

---

## 1. 계정 / 외부 서비스 셋업

### 1-1. AWS
1. **EC2 (앱 서버)**: Ubuntu, Docker + docker-compose-plugin 설치. 보안그룹 인바운드 80/443 개방(8080은 내부만).
2. **PostgreSQL**: RDS(PostgreSQL 16) 권장 — 자동 백업/복구 요구사항 충족. 또는 별도 EC2.
3. **S3 버킷**: 보고서 저장용 (예: `school-reports-prod`).
4. **SES**: 발신 도메인/주소 검증 → 프로덕션 액세스(샌드박스 해제) 요청.
5. **IAM**: EC2에 S3/SES 권한 Role 부여(키 하드코딩보다 Role 권장). 또는 `AWS_ACCESS_KEY_ID/SECRET`.

### 1-2. Google OAuth (이미 사용 중)
- Google Cloud Console → 사용자 인증 정보 → OAuth 클라이언트에 **운영 redirect URI** 추가:
  `https://<API_도메인>/login/oauth2/code/google`
- 운영 `GOOGLE_CLIENT_ID/SECRET` 발급/확인.

### 1-3. Firebase (푸시, 선택)
- 프로젝트 생성 → 프로젝트 설정 → 서비스 계정 → **새 비공개 키 생성**(JSON) → EC2에 안전하게 배치 후 `FIREBASE_CREDENTIALS_PATH` 로 경로 지정.

### 1-4. Anthropic (AI 챗봇, 선택)
- API 키 발급 → `ANTHROPIC_API_KEY`.

### 1-5. Vercel (프론트)
- GitHub 저장소 연동, 루트 디렉토리 `frontend`. `frontend/vercel.json` 이 SPA 라우팅을 처리.
- 환경변수 `VITE_API_URL=https://<API_도메인>/api`.
- push 시 자동 배포(별도 워크플로 불필요).

### 1-6. 도메인 / TLS
- DNS A 레코드 → EC2 IP.
- Let's Encrypt(certbot)로 인증서 발급 후 `nginx/nginx-tls.conf` 사용(→ `nginx/README.md` 참고).

---

## 2. GitHub 설정

**Settings → Secrets and variables → Actions**

| 종류 | 이름 | 값 |
|---|---|---|
| Secret | `EC2_HOST` | EC2 퍼블릭 IP/도메인 |
| Secret | `EC2_USER` | 예: `ubuntu` |
| Secret | `EC2_SSH_KEY` | EC2 접속 개인키(PEM 전체) |
| Secret | `EC2_APP_DIR` | (선택) 앱 경로, 기본 `~/2026-softwaredesign-new` |
| Variable | `DEPLOY_ENABLED` | `true` (이게 있어야 `deploy.yml`이 실제 배포) |

> GHCR 이미지 푸시는 `GITHUB_TOKEN`을 자동 사용. 배포 워크플로: `.github/workflows/deploy.yml`.

---

## 3. 운영 환경변수 주입 (EC2의 `backend/.env`)

`backend/.env.example` 를 복사해 채운다. **필수**: `JWT_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `DB_*`, `REDIS_*`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`.

선택 기능은 플래그로 켠다:

| 기능 | 켜는 법 |
|---|---|
| Kafka 이벤트 동기화 | `KAFKA_ENABLED=true`, `KAFKA_BOOTSTRAP_SERVERS=kafka:9092` |
| AI 챗봇 | `CHATBOT_ENABLED=true`, `ANTHROPIC_API_KEY=...` |
| 이메일 알림(SES) | `NOTIF_EMAIL_ENABLED=true`, `SES_FROM_EMAIL=검증된주소`, `AWS_REGION=...` |
| 푸시 알림(FCM) | `NOTIF_PUSH_ENABLED=true`, `FIREBASE_CREDENTIALS_PATH=/경로/firebase.json` |
| 보고서 S3 | `REPORT_S3_ENABLED=true`, `REPORT_S3_BUCKET=...` |

> 모든 선택 플래그 기본값은 `false` → 미설정이어도 앱은 정상 기동한다.

---

## 4. 배포 절차

### 4-1. 최초 1회 (EC2)
```bash
git clone https://github.com/software26-1/2026-softwaredesign-new.git
cd 2026-softwaredesign-new
cp backend/.env.example backend/.env   # 값 채우기
docker compose up -d                   # postgres/redis/kafka/backend/nginx/prometheus/grafana
# Flyway가 기동 시 V1~V12 + analytics 스키마 자동 적용
```

### 4-2. 이후 자동 배포
- `main`에 `backend/**` 변경 머지 → `deploy.yml`이 GHCR 이미지 빌드/푸시 → EC2 SSH로 `docker compose pull backend && up -d`.

### 4-3. TLS 적용(운영)
- `nginx/README.md` 의 마운트 교체(`nginx-tls.conf` + 인증서)로 443 활성화.

---

## 5. 배포 후 검증 체크리스트

- [ ] `docker compose ps` — 모든 컨테이너 healthy
- [ ] Flyway: `analytics` 스키마 + V12까지 적용 확인
- [ ] `https://<API>/swagger-ui.html` 접속, 역할별 토큰으로 권한(403) 확인
- [ ] OAuth 로그인 → 프로필 → 관리자 승인 → ACTIVE 플로우
- [ ] `POST /api/analytics/etl/run`(ADMIN) → 분석 테이블 적재 → 대시보드/차트 렌더
- [ ] (Kafka ON) 성적 입력 → 해당 학생 `fact_*` 증분 갱신
- [ ] (SES ON) 성적/피드백 변경 시 이메일 수신, (FCM ON) 디바이스 토큰 등록 후 푸시
- [ ] (S3 ON) 보고서 생성 → S3 업로드 → 다운로드
- [ ] Grafana(`:3000`, admin 비밀번호 변경) → Spring Boot 대시보드 지표 수집
- [ ] Prometheus(`:9090`) target `spring-boot` UP

---

## 6. 보안 점검 (운영 전)
- [ ] `JWT_SECRET` 강한 랜덤 값, Grafana admin 비밀번호 변경
- [ ] DB/Redis는 외부 노출 금지(보안그룹), `.env`/Firebase JSON 커밋 금지
- [ ] SES 발신주소 검증, S3 버킷 비공개 + IAM 최소 권한
- [ ] 통합 테스트: Docker 환경에서 `cd backend && ./gradlew test` (DB 포함 전체)
