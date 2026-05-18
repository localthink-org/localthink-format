---
name: localthink-validator
description: Review, validate, and repair LocalThink Format (LTF) 1.0 markdown documents. Use when the user asks whether an LTF file is valid, conforms to LocalThink Format, needs fixing, or should be checked before publishing or importing.
---

# LocalThink Validator

Validate a markdown document against LocalThink Format (LTF) 1.0 and provide clear fixes.

## Validation Workflow

1. Check that YAML frontmatter exists and is wrapped in `---`.
2. Check required fields:
   - `localthink`
   - `created`
   - `platform`
   - `language`
3. Check field values:
   - `localthink` must be the quoted string `"1.0"`.
   - `created` should use `YYYY-MM-DD` or ISO 8601 datetime.
   - `updated`, if present, should use `YYYY-MM-DD` or ISO 8601 datetime.
   - `platform` should be a lowercase slug, such as `chatgpt`, `claude`, `gemini`, `cursor`, or `codex`.
   - `language` should be a BCP 47 tag, such as `en`, `zh-TW`, `zh-CN`, or `ja`.
   - `visibility`, if present, must be `private`, `unlisted`, or `public`.
   - `kind`, if present, should be one of `conversation`, `summary`, `extraction`, `extension`, `discussion`, or `note`.
   - `status`, if present, should be one of `active`, `paused`, `finished`, or `archived`.
4. Check recommended fields when present:
   - `title` should be specific.
   - `project` should be human-readable.
   - `project_id` should be a stable lowercase slug for apps and tools.
   - `tags` should be concrete and not excessive.
   - `summary` should summarize the journey and conclusion.
   - `insights` should be specific discoveries, not vague themes.
   - `open_questions` should contain unresolved questions.
   - `participants` should identify human and AI roles.
5. Check the body:
   - The main section should be `## Conversation` or `## 對話記錄`.
   - Speaker turns should use clear labels such as `**Human:**` and `**AI:**`.
   - Appended sessions may use headings like `### Session: 2026-05-18T10:30:00-04:00`.
   - Important extensions should use `## Extended Discussion` when applicable.
6. Check filename when known:
   - Recommended extension is `.ltf.md`.
   - `.md` is allowed.
   - Date prefixes are not required and should not be enforced.
7. Check privacy risk if `visibility` is `public` or `unlisted`.

## Severity Levels

Use these labels:

- `Error`: breaks LTF 1.0 validity.
- `Warning`: valid but likely to reduce interoperability or quality.
- `Suggestion`: optional improvement.

## Output Format

When validating, respond with:

```markdown
## Validation Result

Status: Valid / Valid with warnings / Invalid

## Findings

- [Error] ...
- [Warning] ...
- [Suggestion] ...

## Recommended Fixes

...
```

If there are no findings, say the document is valid and note any residual privacy or quality caveats.

## Repair Mode

If the user asks to fix the document:

- preserve the user's content
- change the smallest amount needed
- do not invent transcript details
- add missing metadata only when it can be inferred safely
- use `visibility: private` when visibility is missing
- use `created` instead of legacy `date`
- when updating an existing living document, update `updated`

Then output the corrected LTF markdown document.

## Privacy Review

For public or unlisted files, look for:

- secrets, tokens, API keys, passwords
- private emails, phone numbers, addresses
- sensitive personal or business information
- accidental exposure of third-party data

Flag privacy issues even if the file is otherwise valid.
