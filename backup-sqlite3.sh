#!/bin/bash

DB="/var/lib/grafana/grafana.db"
BACKUP_FOLDER="/backup/grafana"
BACKUP="${BACKUP_FOLDER}/grafana.db-$(date +%Y%m%d).bck"
SQLITE=/usr/bin/sqlite3
ZIP=/bin/gzip

mkdir -p ${BACKUP_FOLDER}
${SQLITE} ${DB} ".backup ${BACKUP}"
${ZIP} ${BACKUP}
