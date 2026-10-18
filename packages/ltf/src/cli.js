import { readFileSync, writeFileSync } from "node:fs";
import { exportLtf } from "./export.js";
import { filenameWarning, validateLtf } from "./validate.js";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const HELP = `ltf — parser and validator for LocalThink Format (.ltf.md)

Usage:
  ltf validate <file> [--json]
  ltf export <file> --to html|md|json|org [-o out]
  npx @localthink/ltf validate <file>

Options:
  --json       Print the result as JSON on stdout
  --help, -h   Show this help
  --version, -v  Show the package version

Exit codes:
  0  the document is valid (warnings do not fail)
  1  the document is invalid
  2  the command or the file could not be used

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
    // export subcommand flags (--to/-t/--out/-o and their values) are
    // handled inside the export branch below, so let them through here
    else if (
      arg === "--to" || arg === "-t" || arg === "--out" || arg === "-o" ||
      arg.startsWith("--to=") || arg.startsWith("--out=")
    ) positionals.push(arg);
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

  if (command === "export") {
    const FLAG_VALUES = new Set(["--to", "-t", "--out", "-o"]);
    const source = rest.find((arg, i) => !arg.startsWith("-") && !FLAG_VALUES.has(rest[i - 1]));
    let to = "md";
    let out = null;
    for (let i = 0; i < rest.length; i++) {
      const flag = rest[i];
      if (flag === "--to" || flag === "-t") to = rest[i + 1] ?? "";
      else if (flag === "--out" || flag === "-o") out = rest[i + 1] ?? null;
      else if (flag.startsWith("--to=")) to = flag.slice(5);
      else if (flag.startsWith("--out=")) out = flag.slice(6);
      else if (flag.startsWith("-")) {
        stderr(`unknown option: ${flag}\n\n${HELP}`);
        return 2;
      }
    }
    if (!source) {
      stderr("export expects one file path\n\n" + HELP);
      return 2;
    }
    return runExport({ source, to, out, stdout, stderr, flags });
  }

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

/** @param {{ source: string, to: string, out: string|null, stdout: Function, stderr: Function, flags: Set<string> }} ctx */
function runExport({ source, to, out, stdout, stderr, flags }) {
  if (!["html", "md", "json", "org"].includes(to)) {
    stderr(`unknown export target: ${to}\n  valid targets: html, md, json, org\n`);
    return 2;
  }
  let text;
  try {
    text = readFileSync(source, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr(`cannot read ${source}: ${message}\n`);
    return 2;
  }

  const result = exportLtf(text, to);
  if (!result.ok) {
    if (flags.has("json")) {
      stdout(`${JSON.stringify({ ok: false, path: source, errors: result.errors ?? [{ code: result.code, message: result.message }] }, null, 2)}\n`);
    } else {
      const code = result.code ?? "export.failed";
      stderr(`export ${source} [${code}] ${result.message}\n`);
    }
    return 1;
  }
  if (out) {
    writeFileSync(out, result.output, "utf8");
    stderr(`wrote ${out}\n`);
  } else {
    stdout(result.output);
  }
  return 0;
}
