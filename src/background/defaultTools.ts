/**
 * defaultTools — built-in example tools, seeded once on fresh install.
 * Editable and deletable like any other tool; never re-added afterward
 * (seeding only runs on chrome.runtime.onInstalled reason 'install').
 */
import { saveTool, type StoredTool } from '@/shared/toolsDb'

const GMAIL_TEMPLATE_CODE = `(function () {
  'use strict';

  /* =========================================================================
   *  >>> MARKERS — add your plugins here <
   *
   *  Each entry is a plugin:
   *    placeholder : substring of the element's id that flags it as a target
   *    marker      : the literal string to replace inside the text
   *    replace(env): returns the replacement value (or null to leave the marker)
   *                  env = { el, scope, isReply, template, context }
   *
   *  Examples:
   *    { placeholder: 'tpl-user-name', marker: '{{user_name}}',
   *      replace: (env) => env.isReply ? getSenderFromThread() : getRecipientName(env.scope) }
   *    { placeholder: 'tpl-year',      marker: '{{year}}',
   *      replace: () => String(new Date().getFullYear()) }
   *    { placeholder: 'tpl-date',      marker: '{{date}}',
   *      replace: () => new Date().toLocaleDateString() }
   * ========================================================================= */

  const MARKERS = [
    {
      placeholder: 'copiix-user-name',
      marker: '{{user_name}}',
      replace: function (env) {
        // reply -> thread sender; new -> typed recipient
        if (env.isReply) {
          return getSenderFromThread() || getRecipientName(env.scope);
        }
        return getRecipientName(env.scope);
      },
    },
    {
      placeholder: 'copiix-year',
      marker: '{{year}}',
      replace: function () {
        return String(new Date().getFullYear());
      },
    },
  ];

  /* =========================================================================
   *  HELPERS
   * ========================================================================= */

  function toFirstName(raw) {
    if (!raw) return null;
    raw = raw.trim();
    if (raw.indexOf('@') !== -1 && raw.indexOf(' ') === -1) raw = raw.split('@')[0];
    raw = raw.replace(/<[^>]*>/g, '').trim();
    const first = raw.split(/[.\\s_\\-]+/)[0];
    if (!first) return null;
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }

  function getComposeFor(el) {
    return (
      el.closest('div[role="dialog"]') ||
      el.closest('div[aria-label][role="region"]') ||
      el.closest('form') ||
      document.body
    );
  }

  function getMyEmails() {
    const mine = new Set();
    document
      .querySelectorAll('a[aria-label*="@"], [data-email], div[role="button"][aria-label*="@"]')
      .forEach((el) => {
        const m = (el.getAttribute('aria-label') || el.getAttribute('data-email') || '')
          .match(/[\\w.+-]+@[\\w.-]+\\.\\w+/);
        if (m) mine.add(m[0].toLowerCase());
      });
    return mine;
  }

  function getRecipientName(scopeEl) {
    const chip = scopeEl.querySelector('[email], [data-hovercard-id], span[name][data-name]');
    if (chip) {
      const displayName = chip.getAttribute('data-name') || chip.getAttribute('name') || '';
      const email = chip.getAttribute('email') || chip.getAttribute('data-hovercard-id') || '';
      return toFirstName(displayName) || toFirstName(email);
    }
    const input = scopeEl.querySelector(
      'input[aria-label*="Destinatari"], input[aria-label*="recipients" i], textarea[name="to"]'
    );
    if (input && input.value) return toFirstName(input.value);
    return null;
  }

  function getSenderFromThread() {
    const mine = getMyEmails();
    const senders = document.querySelectorAll('.gD, span[email][name]');
    for (let i = senders.length - 1; i >= 0; i--) {
      const el = senders[i];
      const email = (el.getAttribute('email') || '').toLowerCase();
      const name = el.getAttribute('name') || el.textContent || '';
      if (email && mine.has(email)) continue;
      const fromName = toFirstName(name) || toFirstName(email);
      if (fromName) return fromName;
    }
    return null;
  }

  function detectIsReply(scopeEl) {
    const hasThread = document.querySelector('.gD') !== null;
    const hasTypedRecipient = !!getRecipientName(scopeEl);
    return hasThread && !hasTypedRecipient;
  }

  /* =========================================================================
   *  ENGINE
   * ========================================================================= */

  function applyReplace(el, marker, value) {
    if (value == null) return;
    if (!el.hasAttribute('data-copiix-template')) {
      el.setAttribute('data-copiix-template', el.textContent);
    }
    const template = el.getAttribute('data-copiix-template');
    const newText = template.split(marker).join(value);
    if (el.textContent !== newText) el.textContent = newText;
  }

  function scanAll() {
    const context = {};
    MARKERS.forEach((m) => {
      const targets = document.querySelectorAll('[id*="' + m.placeholder + '"]');
      targets.forEach((el) => {
        const scope = getComposeFor(el);
        const template = el.hasAttribute('data-copiix-template')
          ? el.getAttribute('data-copiix-template')
          : el.textContent;

        const value = m.replace({
          el: el,
          scope: scope,
          isReply: detectIsReply(scope),
          template: template,
          context: context,
        });

        applyReplace(el, m.marker, value);
      });
    });
  }

  /* =========================================================================
   *  REACTIVITY
   * ========================================================================= */

  const observer = new MutationObserver(() => {
    if (observer._t) return;
    observer._t = setTimeout(() => {
      observer._t = null;
      scanAll();
    }, 150);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  setInterval(scanAll, 1000);
  scanAll();
})();`

const DEFAULT_TOOLS: Omit<StoredTool, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'default-gmail-template-placeholders',
    name: 'GMAIL',
    description: 'Replaces the {{user_name}} and {{year}} placeholders in your Gmail templates.',
    trigger: 'pageIdle',
    scope: 'domain',
    scopeTargets: 'https://mail.google.com/',
    code: GMAIL_TEMPLATE_CODE,
    enabled: true,
    chatMessages: [],
  },
]

/** Seeds the built-in example tools. Only ever called on a fresh install. */
export async function seedDefaultTools(): Promise<void> {
  const now = Date.now()
  for (const tool of DEFAULT_TOOLS) {
    await saveTool({ ...tool, createdAt: now, updatedAt: now })
  }
}
