# Changelog

All notable changes to Smootter are documented here, one entry per version actually published
to the Chrome Web Store — not per intermediate build. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.7] - 2026-07-29

- Favicons now travel with export/import, so bookmarklets show the right site icon right after
  importing on another install instead of only after revisiting each site.
- Fixed a silent import failure (a `DataCloneError` on saved favicons) that could abort an import
  without any visible error.
- Tools, Bookmarklets, and Replacer views now reliably refresh right after an import completes.

## [0.2.2] - First published release

- Chat rewritten around three explicit responsibilities: answer from context already given,
  answer about the current page, or research the open web — instead of a loose "answer whatever"
  framing that defaulted to guessing.
- Search is now two steps: a result is never cited as a source until it's actually been fetched
  and read, not just seen in a search listing.
- The model can no longer present a URL, price, or other specific fact as real unless it actually
  came from something it fetched in the conversation — enforced mechanically, not just requested.
- Hitting the research-step limit no longer fails the whole exchange: the model summarizes
  whatever it already found instead.
- Live "Fetch: `<url>`" / "Resumer: `<instruction>`" status while the model is working.
- Fixed Resumer's hover icon piling up (one per article) when scrolling quickly through a feed
  like Reddit.
