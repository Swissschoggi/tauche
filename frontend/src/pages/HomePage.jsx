import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { getAllDives, deleteDive, getImageUrl } from "../api/diveApi"
import { BarChart3, Map, Plus, User, Settings, Award, Wrench, Trash2, Star, MapPin, TowerControl, Waves, Fish, MoreHorizontal, X, Sun, Moon, HelpCircle } from "lucide-react"
import { useFavorites } from '../hooks/useFavorites'
import { useToast } from "../context/ToastContext"
import EmptyState from "../components/EmptyState"
import ErrorState from "../components/ErrorState"
import { useConfirm } from "../context/ConfirmContext"
import { useTheme } from "../context/ThemeContext"
import OnboardingTour from "../components/OnboardingTour"
import DiveComputerImport from "../components/DiveComputerImport"
import SkeletonCard from '../components/SkeletonCard'
import DiveCalendar from '../components/DiveCalendar'
import DiveBadges from '../components/DiveBadges'
import "./HomePage.css"

export default function HomePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const { theme, toggle: toggleTheme } = useTheme()
  const [dives, setDives] = useState([])
  const [diveImages, setDiveImages] = useState({})
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const undoTimers = useRef({})
  const removedDives = useRef({})
  
  const { favoriteSites, toggleFavoriteSite } = useFavorites()

  useEffect(() => {
    if (localStorage.getItem("tauche_tour_done") !== "1") {
      const t = setTimeout(() => setTourOpen(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const loadDives = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getAllDives()
      if (res) {
        setDives(res)
        const imageMap = {}
        await Promise.all(
          res.map(async (d) => {
            if (d.imagePath) {
              imageMap[d.id] = await getImageUrl(d.imagePath)
            }
          })
        )
        setDiveImages(imageMap)
      }
    } catch (err) {
      console.error("Failed loading data dashboard entries:", err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDives()
  }, [])

  function toggleSelectCard(id, e) {
    e.stopPropagation()
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  async function handleDeleteSelected() {
    const ok = await confirm({
      title: "Delete selected dives?",
      message: `Delete ${selectedIds.length} logged ${selectedIds.length === 1 ? "entry" : "entries"}? This cannot be undone.`,
      confirmText: "Delete",
      danger: true,
    })
    if (!ok) return
    try {
      await Promise.all(selectedIds.map(id => deleteDive(id)))
      setDives(prev => prev.filter(d => !selectedIds.includes(d.id)))
      setSelectedIds([])
      toast.success("Selected dives deleted")
    } catch (err) {
      console.error("Deletion queue failure:", err)
      toast.error("Failed to delete selected dives. Please try again.")
    }
  }

  function handleDeleteSingle(id, diveTitle, e) {
    e.stopPropagation()
    const diveToDelete = dives.find(d => d.id === id)
    if (!diveToDelete) return
    setDives(prev => prev.filter(d => d.id !== id))
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
    removedDives.current[id] = diveToDelete

    const timer = setTimeout(async () => {
      try {
        await deleteDive(id)
      } catch (err) {
        console.error("Failed to delete dive:", err)
        setDives(prev => [removedDives.current[id], ...prev])
        toast.error("Failed to delete dive. Restored.")
      } finally {
        delete undoTimers.current[id]
        delete removedDives.current[id]
      }
    }, 5000)
    undoTimers.current[id] = timer

    toast.info(`"${diveTitle || "Untitled"}" deleted`, {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(undoTimers.current[id])
          delete undoTimers.current[id]
          const restored = removedDives.current[id]
          delete removedDives.current[id]
          if (restored) setDives(prev => [restored, ...prev])
          toast.success("Dive restored")
        },
      },
    })
  }

  return (
    <>
      <div className="dive-list-page">
      <div className="header">
        <h1>Tauche</h1>

        <div className="header-actions">
          {selectedIds.length > 0 && (
            <button className="btn-danger" onClick={handleDeleteSelected}>
              Delete ({selectedIds.length})
            </button>
          )}

          <button className="btn-primary-action" onClick={() => navigate("/new")}>
            <Plus size={18} />
            New Log
          </button>

          <DiveComputerImport onDone={loadDives} />

          <button className="btn-dashboard-nav" onClick={() => navigate("/sites")}>
            <MapPin size={20} />
            Sites
          </button>

          <button className="btn-dashboard-nav" onClick={() => navigate("/trips")}>
            <TowerControl size={20} />
            Trips
          </button>

          <button className="btn-dashboard-nav" onClick={() => navigate("/map")}>
            <Map size={20} />
            Map
          </button>

          <button className="btn-dashboard-nav" onClick={() => navigate("/analytics")}>
            <BarChart3 size={20} />
            Stats
          </button>

          <button className="btn-dashboard-nav" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className="btn-dashboard-nav" onClick={() => setTourOpen(true)} title="Take a tour">
            <HelpCircle size={20} />
          </button>

          <div className="home-more-menu">
            <button
              className="btn-dashboard-nav"
              onClick={() => setMoreMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={moreMenuOpen}
              title="More"
            >
              <MoreHorizontal size={20} />
            </button>
            {moreMenuOpen && (
              <>
                <div className="home-more-backdrop" onClick={() => setMoreMenuOpen(false)} />
                <div className="home-more-dropdown" role="menu">
                  <button role="menuitem" onClick={() => { navigate("/equipment"); setMoreMenuOpen(false) }}>
                    <Wrench size={16} /> Gear
                  </button>
                  <button role="menuitem" onClick={() => { navigate("/certification"); setMoreMenuOpen(false) }}>
                    <Award size={16} /> Certs
                  </button>
                  <button role="menuitem" onClick={() => { navigate("/sightings"); setMoreMenuOpen(false) }}>
                    <Fish size={16} /> Sightings
                  </button>
                  <button role="menuitem" onClick={() => { navigate("/settings"); setMoreMenuOpen(false) }}>
                    <Settings size={16} /> Settings
                  </button>
                  <button role="menuitem" onClick={() => { navigate("/profile"); setMoreMenuOpen(false) }}>
                    <User size={16} /> Profile
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {favoriteSites.length > 0 && (
        <div className="favorites-filter-bar">
          <span className="favorites-filter-bar-label">
            <Star size={16} fill="#fbbf24" color="#fbbf24" />
            Favorite Sites:
          </span>
          {favoriteSites.map(site => (
            <span key={site} className="favorites-filter-bar-site">
              {site.split(',')[0]}
            </span>
          ))}
        </div>
      )}

      <DiveCalendar dives={dives} />

      {!loading && dives.length > 0 && (
        <DiveBadges dives={dives} favoriteSites={favoriteSites} />
      )}

      {loading ? (
        <div className="dive-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState title="Couldn't load your dives" body="Check your connection and try again." onRetry={loadDives} />
      ) : dives.length === 0 ? (
        <EmptyState
          icon={Waves}
          title="No dives logged yet"
          body="Your logbook is empty. Add your first dive to start tracking depth, time, and sites."
          actions={<button className="btn btn--primary" onClick={() => navigate("/new")}>Log your first dive</button>}
        />
      ) : (
        <div className="dive-grid">
          {dives.map(d => {
            const isChecked = selectedIds.includes(d.id)
            const isFavorite = d.location && favoriteSites.includes(d.location)
            
            return (
              <div
                key={d.id}
                className={`dive-card ${isChecked ? "selected" : ""}`}
                onClick={() => navigate(`/dives/${d.id}`)}
                style={isFavorite ? { borderLeft: '3px solid #fbbf24' } : {}}
              >
                <div className="dive-card-actions">
                  <div
                    className={`checkbox ${isChecked ? "checked" : ""}`}
                    onClick={(e) => toggleSelectCard(d.id, e)}
                  >
                    {isChecked && "✓"}
                  </div>
                  <button
                    className="delete-single-btn"
                    onClick={(e) => handleDeleteSingle(d.id, d.diveTitle, e)}
                    title="Delete dive"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="dive-image-wrapper">
                  <img
                    className="dive-image"
                    src={diveImages[d.id] || "https://placehold.co/600x400?text=Dive"}
                    alt={d.diveTitle}
                  />
                </div>

                <div className="dive-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>{d.diveTitle || "Untitled Expedition"}</h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavoriteSite(d.location)
                      }}
                      style={{ 
                        background: 'transparent', 
                        padding: '4px',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Star 
                        size={18} 
                        fill={isFavorite ? '#fbbf24' : 'none'}
                        color="#fbbf24"
                      />
                    </button>
                  </div>
                  <p className="location">📍 {d.location || "Unknown Coordinates"}</p>
                  <div className="dive-tags">
                    {d.depthMeters && <span>{d.depthMeters}m</span>}
                    {d.durationMinutes && <span>⏱ {d.durationMinutes} min</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    <OnboardingTour
      isOpen={tourOpen}
      onClose={() => { setTourOpen(false); localStorage.setItem("tauche_tour_done", "1") }}
      steps={[
        { target: ".header h1", title: "Welcome to Tauche", body: "Your dive logbook and analytics dashboard." },
        { target: ".btn-primary-action", title: "Log a dive", body: "Click here to record a new dive." },
        { target: ".header-actions", title: "Navigate", body: "Jump to sites, trips, map, stats and more." },
        { target: ".dive-grid", title: "Your dives", body: "Your logged dives appear here. Click a card for full details." },
      ]}
    />
    </>
  )
}