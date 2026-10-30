import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { loginUser } from "../api/diveApi"
import { Waves } from "lucide-react"
import "./LoginPage.css"

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  function handleChange(e) {
    const { name, value } = e.target
    setCredentials(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const res = await loginUser(credentials.email, credentials.password)
      localStorage.setItem("user_session_token", res.data.token)
      const originPath = location.state?.from?.pathname || "/"
      navigate(originPath, { replace: true })
    } catch (err) {
      const serverMessage = err.response?.data?.message || "Email or password is incorrect."
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
          <h1 className="auth-title">Tauche</h1>
          <p className="auth-subtitle">Sign in to your dive logbook</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="field">
            <label className="field__label" htmlFor="email">Email</label>
            <input
              id="email" name="email" type="email" inputMode="email"
              autoComplete="email" value={credentials.email}
              onChange={handleChange} placeholder="diver@ocean.com"
              disabled={isLoading} required aria-invalid={!!error}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password"
              autoComplete="current-password" value={credentials.password}
              onChange={handleChange} placeholder="••••••••"
              disabled={isLoading} required
            />
          </div>

          <button type="submit" className="btn btn--primary btn--lg" disabled={isLoading} aria-busy={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="auth-switch">
          <span className="text-muted">New to Tauche? </span>
          <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  )
}
