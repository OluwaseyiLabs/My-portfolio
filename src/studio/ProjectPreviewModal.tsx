import { useState } from 'react'
import type { PortfolioProject, PendingImage } from '../types/portfolio'

interface ProjectPreviewModalProps {
  project: Partial<PortfolioProject>
  images: PendingImage[]
  onClose: () => void
}

export default function ProjectPreviewModal({
  project,
  images,
  onClose,
}: ProjectPreviewModalProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  const isAI = project.category === 'AI_AUTOMATION'
  const currentImage = images[activeImageIdx] || images[0]

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-bg text-fg max-h-[92dvh] overflow-y-auto shadow-2xl">
        {/* Top bar with PREVIEW badge */}
        <div className="sticky top-0 z-20 bg-fg text-bg px-6 py-3 flex items-center justify-between border-b border-fg">
          <div className="flex items-center gap-3">
            <span className="bg-bg text-fg text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
              Preview Mode
            </span>
            <span className="text-xs text-bg/70">
              This is how your project appears on the public website.
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-bg hover:text-bg/70 text-xs font-semibold px-2 py-1 border border-bg/30 hover:border-bg transition-colors"
          >
            Close Preview ✕
          </button>
        </div>

        {/* AI Automation Preview Layout */}
        {isAI ? (
          <div className="p-6 sm:p-10 space-y-8">
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-2 block">
                Case Study — AI Automation
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-fg mb-3">
                {project.title || 'Untitled Workflow'}
              </h2>
              {project.short_description && (
                <p className="text-muted text-base mb-4 leading-relaxed">
                  {project.short_description}
                </p>
              )}
              {project.technologies && project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-medium px-3 py-1 border border-line text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Core Challenge + Solution */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="border border-line p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-fg block" />
                  <h3 className="text-xs font-black uppercase tracking-[0.12em] text-fg">
                    Core Challenge
                  </h3>
                </div>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                  {project.core_challenge || 'No challenge provided.'}
                </p>
              </div>

              <div className="border border-fg p-6 bg-fg text-bg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-bg block" />
                  <h3 className="text-xs font-black uppercase tracking-[0.12em] text-bg">
                    Solution Delivered
                  </h3>
                </div>
                <p className="text-sm text-bg/80 leading-relaxed whitespace-pre-line">
                  {project.solution_delivered || 'No solution provided.'}
                </p>
              </div>
            </div>

            {/* Workflow Implementation Gallery */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.12em] text-fg mb-4 flex items-center gap-3">
                Workflow Implementation
                <span className="flex-1 h-px bg-line" />
              </h3>

              {images.length > 0 ? (
                <div className="space-y-4">
                  <div className="border border-line bg-surface overflow-hidden flex items-center justify-center">
                    <img
                      src={currentImage.previewUrl}
                      alt={currentImage.altText || project.title || 'Workflow screenshot'}
                      className="w-full max-h-[500px] object-contain"
                    />
                  </div>
                  {currentImage.caption && (
                    <p className="text-xs text-muted italic text-center">
                      {currentImage.caption}
                    </p>
                  )}

                  {/* Thumbnail bar if multiple images */}
                  {images.length > 1 && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                      {images.map((img, idx) => (
                        <button
                          key={img.id || idx}
                          onClick={() => setActiveImageIdx(idx)}
                          className={`flex-shrink-0 w-20 h-14 border overflow-hidden ${
                            idx === activeImageIdx
                              ? 'border-fg ring-2 ring-fg'
                              : 'border-line opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img.previewUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-line-strong p-8 text-center text-xs text-faint">
                  No workflow screenshots uploaded yet.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Web Design Preview Layout */
          <div className="p-6 sm:p-10 space-y-6">
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-2 block">
                Web Design &amp; Development Project
              </span>
              <h2 className="text-3xl font-black tracking-tight text-fg mb-2">
                {project.title || 'Untitled Website'}
              </h2>
              {project.short_description && (
                <p className="text-sm text-muted leading-relaxed mb-4">
                  {project.short_description}
                </p>
              )}
              {project.project_url && (
                <div className="mb-4">
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-fg border-b border-fg pb-0.5"
                  >
                    Visit Live Website ↗
                  </a>
                </div>
              )}
            </div>

            {/* Website Screenshot Viewer */}
            {images.length > 0 ? (
              <div className="space-y-4">
                <div className="border border-line bg-surface overflow-hidden flex items-center justify-center">
                  <img
                    src={currentImage.previewUrl}
                    alt={currentImage.altText || project.title || 'Website screenshot'}
                    className="w-full max-h-[550px] object-contain"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          idx === activeImageIdx ? 'bg-fg' : 'bg-line-strong'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-line-strong p-12 text-center text-xs text-faint">
                No website screenshots uploaded yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
