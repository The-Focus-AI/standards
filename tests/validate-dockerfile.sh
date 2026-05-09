#!/usr/bin/env bash
# Static validation of the Dockerfile — no docker required.
# Run: ./tests/validate-dockerfile.sh [Dockerfile-path]
set -euo pipefail

DOCKERFILE="${1:-Dockerfile}"
PASS=0
FAIL=0

check() {
  local label="$1"; shift
  printf "  %-52s " "$label"
  if "$@"; then
    echo "PASS"
    PASS=$((PASS + 1))
  else
    echo "FAIL"
    FAIL=$((FAIL + 1))
  fi
  return 0
}

check_not() {
  local label="$1"; shift
  printf "  %-52s " "$label"
  if ! "$@"; then
    echo "PASS"
    PASS=$((PASS + 1))
  else
    echo "FAIL"
    FAIL=$((FAIL + 1))
  fi
  return 0
}

echo "==> Validating $DOCKERFILE (static)"
echo ""

# --- base image ---
check     "Base image is debian:stable-slim"       grep -q 'FROM debian:stable-slim' "$DOCKERFILE"
check_not "Does NOT use ubuntu"                     grep -qi 'FROM ubuntu' "$DOCKERFILE"

# --- shell ---
check     "SHELL directive uses /bin/bash"          grep -q 'SHELL.*bin/bash' "$DOCKERFILE"

# --- non-root user ---
check     "Creates non-root user (useradd)"         grep -q 'useradd' "$DOCKERFILE"
check     "References WORKER_USER ARG"              grep -q 'WORKER_USER' "$DOCKERFILE"

# --- directories ---
check     "Creates /app directory"                  grep -q '/app' "$DOCKERFILE"
check     "Creates /standards directory"            grep -q '/standards' "$DOCKERFILE"
check     "WORKDIR is /app"                         grep -q 'WORKDIR /app' "$DOCKERFILE"

# --- tools (via mise) ---
check     "Installs mise"                           grep -q 'mise.run' "$DOCKERFILE"
check     "Installs fnox"                           grep -q 'fnox' "$DOCKERFILE"
check     "Installs node via mise"                  grep -q 'mise use.*node' "$DOCKERFILE"
check     "Installs pi-coding-agent"                grep -q 'pi-coding-agent' "$DOCKERFILE"
check     "Installs pi-tmux plugin"                 grep -q 'pi-tmux' "$DOCKERFILE"
check     "Installs pi-extensions plugin"           grep -q 'pi-extensions' "$DOCKERFILE"

# --- system packages ---
check     "Installs git"                            grep -q '\bgit\b' "$DOCKERFILE"
check     "Installs tmux"                           grep -q 'tmux' "$DOCKERFILE"
check     "Installs gh (GitHub CLI)"                grep -q '\bgh\b' "$DOCKERFILE"
check     "Installs curl"                           grep -q 'curl' "$DOCKERFILE"
check     "Installs build-essential"                grep -q 'build-essential' "$DOCKERFILE"

# --- shell activation ---
check     "mise activate in .bashrc"                grep -q 'mise activate bash' "$DOCKERFILE"
check     "fnox activate in .bashrc"                grep -q 'fnox activate bash' "$DOCKERFILE"

# --- linger ---
check     "Enables linger"                          grep -q 'linger' "$DOCKERFILE"

# --- layer ordering ---
check     "COPY is within 10 lines of CMD"          bash -c 'copy=$(grep -n "^COPY " "$1" | head -1 | cut -d: -f1); cmd=$(grep -n "^CMD " "$1" | head -1 | cut -d: -f1); [ $((cmd - copy)) -le 10 ]' -- "$DOCKERFILE"

check_not "No heavy installs after COPY"            bash -c 'copy=$(grep -n "^COPY " "$1" | head -1 | cut -d: -f1); tail -n +$copy "$1" | grep -qE "(mise use|apt-get install|npm install|pi install)"' -- "$DOCKERFILE"

# --- CMD ---
check     "CMD is bash login shell"                 grep -q 'bin/bash.*-l' "$DOCKERFILE"

# --- constraints ---
check_not "No npm install -g"                       grep -q 'npm install -g' "$DOCKERFILE"
check_not "No pip install"                          grep -q 'pip install' "$DOCKERFILE"
check_not "No brew install"                         grep -qi 'brew install' "$DOCKERFILE"

# --- summary ---
echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
