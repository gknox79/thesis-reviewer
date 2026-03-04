/**
 * Extract plain text from .docx and .pdf files.
 * Server-side only — uses mammoth (docx) and pdf-parse (pdf).
 */

import mammoth from 'mammoth'

// pdf-parse has no types, import dynamically to avoid build issues
async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return data.text
}

export interface ParseResult {
  text: string
  filename: string
  wordCount: number
  pageEstimate: number
}

const MAX_TEXT_LENGTH = 150_000 // ~100 pages of text
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function parseFile(file: File): Promise<ParseResult> {
  const filename = file.name
  const extension = filename.split('.').pop()?.toLowerCase()

  if (!extension || !['docx', 'pdf'].includes(extension)) {
    throw new Error(
      'Unsupported file type. Please upload a .docx or .pdf file.'
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      'File is too large (max 10 MB). If your thesis is very long, try uploading one chapter at a time.'
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let text: string

  if (extension === 'docx') {
    const result = await mammoth.extractRawText({ buffer })
    text = result.value
  } else {
    text = await parsePdf(buffer)
  }

  // Clean up extracted text
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (text.length === 0) {
    throw new Error(
      'Could not extract any text from the file. Make sure the file contains text (not just images or scanned pages).'
    )
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(
      `The extracted text is very long (${Math.round(text.length / 1000)}K characters). Please upload a single chapter rather than the entire thesis.`
    )
  }

  const wordCount = text.split(/\s+/).length
  const pageEstimate = Math.ceil(wordCount / 300) // ~300 words per page

  return { text, filename, wordCount, pageEstimate }
}
