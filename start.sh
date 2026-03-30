#!/bin/bash
cd sportsdeck-app

docker-compose up -d --build

echo "Waiting for seeding to complete..."
docker logs -f sportsdeck-app 2>&1 | while read line; do
  echo "$line"
  if echo "$line" | grep -q "Seeding complete"; then
    echo "✅ Seeding complete! App is ready."
    pkill -f "docker logs -f"
    break
  fi
done
