import { isMap, parseDocument } from "yaml";

const KNOWN_FIELDS = new Set([
  "localthink",
  "created",
  "platform",
  "language",
  "title",
  "updated",
  "project",
  "project_id",
  "kind",
  "status",
  "source",
  "model",
  "tags",
  "visibility",
  "summary",
  "insights",
  "open_questions",
  "participants",
  "parent",
  "related",
]);

export class LtfSyntaxError extends Error {
  /**
   * @param {Array<{ severity: "error", code: string, message: string, field?: string }>} errors
   */
  constructor(errors) {
    super(errors.map((error) => error.message).join("\n"));
    this.name = "LtfSyntaxError";
    this.errors = errors;
  }
}

/**
 * Split an LTF document into YAML frontmatter and a markdown body.
 * The opening `---` must be the first line. The closing fence is the next
 * line that is exactly `---`. Later horizontal rules in the body are kept.
 *
 * @param {string} text
 * @returns {{ ok: true, yaml: string, body: string } | { ok: false, code: string, message: string }}
 */
export function splitFrontmatter(text) {
  if (typeof text !== "string") {
    return {
      ok: false,
      code: "input.type",
      message: "LTF input must be a string",
    };
  }

  const src = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!src.startsWith("---")) {
    return {
      ok: false,
      code: "frontmatter.missing",
      message: "missing YAML frontmatter; an LTF document must start with ---",
    };
  }

  const firstNl = src.indexOf("\n");
  const openLine = firstNl === -1 ? src : src.slice(0, firstNl);
  if (!/^---[ \t]*$/.test(openLine)) {
    return {
      ok: false,
      code: "frontmatter.missing",
      message: "missing YAML frontmatter; the first line must be ---",
    };
  }
  if (firstNl === -1) {
    return {
      ok: false,
      code: "frontmatter.unclosed",
      message: "unclosed YAML frontmatter; missing the closing ---",
    };
  }

  let i = firstNl + 1;
  while (i <= src.length) {
    const next = src.indexOf("\n", i);
    const lineEnd = next === -1 ? src.length : next;
    const line = src.slice(i, lineEnd);
    if (/^---[ \t]*$/.test(line)) {
      return {
        ok: true,
        yaml: src.slice(firstNl + 1, i),
        body: next === -1 ? "" : src.slice(next + 1),
      };
    }
    if (next === -1) break;
    i = next + 1;
  }

  return {
    ok: false,
    code: "frontmatter.unclosed",
    message: "unclosed YAML frontmatter; missing the closing ---",
  };
}

/**
 * Parse an LTF document. Throws {@link LtfSyntaxError} when the frontmatter
 * cannot be read. Field rules are applied by {@link validateLtf}.
 *
 * @param {string} text
 */
export function parseLtf(text) {
  const split = splitFrontmatter(text);
  if (!split.ok) {
    throw new LtfSyntaxError([
      { severity: "error", code: split.code, message: split.message },
    ]);
  }

  const yamlText = split.yaml.trim() === "" ? "{}" : split.yaml;
  const doc = parseDocument(yamlText, { prettyErrors: true });
  if (doc.errors.length > 0) {
    throw new LtfSyntaxError(
      doc.errors.map((error) => ({
        severity: "error",
        code: "yaml.invalid",
        message: error.message,
      })),
    );
  }

  if (!doc.contents || !isMap(doc.contents)) {
    throw new LtfSyntaxError([
      {
        severity: "error",
        code: "frontmatter.type",
        message: "frontmatter must be a YAML mapping",
      },
    ]);
  }

  const frontmatter = doc.toJS({ maxAliasCount: 100 });
  const localthink = scalarInfo(doc, "localthink");
  const unknownFields = [];
  const customFields = [];

  for (const key of Object.keys(frontmatter)) {
    if (key.startsWith("x_")) customFields.push(key);
    else if (!KNOWN_FIELDS.has(key)) unknownFields.push(key);
  }

  const yamlWarnings = doc.warnings.map((warning) => ({
    severity: "warning",
    code: "yaml.warning",
    message: warning.message,
  }));

  return {
    frontmatter,
    body: split.body,
    unknownFields,
    customFields,
    localthink,
    yamlWarnings,
  };
}

function scalarInfo(doc, key) {
  const node = doc.get(key, true);
  if (!node || typeof node !== "object" || !("type" in node)) return null;
  return {
    type: node.type,
    source: typeof node.source === "string" ? node.source : null,
    value: node.value,
  };
}
