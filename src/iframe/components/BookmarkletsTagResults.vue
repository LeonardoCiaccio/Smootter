<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { GlobeAltIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { ensureFavicon, type StoredBookmarklet, type StoredCategory } from '@/shared/bookmarkletsDb'
import { hostnameOf } from '@/shared/url'

const props = defineProps<{
  tag: string
  bookmarklets: StoredBookmarklet[]
  categories: StoredCategory[]
}>()
const emit = defineEmits<{ select: [id: string] }>()

const headerText = computed(() => chrome.i18n.getMessage('bookmarkletsTagResultsHeader', [props.tag]))

function categoryName(categoryId: string): string {
  return props.categories.find((category) => category.id === categoryId)?.name ?? ''
}

function otherTags(bookmarklet: StoredBookmarklet): string[] {
  return bookmarklet.tags.filter((tag) => tag !== props.tag)
}

// Grouped visually by category, alphabetical within it — a scannable, ordered record list.
const sorted = computed(() =>
  [...props.bookmarklets].sort((a, b) => {
    const categoryCompare = categoryName(a.categoryId).localeCompare(categoryName(b.categoryId))
    return categoryCompare !== 0 ? categoryCompare : a.title.localeCompare(b.title)
  }),
)

// Cache-only lookup (no liveFaviconUrl) — these are arbitrary saved pages, not the live tab.
const faviconsByDomain = ref<Record<string, string>>({})

watch(
  () => props.bookmarklets,
  async (list) => {
    const domains = [...new Set(list.map((bookmarklet) => hostnameOf(bookmarklet.url)).filter((domain) => domain !== ''))]
    const missing = domains.filter((domain) => !(domain in faviconsByDomain.value))
    if (missing.length === 0) return

    const entries = await Promise.all(missing.map(async (domain) => [domain, await ensureFavicon(domain)] as const))
    const next = { ...faviconsByDomain.value }
    for (const [domain, dataUrl] of entries) {
      if (dataUrl) next[domain] = dataUrl
    }
    faviconsByDomain.value = next
  },
  { immediate: true },
)

function faviconFor(url: string): string | undefined {
  return faviconsByDomain.value[hostnameOf(url)]
}
</script>

<template>
  <div>
    <h1 :class="ui.bookmarkletsTagResultsHeader">{{ headerText }}</h1>

    <div :class="ui.bookmarkletsTagResultsList">
      <div
        v-for="bookmarklet in sorted"
        :key="bookmarklet.id"
        :class="ui.bookmarkletsTagResultRecord"
        @click="emit('select', bookmarklet.id)"
      >
        <span :class="ui.bookmarkletsTagResultCategory">{{ categoryName(bookmarklet.categoryId) }}</span>

        <div :class="ui.bookmarkletsTagResultTitleRow">
          <img
            v-if="faviconFor(bookmarklet.url)"
            :src="faviconFor(bookmarklet.url)"
            :class="ui.bookmarkletsSidebarItemFavicon"
            alt=""
          />
          <GlobeAltIcon v-else :class="ui.bookmarkletsSidebarItemFaviconFallback" />
          <span :class="ui.bookmarkletsTagResultTitle">{{ bookmarklet.title }}</span>
        </div>

        <p v-if="bookmarklet.description" :class="ui.bookmarkletsTagResultDescription">
          {{ bookmarklet.description }}
        </p>

        <div v-if="otherTags(bookmarklet).length > 0" :class="ui.bookmarkletsTagResultTags">
          <span v-for="otherTag in otherTags(bookmarklet)" :key="otherTag" :class="ui.tagChip">{{ otherTag }}</span>
        </div>

        <a
          :href="bookmarklet.url"
          target="_blank"
          rel="noopener noreferrer"
          :class="ui.bookmarkletDetailLink"
          @click.stop
        >
          {{ bookmarklet.url }}
        </a>
      </div>
    </div>
  </div>
</template>
