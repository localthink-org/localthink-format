# LocalThink Format Specification v1.0

**Open standard for living human-AI thought documents**

Status: `1.0`  
Identifier: `localthink`  
Recommended file type: Markdown (`.ltf.md`)  
Allowed file type: Markdown (`.md`)  
License: CC0 1.0

---

## 1. Overview

LocalThink Format (LTF) is a markdown-based format for living human-AI thought documents.

An LTF document is a normal markdown file with YAML frontmatter at the top. The frontmatter stores metadata. The body stores the conversation and any extension notes in readable markdown.

LTF is designed for:

- personal AI conversation libraries
- local-first AI memory systems
- cross-platform conversation export
- living documents that can be appended and updated
- public conversation examples
- multi-person discussion built from a seed conversation
- tools that search, validate, summarize, connect, or extend AI conversations

The format is intentionally simple. A valid document should remain useful even if no tool is available.

---

## 2. File Structure

An LTF document consists of two parts:

1. **Frontmatter**: YAML metadata wrapped by `---`
2. **Body**: standard markdown content

```markdown
---
[frontmatter]
---

[body]
```

The file extension SHOULD be `.ltf.md`.

The file extension MAY be `.md` for maximum compatibility with existing markdown tools.

---

## 3. Frontmatter

### 3.1 Required Fields

| Field | Type | Description |
| --- | --- | --- |
| `localthink` | string | Format version. For this version, MUST be `"1.0"`. The value is a string so YAML parsers do not coerce it into a number. |
| `created` | date or datetime string | Document creation date or datetime. Use `YYYY-MM-DD` or ISO 8601 datetime. |
| `platform` | string | AI platform or host application name, lowercase. |
| `language` | string | Primary conversation language in BCP 47 format, such as `en`, `zh-TW`, `zh-CN`, `ja`, `fr`, or `de`. |

### 3.2 Recommended Optional Fields

| Field | Type | Description |
| --- | --- | --- |
| `title` | string | Human-readable conversation title. |
| `updated` | date or datetime string | Last meaningful update, append, or extension time. Use `YYYY-MM-DD` or ISO 8601 datetime. |
| `project` | string | Human-readable project name. |
| `project_id` | string | Stable project slug for apps and tools. |
| `kind` | string | Document kind. Recommended values: `conversation`, `summary`, `extraction`, `extension`, `discussion`, `note`. |
| `status` | string | Document state. Recommended values: `active`, `paused`, `finished`, `archived`. |
| `source` | string | How the document was created. Recommended values: `manual`, `chatbot`, `export`, `builder`, `import`. |
| `model` | string | AI model name or version, if known. |
| `tags` | list of strings | Main topics, concepts, or project labels. |
| `visibility` | string | One of `public`, `unlisted`, or `private`. Default: `private`. |
| `summary` | string | Short summary of the conversation journey and conclusions. |
| `insights` | list of strings | Key insights produced or clarified by the conversation. |
| `open_questions` | list of strings | Important unresolved questions. |
| `participants` | list of objects | Participants in the conversation. |
| `parent` | string or object | Conversation this document extends from. |
| `related` | list of strings or objects | Related conversations or references. |

### 3.3 Custom Fields

Applications MAY add custom fields.

Custom fields SHOULD use the `x_` prefix to avoid collisions with future standard fields.

```yaml
x_app_version: "1.2.0"
x_local_embedding_model: "nomic-embed-text"
```

Parsers MUST ignore unknown fields.

---

## 4. Field Details

### 4.1 `localthink`

Required.

```yaml
localthink: "1.0"
```

The value MUST be a quoted string for v1.0.

### 4.2 `created`

Required.

```yaml
created: 2026-05-18
```

or:

```yaml
created: 2026-05-18T10:30:00-04:00
```

`created` represents when the LTF document, thought thread, or initial conversation was created.

The value MAY be a simple date (`YYYY-MM-DD`) for hand-written documents or an ISO 8601 datetime when precise time is useful.

### 4.3 `updated`

Optional, but recommended for documents that are appended, revised, or extended.

```yaml
updated: 2026-05-19T09:20:00-04:00
```

`updated` represents the last meaningful update time. LocalThink-compatible apps SHOULD sort by `updated` when present, then `created`.

When appending a new session or extended discussion to an existing LTF document, update `updated` instead of changing the filename.

### 4.4 `project` and `project_id`

Optional, but recommended for LocalThink App and other library tools.

```yaml
project: "LocalThink"
project_id: "localthink"
```

`project` is the human-readable project name.

`project_id` is a stable lowercase slug for tools and apps. It SHOULD use lowercase letters, numbers, and hyphens.

When grouping documents, apps SHOULD prefer:

1. `project_id`
2. `project`
3. parent folder
4. unfiled

### 4.5 `kind`

Optional. Recommended default: `conversation`.

Recommended values:

