# Folio

A fast, good-looking notebook that runs entirely in your browser.

**Try it:** https://victorhollo.github.io/folio-notes/

## Features

- **Saves as you type.** No save button.
- **Markdown** with a Write / Read switch. Checklists (`- [ ]`) can be ticked right in Read mode.
- **#tags** anywhere in a note become filter chips in the drawer.
- **Search** with highlighted matches, **pinned** notes, and **color labels**.
- Smart lists: Enter continues bullets, numbers and checkboxes.
- Word count, reading time and checklist progress.
- Undo after delete, copy as Markdown, light and dark themes, phone layout.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| Alt + N | New note |
| ⌘/Ctrl + K | Search |
| ⌘/Ctrl + E | Switch Write / Read |
| Esc | Clear search |

## Where notes are stored

Notes live in your browser's `localStorage`, so they stay on that device and browser. Clearing site data removes them.

When the same page runs as a claude.ai Artifact, it syncs notes to the owner's account instead.

## Run locally

It's a single `index.html` with no build step. Open it in a browser, or serve the folder:

```bash
npx serve .
```
