# Trackerr — UI Design Spec
> Job Application Tracker · Next.js 16 · Design System & Interface Guidelines

---

## 1. Design Philosophy

Trackerr is a personal productivity tool used during a high-stress time — job hunting. The UI should feel **calm, organised, and motivating** — not clinical or overwhelming. Think Notion meets Linear: clean whitespace, subtle colour, clear hierarchy.

**Core principles:**
- Information density without clutter — show everything relevant, hide everything else
- Status-first design — every card/row leads with visual status, not text
- One-action-per-context — the most important action is always obvious
- Optimistic UI — updates feel instant, no spinners on every click

---

## 2. Colour Palette

```
Background      #F9FAFB   (near-white, not pure white)
Surface         #FFFFFF   (cards, modals)
Border          #E5E7EB   (dividers, card edges)
Text Primary    #111827
Text Secondary  #6B7280
Text Muted      #9CA3AF

Accent Blue     #3B82F6   (primary buttons, links, focus rings)
Accent Blue Hover #2563EB

--- Status Colours (pill backgrounds are 15% opacity, text is full) ---
Applied         bg #DBEAFE   text #1D4ED8   dot #3B82F6
Interview       bg #FEF3C7   text #B45309   dot #F59E0B
Offer           bg #D1FAE5   text #065F46   dot #10B981
Rejected        bg #FEE2E2   text #991B1B   dot #EF4444
Ghosted         bg #F3F4F6   text #374151   dot #9CA3AF

--- Stale Warning (>7 days no follow-up) ---
Stale Banner    bg #FFFBEB   border-left #F59E0B   text #92400E
```

---

## 3. Typography

```
Font Family:    Inter (Google Fonts) — fallback: system-ui, sans-serif
Font Sizes:
  xs:   12px / 1.5   (labels, timestamps)
  sm:   13px / 1.5   (table data, secondary text)
  base: 14px / 1.6   (body, form inputs)
  md:   16px / 1.5   (card titles)
  lg:   20px / 1.4   (section headings)
  xl:   28px / 1.3   (page title)
  2xl:  36px / 1.2   (stat numbers)

Font Weights:
  Regular:      400
  Medium:       500   (nav items, labels)
  Semibold:     600   (card titles, headings)
  Bold:         700   (stat numbers, CTA)
```

---

## 4. Spacing & Layout

```
Base unit: 4px
Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80

Page max-width:   1200px (centered, px-6 on mobile)
Content max-width: 960px (forms, single-column content)
Sidebar width:    240px (desktop)
Card border-radius: 12px
Button border-radius: 8px
Input border-radius: 8px
Pill border-radius: 999px (status badges)
Shadow (card):    0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)
Shadow (modal):   0 20px 60px rgba(0,0,0,0.15)
```

---

## 5. Page Structure

### 5.1 Landing / Sign-in Page (`/`)

```
┌──────────────────────────────────┐
│         [Trackerr logo]          │
│                                  │
│   Track every application.       │
│   Land the job.                  │
│                                  │
│   [Sign in with Google  ▶]       │
│                                  │
│   "Free · No ads · Your data"    │
└──────────────────────────────────┘
```
- Full-viewport centered layout, subtle gradient bg (`#F0F4FF → #FFFFFF`)
- Logo: bold wordmark "Trackerr" with accent dot on the second `r`
- Single CTA button — full width on mobile, 320px max on desktop
- Below-fold: 3 feature bullets with icons (CRUD, Stats, Email reminders)

---

### 5.2 Dashboard (`/dashboard`)

```
┌─────────────────────────────────────────────────────────────┐
│ [≡]  Trackerr          [Keshav ▾]  [+ Add Application]     │
├──────┬──────────────────────────────────────────────────────┤
│      │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│ Nav  │  │ 24   │ │  6   │ │  2   │ │  8   │ Stats Row      │
│      │  │Total │ │Interv│ │Offer │ │Reject│               │
│      │  └──────┘ └──────┘ └──────┘ └──────┘               │
│      │                                                      │
│      │  [All] [Applied] [Interview] [Offer] [Rejected]     │
│      │                                                      │
│      │  ┌──────────────────────────────────────────────┐   │
│      │  │ Company      Role       Status    Date   [⋯] │   │
│      │  ├──────────────────────────────────────────────┤   │
│      │  │ Google       SWE        ●Applied  Jun 1  [⋯] │   │
│      │  │ Stripe       Eng II     ●Interview Jun 5 [⋯] │   │
│      │  │ Meta         SWE Intern ●Offer    Jun 8  [⋯] │   │
│      │  └──────────────────────────────────────────────┘   │
└──────┴──────────────────────────────────────────────────────┘
```

**Stats Cards** (4 across, equal width):
- Large number (bold 36px), label below (14px muted), coloured left border per status
- Hover: slight lift shadow + 2px border-left grows to 4px

