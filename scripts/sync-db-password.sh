#!/usr/bin/env bash
# Re-align the password stored in the PostgreSQL volume with the one in .env.
# Safe for existing data: it only runs ALTER USER. The password is never printed.
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="$root_dir/.env"
# shellcheck source=scripts/env-lib.sh
. "$root_dir/scripts/env-lib.sh"

if [ ! -f "$env_file" ]; then
  printf '%s not found. Run scripts/setup-env.sh first.\n' "$env_file" >&2
  exit 1
fi

# Read only the password line; never echo the value.
password="$(read_env_value "$env_file" POSTGRES_PASSWORD || true)"
if problem="$(describe_password_problem "$password")"; then
  printf 'POSTGRES_PASSWORD %s (in %s).\n' "$problem" "$env_file" >&2
  exit 1
fi

# Compose would otherwise start migrate with a URL that cannot authenticate.
database_url="$(read_env_value "$env_file" DATABASE_URL || true)"
if [ -n "$database_url" ]; then
  url_secret="$(url_password "$database_url" || true)"
  if [ -z "$url_secret" ]; then
    printf 'DATABASE_URL has no password component; it must look like postgresql://tarhyar:PASSWORD@db:5432/tarhyar.\n' >&2
    exit 1
  fi
  if [ "$(urldecode "$url_secret")" != "$password" ]; then
    printf 'DATABASE_URL password does not match POSTGRES_PASSWORD (in %s).\n' "$env_file" >&2
    printf 'Regenerate both together with: bash scripts/setup-env.sh --force\n' >&2
    exit 1
  fi
fi

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
