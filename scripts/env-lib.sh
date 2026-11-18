# Shared helpers for reading the deployment .env without printing secrets.
# Sourced by scripts/setup-env.sh and scripts/sync-db-password.sh.

# Read KEY from an env file, tolerating CRLF, optional `export`, surrounding
# quotes and trailing whitespace the way docker compose does.
# Never echoes the value. Returns 1 when the key is absent or empty.
read_env_value() {
  local file="$1" key="$2" line value
  [ -f "$file" ] || return 1

  line="$(LC_ALL=C tr -d '\r' < "$file" |
    sed -n "s/^[[:space:]]*\(export[[:space:]][[:space:]]*\)\?${key}[[:space:]]*=[[:space:]]*//p" |
    head -n1)"
  [ -n "$line" ] || return 1

  # Strip one pair of matching single or double quotes.
  case "$line" in
    \"*\") value="${line#\"}"; value="${value%\"}" ;;
    \'*\') value="${line#\'}"; value="${value%\'}" ;;
    *) value="$line" ;;
  esac

  # Trim trailing whitespace; a stray trailing space breaks the connection URL.
  value="$(printf '%s' "$value" | sed -e 's/[[:space:]]*$//')"
  [ -n "$value" ] || return 1

  printf '%s' "$value"
}

# Explain why a password cannot be stored, without revealing it.
# Returns 1 when the password is usable.
describe_password_problem() {
  local value="$1"
  case "$value" in
    "") printf 'is empty' ;;
    *[[:space:]]*) printf 'contains whitespace; remove the spaces or wrap the value in quotes' ;;
    *"'"*) printf "contains a single quote, which this script cannot escape; regenerate it with: bash scripts/setup-env.sh --force" ;;
    *) return 1 ;;
  esac
}

# Percent-decode a value taken from a connection URL.
urldecode() {
  printf '%b' "${1//%/\\x}"
}

# Extract the password component of a postgresql:// URL. Returns 1 if absent.
url_password() {
  local url="$1" match
  match="$(printf '%s' "$url" | sed -n 's|^[A-Za-z][A-Za-z0-9+.-]*://[^:/@]*:\(.*\)@[^@/]*\(/.*\)\?$|\1|p')"
  [ -n "$match" ] || return 1
  printf '%s' "$match"
}
