#!/bin/bash

cd sportsdeck-app

set -e

CONTAINER_NAME="sportsdeck-db"
DB_NAME="sportsdeck"
DB_USER="sportsdeck"
DUMP_FILE="prisma/seedData/dump.sql"

echo "Importing database..."

# =========================
# 1. Wait for Postgres (just in case)
# =========================
echo "Checking Postgres..."
until docker exec $CONTAINER_NAME pg_isready -U $DB_USER > /dev/null 2>&1; do
  sleep 1
done

echo "Postgres ready"

# =========================
# 2. Reset DB (CRITICAL)
# =========================
echo "Dropping existing schema..."
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME <<EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
EOF

# =========================
# 3. Import dump
# =========================
echo "Importing dump.sql..."
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < $DUMP_FILE

echo "Import complete!"

# =========================
# 4. Quick verification
# =========================
docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "\dt"

echo "DB ready"