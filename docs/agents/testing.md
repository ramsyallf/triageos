# Testing Expectations

There is no dedicated test script configured yet.

Do not run build or lint automatically after changes. The user will run these manually:
- `bun run build`
- `bun run lint`

For UI changes, manually check task-relevant flows when needed:
- patient entry flow
- triage form generation flow
- session history sidebar
- print layout
- mobile sidebar behavior

For AI or schema changes, verify when relevant that generated or mocked triage notes still satisfy the `TriageNote` type and valid ESI levels.
