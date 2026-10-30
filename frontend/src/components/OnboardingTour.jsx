import { useEffect, useState } from "react"
import { X, ChevronRight, ChevronLeft } from "lucide-react"
import "./OnboardingTour.css"

export default function OnboardingTour({ steps, isOpen, onClose }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setIndex(0)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const step = steps[index]
    if (!step) return
    const el = document.querySelector(step.target)
    if (!el) { setRect(null); return }
    el.scrollIntoView({ behavior: "smooth", block: "center" })
    const update = () => {
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    update()
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [index, isOpen, steps])

  if (!isOpen) return null

  const step = steps[index]
  const isLast = index === steps.length - 1

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true">
      {rect && (
        <div
          className="tour-spotlight"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      )}
      <div className="tour-card">
        <button className="tour-close" onClick={onClose} aria-label="Close tour">
          <X size={16} />
        </button>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="tour-actions">
          <button
            className="tour-btn tour-btn--ghost"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <ChevronLeft size={16} /> Back
          </button>
          <span className="tour-progress">{index + 1} / {steps.length}</span>
          {isLast ? (
            <button className="tour-btn" onClick={onClose}>Done</button>
          ) : (
            <button className="tour-btn" onClick={() => setIndex((i) => i + 1)}>
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
