import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getSharedDive, getGalleryImages } from "../api/diveApi"
import { 
  Calendar, 
  MapPin, 
  ArrowDown, 
  Timer, 
  Eye, 
  User, 
  Thermometer, 
  Wind, 
  Gauge, 
  Compass,
  Waves,
  Anchor,
  Maximize2,
  X,
  Camera,
  Layers
} from "lucide-react"
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "./SharedDivePage.css"

export default function SharedDivePage() {
  const { token } = useParams()
  const [dive, setDive] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeLightbox, setActiveLightbox] = useState(null)

  useEffect(() => {
    async function loadSharedData() {
      try {
        if (!token) return
        const diveData = await getSharedDive(token)
        setDive(diveData)

        if (diveData && diveData.id) {
          try {
            const galleryData = await getGalleryImages(diveData.id)
            setImages(Array.isArray(galleryData) ? galleryData : [])
          } catch (galleryErr) {
            console.warn("Public gallery unavailable:", galleryErr)
          }
        }
      } catch (err) {
        setError("This dive log is not available or has been removed.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadSharedData()
  }, [token])

  if (loading) {
    return (
      <div className="shared-page-wrapper loading-state">
        <div className="spinner-box">
          <div className="pulse-ring"></div>
          <p>Connecting Telemetry Stream...</p>
        </div>
      </div>
    )
  }

  if (error || !dive) {
    return (
      <div className="shared-page-wrapper error-state">
        <div className="error-card">
          <div className="lock-icon">🔒</div>
          <h3>Dive Log Secured</h3>
          <p>{error || "The requested link is invalid or has expired."}</p>
          <Link to="/login" className="return-btn">
            Go to Tauche Suite
          </Link>
        </div>
      </div>
    )
  }

  const gasUsedBar = dive.pressureStartBar && dive.pressureEndBar ? dive.pressureStartBar - dive.pressureEndBar : null
  
  let sacRate = null
  if (dive.depthMeters && dive.durationMinutes && gasUsedBar && dive.cylinderVolumeLiters) {
    const avgAtmosphericPressure = (dive.depthMeters / 10) + 1
    const totalLitresUsed = gasUsedBar * dive.cylinderVolumeLiters
    sacRate = (totalLitresUsed / dive.durationMinutes / avgAtmosphericPressure).toFixed(1)
  }

  return (
    <div className="shared-page-wrapper">
      <div className="shared-main-container">
        
        <header className="shared-hero-card">
          <div className="badge-row">
            {dive.diveType && <span className="type-badge">{dive.diveType}</span>}
          </div>
          
          <h2>{dive.diveTitle || "Expedition Dive Log"}</h2>
          
          <div className="hero-meta-grid">
            <div className="meta-pill">
              <Calendar size={15} />
              <span>{dive.date || "Unknown Date"}</span>
            </div>
            <div className="meta-pill">
              <MapPin size={15} />
              <span>{dive.location || "Undisclosed Location"}{dive.diveSite ? ` • ${dive.diveSite}` : ""}</span>
            </div>
            {dive.divePurpose && (
              <div className="meta-pill purpose">
                <Compass size={15} />
                <span>{dive.divePurpose}</span>
              </div>
            )}
          </div>
        </header>

        <div className="shared-dashboard-grid">
          
          <section className="dashboard-card primary-stats">
            <h3 className="card-title"><Anchor size={16} /> Parameters</h3>
            <div className="big-metrics-row">
              <div className="big-stat">
                <span className="stat-lbl">Max Depth</span>
                <span className="stat-val depth">
                  {dive.depthMeters ? `${dive.depthMeters}` : "—"}<span className="unit">{dive.depthMeters && "m"}</span>
                </span>
              </div>
              <div className="big-stat">
                <span className="stat-lbl">Bottom Time</span>
                <span className="stat-val duration">
                  {dive.durationMinutes ? `${dive.durationMinutes}` : "—"}<span className="unit">{dive.durationMinutes && "min"}</span>
                </span>
              </div>
            </div>

            <div className="card-divider"></div>
            <div className="metric-row">
              <div className="row-label"><User size={15} /> <span>Dive Buddy</span></div>
              <span className="row-value">{dive.buddy || "Solo / None Listed"}</span>
            </div>
            {dive.diveCenter && (
              <div className="metric-row">
                <div className="row-label"><Compass size={15} /> <span>Dive Center</span></div>
                <span className="row-value">{dive.diveCenter}</span>
              </div>
            )}
          </section>

          <section className="dashboard-card">
            <h3 className="card-title"><Waves size={16} /> Environmental Analytics</h3>
            <div className="metric-row">
              <div className="row-label"><Thermometer size={15} /> <span>Water Temperature</span></div>
              <span className="row-value highlight-temp">{dive.waterTemperatureCelsius ? `${dive.waterTemperatureCelsius}°C` : "—"}</span>
            </div>
            <div className="metric-row">
              <div className="row-label"><Eye size={15} /> <span>Visibility</span></div>
              <span className="row-value">{dive.visibilityMeters ? `${dive.visibilityMeters}m` : "—"}</span>
            </div>
            <div className="metric-row">
              <div className="row-label"><Anchor size={15} /> <span>Water Classification</span></div>
              <span className="row-value">{dive.waterType || "—"}</span>
            </div>
            <div className="metric-row">
              <div className="row-label"><Wind size={15} /> <span>Weather</span></div>
              <span className="row-value">{dive.weather || "—"}</span>
            </div>
          </section>

          <section className="dashboard-card gas-analytics">
            <h3 className="card-title"><Gauge size={16} /> Gas Dynamics</h3>
            <div className="metric-row">
              <div className="row-label"><span>Gas Mixture</span></div>
              <span className="row-value gas-badge">{dive.gas || "Air (21%)"}</span>
            </div>
            <div className="metric-row">
              <div className="row-label"><span>Cylinder Profile</span></div>
              <span className="row-value">{dive.cylinderVolumeLiters ? `${dive.cylinderVolumeLiters}L Tank` : "—"}</span>
            </div>
            <div className="metric-row">
              <div className="row-label"><span>Pressure Spectrum</span></div>
              <span className="row-value">
                {dive.pressureStartBar || "—"} bar → {dive.pressureEndBar || "—"} bar
              </span>
            </div>
            
            {gasUsedBar && (
              <>
                <div className="card-divider"></div>
                <div className="metric-row analytics-highlight">
                  <div className="row-label"><span>Pressure Delta</span></div>
                  <span className="row-value">-{gasUsedBar} bar ({gasUsedBar * (dive.cylinderVolumeLiters || 0)} L used)</span>
                </div>
              </>
            )}
            
            {sacRate && (
              <div className="metric-row analytics-highlight">
                <div className="row-label"><span>Surface Air Consumption (SAC)</span></div>
                <span className="row-value sac-metric">{sacRate} L/min</span>
              </div>
            )}
          </section>

          {(dive.suit || dive.weightKg) && (
            <section className="dashboard-card">
              <h3 className="card-title"><Layers size={16} /> Configuration & Ballast</h3>
              {dive.suit && (
                <div className="metric-row">
                  <div className="row-label"><span>Exposure Suit</span></div>
                  <span className="row-value">{dive.suit}</span>
                </div>
              )}
              {dive.weightKg && (
                <div className="metric-row">
                  <div className="row-label"><span> Weight</span></div>
                  <span className="row-value">{dive.weightKg} kg</span>
                </div>
              )}
            </section>
          )}

          {dive.latitude && dive.longitude && (
            <section className="dashboard-card map-card span-full">
              <h3 className="card-title"><MapPin size={16} /> Map</h3>
              <div className="shared-map-outer-frame">
                <MapContainer 
                  center={[dive.latitude, dive.longitude]} 
                  zoom={12} 
                  zoomControl={false}
                  className="shared-leaflet-frame"
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  />
                  <CircleMarker 
                    center={[dive.latitude, dive.longitude]} 
                    radius={10}
                    pathOptions={{ color: 'var(--accent)', fillColor: 'var(--accent)', fillOpacity: 0.4, weight: 2 }}
                  >
                    <Popup className="shared-popup-styling">
                      <strong>{dive.diveSite || "Dive Site Location"}</strong>
                    </Popup>
                  </CircleMarker>
                </MapContainer>
              </div>
            </section>
          )}

          {images.length > 0 && (
            <section className="dashboard-card gallery-card span-full">
              <h3 className="card-title"><Camera size={16} /> Gallery </h3>
              <div className="shared-image-flexbox">
                {images.map((img) => (
                  <div key={img.id} className="gallery-thumbnail-wrapper" onClick={() => setActiveLightbox(img)}>
                    <img src={img.url || img.imagePath} alt="Expedition view" />
                    <div className="thumbnail-lens-hover">
                      <Maximize2 size={18} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        <footer className="shared-page-footer">
          <p>Powered by <span className="brand">Tauche</span></p>
        </footer>
      </div>

      {activeLightbox && (
        <div className="shared-lightbox-overlay" onClick={() => setActiveLightbox(null)}>
          <button className="close-lightbox-btn" onClick={() => setActiveLightbox(null)}>
            <X size={24} />
          </button>
          <div className="lightbox-content-frame" onClick={(e) => e.stopPropagation()}>
            <img src={activeLightbox.url || activeLightbox.imagePath} alt="Full scale visualization" />
            {activeLightbox.tags && <div className="lightbox-tag-overlay">{activeLightbox.tags}</div>}
          </div>
        </div>
      )}
    </div>
  )
}