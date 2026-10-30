import { createContext, useCallback, useContext, useState } from "react"

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message, options = {}) => {
    const id = ++idCounter
    const toast = {
      id,
      message,
      type: options.type || "info",
      duration: options.duration ?? 3200,
      action: options.action || null,
    }
    setToasts((prev) => [...prev, toast])
    if (toast.duration > 0) {
      setTimeout(() => dismiss(id), toast.duration)
    }
    return id
  }, [dismiss])

  const api = {
    show,
    success: (m, o) => show(m, { ...o, type: "success" }),
    error: (m, o) => show(m, { ...o, type: "error" }),
    info: (m, o) => show(m, { ...o, type: "info" }),
    warning: (m, o) => show(m, { ...o, type: "warning" }),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} role="status">
            <span className="toast__message">{t.message}</span>
            {t.action && (
              <button
                className="toast__action"
                onClick={() => { t.action.onClick(); dismiss(t.id) }}
              >
                {t.action.label}
              </button>
            )}
            <button
              className="toast__close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
