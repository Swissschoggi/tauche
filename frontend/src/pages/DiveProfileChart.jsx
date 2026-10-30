export default function DiveProfileChart({ maxDepth, durationMinutes }) {
  const points = `0,10 40,10 120,${Math.min(maxDepth * 2, 140)} 360,${Math.min(maxDepth * 2, 140)} 440,20 480,20 500,10`;

  return (
    <div className="info-card full">
      <h3>📈 Dive Profile View</h3>
      <div className="profile-chart-container">
        <svg viewBox="0 0 500 160" width="100%" height="100%">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(144, 224, 239, 0.3)" />
              <stop offset="100%" stopColor="rgba(0, 119, 182, 0.0)" />
            </linearGradient>
          </defs>
          <path d={`M ${points} L 500,160 L 0,160 Z`} fill="url(#grad)" />
          <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}