import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllDives } from '../api/diveApi'
import { MapPin, Star, Calendar, Activity, Search, TrendingUp, Droplets, Eye, Plus, RefreshCw, X } from 'lucide-react'
import { useDiveSites } from '../hooks/useDiveSites'
import "./DiveSiteDatabase.css"
import { useToast } from "../context/ToastContext"

export default function DiveSiteDatabase() {
  const navigate = useNavigate()
  const toast = useToast()
  const { sites, favoriteSites, toggleFavorite, addSite, importFromDives } = useDiveSites()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [newSite, setNewSite] = useState({
    name: '',
    location: '',
    depth: '',
    notes: ''
  })

  useEffect(() => {
    const importExistingDives = async () => {
      try {
        const dives = await getAllDives()
        if (dives && dives.length > 0) {
          importFromDives(dives)
        }
      } catch (err) {
        console.error('Failed to import dives:', err)
      }
    }
    importExistingDives()
  }, [importFromDives])

  const handleManualImport = async () => {
    setIsImporting(true)
    try {
      const dives = await getAllDives()
      if (dives && dives.length > 0) {
        importFromDives(dives)
        toast.success(`Imported ${dives.length} dives into dive sites!`)
      } else {
        toast.info('No dives found to import')
      }
    } catch (err) {
      console.error('Failed to import dives:', err)
      toast.error('Failed to import dives')
    } finally {
      setIsImporting(false)
    }
  }
  
  const filteredSites = sites.filter(site => 
    site.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const sortedSites = [...filteredSites].sort((a, b) => (b.diveCount || 0) - (a.diveCount || 0))

  const handleAddSite = (e) => {
    e.preventDefault()
    if (!newSite.name) return
    
    addSite({
      name: newSite.name,
      location: newSite.location,
      depth: parseFloat(newSite.depth) || 0,
      notes: newSite.notes ? [{ text: newSite.notes, date: new Date().toISOString() }] : []
    })
    
    setNewSite({ name: '', location: '', depth: '', notes: '' })
    setShowAddModal(false)
  }
  
  return (
    <div className="dive-sites-page">
      <button className="btn btn--ghost" onClick={() => navigate("/")}>
        ← Back to Dashboard
      </button>
      
      <div className="dive-sites-container">
        <div className="sites-header">
          <div>
            <h3>
              <MapPin size={24} /> Dive Site Database
            </h3>
            <p>Track and manage your favorite dive locations</p>
          </div>
          <div className="header-buttons">
            <button className="import-btn" onClick={handleManualImport} disabled={isImporting}>
              <RefreshCw size={16} className={isImporting ? 'spinning' : ''} />
              {isImporting ? 'Importing...' : 'Import from Dives'}
            </button>
            <button className="add-site-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Dive Site
            </button>
          </div>
        </div>
        
        <div className="search-bar">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search by site name or location..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="sites-stats">
          <div className="stat-badge">
            <span className="stat-value">{sites.length}</span>
            <span className="stat-label">Total Sites</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value">{sites.reduce((sum, s) => sum + (s.diveCount || 0), 0)}</span>
            <span className="stat-label">Total Dives</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value">{favoriteSites.length}</span>
            <span className="stat-label">Favorites</span>
          </div>
        </div>
        
        {sites.length === 0 ? (
          <div className="empty-sites-state">
            <MapPin size={48} strokeWidth={1} />
            <p>No dive sites yet</p>
            <small>Click "Import from Dives" to load sites from your existing dives, or "Add Dive Site" to create one manually</small>
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="empty-sites-state">
            <Search size={48} strokeWidth={1} />
            <p>No matching dive sites found</p>
            <small>Try a different search term</small>
          </div>
        ) : (
          <div className="sites-grid">
            {sortedSites.map(site => (
              <div key={site.id} className="site-card" onClick={() => setSelectedSite(site)}>
                <div className="site-card-header">
                  <h4>{site.name}</h4>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(site.id) }}
                    className={`favorite-btn ${favoriteSites.includes(site.id) ? 'active' : ''}`}
                  >
                    <Star size={16} fill={favoriteSites.includes(site.id) ? '#fbbf24' : 'none'} />
                  </button>
                </div>
                
                <p className="site-location">{site.location || 'Unknown location'}</p>
                
                <div className="site-stats">
                  <div className="site-stat">
                    <Activity size={12} />
                    <span>{site.diveCount || 0} dives</span>
                  </div>
                  <div className="site-stat">
                    <TrendingUp size={12} />
                    <span>{site.avgDepth?.toFixed(1) || '-'}m avg</span>
                  </div>
                  <div className="site-stat">
                    <Calendar size={12} />
                    <span>{site.lastVisited ? new Date(site.lastVisited).toLocaleDateString() : '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Site Modal */}
      {showAddModal && (
        <div className="site-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="site-modal add-site-modal" onClick={e => e.stopPropagation()}>
            <button className="site-modal-close" onClick={() => setShowAddModal(false)}>×</button>
            
            <div className="site-modal-header">
              <h2>Add New Dive Site</h2>
              <p className="modal-subtitle">Add a dive location to your personal database</p>
            </div>
            
            <form onSubmit={handleAddSite} className="add-site-form">
              <div className="form-group">
                <label>Site Name <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Blue Corner Wall"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  required
                  className="modern-input"
                />
                <small>Give your dive site a memorable name</small>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Location / Region</label>
                  <input
                    type="text"
                    placeholder="e.g., Palau, Micronesia"
                    value={newSite.location}
                    onChange={(e) => setNewSite({ ...newSite, location: e.target.value })}
                    className="modern-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Avg Depth (meters)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g., 18"
                    value={newSite.depth}
                    onChange={(e) => setNewSite({ ...newSite, depth: e.target.value })}
                    className="modern-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  placeholder="Add notes about this dive site (marine life, conditions, tips)..."
                  rows="4"
                  value={newSite.notes}
                  onChange={(e) => setNewSite({ ...newSite, notes: e.target.value })}
                  className="modern-textarea"
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn-modern" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn-modern">
                  <Plus size={16} /> Create Dive Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Site Detail Modal */}
      {selectedSite && (
        <div className="site-modal-overlay" onClick={() => setSelectedSite(null)}>
          <div className="site-modal" onClick={e => e.stopPropagation()}>
            <button className="site-modal-close" onClick={() => setSelectedSite(null)}>×</button>
            
            <div className="site-modal-header">
              <h2>{selectedSite.name}</h2>
              <div className="site-modal-stats">
                <div className="modal-stat">
                  <span className="modal-stat-value">{selectedSite.diveCount || 0}</span>
                  <span className="modal-stat-label">Total Dives</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-value">{selectedSite.avgDepth?.toFixed(1) || '-'}m</span>
                  <span className="modal-stat-label">Avg Depth</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-value">{selectedSite.conditions?.length || 0}</span>
                  <span className="modal-stat-label">Condition Logs</span>
                </div>
              </div>
            </div>
            
            <div className="site-modal-body">
              <div className="site-info-section">
                <h4>📍 Location</h4>
                <p>{selectedSite.location || 'Unknown location'}</p>
              </div>
              
              {selectedSite.notes && selectedSite.notes.length > 0 && (
                <div className="site-info-section">
                  <h4>📝 Site Notes</h4>
                  {selectedSite.notes.map((note, i) => (
                    <div key={i} className="site-note">
                      <div className="note-date">{new Date(note.date).toLocaleDateString()}</div>
                      <p>{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}