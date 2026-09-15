import type { z } from 'zod'

export function flattenZodError(error: z.ZodError): Record<string, string> {
  const details: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form')
    details[field] = issue.message
  }
  return details
}
