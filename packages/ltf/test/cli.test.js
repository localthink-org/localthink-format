import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runCli } from "../src/cli.js";

const bin = fileURLToPath(new URL("../bin/ltf.js", import.meta.url));
const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const example = (name) => fileURLToPath(new URL(`../../../examples/${name}`, import.meta.url));

function spawnCli(args) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
}

test("bin validates a sample file", () => {
  const result = spawnCli(["validate", example("minimal.ltf.md")]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^valid\s+/);
  assert.match(result.stdout, /minimal\.ltf\.md/);
});

test("bin rejects a file that omits a required field", () => {
  const result = spawnCli(["validate", fixture("missing-language.ltf.md")]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /invalid/);
  assert.match(result.stdout, /language/);
});

test("bin rejects an unquoted version on a fixture", () => {
  const result = spawnCli(["validate", fixture("unquoted-version.ltf.md")]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /localthink\.type/);
});

test("bin prints JSON and keeps a zero exit code when the file is valid", () => {
  const result = spawnCli(["validate", "--json", fixture("full.ltf.md")]);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.frontmatter.localthink, "1.0");
  assert.equal(payload.frontmatter.platform, "chatgpt");
  assert.deepEqual(payload.errors, []);
  assert.equal(Object.hasOwn(payload, "body"), false);
});

test("bin returns 2 for a missing path and for usage errors", () => {
  const missing = spawnCli(["validate", fixture("no-such-file.ltf.md")]);
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /cannot read/);

  const usage = spawnCli(["validate"]);
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /one file path/);

  const help = spawnCli(["--help"]);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /npx @localthink\/ltf validate/);
});

test("runCli warns when the suffix is not markdown", () => {
  let out = "";
  const note = fileURLToPath(new URL("./fixtures/note.txt", import.meta.url));
  const warned = runCli(["validate", note], {
    stdout: (text) => {
      out += text;
    },
    stderr: (text) => {
      out += text;
    },
  });
  assert.equal(warned, 0);
  assert.match(out, /^valid/);
  assert.match(out, /filename\.extension/);
  assert.match(out, /note\.txt/);
});
