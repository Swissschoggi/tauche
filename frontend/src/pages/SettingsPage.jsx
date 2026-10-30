import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getDiverProfile } from "../api/diveApi"
import { Sliders, Shield, Activity } from "lucide-react"
import "./SettingsPage.css"

export default function SettingsPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [metricSystem, setMetricSystem] = useState(() => {
    return JSON.parse(localStorage.getItem("useMetric") ?? "true")
  })

  const [backendStatus, setBackendStatus] = useState("checking")
  const [latency, setLatency] = useState(null)
  const [saveStatus, setSaveStatus] = useState("")

  useEffect(() => {
    async function checkBackendAndLoadProfile() {
      const startTime = performance.now()
      try {
        const profileData = await getDiverProfile()
        setProfile(profileData)
        const endTime = performance.now()
        setLatency(Math.round(endTime - startTime))
        setBackendStatus("online")
      } catch (err) {
        console.error("Backend node handshake failed:", err)
        setBackendStatus("offline")
      }
    }
    checkBackendAndLoadProfile()
  }, [])

  function handleSaveChanges(e) {
    e.preventDefault()
    setSaveStatus("Saving configurations...")
    localStorage.setItem("useMetric", JSON.stringify(metricSystem))
    setTimeout(() => {
      setSaveStatus("Preferences successfully synced!")
      setTimeout(() => setSaveStatus(""), 2000)
    }, 600)
  }

  return (
    <div className="settings-page">
      <button className="back-dashboard-global-btn" onClick={() => navigate("/")}>
        ← Back to Dashboard
      </button>

      <div className="settings-container">
        <div className="settings-header">
          <h2>Control Panel Settings</h2>
          <p>Configure account preferences, unit metrics, and interface toggles</p>
        </div>

        <div className="settings-grid">
          <form className="settings-card" onSubmit={handleSaveChanges}>
            <h3><Sliders size={18} /> Preferences</h3>

            <div className="setting-row">
              <div className="setting-info">
                <label>Unit System</label>
                <span>
                  Currently using: <strong style={{ color: "var(--accent)" }}>
                    {metricSystem ? "Metric (m, °C, bar, kg)" : "Imperial (ft, °F, psi, lbs)"}
                  </strong>
                </span>
              </div>
              <input
                type="checkbox"
                className="toggle-switch"
                checked={metricSystem}
                onChange={() => setMetricSystem(prev => !prev)}
                title={metricSystem ? "Switch to Imperial" : "Switch to Metric"}
              />
            </div>

            <button type="submit" className="settings-save-btn">
              Apply
            </button>
            {saveStatus && <p className="settings-status-msg">{saveStatus}</p>}
          </form>

          <div className="settings-sidebar">
            <div className="sidebar-node">
              <h4><Activity size={16} /> Backend Node Link</h4>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
                <span className={`status-indicator ${backendStatus}`}></span>
                <span style={{ fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>
                  {backendStatus === "online"
                    ? "Operational"
                    : backendStatus === "offline"
                    ? "Offline"
                    : "Pinging Node..."}
                </span>
              </div>
              {backendStatus === "online" && (
                <p style={{ fontSize: "12px", color: "var(--ink-3)" }}>
                  Latency Response:{" "}
                  <span style={{ color: "#34d399", fontWeight: "600" }}>{latency}ms</span>
                </p>
              )}
            </div>

            <div className="sidebar-node">
              <h4><Shield size={16} /> Account Node</h4>
              <p className="node-email">{profile?.email || "Resolving driver identity..."}</p>
              <span className="node-tag">Authenticated Session</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}