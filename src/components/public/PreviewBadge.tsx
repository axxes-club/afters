'use client'

import { useLivePreview } from './LivePreviewProvider'
import { Eye, Undo2, RotateCcw } from 'lucide-react'

export function PreviewBadge() {
  const { isPreviewMode, hasChanges, canUndo, undo, resetToOriginal, design } = useLivePreview()

  if (!isPreviewMode && !hasChanges) return null

  return (
    <div className="fixed top-6 left-6 z-[100] flex items-center gap-2">
      {/* Preview Badge */}
      <div
        className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl border rounded-lg shadow-lg"
        style={{ borderColor: `${design.accentColor}40` }}
      >
        <Eye className="w-4 h-4 animate-pulse" style={{ color: design.accentColor }} />
        <span className="text-white text-sm font-medium">Preview Mode</span>
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: design.accentColor }}
        />
      </div>

      {/* Undo Button */}
      {canUndo && (
        <button
          onClick={undo}
          className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg hover:border-white/30 transition-all text-white text-sm font-medium"
        >
          <Undo2 className="w-4 h-4" />
          Undo
        </button>
      )}

      {/* Reset Button */}
      {hasChanges && (
        <button
          onClick={resetToOriginal}
          className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg hover:border-red-500/50 hover:text-red-400 transition-all text-white text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      )}
    </div>
  )
}
