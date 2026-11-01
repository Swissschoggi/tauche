import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Waves, Check, X, Edit3, Loader2 } from 'lucide-react'
import {
  getTripById,
  getAllDives,
  addDiveToTrip,
  removeDiveFromTrip,
  updateTrip
} from '../api/diveApi'
import './TripDetailPage.css'
import { useToast } from "../context/ToastContext"

export default function TripDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [trip, setTrip] = useState(null)
  const [availableDives, setAvailableDives] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddDives, setShowAddDives] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ tripName: '', destination: '', description: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      setError('')
      const tripData = await getTripById(id)
      setTrip(tripData)
      setFormData({
        tripName: tripData.tripName,
        destination: tripData.destination,
        description: tripData.description || ''
      })

      const allDives = await getAllDives()
      const addedDiveIds = new Set(tripData.dives ? tripData.dives.map(d => d.id) : [])
      const available = allDives.filter(d => !addedDiveIds.has(d.id))
      setAvailableDives(available)
    } catch (err) {
      console.error('Failed to load detail contexts:', err)
      setError('Failed to fetch trip details. Your authentication might have expired.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddDive(diveId) {
    try {
      await addDiveToTrip(id, diveId)
      await loadData()
    } catch (err) {
      console.error('Failed to bind dive track:', err)
      toast.error('Could not attach dive. Verify server permissions.')
    }
  }

  async function handleRemoveDive(diveId, e) {
    e.stopPropagation()
    try {
      await removeDiveFromTrip(id, diveId)
      await loadData()
    } catch (err) {
      console.error('Failed to sever dive context linkage:', err)
    }
  }

  async function handleSave() {
    if (!formData.tripName || !formData.destination) {
      toast.error('Trip name and destination cannot be empty!')
      return
    }
    try {
      await updateTrip(id, formData)
      setIsEditing(false)
      await loadData()
    } catch (err) {
      console.error('Failed to push inline modifications:', err)
      toast.error('Update failed. Ensure token credentials are still valid.')
    }
  }

  if (loading) {
    return (
      <div className="trip-detail-page">
        <div className="loading-state">
          <Loader2 className="spinner" size={32} />
          <p>Analyzing dive log groupings...</p>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="trip-detail-page">
        <div className="error-fallback">
          <p>{error || 'The requested dive trip could not be found.'}</p>
          <button className="trips-back-btn" onClick={() => navigate('/trips')}>
            Return to Trips
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="trip-detail-page">
      <button className="trips-back-btn" onClick={() => navigate('/trips')}>
        <ArrowLeft size={16} /> Back to Trips
      </button>

      <div className="trip-detail-content">
        <div className="trip-detail-header-wrapper">
          {isEditing ? (
            <div className="edit-form-inline">
              <div className="input-row-inline">
                <input
                  type="text"
                  className="inline-edit-input title-input"
                  value={formData.tripName}
                  onChange={(e) => setFormData({ ...formData, tripName: e.target.value })}
                  placeholder="Trip Name"
                />
                <input
                  type="text"
                  className="inline-edit-input dest-input"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Destination Location"
                />
              </div>
              <textarea
                className="inline-edit-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Trip Description / Planning notes..."
                rows={2}
              />
              <div className="edit-actions-row">
                <button onClick={handleSave} className="action-btn save"><Check size={14} /> Save</button>
                <button onClick={() => setIsEditing(false)} className="action-btn cancel"><X size={14} /> Cancel</button>
              </div>
            </div>
          ) : (
            <div className="title-display-block">
              <div className="header-text">
                <h1>{trip.tripName}</h1>
                <p className="destination-subtitle">{trip.destination}</p>
              </div>
              <button onClick={() => setIsEditing(true)} className="btn-secondary-edit">
                <Edit3 size={14} /> Edit Details
              </button>
            </div>
          )}
        </div>

        <div className="trip-overview">
          <div className="overview-card">
            <h3>Duration</h3>
            <p>{trip.durationDays || 0} Days</p>
          </div>
          <div className="overview-card">
            <h3>Dives Logged</h3>
            <p>{trip.diveCount || 0}</p>
          </div>
          <div className="overview-card">
            <h3>Avg Depth</h3>
            <p>{trip.averageDepth ? trip.averageDepth.toFixed(1) : '0.0'}m</p>
          </div>
          <div className="overview-card">
            <h3>Avg Temp</h3>
            <p>{trip.averageTemperature ? trip.averageTemperature.toFixed(1) : '0.0'}°C</p>
          </div>
        </div>

        {trip.description && !isEditing && (
          <div className="trip-detail-description">
            <h3>Notes & Logistics</h3>
            <p>{trip.description}</p>
          </div>
        )}

        <div className="dives-section">
          <div className="section-header">
            <h2>Linked Dive Site Profiles</h2>
            <button
              onClick={() => setShowAddDives(!showAddDives)}
              className="btn-primary-action"
            >
              <Plus size={16} /> {showAddDives ? 'Close Selection' : 'Link Logged Dives'}
            </button>
          </div>

          {showAddDives && (
            <div className="available-dives">
              <h3>Select Tracked Dives to Associate</h3>
              {availableDives.length === 0 ? (
                <p className="empty-selection-text">No floating dive logs found within timeframe or everything is mapped.</p>
              ) : (
                <ul className="available-dives-list">
                  {availableDives.map(dive => (
                    <li key={dive.id} className="available-dive-item">
                      <div className="item-meta">
                        <span className="title">{dive.diveTitle || `Dive #${dive.id}`}</span>
                        <span className="sub">{new Date(dive.diveDate).toLocaleDateString()} · {dive.diveSiteName || 'No Location Label'}</span>
                      </div>
                      <button onClick={() => handleAddDive(dive.id)} className="btn-add-link">
                        + Link Log
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!trip.dives || trip.dives.length === 0 ? (
            <div className="empty-state">
              <Waves size={32} />
              <p>No logged dive runs are attached to this trip window yet.</p>
            </div>
          ) : (
            <div className="dives-list">
              {trip.dives.map((dive, idx) => (
                <div key={dive.id} className="dive-item">
                  <span className="dive-number">{idx + 1}</span>
                  <div className="dive-info">
                    <h4>{dive.diveTitle || 'Dive Track Run'}</h4>
                    <p>{new Date(dive.diveDate).toLocaleDateString()} — {dive.diveSiteName || 'Unlabeled Coordinates'}</p>
                    <p className="dive-stats">Max Depth: {dive.depthMeters || dive.maxDepth || '0'}m · Duration: {dive.durationMinutes || '0'} min</p>
                  </div>
                  <button
                    onClick={(e) => handleRemoveDive(dive.id, e)}
                    className="remove-btn"
                    title="Sever Linkage"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}