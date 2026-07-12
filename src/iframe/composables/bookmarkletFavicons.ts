/**
 * useFaviconCache — cache-only favicon lookup for a reactive bookmarklet list.
 * Never fetches (no liveFaviconUrl passed to ensureFavicon): these are arbitrary
 * saved pages, not the live tab, so it only ever surfaces what's already cached.
 */
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { ensureFavicon, type StoredBookmarklet } from '@/shared/bookmarkletsDb'
import { hostnameOf } from '@/shared/url'

export function useFaviconCache(bookmarklets: Ref<StoredBookmarklet[]> | ComputedRef<StoredBookmarklet[]>) {
  const faviconsByDomain = ref<Record<string, string>>({})

  watch(
    bookmarklets,
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

  const faviconFor = (url: string): string | undefined => faviconsByDomain.value[hostnameOf(url)]

  return { faviconsByDomain: computed(() => faviconsByDomain.value), faviconFor }
}
