#!/usr/bin/env bash
# Re-align the password stored in the PostgreSQL volume with the one in .env.
# Safe for existing data: it only runs ALTER USER. The password is never printed.
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="$root_dir/.env"

if [ ! -f "$env_file" ]; then
  printf '%s not found. Run scripts/setup-env.sh first.\n' "$env_file" >&2
  exit 1
fi

# Read only the password line; never echo the value.
password="$(sed -n 's/^POSTGRES_PASSWORD=//p' "$env_file" | head -n1)"
case "$password" in
  ""|*[!A-Za-z0-9]*)
    printf 'POSTGRES_PASSWORD is missing or not URL-safe in %s.\n' "$env_file" >&2
    exit 1
    ;;
esac

cd "$root_dir"
if ! docker compose ps --status running --services 2>/dev/null | grep -qx db; then
  printf 'Starting the db service...\n'
  docker compose up -d db
fi

printf 'Waiting for PostgreSQL to accept connections...\n'
ready=0
for _ in $(seq 1 60); do
  if docker compose exec -T db pg_isready -U tarhyar -d tarhyar >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  printf 'PostgreSQL did not become ready. Check: docker compose logs db\n' >&2
  exit 1
fi

# ALTER USER is idempotent: existing databases, tables and rows are untouched.
# The SQL travels over stdin, so the password never appears in `ps` or argv.
if printf "ALTER USER tarhyar WITH PASSWORD '%s';\n" "$password" |
  docker compose exec -T db psql -U tarhyar -d tarhyar -v ON_ERROR_STOP=1 -q >/dev/null; then
  printf 'Database password now matches .env. Data was not modified.\n'
else
  printf 'Failed to update the password. If tarhyar is not the superuser, run the ALTER USER command manually as the postgres user.\n' >&2
  exit 1
fi

printf 'Next: docker compose up -d\n'
