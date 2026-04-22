import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minRows?: number
}

export default function MarkdownEditor({ value, onChange, placeholder = 'Add a description…', minRows = 4 }: Props) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')

  return (
    <div className="border border-gray-600 rounded overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-600 bg-gray-750">
        {(['write', 'preview'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-gray-700 text-gray-100 border-b-2 border-blue-400 -mb-px'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto px-3 py-1.5 text-xs text-gray-600 select-none">Markdown</span>
      </div>

      {tab === 'write' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          className="w-full bg-gray-700 px-3 py-2 text-sm text-gray-100 font-mono resize-y focus:outline-none placeholder-gray-600"
        />
      ) : (
        <div className="min-h-[6rem] bg-gray-700 px-3 py-2">
          {value.trim() ? (
            <div className="prose prose-invert prose-sm max-w-none
              prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1
              prose-li:my-0 prose-pre:bg-gray-800 prose-code:bg-gray-800
              prose-code:px-1 prose-code:rounded prose-a:text-blue-400">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-gray-600 italic">Nothing to preview.</p>
          )}
        </div>
      )}
    </div>
  )
}
