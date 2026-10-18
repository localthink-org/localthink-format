/**
 * Export an LTF document to html / md / json / org.
 *
 * Frontmatter is parsed with the existing `parseLtf` machinery (which
 * validates the required fields and rejects unknown properties through
 * the shared KNOWN_FIELDS list, so exports never invent metadata).
 * The markdown body is parsed for the conversational patterns that the
 * platform produces (`**Human:**` / `**AI:**` / `**Assistant:**` /
 * `**User:**`, each optionally followed by an `` `timestamp` ``).
 */

import { LtfSyntaxError, parseLtf } from "./parse.js";

/** Role label prefixes recognised inside the body. */
const ROLE_RE =
  /^\*\*(Human|User|AI|Assistant|Contributor):\*\*\s*(?:`([^`]*)`\s*)?([\s\S]*?)(?=\n\*\*(?:Human|User|AI|Assistant|Contributor):\*\*\n|$)/g;

const ROLE_CANON = {
  human: "human",
  user: "human",
  ai: "ai",
  assistant: "ai",
  contributor: "contributor",
};

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Split the markdown `body` into `{ role, time, text }` messages.
 * Text outside any role block (e.g. `## Session` headings) is kept as
 * `{ role: null }` markers so nothing is silently dropped.
 */
const ROLE_LINE_RE =
  /^\*\*(Human|User|AI|Assistant|Contributor):\*\*\s*(?:\`([^\`]*)\`)?\s*(.*)$/

export function splitMessages(body) {
  const messages = [];
  let current = null;
  let buf = [];
  const flush = () => {
    if (current) {
      current.text = buf.join("\n").trim();
      if (current.text) messages.push(current);
    } else {
      const between = buf.join("\n").trim();
      if (between) messages.push({ role: null, text: between });
    }
    buf = [];
  };
  for (const line of body.split("\n")) {
    const m = ROLE_LINE_RE.exec(line);
    if (m) {
      flush();
      current = {
        role: ROLE_CANON[m[1].toLowerCase()] ?? "contributor",
        time: m[2] ?? null,
        text: "",
      };
      if (m[3]?.trim()) buf.push(m[3]);
    } else if (current || line.trim()) {
      buf.push(line);
    }
  }
  flush();
  return messages;
}

const inlineMd = (text) => text.replace(/[*_~]/g, "");

const ESCAPED_INLINE = /`([^`]+)`/g;

// ---------- target writers ----------

const JSON_ESC = /[\u0000-\u001F"\\\u007F-\u009F]/g;

function jsonEscape(text) {
  return text.replace(JSON_ESC, (c) => {
    switch (c) {
      case '"': return '\\"';
      case "\\": return "\\\\";
      case "\n": return "\n";
      default: {
        const code = c.charCodeAt(0).toString(16).padStart(4, "0");
        return `\\u${code}`;
      }
    }
  });
}

function writeJson(fm, messages) {
  const lines = [
    "{",
    `  "frontmatter": ${JSON.stringify(fm, null, 2)
      .split("\n")
      .join("\n  ")},`,
    `  "messages": [`,
  ];
  messages.forEach((m, i) => {
    const obj = {
      role: m.role,
      time: m.time ?? undefined,
      text: m.text,
    };
    lines.push(
      `    ${JSON.stringify(
        Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)),
      )}${i < messages.length - 1 ? "," : ""}`,
    );
  });
  lines.push("  ]", "}");
  return `${lines.join("\n")}\n`;
}

function writeMarkdown(fm, messages) {
  const lines = [];
  if (fm.title) lines.push(`# ${fm.title}`);
  if (fm.created) lines.push(`> created: ${fm.created}`);
  if (fm.platform) lines.push(`> platform: ${fm.platform}`);
  if (fm.tags) lines.push(`> tags: ${fm.tags.join(", ")}`);
  if (lines.length) lines.push("");
  for (const m of messages) {
    if (m.role === null) {
      lines.push(m.text, "");
    } else {
      const who = m.role === "human" ? "🧑 Human" : m.role === "ai" ? "🤖 AI" : `👤 ${m.role}`;
      lines.push(`**${who}**${m.time ? ` \`${m.time}\`` : ""}: ${m.text}`, "");
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function writeHtml(fm, messages) {
  const body = messages
    .map((m) => {
      if (m.role === null) {
        return `  <div class="section">${inlineMd(m.text)
          .replace(ESCAPED_INLINE, "<code>$1</code>")
          .replace(/\n/g, "<br/>")}</div>`;
      }
      const who = escapeHtml(
        m.role === "human" ? "Human" : m.role === "ai" ? "AI" : m.role,
      );
      const text = escapeHtml(m.text).replace(/\n/g, "<br/>");
      return `  <div class="message ${m.role}">
    <div class="meta"><span class="who">${who}</span>${
      m.time ? `<span class="time">${escapeHtml(m.time)}</span>` : ""
    }</div>
    <div class="text">${text}</div>
  </div>`;
    })
    .join("\n");
  const tags = fm.tags
    ?.map((t) => `<span class="tag">${escapeHtml(String(t))}</span>`)
    .join(" ");
  return `<!doctype html>
<html lang="${escapeHtml(fm.language ?? "en")}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(fm.title ?? "LocalThink")}</title>
<style>
  body { font: 15px/1.6 -apple-system, "Segoe UI", sans-serif; max-width: 760px; margin: 2em auto; padding: 0 1em; color: #1c1c1c; }
  header { border-bottom: 1px solid #ddd; padding-bottom: 1em; margin-bottom: 2em; }
  .meta-card { display: flex; gap: .75em; flex-wrap: wrap; margin-top: .5em; }
  .tag { background: #eef; border-radius: 3px; padding: 1px 8px; font-size: .8em; color: #335; }
  .message { margin: 1em 0; padding: .75em 1em; border-radius: 8px; }
  .message.human { background: #f4f8f7; }
  .message.ai { background: #f7f4f8; }
  .message.contributor { background: #f7f7f4; }
  .meta { font-size: .8em; color: #6a7; margin-bottom: .25em; }
  .who { font-weight: 600; margin-right: .6em; }
  .section { color: #888; font-size: .85em; margin: 1.5em 0 1em; border-top: 1px dashed #ccc; padding-top: .6em; }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(fm.title ?? "Untitled")}</h1>
  <div class="meta-card">
    ${escapeHtml(fm.created ?? "")}${fm.platform ? ` · ${escapeHtml(fm.platform)}` : ""}
    ${tags ? `<span>${tags}</span>` : ""}
  </div>
</header>
${body}
</body>
</html>
`;
}

function writeOrg(fm, messages) {
  const lines = [];
  lines.push(`#+title: ${fm.title ?? "Untitled"}`);
  if (fm.created) lines.push(`#+created: ${fm.created}`);
  if (fm.platform) lines.push(`#+platform: ${fm.platform}`);
  if (fm.tags) lines.push(`#+tags: ${fm.tags.join(" ")}`);
  for (const m of messages) {
    if (m.role === null) {
      lines.push("", m.text, "");
    } else {
      const who = m.role === "human" ? "You" : m.role === "ai" ? "Assistant" : m.role;
      lines.push(
        "",
        `** ${who}${m.time ? ` [${m.time}]` : ""}`,
        "",
        m.text,
      );
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

const WRITERS = {
  json: writeJson,
  md: writeMarkdown,
  html: writeHtml,
  org: writeOrg,
};

/**
 * @param {string} ltfText
 * @param {"html"|"md"|"json"|"org"} target
 * @returns { { ok: true, output: string } | { ok: false, code: string, message: string } }
 */
export function exportLtf(ltfText, target) {
  const writtenBy = WRITERS[target];
  if (!writtenBy) {
    return { ok: false, code: "target.unknown", message: `unknown export target: ${target}` };
  }
  let parsed;
  try {
    parsed = parseLtf(ltfText);
  } catch (error) {
    if (error instanceof LtfSyntaxError) {
      return { ok: false, code: 'parse.failed', message: error.message, errors: error.errors };
    }
    throw error;
  }
  return { ok: true, output: writtenBy(parsed.frontmatter, splitMessages(parsed.body)) };
}
