import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import {
  Home, PlusCircle, Map, BarChart3, MapPin, TowerControl,
  Wrench, Award, Fish, User, Settings, Sun, Moon, Shield,
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { getDiverProfile } from "../api/diveApi"
import "./Sidebar.css"

const items = [
  { label: "Home", path: "/", icon: Home },
  { label: "New Dive", path: "/new", icon: PlusCircle },
  { label: "Map", path: "/map", icon: Map },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Sites", path: "/sites", icon: MapPin },
  { label: "Trips", path: "/trips", icon: TowerControl },
  { label: "Gear", path: "/equipment", icon: Wrench },
  { label: "Certs", path: "/certification", icon: Award },
  { label: "Sightings", path: "/sightings", icon: Fish },
]

export default function Sidebar() {
  const { theme, toggle } = useTheme()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    getDiverProfile().then((p) => {
      if (p && p.role === "ADMIN") setIsAdmin(true)
    }).catch(() => {})
  }, [])

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">Tauche</span>
      </div>
      <nav className="sidebar-nav">
        {items.map((it) => (
          <NavLink
            key={it.path}
            to={it.path}
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link--active" : ""}`}
            end={it.path === "/"}
          >
            <it.icon size={18} />
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link--active" : ""}`}>
            <Shield size={18} /> <span>Admin</span>
          </NavLink>
        )}
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link--active" : ""}`}>
          <User size={18} /> <span>Profile</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link--active" : ""}`}>
          <Settings size={18} /> <span>Settings</span>
        </NavLink>
        <button className="sidebar-link sidebar-theme" onClick={toggle}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>
    </aside>
  )
}
