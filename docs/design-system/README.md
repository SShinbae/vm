# Design System

> **The design system is documented in Notion, not here.**
>
> 👉 **[Design System - Single Source of Truth](https://app.notion.com/p/3d571adddf1081deb516f32e693152df)**
> (in the 🤠 Vehicles Management Docu database)

That page is authoritative for tokens, theming, elevation, motion, icons, and the
rules for new UI code. This file is deliberately a pointer and not a copy —
duplicating the content is what produced the drift described below.

---

## The one thing to know

The repo contains **four** token layers. Only one is canonical:

| Layer                                   | Path                                          | Status                            |
| --------------------------------------- | --------------------------------------------- | --------------------------------- |
| `src/design-system/`                    | tokens + themes, via `react-native-unistyles` | ✅ **CANONICAL**                  |
| `constants/theme.ts`                    | `Colors` / `Fonts`                            | ⚠️ Legacy — ~69 files still on it |
| `lib/design-system/`                    | atomic-design component library               | ❌ Abandoned — 2 consumers        |
| `src/design-system/unistyles.config.ts` | duplicate registration                        | 🗑️ Deleted                        |

Consume the canonical layer like this:

```tsx
import { createStyleSheet, useStyles } from "react-native-unistyles";

const { styles, theme } = useStyles(stylesheet);

const stylesheet = createStyleSheet((theme) => ({
  card: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
  },
}));
```

Themes are registered by the root `unistyles.ts` side-effect import in
`app/_layout.tsx`.

**Do not import from `@/lib/design-system`.** Earlier revisions of this file
taught that import; it points at the abandoned layer.

## Other files in this folder

- `getting-started.md` — superseded, documents the abandoned `lib/` layer
- `PHASE_6_MIGRATION_PLAN.md` — stalled, but its screen inventory is still useful
- `components/`, `migrations/` — notes for the abandoned `lib/` layer