| Value | Meaning |
| --- | --- |
| `conversation` | A primary human-AI conversation or living thread. |
| `summary` | A summary of one or more conversations. |
| `extraction` | Extracted insights, questions, or structured outputs. |
| `extension` | A continuation or response to another LTF document. |
| `discussion` | Multi-person or public discussion around a seed document. |
| `note` | A thought note or manually written document with LTF metadata. |

### 4.6 `status`

Optional. Recommended default: `active`.

Recommended values:

| Value | Meaning |
| --- | --- |
| `active` | Still open for future thinking or append. |
| `paused` | Temporarily inactive. |
| `finished` | Considered complete for now. |
| `archived` | Preserved but no longer active. |

### 4.7 `source`

Optional.

Recommended values:

| Value | Meaning |
| --- | --- |
| `manual` | Written or assembled manually. |
| `chatbot` | Produced directly by a chatbot. |
| `export` | Converted from a platform export. |
| `builder` | Generated by LTF Builder or another compatible builder workflow. |
| `import` | Imported from another system. |

### 4.8 `platform`

Required.

Use the lowercase platform name. Spaces SHOULD be replaced with hyphens.

Common values:

| Value | Platform |
| --- | --- |
| `chatgpt` | OpenAI ChatGPT |
| `claude` | Anthropic Claude |
| `gemini` | Google Gemini |
| `grok` | xAI Grok |
| `perplexity` | Perplexity |
| `cursor` | Cursor |
| `codex` | OpenAI Codex |
| `other` | Other or unknown |

For unlisted platforms, use a stable lowercase slug:

```yaml
platform: deepseek
platform: qwen
platform: mistral-le-chat
```

### 4.9 `language`

Required.

Use BCP 47 language tags:

```yaml
language: en
language: zh-TW
language: zh-CN
language: ja
```

If a conversation mixes languages, use the primary language and optionally add:

```yaml
x_secondary_languages: [en, zh-TW]
```

### 4.10 `visibility`

Optional. Default: `private`.

Allowed values:

| Value | Meaning |
| --- | --- |
| `private` | Personal document. Not intended for public sharing. |
| `unlisted` | Shareable by link or direct access, but not meant for indexing or public listing. |
| `public` | Intended for public examples, publishing, or community discussion. |

Visibility is advisory metadata. Tools SHOULD respect it, but the file system or publishing platform ultimately controls access.

### 4.11 `participants`

Optional.

Recommended structure:

```yaml
participants:
  - role: human
    id: thinker
  - role: ai
    platform: claude
    model: claude-sonnet-4-6
```

Allowed `role` values in v1.0:

- `human`
- `ai`
- `system`
- `tool`
- `other`

The `id` field SHOULD be anonymous or user-controlled when publishing.

### 4.12 `parent`

Optional.

Use `parent` when this document is a continuation, translation, response, fork, or extension of another LTF document.

Simple form:

```yaml
parent: ./original-conversation.ltf.md
```

Object form:

```yaml
parent:
  type: continuation
  href: ./original-conversation.ltf.md
  title: "Original conversation"
```

Recommended `type` values:

- `continuation`
- `translation`
- `response`
- `fork`
- `summary`
- `extraction`

### 4.13 `related`

Optional.

Simple form:

```yaml
related:
  - ./related-topic.ltf.md
  - https://example.com/reference
```

Object form:

```yaml
related:
  - type: reference
    href: https://example.com/article
    title: "Reference article"
  - type: sibling
    href: ./parallel-discussion.ltf.md
```

---

## 5. Body

### 5.1 Conversation Section

The main conversation SHOULD begin with:

```markdown
## Conversation
```

For Chinese documents, `## 對話記錄` is also acceptable.

Speaker turns SHOULD use bold speaker labels:

```markdown
**Human:** Question or message

**AI:** Response
```

For Chinese documents:

```markdown
**Human:** 問題

**AI:** 回應
```

The speaker labels `Human` and `AI` are recommended for cross-language consistency. Tools MAY support translated labels, but SHOULD NOT require them.

### 5.2 System And Tool Messages

When needed:

```markdown
**System:** Instruction or context

**Tool:** Tool result or external output
```

Tool output SHOULD be summarized when the raw output is too long or contains private information.

### 5.3 Key Turning Points

Important turns MAY be marked with headings:

```markdown
### Key Turning Point: The Question Changes
```

For Chinese documents:

```markdown
### 關鍵轉折：問題改變了
```

These markers are optional and exist to help humans and tools locate meaningful shifts.

### 5.4 Insights In Body

If an insight is especially important, it MAY be marked near the relevant conversation turn:

```markdown
### Insight: Memory is part of thinking
```

The frontmatter `insights` field should contain the concise extracted list. The body may preserve richer context.

### 5.5 Appended Sessions

LTF documents may grow over time. When appending a later conversation to the same thought thread, use session headings in the body and update the frontmatter `updated` value.

