#!/usr/bin/env bash
# Integration test: scaffold a project without installing tools or resolving secrets.
# Run: bash tests/test-bootstrap.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET=$(mktemp -d)
cleanup() {
  local status=$?
  if [ "$status" -ne 0 ] && [ -f "$TARGET/task.log" ]; then cat "$TARGET/task.log" >&2; fi
  rm -rf "$TARGET"
  exit "$status"
}
trap cleanup EXIT

fail() { echo "FAIL: $*" >&2; exit 1; }

bash "$ROOT_DIR/scripts/setup-default-project.sh" "$TARGET" --no-install >/dev/null
git -C "$TARGET" init -q

cmp "$ROOT_DIR/scripts/restore-skills.mjs" "$TARGET/scripts/restore-skills.mjs"
for path in mise.toml .pi/settings.json skills-lock.json AGENTS.md .gitignore docs/testing.md .github/workflows/ci.yml; do
  cmp "$ROOT_DIR/templates/default-project/$path" "$TARGET/$path"
done
echo "PASS: scaffold copies the baseline and the single canonical skills restore helper"

for path in .fnox/env .env .env.production web/.env.local .agents/skills/example/SKILL.md .pi/sessions/test.json; do
  if ! git -C "$TARGET" check-ignore -q "$path"; then
    echo "FAIL: scaffold does not ignore $path"
    exit 1
  fi
done
for path in src/index.ts .env.example web/.env.example; do
  if git -C "$TARGET" check-ignore -q "$path"; then
    echo "FAIL: scaffold ignores source or example configuration: $path"
    exit 1
  fi
done
echo "PASS: scaffold ignores secrets and caches, not source or example configuration"

printf '\ncustom-project-cache/\n' >> "$TARGET/.gitignore"
cp "$TARGET/.gitignore" "$TARGET/expected-ignore"
bash "$ROOT_DIR/scripts/setup-default-project.sh" "$TARGET" --no-install >/dev/null
cmp "$TARGET/expected-ignore" "$TARGET/.gitignore"
echo "PASS: repeat bootstrap preserves the project's ignore rules"

# Exercise the real mise entry point with no installed-tool or vault dependency.
MISE="${MISE_BIN:-$(command -v mise)}"
export MISE_AUTO_INSTALL=0
export MISE_TRUSTED_CONFIG_PATHS="$TARGET"
# Keep mise from putting its own op and fnox ahead of the stand-ins used below.
export MISE_DISABLE_TOOLS="op,fnox"
env -u OP_SERVICE_ACCOUNT_TOKEN "$MISE" --cd "$TARGET" run --skip-tools setup > "$TARGET/setup.log" 2>&1
grep -q 'No fnox configuration yet' "$TARGET/setup.log"
echo "PASS: a project without fnox needs no bootstrap token"

touch "$TARGET/fnox.toml"

# The root repository still only checks that a token was injected.
cp "$TARGET/mise.toml" "$TARGET/template-mise.toml"
cp "$ROOT_DIR/mise.toml" "$TARGET/mise.toml"
if env -u OP_SERVICE_ACCOUNT_TOKEN "$MISE" --cd "$TARGET" run --skip-tools setup > "$TARGET/setup.log" 2>&1; then
  echo "FAIL: root setup accepted a missing bootstrap token"
  exit 1
fi
grep -q 'cloud secret settings' "$TARGET/setup.log"
for attempt in 1 2; do
  OP_SERVICE_ACCOUNT_TOKEN=bootstrap-test-token "$MISE" --cd "$TARGET" run --skip-tools setup > "$TARGET/setup.log" 2>&1
  grep -q 'Bootstrap token is available' "$TARGET/setup.log"
done
if [ -e "$TARGET/.fnox" ] || grep -RFq bootstrap-test-token "$TARGET"; then
  echo "FAIL: root setup wrote the injected token or created a credential directory"
  exit 1
fi
echo "PASS: root setup rejects a missing token and accepts an injected token without printing or persisting it"
mv "$TARGET/template-mise.toml" "$TARGET/mise.toml"

# The template's setup checks that the token reads the vault and repairs a
# person's own machine. Stand in for 1Password and fnox so no vault is needed:
# the fake vault accepts only tokens named in FAKE_OP_GOOD_TOKENS, and a
# personal sign-in exists only when FAKE_OP_SAVED_TOKEN is set.
FAKE_BIN="$(mktemp -d)"
cat > "$FAKE_BIN/op" <<'FAKE'
#!/bin/sh
case "$1 $2" in
  "vault get")
    for good in $FAKE_OP_GOOD_TOKENS; do
      [ "${OP_SERVICE_ACCOUNT_TOKEN:-}" = "$good" ] && exit 0
    done
    exit 1 ;;
  "read "*)
    [ -n "${FAKE_OP_SAVED_TOKEN:-}" ] || exit 1
    printf '%s' "$FAKE_OP_SAVED_TOKEN" ;;
  *) exit 1 ;;
