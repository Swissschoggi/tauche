import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getDiverProfile } from "../api/diveApi"
import {
  Shield, Users, BarChart3, Activity, Trash2, ToggleLeft
} from "lucide-react"
import {
  adminGetUsers, adminGetStats, adminUpdateRole,
  adminToggleEnabled, adminDeleteUser
} from "../api/diveApi"
import "./AdminPage.css"
import { useConfirm } from "../context/ConfirmContext"

export default function AdminPage() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("users")

  useEffect(() => {
    async function load() {
      try {
        const profile = await getDiverProfile()
        if (profile?.role !== "ADMIN") {
          navigate("/", { replace: true })
          return
        }
        const [usersData, statsData] = await Promise.all([
          adminGetUsers(),
          adminGetStats()
        ])
        setUsers(usersData)
        setStats(statsData)
      } catch (err) {
        console.error("Failed to load admin data:", err)
        navigate("/", { replace: true })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  async function handleToggleEnabled(id) {
    try {
      const updated = await adminToggleEnabled(id)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, enabled: updated.enabled } : u))
    } catch (err) {
      console.error("Failed to toggle user:", err)
    }
  }

  async function handleRoleChange(id, role) {
    try {
      const updated = await adminUpdateRole(id, role)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: updated.role } : u))
    } catch (err) {
      console.error("Failed to update role:", err)
    }
  }

  async function handleDeleteUser(id, email) {
    const ok = await confirm({ title: "Delete user?", message: `Delete user "${email}"? This cannot be undone.`, confirmText: "Delete", danger: true })
    if (!ok) return
    try {
      await adminDeleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      console.error("Failed to delete user:", err)
    }
  }

  if (loading) return (
    <div className="admin-page">
      <div className="card"><h2>Loading admin panel...</h2></div>
    </div>
  )

  return (
    <div className="admin-page">
      <button className="back-dashboard-global-btn" onClick={() => navigate("/")}>
        ← Back to Dashboard
      </button>

      <h1><Shield size={24} /> Admin Panel</h1>

      <div className="admin-tabs">
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
          <Users size={16} /> Users
        </button>
        <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>
          <BarChart3 size={16} /> Stats
        </button>
      </div>

      {tab === "users" && (
        <div className="admin-users-section">
          <div className="admin-users-header">
            <span>Users ({users.length})</span>
          </div>
          <div className="admin-users-table-wrapper">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Dives</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${u.enabled ? "enabled" : "disabled"}`}>
                        {u.enabled ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>{u.diveCount}</td>
                    <td className="admin-actions">
                      <button
                        className="btn-icon"
                        title={u.enabled ? "Disable" : "Enable"}
                        onClick={() => handleToggleEnabled(u.id)}
                      >
                        <ToggleLeft size={16} />
                      </button>
                      <button
                        className="btn-icon btn-danger-icon"
                        title="Delete user"
                        onClick={() => handleDeleteUser(u.id, u.email)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className="admin-stats-grid">
          <div className="stat-card">
            <Users size={24} />
            <span className="stat-value">{stats?.totalUsers ?? 0}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-card">
            <Activity size={24} />
            <span className="stat-value">{stats?.totalDives ?? 0}</span>
            <span className="stat-label">Total Dives</span>
          </div>
          <div className="stat-card">
            <BarChart3 size={24} />
            <span className="stat-value">{stats?.totalPhotos ?? 0}</span>
            <span className="stat-label">Photos</span>
          </div>
          <div className="stat-card">
            <BarChart3 size={24} />
            <span className="stat-value">{stats?.totalEquipment ?? 0}</span>
            <span className="stat-label">Equipment</span>
          </div>
          <div className="stat-card">
            <BarChart3 size={24} />
            <span className="stat-value">{stats?.totalTrips ?? 0}</span>
            <span className="stat-label">Trips</span>
          </div>
        </div>
      )}
    </div>
  )
}
