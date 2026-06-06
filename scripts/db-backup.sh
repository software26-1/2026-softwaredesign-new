#!/usr/bin/env bash
#
# db-backup.sh — PostgreSQL 정기 백업 스크립트
#
# 동작 개요:
#   1) docker 컨테이너(school_postgres) 안의 pg_dump로 논리 백업(custom format) 생성
#   2) gzip 압축 후 BACKUP_DIR 에 날짜·시각 파일명으로 저장
#   3) (선택) BACKUP_S3_BUCKET 가 설정되면 AWS CLI로 S3 업로드
#   4) RETENTION_DAYS(기본 7일) 지난 로컬 백업 파일 자동 삭제
#
# 사용법:
#   ./scripts/db-backup.sh
#
# 환경변수 (없으면 docker-compose 기본값 사용):
#   PG_CONTAINER     백업 대상 컨테이너명     (기본 school_postgres)
#   POSTGRES_DB      DB 이름                  (기본 school_mgmt)
#   POSTGRES_USER    DB 사용자                (기본 postgres)
#   BACKUP_DIR       로컬 백업 보관 디렉토리   (기본 ./backups)
#   RETENTION_DAYS   로컬 보관 일수            (기본 7)
#   BACKUP_S3_BUCKET S3 버킷명 (비우면 업로드 생략)
#   AWS_REGION       S3 리전                  (기본 ap-northeast-2)
#
set -euo pipefail

PG_CONTAINER="${PG_CONTAINER:-school_postgres}"
POSTGRES_DB="${POSTGRES_DB:-school_mgmt}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-ap-northeast-2}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILENAME="school_mgmt_${TIMESTAMP}.dump.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

log() { echo "[db-backup] $(date '+%Y-%m-%d %H:%M:%S') $*"; }

mkdir -p "${BACKUP_DIR}"

# 1~2) pg_dump (custom format -Fc, 컨테이너 내부 실행) → 호스트에서 gzip 압축 저장
#   -Fc(custom) 포맷은 pg_restore 로 선택 복원·병렬 복원이 가능해 plain SQL 보다 유연하다.
log "백업 시작: ${POSTGRES_DB} → ${FILEPATH}"
if ! docker exec "${PG_CONTAINER}" pg_dump -U "${POSTGRES_USER}" -Fc "${POSTGRES_DB}" \
    | gzip > "${FILEPATH}"; then
    log "ERROR: pg_dump 실패. 부분 파일 삭제."
    rm -f "${FILEPATH}"
    exit 1
fi

SIZE="$(du -h "${FILEPATH}" | cut -f1)"
log "백업 완료: ${FILEPATH} (${SIZE})"

# 3) (선택) S3 업로드 — 아키텍처 다이어그램의 Amazon S3 를 백업 보존 용도로 실제 활용
if [ -n "${BACKUP_S3_BUCKET}" ]; then
    if command -v aws >/dev/null 2>&1; then
        S3_URI="s3://${BACKUP_S3_BUCKET}/db-backups/${FILENAME}"
        log "S3 업로드: ${S3_URI}"
        if aws s3 cp "${FILEPATH}" "${S3_URI}" --region "${AWS_REGION}"; then
            log "S3 업로드 완료"
        else
            log "WARN: S3 업로드 실패 (로컬 백업은 정상 보존됨)"
        fi
    else
        log "WARN: aws CLI 미설치 — S3 업로드 생략 (로컬 백업만 보존)"
    fi
else
    log "S3 업로드 비활성 (BACKUP_S3_BUCKET 미설정) — 로컬 백업만 보존"
fi

# 4) 오래된 로컬 백업 정리
log "보관기간 초과(${RETENTION_DAYS}일) 백업 정리"
find "${BACKUP_DIR}" -name 'school_mgmt_*.dump.gz' -type f -mtime "+${RETENTION_DAYS}" -print -delete || true

log "전체 완료"