**Filter Pills** (horizontal scroll on mobile):
- Active filter: filled bg (status colour at 20%), bold text, dot
- Inactive: ghost style, light border
- Smooth 150ms fade on table content change

**Application Table:**
- Sticky header on scroll
- Row hover: `#F9FAFB` bg
- Status column: pill badge (coloured, rounded)
- Date column: relative time ("3 days ago") with full date on hover tooltip
- `[⋯]` menu: Edit, Mark stale, Delete (with confirm)
- Stale rows: subtle amber left border + warning icon in date column

---

### 5.3 Add / Edit Application (Slide-over Panel, not a new page)

```
┌─────────────────────────┐
│ ← Add Application   [×] │
├─────────────────────────┤
│ Company Name *          │
│ [________________________]│
│                         │
│ Role / Position *       │
│ [________________________]│
│                         │
│ Status *                │
│ [Applied        ▾]      │
│                         │
│ Application Date *      │
│ [Jun 13, 2026   📅]     │
│                         │
│ Job URL (optional)      │
│ [________________________]│
│                         │
│ Notes (optional)        │
│ [                       ]│
│ [                       ]│
│                         │
│ [Cancel]  [Save →]      │
└─────────────────────────┘
```

- Slides in from the right on desktop (400px wide), full-screen modal on mobile
- Backdrop blur + 40% dark overlay
- Autofocus on Company Name
- Save button disabled until required fields filled
- On save: optimistic insert into table, show toast "Application added ✓"

---

## 6. Component Library

### Status Badge
```
<span class="status-badge status-applied">
  <span class="dot"></span> Applied
</span>

Dot:    6px circle, status colour
Text:   13px medium, status text colour
BG:     status colour at 15% opacity
Padding: 4px 10px
```

### Toast Notification
```
Position: bottom-right, 16px from edge
Width:    320px max
Variants: success (green), error (red), info (blue)
Duration: 3s → fade out
Stacks:   up to 3 toasts visible
```

### Empty State
```
When no applications match filter:

  [📭 illustration — simple, line-art]
  No applications yet
  Add your first one to get started.
  [+ Add Application]
```

### Stale Warning Banner
```
Shown inline in table row (or as a tooltip on the date cell):

  ⚠  No update in 7+ days — follow up?
```

---

## 7. Navigation

**Desktop:** Left sidebar (240px), always visible
```
  [Trackerr]
  ──────────
  📊 Dashboard
  📋 All Applications
  ──────────
  [Keshav's avatar]
  Settings
  Sign out
```

**Mobile:** Bottom tab bar (4 items max) + hamburger for secondary items

---

## 8. Responsive Breakpoints

```
Mobile:   < 640px   — single column, bottom nav, full-screen modals
Tablet:   640-1024px — table collapses to cards, sidebar hidden (hamburger)
Desktop:  > 1024px  — full sidebar + table layout
```

**Mobile card layout** (replaces table rows):
```
┌──────────────────────────┐
│ Google               ●Applied │
│ Software Engineer         │
│ Applied Jun 1 · 12 days ago  │
│                    [Edit] │
└──────────────────────────┘
```

---

## 9. Micro-interactions & Motion

```
Page transitions:     fade (150ms ease)
Modal open:           slide-up + fade (200ms ease-out)
Slide-over:           slide-left (250ms ease-out)
Toast enter:          slide-up + fade (200ms)
Row hover:            bg transition (100ms)
Button press:         scale(0.98) (80ms)
Stats counter:        count-up animation on load (600ms)
Filter switch:        table rows fade out/in (150ms)
```

Use `prefers-reduced-motion` media query — disable all animations if set.

---

## 10. Accessibility

- All interactive elements have visible focus rings (`outline: 2px solid #3B82F6; outline-offset: 2px`)
- Colour is never the only indicator of status — always paired with text label
- ARIA labels on icon-only buttons (`aria-label="Delete application"`)
- Modal traps focus; Escape closes it
- Table has proper `<th scope="col">` headers
- Form errors announced via `aria-live="polite"`
- Minimum tap target: 44×44px on mobile

---

## 11. Dark Mode (Future Enhancement)

```
Background:    #0F172A
Surface:       #1E293B
Border:        #334155
Text Primary:  #F1F5F9
Text Secondary:#94A3B8
Accent Blue:   #60A5FA
```

Implement via `prefers-color-scheme` + CSS custom properties on `:root`.

---

## 12. Implementation Notes for Next.js / Tailwind

- Use **Tailwind CSS** — already implied by the tech stack; add the config if missing
- Extract status colours as Tailwind theme extensions in `tailwind.config.ts`
- Use **shadcn/ui** for Dialog, DropdownMenu, Toast (Sonner), and Select — all unstyled primitives, easy to theme
- `DashboardClient.tsx` owns all filter state — lift stats refresh into the same component via SWR or React Query for background revalidation
- The slide-over panel should be a `<dialog>` element for native accessibility
- Use `next/font` to load Inter with `display: swap`

---

*Last updated: June 2026 · Version 1.0*