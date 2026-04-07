# Auditor Memory

## Known Patterns
- sec-review skip: /sec-review deferred across 3+ consecutive sessions despite new code being written each session. Manifests as "MISSED" on Task Board but never executed. | first seen: 2026-04-03 | count: 3

## Resolved Patterns
<!-- Previously active patterns that have been fixed -->

## SOP Revisions Proposed
- Add sec-review trigger to wrap-up checklist: if any script/workflow/auth file was written today and /sec-review not in audit trail, block wrap-up completion | status: pending | 2026-04-05

## Regression Watch List
- sec-review on new code: originally flagged 2026-04-03 | last checked: 2026-04-05 | status: RECURRING — not fixed
