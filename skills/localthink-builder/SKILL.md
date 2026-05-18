---
name: localthink-builder
description: Generate a LocalThink Format (LTF) 1.0 markdown document from a human-AI conversation, raw transcript, notes, or dialogue summary. Use when the user asks to save, export, summarize, format, convert, or preserve a conversation as LocalThink, LTF, or a portable AI conversation record.
---

# LocalThink Builder

Create a valid LocalThink Format (LTF) 1.0 markdown document from the current conversation, a provided transcript, notes, or a summarized dialogue.

## Core Output

Output one complete markdown file, ready for the user to save as `.ltf.md`.

Use this structure:

```markdown
---
localthink: "1.0"
title: "[precise conversation title]"
created: YYYY-MM-DD or ISO 8601 datetime
updated: YYYY-MM-DD or ISO 8601 datetime
platform: [platform slug]
model: [model if known]
language: [BCP 47 language tag]
project: "[project name if known]"
project_id: "[stable project slug if known]"
kind: conversation
status: active
source: builder
tags: [tag1, tag2, tag3]
visibility: private
summary: "[concise summary]"
insights:
  - "[specific insight]"
open_questions:
  - "[important unresolved question]"
participants:
  - role: human
  - role: ai
    platform: [platform slug]
    model: [model if known]
---

## Conversation

**Human:** ...

**AI:** ...
```

## Required Fields

Always include:

- `localthink: "1.0"`
- `created`
- `platform`
- `language`

## Defaults

- Use `visibility: private` unless the user explicitly asks for public sharing.
- Use the current date or datetime for `created` when the creation time is not provided.
- Use `updated` when appending to an existing LTF document or when the current update time is known.
- Use the current platform and model if known. If unknown, use `platform: other` and omit `model`.
- Use the primary conversation language. For Traditional Chinese, use `zh-TW`.
- Use `kind: conversation` unless the output is clearly a `summary`, `extraction`, `extension`, `discussion`, or `note`.
- Use `status: active` for living documents that may continue; use `finished` only when the user asks to close the thought.
- Use `source: builder` when this skill creates the document.

## Metadata Guidance

- `title`: short, specific, not generic.
- `project`: human-readable project name when known.
- `project_id`: stable lowercase slug for apps and tools when known.
- `tags`: 3 to 8 concrete topic tags.
- `summary`: explain the conversation journey, not just the topic.
- `insights`: write concrete discoveries, preferably in sentences.
- `open_questions`: include only meaningful unresolved questions.
- `participants`: include human and AI; add model/platform when known.

## Body Guidance

Preserve the actual conversation when available.

If the full transcript is too long or unavailable:

- preserve key turns and turning points
- avoid inventing exact quotes
- label reconstructed content clearly, such as `Summary of discussion`

Use:

```markdown
### Key Turning Point: [description]
```

when the conversation changes direction in an important way.

For appended or multi-session documents, use session headings in the body instead of adding `sessions` metadata:

```markdown
## Conversation

### Session: 2026-05-18T10:30:00-04:00

**Human:** ...

**AI:** ...

---

### Session: 2026-05-19T09:20:00-04:00

**Human:** ...

**AI:** ...
```

## File Naming

Recommend a stable filename with `.ltf.md`:

```text
short-title-slug.ltf.md
```

Do not add a date prefix by default. Dates belong in `created` and `updated`.

## Privacy Check

Before final output, remove or anonymize:

- API keys and credentials
- private emails and phone numbers
- addresses and financial details
- private third-party personal information
- secrets from companies, clients, or projects

If the user explicitly wants the document public, be stricter about privacy and set `visibility: public`.

## Final Response

Return only the LTF markdown document unless the user asks for explanation.
