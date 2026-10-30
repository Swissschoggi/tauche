import { useLocation } from "react-router-dom"
import Sidebar from "./Sidebar"

export default function SidebarHost() {
  const location = useLocation()
  const path = location.pathname
  if (path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/share") || path.startsWith("/shared")) {
    return null
  }
  return <Sidebar />
}
