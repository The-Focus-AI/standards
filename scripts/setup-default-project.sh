#!/usr/bin/env bash
set -euo pipefail

usage() {
	cat <<'EOF'
Usage: scripts/setup-default-project.sh [TARGET_DIR] [--force] [--no-install]

Sets up TheFocus.AI default project files in TARGET_DIR.
If TARGET_DIR is omitted, the current directory is used.

Creates/updates:
  mise.toml
  .pi/settings.json
  skills-lock.json
  AGENTS.md
  docs/agents/issue-workflow.md

By default, existing files are left untouched. Use --force to overwrite.
Then the script runs:
  mise trust
  mise install
  mise run setup
  mise run install

Use --no-install to only copy files.
EOF
}

TARGET="."
FORCE=0
DO_INSTALL=1

while [[ $# -gt 0 ]]; do
	case "$1" in
	-h | --help)
		usage
		exit 0
		;;
	--force)
		FORCE=1
		shift
		;;
	--no-install)
		DO_INSTALL=0
		shift
		;;
	*)
		TARGET="$1"
		shift
		;;
	esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_DIR="$ROOT_DIR/templates/default-project"
TARGET_DIR="$(mkdir -p "$TARGET" && cd "$TARGET" && pwd)"

copy_file() {
	local src="$1"
	local dest="$2"
	mkdir -p "$(dirname "$dest")"
	if [[ -e "$dest" && "$FORCE" != "1" ]]; then
		echo "skip existing: ${dest#$TARGET_DIR/}"
		return 0
	fi
	cp "$src" "$dest"
	echo "wrote: ${dest#$TARGET_DIR/}"
}

run_if_available() {
	local cmd="$1"
	shift
	if command -v "$cmd" >/dev/null 2>&1; then
		"$cmd" "$@"
	else
		echo "warn: $cmd not found; skipped: $cmd $*"
		return 127
	fi
}

echo "==> Setting up TheFocus.AI default project files in $TARGET_DIR"

copy_file "$TEMPLATE_DIR/mise.toml" "$TARGET_DIR/mise.toml"
copy_file "$TEMPLATE_DIR/.pi/settings.json" "$TARGET_DIR/.pi/settings.json"
copy_file "$TEMPLATE_DIR/skills-lock.json" "$TARGET_DIR/skills-lock.json"
copy_file "$TEMPLATE_DIR/AGENTS.md" "$TARGET_DIR/AGENTS.md"
copy_file "$TEMPLATE_DIR/docs/agents/issue-workflow.md" "$TARGET_DIR/docs/agents/issue-workflow.md"

mkdir -p "$TARGET_DIR/.pi/sessions" "$TARGET_DIR/docs/agents"

if [[ "$DO_INSTALL" == "1" ]]; then
	echo "==> Running mise bootstrap"
	if command -v mise >/dev/null 2>&1; then
		(
			cd "$TARGET_DIR"
			mise trust
			mise install
			mise run setup
			mise run install
		)
	else
		cat <<'EOF'
warn: mise not found; copied files but skipped installation.
Install mise, then run in the target project:
  mise trust
  mise install
  mise run setup
  mise run install
EOF
	fi
else
	echo "==> Skipped install because --no-install was passed"
fi

cat <<EOF
==> Done

Next checks:
  cd "$TARGET_DIR"
  mise tasks
  npx skills list || true

Review docs/agents/issue-workflow.md if this project does not use GitHub Issues.
EOF
