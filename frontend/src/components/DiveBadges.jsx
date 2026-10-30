import { useState, useMemo } from "react"
import {
  Waves, Trophy, Globe2, Snowflake,
  Sun, Camera, Users, FlaskRound, Anchor, Star,
  ChevronDown, Gauge
} from "lucide-react"

const BADGE_DEFS = [
  {
    id: "first-dive",
    icon: Waves,
    label: "First Splash",
    desc: "Logged your first dive",
    color: "var(--accent)",
    check: (dives) => dives.length >= 1,
  },
  {
    id: "ten-dives",
    icon: Trophy,
    label: "Double Digits",
    desc: "10 dives logged",
    color: "#fbbf24",
    check: (dives) => dives.length >= 10,
  },
  {
    id: "fifty-dives",
    icon: Trophy,
    label: "Sea Veteran",
    desc: "50 dives logged",
    color: "#f59e0b",
    check: (dives) => dives.length >= 50,
  },
  {
    id: "century",
    icon: Trophy,
    label: "Century Club",
    desc: "100 dives logged",
    color: "#ef4444",
    check: (dives) => dives.length >= 100,
  },
  {
    id: "deep-diver",
    icon: Anchor,
    label: "Deep Explorer",
    desc: "Dove deeper than 30m",
    color: "#8b5cf6",
    check: (dives) => dives.some((d) => Number(d.depthMeters) >= 30),
  },
  {
    id: "cold-water",
    icon: Snowflake,
    label: "Cold Water Warrior",
    desc: "Dove in water <12°C",
    color: "#93c5fd",
    check: (dives) =>
      dives.some((d) => {
        const t = Number(d.waterTemperatureCelsius)
        return !isNaN(t) && t < 12
      }),
  },
  {
    id: "warm-water",
    icon: Sun,
    label: "Tropical Explorer",
    desc: "Dove in water >=24°C",
    color: "#f97316",
    check: (dives) =>
      dives.some((d) => {
        const t = Number(d.waterTemperatureCelsius)
        return !isNaN(t) && t >= 24
      }),
  },
  {
    id: "nitrox",
    icon: FlaskRound,
    label: "Nitrox Specialist",
    desc: "Used enriched air nitrox",
    color: "#34d399",
    check: (dives) =>
      dives.some(
        (d) =>
          d.gas?.toLowerCase().includes("nitrox") ||
          d.gas?.toLowerCase().includes("ean") ||
          Number(d.oxygenPercentage) > 21
      ),
  },
  {
    id: "world-traveler",
    icon: Globe2,
    label: "World Traveler",
    desc: "Dove at 5+ locations",
    color: "#06b6d4",
    check: (dives) => {
      const locs = new Set(dives.map((d) => d.location?.split(",")[0]?.trim()).filter(Boolean))
      return locs.size >= 5
    },
  },
  {
    id: "shutter-bug",
    icon: Camera,
    label: "Shutter Bug",
    desc: "Has gallery photos",
    color: "#a855f7",
    check: (dives) => dives.some((d) => d.galleryImages?.length > 0),
  },
  {
    id: "buddy-system",
    icon: Users,
    label: "Buddy System",
    desc: "Dove with 5+ buddies",
    color: "#22c55e",
    check: (dives) => {
      const buddies = new Set(dives.map((d) => d.buddy).filter(Boolean))
      return buddies.size >= 5
    },
  },
  {
    id: "sac-master",
    icon: Gauge,
    label: "SAC Master",
    desc: "Achieved <12 bar/min SAC",
    color: "var(--accent)",
    check: (dives) => {
      return dives.some((d) => {
        if (!d.pressureStartBar || !d.pressureEndBar || !d.durationMinutes || !d.depthMeters)
          return false
        const consumed = d.pressureStartBar - d.pressureEndBar
        const volume = d.cylinderVolumeLiters || 12
        const avgATA = 1 + d.depthMeters / 20
        const sac = (consumed * volume) / (d.durationMinutes * avgATA)
        return sac < 12
      })
    },
  },
  {
    id: "star-diver",
    icon: Star,
    label: "Star Diver",
    desc: "A dive marked as favorite",
    color: "#fbbf24",
    check: (dives, favorites) => dives.some((d) => d.location && favorites?.includes(d.location)),
  },
]

export default function DiveBadges({ dives, favoriteSites }) {
  const [showAll, setShowAll] = useState(false)

  const earned = useMemo(() => {
    return BADGE_DEFS.map((b) => ({
      ...b,
      earned: b.check(dives, favoriteSites),
    }))
  }, [dives, favoriteSites])

  const earnedCount = earned.filter((b) => b.earned).length
  const display = showAll ? earned : earned.slice(0, 6)

  if (dives.length === 0) return null

  return (
    <div className="dive-badges-section">
      <div className="dive-badges-header">
        <Trophy size={18} style={{ color: "#fbbf24" }} />
        <span>Achievements</span>
        <span className="dive-badges-count">
          {earnedCount} / {BADGE_DEFS.length}
        </span>
      </div>
      <div className="dive-badges-grid">
        {display.map((badge) => (
          <div
            key={badge.id}
            className={`dive-badge ${badge.earned ? "earned" : "locked"}`}
            title={badge.earned ? badge.desc : "Not yet unlocked"}
          >
            <div
              className="dive-badge-icon"
              style={{
                background: badge.earned
                  ? `rgba(${hexToRgb(badge.color)}, 0.15)`
                  : "rgba(255,255,255,0.03)",
                borderColor: badge.earned
                  ? `${badge.color}44`
                  : "rgba(255,255,255,0.06)",
              }}
            >
              <badge.icon
                size={18}
                style={{
                  color: badge.earned ? badge.color : "rgba(255,255,255,0.15)",
                }}
              />
            </div>
            <span
              className="dive-badge-label"
              style={{
                color: badge.earned ? "var(--ink)" : "rgba(255,255,255,0.25)",
              }}
            >
              {badge.label}
            </span>
          </div>
        ))}
      </div>
      {earned.length > 6 && (
        <button className="dive-badges-toggle" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show less" : `Show all ${earned.length} badges`}
          <ChevronDown size={14} style={{ transform: showAll ? "rotate(180deg)" : "none" }} />
        </button>
      )}
    </div>
  )
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "56, 189, 248"
}
