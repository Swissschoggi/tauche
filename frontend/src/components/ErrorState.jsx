import { AlertTriangle } from "lucide-react"

export default function ErrorState({ title = "Something went wrong", body, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <div className="empty-state__icon"><AlertTriangle size={40} strokeWidth={1.5} /></div>
      <h3 className="error-state__title">{title}</h3>
      {body && <p className="error-state__body">{body}</p>}
      {onRetry && (
        <button className="btn btn--primary btn--sm" onClick={onRetry} type="button">
          Try again
        </button>
      )}
    </div>
  )
}
