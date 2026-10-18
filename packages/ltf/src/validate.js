import { LtfSyntaxError, parseLtf } from "./parse.js";

/** Format version this package validates. SPEC.md status 1.0. */
export const FORMAT_VERSION = "1.0";

/** SPEC.md section 3.1. Only these four fields are required. */
export const REQUIRED_FIELDS = Object.freeze([
  "localthink",
  "created",
  "platform",
  "language",
]);

const RECOMMENDED_KIND = Object.freeze([
  "conversation",
  "summary",
  "extraction",
  "extension",
  "discussion",
  "note",
]);

const RECOMMENDED_STATUS = Object.freeze([
  "active",
  "paused",
  "finished",
  "archived",
]);

const RECOMMENDED_SOURCE = Object.freeze([
  "manual",
  "chatbot",
  "export",
  "builder",
  "import",
]);

const VISIBILITY = Object.freeze(["public", "unlisted", "private"]);

const ROLES = Object.freeze(["human", "ai", "system", "tool", "other"]);

const PARENT_TYPES = Object.freeze([
  "continuation",
  "translation",
  "response",
  "fork",
  "summary",
  "extraction",
]);

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BCP47 = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{1,8})*$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-](\d{2}):(\d{2}))?$/;

function aType(value) {
  const name = Array.isArray(value) ? "list" : value === null ? "null" : typeof value;
  return `${/^[aeiou]/.test(name) ? "an" : "a"} ${name}`;
}

/**
 * @param {"error" | "warning"} severity
 * @param {string} code
 * @param {string} message
 * @param {string} [field]
 */
function issue(severity, code, message, field) {
  const item = { severity, code, message };
  if (field) item.field = field;
  return item;
}

function isMissing(frontmatter, field) {
  return (
    !Object.prototype.hasOwnProperty.call(frontmatter, field) ||
    frontmatter[field] === undefined ||
    frontmatter[field] === null
  );
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isRealDate(year, month, day) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isDateOrDateTime(value) {
  const dateMatch = DATE.exec(value);
  if (dateMatch) {
    return isRealDate(
      Number(dateMatch[1]),
      Number(dateMatch[2]),
      Number(dateMatch[3]),
    );
  }

  const dateTimeMatch = DATETIME.exec(value);
  if (!dateTimeMatch) return false;
  const hour = Number(dateTimeMatch[4]);
  const minute = Number(dateTimeMatch[5]);
  const second = Number(dateTimeMatch[6]);
  if (hour > 23 || minute > 59 || second > 60) return false;
  if (dateTimeMatch[8] && dateTimeMatch[8] !== "Z") {
    const offsetHour = Number(dateTimeMatch[9]);
    const offsetMinute = Number(dateTimeMatch[10]);
    if (offsetHour > 23 || offsetMinute > 59) return false;
  }
  return isRealDate(
    Number(dateTimeMatch[1]),
    Number(dateTimeMatch[2]),
    Number(dateTimeMatch[3]),
  );
}

function requirePresent(frontmatter, field, errors) {
  if (!isMissing(frontmatter, field)) return true;
  errors.push(
    issue("error", "field.required", `missing required field "${field}"`, field),
  );
  return false;
}

function checkDateField(value, field, errors) {
  if (typeof value !== "string" || !isDateOrDateTime(value)) {
    errors.push(
      issue(
        "error",
        `${field}.invalid`,
        `${field} must be a YYYY-MM-DD date or an ISO 8601 datetime string, such as 2026-05-18 or 2026-05-18T10:30:00-04:00`,
        field,
      ),
    );
  }
}

function checkOptionalString(value, field, errors) {
  if (isEmptyOptional(value)) return;
  if (typeof value !== "string") {
    errors.push(issue("error", "field.type", `${field} must be a string`, field));
  }
}

function isEmptyOptional(value) {
  return value === undefined || value === null;
}

function checkStringList(value, field, errors) {
  if (isEmptyOptional(value)) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push(
      issue("error", "field.type", `${field} must be a list of strings`, field),
    );
  }
}

function checkRecommended(value, field, allowed, errors, warnings) {
  if (isEmptyOptional(value)) return;
  if (typeof value !== "string") {
    errors.push(issue("error", "field.type", `${field} must be a string`, field));
    return;
  }
  if (!allowed.includes(value)) {
    warnings.push(
      issue(
        "warning",
        "field.recommended",
        `${field} "${value}" is not a recommended v1.0 value (${allowed.join(", ")})`,
        field,
      ),
    );
  }
}

