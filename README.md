# Folio

A notebook made of blocks, with real checklists, a task board, templates, linked notes and fast search.

**Try it:** https://victorhollo.github.io/folio-notes/

## Features

- **Real checklists.** Click to tick, press Enter for the next task, Tab to nest. Make one with the Checklist button, by typing `[]` and a space, or with `/checklist`.
- **Tasks board.** Every open checkbox from every note in one place, with a quick-add box that drops tasks into today's page.
- **Blocks.** Headings, bullets, numbered lists, quotes, callouts, code and dividers. Type `/` for the menu, or use Markdown shortcuts (`# `, `- `, `1. `, `> `, ```` ``` ````, `---`).
- **Drag to reorder.** Grab the ⋮⋮ handle, or select blocks and press ⌘⇧↑/↓.
- **Formatting.** Select text for bold, italic, underline, strikethrough, inline code, highlight and links.
- **Linked notes.** Type `[[` to link another note. Each note lists the notes that link to it.
- **Today.** A daily page with a fresh template, one click away.
- **Templates.** Meeting notes, daily journal, project plan, idea, reading notes, checklist.
- **Organise.** Tags, pins, color labels, sorting, and a trash that keeps notes for 30 days.
- **Command palette.** ⌘K / Ctrl K to search every note and run any action.
- **Focus mode**, light and dark themes, a phone layout, undo and redo.
- **Your data.** Export a JSON backup or Markdown, and import `.json`, `.md` or `.txt` files.

## Sharing and live editing

When Folio runs as a claude.ai Artifact, notes sync to your account, and any note can be switched from **Private** to **Shared**. Shared notes can be opened and edited by everyone who has edit access to the Artifact, at the same time. You see who is in a note and which block they are typing in, and their typing shows up live.

Edits merge block by block, so two people editing different paragraphs never overwrite each other. If two people type in the same paragraph at the same moment, the most recent edit wins.

The GitHub Pages version has no server, so its notes live in your browser (`localStorage`). They stay on that device, and clearing site data deletes them. Export a backup from the ⋯ menu.

## Keyboard shortcuts

Press `?` in the app for the full list.

| Keys | Action |
| --- | --- |
| ⌘/Ctrl K | Search and commands |
| Alt N | New note |
| Alt T | Today's page |
| ⌘/Ctrl ⇧ L | Checklist |
| ⌘/Ctrl Enter | Tick or untick a task |
| ⌘/Ctrl ⇧ F | Focus mode |

## Development

The source lives in `src/` (`page.html`, `styles.css`, `app.js`). Build the two published forms with:

```bash
node build.mjs
```

That writes `index.html` for GitHub Pages and `dist/artifact.html` for the claude.ai Artifact. There are no dependencies.
