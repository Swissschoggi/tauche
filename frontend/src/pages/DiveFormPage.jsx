import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { createDive, updateDive, getDiveById, getEquipmentCloset, getBuddies } from "../api/diveApi"
import { diveFormSchema } from "../form/diveFormSchema"
import { Settings } from "lucide-react"
import { TANK_PRESETS } from '../constants/tankPresets'
import { useToast } from "../context/ToastContext"
import { useDiveSites } from '../hooks/useDiveSites'
import "./DiveFormPage.css"

export default function DiveFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const locationTimeoutRef = useRef(null)

  const [form, setForm] = useState(() => {
    const initialState = {}
    diveFormSchema.forEach((field) => {
      initialState[field.name] = field.type === "multiselect" ? [] : ""
    })
    initialState.latitude = null
    initialState.longitude = null
    initialState.imagePath = null
    return initialState
  })

  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showBuddySuggestions, setShowBuddySuggestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [availableEquipment, setAvailableEquipment] = useState([])
  const [showTankPresets, setShowTankPresets] = useState(false)
  const [buddyList, setBuddyList] = useState([])

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
    async function loadBuddies() {
      try {
        const buddies = await getBuddies()
        setBuddyList(Array.isArray(buddies) ? buddies : [])
      } catch (err) {
        console.error("Failed to load buddies:", err)
      }
    }
    loadBuddies()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTankPresets && !event.target.closest('.tank-presets-container')) {
        setShowTankPresets(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTankPresets])

  useEffect(() => {
    if (!id) return

    async function loadDive() {
      try {
        const res = await getDiveById(id)
        const sanitizedData = { ...res }
        
        if (sanitizedData.equipmentUsed && Array.isArray(sanitizedData.equipmentUsed)) {
          sanitizedData.equipmentIds = sanitizedData.equipmentUsed.map(eq => eq.id)
        }
        
        Object.keys(sanitizedData).forEach(key => {
          if (sanitizedData[key] === null) sanitizedData[key] = ""
        })
        setForm(prev => ({ ...prev, ...sanitizedData }))
      } catch (error) {
        console.error("Failed to recover target dive entity:", error)
        setFormError("Could not retrieve dive logs.")
      }
    }

    loadDive()
  }, [id])

  useEffect(() => {
    if (!form.location || form.location.trim().length < 3) {
      setSuggestions([])
      return
    }

    if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current)

    locationTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.location)}&format=json&limit=5`
        )
        if (!response.ok) throw new Error("Network address lookup failure")
        const data = await response.json()
        setSuggestions(data)
      } catch (err) {
        console.error("Geocoding lookup failed:", err)
      }
    }, 400)

    return () => {
      if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current)
    }
  }, [form.location])

  function handleChange(e) {
    const { name, value, files } = e.target
    const fieldDefinition = diveFormSchema.find(f => f.name === name)

    let parsedValue = value

    if (files) {
      parsedValue = files[0]
    } else if (fieldDefinition?.type === "number" && value !== "") {
      parsedValue = value.includes(".") ? parseFloat(value) : parseInt(value, 10)
    }

    setForm((prev) => ({
      ...prev,
      [name]: parsedValue,
    }))
  }

  function handleEquipmentChange(e) {
    const selectedOptions = Array.from(e.target.selectedOptions)
    const selectedIds = selectedOptions.map(option => parseInt(option.value))
    setForm(prev => ({ ...prev, equipmentIds: selectedIds }))
  }

  function processPayload() {
    const cleanData = {}
    Object.keys(form).forEach((key) => {
      const val = form[key]
      if (key === "equipmentIds") {
        if (val && val.length > 0) {
          cleanData[key] = val
        }
      } else if (val !== "" && val !== undefined && val !== null) {
        cleanData[key] = val
      }
    })
    if (!id) delete cleanData.id
    return cleanData
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError("")
    setIsSubmitting(true)

    const payload = processPayload()

    if (!payload.diveTitle || !payload.date) {
      setFormError("Dive Title and Date are required.")
      setIsSubmitting(false)
      return
    }
    if (!payload.location) {
      setFormError("Location is required.")
      setIsSubmitting(false)
      return
    }
    if (!payload.depthMeters) {
      setFormError("Depth (m) is required.")
      setIsSubmitting(false)
      return
    }
    if (!payload.durationMinutes) {
      setFormError("Duration (min) is required.")
      setIsSubmitting(false)
      return
    }

    try {
      if (id) await updateDive(id, payload) 
      else await createDive(payload) 
      toast.success(id ? "Dive updated" : "Dive logged")
      navigate("/")
    } catch (error) {
      setFormError(error.response?.data?.message || "Failed to save.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="dive-form-page">
      <button className="btn btn--ghost" onClick={() => navigate("/")}>← Back to Dashboard</button>
      <button className="btn btn--ghost" onClick={() => navigate("/settings")}><Settings size={16} /> Settings</button>
      
      <div className="card">
        <h2>{id ? "Edit Dive Log" : "Log New Dive"}</h2>
        {formError && <div className="form-error-banner">{formError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {diveFormSchema.map((field) => {
            const isTextArea = field.type === "textarea" || field.name === "notes"
            const isFullWidth = isTextArea || field.name === "location" || field.type === "file" || field.name === "equipmentIds"

            if (field.name === "equipmentIds") {
              return (
                <div key={field.name} className="form-group full-width-group">
                  <label htmlFor={field.name}>{field.label}{field.required ? " *" : ""}</label>
                  <select
                    id={field.name}
                    name={field.name}
                    multiple
                    value={form.equipmentIds || []}
                    onChange={handleEquipmentChange}
                    disabled={isSubmitting}
                    style={{ minHeight: "120px" }}
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
                  <small style={{ color: 'var(--ink-3)', fontSize: '11px' }}>
                    Hold Ctrl/Cmd to select multiple items. Equipment usage will count toward service intervals.
                  </small>
                </div>
              )
            }

            if (field.name === "cylinderVolumeLiters") {
              return (
                <div key={field.name} className="form-group tank-presets-container" style={{ position: 'relative' }}>
                  <label htmlFor={field.name}>{field.label}{field.required ? " *" : ""}</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      id={field.name}
                      name={field.name}
                      value={form[field.name] || ""}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      step="0.1"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTankPresets(!showTankPresets)}
                      style={{ 
                        padding: '8px 12px', 
                        background: 'rgba(56,189,248,0.2)',
                        border: '1px solid rgba(56,189,248,0.3)',
                        whiteSpace: 'nowrap',
                        borderRadius: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      📦 Presets
                    </button>
                  </div>
                  {showTankPresets && (
                    <div className="tank-presets-dropdown" style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: 'var(--surface-2)',
                      border: '1px solid rgba(56,189,248,0.3)',
                      borderRadius: '12px',
                      zIndex: 1000,
                      maxHeight: '250px',
                      overflowY: 'auto',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                    }}>
                      {Object.entries(TANK_PRESETS).map(([key, preset]) => (
                        <div
                          key={key}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            transition: 'background 0.2s'
                          }}
                          onMouseDown={() => {
                            setForm(prev => ({ ...prev, cylinderVolumeLiters: preset.volumeLiters }))
                            setShowTankPresets(false)
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ fontWeight: '600', color: '#f8fafc' }}>{preset.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--ink-3)' }}>
                            {preset.volumeLiters}L @ {preset.workingPressureBar}bar - {preset.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div 
                key={field.name} 
                className={`form-group ${isFullWidth ? "full-width-group" : ""}`}
              >
                <label htmlFor={field.name}>{field.label}{field.required ? " *" : ""}</label>

                {field.name === "location" ? (
                  <div style={{ position: "relative" }}>
                    <input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={form.location || ""}
                      onChange={(e) => {
                        handleChange(e)
                        setShowSuggestions(true)
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      disabled={isSubmitting}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="suggestions">
                        {suggestions.map((s) => (
                          <div
                            key={s.place_id}
                            className="suggestion-item"
                            onMouseDown={() => {
                              setForm((prev) => ({
                                ...prev,
                                location: s.display_name,
                                latitude: parseFloat(s.lat),
                                longitude: parseFloat(s.lon),
                              }))
                              setSuggestions([])
                              setShowSuggestions(false)
                            }}
                          >
                            {s.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : field.name === "buddy" ? (
                  <div style={{ position: "relative" }}>
                    <input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={form.buddy || ""}
                      onChange={handleChange}
                      onFocus={() => setShowBuddySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowBuddySuggestions(false), 200)}
                      disabled={isSubmitting}
                      placeholder="Type a name or select a buddy..."
                    />
                    {showBuddySuggestions && buddyList.length > 0 && (
                      <div className="suggestions">
                        {buddyList.map(b => (
                          <div
                            key={b.id}
                            className="suggestion-item"
                            onMouseDown={() => {
                              setForm(prev => ({ ...prev, buddy: b.buddyEmail }))
                              setShowBuddySuggestions(false)
                            }}
                          >
                            {b.buddyEmail}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={form[field.name] || ""}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : isTextArea ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={form[field.name] || ""}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="Enter notes about visibility, marine life, thermoclines, equipment configurations..."
                  />
                ) : (
                  <input
                    id={field.name}
                    type={field.type}
                    name={field.name}
                    value={form[field.name] || ""}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                )}
              </div>
            );
          })}

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : id ? "Update Dive Log" : "Commit Dive Log"}
          </button>
        </form>
      </div>
    </div>
  )
}