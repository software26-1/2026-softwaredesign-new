# 백업 및 장애 복구 (Disaster Recovery)

이 문서는 비기능 요구사항 N4-1(정기 백업), N4-2(장애 시 복구)에 대한 운영 가이드다.
관련 자산: `scripts/db-backup.sh`, `scripts/db-restore.sh`, `docker-compose.yml`(restart 정책 + healthcheck).

---

## 1. 백업 전략

### 1-1. 왜 이 방식인가 (설계 근거)

| 후보 | 채택 여부 | 이유 |
|---|---|---|
| docker volume만 의존 | 불채택 | 영속성일 뿐 백업이 아님. volume 삭제·디스크 손상·마이그레이션 사고 시 복구 불가 |
| 로컬 pg_dump + 크론 | 기본 채택 | 의존성 없이 즉시 동작, 시연/개발 환경에서 "정기 백업 있음" 성립 |
| **pg_dump + S3 업로드** | **최종 채택** | EC2 디스크와 독립된 보존소 확보. AWS SDK·S3가 이미 아키텍처에 있어 추가 인프라 없이 활용 가능. 단일 EC2 운영의 약점(서버 소실=데이터 소실)을 보완 |
| RDS 등 매니지드 DB | 불채택 | 자동 백업은 좋으나 현 단계엔 인프라 과투자. 추후 확장 시 고려 |

핵심 판단: 운영이 EC2 1대에 PostgreSQL 컨테이너로 올라가 있어 **서버가 죽으면 데이터도 같이 죽는** 단일 장애점이다. 따라서 백업본을 EC2 바깥(S3)에 두는 것이 N4 요구사항의 실질적 충족 조건이다.

### 1-2. pg_dump custom format(-Fc)을 쓴 이유

plain SQL 덤프 대신 custom format(`-Fc`)을 사용한다.
- `pg_restore`로 **선택 복원**(특정 테이블만)·**병렬 복원**이 가능
- 내부적으로 압축되며, 추가 gzip으로 전송·보관 용량을 더 줄임
- 복원 시 `--clean --if-exists`로 기존 객체를 안전하게 교체

### 1-3. 백업 스크립트 동작 (`scripts/db-backup.sh`)

실행: `./scripts/db-backup.sh`

```
1) docker exec school_postgres pg_dump -U postgres -Fc school_mgmt | gzip
   → ./backups/school_mgmt_YYYYMMDD_HHMMSS.dump.gz 생성
2) BACKUP_S3_BUCKET 가 설정돼 있으면:
   aws s3 cp <파일> s3://<버킷>/db-backups/<파일> --region <리전>
   (aws CLI 없거나 실패해도 로컬 백업은 보존 — WARN 후 계속)
3) RETENTION_DAYS(기본 7) 초과한 로컬 백업 자동 삭제 (find -mtime +N -delete)
```

환경변수(미설정 시 docker-compose 기본값):

| 변수 | 기본값 | 설명 |
|---|---|---|
| `PG_CONTAINER` | `school_postgres` | 백업 대상 컨테이너 |
| `POSTGRES_DB` | `school_mgmt` | DB 이름 |
| `POSTGRES_USER` | `postgres` | DB 사용자 |
| `BACKUP_DIR` | `./backups` | 로컬 보관 위치 |
| `RETENTION_DAYS` | `7` | 로컬 보관 일수 |
| `BACKUP_S3_BUCKET` | (비움) | 설정 시 S3 업로드 활성화 |
| `AWS_REGION` | `ap-northeast-2` | S3 리전 |

설계 의도: S3는 **옵션**이다. 자격증명 없이도(개발/시연) 로컬 백업이 동작하고, 운영에서 버킷 한 줄만 주면 오프사이트 백업으로 승격된다.

### 1-4. 정기 실행 등록 (크론)

EC2에서 매일 새벽 4시 백업 (애플리케이션 ETL이 새벽 3시이므로 그 이후):

```bash
# crontab -e 에 추가
0 4 * * * cd /home/ubuntu/app && BACKUP_S3_BUCKET=school-mgmt-backups ./scripts/db-backup.sh >> /var/log/db-backup.log 2>&1
```

S3 업로드를 쓰려면 EC2에 AWS CLI 설치 + IAM 역할(또는 자격증명)로 해당 버킷 `s3:PutObject` 권한 부여.

---

## 2. 장애 복구 전략

