import { readFileSync } from "node:fs";
import { filenameWarning, validateLtf } from "./validate.js";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const HELP = `ltf — parser and validator for LocalThink Format (.ltf.md)

Usage:
  ltf validate <file> [--json]
  npx @localthink/ltf validate <file>

Options:
  --json       Print the result as JSON on stdout
  --help, -h   Show this help
  --version, -v  Show the package version

Exit codes:
  0  the document is valid (warnings do not fail)
  1  the document is invalid
  2  the command or the file could not be used

Required frontmatter, from SPEC.md section 3.1:
  localthink, created, platform, language

Specification: https://github.com/localthink-org/localthink-format/blob/main/SPEC.md
`;

/**
 * @param {string[]} args
 * @param {{ stdout?: (text: string) => void, stderr?: (text: string) => void }} [io]
 * @returns {number}
 */
export function runCli(args, io = {}) {
  const stdout = io.stdout ?? ((text) => process.stdout.write(text));
  const stderr = io.stderr ?? ((text) => process.stderr.write(text));
  const flags = new Set();
  const positionals = [];

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") flags.add("help");
    else if (arg === "--version" || arg === "-v") flags.add("version");
    else if (arg === "--json") flags.add("json");
    else if (arg.startsWith("-")) {
      stderr(`unknown option: ${arg}\n\n${HELP}`);
      return 2;
    } else {
      positionals.push(arg);
    }
  }

  if (flags.has("help") || args.length === 0) {
    stdout(HELP);
    return flags.has("help") ? 0 : 2;
  }
  if (flags.has("version") && positionals.length === 0) {
    stdout(`${pkg.version}\n`);
    return 0;
  }

  const [command, ...rest] = positionals;
  if (command !== "validate") {
    stderr(`unknown command: ${command ?? "(missing)"}\n\n${HELP}`);
    return 2;
  }
  if (rest.length !== 1) {
    stderr(`validate expects one file path\n\n${HELP}`);
    return 2;
  }

  const filePath = rest[0];
  let text;
  try {
    text = readFileSync(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr(`cannot read ${filePath}: ${message}\n`);
    return 2;
  }

  const result = validateLtf(text);
  const extensionWarning = filenameWarning(filePath);
  if (extensionWarning) result.warnings.push(extensionWarning);

  if (flags.has("json")) {
    stdout(
      `${JSON.stringify(
        {
          ok: result.ok,
          path: filePath,
          errors: result.errors,
          warnings: result.warnings,
          frontmatter: result.document?.frontmatter ?? null,
        },
        null,
        2,
      )}\n`,
    );
  } else {
    stdout(formatReport(filePath, result));
  }

  return result.ok ? 0 : 1;
}

function formatReport(filePath, result) {
  const lines = [`${result.ok ? "valid" : "invalid"}  ${filePath}`];
  for (const error of result.errors) {
    lines.push(`  error  [${error.code}] ${error.message}`);
  }
  for (const warning of result.warnings) {
    lines.push(`  warning  [${warning.code}] ${warning.message}`);
  }
  return `${lines.join("\n")}\n`;
}