Do not add `sessions` metadata in v1.0. Keep session structure readable in markdown.

```markdown
## Conversation

### Session: 2026-05-18T10:30:00-04:00

**Human:** Opening question

**AI:** Initial response

---

### Session: 2026-05-19T09:20:00-04:00

**Human:** Follow-up after new information

**AI:** Continued response
```

### 5.6 Extended Discussion

When an LTF document becomes a seed for later discussion, extensions SHOULD be appended after the main conversation:

```markdown
---

## Extended Discussion

### Contributor: thinker-a | 2026-05-18

**Question or perspective:**
I want to challenge the assumption that local-first always means offline-first.

**AI Response:**
That distinction matters. Local-first means user ownership and control; offline-first is one possible implementation choice.
```

Extended discussion blocks SHOULD preserve contributor boundaries.

---

## 6. Complete Example

```markdown
---
localthink: "1.0"
title: "On Owning AI Conversations"
created: 2026-05-18T10:30:00-04:00
updated: 2026-05-18T14:50:00-04:00
platform: chatgpt
model: gpt-5
language: en
project: "LocalThink"
project_id: "localthink"
kind: conversation
status: active
source: builder
tags: [LocalThink, AI sovereignty, memory, markdown]
visibility: public
summary: "This conversation explores why AI conversations should be saved as portable local files instead of remaining locked inside closed platforms."
insights:
  - "AI conversations become more valuable when they can accumulate as long-term memory."
  - "Open markdown files make conversation records readable without depending on any single platform."
open_questions:
  - "How should private and public sections coexist in one conversation record?"
participants:
  - role: human
    id: thinker
  - role: ai
    platform: chatgpt
    model: gpt-5
---

## Conversation

### Session: 2026-05-18T10:30:00-04:00

**Human:** Why should I save my AI conversations?

**AI:** Because the conversation is not just output. It is part of your thinking process.

### Key Turning Point: From chat log to thought asset

**Human:** So the real issue is ownership of thinking?

**AI:** Yes. A saved conversation can become memory, context, evidence, and a seed for future work.

---

### Session: 2026-05-18T14:50:00-04:00

**Human:** If I append to this file later, should the filename change?

**AI:** No. Keep the filename stable and update `updated`. The file is a living thought document, not a one-time archive.
```

---

## 7. File Naming

Recommended file extension:

```text
.ltf.md
```

Allowed file extension:

```text
.md
```

Recommended naming convention:

```text
short-title-slug.ltf.md
```

Examples:

```text
owning-ai-conversations.ltf.md
local-first-memory.ltf.md
ltf-v1-design.ltf.md
```

Rules:

- use lowercase words
- separate words with hyphens
- keep the slug short, ideally 3 to 8 words
- keep the filename stable as the document evolves

Date prefixes are not recommended. LTF documents can be appended and updated over time, so time belongs in metadata:

```yaml
created: 2026-05-18T10:30:00-04:00
updated: 2026-05-19T09:20:00-04:00
```

---

## 8. Parser Guidelines

An LTF v1.0 parser SHOULD:

1. Read YAML frontmatter.
2. Confirm the `localthink` field exists.
3. Confirm the version is compatible with `"1.0"`.
4. Validate required fields: `created`, `platform`, and `language`.
5. Parse optional fields when recognized.
6. Ignore unknown fields.
7. Treat the body as standard markdown.

An LTF parser SHOULD NOT:

- require optional fields
- reject unknown `x_` fields
- require a specific model provider
- require English body text
- alter private content without explicit user action
- require a date prefix in the filename
- require `sessions` metadata

---

## 9. Compatibility

LTF v1.0 follows these compatibility rules:

- Future minor-compatible tools SHOULD continue to read v1.0 documents.
- Unknown fields MUST be ignored by parsers.
- New standard fields SHOULD NOT redefine existing field meanings.
- Custom fields SHOULD use `x_`.
- Body markdown SHOULD remain valid even when tools do not understand special sections.

---

## 10. Design Principles

**Human-readable first**  
The document should be useful in any markdown editor.

**Local-first**  
The format assumes the thinker can keep their own files.

**Minimal required metadata**  
Only four fields are required.

**Platform neutral**  
The format does not depend on any AI provider.

**Extensible**  
Apps, communities, and future tools can add metadata without breaking the core format.

**Conversation as thought asset**  
An AI conversation is not only a transcript. It can be a record of thinking, discovery, disagreement, and growth.

**Living document model**  
An LTF document can be appended and updated. `created` marks the beginning; `updated` marks the latest meaningful change.

---

## 11. Version History

| Version | Date | Notes |
| --- | --- | --- |
| 1.0 | 2026-05-18 | First repository version of LocalThink Format. |

---

## 12. License

LocalThink Format v1.0 is released under CC0 1.0.
