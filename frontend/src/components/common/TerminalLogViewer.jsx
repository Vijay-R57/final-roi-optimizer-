import React, { useState } from 'react'

export const TerminalLogViewer = ({ stdoutLogs, stderrLogs, executionId, duration }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('stdout')

  if (!stdoutLogs && !stderrLogs) return null

  return (
    <div className="mt-6 border border-slate-700 bg-slate-900 rounded-xl shadow-xl overflow-hidden font-mono text-sm">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 py-3 bg-slate-800 cursor-pointer hover:bg-slate-750 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-slate-200 font-semibold tracking-wide text-xs uppercase">
            Real Terminal Execution Output ({executionId || 'Live Run'})
          </span>
          {duration && (
            <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded font-sans">
              ⏱ {duration}s
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-sans">
            {isOpen ? 'Collapse Logs ▲' : 'Expand Terminal Logs ▼'}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 bg-slate-950 text-slate-100">
          <div className="flex items-center space-x-2 mb-3 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('stdout')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                activeTab === 'stdout'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              stdout Logs
            </button>
            {stderrLogs && (
              <button
                onClick={() => setActiveTab('stderr')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activeTab === 'stderr'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                stderr Warnings/Logs
              </button>
            )}
          </div>

          <pre className="p-4 bg-black/80 rounded-lg text-xs leading-relaxed overflow-x-auto text-emerald-400 max-h-96 overflow-y-auto font-mono whitespace-pre-wrap select-all">
            {activeTab === 'stdout' ? (stdoutLogs || 'No stdout log captured.') : (stderrLogs || 'No stderr output.')}
          </pre>
        </div>
      )}
    </div>
  )
}
