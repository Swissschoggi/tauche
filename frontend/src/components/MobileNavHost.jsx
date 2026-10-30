import { useLocation } from "react-router-dom"
import MobileNav from "./MobileNav"

export default function MobileNavHost() {
  const location = useLocation()
  const path = location.pathname
  if (path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/share") || path.startsWith("/shared")) {
    return null
  }
  // Hide on nested/detail pages (e.g. /dives/:id, /trips/:id, /edit/:id) to keep their
  // content unobstructed; top-level sections keep the bottom navigation.
  if (typeof window !== "undefined" && window.innerWidth > 768) return null
  const segments = path.split("/").filter(Boolean)
  if (segments.length > 1) return null
  if (path === "/new") return null
  return <MobileNav />
}
