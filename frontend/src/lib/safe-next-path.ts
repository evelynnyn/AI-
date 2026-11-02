/** Only allow redirects back into this site, never to another origin. */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/readings",
): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return fallback;
  }
  return next;
}
