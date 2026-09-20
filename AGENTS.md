# Agent instructions

This file is the persistent guide for coding agents working in this repository. Follow it on every change. Prefer existing code and conventions once they exist; do not invent extra services, folders, or layers ahead of need.

The intended product is a **web app**: a frontend, an HTTP API, and a database. Keep those layers distinct.

## Architecture

- **Frontend** renders UI, collects input, and calls the API. It does not own business rules, authorization decisions, or direct database access.
- **API** is the only trusted boundary. It authenticates, authorizes, validates, and orchestrates persistence.
- **Database** stores application data. Access it only from the server through the existing data layer (queries, ORM, or repository). Do not add a second persistence path.
- Keep a **single data flow**: UI → API → data store → API → UI. Do not duplicate writes (for example localStorage plus the database) unless the product already requires it.
- Put reusable logic next to its layer: UI helpers with the frontend, domain and auth logic on the server.
- Make small, focused changes. Match naming, file layout, and patterns already in the tree. Do not introduce a new framework or folder structure while an existing one works.
- Configuration belongs in environment variables and server-only config. Never ship secrets, private keys, or connection strings to the client.

## API and data

- Validate and sanitize all untrusted input at the API boundary (body, query, path, headers, uploaded files). Reject invalid input with clear errors; do not persist it.
- Treat every client value as untrusted, including IDs, roles, prices, and “isAdmin” flags. Authorize from the session or token on the server.
- Use parameterized queries or the ORM’s safe APIs. Never concatenate user input into SQL, shell commands, or HTML templates.
- Use least-privilege database credentials. Migrations and schema changes stay explicit and reviewable.
- Do not commit `.env`, credentials, private keys, dumps, or production data. Document required env var *names* only.
- Log enough to debug (request id, user id if known, operation). Do not log passwords, tokens, full payment details, or other secrets.

## Auth and security

- Require authentication on every non-public route. Enforce authorization on every mutating or sensitive read; check the resource belongs to the caller (or the caller has the right role).
- Default-deny: missing auth is a failure, not a pass. Fail closed on auth, CSRF, and session errors.
- Protect against XSS (encode/escape output; avoid `dangerouslySetInnerHTML` / raw HTML unless strictly sanitized), CSRF on cookie-based sessions, and injection (SQL, command, header, template).
- Use HTTPS in production. Set secure cookie flags (`HttpOnly`, `Secure`, `SameSite`) for session cookies. Rotate and expire sessions and tokens.
- Rate-limit auth and other sensitive endpoints when you add them. Do not leak whether an email or user exists in error messages.
- Dependency and upload hygiene: do not add unused packages; treat uploads as untrusted (type, size, storage outside the web root).
- Do not write exploits, exploit PoCs, malware, or attack procedures. Harden and patch only. If asked for a fix and an exploit, provide the fix only.

## Agent workflow

- Read the surrounding code before editing. Reuse existing components, handlers, and types.
- Do not expand scope: no drive-by refactors, extra docs, or new config files unless required for the task.
- After UI, layout, routing, or client-state changes, verify in the browser (or the closest substitute) the main flow plus related pages that share that state.
- Commit and push only when the user explicitly asks.
- Never skip hooks, force-push to `main`, or rewrite published history unless the user explicitly requests it.
