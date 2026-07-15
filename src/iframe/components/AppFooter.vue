<script setup lang="ts">
import { ui } from '@/styles/ui'
import { PRIVACY_POLICY_URL, PROJECT_URL } from '@/shared/externalLinks'

const manifest = chrome.runtime.getManifest()
const text = `© ${new Date().getFullYear()} ${manifest.name}`
const privacyPolicyLinkText = chrome.i18n.getMessage('privacyPolicyLink')
</script>

<template>
  <div :class="ui.footer">
    <a :href="PROJECT_URL" target="_blank" rel="noopener noreferrer" :class="ui.footerLink">{{ text }}</a>
    ·
    <a :href="PRIVACY_POLICY_URL" target="_blank" rel="noopener noreferrer" :class="ui.footerLink">
      {{ privacyPolicyLinkText }}
    </a>
  </div>
</template>
