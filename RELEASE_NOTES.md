# Release Notes — plan-do-launch-portfolio

Version: v2026.03.25
Date: 2026-03-25

Summary
- Short: maintenance and reliability fixes to the public site and the onboarding assessment flow. This release restores styling, fixes clean-URL behavior, adds a custom 404, and resolves Cloudflare caching/mime issues.

Notable changes
- Added `404.html` at repository root to provide a custom 404 experience when pages are missing.
- Converted internal references and client redirects to use extensionless (clean) URLs to avoid Cloudflare redirect inconsistencies.
- Restored and rebuilt `assets/css/styles.min.css` (previously deployed empty) and verified it serves a non-zero payload and correct `Content-Type`.
- Identified and preserved script-bound DOM hooks used by the assessment flow: `.assessment-answer`, `.assessment-input`, and `#report` (do not remove these without updating `assets/js/assessment.js`).
- Confirmed `assets/js/assessment.js` is the canonical assessment script: it persists answers to `localStorage`, renders the report on the `complete` page, and posts to `https://assessment.plandolaunch.com/api/complete-assessment`.
- Purged Cloudflare cache and verified fresh content served; fixed a Cloudflare MIME/caching issue discovered during diagnosis.

- Added a new 5-part blog series: "Failure Patterns" under the `blog/` folder (see `blog/*.html`).

Files changed / added
- Added: `404.html`
- Updated: multiple `assessment/*.html` pages (redirects/links to extensionless URLs)
- Updated: `assets/css/styles.min.css` (restored/rebuilt)
- Verified: `assets/js/assessment.js` (no breaking changes)
- Added: `README.md` and `RELEASE_NOTES.md` (this file)

Verification steps (quick)
1. Confirm git commit: `git -C plan-do-launch-portfolio rev-parse --short HEAD`
2. Confirm branch: `git -C plan-do-launch-portfolio branch --show-current`
3. Asset checks (HTTP):
   - `curl -I https://plandolaunch.com/assets/css/styles.min.css`  # expect `Content-Type: text/css` and `CF-Cache-Status: MISS` or `HIT` depending on timing
   - `curl -I https://plandolaunch.com/assessment/section-one`    # expect HTTP 200
   - `curl -I https://plandolaunch.com/this-page-does-not-exist.html` # expect HTTP 404 with body `404.html`

Rollback instructions
- If you need to revert these changes quickly, consider creating a temporary branch from the previous commit and re-deploying that branch to your Pages/origin. Basic commands:
  - `git -C plan-do-launch-portfolio log --oneline` (find previous commit)
  - `git -C plan-do-launch-portfolio checkout -b rollback/<target-commit> <sha>`
  - Push and set your deployment to use that branch, or restore files from the previous commit and push to main.

Recommended next steps
- Implement asset fingerprinting (e.g., `styles.abcdef.css`) to avoid stale caches.
- Add a deploy step or GitHub Action that purges Cloudflare cache via API after successful deploy.
- Add a CI check that prevents committing empty/minified assets (simple size > N bytes check).

Notes
- Preserve script hooks: before removing or renaming classes used in HTML, search `assets/js` for references to avoid breaking behavior.
- This release uses a date-based versioning scheme (`vYYYY.MM.DD`) to make the snapshot obvious on return.

Contact
- If you want, I can scaffold a GitHub Action for fingerprinting and Cloudflare purge automation.
