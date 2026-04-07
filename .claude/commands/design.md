---
description: Maximum-creativity design workflow — style selection, palette, typography, then build
argument-hint: "[client/project info or 'interactive']"
allowed-tools:
  - Read
  - Agent
  - WebSearch
  - WebFetch
  - Write
  - Edit
  - Glob
---

Push every visual project to its creative maximum. Applies structured style selection, fetches current design trends, defines a complete design system, then builds.

## Steps

### Step 1: Gather brand info

If argument provided, extract from it:
- Sector / industry
- Target audience
- What the product/service is
- Brand tone (words that describe the feeling)
- Visual references (if any)

If no argument provided (or argument is "interactive"), ask the user:
```
I need 5 things to choose the right design direction:

1. **Sector**: What industry is this? (e.g. coaching, SaaS, restaurant, fashion, fintech...)
2. **Target**: Who is the audience? (e.g. women 30-45, B2B executives, young creatives...)
3. **Offer**: What does it sell/offer? (e.g. 1:1 consultations, SaaS tool, physical products...)
4. **Tone**: How should it feel? (e.g. elegant, bold, warm, clinical, provocative, playful...)
5. **References**: Any sites you love visually? (links or descriptions — "none" is fine)
```

Wait for response before continuing.

### Step 2: Delegate to design-guardian

Spawn the design-guardian agent with full brand context:

```
design-guardian: Full design brief for [project name/type].

Brand context:
- Sector: [sector]
- Target: [audience]
- Offer: [what they sell]
- Tone: [brand tone]
- References: [visual references or "none"]

Tasks:
1. Fetch current design trends for this sector (WebSearch)
2. Select optimal styles from all four dimensions (structural, aesthetic, typographic, interactive)
3. Define complete color palette with hex codes and contrast ratios
4. Define font pairing with sources
5. Write the "Emotional Target" paragraph
6. List 3-5 anti-patterns to avoid for this brand
7. Return a complete, ready-to-build Design Brief

Rationale required for every choice. No generic selections.
```

### Step 3: Present and confirm design brief

Show the complete Design Brief to the user.
Ask: "Looks good to build with this direction? Or do you want to adjust anything?"

If adjustments requested → update brief via design-guardian → re-present.
If approved → proceed.

### Step 4: Build

Build the design following the approved brief exactly.

Mandatory implementation checklist:
- [ ] Color variables defined in CSS custom properties / design tokens
- [ ] Typography scale applied (not arbitrary font sizes)
- [ ] All hover/focus states implemented
- [ ] Loading states implemented (no blank content flashes)
- [ ] Responsive breakpoints: mobile (375px), tablet (768px), desktop (1280px), wide (1920px)
- [ ] WCAG AA contrast on all text (4.5:1 body, 3:1 UI elements)
- [ ] No placeholder content in final output
- [ ] At least one "signature moment" — something visually unexpected and memorable

### Step 5: Visual QA

After building, run a self-check:

Ask yourself:
1. Does this look like a template? → If yes, add differentiation.
2. Is there a clear visual hierarchy? → If no, fix weight/size/color relationships.
3. Does the color palette feel intentional? → If no, revisit.
4. Are the interactions delightful? → At minimum: hover states on all interactive elements.
5. Would a designer be proud of this? → If not, iterate.

### Step 6: Post-build security check

Trigger security guardian for any JavaScript-heavy interactions, form handling, or API calls:

```
RECOMMEND: /sec-review — design includes interactive forms/JS, needs security pass
```

### Step 7: Log design decisions

Update memory with design decisions for project consistency:
- Project name → style choices → palette → fonts → date
- This ensures future sessions stay consistent with established design language.