장애를 세 유형으로 나눠 대응한다.

### 시나리오 A — 컨테이너/프로세스 단위 장애 (가장 흔함)

예: Spring 컨테이너 OOM, Postgres 일시 다운, EC2 재부팅.

**자동 복구**: `docker-compose.yml` 전 서비스에 `restart: unless-stopped` 적용.
- 컨테이너가 비정상 종료되면 Docker가 자동 재기동
- EC2 재부팅 후에도 Docker 데몬이 살아나면 컨테이너 자동 복귀(`docker` 서비스 enable 전제)
- `postgres`/`redis`에 healthcheck 추가 — 헬스 상태를 `docker ps`로 즉시 확인

**수동 확인**:
```bash
docker compose ps              # 상태 확인 (healthy 여부)
docker compose up -d           # 내려간 서비스 재기동
docker compose logs -f <svc>   # 로그 추적
```

### 시나리오 B — 데이터 손상 / 마이그레이션 사고

예: 잘못된 마이그레이션 적용, 운영 데이터 오삭제, 스키마 정합 작업(`fix/#110-schema-align`처럼 DELETE 포함) 사고.

**복구 절차** (`scripts/db-restore.sh`):
```bash
# 1) 최신 로컬 백업으로 복원 (대화형 확인)
./scripts/db-restore.sh

# 2) 특정 백업 지정
./scripts/db-restore.sh ./backups/school_mgmt_20260606_040000.dump.gz

# 3) S3 백업으로 복원 (EC2 디스크에 백업이 없을 때)
./scripts/db-restore.sh s3://school-mgmt-backups/db-backups/school_mgmt_20260606_040000.dump.gz
```

스크립트 내장 안전장치:
1. **복원 전 현재 DB를 자동 백업**(`pre_restore_*.dump.gz`) — 복원이 잘못돼도 직전 상태로 되돌릴 수 있음
2. `yes` 입력 대화형 확인 (자동화 시 `FORCE=1`)
3. `pg_restore --clean --if-exists` — 기존 객체 DROP 후 재생성
4. 복원 후 애플리케이션 재기동 안내

> 위험한 마이그레이션(데이터 삭제 포함)을 적용하기 전에는 **반드시 수동 백업을 먼저 실행**한다:
> `./scripts/db-backup.sh` → 그 다음 마이그레이션 → 문제 시 `./scripts/db-restore.sh`.

### 시나리오 C — EC2 전체 소실

예: 인스턴스 종료, 디스크 완전 손상, 리전 장애.

**복구 절차**:
```bash
# 1) 새 EC2 프로비저닝 + Docker/Docker Compose 설치
# 2) 저장소 클론 + .env 복원
git clone <repo> && cd app
# .env 재구성 (GOOGLE_CLIENT_ID/SECRET, JWT_SECRET, DB/REDIS, GEMINI_API_KEY 등)

# 3) 인프라 기동 (DB 빈 상태로 올라옴)
docker compose up -d postgres redis

# 4) S3 최신 백업으로 데이터 복원
BACKUP_S3_BUCKET=school-mgmt-backups \
  ./scripts/db-restore.sh s3://school-mgmt-backups/db-backups/<최신파일>

# 5) 나머지 서비스 + 백엔드 기동
docker compose up -d
```

이 시나리오가 1-1에서 S3 오프사이트 백업을 채택한 직접적 근거다 — EC2가 통째로 사라져도 S3 백업만 있으면 복원 가능.

---

## 3. 복구 목표치 (참고)

| 지표 | 값 | 근거 |
|---|---|---|
| RPO (복구 시점 목표) | 최대 24시간 | 일 1회(새벽 4시) 백업 기준. 더 줄이려면 크론 주기 단축 |
| RTO (복구 시간 목표) | 시나리오 A: 수초(자동) / B: 수분 / C: 수십분 | restart 자동복구 / restore 스크립트 / 신규 EC2 구축 시간 |

---

## 4. 점검 체크리스트

- [ ] EC2 crontab에 `db-backup.sh` 등록
- [ ] `BACKUP_S3_BUCKET` 설정 + EC2에 aws CLI/IAM 권한
- [ ] S3 버킷 생성 + 버전관리/수명주기 정책(선택)
- [ ] 분기 1회 복원 리허설(`db-restore.sh`로 실제 복원 테스트)
- [ ] Docker 데몬 부팅 시 자동 시작 설정(`systemctl enable docker`)
