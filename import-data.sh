#!/bin/bash
cd sportsdeck-app
docker compose exec -T app sh -c "node_modules/.bin/prisma migrate deploy && node_modules/.bin/prisma db seed"
