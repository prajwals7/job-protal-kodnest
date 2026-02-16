# KodNest Premium Build System

A premium SaaS design system for B2C product companies. Calm, intentional, coherent, confident.

---

## Design Philosophy

- **Calm** — No gradients, glassmorphism, neon, or animation noise
- **Intentional** — Every element has purpose; whitespace is part of the design
- **Coherent** — One mind designed it; no visual drift
- **Confident** — Serif headlines, clear hierarchy, no hype language

---

## Color System (Max 4 Colors)

| Token      | Hex       | Use                    |
|------------|-----------|------------------------|
| Background | `#F7F6F3` | Page background        |
| Text       | `#111111` | Primary text           |
| Accent     | `#8B0000` | Primary actions, focus |
| Success    | `#5A7A5A` | Shipped, done states   |
| Warning    | `#A68B5B` | In progress, caution   |

---

## Typography

- **Headings:** Serif (Georgia), large, generous spacing
- **Body:** Sans-serif (Inter), 16–18px, line-height 1.6–1.8
- **Text blocks:** Max width 720px
- No decorative fonts, no random sizes

---

## Spacing Scale (Strict)

Use only: `8px`, `16px`, `24px`, `40px`, `64px`

| Token        | Value |
|--------------|-------|
| `--kn-space-1` | 8px  |
| `--kn-space-2` | 16px |
| `--kn-space-3` | 24px |
| `--kn-space-4` | 40px |
| `--kn-space-5` | 64px |

---

## Global Layout Structure

Every page must follow:

1. **Top Bar** — Project name (left), Progress Step X/Y (center), Status badge (right)
2. **Context Header** — Large serif headline, 1-line subtext
3. **Workspace** — Primary (70%) + Secondary panel (30%)
4. **Proof Footer** — Checklist: □ UI Built □ Logic Working □ Test Passed □ Deployed

---

## Component Rules

- **Primary button:** Solid deep red (`#8B0000`)
- **Secondary button:** Outlined, transparent fill
- **Inputs:** Clean borders, no heavy shadows, clear focus state
- **Cards:** Subtle border, no drop shadows, balanced padding
- **Border radius:** 6px everywhere

---

## Interaction Rules

- Transitions: 150–200ms, ease-in-out
- No bounce, no parallax

---

## Error & Empty States

- **Errors:** Explain what went wrong + how to fix. Never blame the user.
- **Empty states:** Provide next action. Never feel dead.

---

## File Structure

```
kodnest-design-system/
├── index.css        # Entry point (import all)
├── tokens.css       # Colors, typography, spacing
├── base.css         # Reset, typography base
├── layout.css       # Top bar, header, workspace, footer
├── components.css   # Buttons, inputs, cards, badge
├── states.css       # Error, empty states
└── DESIGN-SYSTEM.md # This file
```

---

## Usage

```html
<link rel="stylesheet" href="kodnest-design-system/index.css">
```

---

*KodNest Premium Build System — One mind. One system.*
