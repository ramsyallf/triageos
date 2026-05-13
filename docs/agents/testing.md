# Testing Expectations

There is no dedicated test script configured yet.

Do not run `pnpm build` or `pnpm lint` after changes by default. Run them only when explicitly requested or when a specific task requires that verification.

For UI changes, manually check task-relevant flows when needed:
- patient entry flow
- triage form generation flow
- session history sidebar
- print layout
- mobile sidebar behavior

For AI or schema changes, verify when relevant that generated or mocked triage notes still satisfy the `TriageNote` type and valid ESI levels.
