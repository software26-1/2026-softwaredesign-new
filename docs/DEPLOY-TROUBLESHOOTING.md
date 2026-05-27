# 배포 트러블슈팅 기록

EC2(Amazon Linux 2023) + Docker로 백엔드 스택을 처음 배포하며 겪은 문제들과 해결 과정 정리. 프론트는 Vercel, 이미지는 GHCR, CI/CD는 GitHub Actions.

대상 도메인: `54-180-98-245.nip.io` (EC2 IP `54.180.98.245`)

---

## 요약 (한눈에)

| # | 증상 | 근본 원인 | 해결 | PR |
|---|---|---|---|---|
| 1 | 앱이 기동 실패 (`APPLICATION FAILED TO START`) | `ChatbotService`가 존재하지 않는 `RestClient.Builder` 빈 주입 | `RestClient.create()`로 내부 생성 | #72 |
| 2-1 | `/swagger-ui.html` → nginx 게이트웨이 메시지 | nginx가 `/swagger-ui/`(슬래시)만 프록시 | exact 경로 `= /swagger-ui.html`, `= /api-docs` 추가 | #74 |
| 2-2 | Swagger 진입 시 Google 로그인으로 튕김 | Spring Security가 `/swagger-ui.html`·`/api-docs`(exact) 미허용 | `permitAll` 매처에 추가 | #76 |
| 2-3 | Swagger UI "Failed to fetch /api-docs" (서버는 200) | HTTP 환경 + 브라우저의 HTTPS 자동 업그레이드/캐시 | **HTTPS 적용**으로 해소 | #78 |
| 3 | Google 로그인 `invalid_request` 차단 | Google이 raw IP·HTTP 리디렉트 금지 | nip.io + Let's Encrypt HTTPS | #78 |

핵심 교훈: **2-3과 3은 같은 뿌리(HTTP)였고, HTTPS 하나로 동시 해결**됐다.

---

## 문제 1 — 백엔드 기동 실패 (ChatbotService)

**증상**
```
APPLICATION FAILED TO START
Parameter 2 of constructor in ...ChatbotService required a bean of type
'org.springframework.web.client.RestClient$Builder' that could not be found.
```
DB 연결·Flyway 마이그레이션까지 다 성공한 뒤 컨텍스트 초기화 단계에서 실패.

**원인**
`ChatbotService`가 생성자에서 `RestClient.Builder`를 주입받도록 작성됐는데, 이 환경에선 해당 빈이 자동 등록되지 않았다. `CHATBOT_ENABLED=false`여도 빈 자체는 생성되므로 **항상** 실패.

