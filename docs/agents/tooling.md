# Tooling and Commands

Use `pnpm` as the package manager. `package-lock.json` has been removed intentionally; do not recreate it.

Prefix shell commands with `rtk`.

Imports may use the `~/*` alias for `src/*`.

The project is strict TypeScript with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` enabled.
