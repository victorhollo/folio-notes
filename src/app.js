(() => {
"use strict";

/* =====================================================================
   Utilities
   ===================================================================== */
const $ = (id) => document.getElementById(id);
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
const MOD = isMac ? "⌘" : "Ctrl";
const ALT = isMac ? "⌥" : "Alt";
const SHIFT = isMac ? "⇧" : "Shift";
const modKey = (e) => (isMac ? e.metaKey : e.ctrlKey);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const uid = (p = "n") => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const unescHtml = (s) => String(s).replace(/&(amp|lt|gt|quot|#39);/g, (m, k) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" }[k]));
const num = (v) => (typeof v === "number" && isFinite(v) ? v : Number(v) || 0);

function el(tag, props, ...kids) {
  const n = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) n.append(c);
  return n;
}
const prefs = {
  get(k, d) { try { const v = localStorage.getItem("folio." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("folio." + k, JSON.stringify(v)); return true; } catch { return false; } },
};

function rel(ts) {
  const d = (Date.now() - ts) / 1000;
  if (d < 45) return "just now";
  if (d < 3600) return Math.round(d / 60) + " min ago";
  if (d < 86400) return Math.round(d / 3600) + " h ago";
  if (d < 172800) return "yesterday";
  const dt = new Date(ts), now = new Date();
  return dt.toLocaleDateString(undefined, dt.getFullYear() === now.getFullYear() ? { month: "short", day: "numeric" } : { year: "numeric", month: "short", day: "numeric" });
}
const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const longDate = (d = new Date()) => d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
const shortDate = (d = new Date()) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });

/* =====================================================================
   Icons
   ===================================================================== */
const sv = (inner, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const I = {
  check: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 3.2),
  grip: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>',
  todo: sv('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 12.2l2.8 2.8L16.2 9.4"/>'),
  bullet: sv('<circle cx="5" cy="7" r="1.3" fill="currentColor"/><circle cx="5" cy="17" r="1.3" fill="currentColor"/><path d="M10 7h10M10 17h10"/>'),
  quote: sv('<path d="M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6"/>'),
  callout: sv('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.5.4.9 1 1 1.7l.1.5h5l.1-.5c.1-.7.5-1.3 1-1.7A6 6 0 0 0 12 3z"/>'),
  divider: sv('<path d="M3 12h18" stroke-dasharray="3 3"/><path d="M7 6h10M7 18h10" opacity=".45"/>'),
  code: sv('<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>'),
  link: sv('<path d="M10 14a4 4 0 0 0 5.7 0l3.2-3.2a4 4 0 0 0-5.7-5.7L12 6.3"/><path d="M14 10a4 4 0 0 0-5.7 0l-3.2 3.2a4 4 0 0 0 5.7 5.7l1.1-1.1"/>'),
  marker: sv('<path d="m15 5 4 4-9 9H6v-4z"/><path d="M4 21h16"/>'),
  notes: sv('<path d="M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M8.5 12.5h7M8.5 16.5h5"/>'),
  today: sv('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none"/>'),
  tasks: sv('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 12.2l2.8 2.8L16.2 9.4"/>'),
  pin: sv('<path d="M12 17v5"/><path d="M9 10.8V4h6v6.8l2.6 3.2a1 1 0 0 1-.8 1.6H7.2a1 1 0 0 1-.8-1.6z"/>'),
  pinFill: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 3h6v7.8l2.6 3.2a1 1 0 0 1-.8 1.6H13v5.4l-1 1-1-1v-5.4H7.2a1 1 0 0 1-.8-1.6L9 10.8z"/></svg>',
  trash: sv('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
  x: sv('<path d="M6 6l12 12M18 6 6 18"/>', 2.4),
  sun: sv('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: sv('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  system: sv('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'),
  search: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 2.2),
  plus: sv('<path d="M12 5v14M5 12h14"/>', 2.4),
  copy: sv('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>'),
  download: sv('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  upload: sv('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'),
  dup: sv('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
  up: sv('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  down: sv('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  restore: sv('<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>'),
  keyboard: sv('<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
  focus: sv('<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>'),
  tag: sv('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.4"/>'),
  meeting: sv('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.6c2.6.1 4.4 2 5 4.9"/>'),
  journal: sv('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>'),
  project: sv('<path d="M4 20V5M4 5h12l-2 4 2 4H4"/>'),
  idea: sv('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.5.4.9 1 1 1.7l.1.5h5l.1-.5c.1-.7.5-1.3 1-1.7A6 6 0 0 0 12 3z"/>'),
  book: sv('<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 0 2 2h13v-4"/>'),
  blank: sv('<path d="M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/>'),
  menu: sv('<path d="M4 7h16M4 12h16M4 17h10"/>'),
  people: sv('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.6c2.6.1 4.4 2 5 4.9"/>'),
  lock: sv('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  back: sv('<path d="M15 18l-6-6 6-6"/>', 2.2),
};

/* =====================================================================
   Block types, colors, templates
   ===================================================================== */
const TYPES = {
  p: { label: "Text", g: "Aa", kw: "text paragraph plain normal" },
  h1: { label: "Heading 1", g: "H1", kw: "heading title big h1" },
  h2: { label: "Heading 2", g: "H2", kw: "heading subtitle h2" },
  h3: { label: "Heading 3", g: "H3", kw: "heading small h3" },
  todo: { label: "Checklist", icon: I.todo, kw: "todo task checkbox check tick box list checklist" },
  ul: { label: "Bulleted list", icon: I.bullet, kw: "bullet list unordered points" },
  ol: { label: "Numbered list", g: "1.", kw: "number ordered list steps" },
  quote: { label: "Quote", icon: I.quote, kw: "quote blockquote citation" },
  callout: { label: "Callout", icon: I.callout, kw: "callout note tip info highlight box" },
  code: { label: "Code", icon: I.code, kw: "code snippet pre monospace" },
  hr: { label: "Divider", icon: I.divider, kw: "divider line rule separator hr" },
};
const PH = { p: "Type / for blocks, [[ to link a note", h1: "Heading 1", h2: "Heading 2", h3: "Heading 3", todo: "To-do", ul: "List item", ol: "List item", quote: "Quote", callout: "Something worth calling out", code: "Code" };
const LISTY = new Set(["todo", "ul", "ol"]);
const INDENTABLE = new Set(["p", "todo", "ul", "ol", "quote", "callout"]);
const COLORS = ["", "sun", "sage", "sky", "rose", "lilac"];
const COLOR_NAMES = { "": "No color", sun: "Sun", sage: "Sage", sky: "Sky", rose: "Rose", lilac: "Lilac" };
const TAG_RE = /(^|[\s(])#([\p{L}\p{N}_-]{1,32})/gu;
const WORD_RE = /[\p{L}\p{N}'’-]+/gu;
const LS_NOTES = "folio.notes.v1";
const TRASH_DAYS = 30;

const B = (t, h = "", extra = {}) => { const b = { id: uid("b"), t, h, i: 0, ...extra }; if (t === "todo" && b.c == null) b.c = false; return b; };
const dailyBlocks = () => [B("h3", "Top three"), B("todo"), B("todo"), B("todo"), B("h3", "Notes"), B("p"), B("h3", "Wins today"), B("ul")];
const TEMPLATES = [
  { id: "blank", name: "Blank note", desc: "Start from nothing", icon: I.blank, blocks: () => [B("p")] },
  { id: "checklist", name: "Checklist", desc: "A list you can tick off", icon: I.todo, blocks: () => [B("todo")], focus: "body" },
  { id: "meeting", name: "Meeting notes", desc: "Agenda, notes, action items", icon: I.meeting, title: () => "Meeting · " + shortDate(), blocks: () => [B("h3", "Attendees"), B("p"), B("h3", "Agenda"), B("ol"), B("h3", "Notes"), B("ul"), B("h3", "Action items"), B("todo")] },
  { id: "journal", name: "Daily journal", desc: "Top three, notes, wins", icon: I.journal, title: () => longDate(), blocks: dailyBlocks },
  { id: "project", name: "Project plan", desc: "Goal, milestones, questions", icon: I.project, blocks: () => [B("callout", "<b>Goal:</b> "), B("h3", "Milestones"), B("todo"), B("h3", "Open questions"), B("ul"), B("h3", "Resources"), B("p")] },
  { id: "idea", name: "Idea", desc: "Capture it before it's gone", icon: I.idea, blocks: () => [B("h3", "The idea"), B("p"), B("h3", "Why it matters"), B("p"), B("h3", "Next steps"), B("todo")] },
  { id: "reading", name: "Reading notes", desc: "Key points and quotes", icon: I.book, blocks: () => [B("callout", "<b>Source:</b> "), B("h3", "Key points"), B("ul"), B("h3", "Quotes"), B("quote"), B("h3", "My take"), B("p")] },
];

/* =====================================================================
   Inline HTML: sanitize, text, markdown
   ===================================================================== */
const tplEl = document.createElement("template");
function safeHref(h) {
  if (!h) return "";
  h = String(h).trim();
  if (/^(https?:|mailto:)/i.test(h)) return h;
  if (/^[\w-]+(\.[\w-]+)+([/?#]|$)/.test(h)) return "https://" + h;
  return "";
}
const INLINE_MAP = { b: "b", strong: "b", i: "i", em: "i", u: "u", s: "s", strike: "s", del: "s", code: "code", mark: "mark" };
function walkInline(node) {
  let s = "";
  for (const c of node.childNodes) {
    if (c.nodeType === 3) { s += escHtml(c.nodeValue); continue; }
    if (c.nodeType !== 1) continue;
    const tag = c.tagName.toLowerCase();
    if (tag === "br") { s += "<br>"; continue; }
    if (tag === "a" && c.classList.contains("wl")) {
      const id = c.getAttribute("data-id") || "";
      if (/^[\w.~:@+-]{1,200}$/.test(id)) s += `<a class="wl" data-id="${id}" contenteditable="false">${escHtml(c.textContent)}</a>`;
      continue;
    }
    if (["script", "style", "template", "iframe", "object", "svg", "img"].includes(tag)) continue;
    const inner = walkInline(c);
    if (tag === "a") { const href = safeHref(c.getAttribute("href")); s += href && inner ? `<a href="${escHtml(href)}">${inner}</a>` : inner; continue; }
    if (INLINE_MAP[tag]) { const t = INLINE_MAP[tag]; if (inner) s += `<${t}>${inner}</${t}>`; continue; }
    if (tag === "span" || tag === "font") {
      const st = c.getAttribute("style") || ""; let w = inner;
      if (w && /font-weight:\s*(bold|[6-9]00)/.test(st)) w = `<b>${w}</b>`;
      if (w && /font-style:\s*italic/.test(st)) w = `<i>${w}</i>`;
      if (w && /line-through/.test(st)) w = `<s>${w}</s>`;
      s += w; continue;
    }
    if (tag === "div" || tag === "p" || tag === "li") { if (s && !s.endsWith("<br>")) s += "<br>"; s += inner; continue; }
    s += inner;
  }
  return s;
}
function sanitizeInline(html) {
  if (!html) return "";
  tplEl.innerHTML = html;
  const out = walkInline(tplEl.content);
  return out === "<br>" ? "" : out;
}
function htmlToText(html) {
  if (!html) return "";
  if (!/[<&]/.test(html)) return html.replace(/ /g, " ");
  tplEl.innerHTML = html.replace(/<br\s*\/?>/gi, "\n");
  return tplEl.content.textContent.replace(/ /g, " ");
}
function nodeLen(n) {
  if (n.nodeType === 3) return n.nodeValue.length;
  if (n.nodeType !== 1 && n.nodeType !== 11) return 0;
  if (n.nodeType === 1 && (n.tagName === "BR" || n.classList.contains("wl"))) return 1;
  let s = 0; for (const c of n.childNodes) s += nodeLen(c); return s;
}
function htmlLen(html) { tplEl.innerHTML = html || ""; return nodeLen(tplEl.content); }
const plainToCodeHtml = (s) => escHtml(s).replace(/\n/g, "<br>");

function mdInline(src) {
  let s = escHtml(src);
  const codes = [];
  s = s.replace(/`([^`\n]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = s.replace(/\[\[([^\]\n]{1,120})\]\]/g, (m, t) => { const n = findNoteByTitle(unescHtml(t)); return n ? `<a class="wl" data-id="${n.id}" contenteditable="false">${t}</a>` : m; });
  s = s.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (m, t, u) => { const h = safeHref(unescHtml(u)); return h ? `<a href="${escHtml(h)}">${t}</a>` : m; });
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>").replace(/__([^_\n]+)__/g, "<b>$1</b>");
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<i>$2</i>").replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, "$1<i>$2</i>");
  s = s.replace(/~~([^~\n]+)~~/g, "<s>$1</s>").replace(/==([^=\n]+)==/g, "<mark>$1</mark>");
  s = s.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, "<u>$1</u>");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[+i]}</code>`);
  return s;
}
function mdWalk(node) {
  let s = "";
  for (const c of node.childNodes) {
    if (c.nodeType === 3) { s += c.nodeValue; continue; }
    if (c.nodeType !== 1) continue;
    const t = c.tagName.toLowerCase();
    if (t === "br") s += "\n";
    else if (t === "a" && c.classList.contains("wl")) s += `[[${(S.notes.get(c.dataset.id) || {}).title || c.textContent}]]`;
    else if (t === "a") s += `[${mdWalk(c)}](${c.getAttribute("href")})`;
    else if (t === "b") s += `**${mdWalk(c)}**`;
    else if (t === "i") s += `*${mdWalk(c)}*`;
    else if (t === "s") s += `~~${mdWalk(c)}~~`;
    else if (t === "mark") s += `==${mdWalk(c)}==`;
    else if (t === "u") s += `<u>${mdWalk(c)}</u>`;
    else if (t === "code") s += "`" + c.textContent + "`";
    else s += mdWalk(c);
  }
  return s;
}
function inlineToMd(html) { tplEl.innerHTML = html || ""; return mdWalk(tplEl.content).replace(/ /g, " "); }

function mdToBlocks(md) {
  const lines = String(md || "").replace(/\r\n?/g, "\n").split("\n");
  const out = []; let code = null;
  for (const raw of lines) {
    if (code) { if (/^\s*```/.test(raw)) { out.push(B("code", code.map(escHtml).join("<br>"))); code = null; } else code.push(raw); continue; }
    if (/^\s*```/.test(raw)) { code = []; continue; }
    if (!raw.trim()) continue;
    const ind = Math.min(4, Math.floor(raw.match(/^\s*/)[0].replace(/\t/g, "  ").length / 2));
    const line = raw.trim(); let m;
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) out.push(B("hr"));
    else if ((m = line.match(/^[-*+]\s+\[( |x|X)\]\s?(.*)$/)) || (m = line.match(/^\[( |x|X)?\]\s+(.*)$/))) out.push(B("todo", mdInline(m[2]), { i: ind, c: !!m[1] && m[1] !== " " }));
    else if ((m = line.match(/^[-*+•]\s+(.*)$/))) out.push(B("ul", mdInline(m[1]), { i: ind }));
    else if ((m = line.match(/^\d+[.)]\s+(.*)$/))) out.push(B("ol", mdInline(m[1]), { i: ind }));
    else if ((m = line.match(/^(#{1,3})\s+(.*)$/))) out.push(B("h" + m[1].length, mdInline(m[2])));
    else if ((m = line.match(/^>\s?(.*)$/))) { const cm = m[1].match(/^\[!\w+\]\s*(.*)$/); out.push(cm ? B("callout", mdInline(cm[1])) : B("quote", mdInline(m[1]))); }
    else out.push(B("p", mdInline(line)));
  }
  if (code) out.push(B("code", code.map(escHtml).join("<br>")));
  return out;
}
function olNumbers(blocks) {
  const res = {}; let cnt = [];
  for (const b of blocks) {
    const i = b.i || 0;
    if (b.t === "ol") { cnt.length = i + 1; cnt[i] = (cnt[i] || 0) + 1; res[b.id] = cnt[i]; }
    else if (b.t === "ul" || b.t === "todo") { cnt.length = i + 1; cnt[i] = 0; }
    else cnt = [];
  }
  return res;
}
function blocksToMd(blocks) {
  const nums = olNumbers(blocks); const parts = []; let prev = null;
  for (const b of blocks) {
    const pad = "  ".repeat(b.i || 0); const txt = inlineToMd(b.h); let line;
    switch (b.t) {
      case "h1": line = "# " + txt; break;
      case "h2": line = "## " + txt; break;
      case "h3": line = "### " + txt; break;
      case "todo": line = pad + `- [${b.c ? "x" : " "}] ` + txt.replace(/\n/g, "\n" + pad + "  "); break;
      case "ul": line = pad + "- " + txt.replace(/\n/g, "\n" + pad + "  "); break;
      case "ol": line = pad + nums[b.id] + ". " + txt.replace(/\n/g, "\n" + pad + "   "); break;
      case "quote": line = "> " + txt.replace(/\n/g, "\n> "); break;
      case "callout": line = "> [!NOTE] " + txt.replace(/\n/g, "\n> "); break;
      case "code": line = "```\n" + htmlToText(b.h) + "\n```"; break;
      case "hr": line = "---"; break;
      default: line = pad + txt.replace(/\n/g, "  \n" + pad);
    }
    const tight = prev && LISTY.has(prev.t) && LISTY.has(b.t);
    parts.push((parts.length ? (tight ? "\n" : "\n\n") : "") + line);
    prev = b;
  }
  return parts.join("");
}

/* =====================================================================
   Model
   ===================================================================== */
const S = {
  mode: "boot",            // boot | cloud | local
  notes: new Map(),
  view: "all",             // all | pinned | tasks | trash | tag
  tag: null,
  query: "",
  sort: prefs.get("sort", "updated"),
  selected: null,
  focus: false,
  showDone: prefs.get("showDone", false),
  theme: prefs.get("theme", "system"),
};
const cleanTag = (s) => String(s || "").trim().replace(/^#+/, "").toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}_-]/gu, "").slice(0, 32);
function findNoteByTitle(title) {
  const t = String(title).trim().toLowerCase(); if (!t) return null;
  for (const n of S.notes.values()) if (!n.trashed && n.title.trim().toLowerCase() === t) return n;
  return null;
}
function normalizeBlock(b) {
  if (!b || !TYPES[b.t]) return null;
  const out = { id: typeof b.id === "string" && /^[\w-]{1,64}$/.test(b.id) ? b.id : uid("b"), t: b.t, h: b.t === "hr" ? "" : sanitizeInline(typeof b.h === "string" ? b.h : ""), i: INDENTABLE.has(b.t) ? clamp(num(b.i), 0, 4) : 0, u: num(b.u) };
  if (b.t === "todo") out.c = !!b.c;
  return out;
}
function normalize(id, d, space = "private") {
  d = d || {};
  let blocks = Array.isArray(d.blocks) ? d.blocks.map(normalizeBlock).filter(Boolean) : mdToBlocks(d.body || "");
  const seen = new Set(); blocks.forEach((b) => { if (seen.has(b.id)) b.id = uid("b"); seen.add(b.id); });
  if (!blocks.length) blocks = [B("p")];
  const del = {};
  if (d.del && typeof d.del === "object") for (const [k, v] of Object.entries(d.del)) if (/^[\w-]{1,64}$/.test(k) && num(v)) del[k] = num(v);
  const n = {
    id, space, title: typeof d.title === "string" ? d.title.replace(/\n/g, " ") : "", blocks,
    tags: Array.isArray(d.tags) ? [...new Set(d.tags.map(cleanTag).filter(Boolean))] : [],
    pinned: !!d.pinned, color: COLORS.includes(d.color) ? d.color : "",
    created: num(d.created) || Date.now(), updated: num(d.updated) || num(d.created) || Date.now(),
    trashed: num(d.trashed) || null, daily: typeof d.daily === "string" ? d.daily : null,
    del, ou: num(d.ou), tu: num(d.tu), mu: num(d.mu), _v: 0,
  };
  remember(n);
  return n;
}
function serializeCore(n) {
  return {
    title: n.title,
    blocks: n.blocks.map((b) => (b.t === "todo" ? { id: b.id, t: b.t, h: b.h, i: b.i || 0, c: !!b.c, u: b.u || 0 } : { id: b.id, t: b.t, h: b.h, i: b.i || 0, u: b.u || 0 })),
    tags: n.tags, pinned: n.pinned, color: n.color, trashed: n.trashed || null, daily: n.daily || null,
    del: n.del || {}, ou: n.ou || 0, tu: n.tu || 0, mu: n.mu || 0,
  };
}
function serialize(n) { return { ...serializeCore(n), body: blocksToMd(n.blocks), created: n.created, updated: n.updated }; }

/* Versioning: every block, the block order, the title and the other fields carry the time they
   last changed. Two copies of a note merge by keeping the newest version of each piece, so two
   people (or two devices) editing different blocks of one note never overwrite each other. */
const J = (b) => JSON.stringify([b.t, b.h, b.i || 0, !!b.c]);
const metaKey = (n) => JSON.stringify([n.pinned, n.color, n.tags, n.trashed, n.daily]);
function remember(n) {
  n._last = new Map(n.blocks.map((b) => [b.id, J(b)]));
  n._lastOrder = n.blocks.map((b) => b.id).join(",");
  n._lastTitle = n.title;
  n._lastMeta = metaKey(n);
}
function stamp(n) {
  const now = Date.now(); const last = n._last || new Map(); const ids = new Set();
  n.del ||= {};
  for (const b of n.blocks) { ids.add(b.id); if (last.get(b.id) !== J(b)) b.u = now; delete n.del[b.id]; }
  for (const id of last.keys()) if (!ids.has(id)) n.del[id] = now;
  if (n._lastOrder !== n.blocks.map((b) => b.id).join(",")) n.ou = now;
  if (n._lastTitle !== n.title) n.tu = now;
  if (n._lastMeta !== metaKey(n)) n.mu = now;
  remember(n);
}
function mergeNote(cur, inc) {
  const view = (n) => JSON.stringify([n.title, n.blocks.map((b) => b.id + J(b)), metaKey(n)]);
  const before = view(cur);
  const L = new Map(cur.blocks.map((b) => [b.id, b])), R = new Map(inc.blocks.map((b) => [b.id, b]));
  const del = { ...(inc.del || {}) };
  for (const [k, v] of Object.entries(cur.del || {})) if (!(del[k] >= v)) del[k] = v;
  const newer = (a, b) => (b.u || 0) > (a.u || 0) || ((b.u || 0) === (a.u || 0) && J(b) > J(a));
  const alive = new Map();
  for (const id of new Set([...L.keys(), ...R.keys()])) {
    const l = L.get(id), r = R.get(id);
    const w = !l ? r : !r ? l : newer(l, r) ? r : l;
    if (del[id] && del[id] >= (w.u || 0)) continue;
    alive.set(id, w);
  }
  const lo = cur.blocks.map((b) => b.id).join(","), ro = inc.blocks.map((b) => b.id).join(",");
  const remoteFirst = (inc.ou || 0) > (cur.ou || 0) || ((inc.ou || 0) === (cur.ou || 0) && ro > lo);
  const primary = remoteFirst ? inc.blocks : cur.blocks, secondary = remoteFirst ? cur.blocks : inc.blocks;
  const order = primary.map((b) => b.id).filter((id) => alive.has(id));
  const placed = new Set(order);
  secondary.forEach((b, k) => {
    if (!alive.has(b.id) || placed.has(b.id)) return;
    let at = 0;
    for (let j = k - 1; j >= 0; j--) { const p = order.indexOf(secondary[j].id); if (p >= 0) { at = p + 1; break; } }
    order.splice(at, 0, b.id); placed.add(b.id);
  });
  cur.blocks = order.length ? order.map((id) => ({ ...alive.get(id) })) : [B("p")];
  if ((inc.tu || 0) > (cur.tu || 0)) { cur.title = inc.title; cur.tu = inc.tu; }
  if ((inc.mu || 0) > (cur.mu || 0)) { for (const f of ["pinned", "color", "tags", "trashed", "daily"]) cur[f] = inc[f]; cur.mu = inc.mu; }
  cur.ou = Math.max(cur.ou || 0, inc.ou || 0);
  const cutoff = Date.now() - TRASH_DAYS * 864e5;
  for (const k of Object.keys(del)) if (del[k] < cutoff) delete del[k];
  cur.del = del;
  cur.updated = Math.max(cur.updated, inc.updated);
  cur.created = Math.min(cur.created, inc.created);
  const changed = view(cur) !== before;
  if (changed) cur._v = (cur._v || 0) + 1;
  remember(cur);
  return { changed, needsSave: JSON.stringify(serializeCore(cur)) !== JSON.stringify(serializeCore(inc)) };
}
function derive(n) {
  if (n._d && n._d.v === n._v) return n._d;
  const texts = n.blocks.map((b) => (b.t === "hr" ? "" : htmlToText(b.h)));
  const text = texts.filter(Boolean).join("\n");
  const own = new Set(n.tags); const inline = new Set();
  for (const m of text.matchAll(TAG_RE)) { const t = m[2].toLowerCase(); if (!own.has(t)) inline.add(t); }
  let total = 0, done = 0;
  for (const b of n.blocks) if (b.t === "todo") { total++; if (b.c) done++; }
  const words = ((n.title + " " + text).match(WORD_RE) || []).length;
  return (n._d = { v: n._v, text, lower: (n.title + "\n" + text + "\n" + n.tags.join(" ")).toLowerCase(), tags: [...own], inline: [...inline], all: [...own, ...inline], total, done, words, snippet: text.replace(/\s+/g, " ").trim().slice(0, 220) });
}
const isBlankNote = (n) => !n.title.trim() && !n.tags.length && n.blocks.every((b) => b.t === "p" && !b.h);
const active = () => [...S.notes.values()].filter((n) => !n.trashed);

/* =====================================================================
   Persistence: claude.ai database when available, else this browser
   ===================================================================== */
// Where each space lives: { col } in the claude.ai database, or { local: true } in this browser.
const SP = { private: null, shared: null };
let canWriteShared = true;
let isOwner = false;
const dirty = new Map();
const inflight = new Set();
const again = new Set();
const caps = {};
function cap(name) {
  if (!window.claude || typeof window.claude.use !== "function") return Promise.resolve(null);
  return (caps[name] ||= Promise.resolve().then(() => window.claude.use(name)).catch(() => null));
}
function loadLocal() { try { const raw = localStorage.getItem(LS_NOTES); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function saveLocalNow() {
  const mine = [...S.notes.values()].filter((n) => n.space === "private");
  try { localStorage.setItem(LS_NOTES, JSON.stringify(mine.map((n) => ({ id: n.id, ...serialize(n) })))); return true; }
  catch { return false; }
}
function markDirty(id) {
  clearTimeout(dirty.get(id));
  dirty.set(id, setTimeout(() => flush(id), 600));
  setSave("saving");
}
function edited(n) {
  if (!n) return;
  stamp(n);
  n._v = (n._v || 0) + 1; n.updated = Date.now();
  markDirty(n.id); scheduleSide();
  if (n.space === "shared" && n === E.note) queueLive();
}
async function flush(id) {
  clearTimeout(dirty.get(id));
  const n = S.notes.get(id);
  const sp = n && SP[n.space];
  if (!n || !sp || n._moving) { dirty.delete(id); return; }
  if (sp.local) {
    dirty.delete(id);
    const ok = saveLocalNow();
    setSave(ok ? "saved" : "error");
    if (!ok) toast("This browser refused to save. Export a backup from the ⋯ menu so nothing is lost.");
    return;
  }
  if (inflight.has(id)) { again.add(id); return; }
  dirty.delete(id);
  inflight.add(id);
  try {
    await sp.col.doc(id).set(serialize(n));
    n._synced = true;
    if (!dirty.size && !again.size) setSave("saved");
  } catch (e) {
    const code = e && e.code;
    if (code === "invalid_argument" && n.space === "shared") {
      canWriteShared = false; setSave("error");
      toast("You can read shared notes, but your access to this page doesn't include editing them.");
      if (E.note === n) openEditor();
    } else if (code === "invalid_argument" && n.space === "private" && !isOwner) {
      SP.private = { local: true }; saveLocalNow(); setSave("saved");
      toast("Your own notes will be kept in this browser.");
    } else {
      setSave("error");
      toast(code === "quota_exceeded" ? "The notebook is full. Delete a few notes to keep saving." : "Couldn't save the last change. Keep this tab open and keep typing to try again.");
    }
  } finally {
    inflight.delete(id);
    if (again.delete(id)) flush(id);
  }
}
function flushAll() { for (const id of [...dirty.keys()]) flush(id); }
async function removeStored(n) {
  clearTimeout(dirty.get(n.id)); dirty.delete(n.id);
  const sp = SP[n.space]; if (!sp) return;
  if (sp.local) { saveLocalNow(); return; }
  try { await sp.col.doc(n.id).delete(); } catch { toast("Couldn't delete that note. Try again."); }
}
async function moveSpace(n, target) {
  if (!n || n.space === target || !SP[target]) return;
  if (target === "shared" && !canWriteShared) { toast("Your access to this page doesn't allow adding shared notes."); return; }
  const from = n.space, src = SP[from], dst = SP[target];
  clearTimeout(dirty.get(n.id)); dirty.delete(n.id);
  n._moving = true; n.space = target;
  try {
    if (dst.local) saveLocalNow(); else await dst.col.doc(n.id).set(serialize(n));
    if (src.local) saveLocalNow(); else await src.col.doc(n.id).delete();
    toast(target === "shared" ? "Shared. Everyone you give access to this page can open and edit it." : "Private again. Only you can see it.");
  } catch {
    n.space = from;
    toast("Couldn't move that note. Try again.");
  } finally {
    n._moving = false;
    if (E.note === n) { refreshMeta(); sendPresence(); }
    renderSide();
  }
}

function welcomeNotes() {
  const now = Date.now();
  const errands = normalize(uid(), {
    title: "Weekend errands", tags: ["example", "errands"], color: "sage", created: now - 3600e3, updated: now - 3600e3,
    blocks: [B("todo", "Return the library books"), B("todo", "Book a dentist appointment", { c: true }), B("todo", "Buy a birthday card"), B("todo", "Pick up bread and coffee beans"), B("p", "This list also shows up in <b>Tasks</b> in the sidebar.")],
  });
  const welcome = normalize(uid(), {
    title: "Welcome to Folio", tags: ["example"], pinned: true, color: "sky", created: now, updated: now,
    blocks: [
      B("p", "Folio is a notebook made of blocks. Everything saves as you type."),
      B("h2", "Make a checklist"),
      B("todo", "Tick this box", { c: true }),
      B("todo", "Press Enter at the end of a task to add the next one"),
      B("todo", "Type <code>[]</code> and a space at the start of a line"),
      B("todo", "Or press <b>Checklist</b> in the dock at the bottom"),
      B("h2", "Shape your writing"),
      B("ul", "Type <b>/</b> for headings, quotes, callouts, code and dividers"),
      B("ul", "Select text to make it <b>bold</b>, <i>italic</i>, <mark>highlighted</mark> or a link"),
      B("ul", `Type <code>[[</code> to link another note, like <a class="wl" data-id="${errands.id}" contenteditable="false">Weekend errands</a>`),
      B("ul", "Drag the ⋮⋮ handle to reorder, and press Tab to indent"),
      B("callout", `<b>Tip:</b> press ${MOD} K to search every note and run any command.`),
      B("h2", "Find it later"),
      B("p", "Add tags under the title, pin notes, give them a color, and press <b>Today</b> for a daily page. These two notes are examples, delete them whenever you like."),
    ],
  });
  return [welcome, errands];
}

function purgeOldTrash() {
  const cutoff = Date.now() - TRASH_DAYS * 864e5;
  for (const n of [...S.notes.values()]) if (n.trashed && n.trashed < cutoff && (n.space === "private" || isOwner)) { S.notes.delete(n.id); removeStored(n); }
}
function loadLocalNotes(seedIfEmpty) {
  const stored = loadLocal();
  if (Array.isArray(stored)) {
    for (const d of stored) if (d && typeof d.id === "string") { const n = normalize(d.id, d, "private"); n._synced = true; S.notes.set(n.id, n); }
  } else if (seedIfEmpty) {
    for (const n of welcomeNotes()) { n._synced = true; S.notes.set(n.id, n); }
    saveLocalNow();
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== LS_NOTES || !e.newValue || !SP.private?.local) return;
    let list; try { list = JSON.parse(e.newValue); } catch { return; }
    applyIncoming(list.filter((d) => d && typeof d.id === "string").map((d) => [d.id, d]), "private");
  });
}
function startLocal() {
  S.mode = "local";
  SP.private = { local: true };
  loadLocalNotes(true);
  setSync("local", "In this browser");
  afterLoad();
}
async function startCloud(db, user, owner) {
  S.mode = "cloud";
  isOwner = owner;
  const uid = user ? await user.id() : null;
  SP.private = owner ? { col: db.collection("notes") } : uid ? { col: db.collection("data/users/" + uid) } : { local: true };
  SP.shared = { col: db.collection("shared") };
  canWriteShared = (user ? await user.can("data.write") : null) !== false;
  setSync("cloud", "Synced");
  const subs = [["private", SP.private.col], ["shared", SP.shared.col]].filter(([, c]) => c);
  let waiting = subs.length;
  if (SP.private.local) loadLocalNotes(false);
  for (const [space, c] of subs) {
    let first = true;
    c.onSnapshot((snap) => {
      applyIncoming(snap.docs.map((d) => [d.id, d.data() || {}]), space);
      if (first) { first = false; if (--waiting === 0) afterLoad(); }
    }, () => setSync("error", "Sync paused, reload"));
  }
  startRoom(user);
}
function applyIncoming(entries, space) {
  const seen = new Set(); let openChanged = false;
  for (const [id, data] of entries) {
    seen.add(id);
    const cur = S.notes.get(id);
    if (cur && cur._moving) continue;
    const inc = normalize(id, data, space);
    if (!cur) { inc._synced = true; S.notes.set(id, inc); if (id === S.selected) openChanged = true; continue; }
    cur.space = space;
    const r = mergeNote(cur, inc);
    cur._synced = true;
    if (r.changed && id === S.selected) openChanged = true;
    if (r.needsSave && !dirty.has(id) && !inflight.has(id)) markDirty(id);
  }
  for (const n of [...S.notes.values()]) {
    if (n.space === space && n._synced && !seen.has(n.id) && !dirty.has(n.id) && !inflight.has(n.id) && !n._moving) S.notes.delete(n.id);
  }
  if (S.selected && !S.notes.has(S.selected)) { S.selected = null; openEditor(); applyLayout(); }
  else if (openChanged && E.note) patchEditor();
  if (loaded) renderSide();
}

let loaded = false;
function afterLoad() {
  if (loaded) return;
  loaded = true;
  purgeOldTrash();
  const wide = matchMedia("(min-width: 761px)").matches;
  const last = prefs.get("last", null);
  const lastNote = last && S.notes.get(last);
  if (wide) {
    const pick = lastNote && !lastNote.trashed ? lastNote : visibleNotes()[0];
    if (pick) { selectNote(pick.id); return; }
  }
  renderAll();
}

/* =====================================================================
   Views + list
   ===================================================================== */
function inView(n) {
  if (S.view === "trash") return !!n.trashed;
  if (n.trashed) return false;
  if (S.view === "pinned") return n.pinned;
  if (S.view === "shared") return n.space === "shared";
  if (S.view === "tag") return derive(n).all.includes(S.tag);
  return true;
}
const terms = () => S.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
function visibleNotes() {
  const q = terms();
  const list = [...S.notes.values()].filter((n) => inView(n) && q.every((t) => derive(n).lower.includes(t)));
  const key = S.view === "trash" ? (n) => -(n.trashed || 0) : S.sort === "created" ? (n) => -n.created : S.sort === "title" ? null : (n) => -n.updated;
  list.sort((a, b) => {
    if (S.view !== "trash" && a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (!key) return (a.title || "￿").localeCompare(b.title || "￿", undefined, { sensitivity: "base" });
    return key(a) - key(b);
  });
  return list;
}
function appendHighlighted(node, text, q) {
  if (!q.length) { node.append(text); return; }
  const re = new RegExp("(" + q.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
  let i = 0;
  for (const m of text.matchAll(re)) {
    node.append(text.slice(i, m.index));
    node.append(el("mark", { text: m[0] }));
    i = m.index + m[0].length;
  }
  node.append(text.slice(i));
}
function viewName() {
  return S.view === "pinned" ? "Pinned" : S.view === "shared" ? "Shared" : S.view === "trash" ? "Trash" : S.view === "tasks" ? "Tasks" : S.view === "tag" ? "#" + S.tag : "All notes";
}
function progressEl(d) {
  const p = Math.round((d.done / d.total) * 100);
  return el("span", { class: "prog" + (d.done === d.total ? " done" : ""), title: `${d.done} of ${d.total} tasks done` },
    el("span", { class: "ring", style: `--p:${p}` }), `${d.done}/${d.total}`);
}
function cardFor(n, q) {
  const d = derive(n);
  const card = el("button", { type: "button", class: "card", "data-id": n.id, style: n.color ? `--tab: var(--c-${n.color})` : null, "aria-current": n.id === S.selected ? "true" : null });
  const t = el("span", { class: "t" + (n.title.trim() ? "" : " untitled") });
  if (n.title.trim()) appendHighlighted(t, n.title, q); else t.textContent = "Untitled";
  let snip = d.snippet;
  if (q.length) {
    const at = d.text.toLowerCase().indexOf(q[0]);
    if (at > 50) snip = "…" + d.text.slice(at - 40).replace(/\s+/g, " ").slice(0, 200);
  }
  const s = el("span", { class: "s" });
  appendHighlighted(s, snip || "No text yet", q);
  const m = el("span", { class: "m" });
  if (n.pinned && S.view !== "trash") m.append(el("span", { class: "pin", html: I.pinFill, title: "Pinned" }));
  if (n.space === "shared") m.append(el("span", { class: "pin shared-ic", html: I.people, title: "Shared" }));
  m.append(el("span", { text: S.view === "trash" ? "Deleted " + rel(n.trashed) : rel(n.updated) }));
  const here = peersOn(n.id);
  if (here.length) m.append(el("span", { class: "live", text: `${here.length} here` }));
  if (d.total) m.append(progressEl(d));
  if (d.all.length) m.append(el("span", { text: d.all.slice(0, 2).map((x) => "#" + x).join(" ") }));
  card.append(t, s, m);
  card.addEventListener("click", () => selectNote(n.id, { focus: false }));
  return card;
}
function renderList() {
  const list = $("list");
  const q = terms();
  $("viewTitle").textContent = viewName();
  $("sortBtn").textContent = S.view === "trash" ? "" : { updated: "Edited ↓", created: "Created ↓", title: "A → Z" }[S.sort];
  $("sortBtn").hidden = S.view === "trash";
  const items = S.mode === "boot" ? [] : visibleNotes();
  $("viewCount").textContent = S.mode === "boot" ? "" : `${items.length}`;
  list.replaceChildren();
  if (S.mode === "boot") { list.append(el("div", { class: "list-empty", text: "Opening your notebook…" })); return; }
  if (S.view === "trash" && items.length && !q.length) {
    list.append(el("div", { style: "display:flex;justify-content:space-between;align-items:center;padding:4px 4px 2px;font-size:.8rem;color:var(--ink-3)" },
      el("span", { text: `Notes here are deleted after ${TRASH_DAYS} days.` }),
      confirmButton("Empty trash", "Empty it?", emptyTrash, "link-btn")));
  }
  if (!items.length) {
    const box = el("div", { class: "list-empty" });
    if (q.length) box.append(el("strong", { text: "Nothing matches" }), el("span", { text: `No note in ${viewName()} contains “${S.query.trim()}”.` }), el("button", { class: "link-btn", type: "button", text: "Clear search", onclick: clearSearch }));
    else if (S.view === "trash") box.append(el("strong", { text: "Trash is empty" }), el("span", { text: "Deleted notes wait here for 30 days, so you can bring them back." }));
    else if (S.view === "shared") box.append(el("strong", { text: "Nothing shared yet" }), el("span", { text: "Notes here can be opened and edited by everyone you give access to this page. Start one with New note, or move a note here with the Share button above it." }), canWriteShared ? el("button", { class: "link-btn", type: "button", text: "Start a shared note", onclick: () => newNote() }) : null);
    else if (S.view === "pinned") box.append(el("strong", { text: "Nothing pinned" }), el("span", { text: "Pin a note with the pin button above it to keep it close." }));
    else if (S.view === "tag") box.append(el("strong", { text: "No notes with this tag" }));
    else box.append(el("strong", { text: "No notes yet" }), el("span", { text: "Start one with New note. Folio saves every keystroke." }), el("button", { class: "link-btn", type: "button", text: "Start a note", onclick: () => newNote() }));
    list.append(box);
    return;
  }
  const pinned = S.view === "trash" ? [] : items.filter((n) => n.pinned);
  const rest = S.view === "trash" ? items : items.filter((n) => !n.pinned);
  if (pinned.length && rest.length && S.view !== "pinned") list.append(el("div", { class: "list-label", text: "Pinned" }));
  pinned.forEach((n) => list.append(cardFor(n, q)));
  if (pinned.length && rest.length && S.view !== "pinned") list.append(el("div", { class: "list-label", text: "Notes" }));
  rest.forEach((n) => list.append(cardFor(n, q)));
}

function renderNav() {
  const notes = active();
  let open = 0; for (const n of notes) { const d = derive(n); open += d.total - d.done; }
  const trashCount = S.notes.size - notes.length;
  const item = (key, icon, label, count, onclick, current) =>
    el("button", { type: "button", class: "nav-item", "aria-current": current ? "true" : null, onclick, "data-nav": key },
      el("span", { html: icon, style: "display:contents" }), el("span", { class: "lbl", text: label }), count != null ? el("span", { class: "n", text: String(count) }) : null);
  $("navMain").replaceChildren(
    item("all", I.notes, "All notes", notes.length, () => setView("all"), S.view === "all"),
    item("today", I.today, "Today", null, openToday, false),
    item("tasks", I.tasks, "Tasks", open || null, () => setView("tasks"), S.view === "tasks"),
    SP.shared ? item("shared", I.people, "Shared", notes.filter((n) => n.space === "shared").length || null, () => setView("shared"), S.view === "shared") : null,
    item("pinned", I.pin, "Pinned", notes.filter((n) => n.pinned).length || null, () => setView("pinned"), S.view === "pinned"),
    item("trash", I.trash, "Trash", trashCount || null, () => setView("trash"), S.view === "trash"),
  );
  const counts = new Map();
  for (const n of notes) for (const t of derive(n).all) counts.set(t, (counts.get(t) || 0) + 1);
  if (S.view === "tag" && !counts.has(S.tag) && loaded) { S.view = "all"; S.tag = null; }
  const tags = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  $("navTags").replaceChildren(...(tags.length ? tags.map(([t, c]) =>
    el("button", { type: "button", class: "nav-item", "aria-current": S.view === "tag" && S.tag === t ? "true" : null, onclick: () => setView("tag", t) },
      el("span", { class: "hash", text: "#" }), el("span", { class: "lbl", text: t }), el("span", { class: "n", text: String(c) })))
    : [el("div", { class: "nav-empty", text: "Add a tag under any note's title and it appears here." })]));
  const dl = $("tagOptions") || document.body.appendChild(el("datalist", { id: "tagOptions" }));
  dl.replaceChildren(...tags.map(([t]) => el("option", { value: t })));
}

let sideTimer = 0;
function renderSide() {
  renderNav(); renderList();
  if (S.view === "tasks") renderTasks();
  else if (E.note) refreshMeta();
}
function scheduleSide() { clearTimeout(sideTimer); sideTimer = setTimeout(renderSide, 140); }
function renderAll() { applyLayout(); renderNav(); renderList(); renderSheet(); }

function applyLayout() {
  const app = $("app");
  app.classList.toggle("focus-mode", S.focus);
  app.classList.toggle("tasks-mode", S.view === "tasks");
  app.dataset.pane = S.view === "tasks" || S.selected ? "editor" : "list";
  $("focusBtn").setAttribute("aria-pressed", String(S.focus));
}
function setView(view, tag = null) {
  closeCover();
  if (S.view === view && S.tag === tag && view !== "tasks") { if (!matchMedia("(min-width: 761px)").matches) selectNote(null); return; }
  S.view = view; S.tag = tag;
  if (view === "tasks") { if (S.selected) { flush(S.selected); pruneIfEmpty(S.selected); } S.selected = null; E.note = null; renderAll(); $("tasksView").scrollTop = 0; return; }
  const vis = visibleNotes();
  const cur = S.notes.get(S.selected);
  if (!cur || !inView(cur)) {
    const wide = matchMedia("(min-width: 761px)").matches;
    selectNote(wide && vis[0] ? vis[0].id : null);
    return;
  }
  renderAll();
}
function clearSearch() { S.query = ""; $("search").value = ""; renderList(); }

/* =====================================================================
   Sheet: blank / editor / tasks
   ===================================================================== */
function renderSheet() {
  const tasks = S.view === "tasks";
  const n = !tasks && S.notes.get(S.selected);
  $("tasksView").hidden = !tasks;
  $("sheetBar").hidden = !n; $("sheetScroll").hidden = !n; $("dock").hidden = !n || !!n.trashed;
  $("blank").hidden = tasks || !!n;
  if (tasks) renderTasks();
  else if (!n) renderBlank();
}
function templateGrid() {
  return el("div", { class: "tpl-grid" }, ...TEMPLATES.map((t) =>
    el("button", { type: "button", class: "tpl", onclick: () => newNote(t.id) },
      el("span", { class: "ico", html: t.icon }), el("b", { text: t.name }), el("small", { text: t.desc }))));
}
function renderBlank() {
  const box = $("blankInner");
  if (S.mode === "boot") { box.replaceChildren(el("h2", { text: "Opening your notebook…" })); return; }
  const none = !active().length;
  box.replaceChildren(
    el("h2", { text: none ? "A clean sheet" : "Pick a note, or start a new one" }),
    el("p", { text: none ? "Choose a starting point. Folio saves as you type, so there's nothing to remember." : "Choose a card from the list, or start from one of these." }),
    templateGrid(),
    el("div", { class: "keys" },
      el("span", {}, el("kbd", { text: "Alt" }), el("kbd", { text: "N" })), el("span", { text: "New note" }),
      el("span", {}, el("kbd", { text: MOD }), el("kbd", { text: "K" })), el("span", { text: "Search and commands" }),
      el("span", {}, el("kbd", { text: "Alt" }), el("kbd", { text: "T" })), el("span", { text: "Today's page" }),
      el("span", {}, el("kbd", { text: "?" })), el("span", { text: "All keyboard shortcuts" })),
  );
}

/* ---------- Tasks board ---------- */
function renderTasks() {
  const view = $("tasksView");
  const groups = []; let open = 0, done = 0;
  for (const n of active().sort((a, b) => b.updated - a.updated)) {
    const todos = n.blocks.filter((b) => b.t === "todo");
    const o = todos.filter((b) => !b.c).length; open += o; done += todos.length - o;
    const items = todos.filter((b) => S.showDone || !b.c);
    if (items.length) groups.push({ n, items, o, total: todos.length });
  }
  const input = el("input", { id: "quickTask", type: "text", placeholder: "Add a task to today's page, then press Enter", autocomplete: "off", "aria-label": "New task" });
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.isComposing || !input.value.trim()) return;
    const d = ensureToday();
    const nb = B("todo", escHtml(input.value.trim()));
    const lastTodo = [...d.blocks].reverse().find((b) => b.t === "todo");
    if (lastTodo && !lastTodo.h && !lastTodo.c) lastTodo.h = nb.h; // fill the first empty slot
    else { const at = lastTodo ? d.blocks.indexOf(lastTodo) + 1 : d.blocks.length; d.blocks.splice(at, 0, nb); }
    bump(d); input.value = ""; renderTasks(); renderNav(); $("quickTask").focus();
  });
  const head = el("div", { class: "tasks-head" },
    el("button", { class: "icon-btn menu-btn", type: "button", "aria-label": "Open notebook menu", html: I.menu, onclick: openCover }),
    el("h2", { text: "Tasks" }),
    el("span", { class: "count", text: `${open} open · ${done} done` }),
    el("span", { class: "spacer" }),
    el("button", { class: "ghost", type: "button", text: S.showDone ? "Hide completed" : "Show completed", onclick: () => { S.showDone = !S.showDone; prefs.set("showDone", S.showDone); renderTasks(); } }));
  const inner = el("div", { class: "tasks-inner" }, head, el("label", { class: "quick-add" }, el("span", { class: "box" }), input));
  if (!groups.length) {
    inner.append(el("div", { class: "tasks-empty" }, el("b", { text: open || done ? "Everything's done" : "No tasks yet" }),
      open || done ? "Every checkbox in every note is ticked. Nice." : "Add one above, or make a checklist in any note: press Checklist in the dock, or type [] and a space."));
  }
  for (const g of groups) {
    const sec = el("section", { class: "task-group", style: g.n.color ? `--tab: var(--c-${g.n.color})` : null },
      el("header", {}, g.n.space === "shared" ? el("span", { class: "shared-ic", html: I.people, title: "Shared" }) : null, el("button", { type: "button", text: g.n.title.trim() || "Untitled", onclick: () => { S.view = "all"; selectNote(g.n.id); } }), el("span", { text: `${g.total - g.o}/${g.total} done` })));
    for (const b of g.items) {
      const row = el("div", { class: "task-row blk", "data-t": "todo", style: `--i:${b.i || 0}` });
      if (b.c) row.dataset.c = "1";
      const chk = el("button", { class: "chk", type: "button", role: "checkbox", "aria-checked": String(!!b.c), "aria-label": b.c ? "Mark as not done" : "Mark as done", html: `<span class="box">${I.check}</span>` });
      chk.addEventListener("click", () => {
        b.c = !b.c; bump(g.n);
        row.dataset.c = b.c ? "1" : ""; if (!b.c) delete row.dataset.c;
        chk.setAttribute("aria-checked", String(b.c));
        row.classList.remove("pop"); void row.offsetWidth; row.classList.add("pop");
        clearTimeout(renderTasks.t); renderTasks.t = setTimeout(() => { renderTasks(); renderNav(); }, S.showDone ? 0 : 700);
      });
      const txt = el("div", { class: "txt", html: b.h || '<span style="color:var(--ink-3)">Empty task</span>' });
      resolveChips(txt);
      row.append(chk, txt);
      sec.append(row);
    }
    inner.append(sec);
  }
  view.replaceChildren(inner);
}
function bump(n) { edited(n); }

/* =====================================================================
   Notes: create, select, trash
   ===================================================================== */
function ensureToday() {
  const key = todayKey();
  let n = active().find((x) => x.daily === key);
  if (!n) {
    n = normalize(uid(), { title: longDate(), blocks: dailyBlocks(), tags: ["journal"], daily: key, created: Date.now(), updated: Date.now() });
    S.notes.set(n.id, n); markDirty(n.id);
  }
  return n;
}
function openToday() {
  closeCover();
  const n = ensureToday();
  if (S.view !== "all") S.view = "all";
  selectNote(n.id, { focus: true });
}
function newNote(tplId = "blank", opts = {}) {
  if (S.mode === "boot") return null;
  const tpl = TEMPLATES.find((t) => t.id === tplId) || TEMPLATES[0];
  const now = Date.now();
  const n = normalize(uid(), {
    title: opts.title != null ? opts.title : tpl.title ? tpl.title() : "",
    blocks: tpl.blocks(), tags: S.view === "tag" && !opts.silent ? [S.tag] : [], created: now, updated: now,
  }, opts.space || (S.view === "shared" && SP.shared && canWriteShared ? "shared" : E.note && opts.silent ? E.note.space : "private"));
  S.notes.set(n.id, n);
  markDirty(n.id);
  if (opts.silent) return n;
  closeCover();
  if (S.view === "trash" || S.view === "tasks" || S.view === "pinned") S.view = "all";
  sendPresence();
  clearSearch();
  selectNote(n.id, { focus: tpl.focus === "body" ? "body" : "title" });
  return n;
}
function pruneIfEmpty(id) {
  const n = S.notes.get(id);
  if (n && !n.trashed && isBlankNote(n)) { S.notes.delete(id); removeStored(n); }
}
function selectNote(id, opts = {}) {
  if (S.selected && S.selected !== id) { if (dirty.has(S.selected)) flush(S.selected); pruneIfEmpty(S.selected); }
  if (id && S.view === "tasks") S.view = "all";
  S.selected = id || null;
  closePop(); hideFmt(); hideLinkPop();
  if (id) prefs.set("last", id);
  applyLayout();
  openEditor();
  renderNav(); renderList(); sendPresence();
  const card = $("list").querySelector(`.card[data-id="${id}"]`);
  if (card) card.scrollIntoView({ block: "nearest" });
  if (id && opts.focus && !E.note.trashed) {
    if (opts.focus === "title" || (opts.focus === true && !E.note.title)) { $("titleInput").focus(); }
    else { const first = E.note.blocks.find((b) => b.t !== "hr" && !b.h) || E.note.blocks[0]; focusBlock(first.id, "end"); }
  }
}
function moveToTrash(id) {
  const n = S.notes.get(id); if (!n) return;
  n.trashed = Date.now(); edited(n);
  const vis = visibleNotes();
  const wide = matchMedia("(min-width: 761px)").matches;
  S.selected = null;
  selectNote(wide && vis[0] ? vis[0].id : null);
  toast(`Moved “${n.title.trim() || "Untitled"}” to trash`, () => { n.trashed = null; edited(n); selectNote(id); });
}
function restoreNote(id) {
  const n = S.notes.get(id); if (!n) return;
  n.trashed = null; edited(n);
  toast("Restored to All notes");
  const vis = visibleNotes();
  selectNote(vis[0] ? vis[0].id : null);
}
function purgeNote(id) {
  const n = S.notes.get(id); if (!n) return;
  S.notes.delete(id); removeStored(n);
  const vis = visibleNotes();
  selectNote(vis[0] && matchMedia("(min-width: 761px)").matches ? vis[0].id : null);
  toast("Deleted forever");
}
function emptyTrash() {
  for (const n of [...S.notes.values()]) if (n.trashed && (n.space === "private" || canWriteShared)) { S.notes.delete(n.id); removeStored(n); }
  selectNote(null); toast("Trash emptied");
}
function duplicateNote(id) {
  const n = S.notes.get(id); if (!n) return;
  const now = Date.now();
  const c = normalize(uid(), { ...serialize(n), title: (n.title || "Untitled") + " (copy)", blocks: n.blocks.map((b) => ({ ...b, id: uid("b") })), pinned: false, daily: null, created: now, updated: now }, n.space);
  S.notes.set(c.id, c); markDirty(c.id);
  selectNote(c.id); toast("Duplicated");
}
function confirmButton(label, confirmLabel, run, cls = "ghost danger") {
  const b = el("button", { type: "button", class: cls, text: label });
  let armed = 0;
  b.addEventListener("click", () => {
    if (armed) { clearTimeout(armed); armed = 0; run(); return; }
    b.textContent = confirmLabel;
    armed = setTimeout(() => { armed = 0; b.textContent = label; }, 3000);
  });
  return b;
}

/* =====================================================================
   Editor
   ===================================================================== */
const E = { root: $("blocks"), note: null, focusId: null, sel: new Set(), anchor: null, head: null, menu: null, hist: { past: [], future: [], kind: null, t: 0, bid: null }, drag: null, dragSel: null };
const readOnly = () => !E.note || !!E.note.trashed || (E.note.space === "shared" && !canWriteShared);
const bIndex = (id) => E.note.blocks.findIndex((b) => b.id === id);
const bGet = (id) => E.note && E.note.blocks.find((b) => b.id === id);
const blkEl = (id) => E.root.querySelector(`.blk[data-id="${id}"]`);
const txtEl = (id) => { const b = blkEl(id); return b && b.querySelector(".txt"); };
const idOf = (node) => { const b = node && (node.nodeType === 1 ? node : node.parentElement)?.closest(".blk"); return b && E.root.contains(b) ? b.dataset.id : null; };
const txtOf = (node) => { const t = node && (node.nodeType === 1 ? node : node.parentElement)?.closest(".txt"); return t && E.root.contains(t) ? t : null; };
const isEmptyTxt = (t) => !t.textContent && !t.querySelector(".wl");
const editorFocused = () => { const a = document.activeElement; return !!a && (E.root.contains(a) || a === $("titleInput")); };

function openEditor() {
  const n = S.notes.get(S.selected);
  E.note = n || null; E.focusId = null; E.sel.clear(); E.menu = null;
  E.hist = { past: [], future: [], kind: null, t: 0, bid: null };
  renderSheet();
  if (!n) return;
  const ti = $("titleInput");
  ti.value = n.title; ti.readOnly = !!n.trashed; autosizeTitle(); requestAnimationFrame(autosizeTitle);
  $("trashBanner").hidden = !n.trashed;
  renderBlocks();
  refreshMeta();
  $("sheetScroll").scrollTop = 0;
}
function autosizeTitle() { const ti = $("titleInput"); ti.style.height = "auto"; ti.style.height = ti.scrollHeight + "px"; }

function blockNode(b, num, onlyBlock) {
  const wrap = el("div", { class: "blk", "data-id": b.id, "data-t": b.t, "data-i": String(b.i || 0), style: `--i:${b.i || 0}` });
  if (b.t === "todo" && b.c) wrap.dataset.c = "1";
  wrap._j = J(b);
  if (!readOnly()) wrap.append(el("div", { class: "gutter" }, el("button", { class: "grip", type: "button", tabindex: "-1", "aria-label": "Drag to move, click for options", title: "Drag to move · click for options", html: I.grip })));
  if (b.t === "hr") { wrap.append(el("div", { class: "rule" })); return wrap; }
  if (b.t === "todo") wrap.append(el("button", { class: "chk", type: "button", role: "checkbox", "aria-checked": String(!!b.c), "aria-label": b.c ? "Mark as not done" : "Mark as done", html: `<span class="box">${I.check}</span>` }));
  else if (b.t === "ul") wrap.append(el("span", { class: "marker bul", "aria-hidden": "true" }));
  else if (b.t === "ol") wrap.append(el("span", { class: "marker num", "aria-hidden": "true", text: (num || 1) + "." }));
  else if (b.t === "callout") wrap.append(el("span", { class: "marker", "aria-hidden": "true", html: I.callout }));
  const txt = el("div", { class: "txt", "data-ph": PH[b.t] || "", spellcheck: "true" });
  if (!readOnly()) { txt.contentEditable = "true"; txt.setAttribute("role", "textbox"); txt.setAttribute("aria-multiline", "true"); txt.setAttribute("aria-label", TYPES[b.t].label); }
  txt.innerHTML = b.h;
  if (!b.h) txt.classList.add("empty");
  if (onlyBlock) { txt.classList.add("always"); txt.dataset.ph = "Start writing, or type / for checklists, headings and more"; }
  wrap.append(txt);
  return wrap;
}
function renderBlocks() {
  const n = E.note; if (!n) return;
  const nums = olNumbers(n.blocks);
  const only = n.blocks.length === 1 && n.blocks[0].t === "p" && !n.blocks[0].h && !readOnly();
  E.root.replaceChildren(...n.blocks.map((b) => blockNode(b, nums[b.id], only)));
  resolveChips(E.root);
  if (E.focusId) blkEl(E.focusId)?.classList.add("focus");
  for (const id of E.sel) blkEl(id)?.classList.add("sel");
  $("addBelow").hidden = readOnly();
  updateDock();
}
function resolveChips(root) {
  root.querySelectorAll("a.wl").forEach((a) => {
    const n = S.notes.get(a.dataset.id);
    const ok = n && !n.trashed;
    a.classList.toggle("missing", !ok);
    if (ok) { const t = n.title.trim() || "Untitled"; if (a.textContent !== t) a.textContent = t; a.title = "Open " + t; }
    else a.title = "This note was deleted";
  });
}
function refreshMeta() {
  const n = E.note; if (!n) return;
  const d = derive(n);
  $("crumbView").textContent = viewName();
  $("crumbNote").textContent = n.title.trim() || "Untitled";
  $("statWords").textContent = `${d.words.toLocaleString()} ${d.words === 1 ? "word" : "words"}`;
  const sb = $("shareBtn");
  sb.hidden = !SP.shared;
  if (SP.shared) {
    const shared = n.space === "shared";
    sb.dataset.space = n.space;
    sb.replaceChildren(el("span", { html: shared ? I.people : I.lock, style: "display:contents" }), el("span", { class: "lab", text: shared ? "Shared" : "Private" }));
    sb.title = shared ? "Everyone with access to this page can open and edit this note" : "Only you can see this note";
  }
  if (n.space === "shared" && !canWriteShared && !n.trashed) $("statSave").textContent = "View only";
  $("pinBtn").setAttribute("aria-pressed", String(n.pinned));
  $("pinBtn").setAttribute("aria-label", n.pinned ? "Unpin note" : "Pin note");
  const dot = $("colorDot");
  dot.setAttribute("fill", n.color ? `var(--c-${n.color})` : "none");
  dot.setAttribute("stroke", n.color ? `var(--c-${n.color})` : "currentColor");
  // tags
  const meta = $("noteMeta");
  const adding = document.activeElement && document.activeElement.id === "tagAdd";
  if (!adding) {
    const pills = d.tags.map((t) => el("span", { class: "tag-pill" }, "#" + t, readOnly() ? null : el("button", { type: "button", "aria-label": `Remove tag ${t}`, html: I.x, onclick: () => { n.tags = n.tags.filter((x) => x !== t); bump(n); refreshMeta(); scheduleSide(); } })));
    const inl = d.inline.map((t) => el("span", { class: "tag-pill inline", title: "From a #tag in the text", text: "#" + t }));
    const input = readOnly() ? null : el("input", { class: "tag-add", id: "tagAdd", placeholder: d.all.length ? "+ tag" : "+ Add a tag", list: "tagOptions", autocomplete: "off", "aria-label": "Add a tag" });
    if (input) {
      const commit = () => { const t = cleanTag(input.value); input.value = ""; if (t && !n.tags.includes(t)) { n.tags.push(t); bump(n); scheduleSide(); } refreshMetaSoon(); };
      input.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === "," || (e.key === "Tab" && input.value)) && !e.isComposing) { e.preventDefault(); commit(); setTimeout(() => $("tagAdd")?.focus(), 0); }
        else if (e.key === "Backspace" && !input.value && n.tags.length) { n.tags.pop(); bump(n); scheduleSide(); refreshMetaSoon(true); }
        else if (e.key === "Escape") { input.value = ""; input.blur(); }
      });
      input.addEventListener("blur", () => { if (input.value.trim()) commit(); else refreshMetaSoon(); });
    }
    meta.replaceChildren(...pills, ...inl, input || "");
  }
  // task progress
  const tb = $("taskbar");
  tb.hidden = !d.total;
  if (d.total) {
    const p = Math.round((d.done / d.total) * 100);
    tb.style.setProperty("--p", p);
    tb.classList.toggle("done", d.done === d.total);
    $("taskText").textContent = d.done === d.total ? `All ${d.total} done` : `${d.done} of ${d.total} done`;
  }
  // backlinks
  const bl = $("backlinks");
  const refs = active().filter((x) => x.id !== n.id && x.blocks.some((b) => b.h.includes(`data-id="${n.id}"`)));
  bl.hidden = !refs.length;
  if (refs.length) {
    bl.replaceChildren(el("h4", { text: `Linked from ${refs.length} ${refs.length === 1 ? "note" : "notes"}` }), ...refs.map((x) => {
      const blk = x.blocks.find((b) => b.h.includes(`data-id="${n.id}"`));
      return el("button", { type: "button", class: "backlink", onclick: () => selectNote(x.id) }, el("b", { text: x.title.trim() || "Untitled" }), el("span", { text: htmlToText(blk.h) }));
    }));
  }
}
function refreshMetaSoon(focusTag) { setTimeout(() => { refreshMeta(); if (focusTag) $("tagAdd")?.focus(); }, 0); }

/* ---------- edit bookkeeping ---------- */
function touch() { edited(E.note); }
function syncFromDom(id) {
  const b = bGet(id), t = txtEl(id);
  if (!b || !t) return;
  b.h = sanitizeInline(t.innerHTML);
  t.classList.toggle("empty", isEmptyTxt(t));
  const w = blkEl(id); if (w) w._j = J(b);
}
function rebuild(focusId, pos) {
  renderBlocks(); touch();
  if (focusId) focusBlock(focusId, pos);
}

/* ---------- caret ---------- */
function caretOffset(root) {
  const sel = getSelection(); if (!sel.rangeCount) return 0;
  const r = sel.getRangeAt(0);
  if (!root.contains(r.startContainer)) return 0;
  const pre = document.createRange(); pre.selectNodeContents(root);
  try { pre.setEnd(r.startContainer, r.startOffset); } catch { return 0; }
  return nodeLen(pre.cloneContents());
}
function setCaret(root, off) {
  const r = document.createRange(); let done = false;
  (function walk(n) {
    for (const c of n.childNodes) {
      if (done) return;
      if (c.nodeType === 3) { const L = c.nodeValue.length; if (off <= L) { r.setStart(c, off); done = true; return; } off -= L; }
      else if (c.nodeType === 1) {
        if (c.tagName === "BR" || c.classList.contains("wl")) {
          if (off === 0) { r.setStartBefore(c); done = true; return; }
          off -= 1;
          if (off === 0 && c.classList.contains("wl") && !c.nextSibling) { r.setStartAfter(c); done = true; return; }
        } else walk(c);
      }
    }
  })(root);
  if (!done) { r.selectNodeContents(root); r.collapse(false); }
  r.collapse(true);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
}
function caretCollapsed() { const s = getSelection(); return s.rangeCount > 0 && s.isCollapsed; }
function caretRect() {
  const sel = getSelection(); if (!sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  const rects = r.getClientRects();
  let rect = rects[rects.length ? (r.collapsed ? 0 : rects.length - 1) : 0];
  if (!rect || (!rect.top && !rect.left && !rect.height)) {
    const t = txtOf(r.startContainer) || (r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement);
    if (!t) return null;
    const tr = t.getBoundingClientRect(); const cs = getComputedStyle(t);
    const lh = parseFloat(cs.lineHeight) || 24; const pt = parseFloat(cs.paddingTop) || 0; const pl = parseFloat(cs.paddingLeft) || 0;
    return { top: tr.top + pt, bottom: tr.top + pt + lh, left: tr.left + pl, right: tr.left + pl, height: lh };
  }
  return rect;
}
function lineInfo(t) {
  const cs = getComputedStyle(t); const tr = t.getBoundingClientRect();
  return { lh: parseFloat(cs.lineHeight) || 24, top: tr.top + (parseFloat(cs.paddingTop) || 0), bottom: tr.bottom - (parseFloat(cs.paddingBottom) || 0) };
}
function atFirstLine(t) { const r = caretRect(); if (!r) return true; const L = lineInfo(t); return r.top - L.top < L.lh * 0.75; }
function atLastLine(t) { const r = caretRect(); if (!r) return true; const L = lineInfo(t); return L.bottom - r.bottom < L.lh * 0.75; }
function ensureVisible(node) {
  const sc = $("sheetScroll"); if (!node || sc.hidden) return;
  const r = (document.activeElement === node && caretRect()) || node.getBoundingClientRect();
  const s = sc.getBoundingClientRect();
  if (r.bottom > s.bottom - 100) sc.scrollTop += r.bottom - (s.bottom - 100);
  else if (r.top < s.top + 16) sc.scrollTop -= s.top + 16 - r.top;
}
function focusBlock(id, pos = "end") {
  const t = txtEl(id);
  if (!t) { if (blkEl(id)) selectBlocks([id]); return; }
  t.focus({ preventScroll: true });
  if (pos === "start") setCaret(t, 0);
  else if (pos === "end") setCaret(t, nodeLen(t));
  else setCaret(t, pos);
  ensureVisible(t);
}
function focusAtX(id, x, fromBelow) {
  const t = txtEl(id);
  if (!t) { selectBlocks([id]); return; }
  t.focus({ preventScroll: true });
  ensureVisible(blkEl(id));
  const L = lineInfo(t);
  const y = fromBelow ? L.bottom - L.lh / 2 : L.top + L.lh / 2;
  let r = null;
  if (document.caretRangeFromPoint) r = document.caretRangeFromPoint(x, y);
  else if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); if (p) { r = document.createRange(); r.setStart(p.offsetNode, p.offset); } }
  if (r && t.contains(r.startContainer)) { r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  else setCaret(t, fromBelow ? nodeLen(t) : 0);
}
const neighbor = (id, d) => E.note.blocks[bIndex(id) + d];

/* ---------- history ---------- */
function snap() {
  let caret = null;
  if (E.focusId) { const t = txtEl(E.focusId); caret = { id: E.focusId, off: t && document.activeElement === t ? caretOffset(t) : null }; }
  return { blocks: E.note.blocks.map((b) => ({ ...b })), caret, sel: [...E.sel] };
}
function checkpoint(kind) {
  if (!E.note || readOnly()) return;
  const H = E.hist; const now = Date.now();
  if (kind === "type" && H.kind === "type" && H.bid === E.focusId && now - H.t < 1500) { H.t = now; return; }
  H.past.push(snap()); if (H.past.length > 300) H.past.shift();
  H.future.length = 0; H.kind = kind; H.t = now; H.bid = E.focusId;
}
function restoreSnap(s) {
  E.note.blocks = s.blocks.map((b) => ({ ...b }));
  clearBlockSel(); renderBlocks(); touch();
  if (s.sel && s.sel.length && s.sel.every((id) => bGet(id))) selectBlocks(s.sel);
  else if (s.caret && bGet(s.caret.id)) focusBlock(s.caret.id, s.caret.off == null ? "end" : s.caret.off);
}
function undo() { const H = E.hist; if (!E.note || !H.past.length) return; if (E.focusId) syncFromDom(E.focusId); H.future.push(snap()); restoreSnap(H.past.pop()); H.kind = null; }
function redo() { const H = E.hist; if (!E.note || !H.future.length) return; H.past.push(snap()); restoreSnap(H.future.pop()); H.kind = null; }

/* ---------- structural operations ---------- */
function splitAtCaret(id) {
  const b = bGet(id), t = txtEl(id); const sel = getSelection();
  if (!b || !t || !sel.rangeCount) return;
  syncFromDom(id); checkpoint("struct");
  const r = sel.getRangeAt(0);
  if (!r.collapsed) r.deleteContents();
  const off = caretOffset(t); const len = nodeLen(t); const empty = isEmptyTxt(t);
  if (empty && (LISTY.has(b.t) || b.t === "quote" || b.t === "callout" || (b.t === "p" && b.i))) {
    if (b.i > 0) b.i--; else { b.t = "p"; delete b.c; }
    b.h = ""; return rebuild(id, 0);
  }
  const idx = bIndex(id);
  const nextType = LISTY.has(b.t) ? b.t : "p";
  if (off === 0 && len > 0) {
    const nb = B(LISTY.has(b.t) ? b.t : "p", "", { i: INDENTABLE.has(b.t) ? b.i : 0 });
    E.note.blocks.splice(idx, 0, nb);
    syncFromDom(id); return rebuild(id, 0);
  }
  const after = document.createRange();
  const sr = sel.getRangeAt(0);
  after.setStart(sr.startContainer, sr.startOffset); after.setEnd(t, t.childNodes.length);
  const box = document.createElement("div"); box.append(after.extractContents());
  b.h = sanitizeInline(t.innerHTML);
  const nb = B(nextType, sanitizeInline(box.innerHTML), { i: INDENTABLE.has(b.t) ? b.i : 0 });
  E.note.blocks.splice(idx + 1, 0, nb);
  rebuild(nb.id, 0);
}
function backspaceAtStart(id) {
  const b = bGet(id); if (!b) return;
  const idx = bIndex(id);
  syncFromDom(id);
  if (b.t !== "p") { checkpoint("struct"); if (LISTY.has(b.t) && b.i > 0) b.i--; else { b.t = "p"; delete b.c; } return rebuild(id, 0); }
  if (b.i > 0) { checkpoint("struct"); b.i--; return rebuild(id, 0); }
  const prev = E.note.blocks[idx - 1];
  if (!prev) return;
  checkpoint("struct");
  if (prev.t === "hr") { E.note.blocks.splice(idx - 1, 1); return rebuild(id, 0); }
  const off = htmlLen(prev.h);
  prev.h = sanitizeInline(prev.h + b.h);
  E.note.blocks.splice(idx, 1);
  rebuild(prev.id, off);
}
function deleteAtEnd(id) {
  const b = bGet(id); const next = neighbor(id, 1); if (!b || !next) return;
  syncFromDom(id); checkpoint("struct");
  if (next.t === "hr") { E.note.blocks.splice(bIndex(next.id), 1); return rebuild(id, htmlLen(b.h)); }
  const off = htmlLen(b.h);
  b.h = sanitizeInline(b.h + next.h);
  E.note.blocks.splice(bIndex(next.id), 1);
  rebuild(id, off);
}
function indentBlocks(ids, dir) {
  const t = E.focusId && txtEl(E.focusId); const off = t && document.activeElement === t ? caretOffset(t) : null;
  ids.forEach(syncFromDom); checkpoint("struct");
  let changed = false;
  for (const id of ids) {
    const b = bGet(id); if (!INDENTABLE.has(b.t)) continue;
    const prev = neighbor(id, -1);
    const max = prev ? Math.min(4, (prev.i || 0) + 1) : 0;
    const ni = clamp((b.i || 0) + dir, 0, max);
    if (ni !== b.i) { b.i = ni; changed = true; }
  }
  if (!changed) { E.hist.past.pop(); return; }
  renderBlocks(); touch();
  if (!E.sel.size && E.focusId) focusBlock(E.focusId, off ?? "end");
}
function setTypes(ids, type) {
  const ft = E.focusId && txtEl(E.focusId);
  const off = ft && document.activeElement === ft ? caretOffset(ft) : null;
  ids.forEach(syncFromDom); checkpoint("struct");
  if (type === "hr") {
    const lastId = ids[ids.length - 1]; const b = bGet(lastId); const idx = bIndex(lastId);
    clearBlockSel();
    if (ids.length === 1 && b.t === "p" && !b.h) { b.t = "hr"; b.h = ""; b.i = 0; const nb = B("p"); E.note.blocks.splice(idx + 1, 0, nb); return rebuild(nb.id, 0); }
    const nb = B("p"); E.note.blocks.splice(idx + 1, 0, B("hr"), nb); return rebuild(nb.id, 0);
  }
  for (const id of ids) {
    const b = bGet(id); if (!b) continue;
    const was = b.t;
    if (was === "hr") continue;
    b.t = type;
    if (type === "todo") b.c = was === "todo" ? !!b.c : false; else delete b.c;
    if (!INDENTABLE.has(type)) b.i = 0;
    if (type === "code" && was !== "code") b.h = plainToCodeHtml(htmlToText(b.h));
  }
  renderBlocks(); touch();
  if (E.sel.size) updateDock();
  else if (E.focusId) focusBlock(E.focusId, off ?? "end");
}
function toggleTodo(id) {
  const b = bGet(id); if (!b || b.t !== "todo" || readOnly()) return;
  checkpoint("check");
  b.c = !b.c;
  const w = blkEl(id);
  if (w) {
    if (b.c) w.dataset.c = "1"; else delete w.dataset.c;
    const chk = w.querySelector(".chk"); chk.setAttribute("aria-checked", String(b.c)); chk.setAttribute("aria-label", b.c ? "Mark as not done" : "Mark as done");
    w.classList.remove("pop"); void w.offsetWidth; w.classList.add("pop");
  }
  touch(); refreshMeta();
}
function orderedSel() { return E.note.blocks.filter((b) => E.sel.has(b.id)).map((b) => b.id); }
function moveBlocks(ids, dir) {
  const idxs = ids.map(bIndex).sort((a, b) => a - b);
  const lo = idxs[0], hi = idxs[idxs.length - 1];
  if ((dir < 0 && lo === 0) || (dir > 0 && hi === E.note.blocks.length - 1)) return;
  const t = E.focusId && txtEl(E.focusId); const off = t && document.activeElement === t ? caretOffset(t) : null;
  ids.forEach(syncFromDom); checkpoint("struct");
  const bl = E.note.blocks;
  const chunk = bl.splice(lo, hi - lo + 1);
  bl.splice(lo + dir, 0, ...chunk);
  renderBlocks(); touch();
  if (E.sel.size) blkEl(ids[0])?.scrollIntoView({ block: "nearest" });
  else if (E.focusId) focusBlock(E.focusId, off ?? "end");
}
function duplicateBlocks(ids) {
  ids.forEach(syncFromDom); checkpoint("struct");
  const ordered = E.note.blocks.filter((b) => ids.includes(b.id));
  const copies = ordered.map((b) => ({ ...b, id: uid("b") }));
  const at = Math.max(...ordered.map((b) => bIndex(b.id))) + 1;
  E.note.blocks.splice(at, 0, ...copies);
  renderBlocks(); touch();
  if (E.sel.size || copies.length > 1 || copies[0].t === "hr") selectBlocks(copies.map((c) => c.id));
  else focusBlock(copies[0].id, "end");
}
function deleteBlocks(ids) {
  checkpoint("struct");
  const first = Math.min(...ids.map(bIndex));
  E.note.blocks = E.note.blocks.filter((b) => !ids.includes(b.id));
  clearBlockSel();
  let focus;
  if (!E.note.blocks.length) { const nb = B("p"); E.note.blocks.push(nb); focus = [nb.id, 0]; }
  else { const prev = E.note.blocks[first - 1]; const next = E.note.blocks[first]; focus = prev ? [prev.id, "end"] : [next.id, "start"]; }
  renderBlocks(); touch();
  focusBlock(focus[0], focus[1]);
}
function appendParagraph() {
  const last = E.note.blocks[E.note.blocks.length - 1];
  if (last && last.t === "p" && !last.h) { focusBlock(last.id, "end"); return; }
  checkpoint("struct");
  const nb = B("p"); E.note.blocks.push(nb); rebuild(nb.id, 0);
}

/* ---------- block selection ---------- */
function selectBlocks(ids, anchor, head) {
  clearBlockSel();
  for (const id of ids) { E.sel.add(id); blkEl(id)?.classList.add("sel"); }
  E.anchor = anchor ?? ids[0]; E.head = head ?? ids[ids.length - 1];
  const a = document.activeElement;
  if (a && E.root.contains(a)) a.blur();
  getSelection().removeAllRanges();
  hideFmt(); updateDock();
}
function clearBlockSel() { for (const id of E.sel) blkEl(id)?.classList.remove("sel"); E.sel.clear(); }
function rangeIds(aId, bId) {
  const a = bIndex(aId), b = bIndex(bId); const lo = Math.min(a, b), hi = Math.max(a, b);
  return E.note.blocks.slice(lo, hi + 1).map((x) => x.id);
}
function selKeys(e) {
  const m = modKey(e); const k = e.key; const ids = orderedSel();
  if (!ids.length) return false;
  if (k === "Escape") { clearBlockSel(); updateDock(); return true; }
  if (k === "Enter") { const id = E.head || ids[ids.length - 1]; clearBlockSel(); focusBlock(id, "end"); return true; }
  if (k === "Backspace" || k === "Delete") { deleteBlocks(ids); return true; }
  if (m && e.shiftKey && (k === "ArrowUp" || k === "ArrowDown")) { moveBlocks(ids, k === "ArrowUp" ? -1 : 1); return true; }
  if (k === "ArrowUp" || k === "ArrowDown") {
    const d = k === "ArrowUp" ? -1 : 1;
    const nh = neighbor(E.head, d); if (!nh) return true;
    if (e.shiftKey) selectBlocks(rangeIds(E.anchor, nh.id), E.anchor, nh.id); else selectBlocks([nh.id]);
    blkEl(nh.id)?.scrollIntoView({ block: "nearest" });
    return true;
  }
  if (m && k.toLowerCase() === "a") { selectBlocks(E.note.blocks.map((b) => b.id)); return true; }
  if (m && k.toLowerCase() === "d") { duplicateBlocks(ids); return true; }
  if (m && !e.shiftKey && k.toLowerCase() === "z") { undo(); return true; }
  if (m && e.shiftKey && k.toLowerCase() === "z") { redo(); return true; }
  if (k === "Tab") { indentBlocks(ids, e.shiftKey ? -1 : 1); return true; }
  const t = typeShortcut(e); if (t) { applyType(t); return true; }
  return false;
}
function selectionMarkdown() { return blocksToMd(E.note.blocks.filter((b) => E.sel.has(b.id))); }
document.addEventListener("copy", (e) => { if (!E.sel.size || editorFocused()) return; e.preventDefault(); e.clipboardData.setData("text/plain", selectionMarkdown()); toast(`Copied ${E.sel.size} ${E.sel.size === 1 ? "block" : "blocks"}`); });
document.addEventListener("cut", (e) => { if (!E.sel.size || editorFocused() || readOnly()) return; e.preventDefault(); e.clipboardData.setData("text/plain", selectionMarkdown()); deleteBlocks(orderedSel()); });

/* ---------- markdown shortcuts ---------- */
const SHORTCUTS = [[/^[-*+•] /, "ul"], [/^\d+[.)] /, "ol"], [/^\[ ?\] /, "todo"], [/^\[[xX]\] /, "todo", true], [/^# /, "h1"], [/^## /, "h2"], [/^### /, "h3"], [/^> /, "quote"], [/^```$/, "code"], [/^(---|___|\*\*\*)$/, "hr"]];
function removeLeading(root, n) {
  const r = document.createRange(); r.setStart(root, 0);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let node, left = n;
  while ((node = w.nextNode())) { if (node.nodeValue.length >= left) { r.setEnd(node, left); break; } left -= node.nodeValue.length; }
  r.deleteContents();
}
function tryShortcut(id, t, e) {
  if (e.inputType !== "insertText") return false;
  const b = bGet(id); if (!b || b.t !== "p") return false;
  const off = caretOffset(t);
  const before = t.textContent.slice(0, off).replace(/ /g, " ");
  const typedFrom = off - (e.data || "").length; // where this keystroke (or burst) began
  for (const [re, type, checked] of SHORTCUTS) {
    const m = before.match(re);
    // fire only when the text just typed is what completed the marker
    if (!m || typedFrom >= m[0].length) continue;
    syncFromDom(id); checkpoint("struct");
    removeLeading(t, m[0].length);
    b.h = sanitizeInline(t.innerHTML);
    if (type === "hr") { b.t = "hr"; b.h = ""; b.i = 0; const nb = B("p", ""); E.note.blocks.splice(bIndex(id) + 1, 0, nb); rebuild(nb.id, 0); return true; }
    b.t = type;
    if (type === "todo") b.c = !!checked;
    if (!INDENTABLE.has(type)) b.i = 0;
    if (type === "code") b.h = plainToCodeHtml(htmlToText(b.h));
    rebuild(id, Math.max(0, off - m[0].length));
    return true;
  }
  return false;
}

/* ---------- slash + [[ menus ---------- */
const SLASH_EXTRA = [
  { k: "date", label: "Today's date", g: "@", kw: "date today day" },
  { k: "time", label: "Current time", g: "⏱", kw: "time now clock" },
  { k: "link", label: "Link to a note", g: "[[", kw: "link note page reference wiki mention" },
];
function detectTriggers(id) {
  const sel = getSelection();
  if (!sel.rangeCount || !sel.isCollapsed) return closeMenu();
  const r = sel.getRangeAt(0); const node = r.startContainer;
  if (node.nodeType !== 3) return closeMenu();
  const before = node.nodeValue.slice(0, r.startOffset);
  let m;
  if ((m = before.match(/\[\[([^\[\]\n]{0,60})$/))) return openMenu("wiki", id, m[1]);
  const b = bGet(id);
  if (b && b.t !== "code" && (m = before.match(/(?:^|[\s (])\/([\p{L}\p{N} ]{0,24})$/u))) {
    if (/ {2}$/.test(m[1])) return closeMenu();
    return openMenu("slash", id, m[1]);
  }
  closeMenu();
}
function menuItems(kind, q) {
  q = q.trim().toLowerCase();
  if (kind === "slash") {
    const all = [...Object.entries(TYPES).map(([k, v]) => ({ k, ...v })), ...SLASH_EXTRA];
    const hits = all.filter((x) => !q || x.label.toLowerCase().includes(q) || x.kw.includes(q) || x.k === q);
    hits.sort((a, b) => (b.label.toLowerCase().startsWith(q) ? 1 : 0) - (a.label.toLowerCase().startsWith(q) ? 1 : 0));
    return hits;
  }
  const notes = active().filter((n) => n.id !== S.selected && (!q || derive(n).lower.includes(q)));
  notes.sort((a, b) => {
    const at = a.title.toLowerCase().includes(q) ? 1 : 0, bt = b.title.toLowerCase().includes(q) ? 1 : 0;
    return bt - at || b.updated - a.updated;
  });
  const items = notes.slice(0, 7).map((n) => ({ k: "note", note: n, label: n.title.trim() || "Untitled", desc: derive(n).snippet.slice(0, 60) }));
  if (q && !findNoteByTitle(q)) items.push({ k: "create", title: q.replace(/\s+$/, ""), label: `Create “${q}”`, desc: "New note, linked here" });
  return items;
}
function openMenu(kind, id, q) {
  const items = menuItems(kind, q);
  if (!items.length && (kind === "slash" || !q)) return closeMenu();
  const prevActive = E.menu && E.menu.kind === kind ? E.menu.active : 0;
  E.menu = { kind, id, q, items, active: clamp(q === (E.menu && E.menu.q) ? prevActive : 0, 0, Math.max(0, items.length - 1)) };
  drawMenu();
}
function drawMenu() {
  const M = E.menu; if (!M) return;
  let pop = $("blockMenu");
  if (!pop) { pop = el("div", { id: "blockMenu", class: "pop", role: "listbox" }); pop.addEventListener("mousedown", (e) => e.preventDefault()); $("layer").append(pop); }
  const kids = [el("div", { class: "pop-label", text: M.kind === "slash" ? (M.q ? `Blocks matching “${M.q}”` : "Turn into or insert") : "Link to note" })];
  if (!M.items.length) kids.push(el("div", { class: "pop-empty", text: "Keep typing a note's title" }));
  M.items.forEach((it, i) => {
    const ico = el("span", { class: "ico" });
    if (it.icon) ico.innerHTML = it.icon; else ico.textContent = it.g || (it.k === "note" ? "↗" : "+");
    const b = el("button", { type: "button", class: "pop-item", role: "option", "aria-selected": i === M.active ? "true" : "false" }, ico,
      el("span", { class: "d" }, el("span", { text: it.label }), it.desc ? el("small", { text: it.desc }) : null));
    b.addEventListener("click", () => { M.active = i; applyMenu(); });
    b.addEventListener("mousemove", () => { if (M.active !== i) { M.active = i; drawMenu(); } });
    kids.push(b);
  });
  pop.replaceChildren(...kids);
  const r = caretRect() || txtEl(M.id).getBoundingClientRect();
  placePop(pop, r);
  pop.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
}
function closeMenu() { E.menu = null; $("blockMenu")?.remove(); }
function menuKey(e) {
  const M = E.menu; if (!M) return false;
  const n = M.items.length;
  if (e.key === "ArrowDown" && n) { e.preventDefault(); M.active = (M.active + 1) % n; drawMenu(); return true; }
  if (e.key === "ArrowUp" && n) { e.preventDefault(); M.active = (M.active - 1 + n) % n; drawMenu(); return true; }
  if ((e.key === "Enter" || e.key === "Tab") && n) { e.preventDefault(); applyMenu(); return true; }
  if (e.key === "Escape") { e.preventDefault(); closeMenu(); return true; }
  return false;
}
function deleteTrigger(token) {
  // remove the "/query" or "[[query" text just before the caret
  const sel = getSelection(); if (!sel.rangeCount) return;
  const r = sel.getRangeAt(0); const node = r.startContainer; if (node.nodeType !== 3) return;
  const end = r.startOffset; const start = node.nodeValue.lastIndexOf(token, end - 1);
  if (start < 0) return;
  const d = document.createRange(); d.setStart(node, start); d.setEnd(node, end); d.deleteContents();
  d.collapse(true); sel.removeAllRanges(); sel.addRange(d);
}
function applyMenu() {
  const M = E.menu; if (!M) return;
  const it = M.items[M.active]; if (!it) return;
  const id = M.id; const t = txtEl(id); const b = bGet(id);
  closeMenu();
  if (!t || !b) return;
  syncFromDom(id); checkpoint("struct");
  if (M.kind === "wiki") {
    deleteTrigger("[[");
    const target = it.k === "create" ? newNote("blank", { title: it.title, silent: true }) : it.note;
    const a = el("a", { class: "wl", "data-id": target.id, contenteditable: "false", text: target.title.trim() || "Untitled" });
    const sp = document.createTextNode(" ");
    const r = getSelection().getRangeAt(0);
    r.insertNode(sp); r.insertNode(a);
    const c = document.createRange(); c.setStart(sp, 1); c.collapse(true);
    const s = getSelection(); s.removeAllRanges(); s.addRange(c);
    syncFromDom(id); touch(); resolveChips(t);
    if (it.k === "create") toast(`Created “${target.title}”`);
    return;
  }
  deleteTrigger("/");
  syncFromDom(id);
  if (it.k === "date" || it.k === "time") {
    const s = it.k === "date" ? new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    document.execCommand("insertText", false, s); syncFromDom(id); touch(); return;
  }
  if (it.k === "link") { document.execCommand("insertText", false, "[["); syncFromDom(id); touch(); detectTriggers(id); return; }
  const type = it.k; const empty = isEmptyTxt(t);
  const idx = bIndex(id);
  if (type === "hr") {
    if (empty) { b.t = "hr"; b.h = ""; b.i = 0; delete b.c; const nb = B("p"); E.note.blocks.splice(idx + 1, 0, nb); return rebuild(nb.id, 0); }
    const nb = B("p"); E.note.blocks.splice(idx + 1, 0, B("hr"), nb); return rebuild(nb.id, 0);
  }
  if (empty) {
    b.t = type; if (type === "todo") b.c = false; else delete b.c;
    if (!INDENTABLE.has(type)) b.i = 0;
    return rebuild(id, 0);
  }
  const nb = B(type, "", { i: INDENTABLE.has(type) && INDENTABLE.has(b.t) ? b.i : 0 });
  E.note.blocks.splice(idx + 1, 0, nb);
  rebuild(nb.id, 0);
}

/* ---------- formatting bubble ---------- */
const fmtEl = el("div", { class: "fmt", role: "toolbar", "aria-label": "Text formatting", hidden: true });
const FMT = [
  ["bold", "<b>B</b>", "Bold", `${MOD} B`],
  ["italic", '<i style="font-family:var(--f-body);font-size:1rem">I</i>', "Italic", `${MOD} I`],
  ["underline", "<u>U</u>", "Underline", `${MOD} U`],
  ["strike", "<s>S</s>", "Strikethrough", `${MOD} ${SHIFT} X`],
  ["code", I.code, "Inline code", `${MOD} E`],
  ["mark", I.marker, "Highlight", `${MOD} ${SHIFT} H`],
  "sep",
  ["link", I.link, "Link", ""],
];
let savedRange = null;
function buildFmtButtons() {
  fmtEl.replaceChildren(...FMT.map((f) => {
    if (f === "sep") return el("span", { class: "sep" });
    const b = el("button", { type: "button", "data-f": f[0], "aria-label": f[2], title: f[3] ? `${f[2]}  ${f[3]}` : f[2], html: f[1] });
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", () => fmt(f[0]));
    return b;
  }));
}
buildFmtButtons();
document.body.append(fmtEl);
function hideFmt() { if (!fmtEl.hidden) { fmtEl.hidden = true; if (fmtEl.querySelector("input")) buildFmtButtons(); } }
function updateFmt() {
  if (fmtEl.querySelector("input") && fmtEl.contains(document.activeElement)) return;
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed) { hideFmt(); updateLinkPop(); return; }
  hideLinkPop();
  const r = sel.getRangeAt(0);
  const t1 = txtOf(r.startContainer), t2 = txtOf(r.endContainer);
  if (!t1 || t1 !== t2 || readOnly() || bGet(idOf(t1))?.t === "code") { hideFmt(); return; }
  fmtEl.hidden = false;
  const has = (tag) => { const n = r.commonAncestorContainer; return !!(n.nodeType === 1 ? n : n.parentElement).closest(tag); };
  const st = { bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"), underline: document.queryCommandState("underline"), strike: document.queryCommandState("strikeThrough"), code: has("code"), mark: has("mark"), link: has("a[href]") };
  fmtEl.querySelectorAll("button[data-f]").forEach((b) => b.setAttribute("aria-pressed", String(!!st[b.dataset.f])));
  const rect = r.getBoundingClientRect();
  const w = fmtEl.offsetWidth, h = fmtEl.offsetHeight;
  let x = clamp(rect.left + rect.width / 2 - w / 2, 8, innerWidth - w - 8);
  let y = rect.top - h - 8; if (y < 8) y = rect.bottom + 8;
  fmtEl.style.left = x + "px"; fmtEl.style.top = y + "px";
}
function unwrap(n) { const p = n.parentNode; while (n.firstChild) p.insertBefore(n.firstChild, n); p.removeChild(n); }
function toggleWrap(tag) {
  const sel = getSelection(); if (!sel.rangeCount) return;
  const r = sel.getRangeAt(0); if (r.collapsed) return;
  const anc = (n) => (n.nodeType === 1 ? n : n.parentElement).closest(tag);
  const a1 = anc(r.startContainer), a2 = anc(r.endContainer);
  if (a1 && a1 === a2 && txtOf(a1)) { unwrap(a1); return; }
  const frag = r.extractContents();
  frag.querySelectorAll(tag).forEach(unwrap);
  const w = document.createElement(tag); w.append(frag);
  r.insertNode(w);
  const nr = document.createRange(); nr.selectNodeContents(w);
  sel.removeAllRanges(); sel.addRange(nr);
}
function fmt(f) {
  const sel = getSelection(); if (!sel.rangeCount || readOnly()) return;
  const t = txtOf(sel.anchorNode); if (!t) return;
  const id = idOf(t);
  if (bGet(id)?.t === "code") return;
  if (f === "link") { startLinkInput(); return; }
  syncFromDom(id); checkpoint("fmt");
  if (f === "strike") document.execCommand("strikeThrough");
  else if (f === "code" || f === "mark") toggleWrap(f);
  else document.execCommand(f);
  syncFromDom(id); touch();
  requestAnimationFrame(updateFmt);
}
function startLinkInput() {
  const sel = getSelection(); if (!sel.rangeCount || sel.isCollapsed) return;
  savedRange = sel.getRangeAt(0).cloneRange();
  const t = txtOf(savedRange.startContainer); if (!t) return;
  const existing = (savedRange.commonAncestorContainer.nodeType === 1 ? savedRange.commonAncestorContainer : savedRange.commonAncestorContainer.parentElement).closest("a[href]");
  const input = el("input", { type: "url", placeholder: "Paste a link, then press Enter", "aria-label": "Link address", value: existing ? existing.getAttribute("href") : "" });
  const restore = () => { t.focus({ preventScroll: true }); const s = getSelection(); s.removeAllRanges(); s.addRange(savedRange); };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const href = safeHref(input.value);
      restore();
      const id = idOf(t); syncFromDom(id); checkpoint("fmt");
      if (href) document.execCommand("createLink", false, href);
      else if (!input.value.trim()) document.execCommand("unlink");
      else { toast("That doesn't look like a web address. Try one starting with https://"); }
      syncFromDom(id); touch(); buildFmtButtons(); hideFmt();
      const s = getSelection(); if (s.rangeCount) s.collapseToEnd();
    } else if (e.key === "Escape") { e.preventDefault(); buildFmtButtons(); restore(); }
  });
  fmtEl.replaceChildren(input);
  input.focus();
}
const linkPop = el("div", { class: "linkpop", hidden: true });
document.body.append(linkPop);
function hideLinkPop() { linkPop.hidden = true; }
function updateLinkPop() {
  const sel = getSelection();
  if (!sel.rangeCount || !sel.isCollapsed) return hideLinkPop();
  const n = sel.anchorNode; const a = n && (n.nodeType === 1 ? n : n.parentElement)?.closest("a[href]");
  if (!a || !E.root.contains(a)) return hideLinkPop();
  const href = a.getAttribute("href");
  const rm = el("button", { type: "button", text: "Remove link" });
  rm.addEventListener("mousedown", (e) => e.preventDefault());
  rm.addEventListener("click", () => { const id = idOf(a); syncFromDom(id); checkpoint("fmt"); unwrap(a); syncFromDom(id); touch(); hideLinkPop(); });
  linkPop.replaceChildren(el("a", { href, target: "_blank", rel: "noopener noreferrer", text: href }), rm);
  linkPop.hidden = false;
  const r = a.getBoundingClientRect();
  linkPop.style.left = clamp(r.left, 8, innerWidth - linkPop.offsetWidth - 8) + "px";
  linkPop.style.top = (r.bottom + 6) + "px";
}
let selFrame = 0;
document.addEventListener("selectionchange", () => { if (!selFrame) selFrame = requestAnimationFrame(() => { selFrame = 0; updateFmt(); }); });

/* ---------- dock ---------- */
const DOCK = [["p", "Text", `${MOD} ${ALT} 0`], ["todo", "Checklist", `${MOD} ${SHIFT} L`], ["ul", "Bulleted list", `${MOD} ${SHIFT} 8`], ["ol", "Numbered list", `${MOD} ${SHIFT} 7`], ["h", "Heading", `${MOD} ${ALT} 2`], ["quote", "Quote", ""], ["callout", "Callout", ""], ["code", "Code block", ""], ["hr", "Divider", ""], "sep", ["link", "Link a note", "[["]];
function buildDock() {
  $("dock").replaceChildren(...DOCK.map((d) => {
    if (d === "sep") return el("span", { class: "sep" });
    const [k, label, keys] = d;
    const glyph = k === "p" ? "Aa" : k === "h" ? "H" : k === "ol" ? "1." : null;
    const icon = k === "todo" ? I.todo : k === "ul" ? I.bullet : k === "quote" ? I.quote : k === "callout" ? I.callout : k === "code" ? I.code : k === "hr" ? I.divider : k === "link" ? I.link : null;
    const b = el("button", { type: "button", "data-k": k, class: k === "todo" ? "star" : null, "aria-label": label, title: keys ? `${label}  ·  ${keys}` : label, "aria-pressed": k === "link" || k === "hr" ? null : "false" },
      glyph ? el("span", { class: "g", text: glyph }) : el("span", { html: icon, style: "display:contents" }),
      k === "todo" ? el("span", { class: "lab", text: "Checklist" }) : null);
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", () => applyType(k));
    return b;
  }));
}
function updateDock() {
  if (!E.note) return;
  const ids = E.sel.size ? orderedSel() : E.focusId ? [E.focusId] : [];
  const types = new Set(ids.map((id) => bGet(id)?.t).filter(Boolean));
  const t = types.size === 1 ? [...types][0] : null;
  $("dock").querySelectorAll("button[aria-pressed]").forEach((b) => {
    const k = b.dataset.k;
    b.setAttribute("aria-pressed", String(!!t && (k === t || (k === "h" && /^h[123]$/.test(t)))));
  });
}
function applyType(k) {
  if (readOnly()) return;
  if (k === "link") {
    let id = E.focusId && bGet(E.focusId) ? E.focusId : null;
    const t = id && txtEl(id);
    if (!t || document.activeElement !== t) { appendParagraph(); id = E.focusId; }
    if (bGet(id)?.t === "code") return;
    checkpoint("type");
    document.execCommand("insertText", false, "[[");
    syncFromDom(id); touch(); detectTriggers(id);
    return;
  }
  let ids = E.sel.size ? orderedSel() : E.focusId && bGet(E.focusId) ? [E.focusId] : null;
  if (!ids) {
    const last = E.note.blocks[E.note.blocks.length - 1];
    if (last && last.t === "p" && !last.h) ids = [last.id];
    else { checkpoint("struct"); const nb = B("p"); E.note.blocks.push(nb); renderBlocks(); ids = [nb.id]; }
    E.focusId = ids[0];
    focusBlock(ids[0], "end");
  }
  let type = k === "h" ? "h2" : k;
  const cur = ids.map((id) => bGet(id).t);
  if (k === "h" && cur.every((x) => /^h[123]$/.test(x))) type = "p";
  else if (type !== "p" && type !== "hr" && cur.every((x) => x === type)) type = "p";
  setTypes(ids, type);
}
function typeShortcut(e) {
  const m = modKey(e);
  if (m && e.shiftKey && !e.altKey) return { KeyL: "todo", Digit9: "todo", Digit8: "ul", Digit7: "ol" }[e.code] || null;
  if (m && e.altKey && !e.shiftKey) return { Digit0: "p", Digit1: "h1", Digit2: "h2", Digit3: "h3" }[e.code] || null;
  return null;
}

/* ---------- block menu (grip) ---------- */
function openBlockMenu(id, anchor) {
  if (!E.sel.has(id)) selectBlocks([id]);
  const ids = orderedSel();
  const items = [
    { section: "Turn into" },
    ...Object.entries(TYPES).filter(([k]) => k !== "hr").map(([k, v]) => ({ label: v.label, icon: v.icon, g: v.g, checked: ids.every((x) => bGet(x).t === k), run: () => setTypes(ids, k) })),
    "sep",
    { label: "Duplicate", icon: I.dup, hint: `${MOD} D`, run: () => duplicateBlocks(ids) },
    { label: "Move up", icon: I.up, hint: `${MOD} ${SHIFT} ↑`, run: () => moveBlocks(ids, -1) },
    { label: "Move down", icon: I.down, hint: `${MOD} ${SHIFT} ↓`, run: () => moveBlocks(ids, 1) },
    { label: "Delete", icon: I.trash, hint: "Del", danger: true, run: () => deleteBlocks(ids) },
  ];
  menuPop(items, anchor.getBoundingClientRect());
}

/* ---------- editor events ---------- */
E.root.addEventListener("beforeinput", (e) => {
  const t = txtOf(e.target); if (!t) return;
  const id = idOf(t); const b = bGet(id); if (!b) return;
  switch (e.inputType) {
    case "historyUndo": e.preventDefault(); undo(); return;
    case "historyRedo": e.preventDefault(); redo(); return;
    case "insertParagraph":
      e.preventDefault();
      if (E.menu) { applyMenu(); return; }
      if (b.t === "code") { checkpoint("type"); queueMicrotask(() => document.execCommand("insertLineBreak")); }
      else splitAtCaret(id);
      return;
    case "deleteContentBackward":
      if (caretCollapsed() && caretOffset(t) === 0) { e.preventDefault(); backspaceAtStart(id); return; }
      break;
    case "insertFromDrop": e.preventDefault(); return;
  }
  if (/^format/.test(e.inputType)) checkpoint("fmt");
  else if (/^(insert|delete)/.test(e.inputType)) checkpoint("type");
});
E.root.addEventListener("input", (e) => {
  const t = txtOf(e.target); if (!t) return;
  const id = idOf(t);
  if (tryShortcut(id, t, e)) return;
  syncFromDom(id); touch();
  detectTriggers(id);
});
E.root.addEventListener("keydown", (e) => {
  const t = txtOf(e.target); if (!t || e.isComposing) return;
  const id = idOf(t); const b = bGet(id); if (!b) return;
  if (menuKey(e)) return;
  const k = e.key, m = modKey(e), lk = k.toLowerCase();
  if (m && !e.altKey && lk === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (m && !isMac && lk === "y") { e.preventDefault(); redo(); return; }
  const ty = typeShortcut(e); if (ty) { e.preventDefault(); applyType(ty); return; }
  if (m && e.shiftKey && !e.altKey) {
    if (e.code === "KeyX") { e.preventDefault(); fmt("strike"); return; }
    if (e.code === "KeyH") { e.preventDefault(); fmt("mark"); return; }
    if (k === "ArrowUp" || k === "ArrowDown") { e.preventDefault(); moveBlocks([id], k === "ArrowUp" ? -1 : 1); return; }
  }
  if (m && !e.shiftKey && !e.altKey) {
    if (lk === "b" || lk === "i" || lk === "u") { e.preventDefault(); fmt({ b: "bold", i: "italic", u: "underline" }[lk]); return; }
    if (lk === "e") { e.preventDefault(); fmt("code"); return; }
    if (lk === "d") { e.preventDefault(); syncFromDom(id); duplicateBlocks([id]); return; }
    if (k === "Enter") { e.preventDefault(); if (b.t === "todo") toggleTodo(id); else if (b.t === "code") { checkpoint("struct"); syncFromDom(id); const nb = B("p"); E.note.blocks.splice(bIndex(id) + 1, 0, nb); rebuild(nb.id, 0); } return; }
    if (lk === "a") {
      const s = getSelection();
      const whole = isEmptyTxt(t) || (s.rangeCount && s.toString().length >= t.textContent.length && t.textContent.length > 0);
      if (whole) { e.preventDefault(); syncFromDom(id); selectBlocks(E.note.blocks.map((x) => x.id)); }
      return;
    }
  }
  if (k === "Enter" && !m && !e.altKey) {
    e.preventDefault();
    if (e.shiftKey || b.t === "code") { checkpoint("type"); document.execCommand("insertLineBreak"); return; }
    splitAtCaret(id); return;
  }
  if (k === "Backspace" && !m && !e.altKey && caretCollapsed() && caretOffset(t) === 0) { e.preventDefault(); backspaceAtStart(id); return; }
  if (k === "Delete" && caretCollapsed() && caretOffset(t) >= nodeLen(t)) { e.preventDefault(); deleteAtEnd(id); return; }
  if (k === "Tab") {
    e.preventDefault();
    if (b.t === "code" && !e.shiftKey) { checkpoint("type"); document.execCommand("insertText", false, "  "); return; }
    syncFromDom(id); indentBlocks([id], e.shiftKey ? -1 : 1); return;
  }
  if (k === "Escape") { e.preventDefault(); syncFromDom(id); selectBlocks([id]); return; }
  if (m || e.altKey) return;
  if (k === "ArrowUp" && atFirstLine(t)) {
    const prev = neighbor(id, -1);
    if (e.shiftKey) { if (prev && caretOffset(t) === 0) { e.preventDefault(); syncFromDom(id); selectBlocks([prev.id, id], id, prev.id); } return; }
    e.preventDefault();
    const x = (caretRect() || t.getBoundingClientRect()).left;
    if (prev) focusAtX(prev.id, x, true); else { const ti = $("titleInput"); ti.focus(); ti.setSelectionRange(ti.value.length, ti.value.length); }
    return;
  }
  if (k === "ArrowDown" && atLastLine(t)) {
    const next = neighbor(id, 1);
    if (e.shiftKey) { if (next && caretOffset(t) >= nodeLen(t)) { e.preventDefault(); syncFromDom(id); selectBlocks([id, next.id], id, next.id); } return; }
    e.preventDefault();
    const x = (caretRect() || t.getBoundingClientRect()).left;
    if (next) focusAtX(next.id, x, false); else if (b.t !== "p" || b.h) appendParagraph(); else setCaret(t, nodeLen(t));
    return;
  }
  if (e.shiftKey) return;
  if (k === "ArrowLeft" && caretCollapsed() && caretOffset(t) === 0) { const prev = neighbor(id, -1); if (prev) { e.preventDefault(); focusBlock(prev.id, "end"); } return; }
  if (k === "ArrowRight" && caretCollapsed() && caretOffset(t) >= nodeLen(t)) { const next = neighbor(id, 1); if (next) { e.preventDefault(); focusBlock(next.id, "start"); } }
});
E.root.addEventListener("paste", (e) => {
  const t = txtOf(e.target); if (!t) return;
  e.preventDefault(); if (readOnly()) return;
  const text = (e.clipboardData.getData("text/plain") || "").replace(/\r\n?/g, "\n");
  if (!text) return;
  const id = idOf(t); const b = bGet(id);
  syncFromDom(id); checkpoint("struct");
  const sel = getSelection(); const r = sel.getRangeAt(0);
  if (b.t === "code") {
    r.deleteContents();
    const frag = document.createDocumentFragment(); let last = null;
    text.split("\n").forEach((line, i) => { if (i) frag.append(last = document.createElement("br")); if (line) frag.append(last = document.createTextNode(line)); });
    r.insertNode(frag);
    if (last) { const c = document.createRange(); c.setStartAfter(last); c.collapse(true); sel.removeAllRanges(); sel.addRange(c); }
    syncFromDom(id); touch(); return;
  }
  if (!text.includes("\n")) {
    const url = /^https?:\/\/\S+$/.test(text.trim()) ? text.trim() : "";
    if (url && !r.collapsed) document.execCommand("createLink", false, url);
    else document.execCommand("insertText", false, text);
    syncFromDom(id); touch(); return;
  }
  const parsed = mdToBlocks(text); if (!parsed.length) return;
  r.deleteContents();
  const after = document.createRange();
  after.setStart(r.startContainer, r.startOffset); after.setEnd(t, t.childNodes.length);
  const box = document.createElement("div"); box.append(after.extractContents());
  const afterHtml = sanitizeInline(box.innerHTML);
  b.h = sanitizeInline(t.innerHTML);
  let idx = bIndex(id), insertAt = idx + 1;
  if (!b.h && b.t === "p") { E.note.blocks.splice(idx, 1); insertAt = idx; }
  else if (parsed[0].t === "p") b.h = sanitizeInline(b.h + parsed.shift().h);
  E.note.blocks.splice(insertAt, 0, ...parsed);
  let last = parsed.length ? parsed[parsed.length - 1] : b, off;
  if (last.t === "hr") { const nb = B("p", afterHtml); E.note.blocks.splice(bIndex(last.id) + 1, 0, nb); last = nb; off = 0; }
  else { off = htmlLen(last.h); if (afterHtml) last.h = sanitizeInline(last.h + afterHtml); }
  rebuild(last.id, off);
});
E.root.addEventListener("focusin", (e) => {
  const t = txtOf(e.target); if (!t) return;
  const id = idOf(t);
  if (E.sel.size) clearBlockSel();
  if (E.focusId && E.focusId !== id) blkEl(E.focusId)?.classList.remove("focus");
  E.focusId = id; blkEl(id)?.classList.add("focus");
  updateDock(); sendPresence();
});
E.root.addEventListener("focusout", (e) => {
  const t = txtOf(e.target); if (!t) return;
  const id = idOf(t);
  setTimeout(() => {
    if (txtOf(document.activeElement) === t) return;
    const w = blkEl(id); w?.classList.remove("focus");
    if (!E.root.contains(document.activeElement)) { closeMenu(); sendPresence(); }
    // a collaborator's edit to this block arrived while you were in it: show it now
    const b = bGet(id);
    if (w && b && w.isConnected && w._j !== J(b)) { w.replaceWith(blockNode(b, olNumbers(E.note.blocks)[b.id])); resolveChips(E.root); renderPeers(); }
  }, 0);
});
E.root.addEventListener("mousedown", (e) => {
  if (e.target.closest(".chk")) { e.preventDefault(); return; }
  const wl = e.target.closest("a.wl");
  if (wl && E.root.contains(wl)) { e.preventDefault(); return; }
});
E.root.addEventListener("click", (e) => {
  const chk = e.target.closest(".chk");
  if (chk) { toggleTodo(idOf(chk)); return; }
  const wl = e.target.closest("a.wl");
  if (wl) { e.preventDefault(); const n = S.notes.get(wl.dataset.id); if (n && !n.trashed) selectNote(n.id); else toast("That linked note was deleted."); return; }
  const blk = e.target.closest(".blk");
  if (blk && blk.dataset.t === "hr" && !e.target.closest(".grip")) selectBlocks([blk.dataset.id]);
});
// grip: drag to reorder, click for menu
E.root.addEventListener("pointerdown", (e) => {
  const grip = e.target.closest(".grip");
  if (grip && e.button === 0) {
    e.preventDefault();
    const id = idOf(grip);
    syncFromDom(E.focusId || id);
    const ids = E.sel.has(id) ? orderedSel() : [id];
    E.drag = { id, ids, y0: e.clientY, started: false, grip, target: null };
    grip.setPointerCapture(e.pointerId);
    return;
  }
  const t = txtOf(e.target);
  if (t && e.button === 0 && !e.shiftKey) E.dragSel = { start: idOf(t), active: false };
  else if (t && e.shiftKey && E.focusId && idOf(t) !== E.focusId) { e.preventDefault(); syncFromDom(E.focusId); selectBlocks(rangeIds(E.focusId, idOf(t)), E.focusId, idOf(t)); }
});
document.addEventListener("pointermove", (e) => {
  const D = E.drag;
  if (D) {
    if (!D.started && Math.abs(e.clientY - D.y0) < 5) return;
    if (!D.started) { D.started = true; if (!E.sel.has(D.id)) selectBlocks(D.ids); D.ids.forEach((x) => blkEl(x)?.classList.add("dragging")); }
    const blocks = [...E.root.querySelectorAll(":scope > .blk")].filter((b) => !D.ids.includes(b.dataset.id));
    let before = null;
    for (const b of blocks) { const r = b.getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { before = b; break; } }
    D.target = before ? before.dataset.id : null;
    let line = $("dropLine"); if (!line) { line = el("div", { id: "dropLine", class: "drop-line" }); E.root.append(line); }
    const rootR = E.root.getBoundingClientRect();
    const lastB = blocks[blocks.length - 1];
    const y = before ? before.getBoundingClientRect().top - 2 : lastB ? lastB.getBoundingClientRect().bottom + 1 : 0;
    line.style.top = (y - rootR.top) + "px";
    const sc = $("sheetScroll").getBoundingClientRect();
    if (e.clientY < sc.top + 40) $("sheetScroll").scrollTop -= 12; else if (e.clientY > sc.bottom - 40) $("sheetScroll").scrollTop += 12;
    return;
  }
  const DS = E.dragSel;
  if (DS && e.buttons & 1) {
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const blk = hit && hit.closest && hit.closest(".blk");
    if (blk && E.root.contains(blk) && (blk.dataset.id !== DS.start || DS.active)) {
      if (!DS.active) { DS.active = true; syncFromDom(DS.start); E.root.classList.add("selecting"); }
      selectBlocks(rangeIds(DS.start, blk.dataset.id), DS.start, blk.dataset.id);
    }
  }
});
document.addEventListener("pointerup", () => {
  const D = E.drag;
  if (D) {
    E.drag = null;
    $("dropLine")?.remove();
    if (!D.started) { openBlockMenu(D.id, D.grip); return; }
    D.ids.forEach((x) => blkEl(x)?.classList.remove("dragging"));
    checkpoint("struct");
    const moving = E.note.blocks.filter((b) => D.ids.includes(b.id));
    const rest = E.note.blocks.filter((b) => !D.ids.includes(b.id));
    const at = D.target ? rest.findIndex((b) => b.id === D.target) : rest.length;
    rest.splice(at < 0 ? rest.length : at, 0, ...moving);
    E.note.blocks = rest;
    renderBlocks(); touch(); selectBlocks(D.ids);
    return;
  }
  if (E.dragSel) { E.dragSel = null; E.root.classList.remove("selecting"); }
});

// clicks on the empty page
$("sheetScroll").addEventListener("mousedown", (e) => {
  if (readOnly() || e.button !== 0) return;
  const tg = e.target;
  if (tg.closest(".blk") && !tg.classList.contains("blk")) return;
  if (tg.closest("button, input, textarea, a, .note-meta, .backlinks, .trash-banner")) return;
  if (tg.classList.contains("blk")) { if (tg.dataset.t === "hr") return; e.preventDefault(); const r = tg.getBoundingClientRect(); focusBlock(tg.dataset.id, e.clientX < r.left + r.width / 2 ? "start" : "end"); return; }
  const blocks = [...E.root.querySelectorAll(":scope > .blk")]; if (!blocks.length) return;
  const lastR = blocks[blocks.length - 1].getBoundingClientRect();
  if (e.clientY > lastR.bottom) { e.preventDefault(); appendParagraph(); return; }
  const row = blocks.find((b) => { const r = b.getBoundingClientRect(); return e.clientY >= r.top && e.clientY <= r.bottom; });
  if (row && row.dataset.t !== "hr") { e.preventDefault(); const r = row.getBoundingClientRect(); focusBlock(row.dataset.id, e.clientX < r.left ? "start" : "end"); }
});
$("sheetScroll").addEventListener("scroll", () => { if (E.menu) closeMenu(); hideFmt(); hideLinkPop(); }, { passive: true });
$("addBelow").addEventListener("click", appendParagraph);

// title
$("titleInput").addEventListener("input", (e) => {
  const n = E.note; if (!n) return;
  n.title = e.target.value.replace(/\n/g, " ");
  autosizeTitle(); touch();
  $("crumbNote").textContent = n.title.trim() || "Untitled";
});
$("titleInput").addEventListener("keydown", (e) => {
  if (!E.note || readOnly()) return;
  const ti = e.target;
  if ((e.key === "Enter" && !e.isComposing) || (e.key === "ArrowDown" && ti.selectionStart === ti.value.length)) {
    e.preventDefault();
    const first = E.note.blocks[0];
    if (first.t === "hr") { checkpoint("struct"); const nb = B("p"); E.note.blocks.unshift(nb); rebuild(nb.id, 0); }
    else focusBlock(first.id, "start");
  }
});

/* =====================================================================
   Live collaboration: who's here, where they are, what they're typing
   ===================================================================== */
const R = { room: null, user: null, peers: [], names: {}, liveTimer: 0, lastLive: 0 };
async function startRoom(user) {
  const room = await cap("room");
  if (!room) return;
  R.room = room; R.user = user;
  room.onPeers((ch) => {
    R.peers = ch.peers.filter((p) => !p.sameTab && p.kind === "viewer");
    for (const p of [...ch.joined, ...ch.updated]) if (!p.sameTab) applyLive(p);
    resolveNames(); renderPeers(); scheduleSide();
  }, () => { R.peers = []; renderPeers(); });
  sendPresence();
}
function sendPresence(live) {
  if (!R.room) return;
  const n = E.note;
  const shared = !!n && n.space === "shared" && !n.trashed;
  const inBlock = shared && E.focusId && txtOf(document.activeElement) ? E.focusId : null;
  const p = { note: shared ? n.id : null, block: inBlock, live: null };
  if (shared && live && JSON.stringify(live).length < 3200) p.live = live;   // never sends private notes
  R.room.presence(p).catch(() => {});
}
function queueLive() {
  if (!R.room || !E.focusId) return;
  const send = () => {
    R.lastLive = Date.now(); R.liveTimer = 0;
    const b = bGet(E.focusId);
    if (b && E.note && E.note.space === "shared") sendPresence({ id: b.id, t: b.t, h: b.h, i: b.i || 0, c: !!b.c, u: b.u || 0 });
  };
  if (R.liveTimer) return;
  const wait = Math.max(0, 90 - (Date.now() - R.lastLive));
  R.liveTimer = setTimeout(send, wait);
}
function applyLive(peer) {
  const pr = peer.presence || {}; const L = pr.live;
  if (!L || typeof L !== "object" || typeof L.id !== "string") return;
  const n = S.notes.get(pr.note);
  if (!n || n.space !== "shared" || !TYPES[L.t]) return;
  const b = n.blocks.find((x) => x.id === L.id);
  if (!b || num(L.u) <= (b.u || 0)) return;
  b.t = L.t; b.h = L.t === "hr" ? "" : sanitizeInline(String(L.h || "")); b.i = INDENTABLE.has(L.t) ? clamp(num(L.i), 0, 4) : 0; b.u = num(L.u);
  if (L.t === "todo") b.c = !!L.c; else delete b.c;
  n._v = (n._v || 0) + 1; remember(n);   // their page saves it; we only show it
  if (n === E.note) patchEditor();
}
const peersOn = (noteId) => {
  const seen = new Set();
  return R.peers.filter((p) => p.presence && p.presence.note === noteId && !seen.has(p.by || p.peer) && seen.add(p.by || p.peer));
};
async function resolveNames() {
  if (!R.user) return;
  const ids = [...new Set(R.peers.map((p) => p.by).filter(Boolean))];
  if (!ids.length) return;
  const ps = await R.user.profiles(ids);
  let changed = false;
  for (const id of ids) { const p = ps[id]; if (p && (!R.names[id] || R.names[id].name !== p.name || R.names[id].avatarUrl !== p.avatarUrl)) { R.names[id] = { name: p.name, avatarUrl: p.avatarUrl, color: p.color }; changed = true; } }
  if (changed) renderPeers();
}
const who = (p) => (p.by && R.names[p.by]) || { name: "", avatarUrl: "", color: "#7a86a8" };
function renderPeers() {
  const box = $("peers");
  E.root.querySelectorAll(".blk.peer-on").forEach((w) => { w.classList.remove("peer-on"); w.style.removeProperty("--peer"); delete w.dataset.who; });
  const here = E.note ? peersOn(E.note.id) : [];
  box.hidden = !here.length;
  box.replaceChildren(...here.slice(0, 5).map((p) => {
    const w = who(p); const name = w.name || "Someone";
    const av = w.avatarUrl ? el("img", { src: w.avatarUrl, alt: "" }) : el("span", { class: "av", text: name.slice(0, 1).toUpperCase() });
    return el("span", { class: "peer", style: `--peer:${w.color}`, title: `${name} is here${p.guest ? " (guest)" : ""}` }, av);
  }), here.length > 5 ? el("span", { class: "peer more", text: "+" + (here.length - 5) }) : "");
  for (const p of here) {
    const blk = p.presence.block && blkEl(p.presence.block);
    if (!blk) continue;
    const w = who(p);
    blk.classList.add("peer-on"); blk.style.setProperty("--peer", w.color); blk.dataset.who = w.name || "Someone";
  }
}
function patchEditor() {
  const n = S.notes.get(S.selected);
  if (!n || E.note !== n) { const st = $("sheetScroll").scrollTop; openEditor(); $("sheetScroll").scrollTop = st; return; }
  const ti = $("titleInput");
  if (document.activeElement !== ti && ti.value !== n.title) { ti.value = n.title; autosizeTitle(); }
  const ft = txtOf(document.activeElement); const fid = ft ? idOf(ft) : null;
  const nums = olNumbers(n.blocks);
  const domIds = [...E.root.querySelectorAll(":scope > .blk")].map((x) => x.dataset.id);
  if (domIds.join(",") === n.blocks.map((b) => b.id).join(",")) {
    for (const b of n.blocks) {
      const w = blkEl(b.id); if (!w) continue;
      if (b.id !== fid && w._j !== J(b)) w.replaceWith(blockNode(b, nums[b.id]));
      else if (b.t === "ol") { const m = w.querySelector(".marker.num"); if (m) m.textContent = nums[b.id] + "."; }
    }
  } else {
    const keep = fid ? blkEl(fid) : null; const off = ft ? caretOffset(ft) : null;
    E.root.replaceChildren(...n.blocks.map((b) => (b.id === fid && keep ? keep : blockNode(b, nums[b.id]))));
    if (keep && keep.isConnected) { ft.focus({ preventScroll: true }); setCaret(ft, off); }
  }
  resolveChips(E.root);
  for (const id of E.sel) blkEl(id)?.classList.add("sel");
  renderPeers(); refreshMeta();
}

/* =====================================================================
   Popovers, menus, palette, toasts
   ===================================================================== */
let openPopEl = null;
function placePop(pop, rect, align = "left") {
  pop.style.left = "0px"; pop.style.top = "0px";
  const w = pop.offsetWidth, h = pop.offsetHeight;
  let x = align === "right" ? rect.right - w : rect.left;
  x = clamp(x, 8, innerWidth - w - 8);
  let y = rect.bottom + 6;
  if (y + h > innerHeight - 8) y = Math.max(8, rect.top - h - 6);
  pop.style.left = x + "px"; pop.style.top = y + "px";
}
function closePop() { if (openPopEl) { openPopEl.remove(); openPopEl = null; } }
function menuPop(items, rect, align = "left") {
  closePop();
  const pop = el("div", { class: "pop", role: "menu" });
  for (const it of items) {
    if (it === "sep") { pop.append(el("div", { class: "pop-sep" })); continue; }
    if (it.section) { pop.append(el("div", { class: "pop-label", text: it.section })); continue; }
    if (it.info) { pop.append(el("p", { class: "pop-info", text: it.info })); continue; }
    const ico = it.sw != null ? el("span", { class: "sw" + (it.sw ? "" : " none"), style: it.sw ? `--sw: var(--c-${it.sw})` : null }) : el("span", { class: "ico" });
    if (it.sw == null) { if (it.icon) ico.innerHTML = it.icon; else ico.textContent = it.g || ""; }
    const b = el("button", { type: "button", class: "pop-item" + (it.danger ? " danger" : ""), role: "menuitem" }, ico,
      el("span", { class: "d" }, el("span", { text: it.label }), it.desc ? el("small", { text: it.desc }) : null),
      it.checked ? el("span", { class: "ck", html: I.check }) : it.hint ? el("kbd", { text: it.hint }) : null);
    b.addEventListener("click", () => { closePop(); it.run(); });
    pop.append(b);
  }
  pop.addEventListener("keydown", (e) => {
    const btns = [...pop.querySelectorAll(".pop-item")]; const i = btns.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); btns[(i + 1) % btns.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length].focus(); }
    else if (e.key === "Escape") { e.preventDefault(); closePop(); }
  });
  $("layer").append(pop);
  placePop(pop, rect, align);
  openPopEl = pop;
  return pop;
}
document.addEventListener("pointerdown", (e) => {
  if (openPopEl && !openPopEl.contains(e.target)) closePop();
  if (E.menu && !$("blockMenu")?.contains(e.target) && !txtOf(e.target)) closeMenu();
  if (E.sel.size && !e.target.closest(".blk.sel, .dock, .pop, .grip") && !E.drag) { clearBlockSel(); updateDock(); }
}, true);

let toastTimer = 0;
function toast(msg, undoFn) {
  $("toast")?.remove(); clearTimeout(toastTimer);
  const t = el("div", { id: "toast", class: "toast", role: "status", "aria-live": "polite" }, el("span", { text: msg }));
  if (undoFn) t.append(el("button", { type: "button", text: "Undo", onclick: () => { t.remove(); undoFn(); } }));
  document.body.append(t);
  toastTimer = setTimeout(() => t.remove(), undoFn ? 6500 : 3500);
}
function setSync(kind, text) { $("sync").dataset.state = kind; $("syncText").textContent = text; $("sync").title = text; }
function setSave(s) { $("statSave").textContent = s === "saving" ? "Saving…" : s === "saved" ? "Saved" : s === "error" ? "Not saved" : ""; }

/* ---------- modal: palette + shortcuts ---------- */
let modal = null;
function closeModal() { if (modal) { modal.remove(); modal = null; } }
function openModal(content, onKey) {
  closeModal(); closePop();
  const scrim = el("div", { class: "scrim", role: "dialog", "aria-modal": "true" }, content);
  scrim.addEventListener("mousedown", (e) => { if (e.target === scrim) closeModal(); });
  scrim.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeModal(); } else if (onKey) onKey(e); });
  document.body.append(scrim); modal = scrim;
  return scrim;
}
function commands() {
  const n = E.note;
  return [
    { label: "New note", icon: I.plus, hint: "Alt N", run: () => newNote() },
    ...TEMPLATES.filter((t) => t.id !== "blank").map((t) => ({ label: `New ${t.name.toLowerCase()}`, icon: t.icon, run: () => newNote(t.id) })),
    { label: "Open today's page", icon: I.today, hint: "Alt T", run: openToday },
    { label: "Show tasks", icon: I.tasks, run: () => setView("tasks") },
    { label: "Show all notes", icon: I.notes, run: () => setView("all") },
    { label: "Show pinned notes", icon: I.pin, run: () => setView("pinned") },
    { label: "Open trash", icon: I.trash, run: () => setView("trash") },
    n && { label: n.pinned ? "Unpin this note" : "Pin this note", icon: I.pin, run: togglePin },
    n && { label: "Duplicate this note", icon: I.dup, run: () => duplicateNote(n.id) },
    n && { label: "Copy this note as Markdown", icon: I.copy, run: copyNote },
    n && { label: "Download this note (.md)", icon: I.download, run: () => downloadNote(n) },
    n && !n.trashed && { label: "Move this note to trash", icon: I.trash, run: () => moveToTrash(n.id) },
    { label: S.focus ? "Leave focus mode" : "Focus mode", icon: I.focus, hint: `${MOD} ${SHIFT} F`, run: toggleFocus },
    { label: "Theme: follow system", icon: I.system, run: () => setTheme("system") },
    { label: "Theme: light", icon: I.sun, run: () => setTheme("light") },
    { label: "Theme: dark", icon: I.moon, run: () => setTheme("dark") },
    { label: "Export a backup of all notes (.json)", icon: I.download, run: exportJson },
    { label: "Export all notes as Markdown (.md)", icon: I.download, run: exportMd },
    { label: "Import notes (.json, .md, .txt)", icon: I.upload, run: () => $("importInput").click() },
    { label: "Keyboard shortcuts", icon: I.keyboard, hint: "?", run: openShortcuts },
  ].filter(Boolean);
}
function openPalette() {
  const input = el("input", { type: "text", placeholder: "Search notes or type a command", autocomplete: "off", "aria-label": "Search notes and commands" });
  const list = el("div", { class: "palette-list", role: "listbox" });
  let items = [], active = 0;
  const draw = () => {
    const q = input.value.trim().toLowerCase(); const qt = q.split(/\s+/).filter(Boolean);
    const notes = [...S.notes.values()].filter((n) => qt.every((t) => derive(n).lower.includes(t)));
    notes.sort((a, b) => (!!a.trashed - !!b.trashed) || ((qt.length && b.title.toLowerCase().includes(qt[0])) - (qt.length && a.title.toLowerCase().includes(qt[0]))) || b.updated - a.updated);
    const cmds = commands().filter((c) => !q || c.label.toLowerCase().includes(q));
    items = [];
    const kids = [];
    const ns = notes.slice(0, q ? 8 : 5);
    if (ns.length) {
      kids.push(el("div", { class: "pop-label", text: q ? "Notes" : "Recent" }));
      for (const n of ns) items.push({ label: (n.title.trim() || "Untitled") + (n.trashed ? " (in trash)" : ""), desc: derive(n).snippet.slice(0, 80) || "No text yet", icon: I.notes, run: () => { S.view = n.trashed ? "trash" : "all"; S.tag = null; selectNote(n.id); } }), kids.push(null);
    }
    const noteCount = items.length;
    if (cmds.length) { kids.push(el("div", { class: "pop-label", text: "Actions" })); for (const c of cmds.slice(0, q ? 10 : 30)) items.push(c), kids.push(null); }
    if (q && !findNoteByTitle(q)) { items.push({ label: `Create a note called “${input.value.trim()}”`, icon: I.plus, run: () => newNote("blank", { title: input.value.trim() }) }); kids.push(null); }
    active = clamp(active, 0, Math.max(0, items.length - 1));
    let i = 0;
    const nodes = kids.map((k) => {
      if (k) return k;
      const it = items[i]; const idx = i++;
      const b = el("button", { type: "button", class: "pop-item", role: "option", "aria-selected": idx === active ? "true" : "false" },
        el("span", { class: "ico", html: it.icon || "" }), el("span", { class: "d" }, el("span", { text: it.label }), it.desc ? el("small", { text: it.desc }) : null),
        it.hint ? el("kbd", { text: it.hint }) : null);
      b.addEventListener("click", () => { closeModal(); it.run(); });
      b.addEventListener("mousemove", () => { if (active !== idx) { active = idx; draw(); } });
      return b;
    });
    if (!items.length) nodes.push(el("div", { class: "pop-empty", text: "Nothing found" }));
    list.replaceChildren(...nodes);
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    void noteCount;
  };
  input.addEventListener("input", () => { active = 0; draw(); });
  openModal(el("div", { class: "modal" }, el("div", { class: "palette-input" }, el("span", { html: I.search, style: "display:contents" }), input, el("kbd", { text: "Esc" })), list), (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % Math.max(1, items.length); draw(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + items.length) % Math.max(1, items.length); draw(); }
    else if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); const it = items[active]; if (it) { closeModal(); it.run(); } }
  });
  draw(); input.focus();
}
function openShortcuts() {
  const K = (...ks) => el("span", {}, ...ks.map((k) => el("kbd", { text: k })));
  const row = (label, ...ks) => el("div", {}, el("span", { text: label }), K(...ks));
  const box = el("div", { class: "modal" },
    el("div", { class: "modal-head" }, el("h3", { text: "Keyboard shortcuts" }), el("button", { class: "icon-btn", type: "button", "aria-label": "Close", html: I.x, onclick: closeModal })),
    el("div", { class: "shortcuts" },
      el("h5", { text: "Everywhere" }),
      row("Search and commands", MOD, "K"), row("New note", "Alt", "N"), row("Today's page", "Alt", "T"), row("Focus mode", MOD, SHIFT, "F"), row("Save now", MOD, "S"), row("This list", "?"),
      el("h5", { text: "Checklists and blocks" }),
      row("Checklist", MOD, SHIFT, "L"), row("Tick or untick", MOD, "Enter"), row("Bulleted list", MOD, SHIFT, "8"), row("Numbered list", MOD, SHIFT, "7"), row("Heading 1 / 2 / 3", MOD, ALT, "1–3"), row("Plain text", MOD, ALT, "0"),
      row("Block menu", "/"), row("Indent / outdent", "Tab", SHIFT + " Tab"), row("Move block", MOD, SHIFT, "↑ ↓"), row("Duplicate block", MOD, "D"), row("Select block", "Esc"), row("Select all blocks", MOD, "A", "A"),
      el("h5", { text: "Text" }),
      row("Bold", MOD, "B"), row("Italic", MOD, "I"), row("Underline", MOD, "U"), row("Strikethrough", MOD, SHIFT, "X"), row("Inline code", MOD, "E"), row("Highlight", MOD, SHIFT, "H"), row("Link a note", "[["), row("Line break", SHIFT, "Enter"), row("Undo", MOD, "Z"), row("Redo", MOD, SHIFT, "Z"),
      el("h5", { text: "Type at the start of a line" }),
      row("Checklist", "[]", "space"), row("Bulleted list", "-", "space"), row("Numbered list", "1.", "space"), row("Heading", "#", "space"), row("Quote", ">", "space"), row("Code block", "```"), row("Divider", "---"),
    ));
  openModal(box);
  box.querySelector("button").focus();
}

/* ---------- note actions ---------- */
function togglePin() { const n = E.note; if (!n) return; n.pinned = !n.pinned; bump(n); refreshMeta(); renderSide(); toast(n.pinned ? "Pinned to the top" : "Unpinned"); }
function noteMarkdown(n) { const tags = n.tags.length ? "\n\n" + n.tags.map((t) => "#" + t).join(" ") : ""; return (n.title.trim() ? `# ${n.title.trim()}\n\n` : "") + blocksToMd(n.blocks) + tags + "\n"; }
async function copyNote() {
  const n = E.note; if (!n) return;
  try { await navigator.clipboard.writeText(noteMarkdown(n)); toast("Copied as Markdown"); }
  catch { toast(`Your browser blocked copying. Select blocks with ${MOD} A twice, then ${MOD} C.`); }
}
const fileName = (s, ext) => ((s || "").trim().replace(/[\\/:*?"<>|#\u0000-\u001f]+/g, "").replace(/\s+/g, " ").slice(0, 80) || "Untitled") + ext;
async function saveFile(name, text) {
  const dl = await cap("downloads");
  if (dl) {
    try { await dl.save({ filename: name, data: text }); return; }
    catch (e) {
      const code = e && e.code;
      if (code === "declined" || code === "rate_limited") return;
      if (!["unavailable", "not_granted", "capability_disabled", "capability_removed"].includes(code)) { toast("Couldn't save that file. Try again in a moment."); return; }
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = el("a", { href: url, download: name, style: "display:none" });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function downloadNote(n) { saveFile(fileName(n.title, ".md"), noteMarkdown(n)); }
function exportJson() {
  const data = { app: "folio", version: 2, exported: new Date().toISOString(), notes: [...S.notes.values()].map((n) => ({ id: n.id, ...serialize(n) })) };
  saveFile(`folio-backup-${todayKey()}.json`, JSON.stringify(data, null, 2));
}
function exportMd() {
  const parts = active().sort((a, b) => b.updated - a.updated).map(noteMarkdown);
  saveFile(`folio-notes-${todayKey()}.md`, parts.join("\n---\n\n"));
}
$("importInput").addEventListener("change", async (e) => {
  const files = [...e.target.files]; e.target.value = "";
  let count = 0;
  for (const f of files) {
    let text; try { text = await f.text(); } catch { continue; }
    if (/\.json$/i.test(f.name) || f.type === "application/json") {
      let data; try { data = JSON.parse(text); } catch { toast(`${f.name} isn't valid JSON.`); continue; }
      const list = Array.isArray(data) ? data : Array.isArray(data.notes) ? data.notes : [];
      for (const d of list) {
        if (!d || typeof d !== "object") continue;
        const id = typeof d.id === "string" && /^[\w-]{1,64}$/.test(d.id) && !S.notes.has(d.id) ? d.id : uid();
        const n = normalize(id, d); S.notes.set(id, n); markDirty(id); count++;
      }
    } else {
      const m = text.match(/^\s*#\s+(.+)\n/);
      const title = m ? m[1].trim() : f.name.replace(/\.(md|markdown|txt)$/i, "");
      const body = m ? text.slice(m[0].length) : text;
      const n = normalize(uid(), { title, body, created: f.lastModified || Date.now(), updated: Date.now() });
      S.notes.set(n.id, n); markDirty(n.id); count++;
    }
  }
  if (count) { setView("all"); renderAll(); toast(`Imported ${count} ${count === 1 ? "note" : "notes"}`); }
});

/* =====================================================================
   Chrome: theme, focus, cover, buttons
   ===================================================================== */
function applyTheme() {
  const root = document.documentElement;
  if (S.theme === "system") { if (root.dataset.folioTheme) { root.removeAttribute("data-theme"); delete root.dataset.folioTheme; } }
  else { root.setAttribute("data-theme", S.theme); root.dataset.folioTheme = "1"; }
  $("themeBtn").innerHTML = S.theme === "light" ? I.sun : S.theme === "dark" ? I.moon : I.system;
  $("themeBtn").title = `Theme: ${S.theme === "system" ? "follows your system" : S.theme}. Click to change.`;
}
function setTheme(t) { S.theme = t; prefs.set("theme", t); applyTheme(); }
function toggleFocus() { S.focus = !S.focus; applyLayout(); if (S.focus) toast("Focus mode. Press Esc to leave."); }
function openCover() { $("app").classList.add("cover-open"); }
function closeCover() { $("app").classList.remove("cover-open"); }

$("newBtn").addEventListener("click", () => newNote());
$("tplBtn").addEventListener("click", (e) => menuPop([{ section: "New from template" }, ...TEMPLATES.map((t) => ({ label: t.name, desc: t.desc, icon: t.icon, run: () => newNote(t.id) }))], e.currentTarget.getBoundingClientRect()));
$("menuBtn").addEventListener("click", openCover);
$("app").addEventListener("click", (e) => { if (e.target === $("app")) closeCover(); });
$("backBtn").addEventListener("click", () => selectNote(null));
$("themeBtn").addEventListener("click", () => setTheme(S.theme === "system" ? "light" : S.theme === "light" ? "dark" : "system"));
$("moreBtn").addEventListener("click", (e) => menuPop([
  { section: S.mode === "cloud" ? "Synced to your claude.ai account" : "Notes live in this browser" },
  { label: "Export a backup (.json)", icon: I.download, run: exportJson },
  { label: "Export as Markdown (.md)", icon: I.download, run: exportMd },
  { label: "Import notes", desc: ".json backup, .md or .txt files", icon: I.upload, run: () => $("importInput").click() },
  "sep",
  { label: "Keyboard shortcuts", icon: I.keyboard, hint: "?", run: openShortcuts },
], e.currentTarget.getBoundingClientRect()));
$("sortBtn").addEventListener("click", () => { S.sort = S.sort === "updated" ? "created" : S.sort === "created" ? "title" : "updated"; prefs.set("sort", S.sort); renderList(); });
$("search").addEventListener("input", (e) => { S.query = e.target.value; renderList(); });
$("search").addEventListener("keydown", (e) => {
  if (e.key === "Escape") { clearSearch(); e.target.blur(); }
  if (e.key === "Enter") { const first = visibleNotes()[0]; if (first) selectNote(first.id, { focus: false }); }
});
$("pinBtn").addEventListener("click", togglePin);
$("shareBtn").addEventListener("click", (e) => {
  const n = E.note; if (!n || !SP.shared) return;
  menuPop([
    { section: "Who can see this note" },
    { label: "Only me", desc: "Private to your account", icon: I.lock, checked: n.space === "private", run: () => moveSpace(n, "private") },
    { label: "Everyone with access", desc: "Edit together, live", icon: I.people, checked: n.space === "shared", run: () => moveSpace(n, "shared") },
    { info: "To invite people, use Share at the top of this page on claude.ai and give them edit access. Shared notes appear under Shared in their sidebar." },
  ], e.currentTarget.getBoundingClientRect(), "right");
});
$("focusBtn").addEventListener("click", toggleFocus);
$("colorBtn").addEventListener("click", (e) => {
  const n = E.note; if (!n) return;
  menuPop([{ section: "Label color" }, ...COLORS.map((c) => ({ label: COLOR_NAMES[c], sw: c, checked: n.color === c, run: () => { n.color = c; bump(n); refreshMeta(); renderSide(); } }))], e.currentTarget.getBoundingClientRect(), "right");
});
$("noteMenuBtn").addEventListener("click", (e) => {
  const n = E.note; if (!n) return;
  const d = derive(n);
  menuPop([
    { section: `${d.words.toLocaleString()} words · created ${new Date(n.created).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` },
    { label: "Copy as Markdown", icon: I.copy, run: copyNote },
    { label: "Download as .md", icon: I.download, run: () => downloadNote(n) },
    { label: "Duplicate note", icon: I.dup, run: () => duplicateNote(n.id) },
    "sep",
    n.trashed ? { label: "Restore note", icon: I.restore, run: () => restoreNote(n.id) } : { label: "Move to trash", icon: I.trash, danger: true, run: () => moveToTrash(n.id) },
  ], e.currentTarget.getBoundingClientRect(), "right");
});
$("restoreBtn").addEventListener("click", () => E.note && restoreNote(E.note.id));
(() => { const old = $("purgeBtn"); const nb = confirmButton("Delete forever", "Click again to delete", () => E.note && purgeNote(E.note.id)); nb.id = "purgeBtn"; old.replaceWith(nb); })();

/* ---------- global keys ---------- */
document.addEventListener("keydown", (e) => {
  if (modal || e.defaultPrevented) return;
  const tg = e.target;
  const typing = !!(tg.closest && (tg.closest(".txt") || tg.closest("input, textarea, [contenteditable='true']")));
  const m = modKey(e);
  if (m && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); return; }
  if (e.altKey && !m && e.code === "KeyN") { e.preventDefault(); newNote(); return; }
  if (e.altKey && !m && e.code === "KeyT") { e.preventDefault(); openToday(); return; }
  if (m && e.shiftKey && e.code === "KeyF") { e.preventDefault(); toggleFocus(); return; }
  if (m && !e.shiftKey && e.key.toLowerCase() === "s") { e.preventDefault(); flushAll(); toast(S.mode === "cloud" ? "Saved and synced" : "Saved in this browser"); return; }
  if (E.sel.size && !typing && E.note && !readOnly() && selKeys(e)) { e.preventDefault(); return; }
  if (!typing && e.key === "?") { e.preventDefault(); openShortcuts(); return; }
  if (!typing && m && e.key.toLowerCase() === "z" && E.note) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (e.key === "Escape") {
    if (openPopEl) { closePop(); return; }
    if ($("app").classList.contains("cover-open")) { closeCover(); return; }
    if (S.focus && !typing) { toggleFocus(); return; }
  }
});
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushAll(); });
window.addEventListener("pagehide", flushAll);
window.addEventListener("resize", () => { hideFmt(); closeMenu(); autosizeTitle(); });
if (window.visualViewport) {
  const vv = window.visualViewport;
  const fit = () => document.documentElement.style.setProperty("--vvh", `calc(${vv.height}px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))`);
  vv.addEventListener("resize", fit); fit();
}
setInterval(() => { if (document.visibilityState === "visible" && loaded) { renderList(); } }, 60000);

/* =====================================================================
   Boot
   ===================================================================== */
async function boot() {
  try { document.execCommand("styleWithCSS", false, false); } catch {}
  buildDock(); applyTheme(); renderAll();
  if (document.fonts) document.fonts.ready.then(autosizeTitle);
  if (!window.claude || typeof window.claude.use !== "function") return startLocal();
  try {
    const [db, user] = await Promise.all([cap("db"), cap("user")]);
    const owner = user ? await user.isOwner() : false;
    if (db && user) return startCloud(db, user, owner);
  } catch {}
  startLocal();
}
boot();
})();
