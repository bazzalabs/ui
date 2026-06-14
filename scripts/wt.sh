#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bun run wt new <branch> [--from <ref>] [--release stable|canary|rc] [--no-install]
  bun run wt rm <slug> [--force]
  bun run wt ls

Environment:
  WT_BASE  Override the worktree directory. Defaults to ../ui.worktrees.

Examples:
  bun run wt new plan-001-fix-tabs
  bun run wt new pr-123 --from main --release stable
  bun run wt rm plan-001-fix-tabs
EOF
}

repo_root() {
  git rev-parse --show-toplevel
}

primary_worktree() {
  git worktree list --porcelain | awk '/^worktree / { sub(/^worktree /, ""); print; exit }'
}

slugify() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | tr '/ _' '---' \
    | sed -E 's/[^a-z0-9.-]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g'
}

copy_env_file() {
  local source_file=$1
  local dest_file=$2

  if [[ -f "$source_file" ]]; then
    cp "$source_file" "$dest_file"
    chmod 600 "$dest_file" 2>/dev/null || true
  fi
}

set_release_type() {
  local file=$1
  local release=$2

  if [[ ! -f "$file" ]]; then
    return 0
  fi

  if grep -q '^NEXT_PUBLIC_RELEASE_TYPE=' "$file"; then
    sed -i.bak -E "s/^NEXT_PUBLIC_RELEASE_TYPE=.*/NEXT_PUBLIC_RELEASE_TYPE=\"$release\"/" "$file"
    rm -f "$file.bak"
  else
    printf '\nNEXT_PUBLIC_RELEASE_TYPE="%s"\n' "$release" >>"$file"
  fi
}

cmd_new() {
  local branch=${1:-}
  shift || true

  if [[ -z "$branch" ]]; then
    usage
    exit 1
  fi

  local from_ref=HEAD
  local release_type=
  local install=1

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --from)
        from_ref=${2:-}
        shift 2
        ;;
      --release)
        release_type=${2:-}
        shift 2
        ;;
      --no-install)
        install=0
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        echo "Unknown option: $1" >&2
        usage
        exit 1
        ;;
    esac
  done

  case "$release_type" in
    ""|stable|canary|rc) ;;
    *)
      echo "--release must be one of: stable, canary, rc" >&2
      exit 1
      ;;
  esac

  local root
  root=$(repo_root)
  local source_root
  source_root=$(primary_worktree)
  local base=${WT_BASE:-"$(dirname "$root")/ui.worktrees"}
  local slug
  slug=$(slugify "$branch")
  local dest="$base/$slug"

  if [[ -z "$slug" ]]; then
    echo "Could not derive a worktree slug from branch: $branch" >&2
    exit 1
  fi

  if [[ ${#slug} -gt 63 ]]; then
    echo "Warning: slug is longer than 63 chars; browsers/DNS may reject the portless subdomain." >&2
    echo "Slug: $slug" >&2
  fi

  if [[ -e "$dest" ]]; then
    echo "Worktree path already exists: $dest" >&2
    exit 1
  fi

  mkdir -p "$base"

  if git show-ref --verify --quiet "refs/heads/$branch"; then
    git worktree add "$dest" "$branch"
  else
    git worktree add -b "$branch" "$dest" "$from_ref"
  fi

  copy_env_file "$source_root/.env.local" "$dest/.env.local"
  copy_env_file "$source_root/apps/web/.env.local" "$dest/apps/web/.env.local"

  if [[ -n "$release_type" ]]; then
    set_release_type "$dest/apps/web/.env.local" "$release_type"
  fi

  if [[ "$install" == "1" ]]; then
    (cd "$dest" && bun install)
  fi

  cat <<EOF

Created worktree: $dest
Branch: $branch
Web URL: https://$slug.bazza-ui.localhost

Open in Zed:
  zed $dest

Start web dev server:
  cd $dest && bun run dev --filter web
EOF
}

cmd_rm() {
  local slug=${1:-}
  shift || true

  if [[ -z "$slug" ]]; then
    usage
    exit 1
  fi

  local force=
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --force|-f)
        force=--force
        shift
        ;;
      *)
        echo "Unknown option: $1" >&2
        usage
        exit 1
        ;;
    esac
  done

  local root
  root=$(repo_root)
  local base=${WT_BASE:-"$(dirname "$root")/ui.worktrees"}
  local dest="$base/$(slugify "$slug")"

  git worktree remove $force "$dest"
}

cmd_ls() {
  git worktree list
}

case "${1:-}" in
  new)
    shift
    cmd_new "$@"
    ;;
  rm|remove)
    shift
    cmd_rm "$@"
    ;;
  ls|list)
    cmd_ls
    ;;
  -h|--help|"")
    usage
    ;;
  *)
    echo "Unknown command: $1" >&2
    usage
    exit 1
    ;;
esac
