'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UploadFormProps {
  onReviewStart: () => void
  onReviewStream: (text: string) => void
  onReviewComplete: (metadata: {
    filename: string
    stage: string
    wordCount: number
    pageEstimate: number
  }) => void
  onReviewError: (error: string) => void
  isReviewing: boolean
}

export default function UploadForm({
  onReviewStart,
  onReviewStream,
  onReviewComplete,
  onReviewError,
  isReviewing,
}: UploadFormProps) {
  const [code, setCode] = useState('')
  const [stage, setStage] = useState<string>('draft')
  const [file, setFile] = useState<File | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [codeStatus, setCodeStatus] = useState<
    'idle' | 'checking' | 'valid' | 'invalid'
  >('idle')
  const [codeError, setCodeError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load saved code from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('thesis-reviewer-code')
    if (saved) {
      setCode(saved)
    }
  }, [])

  // Validate code when it changes (debounced)
  const validateCode = useCallback(async (codeValue: string) => {
    if (codeValue.length < 3) {
      setCodeStatus('idle')
      setRemaining(null)
      setCodeError('')
      return
    }

    setCodeStatus('checking')
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeValue }),
      })
      const data = await res.json()

      if (data.valid) {
        setCodeStatus('valid')
        setRemaining(data.remaining)
        setCodeError(data.error || '')
        localStorage.setItem('thesis-reviewer-code', codeValue)
      } else {
        setCodeStatus('invalid')
        setRemaining(null)
        setCodeError(data.error || 'Invalid code.')
      }
    } catch {
      setCodeStatus('idle')
      setCodeError('Could not verify code. Try again.')
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.length >= 3) validateCode(code)
    }, 500)
    return () => clearTimeout(timer)
  }, [code, validateCode])

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const ext = droppedFile.name.split('.').pop()?.toLowerCase()
      if (ext === 'docx' || ext === 'pdf') {
        setFile(droppedFile)
      } else {
        onReviewError('Please upload a .docx or .pdf file.')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
    }
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !code || codeStatus !== 'valid' || remaining === 0) return

    onReviewStart()

    const formData = new FormData()
    formData.append('file', file)
    formData.append('code', code)
    formData.append('stage', stage)

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        onReviewError(errorData.error || 'Something went wrong.')
        return
      }

      // Read the streaming response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        onReviewError('Could not read response stream.')
        return
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // Keep incomplete chunk

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.text) {
                onReviewStream(data.text)
              }
              if (data.done) {
                onReviewComplete({
                  filename: data.filename,
                  stage: data.stage,
                  wordCount: data.wordCount,
                  pageEstimate: data.pageEstimate,
                })
              }
              if (data.error) {
                onReviewError(data.error)
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }

      // Update remaining count
      if (remaining !== null) {
        setRemaining(Math.max(0, remaining - 1))
      }
    } catch (error) {
      console.error('Submit error:', error)
      onReviewError('Network error. Please check your connection and try again.')
    }
  }

  const canSubmit =
    file && codeStatus === 'valid' && remaining !== null && remaining > 0 && !isReviewing

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Access Code */}
      <div>
        <label
          htmlFor="code"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Access Code
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. THESIS-ANNA-2026"
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            codeStatus === 'valid'
              ? 'border-green-300 bg-green-50'
              : codeStatus === 'invalid'
              ? 'border-red-300 bg-red-50'
              : 'border-slate-300'
          }`}
          disabled={isReviewing}
        />
        {codeStatus === 'valid' && remaining !== null && remaining > 0 && (
          <p className="text-xs text-green-600 mt-1">
            &#10003; Valid &mdash; {remaining} review{remaining !== 1 ? 's' : ''}{' '}
            remaining this month
          </p>
        )}
        {codeError && (
          <p className="text-xs text-red-600 mt-1">{codeError}</p>
        )}
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Upload your chapter
        </label>
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : file
              ? 'border-green-300 bg-green-50'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isReviewing}
          />
          {file ? (
            <div className="text-sm">
              <span className="text-green-700 font-medium">{file.name}</span>
              <span className="text-slate-500 ml-2">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              <span className="text-lg">&#128196;</span>
              <p className="mt-1">
                Drag &amp; drop your .docx or .pdf, or click to browse
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stage Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Submission stage
        </label>
        <div className="flex gap-3">
          {['proposal', 'draft', 'final'].map((s) => (
            <label
              key={s}
              className={`flex-1 text-center py-2 px-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                stage === s
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="stage"
                value={s}
                checked={stage === s}
                onChange={(e) => setStage(e.target.value)}
                className="sr-only"
                disabled={isReviewing}
              />
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
          canSubmit
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        {isReviewing ? 'Reviewing...' : 'Submit for Review'}
      </button>
    </form>
  )
}
