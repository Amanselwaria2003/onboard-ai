import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', role: 'admin', employee_id: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true)
    try {
      const payload = {
        email: form.email, password: form.password, role: form.role,
        ...(form.role === 'employee' && form.employee_id ? { employee_id: parseInt(form.employee_id) } : {}),
      }
      await register(payload)
      setSuccess('Account created! Redirecting to login…')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const inputCls = "w-full bg-white/8 border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all"

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-4">
            <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-white/40 text-sm mt-1">Register a new OnboardAI user</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Email</label>
              <input type="email" required autoFocus value={form.email} onChange={set('email')}
                placeholder="you@company.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Password</label>
              <input type="password" required value={form.password} onChange={set('password')}
                placeholder="••••••••" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Role</label>
              <select value={form.role} onChange={set('role')}
                className="w-full bg-white/8 border border-white/12 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all">
                <option value="admin" className="bg-[#1e293b]">Admin</option>
                <option value="employee" className="bg-[#1e293b]">Employee</option>
              </select>
            </div>
            {form.role === 'employee' && (
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Employee ID</label>
                <input type="number" required value={form.employee_id} onChange={set('employee_id')}
                  placeholder="e.g. 1" min="1" className={inputCls} />
              </div>
            )}

            {error && (
              <div className="bg-red-500/15 border border-red-500/25 text-red-300 text-sm rounded-xl px-4 py-3">{error}</div>
            )}
            {success && (
              <div className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm rounded-xl px-4 py-3">{success}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-indigo-500/25 mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-white/35 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
