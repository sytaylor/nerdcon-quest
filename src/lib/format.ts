/** Format time string: "09:00:00" → "09:00", "09:00" → "09:00" */
export function fmtTime(t: string): string {
  const parts = t.split(':')
  return `${parts[0]}:${parts[1]}`
}