esac
FAKE
printf '#!/bin/sh\nexit 0\n' > "$FAKE_BIN/fnox"
chmod +x "$FAKE_BIN/op" "$FAKE_BIN/fnox"
run_setup() {
  PATH="$FAKE_BIN:$PATH" FAKE_OP_GOOD_TOKENS="good-test-token saved-test-token" \
    "$MISE" --cd "$TARGET" run --skip-tools setup > "$TARGET/setup.log" 2>&1
}
git -C "$TARGET" rev-parse --git-dir >/dev/null 2>&1 || git -C "$TARGET" init -q

if env -u OP_SERVICE_ACCOUNT_TOKEN -u FAKE_OP_SAVED_TOKEN PATH="$FAKE_BIN:$PATH" \
    "$MISE" --cd "$TARGET" run --skip-tools setup > "$TARGET/setup.log" 2>&1; then
  echo "FAIL: template setup succeeded with no token and no sign-in"
  exit 1
fi
grep -q 'cloud secret settings' "$TARGET/setup.log"
[ ! -e "$TARGET/.fnox" ]
echo "PASS: template setup explains what to fix when no token can be obtained"

for attempt in 1 2; do
  OP_SERVICE_ACCOUNT_TOKEN=good-test-token run_setup
  grep -q 'can read the project vault' "$TARGET/setup.log"
done
if [ -e "$TARGET/.fnox" ] || grep -RFq good-test-token "$TARGET"; then
  echo "FAIL: template setup wrote a working injected token or created a credential directory"
  exit 1
fi
echo "PASS: template setup leaves a working injected token alone without printing or persisting it"

if OP_SERVICE_ACCOUNT_TOKEN=stale-test-token run_setup; then
  echo "FAIL: template setup accepted a token that cannot read the vault"
  exit 1
fi
[ ! -e "$TARGET/.fnox" ]
echo "PASS: template setup rejects a stale token when no sign-in can replace it"

OP_SERVICE_ACCOUNT_TOKEN=stale-test-token FAKE_OP_SAVED_TOKEN=saved-test-token run_setup
grep -q 'Token saved to .fnox/env' "$TARGET/setup.log"
[ "$(cat "$TARGET/.fnox/env")" = "OP_SERVICE_ACCOUNT_TOKEN=saved-test-token" ]
case "$(ls -l "$TARGET/.fnox/env")" in -rw-------*) ;; *) echo "FAIL: .fnox/env is not mode 600"; exit 1 ;; esac
if grep -Fq saved-test-token "$TARGET/setup.log" || [ -n "$(git -C "$TARGET" status --porcelain -- .fnox)" ]; then
  echo "FAIL: template setup printed the fetched token or left it visible to git"
  exit 1
fi
echo "PASS: template setup replaces a stale token from a personal sign-in into an ignored mode-600 file"

rm -rf "$TARGET/.fnox"
printf '\n!.fnox/\n!.fnox/env\n' >> "$TARGET/.gitignore"
if env -u OP_SERVICE_ACCOUNT_TOKEN FAKE_OP_SAVED_TOKEN=saved-test-token PATH="$FAKE_BIN:$PATH" \
    FAKE_OP_GOOD_TOKENS="saved-test-token" "$MISE" --cd "$TARGET" run --skip-tools setup > "$TARGET/setup.log" 2>&1; then
  echo "FAIL: template setup wrote a token to a path git does not ignore"
  exit 1
fi
grep -q 'not ignored by git' "$TARGET/setup.log"
[ ! -e "$TARGET/.fnox/env" ]
cp "$TARGET/expected-ignore" "$TARGET/.gitignore"
rm -rf "$TARGET/.fnox" "$FAKE_BIN"
unset MISE_DISABLE_TOOLS
echo "PASS: template setup refuses to write a token git would not ignore"

