#!/usr/bin/env bash
# Saves everything needed to rebuild Hulakico onto this PC (see docs/RESTORE.md):
# the full git history, uncommitted work, server secrets and config, Claude memory and chats.
# Run from the repo root in Git Bash:   bash tools/backup-local.sh [destination folder]
# The database file is downloaded separately: Admin → Team → Download latest backup.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y-%m-%d_%H%M)"
DEST="${1:-$HOME/Hulakico-Backups}/$STAMP"
KEY="$HOME/.ssh/hulakico_deploy_ed25519"
HOST="hulakico@31.97.177.207"
CLAUDE_DIR="$HOME/.claude/projects/C--Users-bkask-hulakico"

mkdir -p "$DEST/server" "$DEST/database" "$DEST/claude"
echo "Backing up to $DEST"

# 1. Code: every commit and branch in one file, plus anything not committed yet.
git -C "$REPO" fetch -q origin || echo "  (could not reach GitHub; bundling local history only)"
git -C "$REPO" bundle create "$DEST/hulakico.bundle" --all
git -C "$REPO" bundle verify -q "$DEST/hulakico.bundle"
git -C "$REPO" diff HEAD > "$DEST/uncommitted.patch"
git -C "$REPO" ls-files --others --exclude-standard -z | (cd "$REPO" && xargs -0 -r tar -czf "$DEST/untracked-files.tar.gz")
cp "$REPO/docs/RESTORE.md" "$DEST/RESTORE.md"

# 2. Server: secrets and config, copied without printing them.
copy_remote() { scp -q -i "$KEY" -o BatchMode=yes "$HOST:$1" "$DEST/server/$2" && echo "  server: $2"; }
copy_remote /srv/hulakico/apps/web/.env.production web.env.production
copy_remote /srv/hulakico/services/intelligence/.env.production intelligence.env.production
copy_remote /etc/caddy/sites-available/hulakico.caddy hulakico.caddy
copy_remote /etc/caddy/Caddyfile Caddyfile
copy_remote /usr/local/sbin/hulakico-deploy hulakico-deploy
copy_remote /usr/local/sbin/hulakico-autodeploy hulakico-autodeploy
copy_remote /etc/systemd/system/hulakico-autodeploy.service hulakico-autodeploy.service
copy_remote /etc/systemd/system/hulakico-autodeploy.timer hulakico-autodeploy.timer
chmod 600 "$DEST/server/"*.env.production

# 3. Claude Code memory and chat transcripts for this project.
if [ -d "$CLAUDE_DIR" ]; then
  cp -r "$CLAUDE_DIR/." "$DEST/claude/"
  echo "  claude: $(find "$DEST/claude" -type f | wc -l) files"
fi

echo "Done. Next: Admin → Team → Download latest backup, save it into $DEST/database/"
echo "Keep this folder private (it holds passwords and keys). Copy it to a USB drive or encrypted cloud folder too."
