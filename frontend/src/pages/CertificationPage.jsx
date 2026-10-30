import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { getAllDives, getDiverProfile, getCertifications, createCertification, updateCertification, deleteCertification } from "../api/diveApi"
import { Award, Plus, Trash2, ShieldCheck, Printer, Calendar, ShieldAlert, Loader2, Edit2 } from "lucide-react"
import "./CertificationPage.css"
import EmptyState from "../components/EmptyState"

export default function CertificationPage() {
  const navigate = useNavigate()
  const printRef = useRef()
  
  const [dives, setDives] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [earnedCerts, setEarnedCerts] = useState([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCert, setEditingCert] = useState(null)
  const [newCert, setNewCert] = useState({ agency: "PADI", title: "", date: "", certNumber: "", instructor: "", diveShop: "" })
  const [editCert, setEditCert] = useState({ agency: "PADI", title: "", date: "", certNumber: "", instructor: "", diveShop: "" })
  const dateRef = useRef(null)
  const editDateRef = useRef(null)
  const [saving, setSaving] = useState(false)

  const isMetric = JSON.parse(localStorage.getItem("useMetric") ?? "true")

  useEffect(() => {
    async function load() {
      try {
        const [divesRes, profileRes, certsRes] = await Promise.all([
          getAllDives(),
          getDiverProfile(),
          getCertifications()
        ])
        const sorted = (Array.isArray(divesRes) ? divesRes : [])
          .sort((a, b) => new Date(a.date) - new Date(b.date))
        setDives(sorted)
        setProfile(profileRes)
        setEarnedCerts(Array.isArray(certsRes) ? certsRes : [])
      } catch (err) {
        console.error("Failed to load certification data:", err)
      } finally {
        setLoading(false)
        setApiLoading(false)
      }
    }
    load()
  }, [])

  function formatDepth(m) {
    if (!m) return "—"
    return isMetric ? `${m}m` : `${Math.round(m * 3.28084)}ft`
  }

  function formatTemp(c) {
    if (!c) return "—"
    return isMetric ? `${c}°C` : `${Math.round(c * 9 / 5 + 32)}°F`
  }

  function formatDuration(mins) {
    if (!mins) return "—"
    return `${mins} min`
  }

  async function handleAddCert(e) {
    e.preventDefault()
    const dateVal = dateRef.current ? dateRef.current.value : newCert.date
    if (!newCert.title || !dateVal) return
    setSaving(true)
    setApiError('')
    try {
      const created = await createCertification({
        certificationName: newCert.title,
        agency: newCert.agency,
        dateIssued: dateVal,
        certificationNumber: newCert.certNumber || null,
        instructor: newCert.instructor || null,
        diveShop: newCert.diveShop || null,
        isActive: true
      })
      setEarnedCerts(prev => [created, ...prev])
      setNewCert({ agency: "PADI", title: "", date: "", certNumber: "" })
      setShowAddModal(false)
    } catch (err) {
      setApiError('Failed to save certification')
    }
    setSaving(false)
  }

  function openEdit(cert) {
    setEditCert({
      agency: cert.agency || "PADI",
      title: cert.certificationName || cert.title || "",
      date: cert.dateIssued || cert.date || "",
      certNumber: cert.certificationNumber || cert.certNumber || "",
      instructor: cert.instructor || "",
      diveShop: cert.diveShop || ""
    })
    setEditingCert(cert)
  }

  async function handleEditCert(e) {
    e.preventDefault()
    if (!editingCert) return
    const dateVal = editDateRef.current ? editDateRef.current.value : editCert.date
    if (!editCert.title || !dateVal) return
    setSaving(true)
    setApiError('')
    try {
      const updated = await updateCertification(editingCert.id, {
        certificationName: editCert.title,
        agency: editCert.agency,
        dateIssued: dateVal,
        certificationNumber: editCert.certNumber || null,
        instructor: editCert.instructor || null,
        diveShop: editCert.diveShop || null,
        isActive: true
      })
      setEarnedCerts(prev => prev.map(c => c.id === editingCert.id ? updated : c))
      setEditingCert(null)
    } catch (err) {
      setApiError('Failed to update certification')
    }
    setSaving(false)
  }

  async function handleRemoveCert(id) {
    try {
      await deleteCertification(id)
      setEarnedCerts(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setApiError('Failed to delete certification')
    }
  }

  if (loading) {
    return (
      <div className="cert-loading-container">
        <div className="spinner" />
        <p>Compiling logbook data layers...</p>
      </div>
    )
  }

  const totalDives = dives.length
  const totalMinutes = dives.reduce((sum, d) => sum + (Number(d.durationMinutes) || 0), 0)
  
  const chunkedDives = []
  for (let i = 0; i < dives.length; i += 15) {
    chunkedDives.push(dives.slice(i, i + 15))
  }

  return (
    <div className="certification-wallet-page">
      <div className="wallet-header-controls no-print">
        <button className="back-dashboard-global-btn" onClick={() => navigate("/")}>
          ← Back to Dashboard
        </button>
        <div className="wallet-action-group">
          <button className="add-cert-card-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Certification
          </button>
        </div>
      </div>

      <div className="wallet-layout-container no-print">
        <div className="wallet-sidebar">
          <div className="diver-profile-summary-card">
            <div className="avatar-placeholder">
              <Award size={24} />
            </div>
            <h4>{profile?.email ? profile.email.split("@")[0] : "diver"}</h4>
            <p className="diver-email">{profile?.email || "diver@tauche.io"}</p>
            
            <div className="sidebar-telemetry-badge">
              <span>Logged Dives</span>
              <strong>{totalDives}</strong>
            </div>
            <div className="sidebar-telemetry-badge">
              <span>Bottom Time</span>
              <strong>{Math.round(totalMinutes / 60)}h</strong>
            </div>
          </div>
        </div>

        <div className="wallet-cards-main-view">
          <h3>Verified Training Credentials</h3>
          
          {apiError && <div className="cert-error">{apiError}</div>}
          
          {earnedCerts.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No certifications yet"
              body="Add your training credentials to track your progress."
              actions={<button className="btn btn--primary btn--sm" onClick={() => setShowAddModal(true)}>Add certification</button>}
            />
          ) : (
            <div className="digital-cards-grid">
              {earnedCerts.map((c) => (
                <div key={c.id} className="digital-c-card">
                  <div className="c-card-mesh-pattern" />
                  <div className="c-card-top">
                    <span className="agency-badge">
                      <ShieldCheck size={12} /> {c.agency}
                    </span>
                    <button className="delete-card-action" onClick={() => openEdit(c)} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button className="delete-card-action" onClick={() => handleRemoveCert(c.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="c-card-middle">
                    <h4>{c.certificationName || c.title}</h4>
                  </div>
                  <div className="c-card-bottom">
                    <div className="meta-field">
                      <Calendar size={12} /> {c.dateIssued || c.date}
                    </div>
                    {(c.certificationNumber || c.certNumber) && (
                      <div className="ID-field">
                        <span># {c.certificationNumber || c.certNumber}</span>
                      </div>
                    )}
                    {c.instructor && (
                      <div className="meta-field">
                        Instructor: {c.instructor}
                      </div>
                    )}
                    {c.diveShop && (
                      <div className="meta-field">
                        Dive shop: {c.diveShop}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="print-only-document-wrapper" ref={printRef}>
        <div className="cert-cover page-break-after">
          <div className="cert-cover-watermark">TAUCHE</div>
          <div>
            <div className="cert-anchor-icon">⚓</div>
            <p className="cert-subtitle">Official Scuba Diving Logbook</p>
            <h1 className="cert-title">DEEP TELEMETRY<br />PROFILES</h1>
          </div>
          
          <div className="cert-cover-diver">
            <p className="cert-diver-label">Registered Diver</p>
            <h3 className="cert-diver-name">{profile?.email ? profile.email.split("@")[0].toUpperCase() : "DIVER"}</h3>
            <p className="cert-diver-email">{profile?.email}</p>
          </div>

          <div className="cert-stats-row">
            <div className="cert-stat-box">
              <span className="cert-stat-num">{totalDives}</span>
              <span className="cert-stat-label">Total Dives</span>
            </div>
            <div className="cert-stat-box">
              <span className="cert-stat-num">{Math.round(totalMinutes / 60)}h</span>
              <span className="cert-stat-label">Bottom Time</span>
            </div>
          </div>
        </div>

        {chunkedDives.map((pageDives, pageIdx) => (
          <div key={pageIdx} className="cert-page page-break-after">
            <div className="cert-section-header">
              <span className="cert-section-num">SEC {String(pageIdx + 1).padStart(2, '0')}</span>
              <h2>Dive Entry Logs Record</h2>
            </div>

            <table className="cert-log-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Date</th>
                  <th>Dive Name</th>
                  <th>Location</th>
                  <th>Depth</th>
                  <th>Duration</th>
                  <th>Temp</th>
                  <th>Gas</th>
                  <th>Buddy</th>
                </tr>
              </thead>
              <tbody>
                {pageDives.map((d, i) => (
                  <tr key={d.id} className={i % 2 === 0 ? "cert-row-even" : "cert-row-odd"}>
                    <td className="cert-num-col">{pageIdx * 15 + i + 1}</td>
                    <td>{d.date || "—"}</td>
                    <td className="cert-title-col">{d.diveTitle || "—"}</td>
                    <td className="cert-loc-col">{d.location?.split(",")[0] || "—"}</td>
                    <td>{formatDepth(d.depthMeters)}</td>
                    <td>{formatDuration(d.durationMinutes)}</td>
                    <td>{formatTemp(d.waterTemperatureCelsius)}</td>
                    <td>{d.gas || "—"}</td>
                    <td>{d.buddy || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cert-page-footer">
              <span>{profile?.email}</span>
              <span>Tauche Dive Logbook · {new Date().getFullYear()}</span>
              <span>Page {pageIdx + 2}</span>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="wallet-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="wallet-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Log Achieved Certification</h3>
            <form onSubmit={handleAddCert}>
              <div className="form-element">
                <label>Training Agency</label>
                <select value={newCert.agency} onChange={(e) => setNewCert(p => ({ ...p, agency: e.target.value }))}>
                  <option value="PADI">PADI</option>
                  <option value="SSI">SSI</option>
                  <option value="NAUI">NAUI</option>
                  <option value="CMAS">CMAS</option>
                  <option value="GUE">GUE</option>
                </select>
              </div>
              <div className="form-element">
                <label>Certification Title</label>
                <input type="text" placeholder="Open Water Diver" value={newCert.title} onChange={(e) => setNewCert(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="form-element">
                <label>Date of Issue</label>
                <input type="date" ref={dateRef} defaultValue={newCert.date} required />
              </div>
              <div className="form-element">
                <label>Certification Number</label>
                <input type="text" placeholder="12345678" value={newCert.certNumber} onChange={(e) => setNewCert(p => ({ ...p, certNumber: e.target.value }))} />
              </div>
              <div className="form-element">
                <label>Instructor</label>
                <input type="text" placeholder="Instructor name" value={newCert.instructor} onChange={(e) => setNewCert(p => ({ ...p, instructor: e.target.value }))} />
              </div>
              <div className="form-element">
                <label>Dive Shop / Center</label>
                <input type="text" placeholder="Dive center name" value={newCert.diveShop} onChange={(e) => setNewCert(p => ({ ...p, diveShop: e.target.value }))} />
              </div>
              <div className="form-element">
                <a
                  href="https://blog.padi.com/padi-courses/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--ghost btn--sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  What this certification qualifies for ↗
                </a>
              </div>
              <div className="modal-buttons">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="modal-submit-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCert && (
        <div className="wallet-modal-overlay" onClick={() => setEditingCert(null)}>
          <div className="wallet-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Certification</h3>
            <form onSubmit={handleEditCert}>
              <div className="form-element">
                <label>Training Agency</label>
                <select value={editCert.agency} onChange={(e) => setEditCert(p => ({ ...p, agency: e.target.value }))}>
                  <option value="PADI">PADI</option>
                  <option value="SSI">SSI</option>
                  <option value="NAUI">NAUI</option>
                  <option value="CMAS">CMAS</option>
                  <option value="GUE">GUE</option>
                </select>
              </div>
              <div className="form-element">
                <label>Certification Title</label>
                <input type="text" placeholder="Open Water Diver" value={editCert.title} onChange={(e) => setEditCert(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="form-element">
                <label>Date of Issue</label>
                <input type="date" ref={editDateRef} defaultValue={editCert.date} required />
              </div>
              <div className="form-element">
                <label>Certification Number</label>
                <input type="text" placeholder="12345678" value={editCert.certNumber} onChange={(e) => setEditCert(p => ({ ...p, certNumber: e.target.value }))} />
              </div>
              <div className="form-element">
                <label>Instructor</label>
                <input type="text" placeholder="Instructor name" value={editCert.instructor} onChange={(e) => setEditCert(p => ({ ...p, instructor: e.target.value }))} />
              </div>
              <div className="form-element">
                <label>Dive Shop / Center</label>
                <input type="text" placeholder="Dive center name" value={editCert.diveShop} onChange={(e) => setEditCert(p => ({ ...p, diveShop: e.target.value }))} />
              </div>
              <div className="form-element">
                <a
                  href="https://blog.padi.com/padi-courses/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--ghost btn--sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  What this certification qualifies for ↗
                </a>
              </div>
              <div className="modal-buttons">
                <button type="button" className="modal-cancel-btn" onClick={() => setEditingCert(null)}>Cancel</button>
                <button type="submit" className="modal-submit-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Update Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}