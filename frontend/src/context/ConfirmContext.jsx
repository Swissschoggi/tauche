import { createContext, useCallback, useContext, useState } from "react"

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({
        title: options.title || "Are you sure?",
        message: options.message || "This action cannot be undone.",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        danger: !!options.danger,
        resolve,
      })
    })
  }, [])

  const close = (result) => {
    if (state?.resolve) state.resolve(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="confirm-card">
            <h3 id="confirm-title">{state.title}</h3>
            <p>{state.message}</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => close(false)}>
                {state.cancelText}
              </button>
              <button
                className={`confirm-ok ${state.danger ? "confirm-ok--danger" : ""}`}
                onClick={() => close(true)}
                autoFocus
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider")
  return ctx
}
