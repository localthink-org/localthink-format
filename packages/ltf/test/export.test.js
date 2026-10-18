import { test } from "node:test";
import assert from "node:assert/strict";
import { exportLtf, splitMessages } from "../src/export.js";
import { readFileSync } from "node:fs";

const full = readFileSync(new URL("./fixtures/full.ltf.md", import.meta.url), "utf8");
const minimal = readFileSync(new URL("./fixtures/minimal.ltf.md", import.meta.url), "utf8");

test("export json: frontmatter round-trips and messages split", () => {
  const r = exportLtf(full, "json");
  assert.ok(r.ok);
  const doc = JSON.parse(r.output);
  assert.equal(doc.frontmatter.localthink, "1.0");
  assert.equal(doc.frontmatter.platform, "chatgpt");
  assert.ok(Array.isArray(doc.messages));
  const roles = doc.messages.filter((m) => m.role !== null).map((m) => m.role);
  assert.deepEqual(roles, ["human", "ai"]);
  const humanMsg = doc.messages.find((m) => m.role === "human");
  assert.equal(humanMsg.text, "Why should I save my AI conversations?");
});

test("export md: frontmatter condensed into header block", () => {
  const r = exportLtf(full, "md");
  assert.ok(r.ok);
  assert.match(r.output, /^# On Owning AI Conversations/);
  assert.match(r.output, /\*\*🤖 AI\*\*/);
  assert.doesNotMatch(r.output, /^---/); // no frontmatter fence
});

test("export html: standalone valid doc with role classes", () => {
  const r = exportLtf(full, "html");
  assert.ok(r.ok);
  assert.match(r.output, /<!doctype html>/i);
  assert.match(r.output, /<div class="message human">/);
  assert.match(r.output, /<div class="message ai">/);
  assert.match(r.output, /lang="en"/);
  // html-isolated: no raw `<input>` from the text survives unescaped
  assert.doesNotMatch(r.output, /<script/);
});

test("export org: org-mode drawer + headings", () => {
  const r = exportLtf(full, "org");
  assert.ok(r.ok);
  assert.match(r.output, /^\#\+title: On Owning AI Conversations/);
  assert.match(r.output, /\*\* You/);
  assert.match(r.output, /\*\* Assistant/);
});

test("export rejects unknown target and invalid input", () => {
  assert.equal(exportLtf(full, "pdf").ok, false);
  assert.equal(exportLtf("not an ltf file", "md").ok, false);
});

test("export minimal fixture: works", () => {
  for (const t of ["html", "md", "json", "org"]) {
    const r = exportLtf(minimal, t);
    assert.ok(r.ok, `target ${t} failed`);
  }
});

test("splitMessages: keeps non-role sections as null-role markers", () => {
  const msgs = splitMessages("## Extended Discussion\n\nsome note text\n\n**Human:** hi\n");
  assert.equal(msgs.length, 2);
  assert.equal(msgs[0].role, null);
  assert.match(msgs[0].text, /Extended Discussion/);
  assert.equal(msgs[1].role, "human");
});

test("splitMessages: timestamps captured", () => {
  const body = "**Human:** `2026-05-05 13:43`\n你好\n\n**AI:** `2026-05-05 13:48`\n你好\n";
  const msgs = splitMessages(body);
  assert.equal(msgs[0].time, "2026-05-05 13:43");
  assert.equal(msgs[0].text, "你好");
  assert.equal(msgs[1].role, "ai");
});
