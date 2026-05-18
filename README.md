# LocalThink Format

**LocalThink Format (LTF) is an open markdown standard for saving, owning, sharing, and extending human-AI conversations.**

Your thinking should not disappear into closed chat interfaces. It should live in files you can read, move, search, back up, publish, and build tools on.

LocalThink Format turns a meaningful human-AI conversation into a living markdown document with structured metadata and readable content.

---

## Why LocalThink Format

Every day, people have valuable conversations with AI:

- a founder clarifies a business idea
- a researcher explores an open question
- a programmer designs a system
- a writer discovers the shape of an essay
- a person thinks through something they could not think through alone

Most of those conversations stay locked inside one platform.

If you cancel a subscription, switch models, move from ChatGPT to Claude or Gemini, or want to build your own local memory system, your thinking becomes hard to carry with you.

LTF exists to make human-AI conversations:

- **owned** by the thinker
- **portable** across platforms
- **readable** without special software
- **extensible** by other people and tools
- **local-first** by default

---

## Quick Start

An LTF file is a normal markdown file with a `localthink` identifier in YAML frontmatter.

Recommended file extension: `.ltf.md`  
Allowed file extension: `.md`

```markdown
---
localthink: "1.0"
title: "My Living Conversation"
created: 2026-05-18
updated: 2026-05-18T14:50:00-04:00
platform: chatgpt
language: en
project: "LocalThink"
project_id: "localthink"
kind: conversation
status: active
visibility: private
---

## Conversation

**Human:** What am I really trying to figure out?

**AI:** It sounds like you are trying to separate the surface problem from the deeper question underneath it.
```

That is already a valid LocalThink Format document.

---

## Required Fields

Only four frontmatter fields are required:

| Field | Meaning |
| --- | --- |
| `localthink` | Format version, currently `"1.0"` |
| `created` | Creation date or datetime |
| `platform` | AI platform name, lowercase |
| `language` | Primary language, BCP 47 format |

Everything else is optional.

See [SPEC.md](./SPEC.md) for the complete v1.0 specification.

---

## File Naming

Recommended:

```text
short-title-slug.ltf.md
```

Examples:

```text
ltf-v1-design.ltf.md
local-first-memory.ltf.md
ai-sovereignty-manifesto.ltf.md
```

Date prefixes are not recommended. LTF documents can be appended and updated over time, so time belongs in metadata:

```yaml
created: 2026-05-18T10:30:00-04:00
updated: 2026-05-19T09:20:00-04:00
```

---

## Repository Structure

```text
localthink-format/
├── README.md
├── SPEC.md
├── CONTRIBUTING.md
├── LICENSE
├── examples/
│   ├── minimal.ltf.md
│   ├── full.ltf.md
│   └── extended-discussion.ltf.md
└── skills/
    ├── localthink-builder/
    │   └── SKILL.md
    └── localthink-validator/
        └── SKILL.md
```

---

## Official Skills

This repository starts with two official skills:

### `localthink-builder`

Generates a valid LTF 1.0 markdown document from a human-AI conversation, transcript, notes, or dialogue summary.

Use it when you want to create an LTF file from a conversation.

Example prompts:

```text
Please save this conversation as a LocalThink Format file.
```

```text
Please convert these notes into an LTF 1.0 document.
```

```text
Please generate a private LTF file for the LocalThink project from this transcript.
```

The builder should:

- generate `created`
- update `updated` when appending to an existing document
- use `.ltf.md` as the recommended filename extension
- set `visibility: private` unless public sharing is requested
- include `project` and `project_id` when they are known
- preserve the real conversation when available

### `localthink-validator`

Reviews an LTF markdown document for spec compliance, metadata quality, body structure, and privacy risk.

Use it when you want to check or repair an LTF file.

Example prompts:

```text
Please check whether this file is valid LTF 1.0.
```

```text
Please validate this LTF file before I publish it.
```

```text
Please fix this document so it conforms to LocalThink Format 1.0.
```

The validator should check:

- required fields: `localthink`, `created`, `platform`, `language`
- recommended filename extension: `.ltf.md`
- project metadata quality when present
- append/update consistency between `updated` and the document body
- privacy risks before public or unlisted sharing

These skills are intentionally text-first. LTF is meant to be maintained by humans and AI together, not only by deterministic scripts.

Deterministic tools may be added later when the format stabilizes further.

---

## How To Use The Skills

Each skill is a folder containing a `SKILL.md` file:

```text
skills/localthink-builder/SKILL.md
skills/localthink-validator/SKILL.md
```

Use them in any AI agent or chatbot environment that supports skill-style instructions. The simplest workflow is:

1. Add or install the skill folder in your agent environment.
2. Start or paste a conversation.
3. Ask the agent to use the relevant LocalThink skill.
4. Save the generated output as a `.ltf.md` file.

### Builder Workflow

Use `localthink-builder` at the end of a meaningful conversation.

Input:

- current conversation
- raw transcript
- notes from a conversation
- exported chatbot text

Output:

- one complete LTF 1.0 markdown document
- recommended filename: `short-title-slug.ltf.md`

Example:

```text
Use localthink-builder to turn this conversation into a private LTF 1.0 file for the LocalThink project.
```

When appending to an existing LTF file, give the existing file content to the agent and ask:

```text
Use localthink-builder to append this new session to the existing LTF document and update the updated field.
```

### Validator Workflow

Use `localthink-validator` before importing, publishing, or sharing an LTF file.

Input:

- an LTF markdown file
- a draft LTF document
- a file converted from another source

Output:

- validation status
- errors, warnings, and suggestions
- optional repaired LTF document

Example:

```text
Use localthink-validator to check this file against LTF 1.0 and tell me what must be fixed.
```

For repair:

```text
Use localthink-validator to repair this document with the smallest possible changes.
```

---

## Brand And Technical Naming

- **LocalThink** is the brand and ecosystem name.
- **LocalThink Format** or **LTF** is this open standard.
- `localthink` is the technical identifier used in frontmatter, file paths, packages, and command names.

Example:

```yaml
localthink: "1.0"
```

---

## License

LocalThink Format is released under [CC0 1.0](./LICENSE).

This means the specification is dedicated to the public domain as much as legally possible. Anyone can use it, implement it, extend it, translate it, or build products on it without permission.
