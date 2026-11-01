import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Home, PlusCircle, Map, BarChart3, MoreHorizontal, X,
  MapPin, TowerControl, Wrench, Award, Fish, User, Settings,
} from "lucide-react"

const allItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "New Dive", path: "/new", icon: PlusCircle },
  { label: "Map", path: "/map", icon: Map },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Sites", path: "/sites", icon: MapPin },
  { label: "Trips", path: "/trips", icon: TowerControl },
  { label: "Gear", path: "/equipment", icon: Wrench },
  { label: "Certs", path: "/certification", icon: Award },
  { label: "Sightings", path: "/sightings", icon: Fish },
  { label: "Profile", path: "/profile", icon: User },
  { label: "Settings", path: "/settings", icon: Settings },
]

const primaryItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "New", path: "/new", icon: PlusCircle },
  { label: "Map", path: "/map", icon: Map },
  { label: "Stats", path: "/analytics", icon: BarChart3 },
]

export default function MobileNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const go = (path) => {
    navigate(path)
    setMoreOpen(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      <nav className="mobile-nav" aria-label="Primary">
        {primaryItems.map((item) => (
          <button
            key={item.path}
            className={`mobile-tab ${isActive(item.path) ? "mobile-tab--active" : ""}`}
            onClick={() => go(item.path)}
            aria-current={isActive(item.path) ? "page" : undefined}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </button>
        ))}
        <button
          className={`mobile-tab ${moreOpen ? "mobile-tab--active" : ""}`}
          onClick={() => setMoreOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <MoreHorizontal size={22} />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div
          className="mobile-nav-sheet-backdrop"
          onClick={() => setMoreOpen(false)}
          role="presentation"
        >
          <div
            className="mobile-nav-sheet"
            role="dialog"
            aria-label="All sections"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-nav-sheet-header">
              <span>All sections</span>
              <button
                className="mobile-nav-sheet-close"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mobile-nav-sheet-grid">
              {allItems.map((item) => (
                <button
                  key={item.path}
                  className={`mobile-nav-sheet-item ${isActive(item.path) ? "mobile-nav-sheet-item--active" : ""}`}
                  onClick={() => go(item.path)}
                >
                  <item.icon size={22} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
