#!/bin/bash

echo "Waiting for database to be ready..."

docker compose exec db sh -c '
until pg_isready -U sportsdeck; do
  sleep 2
done
'

echo "Importing data..."

docker compose exec -T db psql -U sportsdeck -d sportsdeck < prisma/seedData/dump.sql

echo "Data import complete."