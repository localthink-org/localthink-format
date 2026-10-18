import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { FORMAT_VERSION, REQUIRED_FIELDS, validateLtf } from "../src/index.js";

const fixture = (name) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

const example = (name) =>
  readFileSync(new URL(`../../../examples/${name}`, import.meta.url), "utf8");

function codes(result, key) {
  return result[key].map((issue) => issue.code);
}

test("required fields match SPEC section 3.1", () => {
  assert.equal(FORMAT_VERSION, "1.0");
  assert.deepEqual(REQUIRED_FIELDS, ["localthink", "created", "platform", "language"]);
});

test("minimal and full fixtures are valid without warnings", () => {
  for (const name of ["minimal.ltf.md", "full.ltf.md"]) {
    const result = validateLtf(fixture(name));
    assert.equal(result.ok, true, name);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.warnings, []);
  }
});

test("repository examples are valid LocalThink Format 1.0", () => {
  for (const name of ["minimal.ltf.md", "full.ltf.md", "extended-discussion.ltf.md"]) {
    const result = validateLtf(example(name));
    assert.equal(result.ok, true, `${name}: ${result.errors.map((e) => e.message).join("; ")}`);
    assert.deepEqual(result.warnings, [], name);
  }
});

test("reports every missing required field", () => {
  const result = validateLtf("---\ntitle: notes\n---\n");
  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((error) => error.field),
    ["localthink", "created", "platform", "language"],
  );
});

test("rejects a missing language", () => {
  const result = validateLtf(fixture("missing-language.ltf.md"));
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].code, "field.required");
  assert.equal(result.errors[0].field, "language");
});

test("rejects unquoted 1.0 because YAML coerces it to a number", () => {
  const result = validateLtf(fixture("unquoted-version.ltf.md"));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "localthink.type");
  assert.match(result.errors[0].message, /unquoted 1\.0/);
  assert.match(result.errors[0].message, /number/);
  assert.equal(result.document.frontmatter.localthink, 1);
});

test("accepts single quotes and rejects other version strings", () => {
  const quoted = validateLtf(`---
localthink: '1.0'
created: 2026-05-18
platform: gemini
language: ja
---
`);
  assert.equal(quoted.ok, true);

  const other = validateLtf(`---
localthink: "1.1"
created: 2026-05-18
platform: gemini
language: ja
---
`);
  assert.equal(other.ok, false);
  assert.equal(other.errors[0].code, "localthink.version");
});

test("checks calendar dates and ISO datetimes", () => {
  const badDay = validateLtf(`---
localthink: "1.0"
created: 2026-02-31
platform: grok
language: fr
---
`);
  assert.equal(badDay.errors[0].code, "created.invalid");

  const badUpdated = validateLtf(`---
localthink: "1.0"
created: 2026-05-18
updated: yesterday
platform: grok
language: de
---
`);
  assert.equal(badUpdated.errors[0].code, "updated.invalid");

  const zulu = validateLtf(`---
localthink: "1.0"
created: 2026-05-18T10:30:00.123Z
platform: cursor
language: en
---
`);
  assert.equal(zulu.ok, true);
  assert.equal(typeof zulu.document.frontmatter.created, "string");
});

test("warns on platform and project_id shape without failing", () => {
  const result = validateLtf(`---
localthink: "1.0"
created: 2026-05-18
platform: ChatGPT
language: zh-CN
project_id: Local Think
---
`);
  assert.equal(result.ok, true);
  assert.deepEqual(codes(result, "warnings").sort(), ["platform.format", "project_id.format"]);
});

test("rejects an empty platform and a language that is not a BCP 47 tag", () => {
  const result = validateLtf(`---
localthink: "1.0"
created: 2026-05-18
platform: ""
language: english
---
`);
  assert.equal(result.ok, false);
  assert.ok(codes(result, "errors").includes("field.type"));
  assert.ok(codes(result, "errors").includes("language.invalid"));
});

test("enforces allowed visibility and participant roles when present", () => {
  const result = validateLtf(`---
localthink: "1.0"
created: 2026-05-18
platform: other
language: en
visibility: secret
participants:
  - role: Human
    id: thinker
---
`);
  assert.equal(result.ok, false);
  assert.ok(codes(result, "errors").includes("visibility.invalid"));
  assert.ok(codes(result, "errors").includes("participants.role"));
});

test("warns on unrecognized recommended values and ignores unknown fields", () => {
  const result = validateLtf(`---
localthink: "1.0"
created: 2026-05-18
platform: perplexity
language: en
kind: essay
status: brewing
source: dream
future_field: 1
x_local_embedding_model: nomic-embed-text
---
`);
  assert.equal(result.ok, true);
  assert.equal(result.warnings.length, 3);
  assert.deepEqual(result.document.unknownFields, ["future_field"]);
  assert.deepEqual(result.document.customFields, ["x_local_embedding_model"]);
  assert.equal(result.document.frontmatter.future_field, 1);
  assert.equal(result.document.frontmatter.x_local_embedding_model, "nomic-embed-text");
});

test("rejects the wrong type for a recognized list", () => {
  const result = validateLtf(`---
localthink: "1.0"
created: 2024-02-29
platform: codex
language: en
tags: memory
insights:
  - 1
---
`);
  assert.equal(result.ok, false);
  assert.equal(result.errors.filter((error) => error.code === "field.type").length, 2);
});

test("returns syntax problems from validateLtf without throwing", () => {
  const result = validateLtf("no frontmatter\n");
  assert.equal(result.ok, false);
  assert.equal(result.document, null);
  assert.equal(result.errors[0].code, "frontmatter.missing");
});
