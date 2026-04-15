import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const role = localStorage.getItem('role')

  const linkClass = (path) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      pathname === path
        ? 'bg-white/10 text-white'
        : 'text-white/60 hover:text-white hover:bg-white/10'
    }`

  const handleLogout = () => {
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    localStorage.removeItem('employeeId')
    navigate('/login', { replace: true })
  }

  return (
    <nav className="bg-[#1e3a5f] sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="text-white font-bold text-lg tracking-tight">⬡ OnboardAI</span>
        <div className="flex items-center gap-1">
          {role === 'admin' && (
            <>
              <Link to="/" className={linkClass('/')}>Dashboard</Link>
              <Link to="/admin" className={linkClass('/admin')}>Admin Panel</Link>
            </>
          )}
          <button
            onClick={handleLogout}
            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
