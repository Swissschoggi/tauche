import { useState } from "react"
import { Upload, X } from "lucide-react"
import { createDive } from "../api/diveApi"
import { useToast } from "../context/ToastContext"
import "./DiveComputerImport.css"

const COLUMN_ALIASES = {
  diveTitle: ["dive", "divename", "title", "divetitle", "site", "divesite"],
  date: ["date", "divedate", "day"],
  location: ["location", "site", "place", "divesite", "dive site"],
  depthMeters: ["maxdepth", "max depth", "depth", "depthm", "depth (m)", "maxdepthm"],
  durationMinutes: ["divetime", "duration", "time", "bottomtime", "diveduration", "duration (min)"],
  waterTemperatureCelsius: ["watertemp", "temp", "water temp", "temperature", "watertemperature"],
  visibilityMeters: ["visibility", "vis"],
  buddy: ["buddy", "partner"],
  notes: ["notes", "comment", "comments", "remark", "remarks"],
}

function normalize(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { headers: [], rows: [] }
  const parseLine = (line) => {
    const out = []
    let cur = ""
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') { inQ = !inQ; continue }
      if (c === "," && !inQ) { out.push(cur); cur = ""; continue }
      cur += c
    }
    out.push(cur)
    return out.map((v) => v.trim())
  }
  const headers = parseLine(lines[0])
  const rows = lines.slice(1).filter((l) => l.trim()).map(parseLine)
  return { headers, rows }
}

function mapColumns(headers) {
  const map = {}
  headers.forEach((h, i) => {
    const n = normalize(h)
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some((a) => normalize(a) === n) && map[field] === undefined) {
        map[field] = i
      }
    }
  })
  return map
}

export default function DiveComputerImport({ onDone }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [colMap, setColMap] = useState({})
  const [importing, setImporting] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const { headers: h, rows: r } = parseCSV(text)
    setHeaders(h)
    setRows(r)
    setColMap(mapColumns(h))
  }

  const doImport = async () => {
    if (!rows.length) return
    setImporting(true)
    let ok = 0, fail = 0
    for (const row of rows) {
      const payload = {}
      for (const [field, idx] of Object.entries(colMap)) {
        const v = row[idx]
        if (v === undefined || v === "") continue
        if (["depthMeters", "durationMinutes", "waterTemperatureCelsius", "visibilityMeters"].includes(field)) {
          const n = Number(v)
          if (!isNaN(n)) payload[field] = n
        } else {
          payload[field] = v
        }
      }
      if (!payload.diveTitle) payload.diveTitle = payload.location || "Imported dive"
      if (!payload.date) payload.date = new Date().toISOString().slice(0, 10)
      try {
        await createDive(payload)
        ok++
      } catch (err) {
        console.error(err)
        fail++
      }
    }
    setImporting(false)
    setOpen(false)
    setRows([])
    if (ok) toast.success(`Imported ${ok} dive${ok === 1 ? "" : "s"}`)
    if (fail) toast.error(`Failed to import ${fail} dive${fail === 1 ? "" : "s"}`)
    onDone?.()
  }

  return (
    <>
      <button className="btn-dashboard-nav" onClick={() => setOpen(true)} title="Import dive computer CSV">
        <Upload size={20} /> Import
      </button>
      {open && (
        <div className="dci-overlay" onClick={() => setOpen(false)}>
          <div className="dci-card" onClick={(e) => e.stopPropagation()}>
            <div className="dci-header">
              <h3>Import dive computer CSV</h3>
              <button className="dci-close" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <p className="dci-help">
              Upload a CSV export from your dive computer or logbook. Columns are auto-mapped (Date, Location, Max Depth, Dive Time, Water Temp, …).
            </p>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} />
            {rows.length > 0 && (
              <>
                <p className="dci-preview">{rows.length} rows detected. Preview:</p>
                <div className="dci-table-wrap">
                  <table className="dci-table">
                    <thead>
                      <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 3).map((r, i) => (
                        <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="dci-map">
                  {Object.keys(COLUMN_ALIASES).map((field) => (
                    <label key={field} className="dci-map-row">
                      <span>{field}</span>
                      <select
                        value={colMap[field] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value
                          setColMap((prev) => {
                            const next = { ...prev }
                            if (v === "") delete next[field]
                            else next[field] = Number(v)
                            return next
                          })
                        }}
                      >
                        <option value="">— ignore —</option>
                        {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              </>
            )}
            <div className="dci-actions">
              <button className="dci-btn dci-btn--ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="dci-btn" onClick={doImport} disabled={importing || rows.length === 0}>
                {importing ? "Importing…" : `Import ${rows.length} dive${rows.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