# A brief is data, not shell code. Prompt emission must not scaffold or install.
cat > "$TARGET/brief with spaces.md" <<'EOF'
A client-isolated TypeScript CLI; no deployment and no app tests exist yet.
Literal input: $(touch handoff-executed)
EOF
(
  cd "$TARGET"
  bash "$ROOT_DIR/scripts/setup-default-project.sh" "new target" \
    --brief "$TARGET/brief with spaces.md" --emit-prompt > handoff.txt
)
test ! -e "$TARGET/new target" || fail "prompt emission created the target"
test ! -e "$TARGET/handoff-executed" || fail "prompt emission executed the brief"
grep -Fq 'Literal input: $(touch handoff-executed)' "$TARGET/handoff.txt"
grep -Fq '===== BEGIN skills/setup-project/SKILL.md =====' "$TARGET/handoff.txt"
grep -Fq '===== BEGIN scripts/restore-skills.mjs =====' "$TARGET/handoff.txt"
grep -Fq '===== BEGIN templates/default-project/mise.toml =====' "$TARGET/handoff.txt"
for args in '--emit-prompt' '--brief' '--unknown'; do
  if bash "$ROOT_DIR/scripts/setup-default-project.sh" "$TARGET/invalid" "$args" > "$TARGET/invalid.log" 2>&1; then
    fail "accepted invalid arguments: $args"
  fi
done
test ! -e "$TARGET/invalid" || fail "invalid arguments created the target"
if bash "$ROOT_DIR/scripts/setup-default-project.sh" "$TARGET/invalid" \
  --brief "$TARGET/brief with spaces.md" > "$TARGET/invalid.log" 2>&1; then
  fail "accepted --brief without --emit-prompt"
fi
echo "PASS: brief handoff is complete, read-only, literal, and validates arguments"

# Stub only external commands; execute the real mise tasks under mise's default
# /bin/sh. These fixtures test task orchestration, not a fabricated application.
export REAL_NODE="$(command -v node)"
export CALLS="$TARGET/calls.log"
export PROMPT_CAPTURE="$TARGET/generated-prompt.md"
mkdir -p "$TARGET/bin"
cat > "$TARGET/bin/pnpm" <<'EOF'
#!/usr/bin/env node
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.CALLS, `pnpm ${args.join(' ')}\n`);
if (args[0] === 'install') process.exit(Number(process.env.INSTALL_EXIT || 0));
if (args[0] !== 'run' || args.length !== 2) process.exit(92);
const command = JSON.parse(fs.readFileSync('package.json')).scripts?.[args[1]];
if (!command) process.exit(93);
process.exit(spawnSync(command, { shell: true, stdio: 'inherit' }).status ?? 94);
EOF
cat > "$TARGET/bin/node" <<'EOF'
#!/bin/sh
if [ "$1" = scripts/restore-skills.mjs ]; then
  printf 'node %s\n' "$1" >> "$CALLS"
  exit "${RESTORE_EXIT:-0}"
fi
exec "$REAL_NODE" "$@"
EOF
cat > "$TARGET/bin/mise" <<'EOF'
#!/bin/sh
printf 'mise %s\n' "$*" >> "$CALLS"
EOF
cat > "$TARGET/bin/pi" <<'EOF'
#!/bin/sh
echo 'pi fixture invoked' >&2
printf '%s\n' "${4-}" > "$PROMPT_CAPTURE"
exit 7
EOF
cat > "$TARGET/bin/jq" <<'EOF'
#!/bin/sh
cat >/dev/null
EOF
for tool in fnox op docker curl npx; do
  cat > "$TARGET/bin/$tool" <<'EOF'
#!/bin/sh
echo "unexpected external command: $0" >> "$CALLS"
exit 95
EOF
done
chmod +x "$TARGET/bin/"*
export PATH="$TARGET/bin:$PATH"
# --skip-tools skips installation, not PATH activation. Put fixture commands
# ahead of mise-managed tools and verify that isolation before running tasks.
cat > "$TARGET/mise.local.toml" <<'EOF'
[env]
_.path = ["bin"]
EOF
for tool in node pnpm pi jq; do
  resolved=$("$MISE" --cd "$TARGET" exec -- sh -c "command -v $tool")
  [ "$resolved" = "$TARGET/bin/$tool" ] || fail "fixture isolation failed for $tool"
done

run_task() {
  env -u OP_SERVICE_ACCOUNT_TOKEN "$MISE" --cd "$TARGET" run --skip-tools "$@" > "$TARGET/task.log" 2>&1
}
expect_task_failure() {
  if run_task "$@"; then fail "task unexpectedly passed: $*"; fi
}

