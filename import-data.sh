#!/bin/bash
# Seed the database with pre-populated data
# Migrations are run automatically when the app container starts
docker-compose exec app npx prisma db seed
