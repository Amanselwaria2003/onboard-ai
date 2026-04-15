import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('role')
    const employeeId = localStorage.getItem('employeeId')
    if (role === 'admin') navigate('/', { replace: true })
    else if (role === 'employee' && employeeId) navigate(`/employee/${employeeId}`, { replace: true })
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login({ email, password })
      localStorage.setItem('role', data.role)
      localStorage.setItem('userId', String(data.userId))
      localStorage.setItem('userEmail', data.email)
      localStorage.setItem('employeeId', data.employeeId != null ? String(data.employeeId) : '')
      if (data.role === 'admin') navigate('/', { replace: true })
      else navigate(`/employee/${data.employeeId}`, { replace: true })
    } catch (err) {
      setPassword('')
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-4">
            <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">OnboardAI</h1>
          <p className="text-white/40 text-sm mt-1">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Email address
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-white/8 border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/8 border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-500/15 border border-red-500/25 text-red-300 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-white/35 mt-6">
            Need an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Register
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 bg-white/4 border border-white/8 rounded-xl p-4 text-xs text-white/40">
          <p className="font-semibold text-white/55 mb-1.5">Demo credentials</p>
          <p>Admin: <span className="font-mono text-white/60">admin@company.com</span> / <span className="font-mono text-white/60">admin123</span></p>
          <p className="mt-0.5">Employee: <span className="font-mono text-white/60">priya@company.com</span> / <span className="font-mono text-white/60">employee123</span></p>
        </div>
      </div>
    </div>
  )
}
