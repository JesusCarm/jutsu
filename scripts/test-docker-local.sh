#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

for dependency in docker curl jq git; do
  command -v "$dependency" >/dev/null || { printf 'Missing dependency: %s\n' "$dependency" >&2; exit 1; }
done
docker info >/dev/null

image='jutsu:local-test'
app_commit="$(git rev-parse HEAD)"
container_name="jutsu-local-smoke-$$"

docker build --build-arg "APP_COMMIT=$app_commit" --tag "$image" .

cleanup() {
  result=$?
  trap - EXIT
  if [ "$result" -ne 0 ]; then
    docker logs "$container_name" >&2 || true
  fi
  docker rm --force "$container_name" >/dev/null 2>&1 || true
  exit "$result"
}
trap cleanup EXIT

docker run --detach --name "$container_name" --publish 127.0.0.1::80 \
  --env GA_MEASUREMENT_ID=G-CITEST0001 "$image" >/dev/null
base_url="http://$(docker port "$container_name" 80/tcp)"

printf 'Checking startup and /healthz at %s\n' "$base_url"
curl --fail --silent --show-error --output /dev/null \
  --retry 20 --retry-all-errors --retry-delay 1 --retry-max-time 30 \
  --connect-timeout 2 --max-time 5 "$base_url/healthz"

printf 'Checking the build commit\n'
curl --fail --silent --show-error "$base_url/build-info.json" \
  | jq --exit-status --arg commit "$app_commit" '.commit == $commit'

printf 'Checking runtime configuration\n'
runtime_config="$(curl --fail --silent --show-error "$base_url/runtime-config.js")"
[[ "$runtime_config" == *G-CITEST0001* ]]

printf 'Checking Angular route fallback\n'
route_html="$(curl --fail --silent --show-error "$base_url/a-client-route")"
[[ "$route_html" == *'<app-root>'* ]]

printf 'Checking missing assets return 404\n'
status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$base_url/assets/missing.json")"
test "$status" = 404

printf 'Local Docker smoke test passed for commit %s. Image: %s\n' "$app_commit" "$image"
