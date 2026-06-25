# Contributing To LocalThink Format

Thank you for your interest in LocalThink Format.

LTF is meant to be a small, durable, human-readable standard. Contributions should make the format clearer, more useful, or easier to adopt without making it heavy.

---

## Ways To Contribute

### 1. Submit Real Examples

The most valuable contribution is a real LTF document that shows how people actually think with AI.

Examples should:

- conform to [SPEC.md](./SPEC.md)
- use `visibility: public`
- remove secrets, private personal data, API keys, and private third-party information
- preserve genuine thinking, not just surface Q&A

### 2. Improve The Specification

Good spec changes usually:

- clarify ambiguous wording
- improve interoperability
- reduce unnecessary complexity
- document real use cases
- preserve backward compatibility

Please avoid adding required fields unless there is a strong reason. LTF should stay easy to create.

### 3. Build Tools

Useful tools include:

- parsers
- deterministic validators
- browser exporters
- chatbot prompts
- LocalThink Format builders
- readers and search interfaces
- converters from ChatGPT, Claude, Gemini, or other exports

LTF Builder lives in the separate [localthink-builder](https://github.com/localthink-org/localthink-builder) repository. Contributions to the Chrome plugin should go there.

Tools should respect `visibility` and avoid uploading private content without explicit user consent.

### 4. Translate Documentation

Translations are welcome. Please preserve technical field names exactly:

- `localthink`
- `created`
- `updated`
- `platform`
- `language`
- `project`
- `project_id`
- `kind`
- `status`
- `source`
- `visibility`
- `summary`
- `insights`
- `open_questions`
- `participants`
- `parent`
- `related`

---

## Design Principles

When proposing a change, keep these principles in mind:

- **Human-readable first**
- **Local-first**
- **Minimal required fields**
- **Platform neutral**
- **Backward compatible**
- **Extensible through custom fields**
- **Private by default**

---

## Public Example Checklist

Before submitting a public example, check:

- [ ] The document has valid frontmatter.
- [ ] `localthink` is `"1.0"`.
- [ ] `created`, `platform`, and `language` are present.
- [ ] `visibility` is `public`.
- [ ] Private names, emails, tokens, credentials, and sensitive details are removed.
- [ ] The conversation is meaningful enough to teach future users what LTF is for.
