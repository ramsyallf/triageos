# Testing Expectations

There is no dedicated test script configured yet.

For most code changes, run:
- `rtk pnpm build`
- `rtk pnpm lint`

For UI changes, also manually check:
- patient entry flow
- triage form generation flow
- session history sidebar
- print layout
- mobile sidebar behavior

For AI or schema changes, verify that generated or mocked triage notes still satisfy the `TriageNote` type and valid ESI levels.
