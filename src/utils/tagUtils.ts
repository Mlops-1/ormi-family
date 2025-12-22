/**
 * Parse tag string from API response
 * Input: '["휴식", "숙소", "게스트하우스"]'
 * Output: ['휴식', '숙소', '게스트하우스']
 */
export function parseTags(tagString?: string): string[] {
  if (!tagString) return [];

  try {
    // Remove any extra whitespace and parse JSON
    const parsed = JSON.parse(tagString.trim());

    // Ensure it's an array
    if (Array.isArray(parsed)) {
      return parsed.filter((tag): tag is string => typeof tag === 'string');
    }

    return [];
  } catch (error) {
    console.error('Failed to parse tags:', error);
    return [];
  }
}

/**
 * Format tag with # prefix
 */
export function formatTag(tag: string): string {
  return `#${tag}`;
}
