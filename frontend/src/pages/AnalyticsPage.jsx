import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAllDives } from "../api/diveApi"
import { calculateSAC } from "../components/DiveCalculations"

import { TrendingUp, Activity, Settings, Droplets, Trophy, Clock, ShieldAlert, Thermometer, Compass, Flame, Snowflake, Cloud, Plane } from "lucide-react"
import "./AnalyticsPage.css"

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [dives, setDives] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredNode, setHoveredNode] = useState(null)

  const localMetricSetting = localStorage.getItem("useMetric")
  const isMetric = localMetricSetting !== null ? JSON.parse(localMetricSetting) : true

  useEffect(() => {
    async function loadHistory() {
      setLoading(true)
      try {
        const res = await getAllDives()
        const sorted = [...(Array.isArray(res) ? res : [])]
          .filter((d) => d.date && d.depthMeters)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
        setDives(sorted)
      } catch (err) {
        console.error("Failed to load history:", err)
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [])

  const maxDepth = dives.length ? Math.max(...dives.map((d) => Number(d.depthMeters))) : 0
  const avgDepth = dives.length ? (dives.reduce((sum, d) => sum + Number(d.depthMeters), 0) / dives.length).toFixed(1) : 0

const validTemps = dives
  .map(d => {
    const rawTemp = d.waterTemperatureCelsius ?? d.temperature ?? d.temp ?? d.waterTemp ?? d.tempC;
    
    if (rawTemp !== undefined && rawTemp !== null && rawTemp !== "") {
      return Number(rawTemp);
    }
    return NaN;
  })
  .filter(t => !isNaN(t) && t >= -2);

const minTemp = validTemps.length ? Math.min(...validTemps) : null;

  const thermalBins = { tropical: 0, temperate: 0, frigid: 0 }
  validTemps.forEach(t => {
    if (t >= 24) thermalBins.tropical++
    else if (t >= 12) thermalBins.temperate++
    else thermalBins.frigid++
  })

  const nitroxCount = dives.filter(d => d.gasType?.toLowerCase().includes("nitrox") || Number(d.oxygenPercentage) > 21).length
  const airCount = dives.length - nitroxCount
  const nitroxPercentage = dives.length ? ((nitroxCount / dives.length) * 100).toFixed(0) : 0

  const criticalPpo2Logs = dives.filter(d => {
    const ata = (Number(d.depthMeters) / 10) + 1
    const fo2 = (Number(d.oxygenPercentage) || 21) / 100
    return (ata * fo2) > 1.40
  }).length

  const safetyAlertsCount = dives.filter(d => d.rapidAscentRate || d.missedSafetyStop || d.decoViolation).length
  const totalSafetyFlags = safetyAlertsCount + criticalPpo2Logs

  const getLastDiveRemainingNoFlyHours = () => {
    if (!dives.length) return 0
    const sortedByDate = [...dives].sort((a, b) => new Date(b.date) - new Date(a.date))
    const lastDive = sortedByDate[0]
    
    const diveDateTime = new Date(`${lastDive.date}T${lastDive.timeOut || "12:00"}`)
    const hoursSinceLastDive = (new Date() - diveDateTime) / (1000 * 60 * 60)
    const remainingHours = 24 - hoursSinceLastDive
    return remainingHours > 0 ? remainingHours.toFixed(1) : 0
  }
  const noFlyHoursLeft = parseFloat(getLastDiveRemainingNoFlyHours())

  const validSacValues = dives
    .map((d) => parseFloat(calculateSAC(d)))
    .filter((sac) => !isNaN(sac) && sac > 0)

  const avgSacRate = validSacValues.length
    ? (validSacValues.reduce((sum, val) => sum + val, 0) / validSacValues.length).toFixed(2)
    : "N/A"

  const deepestDive = dives.length 
    ? [...dives].sort((a, b) => Number(b.depthMeters) - Number(a.depthMeters))[0] 
    : null

  const longestDive = dives.length 
    ? [...dives].sort((a, b) => Number(b.durationMinutes) - Number(a.durationMinutes))[0] 
    : null

  const lowestSacDive = dives.length
    ? [...dives]
        .filter((d) => {
          const s = parseFloat(calculateSAC(d))
          return !isNaN(s) && s > 0
        })
        .sort((a, b) => parseFloat(calculateSAC(a)) - parseFloat(calculateSAC(b)))[0]
    : null

  const width = 600
  const height = 220
  const paddingX = 50
  const paddingY = 30
  const ceilingMax = maxDepth > 0 ? maxDepth * 1.2 : 40
  const usableWidth = width - paddingX * 2
  const usableHeight = height - paddingY * 2

  const points = dives.map((dive, index) => {
    const x = paddingX + (dives.length > 1 ? (index / (dives.length - 1)) * usableWidth : usableWidth / 2)
    const y = (height - paddingY) - (Number(dive.depthMeters) / ceilingMax) * usableHeight
    return { x, y, ...dive }
  })

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")
  const areaPath = points.length ? `${linePath} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z` : ""

  function displayDepth(meters) {
    if (!meters) return "-"
    return isMetric ? `${meters}m` : `${Math.round(meters * 3.28084)}ft`
  }

  function displayTemp(celsius) {
    if (celsius === null || isNaN(celsius)) return "N/A"
    return isMetric ? `${celsius}°C` : `${Math.round((celsius * 9/5) + 32)}°F`
  }

  if (loading) return (
    <div className="analytics-page">
      <button className="btn btn--ghost" onClick={() => navigate("/")}>← Back to Dashboard</button>
      <button className="btn btn--ghost" onClick={() => navigate("/settings")}><Settings size={16} /> Settings</button>
      <div className="analytics-loading">
        <div className="analytics-spinner" />
        <p>Loading telemetry data...</p>
      </div>
    </div>
  )

  if (dives.length === 0) return (
    <div className="analytics-page">
      <button className="btn btn--ghost" onClick={() => navigate("/")}>← Back to Dashboard</button>
      <button className="btn btn--ghost" onClick={() => navigate("/settings")}><Settings size={16} /> Settings</button>
      <div className="analytics-empty">
        <TrendingUp size={36} strokeWidth={1} style={{ color: 'var(--ink-3)' }} />
        <p>No dive data to analyze yet</p>
        <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>Log your first dive to see stats and trends</p>
      </div>
    </div>
  )

  return (
    <div className="analytics-page">
      <button className="btn btn--ghost" onClick={() => navigate("/")}>← Back to Dashboard</button>
      <button className="btn btn--ghost" onClick={() => navigate("/settings")}><Settings size={16} /> Settings</button>
      
      <div className="analytics-container">
        <div className="analytics-header">
          <h2>📊 Dive Analytics Overview</h2>
        </div>

        {totalSafetyFlags > 0 && (
          <div className="analytics-warning-banner">
            <ShieldAlert size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
            <span style={{ fontSize: "13px" }}>
              <strong>Telemetry Flags Raised:</strong> Detected {safetyAlertsCount} structural rate warnings and {criticalPpo2Logs} high $PPO_2$ oxygen toxicity exposure values (&gt;1.40 bar). Review profile configurations.
            </span>
          </div>
        )}

        <div className="stats-strip">
          <div className="stat-pill">
            <Activity size={18} /> 
            <div>
              <span className="pill-label">Total Logs</span>
              <span className="pill-val">{dives.length}</span>
            </div>
          </div>
          <div className="stat-pill">
            <TrendingUp size={18} /> 
            <div>
              <span className="pill-label">Max Depth</span>
              <span className="pill-val">{displayDepth(maxDepth)}</span>
            </div>
          </div>
          <div className="stat-pill">
            <Thermometer size={18} style={{ color: "#f43f5e" }} /> 
            <div>
              <span className="pill-label">Min Temp</span>
              <span className="pill-val">{displayTemp(minTemp)}</span>
            </div>
          </div>
          <div className="stat-pill highlight-sac-pill">
            <Droplets size={18} style={{ color: "var(--accent)" }} /> 
            <div>
              <span className="pill-label">Avg SAC Rate</span>
              <span className="pill-val" style={{ color: "var(--accent)" }}>{avgSacRate} {avgSacRate !== "N/A" ? "bar/min" : ""}</span>
            </div>
          </div>
        </div>

        <div className="analytics-grid-row">
          
          <div className="analytics-card">
            <h3>Depth Profiles Timeline</h3>
            {dives.length < 2 ? (
              <div className="empty-chart-state"><p>Log at least two dives to generate timeline datasets.</p></div>
            ) : (
              <div className="chart-canvas-wrapper">
                <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
                  <path d={areaPath} fill="url(#analyticsAreaGrad)" />
                  <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="analyticsAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(56, 189, 248, 0.2)" />
                      <stop offset="100%" stopColor="rgba(5, 10, 20, 0)" />
                    </linearGradient>
                  </defs>
                  {points.map((p, i) => (
                    <g key={p.id || i} className="node-interactive" onMouseEnter={() => setHoveredNode(p)} onMouseLeave={() => setHoveredNode(null)}>
                      <circle cx={p.x} cy={p.y} r="5" className="node-anchor" />
                    </g>
                  ))}
                </svg>

                {hoveredNode && (
                  <div className="chart-live-tooltip" style={{ left: `${(hoveredNode.x / width) * 100}%`, top: `${(hoveredNode.y / height) * 100}%` }}>
                    <div className="tooltip-title">🤿 {hoveredNode.diveTitle}</div>
                    <div className="tooltip-row">📍 {hoveredNode.location?.split(",")[0]}</div>
                    <div className="tooltip-meta"><span>📅 {hoveredNode.date}</span> <span className="highlight-depth">📉 {displayDepth(hoveredNode.depthMeters)}</span></div>
                    <div className="tooltip-sac"><Droplets size={14} /> SAC Rate: {calculateSAC(hoveredNode) || "N/A"} bar/min</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="analytics-card split-layout-card">
            <div>
              <h3>💨 Breathing Gas Breakdown</h3>
              <p className="card-subtext">Ratio metrics of standard Oxygen compressed air logs against enriched Nitrox blends.</p>
              {dives.length === 0 ? (
                <div className="empty-chart-state"><p>No breathing telemetry compiled.</p></div>
              ) : (
                <div className="gas-bar-container">
                  <div className="gas-flexbox-bar">
                    <div style={{ width: `${nitroxPercentage}%`, background: "#34d399" }} title={`Nitrox: ${nitroxPercentage}%`} />
                    <div style={{ width: `${100 - nitroxPercentage}%`, background: "var(--accent)" }} title={`Standard Air: ${100 - nitroxPercentage}%`} />
                  </div>
                  <div className="gas-legend">
                    <span className="legend-item nitrox-dot"><span /> Nitrox Logs ({nitroxCount})</span>
                    <span className="legend-item air-dot"><span /> Compressed Air ({airCount})</span>
                  </div>
                </div>
              )}
            </div>
            <div className="analytics-tip-footer">
              <Compass size={14} style={{ color: "#a855f7" }} />
              <span>Using Nitrox mixtures properly optimizes ambient deco calculations on deeper profiles.</span>
            </div>
          </div>

        </div>

        <div className="analytics-grid-row" style={{ marginTop: "24px" }}>
          
          <div className="analytics-card split-layout-card">
            <div>
              <h3>🌡️ Thermal Exposure Fingerprint</h3>
              <p className="card-subtext">Categorization of underwater logs divided into distinct water climate structures.</p>
              {dives.length === 0 ? (
                <div className="empty-chart-state"><p>No temperature arrays compiled.</p></div>
              ) : (
                <div className="thermal-distribution-stack">
                  <div className="thermal-row-metric">
                    <span className="thermal-tag"><Flame size={13} style={{ color: "#f97316" }} /> Tropical (&ge;24°C)</span>
                    <div className="thermal-track"><div className="thermal-bar" style={{ width: `${dives.length ? (thermalBins.tropical / dives.length) * 100 : 0}%`, background: "#f97316" }} /></div>
                    <span className="thermal-count">{thermalBins.tropical}</span>
                  </div>
                  <div className="thermal-row-metric">
                    <span className="thermal-tag"><Cloud size={13} style={{ color: "#3b82f6" }} /> Temperate (12°C-23°C)</span>
                    <div className="thermal-track"><div className="thermal-bar" style={{ width: `${dives.length ? (thermalBins.temperate / dives.length) * 100 : 0}%`, background: "#3b82f6" }} /></div>
                    <span className="thermal-count">{thermalBins.temperate}</span>
                  </div>
                  <div className="thermal-row-metric">
                    <span className="thermal-tag"><Snowflake size={13} style={{ color: "#93c5fd" }} /> Frigid (&lt;12°C)</span>
                    <div className="thermal-track"><div className="thermal-bar" style={{ width: `${dives.length ? (thermalBins.frigid / dives.length) * 100 : 0}%`, background: "#93c5fd" }} /></div>
                    <span className="thermal-count">{thermalBins.frigid}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="analytics-card no-fly-zone-card" style={{ borderColor: noFlyHoursLeft > 0 ? "rgba(245, 158, 11, 0.25)" : "rgba(255, 255, 255, 0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3>✈️ No-Fly / Desaturation Countdown</h3>
                <p className="card-subtext">Rolling 24-hour nitrogen residual surface containment requirement before commercial high-altitude flight exposures.</p>
              </div>
              <Plane size={24} style={{ color: noFlyHoursLeft > 0 ? "#f59e0b" : "var(--ink-3)" }} />
            </div>

            {dives.length === 0 ? (
              <div className="empty-chart-state"><p>No log dates available to map desaturation profiles.</p></div>
            ) : noFlyHoursLeft > 0 ? (
              <div className="no-fly-active-display">
                <div className="countdown-timer-value">{noFlyHoursLeft} <span className="unit">Hours Left</span></div>
                <div className="safety-disclaimer-tag">⚠️ Status: Restricted. Standard tissue compartment desaturation cycle is active. Do not board commercial flights.</div>
              </div>
            ) : (
              <div className="no-fly-cleared-display">
                <div className="cleared-pill-badge">Clear to Fly</div>
                <p>Tissue models show residual nitrogen levels have normalized back to baseline metabolic safety limits.</p>
              </div>
            )}
          </div>

        </div>

        <div className="analytics-card records-card-section" style={{ marginTop: "24px" }}>
          <h3>🏆 Personal Milestone Records</h3>
          {dives.length === 0 ? (
            <div className="empty-chart-state"><p>No log records compiled yet. Personal achievements will populate here.</p></div>
          ) : (
            <div className="records-grid-layout">
              
              <div className="record-item-pill" onClick={() => navigate(`/dives/${deepestDive.id}`)}>
                <div className="record-header">
                  <Trophy size={18} style={{ color: "#fbbf24" }} />
                  <span>Deepest Dive</span>
                </div>
                <div className="record-value">{displayDepth(deepestDive?.depthMeters)}</div>
                <div className="record-title-sub">{deepestDive?.diveTitle || "Untitled Log"}</div>
              </div>

              <div className="record-item-pill" onClick={() => navigate(`/dives/${longestDive.id}`)}>
                <div className="record-header">
                  <Clock size={18} style={{ color: "#34d399" }} />
                  <span>Longest Bottom Time</span>
                </div>
                <div className="record-value">{longestDive?.durationMinutes} mins</div>
                <div className="record-title-sub">{longestDive?.diveTitle || "Untitled Log"}</div>
              </div>

              <div className="record-item-pill" onClick={() => lowestSacDive ? navigate(`/dives/${lowestSacDive.id}`) : null} style={{ cursor: lowestSacDive ? "pointer" : "default" }}>
                <div className="record-header">
                  <Droplets size={18} style={{ color: "#60a5fa" }} />
                  <span>Most Efficient SAC</span>
                </div>
                <div className="record-value">
                  {lowestSacDive ? `${calculateSAC(lowestSacDive)} bar/min` : "N/A"}
                </div>
                <div className="record-title-sub">
                  {lowestSacDive ? lowestSacDive.diveTitle : "Gas telemetry missing"}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  )
}