# Apple Human Interface Guidelines — Design System Reference

This document distills Apple's Human Interface Guidelines (HIG) into actionable design principles for Cookie Vault. It serves as a reference for ensuring UI consistency, accessibility, and platform-native aesthetics.

---

## Core Principles

### 1. Accessibility First

> "An accessible interface is intuitive, perceivable, and adaptable."

| Principle | Implementation |
|-----------|----------------|
| **Text Sizing** | Support Dynamic Type; minimum 11pt on iOS, 17pt default |
| **Color Contrast** | Minimum 4.5:1 for text, 3:1 for large/bold text |
| **Color Independence** | Never rely on color alone; use shapes/icons + color |
| **Touch Targets** | Minimum 44×44pt on iOS, 28×28pt minimum |
| **Spacing** | 12pt padding around bezeled elements, 24pt around non-bezeled |

### 2. Visual Hierarchy

> "Place items to convey their relative importance."

- Primary content appears top-left (reading order)
- Use consistent alignment to aid scanning
- Group related items with spacing, colors, or separators
- Progressive disclosure for hidden content

### 3. Simplicity & Clarity

> "Simple icons are easier to understand and recognize."

- Embrace minimalism in iconography
- Use filled, overlapping shapes for depth
- Include text only when essential
- Use system-provided components when possible

---

## Color System

### Semantic Colors

Use semantic color tokens that adapt to light/dark modes automatically:

| Token | Purpose |
|-------|---------|
| `foreground` | Primary text |
| `muted-foreground` | Secondary/tertiary text |
| `background` | Page/view background |
| `card` | Elevated surface background |
| `primary` | Interactive elements, accent |
| `destructive` | Error states, destructive actions |
| `border` | Separators, input borders |

### Light & Dark Mode

Always provide both light and dark variants:

```css
/* Light Mode */
--background: 0 0% 100%;
--foreground: 222 47% 11%;
--primary: 221 83% 53%; /* Vibrant blue */

/* Dark Mode */
--background: 222 47% 6%; /* Not pure black - prevents halation */
--foreground: 210 40% 98%;
--primary: 199 89% 48%; /* Vibrant cyan */
```

### Contrast Guidelines

| Context | Minimum Ratio |
|---------|---------------|
| Body text (< 18pt) | 4.5:1 |
| Large text (≥ 18pt) | 3:1 |
| Bold text (any size) | 3:1 |
| UI components | 3:1 |

### Color Independence

> "Some people have trouble differentiating between certain colors."

Always pair color with another visual indicator:

```tsx
// ❌ Bad: Color alone indicates state
<div className={success ? 'text-green-500' : 'text-red-500'}>{status}</div>

// ✅ Good: Color + icon indicates state
<div className={success ? 'text-green-500' : 'text-red-500'}>
  {success ? <CheckCircle /> : <XCircle />} {status}
</div>
```

---

## Typography

### Size Hierarchy

| Style | iOS Default | Minimum |
|-------|-------------|---------|
| Title | 28pt | 22pt |
| Headline | 17pt (bold) | 14pt |
| Body | 17pt | 11pt |
| Caption | 12pt | 10pt |

### Recommendations

- Use **system fonts** for body text (optimal legibility)
- Custom fonts acceptable for headlines
- Support Dynamic Type for accessibility
- Avoid thin weights at small sizes

---

## Layout

### Safe Areas & Margins

- Respect system safe areas to avoid notches, Dynamic Island
- Use consistent margins (16pt standard, 20pt on larger screens)
- Content should extend to fill available space

### Touch Targets

| Platform | Default | Minimum |
|----------|---------|---------|
| iOS/iPadOS | 44×44pt | 28×28pt |
| macOS | 28×28pt | 20×20pt |

### Spacing

- **12pt** padding around elements with bezels
- **24pt** padding around elements without visible edges
- Consistent spacing creates visual rhythm

---

## Components

### Buttons

