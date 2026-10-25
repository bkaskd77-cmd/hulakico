# Rebuilding Hulakico from a local backup

Everything needed is in a backup folder made by `tools/backup-local.sh`
(default `C:\Users\bkask\Hulakico-Backups\<date>\`). It contains:

| File / folder | What it is |
|---|---|
| `hulakico.bundle` | The whole git repository: every commit and branch. |
| `uncommitted.patch` | Changes on the PC that were not committed yet (may be empty). |
| `server/web.env.production`, `server/intelligence.env.production` | **Secrets.** Database, email, storage and service keys. Keep this folder private. |
| `server/hulakico.caddy`, `server/Caddyfile` | Web server (HTTPS) config on the VPS. |
| `server/hulakico-deploy`, `server/hulakico-autodeploy`, `server/hulakico-autodeploy.*` | Deploy script, auto-deploy script, and its systemd service and timer. |
| `database/` | Put the newest database backup here (Admin → Team → *Download latest backup*). |
| `claude/` | Claude Code memory and chat transcripts for this project. |

## Accounts the system uses

GitHub (code, CI), Hostinger VPS 31.97.177.207 (hosting, shared with Softtero), Cloudflare (DNS and proxy for hulakico.com),
Turso (database), Resend (email from info@hulakico.com), Geoapify (address search), Vercel Blob (uploaded images),
UptimeRobot (uptime alerts). The keys for these are in the two `.env.production` files.

## 1. Code

```bash
git clone hulakico.bundle hulakico
cd hulakico
git apply ../uncommitted.patch   # only if the patch is not empty
```

To put it back on GitHub: create an empty repository, then `git remote set-url origin <new url>` and `git push --all origin`.
Re-create the `main` ruleset: required checks `web`, `intelligence`, `images`; block force pushes.

## 2. Server (new VPS or rebuilt one)

1. Ubuntu 24.04 with Docker and Caddy installed. Create user `hulakico`, put the repo at `/srv/hulakico` owned by it.
2. Copy `server/web.env.production` to `/srv/hulakico/apps/web/.env.production` and
   `server/intelligence.env.production` to `/srv/hulakico/services/intelligence/.env.production` (`chmod 600`).
3. `cd /srv/hulakico/apps/web/deploy && docker compose -p hulakico up -d --build` → the site answers on `127.0.0.1:3201`.
4. Copy `server/hulakico.caddy` to `/etc/caddy/sites-available/`, link it into `sites-enabled/`, `caddy validate`, then reload Caddy.
   On the shared VPS, never touch the Softtero site files.
5. Auto-deploy: copy `hulakico-deploy` and `hulakico-autodeploy` to `/usr/local/sbin/` (root-owned, `chmod 755`),
   the `.service` and `.timer` to `/etc/systemd/system/`, then `systemctl enable --now hulakico-autodeploy.timer`.
   Sudo rule (`visudo -f /etc/sudoers.d/hulakico`): `hulakico ALL=(root) NOPASSWD: /usr/local/sbin/hulakico-deploy`

## 3. DNS

Cloudflare: `A` records for `hulakico.com` and `www` → the VPS IP, **proxied**; SSL/TLS mode **Full (strict)**.
Caddy only accepts traffic from Cloudflare, so the proxy must stay on.

## 4. Database

Only if the Turso database itself is lost:

1. Create a new Turso database (an EU region is closest to the VPS) and a token; put both in `web.env.production`
   (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) and restart the web container. The app creates all tables on start.
2. From `apps/web`, load the newest backup into it:

```bash
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/restore-db.mjs ../../database/hulakico-YYYY-MM-DD.json.gz
```

The script refuses a database that already has users or shipments, so it cannot overwrite live data.

## 5. Check

`https://hulakico.com/api/health` should show `"ok":true`, the database and AI service `up`, and a backup within a day.
Sign in to Admin (password and authenticator code) and open a shipment.
