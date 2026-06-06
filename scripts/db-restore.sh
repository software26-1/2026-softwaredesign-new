#!/usr/bin/env bash
#
# db-restore.sh — PostgreSQL 백업 복원 스크립트
#
# 동작 개요:
#   1) 인자로 받은 백업 파일(.dump.gz)을 검증
#      - 인자가 's3://...' 이면 먼저 로컬로 다운로드
#      - 인자가 없으면 BACKUP_DIR 에서 가장 최신 백업을 자동 선택
#   2) 복원 전 안전장치: 현재 DB를 pre-restore 백업으로 한 번 더 덤프
#   3) 사용자에게 대화형 확인(yes 입력)을 받은 뒤
#   4) gunzip → pg_restore --clean --if-exists 로 복원 (기존 객체 DROP 후 재생성)
#
# 사용법:
#   ./scripts/db-restore.sh                                  # 최신 로컬 백업 복원
#   ./scripts/db-restore.sh ./backups/school_mgmt_X.dump.gz  # 특정 파일 복원
#   ./scripts/db-restore.sh s3://my-bucket/db-backups/X.dump.gz  # S3 백업 복원
#
# 환경변수:
#   PG_CONTAINER / POSTGRES_DB / POSTGRES_USER / BACKUP_DIR / AWS_REGION  (db-backup.sh 와 동일)
#   FORCE=1  로 설정하면 대화형 확인을 건너뜀 (자동화/CI 용, 주의)
#
set -euo pipefail

PG_CONTAINER="${PG_CONTAINER:-school_postgres}"
POSTGRES_DB="${POSTGRES_DB:-school_mgmt}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
AWS_REGION="${AWS_REGION:-ap-northeast-2}"
FORCE="${FORCE:-0}"

log() { echo "[db-restore] $(date '+%Y-%m-%d %H:%M:%S') $*"; }
die() { log "ERROR: $*"; exit 1; }

SOURCE="${1:-}"

# 1) 복원 대상 결정
if [ -z "${SOURCE}" ]; then
    # 인자 없음 → 최신 로컬 백업 자동 선택
    SOURCE="$(ls -1t "${BACKUP_DIR}"/school_mgmt_*.dump.gz 2>/dev/null | head -n1 || true)"
    [ -n "${SOURCE}" ] || die "복원할 백업이 없습니다 (${BACKUP_DIR} 비어 있음). 파일 경로를 인자로 지정하세요."
    log "최신 로컬 백업 자동 선택: ${SOURCE}"
fi

# S3 경로면 로컬로 다운로드
if [[ "${SOURCE}" == s3://* ]]; then
    command -v aws >/dev/null 2>&1 || die "aws CLI 가 필요합니다 (S3 복원)."
    mkdir -p "${BACKUP_DIR}"
    LOCAL="${BACKUP_DIR}/$(basename "${SOURCE}")"
    log "S3 다운로드: ${SOURCE} → ${LOCAL}"
    aws s3 cp "${SOURCE}" "${LOCAL}" --region "${AWS_REGION}" || die "S3 다운로드 실패"
    SOURCE="${LOCAL}"
fi

[ -f "${SOURCE}" ] || die "백업 파일을 찾을 수 없습니다: ${SOURCE}"

# 2) 복원 전 현재 상태 백업 (사고 대비 — 복원이 잘못돼도 되돌릴 수 있게)
SAFETY="${BACKUP_DIR}/pre_restore_$(date +%Y%m%d_%H%M%S).dump.gz"
mkdir -p "${BACKUP_DIR}"
log "복원 전 현재 DB 백업: ${SAFETY}"
docker exec "${PG_CONTAINER}" pg_dump -U "${POSTGRES_USER}" -Fc "${POSTGRES_DB}" | gzip > "${SAFETY}" \
    || log "WARN: 복원 전 백업 실패 (계속 진행하려면 직접 확인 필요)"

# 3) 대화형 확인
log "복원 대상 : ${SOURCE}"
log "대상 DB   : ${POSTGRES_DB} (컨테이너 ${PG_CONTAINER})"
log "주의: 기존 데이터는 DROP 후 백업 시점 상태로 덮어쓰여집니다."
if [ "${FORCE}" != "1" ]; then
    read -r -p "정말 복원하시겠습니까? 'yes' 입력 시 진행: " CONFIRM
    [ "${CONFIRM}" = "yes" ] || { log "취소됨."; exit 0; }
fi

# 4) 복원 실행 — --clean --if-exists 로 기존 객체 정리 후 재생성
log "복원 시작..."
gunzip -c "${SOURCE}" \
    | docker exec -i "${PG_CONTAINER}" pg_restore -U "${POSTGRES_USER}" \
        --clean --if-exists --no-owner -d "${POSTGRES_DB}" \
    || die "pg_restore 실패. 복원 전 백업(${SAFETY})으로 되돌릴 수 있습니다."

log "복원 완료: ${SOURCE} → ${POSTGRES_DB}"
log "참고: 애플리케이션을 재기동하세요 → docker compose restart (또는 백엔드 컨테이너)"
