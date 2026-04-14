# Plan Do Launch — Portfolio

Snapshot (latest): 2026-03-25

Purpose
- **Repo:** static portfolio and assessment site for Plan Do Launch.
- **Scope:** public marketing pages plus an onboarding capacity assessment flow under `/assessment`.

Latest work summary
- **Date:** 2026-03-25 — this file records the current snapshot and verification steps so you can recognise the latest work in 30 days.
- **Key fixes applied:** added a custom `404.html`; updated internal links to use extensionless (clean) URLs; restored and rebuilt `assets/css/styles.min.css`; ensured Cloudflare cache was purged so new assets serve correctly.
- **Assessment behavior preserved:** `assets/js/assessment.js` remains the canonical script for the assessment flow. Keep the DOM hooks `.assessment-answer`, `.assessment-input` and `#report` unchanged — they are used by the scripts.

Release notes
- Full notes: `RELEASE_NOTES.md`
- Latest release highlights:
  - Added a static onboarding diagnostic sample report: `assessment/onboarding-diagnostic-sample.html`
  - Added chart source page used by the report: `assessment/chart.html`
  - Added a homepage Founder Credibility link to the sample report: `index.html`
  - Added release/support docs and assets for this rollout (`README.md`, `RELEASE_NOTES.md`, assessment image/favicon assets)

Where to look (important files)
- `assessment/` — pages: `index.html`, `section-one.html` … `section-five.html`, `complete.html`
- `assets/js/assessment.js` — persistence, report rendering, and submission to the assessment API.
- `assets/css/pdl.css`, `assets/css/extracted-styles-1.css`, `assets/css/extracted-styles.css`, `assets/css/styles.min.css`
- `404.html` — custom 404 page at repository root
 - `blog/` — new content: a 5-part blog series titled "Failure Patterns" (see blog/*.html)

Verification & quick checks
- Show current git commit: `git -C plan-do-launch-portfolio rev-parse --short HEAD`
- Confirm pushed branch: `git -C plan-do-launch-portfolio branch --show-current` and `git -C plan-do-launch-portfolio remote -v`
- Live asset check (examples):
  - `curl -I https://plandolaunch.com/assets/css/styles.min.css`  # check `Content-Type` and `CF-Cache-Status`
  - `curl -I https://plandolaunch.com/assessment/section-one`    # should return 200
  - `curl -I https://plandolaunch.com/this-page-does-not-exist.html` # should return 404 and serve `404.html`

Notes & recommended next steps
- Preserve script-bound classes. Before removing any class names from HTML, search `assets/js` for references to avoid breaking behavior.
- Add cache-busting (fingerprinted filenames) for CSS/JS on each deploy to avoid stale Cloudflare caches.
- Consider adding a small CI step/post-deploy action that purges Cloudflare via its API after a successful push.

If you return in 30 days
- Run the git commit check above and compare the date and commit hash to this file's timestamp. If they match, this is the latest snapshot.

Contact
- If you need me to implement cache-busting or a Cloudflare purge action, say which option you prefer and I will scaffold it.
