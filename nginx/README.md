# Nginx reverse proxy

Two configs are provided:

| File | Use | Ports |
|---|---|---|
| `nginx.conf` | 로컬/개발 (기본 docker-compose) | 80 |
| `nginx-tls.conf` | 운영 (TLS 종료) | 80→443 리다이렉트, 443 TLS |

Both proxy `/api/`, `/oauth2/`, `/login/oauth2/`, `/swagger-ui/`, `/api-docs/`, `/actuator/` → `backend:8080`. The SPA is hosted on Vercel, so `/` only returns a health string.

## 운영 TLS 적용

1. **인증서 발급** (예: Let's Encrypt / certbot). `nginx-tls.conf`의 80 포트 `/.well-known/acme-challenge/`로 webroot 챌린지를 받을 수 있다.
2. **docker-compose의 nginx 서비스**에서 마운트를 아래처럼 교체:

   ```yaml
   nginx:
     image: nginx:alpine
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./nginx/nginx-tls.conf:/etc/nginx/nginx.conf:ro
       - /etc/letsencrypt/live/<도메인>:/etc/nginx/certs:ro   # fullchain.pem, privkey.pem
       - ./certbot/www:/var/www/certbot:ro                     # ACME webroot
     depends_on:
       - backend
   ```

3. **인증서 자동 갱신**: certbot 컨테이너/크론으로 갱신 후 `docker exec <nginx> nginx -s reload`.

> 기본 `docker-compose.yml`은 `nginx.conf`(80)만 사용하므로 인증서 없이도 기동된다. TLS는 위 마운트로 운영 환경에서만 활성화한다.
