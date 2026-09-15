export function generateOrderNumber(): string {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `SB-${random}`
}
