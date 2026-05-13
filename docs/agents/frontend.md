# Frontend Conventions

Use React 18, Vite, TypeScript, Tailwind CSS, and `lucide-react`.

Preserve the current product tone: clinical, compact, Indonesian-language UI for IGD staff.

Prefer existing local UI components in `src/components/ui/` before adding new shared primitives.

Keep patient-entry, triage, history, print, speech, image upload, and AI-generation concerns separated by their existing folders.

Use `~/*` imports for source files.

Maintain responsive behavior for the sidebar, patient entry flow, triage form, and print layout.
