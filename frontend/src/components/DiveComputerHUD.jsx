import { useMemo } from "react"
import { calculateSAC } from "./DiveCalculations"

const SEGMENT_STYLE = {
  fontFamily: "'Courier New', monospace",
  letterSpacing: "2px",
  textShadow: "0 0 8px rgba(56, 189, 248, 0.4)",
}

function SegDisplay({ value, unit, label, color = "var(--accent)", size = "md" }) {
  const fontSize = size === "lg" ? 36 : size === "sm" ? 13 : 18
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          ...SEGMENT_STYLE,
          fontSize,
          color,
          fontWeight: 700,
          lineHeight: 1.1,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: 2,
        }}
      >
        {value}
        {unit && <span style={{ fontSize: fontSize * 0.45, opacity: 0.7, fontWeight: 400 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "1px", marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}

function getNoFlyHours(dives) {
  if (!dives.length) return 0
  const sorted = [...dives].sort((a, b) => new Date(b.date) - new Date(a.date))
  const last = sorted[0]
  const dt = new Date(`${last.date}T${last.timeOut || "12:00"}`)
  const hoursSince = (new Date() - dt) / (1000 * 60 * 60)
  return Math.max(0, 24 - hoursSince)
}

export default function DiveComputerHUD({ dives }) {
  const stats = useMemo(() => {
    if (!dives.length) return null
    const sorted = [...dives].sort((a, b) => new Date(a.date) - new Date(b.date))
    const lastDive = sorted[sorted.length - 1]
    const maxDepth = Math.max(...dives.map((d) => Number(d.depthMeters) || 0))
    const totalTime = dives.reduce((s, d) => s + (Number(d.durationMinutes) || 0), 0)
    const validSacs = dives.map((d) => parseFloat(calculateSAC(d))).filter((v) => !isNaN(v) && v > 0)
    const avgSac = validSacs.length ? (validSacs.reduce((a, b) => a + b, 0) / validSacs.length).toFixed(1) : "--"
    const noFly = getNoFlyHours(dives)
    const lastTemp = lastDive?.waterTemperatureCelsius
    return { maxDepth, totalTime, avgSac, noFly, lastTemp, lastDive, diveCount: dives.length }
  }, [dives])

  if (!stats) return null

  return (
    <div className="dive-computer-hud">
      <div className="dive-computer-bezel">
        <div className="dive-computer-screen">
          <div className="dch-top-bar">
            <span className="dch-brand">TAUCHE</span>
            <span className="dch-mode">DIVE</span>
          </div>

          <div className="dch-depth-area">
            <SegDisplay
              value={stats.lastDive?.depthMeters || stats.maxDepth}
              unit="m"
              label="Current Depth"
              color="var(--accent)"
              size="lg"
            />
          </div>

          <div className="dch-mid-row">
            <SegDisplay
              value={stats.totalTime}
              unit="min"
              label="Bottom Time"
              color="#34d399"
              size="sm"
            />
            <SegDisplay
              value={stats.lastDive?.waterTemperatureCelsius ?? "--"}
              unit="°C"
              label="Water Temp"
              color="#f97316"
              size="sm"
            />
            <SegDisplay
              value={stats.avgSac}
              unit="b/m"
              label="SAC Rate"
              color="#a855f7"
              size="sm"
            />
          </div>

          <div className="dch-bottom-row">
            <SegDisplay
              value={stats.diveCount}
              unit=""
              label="Total Dives"
              color="#eab308"
              size="sm"
            />
            <SegDisplay
              value={stats.noFly > 0 ? stats.noFly.toFixed(1) : "CLR"}
              unit={stats.noFly > 0 ? "h" : ""}
              label="No-Fly"
              color={stats.noFly > 0 ? "#ef4444" : "#22c55e"}
              size="sm"
            />
            <SegDisplay
              value={stats.maxDepth}
              unit="m"
              label="Max Depth"
              color="var(--accent)"
              size="sm"
            />
          </div>

          <div className="dch-status-bar">
            <span className={`dch-led ${stats.noFly > 0 ? "warning" : "safe"}`} />
            <span>{stats.noFly > 0 ? "DESAT ACTIVE" : "CLEAR TO FLY"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
