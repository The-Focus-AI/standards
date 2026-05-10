#!/usr/bin/env bash
# Integration tests: build the standards agent image, then run checks inside it.
# Run: ./tests/test-dockerfile.sh [--keep] [--verbose]
set -euo pipefail

IMAGE="focus-ai-standards-agent"
KEEP=false
VERBOSE=false

for arg in "$@"; do
  case "$arg" in
    --keep) KEEP=true ;;
    --verbose|-v) VERBOSE=true ;;
  esac
done

cleanup() {
  if [ "$KEEP" = false ]; then
    echo ""
    echo "==> Cleaning up..."
    docker rm -f "$CONTAINER" 2>/dev/null || true
    docker rmi "$IMAGE" 2>/dev/null || true
  else
    echo ""
    echo "==> Kept container=$CONTAINER image=$IMAGE"
  fi
}
trap cleanup EXIT

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

docker_run() {
  if [ "$VERBOSE" = true ]; then
    docker exec "$CONTAINER" bash -l -c "$1" 2>&1
  else
    docker exec "$CONTAINER" bash -l -c "$1" 2>/dev/null
  fi
}

# ============================================================
# Step 1: Build
# ============================================================
echo "==> Building image: $IMAGE"
docker build -t "$IMAGE" . || { echo "BUILD FAILED"; exit 1; }
echo ""

# ============================================================
# Step 2: Start container
# ============================================================
echo "==> Starting container..."
CONTAINER=$(docker run -d --rm "$IMAGE" tail -f /dev/null)
echo "    Container: $CONTAINER"
sleep 2
echo ""

# ============================================================
# Step 3: Identity and filesystem
# ============================================================
echo "==> Identity and filesystem"
echo ""

check     "whoami is worker_user" \
          bash -c 'user=$(docker exec "$1" whoami 2>/dev/null); [ "$user" = "worker_user" ]' -- "$CONTAINER"

check     "/standards exists" \
          bash -c 'docker exec "$1" test -d /standards' -- "$CONTAINER"

check     "/standards/AGENTS.md readable" \
          bash -c 'docker exec "$1" test -r /standards/AGENTS.md' -- "$CONTAINER"

check     "/app exists and is writable" \
          bash -c 'docker exec "$1" test -d /app && docker exec "$1" test -w /app' -- "$CONTAINER"

echo ""

# ============================================================
# Step 4: Tool availability
# ============================================================
echo "==> Tool availability"
echo ""

for tool in mise fnox node git tmux gh zsh curl bash; do
  check     "$tool is on PATH" \
            bash -c 'docker exec "$1" bash -l -c "command -v '"$tool"'" 2>/dev/null | grep -q .' -- "$CONTAINER"
done

echo ""

# ============================================================
# Step 5: Mise tool versions
# ============================================================
echo "==> Mise tools"
echo ""

check     "mise lists node" \
          bash -c 'docker exec "$1" bash -l -c "mise ls node 2>/dev/null | grep -q node"' -- "$CONTAINER"

check     "mise lists fnox" \
          bash -c 'docker exec "$1" bash -l -c "mise ls fnox 2>/dev/null | grep -q fnox"' -- "$CONTAINER"

echo ""

# ============================================================
# Step 6: Shell activation
# ============================================================
echo "==> Shell activation"
echo ""

check     ".bashrc has mise activate" \
          bash -c 'docker exec "$1" grep -q "mise activate bash" /home/worker_user/.bashrc' -- "$CONTAINER"

check     ".bashrc has fnox activate" \
          bash -c 'docker exec "$1" grep -q "fnox activate bash" /home/worker_user/.bashrc' -- "$CONTAINER"

echo ""

# ============================================================
# Step 7: Pi agent
# ============================================================
echo "==> Pi agent"
echo ""

check     "pi is on PATH" \
          bash -c 'docker exec "$1" bash -l -c "command -v pi" 2>/dev/null | grep -q .' -- "$CONTAINER"

check     "pi --version prints" \
          bash -c 'docker exec "$1" bash -l -c "pi --version 2>&1" | grep -q .' -- "$CONTAINER"

echo ""

# ============================================================
# Step 8: Standards repo content
# ============================================================
echo "==> Standards repo content"
echo ""

for file in AGENTS.md mise.toml skills-lock.json README.md Dockerfile .dockerignore; do
  check     "/standards/$file present" \
            bash -c 'docker exec "$1" test -f "/standards/'"$file"'"' -- "$CONTAINER"
done

for dir in best-practices reports prompts tests; do
  check     "/standards/$dir present" \
            bash -c 'docker exec "$1" test -d "/standards/'"$dir"'"' -- "$CONTAINER"
done

echo ""

# ============================================================
# Step 9: Best-practice constraints
# ============================================================
echo "==> Best-practice constraints"
echo ""

check_not "No npm install -g in Dockerfile" \
          bash -c 'docker exec "$1" grep -q "npm install -g" /standards/Dockerfile' -- "$CONTAINER"

check_not "No pip install in Dockerfile" \
          bash -c 'docker exec "$1" grep -q "pip install" /standards/Dockerfile' -- "$CONTAINER"

check     ".gitignore covers .agents" \
          bash -c 'docker exec "$1" grep -q "\.agents" /app/.gitignore' -- "$CONTAINER"

echo ""

# ============================================================
# Summary
# ============================================================
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
