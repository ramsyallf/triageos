# Clinical AI Behavior

Treat AI triage output as clinical decision support, not a final diagnosis.

Generated triage notes must preserve the existing `TriageNote` shape:
- `chiefComplaint`
- `onset`
- `symptoms`
- `riskLevel`
- `esiLevel`
- `suggestedAction`
- `clinicalSummary`
- optional `confidenceScore`

Keep patient-facing and clinician-facing generated text in formal Bahasa Indonesia unless a specific field already allows mixed Indonesian-English clinical terms.

Preserve ESI levels as `1 | 2 | 3 | 4 | 5`.

Handle Gemini/API failures with user-friendly Indonesian error messages.

Do not hard-code real EMR or LIS behavior into demo tool calls; keep mock integrations clearly marked until real backend endpoints exist.