# Normal bootstrap delegates installs only, not runtime credential setup.
: > "$CALLS"
bash "$ROOT_DIR/scripts/setup-default-project.sh" "$TARGET/installed target" >/dev/null
printf 'mise trust\nmise install\nmise run install\n' > "$TARGET/expected-calls"
cmp "$TARGET/expected-calls" "$CALLS"
echo "PASS: bootstrap is thin and does not require runtime credentials"

cp "$ROOT_DIR/templates/default-project/mise.toml" "$TARGET/mise.toml"
for task in lint test deploy; do
  expect_task_failure "$task"
  grep -q 'No .*configured' "$TARGET/task.log"
done
printf '{"scripts":{}}\n' > "$TARGET/package.json"
for task in lint test; do expect_task_failure "$task"; done
printf '{"scripts":{"lint":"exit 0","test":"exit 0","build":"exit 0"}}\n' > "$TARGET/package.json"
for task in lint test; do run_task "$task"; done
expect_task_failure deploy
printf '{"scripts":{"lint":"exit 17","test":"exit 18"}}\n' > "$TARGET/package.json"
for task in lint test; do expect_task_failure "$task"; done
echo "PASS: unconfigured checks fail, real script statuses propagate, and a build is not deployment"

for lock in absent present; do
  if [ "$lock" = present ]; then printf 'lock fixture\n' > "$TARGET/pnpm-lock.yaml"; fi
  : > "$CALLS"
  run_task install
  if [ "$lock" = present ]; then
    printf 'pnpm install --frozen-lockfile\n' > "$TARGET/expected-calls"
  else
    printf 'pnpm install --no-frozen-lockfile\n' > "$TARGET/expected-calls"
  fi
  printf 'node scripts/restore-skills.mjs\n' >> "$TARGET/expected-calls"
  cmp "$TARGET/expected-calls" "$CALLS"
done
cp "$TARGET/pnpm-lock.yaml" "$TARGET/expected-lock"
: > "$CALLS"
INSTALL_EXIT=23 expect_task_failure install
printf 'pnpm install --frozen-lockfile\n' > "$TARGET/expected-calls"
cmp "$TARGET/expected-calls" "$CALLS"
cmp "$TARGET/expected-lock" "$TARGET/pnpm-lock.yaml"
RESTORE_EXIT=24 expect_task_failure install
rm "$TARGET/package.json" "$TARGET/pnpm-lock.yaml"
: > "$CALLS"
run_task install
printf 'node scripts/restore-skills.mjs\n' > "$TARGET/expected-calls"
cmp "$TARGET/expected-calls" "$CALLS"
echo "PASS: frozen installs never fall back; new manifests can create locks; restore failures propagate"

cp "$ROOT_DIR/mise.toml" "$TARGET/mise.toml"
: > "$CALLS"
run_task install
cmp "$TARGET/expected-calls" "$CALLS"
RESTORE_EXIT=24 expect_task_failure install
expect_task_failure deploy
grep -q 'No deployment performed' "$TARGET/task.log"
mkdir -p "$TARGET/recipes"
cp "$ROOT_DIR/recipes/generate-dockerfile.md" "$TARGET/recipes/"
expect_task_failure generate:dockerfile
grep -q 'pi fixture invoked' "$TARGET/task.log"
cmp "$ROOT_DIR/recipes/generate-dockerfile.md" "$PROMPT_CAPTURE"
echo "PASS: root install uses the canonical helper, deploy refuses, and generator preserves upstream failure with Bash pipefail"

# Repeat runs preserve project-specific helper changes; --force is explicit.
printf '// project customization\n' >> "$TARGET/scripts/restore-skills.mjs"
cp "$TARGET/scripts/restore-skills.mjs" "$TARGET/expected-helper"
bash "$ROOT_DIR/scripts/setup-default-project.sh" "$TARGET" --no-install >/dev/null
cmp "$TARGET/expected-helper" "$TARGET/scripts/restore-skills.mjs"
bash "$ROOT_DIR/scripts/setup-default-project.sh" "$TARGET" --no-install --force >/dev/null
cmp "$ROOT_DIR/scripts/restore-skills.mjs" "$TARGET/scripts/restore-skills.mjs"
echo "PASS: existing files are preserved unless overwrite is explicitly requested"

grep -q '^# Generated from recipes/generate-dockerfile.md' "$ROOT_DIR/Dockerfile"
if grep -Eq -- '-v ~/.pi:|prompts/setup-project.md' "$ROOT_DIR/Dockerfile"; then
  fail "Docker runtime instructions contain personal auth mounts or stale paths"
fi
echo "PASS: Docker runtime instructions identify their generator without a personal-auth mount"
