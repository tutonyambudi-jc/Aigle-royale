/** Référence lisible type P-A1B2C3D4 */
export function generateSupportReference(): string {
  const part = Math.random().toString(36).slice(2, 10).toUpperCase()
  return `P-${part}`
}
