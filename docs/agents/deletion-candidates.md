# Deletion Candidates

Do not carry these into root `AGENTS.md` because they are redundant, vague, or not project-specific.

Remove stale package-manager guidance:
- `pnpm`
- references to avoiding `package-lock.json` because Bun is now the chosen package manager

Remove RTK examples for unrelated ecosystems:
- `rtk cargo test`
- `rtk pytest -q`

Do not include RTK meta-command documentation unless actively debugging RTK:
- `rtk gain`
- `rtk gain --history`
- `rtk proxy <cmd>`
- `rtk --version`
- `which rtk`

Do not add generic guidance such as:
- write clean code
- be careful
- follow best practices
- use meaningful names
