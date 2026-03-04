'use client'

import ReactMarkdown from 'react-markdown'
import { generateLogbookEntry, getCriteriaForStage } from '@/lib/logbook'

interface ReviewDisplayProps {
  content: string
  isStreaming: boolean
  metadata: {
    filename: string
    stage: string
    wordCount: number
    pageEstimate: number
  } | null
}

export default function ReviewDisplay({
  content,
  isStreaming,
  metadata,
}: ReviewDisplayProps) {
  if (!content && !isStreaming) return null

  const handleDownloadReview = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `thesis-review-${metadata?.stage || 'draft'}-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadLogbook = () => {
    if (!metadata) return
    const entry = generateLogbookEntry({
      filename: metadata.filename,
      stage: metadata.stage,
      criteriaReviewed: getCriteriaForStage(metadata.stage),
      date: new Date().toISOString().slice(0, 10),
    })
    const blob = new Blob([entry], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-logbook-entry-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex items-center gap-2 mb-4 text-sm text-blue-600">
          <span className="animate-pulse">&#9679;</span>
          Reviewing your chapter...
        </div>
      )}

      {/* Rendered review */}
      <div className="prose prose-slate prose-sm max-w-none">
        <ReactMarkdown
          components={{
            h2: ({ children, ...props }) => {
              const text = String(children)
              // Style special sections differently
              if (text.includes('Priority Actions')) {
                return (
                  <h2
                    className="text-lg font-semibold text-amber-800 border-b border-amber-200 pb-1 mt-8"
                    {...props}
                  >
                    {children}
                  </h2>
                )
              }
              if (text.includes('Questions for Your Supervisor')) {
                return (
                  <h2
                    className="text-lg font-semibold text-blue-800 border-b border-blue-200 pb-1 mt-8"
                    {...props}
                  >
                    {children}
                  </h2>
                )
              }
              if (text.includes('Cross-Check')) {
                return (
                  <h2
                    className="text-lg font-semibold text-purple-800 border-b border-purple-200 pb-1 mt-8"
                    {...props}
                  >
                    {children}
                  </h2>
                )
              }
              return (
                <h2
                  className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-1 mt-8"
                  {...props}
                >
                  {children}
                </h2>
              )
            },
            h3: ({ children, ...props }) => (
              <h3
                className="text-base font-semibold text-slate-700 mt-5"
                {...props}
              >
                {children}
              </h3>
            ),
            strong: ({ children, ...props }) => {
              const text = String(children)
              if (text === 'Strengths') {
                return (
                  <strong className="text-green-700" {...props}>
                    {children}
                  </strong>
                )
              }
              if (
                text === 'Areas for Improvement' ||
                text === 'Concerns'
              ) {
                return (
                  <strong className="text-amber-700" {...props}>
                    {children}
                  </strong>
                )
              }
              if (text === 'Severity' || text.includes('critical') || text.includes('significant')) {
                return (
                  <strong className="text-red-700" {...props}>
                    {children}
                  </strong>
                )
              }
              return <strong {...props}>{children}</strong>
            },
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table
                  className="min-w-full text-sm border-collapse border border-slate-200"
                  {...props}
                >
                  {children}
                </table>
              </div>
            ),
            th: ({ children, ...props }) => (
              <th
                className="border border-slate-200 px-3 py-1.5 bg-slate-50 text-left font-medium"
                {...props}
              >
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td
                className="border border-slate-200 px-3 py-1.5"
                {...props}
              >
                {children}
              </td>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Download buttons (show when review is complete) */}
      {!isStreaming && content && metadata && (
        <div className="flex gap-3 mt-8 pt-4 border-t border-slate-200">
          <button
            onClick={handleDownloadReview}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            &#128196; Download Review
          </button>
          <button
            onClick={handleDownloadLogbook}
            className="flex-1 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            &#128209; Download Logbook Entry
          </button>
        </div>
      )}
    </div>
  )
}
