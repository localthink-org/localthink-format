# LocalThink Format

**LocalThink Format (LTF) is an open standard for saving AI conversations as portable, readable files.**

Your AI thinking should not disappear into closed chat interfaces. It should live in files you can read, move, search, back up, publish, and build tools on.

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

## Create LTF Files

The fastest way to create an LTF file is with **LTF Builder**.

LTF Builder is a Chrome plugin that captures conversations from supported AI platforms and exports them as clean `.ltf.md` files.

No signup. No cloud. No AI generation. It reads the rendered page and converts conversations into readable markdown, with code blocks, tables, and lists preserved.

**What it captures:**
- Full conversation turns with speaker labels
- Code blocks, lists, tables, and links with original structure
- Capture diagnostics in the frontmatter

**Install:**
1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `localthink-builder` folder
5. Open a ChatGPT, Claude, or Gemini conversation
6. Click LTF Builder, then export the conversation as `.ltf.md`

See [localthink-builder](https://github.com/localthink-org/localthink-builder) for the full source.

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

You can write this by hand, export it from your browser with LTF Builder, or generate it from a transcript with any AI assistant that understands the format.

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
```

Tooling lives in separate repositories, starting with [localthink-builder](https://github.com/localthink-org/localthink-builder).

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