function checkLocalthink(document, errors) {
  const { frontmatter, localthink } = document;
  if (!requirePresent(frontmatter, "localthink", errors)) return;

  const value = frontmatter.localthink;
  if (typeof value !== "string") {
    const shown = localthink?.source
      ? `unquoted ${localthink.source}`
      : JSON.stringify(value);
    errors.push(
      issue(
        "error",
        "localthink.type",
        `localthink must be the quoted string "${FORMAT_VERSION}". ${shown} was read as ${aType(value)}. Write localthink: "${FORMAT_VERSION}".`,
        "localthink",
      ),
    );
    return;
  }

  if (value !== FORMAT_VERSION) {
    errors.push(
      issue(
        "error",
        "localthink.version",
        `localthink version ${JSON.stringify(value)} is not supported. This package validates LocalThink Format ${FORMAT_VERSION}.`,
        "localthink",
      ),
    );
  }
}

function checkPlatform(value, errors, warnings) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(
      issue("error", "field.type", "platform must be a non-empty string", "platform"),
    );
    return;
  }
  if (!SLUG.test(value)) {
    warnings.push(
      issue(
        "warning",
        "platform.format",
        `platform ${JSON.stringify(value)} should be a lowercase hyphenated name, such as chatgpt or mistral-le-chat`,
        "platform",
      ),
    );
  }
}

function checkLanguage(value, errors) {
  if (typeof value !== "string" || !BCP47.test(value)) {
    errors.push(
      issue(
        "error",
        "language.invalid",
        "language must be a BCP 47 tag with a 2-3 letter primary subtag, such as en, zh-TW, zh-CN, or ja",
        "language",
      ),
    );
  }
}

function checkProjectId(value, errors, warnings) {
  if (isEmptyOptional(value)) return;
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(
      issue(
        "error",
        "field.type",
        "project_id must be a non-empty string",
        "project_id",
      ),
    );
    return;
  }
  if (!SLUG.test(value)) {
    warnings.push(
      issue(
        "warning",
        "project_id.format",
        `project_id ${JSON.stringify(value)} should be a lowercase slug of letters, numbers, and hyphens`,
        "project_id",
      ),
    );
  }
}

function checkVisibility(value, errors) {
  if (isEmptyOptional(value)) return;
  if (typeof value !== "string" || !VISIBILITY.includes(value)) {
    errors.push(
      issue(
        "error",
        "visibility.invalid",
        `visibility must be one of ${VISIBILITY.join(", ")}`,
        "visibility",
      ),
    );
  }
}

function checkOptionalStringField(object, key, field, errors) {
  if (!Object.prototype.hasOwnProperty.call(object, key) || object[key] === undefined) {
    return;
  }
  if (typeof object[key] !== "string") {
    errors.push(issue("error", "field.type", `${field} must be a string`, field));
  }
}

function checkParticipants(value, errors, warnings) {
  if (isEmptyOptional(value)) return;
  if (!Array.isArray(value)) {
    errors.push(
      issue(
        "error",
        "field.type",
        "participants must be a list of objects",
        "participants",
      ),
    );
    return;
  }

  value.forEach((participant, index) => {
    const field = `participants[${index}]`;
    if (!isPlainObject(participant)) {
      errors.push(
        issue("error", "field.type", `${field} must be an object`, field),
      );
      return;
    }
    if (isEmptyOptional(participant.role)) {
      warnings.push(
        issue(
          "warning",
          "participants.role",
          `${field} should include a role (${ROLES.join(", ")})`,
          field,
        ),
      );
    } else if (typeof participant.role !== "string" || !ROLES.includes(participant.role)) {
      errors.push(
        issue(
          "error",
          "participants.role",
          `${field}.role must be one of ${ROLES.join(", ")}`,
          `${field}.role`,
        ),
      );
    }
    for (const key of ["id", "platform", "model"]) {
      checkOptionalStringField(participant, key, `${field}.${key}`, errors);
    }
  });
}

