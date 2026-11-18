#!/usr/bin/env bash
# Re-align the password stored in the PostgreSQL volume with the one Compose
# uses. Safe for existing data: it only runs ALTER USER. Never prints secrets.
#
#   bash scripts/sync-db-password.sh             # repair
#   bash scripts/sync-db-password.sh --diagnose  # redacted report only
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="$root_dir/.env"
# shellcheck source=scripts/env-lib.sh
. "$root_dir/scripts/env-lib.sh"

diagnose=0
for arg in "$@"; do
  case "$arg" in
    --diagnose) diagnose=1 ;;
    -h|--help)
      printf 'Usage: %s [--diagnose]\n\nRepairs the PostgreSQL password so it matches the value Compose uses.\n--diagnose prints sources and value shape only, never the secrets.\n' "$0"
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n' "$arg" >&2
      exit 2
      ;;
  esac
done

if [ "$diagnose" -eq 1 ]; then
  report_env_shape "$env_file" POSTGRES_PASSWORD DATABASE_URL
  exit 0
fi

if [ ! -f "$env_file" ]; then
  printf '%s not found. Run scripts/setup-env.sh first.\n' "$env_file" >&2
  exit 1
fi

# Resolve exactly like compose: non-empty environment variable, then .env.
password="$(resolve_env_value "$env_file" POSTGRES_PASSWORD || true)"
if problem="$(describe_password_problem "$password")"; then
  printf 'POSTGRES_PASSWORD %s.\n' "$problem" >&2
  printf '  source: %s\n' "$(env_value_source "$env_file" POSTGRES_PASSWORD)" >&2
  printf '  Fix:   bash scripts/setup-env.sh --force\n' >&2
  exit 1
fi

# Compose would otherwise start migrate with a URL that cannot authenticate.
database_url="$(resolve_env_value "$env_file" DATABASE_URL || true)"
if [ -z "$database_url" ]; then
  printf 'DATABASE_URL is missing from both the environment and %s.\n' "$env_file" >&2
  printf '  Fix: bash scripts/setup-env.sh --force\n' >&2
  exit 1
fi
url_secret="$(url_password "$database_url" || true)"
if [ -z "$url_secret" ]; then
  printf 'DATABASE_URL has no password component; expected postgresql://tarhyar:PASSWORD@db:5432/tarhyar.\n' >&2
  exit 1
fi
if [ "$(urldecode "$url_secret")" != "$password" ]; then
  printf 'DATABASE_URL password does not match POSTGRES_PASSWORD.\n' >&2
  printf '  POSTGRES_PASSWORD source: %s\n' "$(env_value_source "$env_file" POSTGRES_PASSWORD)" >&2
  printf '  DATABASE_URL source:      %s\n' "$(env_value_source "$env_file" DATABASE_URL)" >&2
  printf '  Run bash scripts/sync-db-password.sh --diagnose for a redacted report.\n' >&2
  exit 1
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
  printf 'Database password now matches the value Compose uses. Data was not modified.\n'
else
  printf 'Failed to update the password. If tarhyar is not the superuser, run the ALTER USER command manually as the postgres user.\n' >&2
  exit 1
fi

printf 'Next: docker compose up -d\n'
