export default function Spinner({ size = 20, label }) {
  return (
    <span role="status" aria-live="polite" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      <span className="spinner" style={{ width: size, height: size }} />
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}
