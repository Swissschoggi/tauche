import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { registerUser } from "../api/diveApi"
import { Waves } from "lucide-react"
import "./LoginPage.css"

export default function RegisterPage() {
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  function validateRegistration() {
    const { email, password, confirmPassword } = formData
    if (!email || !password || !confirmPassword) return "All fields are required."
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return "Enter a valid email address."
    if (password.length < 8) return "Password must be at least 8 characters."
    if (!/[A-Z]/.test(password)) return "Password needs an uppercase letter."
    if (!/[a-z]/.test(password)) return "Password needs a lowercase letter."
    if (!/[0-9]/.test(password)) return "Password needs a number."
    if (password !== confirmPassword) return "Passwords do not match."
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    const validationError = validateRegistration()
    if (validationError) { setError(validationError); return }
    setIsLoading(true)
    try {
      const res = await registerUser(formData.email, formData.password)
      localStorage.setItem("user_session_token", res.data.token)
      navigate("/", { replace: true })
    } catch (err) {
      const serverMessage = err.response?.data?.message || "Could not create account."
      setError(serverMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-mark"><Waves size={22} strokeWidth={2} /></div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Start your dive logbook</p>
        </div>

        {error && <div className="auth-error" role="alert"><span>{error}</span></div>}

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="field">
            <label className="field__label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" inputMode="email" autoComplete="email"
              value={formData.email} onChange={handleChange} placeholder="diver@ocean.com"
              disabled={isLoading} required />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password"
              value={formData.password} onChange={handleChange} placeholder="At least 8 chars, 1 number, 1 uppercase"
              disabled={isLoading} required />
            <span className="field__hint">8+ characters, uppercase, lowercase, number.</span>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="confirmPassword">Confirm password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password"
              value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••"
              disabled={isLoading} required />
          </div>
          <button type="submit" className="btn btn--primary btn--lg" disabled={isLoading} aria-busy={isLoading}>
            {isLoading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="auth-switch">
          <span className="text-muted">Already have an account? </span>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
