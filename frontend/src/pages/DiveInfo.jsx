import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useToast } from "../context/ToastContext"
import { getDiveById, updateDive, uploadDiveImage, getEquipmentCloset } from "../api/diveApi" 
import {
  Calendar, MapPin, ArrowDown, Timer, Compass, Thermometer,
  Eye, Waves, Cloud, Shirt, Weight, Gauge, User, Building,
  FlaskRound, FileText, Wrench, Share2, Heart, Package, Camera
} from "lucide-react"
import DOMPurify from 'dompurify';
import { shareDive } from '../components/shareUtils'
import MedicalQuestionnaire from './MedicalQuestionnaire'
import GearPackingList from './GearPackingList'
import PhotoGallery from './PhotoGallery'
import StoryExporter from '../components/StoryExporter'
import "./DiveInfo.css"

function formatValueWithUnits(name, value, isMetric) {
  if (value === undefined || value === null || value === "") return "—"
  const num = Number(value)
  if (isNaN(num)) return value 

  switch (name) {
    case "depthMeters":
      return isMetric ? `${num} meters` : `${Math.round(num * 3.28084)} feet`
    case "waterTemperatureCelsius":
      return isMetric ? `${num} °C` : `${Math.round((num * 9) / 5 + 32)} °F`
    case "pressureStartBar":
    case "pressureEndBar":
      return isMetric ? `${num} bar` : `${Math.round(num * 14.5038)} psi`
    case "durationMinutes":
      return `${num} mins`
    case "visibilityMeters":
      return isMetric ? `${num} m` : `${Math.round(num * 3.28084)} ft`
    case "weightKg":
      return isMetric ? `${num} kg` : `${Math.round(num * 2.20462)} lbs`
    default:
      return value
  }
}

function convertMetricToInput(name, value, isMetric) {
  if (value === undefined || value === null || value === "" || isMetric) return value;
  const num = Number(value);
  if (isNaN(num)) return value;

  switch (name) {
    case "depthMeters":
    case "visibilityMeters":
      return (num * 3.28084).toFixed(1);
    case "waterTemperatureCelsius":
      return ((num * 9) / 5 + 32).toFixed(1);
    case "pressureStartBar":
    case "pressureEndBar":
      return Math.round(num * 14.5038);
    case "weightKg":
      return (num * 2.20462).toFixed(1);
    default:
      return value;
  }
}

function convertInputToMetric(name, value, isMetric) {
  if (value === undefined || value === null || value === "" || isMetric) return value;
  const num = Number(value);
  if (isNaN(num)) return value;

  switch (name) {
    case "depthMeters":
    case "visibilityMeters":
      return num / 3.28084;
    case "waterTemperatureCelsius":
      return ((num - 32) * 5) / 9;
    case "pressureStartBar":
    case "pressureEndBar":
      return num / 14.5038;
    case "weightKg":
      return num / 2.20462;
    default:
      return value;
  }
}

function EditableRow({ editing, icon: Icon, label, name, value, onChange, isMetric }) {
  const displayInputValue = editing ? convertMetricToInput(name, value, isMetric) : value;

  return (
    <div className="info-row">
      <div className="info-row-left">
        <Icon size={16} />
        <span className="label">{label}:</span>
      </div>

      {editing ? (
        <input
          className="info-row-input"
          value={displayInputValue ?? ""}
          onChange={(e) => {
            const normalizedMetricValue = convertInputToMetric(name, e.target.value, isMetric);
            onChange(name, normalizedMetricValue);
          }}
        />
      ) : (
        <span className="value">
          {formatValueWithUnits(name, value, isMetric)}
        </span>
      )}
    </div>
  )
}

