# Replacer

Replacer is Smootter's text-expansion engine. You save short trigger words
("placeholders"), and typing one anywhere on the web — Gmail, Slack, a form field,
any `<input>`, `<textarea>`, or `contenteditable` box — expands it into the text you
saved. Static placeholders are free and work with no configuration. Placeholders
starting with `/ai-` go further: they send what you just wrote to your own AI model
and get a live rewrite back, right where you're typing.

## Turning it on

Replacer is one of the optional "Smootters" — always-on page services, off by
default. Enable it from **Options → Smootters → Replacer**. Nothing runs on any
page until you do.

## Static placeholders

A static replacer has three parts:

- **Placeholder** — the trigger word, e.g. `/name`. Must start with `/`. Matching is
  case-insensitive (`/Name` and `/name` are the same trigger).
- **Text** — exactly what gets typed in its place.
- **Title, tags, category** — for organizing your own list; they don't affect
  expansion.

**To use it:** in any text field, type the placeholder, then press <kbd>Space</kbd>.
The placeholder (and the space) is replaced by the saved text, followed by a space,
cursor positioned right after it.

Example: save `/name` → `Smootter`. Type `Hi, my name is /name` + Space in any
field, and it becomes `Hi, my name is Smootter `.

Good uses: your own contact details, canned replies, addresses, signatures, common
corrections, anything you type more than a couple of times a week.

## AI placeholders (`/ai-…`)

An AI replacer looks like a static one, but works differently:

- **Placeholder** must start with `/ai-`, e.g. `/ai-formally`.
- **Text** is not what gets inserted — it's the **instruction** your AI model
  follows, e.g. *"Rewrite in a formal tone, in English, in no more than 50 words."*

**To use it:** write the text you want transformed **first**, directly in the
field, then type the placeholder and press <kbd>Space</kbd>.

Example: save `/ai-formally` → `Rewrite in a formal tone, in English, in no more
than 50 words.` Then, in an email you're writing:

```
I don't like what you said and what you're doing /ai-formally
```

Type that and press Space. Everything before the placeholder (`I don't like what
you said and what you're doing`) is sent to your configured LLM together with the
instruction. While it's working, you'll briefly see `[AI...]` in place of your
text; when the response comes back, both the original text and the marker are
replaced by the rewritten result.

**This needs an LLM configured first** (Options → LLM). Smootter is
bring-your-own-key: nothing is sent anywhere until you configure your own
OpenAI-compatible endpoint. If you use an `/ai-` placeholder before configuring
one, Replacer inserts a short message telling you so, in your browser's language,
instead of silently doing nothing.

Good uses: tone/language rewrites, summarizing what you just wrote, translating,
fixing grammar, turning a rough note into a polished paragraph — anything you'd
normally copy-paste into a chat window and back.

## Where it works

Any editable field on any page: plain `<input>`/`<textarea>` elements and rich-text
`contenteditable` areas (Gmail's compose box, Slack, WhatsApp Web, and similar).
The trigger is always the same: type the placeholder, then a space.

## Formatting (Markdown)

The text of a replacer (static or the AI's reply) can use Markdown — `**bold**`,
`*italic*`, `` `code` ``, `[links](https://…)`, and so on.

Whether it actually *renders* depends on where you use it:

- In a **rich-text field** (Gmail's compose box, Slack, WhatsApp Web — anything
  that isn't a plain `<input>`/`<textarea>`), Markdown is rendered inline: your
  `**bold**` becomes real bold text.
- In a **plain `<input>` or `<textarea>`**, there's no rich text to render into —
  those fields only ever hold plain characters, so the Markdown syntax itself
  (the asterisks, backticks, etc.) is inserted as literal text, unrendered.

If you're writing a replacer meant for a plain field (a search box, a simple form),
skip Markdown syntax entirely; it'll just show up as stray punctuation. Save it for
replacers you use in rich-text compose boxes.

## Organizing your replacers

- **Tags** — free-form, searchable, shown as chips.
- **Categories** — free-text with autocomplete; type `Parent/Child` to nest one
  under another (e.g. `Ai/Rewrite`). A category is only created when you save the
  form, so an abandoned or half-typed one is never persisted.
- **Search** — full text and AI-assisted search across your saved replacers, from
  the Replacer sidebar.

## Backing them up

Export/import works the same way as the rest of Smootter (toolbar buttons, or from
**Options**): replacers travel as plain JSON, matched by placeholder on import, so
re-importing an updated file updates existing entries instead of duplicating them.

## Try it

Smootter ships with two example replacers on first install so you have something
to try immediately: `/name` (static) and `/ai-formally` (AI-powered). Open any text
field, type one, press space, and see what happens — then edit or delete them once
you're comfortable, exactly like any replacer you create yourself.
