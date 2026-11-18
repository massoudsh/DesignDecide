# Shared helpers for reading the deployment .env without printing secrets.
# Sourced by scripts/setup-env.sh and scripts/sync-db-password.sh.
#
# Resolution order mirrors docker compose: a non-empty shell environment
# variable wins over the .env file. Values are never echoed.

# Strip a UTF-8 BOM and CRLF so the first key still matches.
_env_clean_file() {
  LC_ALL=C tr -d '\r' < "$1" | sed -e '1s/^\xEF\xBB\xBF//'
}

# Read KEY from an env file, tolerating CRLF, BOM, optional `export`,
# spaces around `=` and surrounding quotes. Last assignment wins.
# Returns 1 when the key is absent or its value is empty.
read_env_file_value() {
  local file="$1" key="$2" line value
  [ -f "$file" ] || return 1

  line="$(_env_clean_file "$file" |
    sed -n "s/^[[:space:]]*\(export[[:space:]][[:space:]]*\)\?${key}[[:space:]]*=[[:space:]]*//p" |
    tail -n1)"
  [ -n "$line" ] || return 1

  case "$line" in
    \"*\") value="${line#\"}"; value="${value%\"}" ;;
    \'*\') value="${line#\'}"; value="${value%\'}" ;;
    *) value="$line" ;;
  esac

  value="$(printf '%s' "$value" | sed -e 's/[[:space:]]*$//')"
  [ -n "$value" ] || return 1

  printf '%s' "$value"
}

# Where KEY came from: "environment" or ".env". Prints the source only.
env_value_source() {
  local file="$1" key="$2"
  if [ -n "${!key-}" ]; then
    printf 'environment'
  elif read_env_file_value "$file" "$key" >/dev/null 2>&1; then
    printf '.env'
  else
    printf 'missing'
  fi
}

# Resolve KEY the way compose does: shell environment first, then .env.
resolve_env_value() {
  local file="$1" key="$2"
  if [ -n "${!key-}" ]; then
    printf '%s' "${!key}"
    return 0
  fi
  read_env_file_value "$file" "$key"
}

# Explain why a password cannot be stored, without revealing it.
# Returns 1 when the password is usable.
describe_password_problem() {
  local value="$1"
  case "$value" in
    "") printf 'is empty or missing from both the environment and .env' ;;
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

# Redacted report: names, sources and shape only, never the secret itself.
# $1 = env file, remaining args = keys to report.
report_env_shape() {
  local file="$1" key value source shape
  shift
  printf 'Env file: %s\n' "$file"
  [ -f "$file" ] && printf 'Env file permissions: %s\n' "$(ls -l "$file" | awk '{print $1}')"
  for key in "$@"; do
    source="$(env_value_source "$file" "$key")"
    value="$(resolve_env_value "$file" "$key" || true)"
    printf '%s: source=%s length=%s\n' "$key" "$source" "${#value}"
    [ -n "$value" ] || continue
    shape=""
    case "$value" in *[[:space:]]*) shape="$shape whitespace" ;; esac
    case "$value" in *[!A-Za-z0-9._~%:@/+-]*) shape="$shape symbols" ;; esac
    [ -n "$shape" ] || shape=" plain"
    printf '  shape:%s\n' "$shape"
  done
}