```css
/* Minimum touch target */
min-height: 44px;

/* Visual hierarchy */
.primary { background: var(--primary); } /* Main action */
.secondary { background: var(--secondary); } /* Alternative */
.destructive { background: var(--destructive); } /* Dangerous */
```

### Form Inputs

- Clear labels above or beside inputs
- Visible focus states (ring/outline)
- Error states with color + icon + message
- Placeholder text is secondary, not a replacement for labels

### Icons

- Use SF Symbols or maintain visual consistency
- Same stroke weight across all icons
- Optical alignment (not just geometric)
- Provide accessibility labels for screen readers

---

## Motion & Animation

### Principles

- Motion should be **purposeful**, not decorative
- Respect **Reduce Motion** preference
- Use smooth, natural easing (ease-out for exits)
- Keep durations short: 200-300ms typical

### Implementation

```css
/* Standard transition */
.transition-smooth {
  transition: all 200ms ease-out;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Dark Mode Best Practices

### Background Colors

- **Never use pure black** (#000) — causes halation
- Use dark gray with slight tint (e.g., `hsl(222 47% 6%)`)
- Elevated surfaces should be lighter than base

### Foreground Colors

- Primary text should be off-white, not pure white
- Reduce saturation for colorful elements
- Ensure contrast ratios are maintained

### Images

- Provide separate assets for light/dark when needed
- Consider slightly darkening white backgrounds in images
- UI icons should adapt via tint colors

---

## Accessibility Checklist

### Vision

- [ ] Text scales with Dynamic Type
- [ ] Color contrast meets 4.5:1 minimum
- [ ] Color is not the only indicator of state
- [ ] Images have alt text / accessibility labels
- [ ] VoiceOver labels on all interactive elements

### Motor

- [ ] Touch targets are at least 44×44pt
- [ ] Adequate spacing between interactive elements
- [ ] Simple gestures for common interactions
- [ ] Alternatives to gestures (buttons)

### Cognitive

- [ ] Clear, consistent navigation
- [ ] Minimal time-boxed elements
- [ ] Auto-play controls available
- [ ] Respects Reduce Motion setting

---

## Cookie Vault Audit Findings

### ✅ Compliant

| Area | Status | Notes |
|------|--------|-------|
| Color System | ✅ | Light/dark modes with semantic tokens |
| Not Pure Black | ✅ | Using `hsl(222 47% 6%)` in dark mode |
| Button Sizing | ✅ | Full-width buttons meet touch targets |
| Icon + Color States | ✅ | Status uses CheckCircle/XCircle + color |
| Focus States | ✅ | Ring utility applied to inputs |

### ⚠️ Needs Improvement

| Area | Issue | Recommendation |
|------|-------|----------------|
| Touch Targets | Some icon buttons may be undersized | Ensure 44×44pt minimum for all clickable elements |
| Reduced Motion | No explicit support | Add `prefers-reduced-motion` media query |
| Dynamic Type | Not applicable (extension popup) | Consider relative units for accessibility |
| Loading States | Text-only feedback | Add skeleton loaders or spinners |
| Error Contrast | Red on dark may be insufficient | Verify 4.5:1 contrast in dark mode |

### Recommended CSS Additions

```css
/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Ensure minimum touch targets */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}
```

---

## Quick Reference

### Do

- ✅ Use semantic color tokens
- ✅ Pair color with icons/shapes for state
- ✅ Maintain 4.5:1 contrast ratio
- ✅ Provide 44×44pt touch targets
- ✅ Support light and dark modes
- ✅ Use consistent spacing (12pt/24pt)
- ✅ Respect reduced motion preference

### Don't

- ❌ Use pure black backgrounds
- ❌ Rely on color alone for meaning
- ❌ Create tiny touch targets
- ❌ Use excessive/jarring animations
- ❌ Ignore accessibility settings
- ❌ Hard-code system color values

---

*Reference: [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)*