function checkLinkObject(value, field, errors, warnings, typeValues) {
  if (typeof value === "string") {
    if (value.trim() === "") {
      errors.push(
        issue("error", "field.type", `${field} must be a non-empty string or an object`, field),
      );
    }
    return;
  }
  if (!isPlainObject(value)) {
    errors.push(
      issue(
        "error",
        "field.type",
        `${field} must be a string or an object`,
        field,
      ),
    );
    return;
  }
  for (const key of ["type", "href", "title"]) {
    checkOptionalStringField(value, key, `${field}.${key}`, errors);
  }
  if (typeValues && typeof value.type === "string" && !typeValues.includes(value.type)) {
    warnings.push(
      issue(
        "warning",
        "field.recommended",
        `${field}.type "${value.type}" is not a recommended v1.0 value (${typeValues.join(", ")})`,
        `${field}.type`,
      ),
    );
  }
}

function checkParent(value, errors, warnings) {
  if (isEmptyOptional(value)) return;
  checkLinkObject(value, "parent", errors, warnings, PARENT_TYPES);
}

function checkRelated(value, errors, warnings) {
  if (isEmptyOptional(value)) return;
  if (!Array.isArray(value)) {
    errors.push(
      issue(
        "error",
        "field.type",
        "related must be a list of strings or objects",
        "related",
      ),
    );
    return;
  }
  value.forEach((item, index) => {
    checkLinkObject(item, `related[${index}]`, errors, warnings);
  });
}

/**
 * Validate a document already returned by {@link parseLtf}.
 * Unknown fields and `x_` custom fields are ignored, per SPEC.md sections 3.3 and 8.
 *
 * @param {ReturnType<typeof parseLtf>} document
 */
export function validateDocument(document) {
  const errors = [];
  const warnings = [...document.yamlWarnings];
  const frontmatter = document.frontmatter;

  checkLocalthink(document, errors);

  if (requirePresent(frontmatter, "created", errors)) {
    checkDateField(frontmatter.created, "created", errors);
  }
  if (requirePresent(frontmatter, "platform", errors)) {
    checkPlatform(frontmatter.platform, errors, warnings);
  }
  if (requirePresent(frontmatter, "language", errors)) {
    checkLanguage(frontmatter.language, errors);
  }

  checkOptionalString(frontmatter.title, "title", errors);
  if (!isMissing(frontmatter, "updated")) {
    checkDateField(frontmatter.updated, "updated", errors);
  }
  checkOptionalString(frontmatter.project, "project", errors);
  checkProjectId(frontmatter.project_id, errors, warnings);
  checkRecommended(frontmatter.kind, "kind", RECOMMENDED_KIND, errors, warnings);
  checkRecommended(frontmatter.status, "status", RECOMMENDED_STATUS, errors, warnings);
  checkRecommended(frontmatter.source, "source", RECOMMENDED_SOURCE, errors, warnings);
  checkOptionalString(frontmatter.model, "model", errors);
  checkStringList(frontmatter.tags, "tags", errors);
  checkVisibility(frontmatter.visibility, errors);
  checkOptionalString(frontmatter.summary, "summary", errors);
  checkStringList(frontmatter.insights, "insights", errors);
  checkStringList(frontmatter.open_questions, "open_questions", errors);
  checkParticipants(frontmatter.participants, errors, warnings);
  checkParent(frontmatter.parent, errors, warnings);
  checkRelated(frontmatter.related, errors, warnings);

  return { errors, warnings };
}

/**
 * Parse and validate LTF text. Document problems are returned, not thrown.
 *
 * @param {string} text
 */
export function validateLtf(text) {
  let document;
  try {
    document = parseLtf(text);
  } catch (error) {
    if (error instanceof LtfSyntaxError) {
      return { ok: false, errors: error.errors, warnings: [], document: null };
    }
    throw error;
  }

  const { errors, warnings } = validateDocument(document);
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    document,
  };
}

/**
 * SPEC.md section 7. `.ltf.md` is recommended and `.md` is allowed.
 * Other suffixes produce a warning only when a caller has a file path.
 *
 * @param {string} filePath
 */
export function filenameWarning(filePath) {
  const base = filePath.split(/[/\\]/).pop() ?? filePath;
  const lower = base.toLowerCase();
  if (lower.endsWith(".ltf.md") || lower.endsWith(".md")) return null;
  return issue(
    "warning",
    "filename.extension",
    `file name ${JSON.stringify(base)} should end with .ltf.md (or .md)`,
    "filename",
  );
}
