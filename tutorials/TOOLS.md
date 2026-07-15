# Tools

Tools are Smootter's core: small pieces of browser automation you describe in
plain language, that an AI turns into real, runnable code, that you test and save.
No programming knowledge required — though if you can code, you can also edit the
generated code directly.

## The five steps

Opening **Tools → Add a tool** walks you through a wizard:

1. **Basics** — a name and a short description. Just for you, to recognize the
   tool later in your list; they don't affect behavior.
2. **Trigger** — when the tool runs:
   - **Page start** — right away, before the page finishes loading.
   - **Page idle** — once the page has fully loaded, e.g. to read its content.
3. **Scope** — where it runs:
   - **Everywhere** — any site you visit.
   - **Specific domain or page** — only where you list, one pattern per line
     (`example.com`, `*.example.com`, `example.com/path`, with or without
     `https://`).
4. **Chat** — describe what you want in the chat panel; the AI writes the code
   into the editor next to it. Keep chatting to refine it ("also handle the case
   where...", "make it only run once", "add a small delay"). You can edit the code
   by hand at any point, in either direction — hand edits don't get overwritten by
   the next chat message, and you can keep chatting about code you wrote yourself.
5. **Test** — runs the code for real, governed by the background worker. "Passed"
   only means it didn't throw an error, not that it's safe or that it does exactly
   what you asked — read the code before saving it, especially anything that reads
   cookies/storage and also sends data over the network, which gets flagged with an
   extra warning.

Once a test passes, **Save** adds it to your Tools list, disabled by default. Flip
it on from the list (or from the last wizard step) once you're happy with it.

## This needs an LLM configured

Code generation happens through your own AI model. Configure one first, in
**Options → LLM** (any OpenAI-compatible endpoint — a local model, a cloud
provider, whatever you choose). Smootter is bring-your-own-key: nothing is sent
anywhere until you use the chat step, and only to the endpoint you configured.

## Writing a good prompt

The more specific, the better the first draft:

- Say **what page or site** it's for, if it matters ("on Gmail's compose window…").
- Say **what should trigger it** in your own words, even though Trigger/Scope are
  separate steps — it helps the model reason about the DOM it's generating for.
- Mention **what to avoid**: "don't touch anything if the field is already
  filled", "only do this once per page load".
- Iterate. Treat the first reply as a draft, not a final answer — tell it what's
  wrong and let it revise, the same way you'd direct a person.

## After saving

- **Enable/disable** any tool from the Tools list without deleting it.
- **Edit** re-opens the same wizard, chat history included, so you can keep
  refining a tool you built days ago.
- **Export/import** (toolbar buttons, or Options) moves your tools as plain JSON —
  useful for backups, or for sharing a tool with someone else.

## Try it

Smootter ships with one example tool on first install: a Gmail template-placeholder
filler, disabled by default. Open it from the Tools list to see a real generated
tool end to end — inspect its code, its trigger, its scope — then enable it, edit
it, or delete it, exactly like any tool you build yourself.