**해결 (#72)**
```java
// before
private final RestClient.Builder restClientBuilder;   // 주입 → 빈 없으면 기동 실패
// after
private final RestClient restClient = RestClient.create();  // 내부 생성, 빈 의존성 제거
```

**교훈**: 선택 기능(외부 API 클라이언트)은 *빈 주입*보다 *내부 생성/지연 초기화*가 안전하다. 비활성 상태에서도 빈이 만들어지면 기동을 막을 수 있다.

---

## 문제 2 — Swagger UI가 안 뜸 (3단계 방어를 차례로 통과)

`/swagger-ui.html` 하나 여는 데 세 겹의 벽이 있었다.

### 2-1. nginx 라우팅 (#74)
- nginx는 `location /swagger-ui/`(슬래시 prefix)만 백엔드로 보냈다.
- 진입 페이지 `/swagger-ui.html`(슬래시 없음)과 OpenAPI JSON `/api-docs`(슬래시 없음)는 매칭되지 않아 `location /`(루트)로 빠져 게이트웨이 메시지가 떴다.
- 해결: `location = /swagger-ui.html`, `location = /api-docs` exact 매칭 추가.

### 2-2. Spring Security (#76)
- nginx를 통과해 백엔드에 도달해도, Security 설정이 `/swagger-ui/**`, `/api-docs/**`만 `permitAll`이라 `/swagger-ui.html`·`/api-docs`(exact)는 **인증 필요**로 판정.
- OAuth2 로그인이 설정돼 있어 → Google 로그인으로 리다이렉트 → (HTTP/IP라) 차단.
- 해결: `permitAll` 매처에 `/swagger-ui.html`, `/api-docs` 추가.

### 2-3. 브라우저 fetch 실패 (#78, HTTPS로 해소)
- 서버는 정상: `curl http://54.180.98.245/api-docs` → **200, application/json, 54KB**.
- 그런데 브라우저 Swagger UI만 `Failed to fetch /api-docs`.
- `swagger-config`도 정상(`"url":"/api-docs"` 상대경로).
- 원인: HTTP로 띄운 페이지에서 모던 브라우저가 하위 리소스 요청을 `https://`로 자동 업그레이드(또는 옛 리다이렉트 캐시) → 443 미개방 → fetch 실패.
- 해결: **HTTPS 적용**(문제 3 참조). 동일 출처가 HTTPS가 되면서 해소.

**교훈**: "서버는 200인데 브라우저만 실패"면 클라이언트 환경(HTTPS 업그레이드, 캐시, CORS)을 의심한다. `curl`로 서버를 먼저 격리 검증하면 원인 층을 빠르게 좁힐 수 있다.

---

## 문제 3 — Google 로그인 차단 & HTTPS 적용

**증상**: 로그인 시 Google `Access blocked: Authorization Error`, `Error 400: invalid_request`.

**원인**: Google OAuth는 리디렉트 URI로 **raw IP**나 **비-localhost HTTP**를 허용하지 않는다. 앱이 보낸 `http://54.180.98.245/login/oauth2/code/google`는 정책 위반.

**해결 (#78) — 도메인 구매 없이 HTTPS**
1. **nip.io**: `54-180-98-245.nip.io`가 자동으로 `54.180.98.245`로 resolve (실제 DNS 호스트명).
2. **Let's Encrypt(certbot standalone)** 로 해당 호스트명 인증서 발급:
   ```bash
   docker compose stop nginx
   docker run --rm -p 80:80 -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot \
     certonly --standalone -d 54-180-98-245.nip.io --non-interactive --agree-tos -m <email>
   docker compose start nginx
   ```
3. **nginx TLS 적용**: `nginx-tls.conf`(443, 인증서 경로) + `docker-compose.tls.yml` 오버라이드:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.tls.yml up -d
   ```
4. 결과: `https://54-180-98-245.nip.io` 동작 → Swagger·로그인·프론트 mixed-content 문제 일괄 해소.

**교훈**: 도메인이 없어도 nip.io + Let's Encrypt로 실제 HTTPS를 붙일 수 있다. HTTP 배포에서 겪는 자잘한 문제(OAuth 차단, 브라우저 업그레이드, 프론트 mixed content)는 대부분 HTTPS 하나로 사라진다 — **처음부터 HTTPS로 가는 게 결과적으로 빠르다.**

---

## 운영 중 만난 함정들 (작지만 시간 잡아먹은 것들)

| 함정 | 상황 | 해결 |
|---|---|---|
| **EC2 Instance Connect 실패** | 브라우저 SSH가 "Failed to connect" | SSH 소스가 "내 IP"라 AWS 접속 차단 → 터미널 + `.pem` 접속, 또는 소스 `0.0.0.0/0` |
| **`apt` 없음** | Amazon Linux 2023은 `dnf` 사용 | `sudo dnf install -y docker git` |
| **buildx 0.17+ 필요** | EC2에서 `compose build` 실패 | 서버 빌드 포기 → **GHCR 이미지 pull** 방식으로 전환 (CI가 빌드, 서버는 받기만) |
| **docker.sock permission denied** | docker 그룹 미적용 | `usermod -aG docker $USER` 후 **재로그인** 또는 `newgrp docker` |
| **GHCR pull denied** | 비공개 패키지 | PAT(`read:packages`)로 `docker login ghcr.io` |
| **`.pem` bad permissions** | SSH가 키 거부(0644) | `chmod 400 키.pem` |
| **`BACKEND_IMAGE` 미설정** | 새 셸에서 옛/로컬 이미지로 기동 | 매번 `export BACKEND_IMAGE=...` 또는 compose에 명시 |
| **ping 타임아웃** | 서버 죽은 줄 오해 | 보안그룹이 ICMP 미허용일 뿐, HTTP는 정상 (ping ≠ 헬스체크) |
| **브라우저 캐시** | 옛 302 리다이렉트가 박혀 계속 차단 | 시크릿창/캐시 삭제, 근본적으론 HTTPS |

---

## CI/CD 상태 메모

- `deploy.yml`의 **build-and-push** 잡은 main 머지마다 자동 실행 → GHCR 이미지는 항상 최신.
- **deploy** 잡(EC2 SSH 자동 배포)은 `vars.DEPLOY_ENABLED == 'true'` + EC2 시크릿이 있을 때만 동작. 아직 미설정이라 현재는 EC2에서 수동 `docker compose pull` 필요.
- 완전 자동화하려면: GitHub Secrets `EC2_HOST`/`EC2_USER`/`EC2_SSH_KEY`(+`EC2_APP_DIR`) + Variable `DEPLOY_ENABLED=true` 설정. (→ `docs/DEPLOYMENT.md`)

---

## 최종 동작 확인 (검증된 것)

- ✅ 전체 스택 기동: backend·nginx·postgres·redis·kafka·prometheus·grafana
- ✅ Flyway V1~V12 + `analytics` 스키마 적용
- ✅ 외부 접속: `https://54-180-98-245.nip.io` (HTTPS, 자물쇠)
- ✅ Swagger: `https://54-180-98-245.nip.io/swagger-ui.html`, OpenAPI `/api-docs`
- ✅ health: `/actuator/health` → `{"status":"UP"}`
- ✅ Prometheus가 `/actuator/prometheus` 수집, Grafana(:3000, 내 IP만)
- ⏭ 남은 것: Google OAuth에 HTTPS 리디렉트 등록, `.env` CORS/FRONTEND_URL 갱신, Vercel 프론트 배포, CD 자동 배포 잡 활성화
