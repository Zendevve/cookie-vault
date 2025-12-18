# Feature: {{Feature Name}}

Status: {{Draft / In Progress / Complete}}
Owner: {{Owner}}
Related ADRs: {{Links}}

---

## Goal Breakdown
Provide a brief description of the problem, any background context, and what the change accomplishes.

---

## User Review Required
Document anything that requires user review or clarification, for example, breaking changes or significant design decisions. Use GitHub alerts (IMPORTANT/WARNING/CAUTION) to highlight critical items.

**If there are no such items, omit this section entirely.**

---

## Proposed Changes
Group files by component (e.g., package, feature area, dependency layer) and order logically (dependencies first). Separate components with horizontal rules for visual clarity.

### {{Component Name}}
Summary of what will change in this component, separated by files. For specific files, Use [NEW] and [DELETE] to demarcate new and deleted files.

#### [MODIFY] [file basename](file:///absolute/path/to/modifiedfile)
#### [NEW] [file basename](file:///absolute/path/to/newfile)
#### [DELETE] [file basename](file:///absolute/path/to/deletedfile)

---

## Verification Plan
Summary of how you will verify that your changes have the desired effects.

### Automated Tests
- Exact commands you'll run, browser tests using the browser tool, etc.

### Manual Verification
- Asking the user to deploy to staging and testing, verifying UI changes on an iOS app etc.

---

## Definition of Done
- [ ] Feature implemented
- [ ] Automated tests passed
- [ ] Documentation updated
