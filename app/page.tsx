'use client'

import { useState, useCallback } from 'react'
import UploadForm from './components/UploadForm'
import ReviewDisplay from './components/ReviewDisplay'
import PrivacyInfo from './components/PrivacyInfo'

export default function Home() {
  const [reviewContent, setReviewContent] = useState('')
  const [isReviewing, setIsReviewing] = useState(false)
  const [error, setError] = useState('')
  const [metadata, setMetadata] = useState<{
    filename: string
    stage: string
    wordCount: number
    pageEstimate: number
  } | null>(null)

  const handleReviewStart = useCallback(() => {
    setReviewContent('')
    setIsReviewing(true)
    setError('')
    setMetadata(null)
  }, [])

  const handleReviewStream = useCallback((text: string) => {
    setReviewContent((prev) => prev + text)
  }, [])

  const handleReviewComplete = useCallback(
    (meta: {
      filename: string
      stage: string
      wordCount: number
      pageEstimate: number
    }) => {
      setIsReviewing(false)
      setMetadata(meta)
    },
    []
  )

  const handleReviewError = useCallback((errorMsg: string) => {
    setIsReviewing(false)
    setError(errorMsg)
  }, [])

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Thesis Draft Reviewer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Prof. Knox&apos;s Research Group &mdash; TiSEM
          </p>
          <p className="text-sm text-slate-600 mt-3 max-w-md mx-auto">
            A drafting aid &mdash; not a grade. Use this feedback to strengthen
            your chapter before your next supervision meeting.
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <UploadForm
            onReviewStart={handleReviewStart}
            onReviewStream={handleReviewStream}
            onReviewComplete={handleReviewComplete}
            onReviewError={handleReviewError}
            isReviewing={isReviewing}
          />

          {/* Privacy info */}
          <div className="mt-5">
            <PrivacyInfo />
          </div>

          {/* Error display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Review results */}
          <ReviewDisplay
            content={reviewContent}
            isStreaming={isReviewing}
            metadata={metadata}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p>
            Built with{' '}
            <a
              href="https://www.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Claude
            </a>
            . Open source on{' '}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
