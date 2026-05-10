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

check     "whoami is agent" \
          bash -c 'user=$(docker exec "$1" whoami 2>/dev/null); [ "$user" = "agent" ]' -- "$CONTAINER"

check     "/standards exists" \
          bash -c 'docker exec "$1" test -d /standards' -- "$CONTAINER"

check     "/standards/AGENTS.md readable" \
          bash -c 'docker exec "$1" test -r /standards/AGENTS.md' -- "$CONTAINER"

check     "/app exists and is writable" \
          bash -c 'docker exec "$1" test -d /app && docker exec "$1" test -w /app' -- "$CONTAINER"

check     "/app is empty (no pre-population)" \
          bash -c 'docker exec "$1" bash -c "ls -A /app 2>/dev/null | wc -l | xargs test 0 -eq"' -- "$CONTAINER"

echo ""

# ============================================================
# Step 4: Tool availability
# ============================================================
echo "==> Tool availability"
echo ""

# Tools baked into the image (mise + system packages)
for tool in mise git tmux gh curl bash; do
  check     "$tool is on PATH" \
            bash -c 'docker exec "$1" bash -l -c "command -v '"$tool"'" 2>/dev/null | grep -q .' -- "$CONTAINER"
done

# Tools NOT baked — require `mise install` at runtime
check_not "node NOT on PATH (needs mise install)" \
          bash -c 'docker exec "$1" bash -l -c "command -v node" 2>/dev/null | grep -q .' -- "$CONTAINER"

check_not "fnox NOT on PATH (needs mise install)" \
          bash -c 'docker exec "$1" bash -l -c "command -v fnox" 2>/dev/null | grep -q .' -- "$CONTAINER"

check_not "pi NOT on PATH (needs mise install)" \
          bash -c 'docker exec "$1" bash -l -c "command -v pi" 2>/dev/null | grep -q .' -- "$CONTAINER"

check_not "zsh NOT installed (bash only)" \
          bash -c 'docker exec "$1" bash -l -c "command -v zsh" 2>/dev/null | grep -q .' -- "$CONTAINER"

echo ""

# ============================================================
# Step 5: Mise trust
# ============================================================
echo "==> Mise trust"
echo ""

check     "/standards is trusted by mise" \
          bash -c 'docker exec "$1" bash -l -c "cd /standards && mise trust 2>&1" | grep -q "trusted"' -- "$CONTAINER"

echo ""

# ============================================================
# Step 6: Shell activation
# ============================================================
echo "==> Shell activation"
echo ""

check     ".bashrc has mise activate" \
          bash -c 'docker exec "$1" grep -q "mise activate bash" /home/agent/.bashrc' -- "$CONTAINER"

check     ".bash_profile has mise activate" \
          bash -c 'docker exec "$1" grep -q "mise activate bash" /home/agent/.bash_profile' -- "$CONTAINER"

echo ""

# ============================================================
# Step 7: Dotfiles
# ============================================================
echo "==> Dotfiles"
echo ""

check     "~/.tmux.conf exists" \
          bash -c 'docker exec "$1" test -f /home/agent/.tmux.conf' -- "$CONTAINER"

check     "tmux conf has mouse mode" \
          bash -c 'docker exec "$1" grep -q "set -g mouse on" /home/agent/.tmux.conf' -- "$CONTAINER"

check     "git user.name is TheFocus.AI" \
          bash -c 'docker exec "$1" git config --global user.name 2>/dev/null | grep -q "TheFocus.AI"' -- "$CONTAINER"

check     "git user.email is agent@thefocus.ai" \
          bash -c 'docker exec "$1" git config --global user.email 2>/dev/null | grep -q "agent@thefocus.ai"' -- "$CONTAINER"

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

check_not "/app has no .gitignore (intentionally bare)" \
          bash -c 'docker exec "$1" test -f /app/.gitignore' -- "$CONTAINER"

echo ""

# ============================================================
# Summary
# ============================================================
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
