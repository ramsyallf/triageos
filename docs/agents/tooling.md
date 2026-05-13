# Tooling and Commands

Use `pnpm` as the package manager. Do not update `package-lock.json` unless the project intentionally switches back to npm.

Prefix shell commands with `rtk`.

Useful commands:
- `rtk pnpm dev` starts Vite.
- `rtk pnpm build` runs TypeScript checking through `tsc` and then builds with Vite.
- `rtk pnpm lint` runs ESLint with zero warnings allowed.
- `rtk pnpm preview` previews a production build.

Imports may use the `~/*` alias for `src/*`.

The project is strict TypeScript with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` enabled.
