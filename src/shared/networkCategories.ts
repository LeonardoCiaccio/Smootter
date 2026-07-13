/**
 * networkCategories — the fixed, system-defined sidebar buckets for NetworkView. Not user
 * configurable, not stored in preferences, not exported/imported: just a curated constant.
 */

export interface MimeTypeEntry {
  /** Substring matched against the response's content-type (case-insensitive, "includes"). */
  mime: string
  /**
   * File extensions known for this specific mimetype — search aliases only, never used for
   * classification (that's `mime` above, matched against the real content-type header). Can be
   * empty for a broad prefix that implies no single extension (e.g. "video/" itself), and the
   * same extension can legitimately appear under more than one mime entry (e.g. "ts" for both
   * video/mp2t segments and the old x-mpegurl playlists some servers mislabel that way).
   */
  extensions: string[]
}

export interface MimeCategoryRule {
  name: string
  mimeTypes: MimeTypeEntry[]
}

// Order matters — first match wins. More specific/narrow rules (e.g. Video's "f4m+xml", which
// would otherwise also satisfy the broad XML rule below) are listed before the broad generic
// ones they could collide with.
export const NETWORK_MIME_CATEGORIES: MimeCategoryRule[] = [
  { name: 'HTML', mimeTypes: [{ mime: 'text/html', extensions: ['html', 'htm'] }] },
  { name: 'CSS', mimeTypes: [{ mime: 'text/css', extensions: ['css'] }] },
  { name: 'JavaScript', mimeTypes: [{ mime: 'javascript', extensions: ['js', 'mjs', 'cjs'] }] },
  {
    name: 'Images',
    mimeTypes: [
      { mime: 'image/', extensions: [] },
      { mime: 'image/jpeg', extensions: ['jpg', 'jpeg'] },
      { mime: 'image/png', extensions: ['png'] },
      { mime: 'image/gif', extensions: ['gif'] },
      { mime: 'image/webp', extensions: ['webp'] },
      { mime: 'image/avif', extensions: ['avif'] },
      { mime: 'image/svg+xml', extensions: ['svg'] },
      { mime: 'image/x-icon', extensions: ['ico'] },
      { mime: 'image/bmp', extensions: ['bmp'] },
    ],
  },
  // The "video/" prefix and the streaming/legacy container mimes below (which don't carry a
  // video/ prefix at all — HLS playlists, old Flash-based video) both classify as Video; only
  // the specific entries carry extensions, aligned with GrabAnyMedia's own mimetype list.
  {
    name: 'Video',
    mimeTypes: [
      { mime: 'video/', extensions: [] },
      { mime: 'video/mp4', extensions: ['mp4', 'm4v'] },
      { mime: 'video/webm', extensions: ['webm'] },
      { mime: 'video/mp2t', extensions: ['ts'] },
      { mime: 'video/x-matroska', extensions: ['mkv'] },
      { mime: 'video/quicktime', extensions: ['mov'] },
      { mime: 'video/x-msvideo', extensions: ['avi'] },
      { mime: 'video/x-flv', extensions: ['flv'] },
      { mime: 'vnd.apple.mpegurl', extensions: ['m3u8'] },
      { mime: 'x-mpegurl', extensions: ['m3u8', 'ts'] },
      { mime: 'f4m+xml', extensions: ['f4m'] },
      { mime: 'shockwave-flash', extensions: ['swf'] },
      { mime: 'futuresplash', extensions: ['spl'] },
      { mime: 'vnd.rn-realflash', extensions: [] },
    ],
  },
  {
    name: 'Audio',
    mimeTypes: [
      { mime: 'audio/', extensions: [] },
      { mime: 'audio/mpeg', extensions: ['mp3'] },
      { mime: 'audio/wav', extensions: ['wav'] },
      { mime: 'audio/ogg', extensions: ['ogg'] },
      { mime: 'audio/mp4', extensions: ['m4a'] },
      { mime: 'audio/aac', extensions: ['aac'] },
      { mime: 'audio/flac', extensions: ['flac'] },
    ],
  },
  { name: 'PDF', mimeTypes: [{ mime: 'application/pdf', extensions: ['pdf'] }] },
  {
    name: 'Documents',
    mimeTypes: [
      { mime: 'msword', extensions: ['doc'] },
      { mime: 'ms-excel', extensions: ['xls'] },
      { mime: 'ms-powerpoint', extensions: ['ppt'] },
      { mime: 'officedocument.wordprocessingml', extensions: ['docx'] },
      { mime: 'officedocument.spreadsheetml', extensions: ['xlsx'] },
      { mime: 'officedocument.presentationml', extensions: ['pptx'] },
      { mime: 'rtf', extensions: ['rtf'] },
      { mime: 'text/plain', extensions: ['txt'] },
      { mime: 'text/csv', extensions: ['csv'] },
    ],
  },
  {
    name: 'Fonts',
    mimeTypes: [
      { mime: 'font/', extensions: [] },
      { mime: 'font/woff2', extensions: ['woff2'] },
      { mime: 'font/woff', extensions: ['woff'] },
      { mime: 'font/ttf', extensions: ['ttf'] },
      { mime: 'font/otf', extensions: ['otf'] },
      { mime: 'vnd.ms-fontobject', extensions: ['eot'] },
      { mime: 'x-font-ttf', extensions: ['ttf'] },
      { mime: 'x-font-otf', extensions: ['otf'] },
    ],
  },
  { name: 'WebAssembly', mimeTypes: [{ mime: 'application/wasm', extensions: ['wasm'] }] },
  {
    name: 'Archives',
    mimeTypes: [
      { mime: 'zip', extensions: ['zip'] },
      { mime: 'x-rar', extensions: ['rar'] },
      { mime: 'x-7z-compressed', extensions: ['7z'] },
      { mime: 'x-tar', extensions: ['tar'] },
      { mime: 'gzip', extensions: ['gz'] },
    ],
  },
  { name: 'JSON', mimeTypes: [{ mime: 'json', extensions: ['json'] }] },
  { name: 'XML', mimeTypes: [{ mime: 'xml', extensions: ['xml'] }] },
]
