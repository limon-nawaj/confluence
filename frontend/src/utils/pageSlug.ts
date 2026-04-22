import type { Page } from '@/types/models'

/**
 * Slugify a single page title for use in URLs.
 * "Child 1.1" → "child-1.1"   (dots kept — they're valid and readable)
 * "Q&A / FAQ" → "q-a-faq"
 */
export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9.\-]+/g, '-') // non-slug chars → dash
      .replace(/-+/g, '-')             // collapse runs
      .replace(/^-+|-+$/g, '')         // trim edges
    || 'untitled'
  )
}

/**
 * Build a URL segment for a page that is always unique:
 * "{id}-{slug}"  e.g. "42-child-1"
 * This ensures two pages with the same title never share a URL.
 */
export function pageSegment(id: number, title: string): string {
  return `${id}-${slugifyTitle(title)}`
}

/**
 * Build the full path segments for a page by walking the tree.
 * Each segment is "{id}-{slug}" so pages with identical titles are always unique.
 * e.g. ["42-parent-page-1", "7-child-1", "11-child-1"]
 */
export function buildPagePath(pages: Page[], targetId: number): string[] {
  function search(nodes: Page[], path: string[]): string[] | null {
    for (const node of nodes) {
      const next = [...path, pageSegment(node.id, node.title)]
      if (node.id === targetId) return next
      if (node.children?.length) {
        const found = search(node.children, next)
        if (found) return found
      }
    }
    return null
  }
  return search(pages, []) ?? []
}

/**
 * Build the full page URL path string (without /spaces/:key prefix).
 * e.g. "42-parent-page-1/7-child-1/11-child-1"
 */
export function pagePathUrl(pages: Page[], targetId: number): string {
  const segments = buildPagePath(pages, targetId)
  return segments.join('/') || String(targetId)
}

/**
 * Find a page in the tree by matching URL path segments.
 * Each segment is "{id}-{slug}" — we match on the numeric ID prefix only,
 * so the URL remains valid even if the title changes.
 */
export function findPageByPath(pages: Page[], segments: string[]): Page | null {
  if (!segments.length) return null

  const [head, ...rest] = segments
  const headId = parseInt(head, 10)

  for (const page of pages) {
    if (page.id === headId) {
      if (rest.length === 0) return page
      if (page.children?.length) {
        const found = findPageByPath(page.children, rest)
        if (found) return found
      }
    }
  }
  return null
}

/**
 * Legacy: extract numeric ID from old-style "42-some-title" slugs.
 * Used only for backwards-compat if someone visits an old URL.
 */
export function pageIdFromSlug(slug: string): number | null {
  const n = parseInt(slug, 10)
  return isNaN(n) ? null : n
}
