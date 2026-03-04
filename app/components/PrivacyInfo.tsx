'use client'

import { useState } from 'react'

export default function PrivacyInfo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-slate-200 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 text-left text-sm text-slate-600 hover:text-slate-800 flex items-center gap-2 transition-colors"
      >
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>
          &#9654;
        </span>
        How it works &mdash; data &amp; privacy
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-slate-600 space-y-2 border-t border-slate-100 pt-3">
          <p>
            When you submit a file, the text is extracted and sent to{' '}
            <a
              href="https://www.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Anthropic&apos;s Claude API
            </a>{' '}
            for processing. The AI generates structured feedback based on the
            TiSEM thesis rubric.
          </p>
          <p>
            <strong>Your text is not stored permanently.</strong> It is processed
            in memory and discarded after the review is generated. No copies are
            saved on our server or by the API.
          </p>
          <p>
            This tool provides <strong>formative feedback only</strong> &mdash;
            it is not an assessment and does not produce grades. You are
            responsible for all writing and revisions.
          </p>
          <p>
            Per TiSEM policy, you should log your use of this tool in your AI
            logbook. A pre-formatted logbook entry is available for download
            after each review.
          </p>
          <p className="text-xs text-slate-400">
            See{' '}
            <a
              href="https://www.anthropic.com/policies/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Anthropic&apos;s privacy policy
            </a>{' '}
            for details on API data handling.
          </p>
        </div>
      )}
    </div>
  )
}
