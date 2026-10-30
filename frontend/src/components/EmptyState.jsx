import { Inbox } from "lucide-react"

export default function EmptyState({ icon: Icon = Inbox, title, body, actions }) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state__icon"><Icon size={40} strokeWidth={1.5} /></div>
      <h3 className="empty-state__title">{title}</h3>
      {body && <p className="empty-state__body">{body}</p>}
      {actions && <div className="empty-state__actions">{actions}</div>}
    </div>
  )
}
