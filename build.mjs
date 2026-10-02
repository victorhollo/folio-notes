// Builds the two published forms of Folio from src/:
//   index.html          standalone page for GitHub Pages
//   dist/artifact.html  page body for the claude.ai Artifact (the host adds the document skeleton)
// firebase.config.json, when present, turns on Google sign-in, sync and sharing in index.html.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const build = (firebase) => read("./src/page.html")
  .replace("/*STYLES*/", () => read("./src/styles.css").trim())
  .replace("/*SCRIPT*/", () => read("./src/app.js").trim().replace("/*FIREBASE_CONFIG*/null", () => JSON.stringify(firebase)));

let firebase = null;
if (existsSync(new URL("./firebase.config.json", import.meta.url))) {
  firebase = JSON.parse(read("./firebase.config.json"));
  for (const k of ["apiKey", "authDomain", "projectId", "appId"]) if (!firebase[k]) throw new Error(`firebase.config.json is missing "${k}"`);
}

mkdirSync(new URL("./dist/", import.meta.url), { recursive: true });
writeFileSync(new URL("./dist/artifact.html", import.meta.url), build(null));
const page = build(firebase);

// Keep markup in <body> for valid HTML: split the head assets from the app markup.
const cut = page.indexOf("</style>") + "</style>".length;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Folio, a block-based notebook with real checklists, tasks, templates, linked notes and search.">
<meta name="theme-color" content="#121A2D">
<style>html{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}</style>
${page.slice(0, cut).trim()}
</head>
<body>
${page.slice(cut).trim()}
</body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);
console.log(`Built index.html${firebase ? ` (Firebase project ${firebase.projectId})` : " (no Firebase config, notes stay in the browser)"} and dist/artifact.html`);
