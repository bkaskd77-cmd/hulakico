# Universal Architecture & Safety Rules

## 1. Modular Architecture & Separation of Concerns
- **File Length Limit:** Never write any single application file longer than 150 lines of code. (Exemption: Database schema files, lock files, and centralized config files).
- **Separation of Layer Responsibilities:**
  - **UI Layer:** Visual layout and user interactions ONLY. No direct database queries or heavy calculations inside UI components.
  - **Business Logic Layer:** Data validation, permission checks, calculations, and rules. Must be isolated in separate utility functions.
  - **Data / API Layer:** Direct database queries, external API fetches, and authentication handlers ONLY.
- **Single Responsibility:** Every function must do exactly one thing.

## 2. Phase-Based Execution Protocol
- Always check `PLAN.md` before writing code.
- Only execute the single phase or task explicitly requested by the user.
- **Do not modify more than 3 files per prompt.** Once 3 files are edited, stop and wait for the user to test and verify on localhost before proceeding.

## 3. Zero-Breakage & Safety Guardrails
- **Zero Placeholders:** NEVER write `// TODO`, `// existing code`, or `// rest of code`. Every function you output must be 100% complete.
- **Scope Lock:** Do not refactor, reformat, or "clean up" unrelated files or functions. Touch ONLY the specific code required for the active task.
- **Config Lock:** Never modify or delete environment files (`.env`), configuration files, or package locks without explicit user confirmation.
- **Verify Dependencies:** Before importing any external library, verify it exists in `package.json`.

## 4. Easy Debugging & Fault Tolerance
- **Explicit Error Logging:** Every database call, API fetch, or complex calculation must be wrapped in a `try/catch` block that logs the exact file name, function name, and error message to the console.
- **Predictable Error Returns:** Never let a function fail silently or return `null` without an accompanying error message describing why it failed.

## 5. Workflow Verification
- After completing a task, provide:
  1. A concise summary of the exact files modified.
  2. The exact command for the user to run to test the changes on localhost.
  3. A reminder for the user to commit changes (`git commit`) before moving to the next phase.

## 6. Universal Security Guardrails
- **Zero Secrets in Code:** NEVER hardcode API keys, passwords, database URLs, or secret tokens. All sensitive values must be stored in `.env` and accessed via environment variables.
- **No Auth Bypasses:** NEVER delete, comment out, or weaken authentication middleware, authorization checks, or CORS settings to make an error or test pass.
- **Sanitize Inputs:** All user input coming from forms, URL params, or API payloads must be validated and sanitized before reaching the database (use parameterized ORM queries to prevent SQL injection).
- **Never Log Sensitive Data:** Never print passwords, credit card numbers, JWT tokens, or full user profile payloads in `console.log` statements.
