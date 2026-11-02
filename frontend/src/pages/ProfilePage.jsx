import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  getDiverProfile, getAllDives, logoutUser,
  getBuddies, getPendingBuddyRequests, getOutgoingBuddyRequests, sendBuddyRequest,
  acceptBuddyRequest, removeBuddy, searchUsers, getBuddyProfile
} from "../api/diveApi"
import { Settings, UserPlus, Check, X, Search, Shield, Activity, TrendingUp, Clock, Droplets, User, Users, LogOut } from "lucide-react"
import "./ProfilePage.css"
import { useConfirm } from "../context/ConfirmContext"
import { useToast } from "../context/ToastContext"

export default function ProfilePage() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ totalDives: 0, maxDepth: 0, bottomTime: 0 })
  const [loading, setLoading] = useState(true)
  const [buddies, setBuddies] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [tab, setTab] = useState("profile")
  const [buddyError, setBuddyError] = useState("")
  const [buddySuccess, setBuddySuccess] = useState("")
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [selectedBuddy, setSelectedBuddy] = useState(null)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [profileRes, divesRes, buddiesRes, pendingRes, outgoingRes] = await Promise.all([
          getDiverProfile(), getAllDives(), getBuddies(), getPendingBuddyRequests(), getOutgoingBuddyRequests()
        ])
        setProfile(profileRes);
        setBuddies(buddiesRes)
        setPendingRequests(pendingRes)
        setOutgoingRequests(outgoingRes)
        
        const diveArray = Array.isArray(divesRes) ? divesRes : []
        
        if (diveArray.length > 0) {
          const totalTime = diveArray.reduce((acc, curr) => acc + (Number(curr.durationMinutes) || 0), 0)
          const deepPoint = Math.max(...diveArray.map(d => Number(d.depthMeters) || 0))
          setStats({
            totalDives: diveArray.length,
            maxDepth: deepPoint,
            bottomTime: totalTime
          })
        }
      } catch (err) {
        console.error("Failed to compile dashboard profile data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  async function handleLogout() {
    try {
      await logoutUser()
    } catch (e) {
      // ignore server errors on logout
    }
    localStorage.removeItem("user_session_token")
    navigate("/login", { replace: true })
  }

  async function handleSearch(q) {
    setSearchQuery(q)
    if (q.trim().length < 2) {
      setSearchResults([])
      return
    }
    try {
      const results = await searchUsers(q.trim())
      setSearchResults(results)
    } catch (err) {
      console.error("Search failed:", err)
    }
  }

  async function handleSendBuddyRequest(userId) {
    try {
      await sendBuddyRequest(userId)
      setSearchQuery("")
      setSearchResults([])
      setShowSearch(false)
      setBuddyError("")
      setBuddySuccess("Buddy request sent! Waiting for them to accept.")
      toast.success("Buddy request sent")
      const [buddiesRes, pendingRes, outgoingRes] = await Promise.all([
        getBuddies(), getPendingBuddyRequests(), getOutgoingBuddyRequests()
      ])
      setBuddies(buddiesRes)
      setPendingRequests(pendingRes)
      setOutgoingRequests(outgoingRes)
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send buddy request"
      setBuddyError(msg)
      toast.error(msg)
    }
  }

  async function handleAcceptRequest(buddyId) {
    try {
      await acceptBuddyRequest(buddyId)
      setPendingRequests(prev => prev.filter(r => r.id !== buddyId))
      const updated = await getBuddies()
      setBuddies(updated)
      toast.success("Buddy added")
    } catch (err) {
      console.error("Failed to accept request:", err)
      toast.error("Failed to accept request")
    }
  }

  async function handleRemoveBuddy(buddyId) {
    const ok = await confirm({ title: "Remove buddy?", message: "Remove this buddy?", confirmText: "Remove", danger: true })
    if (!ok) return
    try {
      await removeBuddy(buddyId)
      setBuddies(prev => prev.filter(b => b.id !== buddyId))
      setPendingRequests(prev => prev.filter(r => r.id !== buddyId))
      setOutgoingRequests(prev => prev.filter(r => r.id !== buddyId))
      toast.success("Removed")
    } catch (err) {
      console.error("Failed to remove buddy:", err)
      toast.error("Failed to remove")
    }
  }

  async function handleViewBuddy(buddyUserId) {
    try {
      const profile = await getBuddyProfile(buddyUserId)
      setSelectedBuddy(profile)
    } catch (err) {
      console.error("Failed to load buddy profile:", err)
    }
  }

  if (loading) return <div className="dive-form-page"><div className="card"><h2>Loading Profile Node...</h2></div></div>

const isAdmin = profile?.role === "ADMIN"

return (
  <div className="profile-page-container">
    <button className="btn btn--ghost" onClick={() => navigate("/")}>
      ← Back to Dashboard
    </button>
    <button className="btn btn--ghost" onClick={() => navigate("/settings")}>
      <Settings size={16} /> Settings
    </button>

    <div className="profile-tabs">
      <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>
        <User size={14} /> Profile
      </button>
      <button className={tab === "buddies" ? "active" : ""} onClick={() => setTab("buddies")}>
        <Users size={14} /> Buddies ({buddies.length})
      </button>
      {isAdmin && (
        <button className="admin-nav-btn" onClick={() => navigate("/admin")}>
          <Shield size={16} /> Admin
        </button>
      )}
    </div>

    {tab === "profile" && (
      <div className="profile-card">
        <h2 className="diver-email">{profile?.email || "Diver Account"}</h2>
        {isAdmin && <span className="admin-badge">Admin</span>}
        <span className="badge-rank">Verified Deep Diver</span>

        <hr className="divider-line"/>

        <div className="stats-dashboard-grid centering-wrapper">
          <div className="stat-node centered-node">
            <span className="stat-label">Logged Descents</span>
            <span className="stat-val">{stats.totalDives}</span>
          </div>
        </div>

        <button onClick={handleLogout} className="logout-action-btn">
          <LogOut size={16} /> Terminate Session (Logout)
        </button>
      </div>
    )}

    {selectedBuddy && (
      <div className="buddy-profile-overlay" onClick={() => setSelectedBuddy(null)}>
        <div className="buddy-profile-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={() => setSelectedBuddy(null)}>
            <X size={16} />
          </button>
          <h3>{selectedBuddy.email}</h3>
          <div className="buddy-stats-grid">
            <div className="buddy-stat-item">
              <Activity size={18} />
              <span className="buddy-stat-label">Total Dives</span>
              <span className="buddy-stat-value">{selectedBuddy.totalDives}</span>
            </div>
            <div className="buddy-stat-item">
              <TrendingUp size={18} />
              <span className="buddy-stat-label">Max Depth</span>
              <span className="buddy-stat-value">{selectedBuddy.maxDepth}m</span>
            </div>
            <div className="buddy-stat-item">
              <Droplets size={18} />
              <span className="buddy-stat-label">Avg Depth</span>
              <span className="buddy-stat-value">{selectedBuddy.avgDepth}m</span>
            </div>
            <div className="buddy-stat-item">
              <Clock size={18} />
              <span className="buddy-stat-label">Total Bottom Time</span>
              <span className="buddy-stat-value">{selectedBuddy.totalDuration} min</span>
            </div>
          </div>
          {selectedBuddy.lastDiveDate && (
            <p className="buddy-last-dive">Last dive: {selectedBuddy.lastDiveDate}</p>
          )}
        </div>
      </div>
    )}

    {tab === "buddies" && (
      <div className="buddies-section">
        <div className="buddies-header">
          <h3>My Buddies</h3>
          <button className="btn-primary-action" onClick={() => setShowSearch(!showSearch)}>
            <UserPlus size={16} /> Add Buddy
          </button>
        </div>

        {showSearch && (
          <div className="buddy-search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchQuery}
              onChange={e => { setBuddyError(""); setBuddySuccess(""); handleSearch(e.target.value) }}
              autoFocus
            />
            {buddySuccess && <div className="buddy-success-msg">{buddySuccess}</div>}
            {buddyError && <div className="buddy-error-msg">{buddyError}</div>}
            {searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map(u => (
                  <div key={u.id} className="search-result-item">
                    <span>{u.email}</span>
                    <button onClick={() => handleSendBuddyRequest(u.id)}>
                      <UserPlus size={14} /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div className="buddy-requests-section">
            <h4>Incoming Requests ({pendingRequests.length})</h4>
            {pendingRequests.map(req => (
              <div key={req.id} className="buddy-request-item">
                <span>{req.buddyEmail}</span>
                <div className="buddy-request-actions">
                  <button className="btn-accept" onClick={() => handleAcceptRequest(req.id)}>
                    <Check size={14} /> Accept
                  </button>
                  <button className="btn-decline" onClick={() => handleRemoveBuddy(req.id)}>
                    <X size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {outgoingRequests.length > 0 && (
          <div className="buddy-requests-section">
            <h4>Sent Requests ({outgoingRequests.length})</h4>
            {outgoingRequests.map(req => (
              <div key={req.id} className="buddy-request-item">
                <span>{req.buddyEmail}</span>
                <div className="buddy-request-actions">
                  <span className="pending-badge">Awaiting acceptance</span>
                  <button className="btn-decline" onClick={() => handleRemoveBuddy(req.id)}>
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {buddies.length === 0 ? (
          <p className="empty-text">No buddies yet. Search for a diver to add them!</p>
        ) : (
          <div className="buddies-list">
            {buddies.map(b => (
              <div key={b.id} className="buddy-item" onClick={() => handleViewBuddy(b.buddyId)} style={{ cursor: "pointer" }}>
                <div className="buddy-avatar">{(b.buddyEmail || "?").charAt(0).toUpperCase()}</div>
                <span>{b.buddyEmail}</span>
                <button className="btn-remove" onClick={(e) => { e.stopPropagation(); handleRemoveBuddy(b.id) }}>
                  <X size={14} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
  )
}