export default function DiveInfo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [dive, setDive] = useState(null)
  const [formData, setFormData] = useState(null)
  const [mainImageFile, setMainImageFile] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [availableEquipment, setAvailableEquipment] = useState([])
  const [showMedical, setShowMedical] = useState(false)
  const [showPackingList, setShowPackingList] = useState(false)
  const [showStoryExporter, setShowStoryExporter] = useState(false) // Add this state

  const localMetricSetting = localStorage.getItem("useMetric")
  const isMetric = localMetricSetting !== null ? JSON.parse(localMetricSetting) : true

  useEffect(() => {
    async function loadEquipment() {
      try {
        const equipment = await getEquipmentCloset()
        setAvailableEquipment(Array.isArray(equipment) ? equipment : [])
      } catch (err) {
        console.error("Failed to load equipment:", err)
      }
    }
    loadEquipment()
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await getDiveById(id)
        if (!res) return
        const actualData = res?.data ? res.data : res
        if (actualData.equipmentUsed && Array.isArray(actualData.equipmentUsed)) {
          actualData.equipmentIds = actualData.equipmentUsed.map(eq => eq.id)
        }
        setDive(actualData)
        setFormData(actualData)
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!formData?.location || formData.location.length < 2) {
      setSuggestions([])
      return
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.location)}&format=json&limit=5`)
        const data = await res.json()
        setSuggestions(data)
      } catch (err) {
        console.error(err)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [formData?.location])

  function handleEquipmentChange(e) {
    const selectedOptions = Array.from(e.target.selectedOptions)
    const selectedIds = selectedOptions.map(option => parseInt(option.value))
    setFormData(prev => ({ ...prev, equipmentIds: selectedIds }))
  }

  async function handleSave() {
    try {
      let currentDiveState = { ...formData }

      if (!currentDiveState.diveTitle || !currentDiveState.date) {
        toast.error("Dive Title and Date are required.")
        return
      }
      if (!currentDiveState.location) {
        toast.error("Location is required.")
        return
      }
      if (currentDiveState.depthMeters === "" || currentDiveState.depthMeters == null) {
        toast.error("Depth is required.")
        return
      }
      if (currentDiveState.durationMinutes === "" || currentDiveState.durationMinutes == null) {
        toast.error("Duration is required.")
        return
      }
      
      if (mainImageFile) {
        try {
          const updatedDiveFromUpload = await uploadDiveImage(id, mainImageFile)
          const uploadData = updatedDiveFromUpload?.data ? updatedDiveFromUpload.data : updatedDiveFromUpload
          if (uploadData?.imagePath) {
            currentDiveState.imagePath = uploadData.imagePath
            setMainImagePreview(null)
            setMainImageFile(null)
          }
        } catch (uploadErr) {
          console.error(uploadErr)
        }
      }

      const payload = {}
      Object.entries(currentDiveState).forEach(([key, value]) => {
        if ((key === "latitude" || key === "longitude") && (value === "" || value == null)) return
        if (key === "equipmentIds") {
          if (value && value.length > 0) {
            payload[key] = value
          } else {
            payload[key] = []
          }
          return
        }
        const numberFields = ["depthMeters", "durationMinutes", "waterTemperatureCelsius", "visibilityMeters", "weightKg", "pressureStartBar", "pressureEndBar"]
        if (numberFields.includes(key) && value !== "" && value !== null) {
          payload[key] = value.toString().includes(".") ? parseFloat(value) : parseInt(value, 10)
          return
        }
        if (key === "diver" || key === "authorities" || key === "equipmentUsed") return
        if (value !== undefined && value !== null && value !== "") payload[key] = value
      })

      const res = await updateDive(id, payload)
      const backendData = res?.data ? res.data : res
      const freshImagePath = backendData?.imagePath || currentDiveState.imagePath

      setDive(prev => ({ ...prev, ...payload, imagePath: freshImagePath }))
      setFormData(prev => ({ ...prev, ...payload, imagePath: freshImagePath }))
      setIsEditing(false)
    } catch (err) {
      console.error("Error saving dive:", err)
      toast.error("Failed to save changes: " + (err.response?.data?.message || err.message))
    }
  }

  async function handleMainImageChange(file) {
    if (!file) return
    setMainImageFile(file)
    setMainImagePreview(URL.createObjectURL(file))
  }

  if (!dive || !formData) return <div className="dive-detail-page" style={{textAlign:"center", paddingTop:"120px"}}><p>Loading...</p></div>

  const selectedEquipmentNames = formData.equipmentIds && formData.equipmentIds.length > 0
    ? availableEquipment
        .filter(eq => formData.equipmentIds.includes(eq.id))
        .map(eq => eq.name)
        .join(", ")
    : "No equipment logged"

  return (
    <div className="dive-detail-page">
      <button className="btn btn--ghost" onClick={() => navigate("/")}>← Back to Dashboard</button>
      
      <div className="dive-hero">
        <img 
          src={mainImagePreview || (dive.imagePath ? dive.imagePath : "https://placehold.co/600x400?text=Dive")} 
          alt="Dive view" 
        />
        
        {isEditing && (
          <label className="image-upload-btn">📷 Change Main Image
            <input type="file" hidden accept="image/*" onChange={(e) => handleMainImageChange(e.target.files[0])} />
          </label>
        )}
        
        <div className="hero-overlay">
          {isEditing ? (
            <input className="hero-title-input" value={formData.diveTitle || ""} onChange={(e) => setFormData((p) => ({ ...p, diveTitle: e.target.value }))} />
          ) : (
            <h1>{dive.diveTitle || "Uncharted Log Entry"}</h1>
          )}
          <p><MapPin size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} /> {dive.location || "Unknown Coordinates"}</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setShowStoryExporter(true)}
          style={{ 
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            color: '#a855f7',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <Camera size={16} /> Story
        </button>
        
        <button 
          onClick={() => setShowMedical(true)}
          style={{ 
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: 'var(--accent)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <Heart size={16} /> Medical
        </button>
        
        <button 
          onClick={() => setShowPackingList(true)}
          style={{ 
            background: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            color: '#fbbf24',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <Package size={16} /> Packing List
        </button>
        
        <button 
          onClick={async () => {
            try {
              await shareDive(dive || formData, toast)
            } catch (err) {
              console.error('Share error:', err)
              toast.error('Failed to share. Please try again.')
            }
          }}
          style={{ 
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <Share2 size={16} /> Share
        </button>
      </div>

      {showStoryExporter && (
        <div className="story-modal-overlay" onClick={() => setShowStoryExporter(false)}>
          <div className="story-modal" onClick={e => e.stopPropagation()}>
            <button className="story-close" onClick={() => setShowStoryExporter(false)}>×</button>
            <StoryExporter dive={dive} />
          </div>
        </div>
      )}

      <div className="dive-grid-info">
        <div className="info-card">
          <h3>Core Dive</h3>
          <EditableRow editing={isEditing} icon={Calendar} label="Date" name="date" value={formData.date} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
          <div className="info-row">
            <div className="info-row-left"><MapPin size={16} /><span className="label">Location:</span></div>
            {isEditing ? (
              <div style={{ position: "relative", flex: 1, width: "100%", minWidth: 0 }}>
                <input className="info-row-input" value={formData.location || ""} onChange={(e) => { setFormData((p) => ({ ...p, location: e.target.value })); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions">
                    {suggestions.map((s) => (
                      <div key={s.place_id} className="suggestion-item" onMouseDown={() => { setFormData(prev => ({ ...prev, location: s.display_name, latitude: parseFloat(s.lat), longitude: parseFloat(s.lon) })); setSuggestions([]); setShowSuggestions(false); }}>{s.display_name}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : <span className="value">{formData.location || "-"}</span>}
          </div>
          <EditableRow editing={isEditing} icon={ArrowDown} label="Depth" name="depthMeters" value={formData.depthMeters} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
          <EditableRow editing={isEditing} icon={Timer} label="Duration" name="durationMinutes" value={formData.durationMinutes} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
          <EditableRow editing={isEditing} icon={Compass} label="Type" name="diveType" value={formData.diveType} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
        </div>

        <div className="info-card">
          <h3>Conditions</h3>
          <EditableRow editing={isEditing} icon={Waves} label="Water" name="waterType" value={formData.waterType} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
          <EditableRow editing={isEditing} icon={Thermometer} label="Temp" name="waterTemperatureCelsius" value={formData.waterTemperatureCelsius} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
          <EditableRow editing={isEditing} icon={Eye} label="Visibility" name="visibilityMeters" value={formData.visibilityMeters} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
          <EditableRow editing={isEditing} icon={Cloud} label="Weather" name="weather" value={formData.weather} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
        </div>

        <div className="info-card">
          <h3>Equipment</h3>
          <EditableRow editing={isEditing} icon={Shirt} label="Suit" name="suit" value={formData.suit} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
          <EditableRow editing={isEditing} icon={FlaskRound} label="Gas" name="gas" value={formData.gas} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
          <EditableRow editing={isEditing} icon={Weight} label="Weight" name="weightKg" value={formData.weightKg} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
          <EditableRow editing={isEditing} icon={Gauge} label="Start Pressure" name="pressureStartBar" value={formData.pressureStartBar} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
          <EditableRow editing={isEditing} icon={Gauge} label="End Pressure" name="pressureEndBar" value={formData.pressureEndBar} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
        </div>

        <div className="info-card">
          <h3><Wrench size={16} style={{ display: "inline", marginRight: "6px" }} /> Gear Used</h3>
          <div className="info-row">
            <div className="info-row-left">
              <Wrench size={16} />
              <span className="label">Equipment:</span>
            </div>
            {isEditing ? (
              <div style={{ position: "relative", flex: 1, width: "100%" }}>
                <select
                  multiple
                  value={formData.equipmentIds || []}
                  onChange={handleEquipmentChange}
                  style={{ 
                    width: "100%", 
                    minHeight: "120px", 
                    background: "rgba(5, 10, 20, 0.4)",
                    border: "1px solid rgba(144, 224, 239, 0.15)",
                    borderRadius: "8px",
                    color: "#caf0f8",
                    padding: "8px",
                    boxSizing: "border-box"
                  }}
                >
                  {availableEquipment.length === 0 && (
                    <option disabled>No equipment registered. Add gear in Equipment Locker first.</option>
                  )}
                  {availableEquipment.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.category}) {eq.requiresService ? "⚠️ Service Due" : ""}
                    </option>
                  ))}
                </select>
                <small style={{ color: 'var(--ink-3)', fontSize: '11px', display: 'block', marginTop: '5px' }}>
                  Hold Ctrl/Cmd to select multiple items
                </small>
              </div>
            ) : (
              <span className="value">{selectedEquipmentNames}</span>
            )}
          </div>
        </div>

        <div className="info-card">
          <h3>People</h3>
          <EditableRow editing={isEditing} icon={User} label="Buddy" name="buddy" value={formData.buddy} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
          <EditableRow editing={isEditing} icon={Building} label="Dive Center" name="diveCenter" value={formData.diveCenter} onChange={(k, v) => setFormData((p) => ({ ...p, [k]: v }))} isMetric={isMetric} />
        </div>

        <div className="info-card notes-card" style={{ gridColumn: "1 / -1" }}>
          <h3><FileText size={18} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} /> Dive Log Notes</h3>
          {isEditing ? (
            <textarea
              className="info-row-input"
              style={{ width: "100%", minHeight: "100px", background: "rgba(5, 10, 20, 0.4)", border: "1px solid rgba(144, 224, 239, 0.15)", borderRadius: "8px", color: "#caf0f8", padding: "10px", boxSizing: "border-box" }}
              value={formData.notes || ""}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            />
          ) : (
            <div 
              className="notes-content-view" 
              style={{ color: "var(--ink-3)", fontSize: "14px", lineHeight: "1.6", marginTop: "10px" }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(dive.notes || "No log commentary available for this session.") }} 
            />
          )}
        </div>
      </div>

      <h3 style={{ marginTop: '32px', marginBottom: '16px', color: 'var(--accent)' }}>📸 Dive Photo Gallery</h3>
      <PhotoGallery diveId={id} />

      {showMedical && (
        <MedicalQuestionnaire 
          onClose={() => setShowMedical(false)}
          onComplete={() => {
            console.log('Medical questionnaire completed')
          }}
        />
      )}

      {showPackingList && dive?.diveType && (
        <GearPackingList 
          diveType={dive.diveType}
          onClose={() => setShowPackingList(false)}
        />
      )}

      <button className="submit-btn" onClick={() => (isEditing ? handleSave() : setIsEditing(true))}>
        {isEditing ? "Save Log Changes" : "Edit Parameters"}
      </button>
    </div>
  )
}