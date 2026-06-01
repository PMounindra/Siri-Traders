# Skill: analyze-integration

Summary
- Purpose: Analyze this frontend codebase and verify core flows and integrations work together (install, lint/typecheck, unit tests, build, dev-server smoke tests, and critical user flows like product load, cart, checkout, auth).
- Scope: Workspace-scoped skill for repository-level verification and lightweight integration checks.

Triggers
- "analyze-integration"
- "run integration checks"
- "validate workspace functionality"

Inputs
- `workspacePath` (optional): folder to analyze; defaults to repository root.
- `runInstall` (bool, default: true): whether to run `npm ci`/`npm install`.
- `runBrowserSmoke` (bool, default: true): whether to run headless browser smoke checks.
- `ciMode` (bool, default: false): keep outputs machine-readable for CI.

Outputs
- `analysis-report.md`: human-readable checklist and results summary.
- `analysis-report.json`: machine-readable results with step statuses and logs.
- `artifacts/`: collected logs, failing test outputs, and screenshots from smoke checks (when enabled).

Step-by-step process (implementation guidance for an agent)
1. Discover
   - Read `package.json` to detect scripts (`test`, `build`, `dev`, `lint`, `start`).
   - Detect tooling (Vite, React) from `vite.config.js`, `src/` contents, and `package.json` deps.
2. Environment checks
   - Verify Node version matches `engines` (if present).
   - If `runInstall`, run `npm ci` (preferred) or `npm install` and capture output.
3. Static checks
   - If `lint` or `typecheck` scripts exist, run them. Mark failures.
4. Unit tests
   - Run `npm test` (or `test:unit` if present). Capture test summary and failing tests; abort further steps on catastrophic failures unless `ciMode=false` and user asked to continue.
5. Build
   - Run `npm run build` (or `build` script). Ensure exit code 0 and that an output folder exists (e.g., `dist`).
6. Dev-server smoke (optional)
   - Start `npm run dev` or equivalent on an ephemeral port.
   - Wait for readiness then run headless browser checks (Puppeteer/Playwright): load `/`, load a representative product detail URL, add item to cart, open cart, simulate checkout navigation (no payment), login/signup flows if pages exist.
   - Record screenshots and console errors. Treat JS runtime errors as failures.
7. Integration sanity checks
   - Verify that static assets load (200), API endpoints used by the frontend respond (200) if URL config is present, and that local mocks or env variables are configured.
8. Reporting and suggestions
   - Produce `analysis-report.md` with pass/fail per step, failing command outputs, and recommended fixes (e.g., "Add `test` script" or "Fix failing unit: src/pages/Home.jsx rendering error").

Decision points and branching
- Missing scripts: try common alternatives (e.g., `dev` → `start`, `test` → `test:unit`) before marking as missing.
- Tests failing: by default stop after collecting logs. If `--force` or `ciMode=false` with explicit user consent, continue to collect build and smoke outputs for debugging.
- Network/API dependencies: if external APIs are required and not reachable, mark the step as "blocked" and suggest providing a local mock or env variables.

Quality criteria
- Install: completes with exit code 0.
- Lint/typecheck: zero errors (warnings allowed but reported).
- Tests: all unit tests pass. Failures are reported with stack traces.
- Build: produces artifacts and exits 0.
- Smoke: pages load without uncaught JS exceptions; critical user flows complete without errors.

Failure handling
- Collect failing command stdout/stderr into `artifacts/`.
- Create issues or suggested fixes snippets (optional) for common failures.

Artifacts and outputs (format)
- `analysis-report.md`: short markdown checklist and summary (suitable for human review).
- `analysis-report.json`: schema: { steps: [{name,status,summary,logPath}], metadata: {...} }
- `artifacts/smoke/*.png` and `artifacts/logs/*.log`

Example invocations (prompts)
- "Run analyze-integration over the repo and produce a report."
- "Run integration checks without installing dependencies (skip install)."

Clarifying questions the agent should ask when ambiguous
- "Do you want me to run `npm install` now?" (yes/no)
- "Should I run headless browser smoke tests or skip them?" (recommended for UI regressions)
- "May I open network access to external APIs for smoke tests?" (yes/no)

Related customizations to add next
- `skill:dev-server-manager` — start/stop dev server and collect logs/screenshots.
- `skill:browser-smoke-tests` — reusable Playwright/Puppeteer smoke scenarios for critical flows.
- `AGENTS.md` or `.github/copilot-instructions.md` — short workspace instructions referencing this skill and common run commands.

Notes and principles
- Link, don't embed: prefer linking to existing docs if deeper architecture or contributor guides exist.
- Minimal by default: run only what is available; do not create invasive changes without user consent.
- Concise outputs: reports should be actionable and short.

Contact & feedback
- When the skill is run, the agent should offer a short summary and ask if the user wants fixes applied automatically.
