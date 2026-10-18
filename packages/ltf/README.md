# @localthink/ltf

Parser and validator for [LocalThink Format](https://github.com/localthink-org/localthink-format) documents (`.ltf.md`).

The source of truth is [SPEC.md](https://github.com/localthink-org/localthink-format/blob/main/SPEC.md) at the root of the format repository. This package, in `packages/ltf`, follows the v1.0 parser guidelines in section 8: read the YAML frontmatter, require `localthink: "1.0"`, validate `created`, `platform`, and `language`, keep the body as markdown, and ignore unknown fields.

It does not *capture* chats — use LTF Builder or the Mac app for that,
then validate and convert the files here. It can also re-export existing
`.ltf.md` files to `md`, `html`, `json`, or `org` (see Export below).

## Links

- Website: https://localthink.org
- Format repository: https://github.com/localthink-org/localthink-format
- Specification: https://github.com/localthink-org/localthink-format/blob/main/SPEC.md
- Chrome LTF Builder: https://chromewebstore.google.com/detail/ltf-builder/icpjoemgdpkmllkngcpndocnalodhfaj
- Mac: https://localthink.ai/download

## Command line

From this repository, without publishing:

```bash
cd packages/ltf
npm install
node bin/ltf.js validate ../../examples/minimal.ltf.md
```

After the package is on npm:

```bash
npx @localthink/ltf validate path/to/note.ltf.md
npx @localthink/ltf validate path/to/note.ltf.md --json
```

### Export

Convert an LTF document to another format:

```bash
npx @localthink/ltf export path/to/note.ltf.md --to md      # plain markdown, no frontmatter
npx @localthink/ltf export path/to/note.ltf.md --to html    # standalone HTML, inline styles
npx @localthink/ltf export path/to/note.ltf.md --to json    # { frontmatter, messages[] }
npx @localthink/ltf export path/to/note.ltf.md --to org     # Emacs Org-mode
npx @localthink/ltf export path/to/note.ltf.md --to html -o out.html
```

- `md` strips the frontmatter but keeps the body as-is: a drop-in plain
  markdown file.
- `html` writes a self-contained document (inline CSS, no dependencies)
  with the frontmatter rendered as a header card and each turn as a
  styled block; safe to email or open directly in a browser.
- `json` is for other tools: `{"frontmatter": {...}, "messages":
  [{"role", "time", "text"}, ...]}` where `role` is `human`, `ai` or
  `contributor`, and non-turn sections are kept as `{ role: null }`
  markers so nothing is silently dropped.
- `org` produces an Emacs Org-mode outline with `#+title` and `**` heading
  per turn.

Exit codes: same as `validate` — `0` exported, `1` invalid document,
`2` bad usage or unreadable file (including an unknown `--to` target).

Exit codes:

| Code | Meaning |
| --- | --- |
| 0 | Valid. Warnings are printed and do not fail the command. |
| 1 | Invalid document. |
| 2 | Bad usage, or the file could not be read. |

## Library

```js
import { parseLtf, validateLtf } from "@localthink/ltf";

const document = parseLtf(text);
// document.frontmatter, document.body

const result = validateLtf(text);
// result.ok, result.errors, result.warnings
```

`parseLtf` throws `LtfSyntaxError` when the frontmatter is missing or the YAML is invalid. `validateLtf` returns those failures in `errors` and does not throw.

## What is checked

Errors:

- Frontmatter must start at the first line and close with a line that is only `---`. A later `---` in the body, such as before an extended discussion, stays in the body. A multiline YAML string that itself contains a line of `---` will close the frontmatter early.
- Frontmatter must be a YAML mapping.
- Required fields from SPEC section 3.1: `localthink`, `created`, `platform`, `language`.
- `localthink` must be the string `"1.0"`. Unquoted `1.0` is rejected because YAML reads it as the number `1`. Quote it: `localthink: "1.0"`.
- `created`, and `updated` when present, must be `YYYY-MM-DD` or an ISO 8601 datetime string.
- `language` must be a BCP 47 tag with a 2–3 letter primary subtag (`en`, `zh-TW`, `ja`). This is a shape check, not a lookup in the full IANA registry.
- Recognized optional fields must use the types in SPEC section 3.2.
- `visibility`, when present, must be `public`, `unlisted`, or `private`.
- `participants[].role`, when present, must be `human`, `ai`, `system`, `tool`, or `other`.

Warnings:

- `platform` or `project_id` is not a lowercase hyphenated slug.
- `kind`, `status`, `source`, or `parent.type` is outside the recommended v1.0 values.
- A participant object has no `role`.
- The file name does not end in `.ltf.md` or `.md` (only when validating a path).

Ignored, and kept on the parsed frontmatter:

- Unknown fields. Parsers must not reject them.
- Custom `x_` fields, such as `x_app_version`.

Not checked, because the spec does not require them:

- Optional fields may be omitted. `visibility` defaults to `private` in the spec; this package does not invent the field.
- Body headings such as `## Conversation`. The body is returned as markdown.
- Filename slugs and date prefixes.

## Develop

```bash
cd packages/ltf
npm install
npm test
```

Fixtures live in `test/fixtures/`. The tests also validate `examples/*.ltf.md` at the repository root.

## Publishing

Danko publishes this package. Nothing in this repository publishes to npm: there is no GitHub Actions release workflow. Publish by hand, from a checkout of the commit you want to release, after the `localthink` organization on npm is yours.

Do not publish from an unmerged pull request.

### 1. Claim the npm organization `localthink`

The package name `@localthink/ltf` only works if the npm scope `@localthink` belongs to you.

1. Create or sign in to an account at https://www.npmjs.com/signup.
2. Turn on two-factor authentication. npm requires it for publish.
3. Open https://www.npmjs.com/org/create and create an organization named `localthink`.
   - The organization name is the scope. Creating it gives you `@localthink`.
   - Use the free organization if every package will be public. A private publish needs a paid plan and is the wrong choice for this package.
4. Confirm you are an owner at https://www.npmjs.com/settings/localthink/members.
5. If https://www.npmjs.com/org/localthink already exists and you are not an owner, you cannot claim that scope. Ask the current owner for publish access. Do not rename this package to a different scope unless the LocalThink maintainers agree.

### 2. Publish `@localthink/ltf`

From the repository root:

```bash
cd packages/ltf
npm login
npm whoami
npm publish --access public
```

`--access public` is required the first time a scoped package is published. Without it, npm tries to publish a private package, which fails on a free organization.

`package.json` also sets `publishConfig.access` to `public`. Keep the flag on the command anyway.

When the command succeeds, check:

```bash
npm view @localthink/ltf version
```

The page is https://www.npmjs.com/package/@localthink/ltf.

### 3. Later versions

npm will not replace a version that is already published.

1. Change `version` in `packages/ltf/package.json`.
2. Commit that change.
3. From `packages/ltf` on that commit, run `npm publish --access public` again.

Add a release workflow only when you want publishes to happen from CI. Until then, the command above is the release process.

## License

[CC0 1.0](./LICENSE), the same dedication as LocalThink Format.
