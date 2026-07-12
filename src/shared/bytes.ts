/** Formats a byte count as a short human-readable size (0 B, 4.2 KB, 1.1 MB, ...). */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent

  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`
}
