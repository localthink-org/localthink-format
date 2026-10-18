import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LtfSyntaxError, parseLtf } from "../src/index.js";

const fixture = (name) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

const example = (name) =>
  readFileSync(new URL(`../../../examples/${name}`, import.meta.url), "utf8");

test("parses required frontmatter and keeps the markdown body", () => {
  const doc = parseLtf(fixture("minimal.ltf.md"));
  assert.equal(doc.frontmatter.localthink, "1.0");
  assert.equal(typeof doc.frontmatter.localthink, "string");
  assert.equal(doc.frontmatter.created, "2026-05-18");
  assert.equal(doc.frontmatter.platform, "chatgpt");
  assert.equal(doc.frontmatter.language, "en");
  assert.match(doc.body, /## Conversation/);
  assert.match(doc.body, /\*\*Human:\*\*/);
  assert.deepEqual(doc.unknownFields, []);
  assert.deepEqual(doc.customFields, []);
});

test("parses optional fields, custom fields, and a body horizontal rule", () => {
  const doc = parseLtf(fixture("full.ltf.md"));
  assert.equal(doc.frontmatter.title, "On Owning AI Conversations");
  assert.deepEqual(doc.frontmatter.tags, [
    "LocalThink",
    "AI sovereignty",
    "memory",
    "markdown",
  ]);
  assert.equal(doc.frontmatter.participants[1].model, "gpt-5");
  assert.equal(doc.frontmatter.parent.href, "./original-conversation.ltf.md");
  assert.equal(doc.frontmatter.related[0], "./related-topic.ltf.md");
  assert.equal(doc.frontmatter.x_app_version, "1.2.0");
  assert.deepEqual(doc.customFields, ["x_app_version"]);
  assert.match(doc.body, /## Extended Discussion/);
  assert.match(doc.body, /\n---\n/);
});

test("accepts CRLF and a leading BOM", () => {
  const text = `\uFEFF---\r\nlocalthink: "1.0"\r\ncreated: 2026-05-18\r\nplatform: claude\r\nlanguage: zh-TW\r\n---\r\n\r\n## 對話記錄\r\n`;
  const doc = parseLtf(text);
  assert.equal(doc.frontmatter.language, "zh-TW");
  assert.match(doc.body, /## 對話記錄/);
  assert.equal(doc.body.includes("\r"), false);
});

test("rejects a missing or unclosed frontmatter", () => {
  assert.throws(() => parseLtf("## Conversation\n"), LtfSyntaxError);
  assert.throws(
    () => parseLtf('---\nlocalthink: "1.0"\n'),
    (error) => error instanceof LtfSyntaxError && error.errors[0].code === "frontmatter.unclosed",
  );
});

test("rejects YAML that is not a mapping", () => {
  assert.throws(
    () => parseLtf('---\n- just a list\n---\n'),
    (error) => error instanceof LtfSyntaxError && error.errors[0].code === "frontmatter.type",
  );
  assert.throws(
    () => parseLtf("---\nlocalthink: [\n---\n"),
    (error) => error instanceof LtfSyntaxError && error.errors[0].code === "yaml.invalid",
  );
});

test("repository examples keep a conversation body", () => {
  for (const name of ["minimal.ltf.md", "full.ltf.md", "extended-discussion.ltf.md"]) {
    const doc = parseLtf(example(name));
    assert.equal(doc.frontmatter.localthink, "1.0");
    assert.match(doc.body, /## Conversation/);
  }
  const extended = parseLtf(example("extended-discussion.ltf.md"));
  assert.match(extended.body, /## Extended Discussion/);
});
