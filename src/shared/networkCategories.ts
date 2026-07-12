/**
 * networkCategories — the fixed, system-defined sidebar buckets for NetworkView. Not user
 * configurable, not stored in preferences, not exported/imported: just a curated constant.
 */

export interface MimeCategoryRule {
  name: string
  mimeTypes: string[]
}

// Order matters — first match wins. More specific/narrow rules (e.g. Video's "f4m+xml", which
// would otherwise also satisfy the broad XML rule below) are listed before the broad generic
// ones they could collide with.
export const NETWORK_MIME_CATEGORIES: MimeCategoryRule[] = [
  { name: 'HTML', mimeTypes: ['text/html'] },
  { name: 'CSS', mimeTypes: ['text/css'] },
  { name: 'JavaScript', mimeTypes: ['javascript'] },
  { name: 'Images', mimeTypes: ['image/'] },
  // 'video/' catches the standard cases; the rest are streaming/legacy container types that
  // don't carry a video/ prefix (HLS playlists, old Flash-based video) — content, not
  // technique, aligned with GrabAnyMedia's own mimetype list.
  {
    name: 'Video',
    mimeTypes: [
      'video/',
      'vnd.apple.mpegurl',
      'x-mpegurl',
      'f4m+xml',
      'shockwave-flash',
      'futuresplash',
      'vnd.rn-realflash',
    ],
  },
  { name: 'Audio', mimeTypes: ['audio/'] },
  { name: 'PDF', mimeTypes: ['application/pdf'] },
  { name: 'Documents', mimeTypes: ['msword', 'officedocument', 'rtf', 'text/plain', 'text/csv'] },
  { name: 'Fonts', mimeTypes: ['font/', 'font-woff', 'x-font-ttf', 'vnd.ms-fontobject', 'x-font-otf'] },
  { name: 'WebAssembly', mimeTypes: ['application/wasm'] },
  { name: 'Archives', mimeTypes: ['zip', 'x-rar', 'x-7z-compressed', 'x-tar', 'gzip'] },
  { name: 'JSON', mimeTypes: ['json'] },
  { name: 'XML', mimeTypes: ['xml'] },
]
