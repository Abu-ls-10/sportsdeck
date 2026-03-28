#!/bin/bash
cd sportsdeck-app

npm install

npx prisma generate

npx prisma migrate dev

npx prisma db seed

