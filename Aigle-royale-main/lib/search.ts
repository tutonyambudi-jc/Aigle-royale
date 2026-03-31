export function normalizeSearchText(input: unknown): string {
  const s = typeof input === 'string' ? input : ''
  // Normalize accents + trim + collapse spaces + lowercase
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

