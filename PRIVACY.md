# Privacy Policy — Smootter

Smootter is a browser extension you install and run locally. It does not have a
backend server of its own, does not collect analytics, and does not sell or share
data with anyone. This page explains exactly what data the extension touches, where
it stays, and when it ever leaves your device.

## What stays entirely on your device

Stored locally, in the browser's own database (IndexedDB / `chrome.storage`), never
transmitted anywhere by Smootter itself:

- Tools you build (their code, name, description, and trigger rules)
- Saved bookmarklets (links, descriptions, tags, categories)
- Replacer entries (placeholders and their expansion text)
- Chat history
- Your LLM endpoint configuration, including the API key
- Network inspector captures (response headers only, per tab, cleared on navigation
  or tab close — response bodies are never read or stored)

Uninstalling the extension deletes all of it. Nothing is backed up to a server
Smootter controls, because there is no such server.

## What can leave your device, and where

Smootter is **bring-your-own-key**: AI features only work once you configure an
LLM endpoint yourself (any OpenAI-compatible chat-completions API — your own local
model, a cloud provider, whatever you choose). Until you do that, no page content
and no request ever leaves the browser.

Once configured, using an AI feature (generating a tool, AI-powered search,
summarizing an article, an `/ai-` Replacer rewrite, the Chat panel) sends **only to
that endpoint**:

- The current page's URL and title, when relevant to the feature
- The page content you're asking about (e.g. the article being summarized, or the
  text a Replacer entry is rewriting)
- Your conversation with the assistant
- The API key you configured, as an authentication header for that request

This goes to the endpoint **you chose and control** — Smootter has no visibility
into it and no relationship with whatever service is behind it. Review that
provider's own privacy policy for how they handle the request.

## Permissions, and why

| Permission | What it's for |
|---|---|
| `storage` | Local storage for tools, bookmarklets, replacer entries, preferences. |
| `scripting`, `userScripts` | Running the tools you build, and the Resumer/Replacer content scripts you enable — only on pages you visit, never transmitted. |
| `webNavigation` | Knowing when a page starts/finishes loading, to trigger tools and content scripts at the right time. |
| `webRequest` | Powers the Network inspector: reads response headers (never bodies) for the tab you're viewing, kept in memory, cleared on navigation. |
| `contextMenus` | Right-click menu entries. |
| Host permission (`<all_urls>`) | Tools and content scripts are user-authored and can target any site the user chooses; the extension can't know in advance which sites a given tool will run on. |

## Changes to this policy

If this policy changes, the update will be reflected in this same file's history
on GitHub — there is no mailing list or separate changelog for it.

## Contact

Questions: **Leonardo Ciaccio** — leonardo.ciaccio@gmail.com
