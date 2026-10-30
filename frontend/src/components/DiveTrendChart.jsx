import React from "react"

export default function DiveTrendChart({ allDives = [] }) {
  const validDives = [...allDives]
    .filter(d => d.date && d.depthMeters)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (validDives.length < 2) {
    return (
      <div className="info-card full">
        <h3>📊 Depth Trends Over Time</h3>
        <p style={{ color: "var(--muted)", fontSize: "14px", padding: "10px 0" }}>
          Log at least two dives with dates and depth values to generate a timeline trend analysis.
        </p>
      </div>
    )
  }

  const chartWidth = 500
  const chartHeight = 140
  const paddingX = 40
  const paddingY = 20

  const maxDepth = Math.max(...validDives.map(d => Number(d.depthMeters)))
  const ceilingMax = maxDepth > 0 ? maxDepth * 1.15 : 40

  const pointsCount = validDives.length
  const usableWidth = chartWidth - paddingX * 2
  const usableHeight = chartHeight - paddingY * 2

  const coordinateMap = validDives.map((dive, index) => {
    const x = paddingX + (index / (pointsCount - 1)) * usableWidth
    const y = paddingY + (Number(dive.depthMeters) / ceilingMax) * usableHeight
    return { x, y, depth: dive.depthMeters, date: dive.date, title: dive.diveTitle }
  })

  const linePath = coordinateMap.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")
  const areaPath = `${linePath} L ${coordinateMap[pointsCount - 1].x},${chartHeight} L ${coordinateMap[0].x},${chartHeight} Z`

  return (
    <div className="info-card full">
      <h3>📊 Depth Trends Over Time</h3>
      <div className="trend-chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trendAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.25)" />
              <stop offset="100%" stopColor="rgba(2, 6, 23, 0.0)" />
            </linearGradient>
          </defs>

          <g stroke="rgba(255,255,255,0.04)" strokeWidth="1">
            <line x1="0" y1={paddingY} x2={chartWidth} y2={paddingY} />
            <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} />
            <line x1="0" y1={chartHeight - paddingY} x2={chartWidth} y2={chartHeight - paddingY} />
          </g>

          <path d={areaPath} fill="url(#trendAreaGrad)" />
          <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {coordinateMap.map((p, i) => (
            <g key={i} className="trend-node-group">
              <circle cx={p.x} cy={p.y} r="4" fill="var(--base)" stroke="var(--accent)" strokeWidth="2" />
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                {p.depth}m
              </text>
              <text x={p.x} y={chartHeight - 4} textAnchor="middle" fill="var(--muted)" fontSize="8" fontFamily="sans-serif">
                {p.date ? p.date.substring(5) : ""}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}