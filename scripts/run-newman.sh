#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:-local}"

if [[ "$ENV_NAME" == "mock" ]]; then
  npm run test:mock
elif [[ "$ENV_NAME" == "local" ]]; then
  npm run test:local
elif [[ "$ENV_NAME" == "docker" ]]; then
  docker build -t fit4110/iot-ingestion:lab04 .
  docker run -d --rm --name fit4110-iot-lab04 -p 8000:8000 --env-file .env.example fit4110/iot-ingestion:lab04
  npx wait-on http://localhost:8000/health --timeout 30000
  npm run test:local
  EXIT_CODE=$?
  docker stop fit4110-iot-lab04 || true
  exit $EXIT_CODE
else
  echo "Usage: bash scripts/run-newman.sh [mock|local|docker]"
  exit 1
fi
