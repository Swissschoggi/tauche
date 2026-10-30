import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, Settings } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { Sun, Moon } from "lucide-react"
import "./TopBar.css"

const TITLES = {
  "/": "Dives",
  "/new": "New dive",
  "/map": "Map",
  "/analytics": "Analytics",
  "/sites": "Dive sites",
  "/trips": "Trips",
  "/equipment": "Gear",
  "/certification": "Certifications",
  "/sightings": "Sightings",
  "/profile": "Profile",
  "/settings": "Settings",
  "/admin": "Admin",
}
function titleFor(path) {
  if (path.startsWith("/dives/")) return "Dive details"
  if (path.startsWith("/edit/")) return "Edit dive"
  if (path.startsWith("/trips/")) return "Trip"
  return TITLES[path] || "Tauche"
}
function backTarget(path) {
  if (path.startsWith("/dives/")) return "/"
  if (path.startsWith("/edit/")) return "/"
  if (path.startsWith("/trips/")) return "/trips"
  if (path === "/new") return "/"
  return null
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const target = backTarget(location.pathname)
  const hide = location.pathname === "/" || location.pathname.startsWith("/login") || location.pathname.startsWith("/register") || location.pathname.startsWith("/share") || location.pathname.startsWith("/shared")
  if (hide) return null

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        {target && (
          <button className="top-bar-back" onClick={() => navigate(target)} aria-label="Back">
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
        )}
        <span className="top-bar-title">{titleFor(location.pathname)}</span>
      </div>
      <div className="top-bar-right">
        <button className="top-bar-icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="top-bar-icon" onClick={() => navigate("/settings")} aria-label="Settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  )
}
