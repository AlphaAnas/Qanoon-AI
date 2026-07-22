/**
 * Formats raw markdown to produce clean, professional output similar to DOCX quality.
 * Removes AI-generated artifacts and ensures consistent legal document formatting.
 */

export function formatToDocxQuality(markdown: string): string {
  let result = markdown

  // Step 1: Normalize line endings to \n
  result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Step 2: Remove excessive horizontal rules (---)
  // Keep only one --- between major sections, remove consecutive ones
  result = result.replace(/^---+$/gm, '\n')

  // Step 3: Clean up excessive blank lines
  // Replace 3+ newlines with 2 (one blank line between paragraphs)
  result = result.replace(/\n{3,}/g, '\n\n')

  // Step 4: Ensure consistent spacing after headings
  // Headings should have exactly one blank line after them
  result = result.replace(/^(#{1,6}.*?)\n+/gm, '$1\n\n')

  // Step 5: Clean up trailing whitespace
  result = result.replace(/[ \t]+$/gm, '')

  // Step 6: Normalize bullet list spacing
  result = result.replace(/(- \[ \]|\* |- )\n+/g, '$1\n')

  // Step 7: Remove empty lines at start and end
  result = result.trim()


  return result
}
