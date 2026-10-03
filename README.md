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

## Sharing on GitHub Pages (Firebase)

When the GitHub Pages build has a Firebase config, you can **sign in** with Google or with an emailed sign-in link from the ⋯ menu or the Share button. Your notes then sync to your account across devices, and the first sign-in brings along the notes you kept in that browser.

Press **Share** above any note to:

- **Invite people by email**, as *Can edit* or *Can view*. They see the note under **Shared** after signing in with that email address.
- **Share a link.** Choose who the link works for: only the people you added, anyone signed in who has the link (view), or anyone signed in who has the link (edit). Opening the link adds that person to the note.
- Change someone's access, remove them, or **Stop sharing** to make the note private again. People you shared with can **Leave** a note.

Edits sync within a second and merge block by block, the same as above. Avatars at the top of a shared note show who else has it open, and the block they're in is outlined in their color. Signed-in notes keep working offline: edits are saved on the device and sync when you're back online. Only the owner can change who has access or delete a shared note; `firestore.rules` enforces this on the server.

Without a Firebase config, the GitHub Pages version keeps notes in your browser (`localStorage`). They stay on that device, and clearing site data deletes them. Export a backup from the ⋯ menu.

### Setting up Firebase

1. In the [Firebase console](https://console.firebase.google.com/), open your project and add a **Web app**. Copy its config into `firebase.config.json` at the repo root (see `firebase.config.example.json`). This config identifies the project and is safe to publish; access is controlled by the security rules.
2. **Authentication → Sign-in method:** enable **Google**, and **Email/Password** with **Email link (passwordless sign-in)** turned on. Under **Settings → Authorized domains**, add `victorhollo.github.io`.
3. **Firestore Database:** create a database, then deploy the rules with `npx firebase-tools deploy --only firestore:rules` (the project is set in `.firebaserc`).
4. Run `node build.mjs` and commit `index.html`.

Data layout: private notes live at `users/{uid}/notes/{noteId}`; shared notes at `shared/{noteId}` with `owner`, `ownerEmail`, `members`, `editors` and `link` fields.

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

That writes `index.html` for GitHub Pages (with Firebase when `firebase.config.json` exists) and `dist/artifact.html` for the claude.ai Artifact. There are no dependencies; the Firebase SDK loads from gstatic.com at runtime.
