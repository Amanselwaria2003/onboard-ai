import { NavLink, useNavigate } from 'react-router-dom'

const role = () => localStorage.getItem('role')

// Icons as inline SVG components
function IconGrid() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M12 3l8 3.5v5c0 4.5-3.5 8-8 9.5C7.5 19.5 4 16 4 11.5v-5L12 3z" />
    </svg>
  )
}
function IconUser() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}
function IconLogout() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M17 16l4-4m0 0l-4-4m4 4H7" /><path d="M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4" />
    </svg>
  )
}
function IconMenu() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
function IconX() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
          isActive
            ? 'bg-indigo-500/20 text-white'
            : 'text-white/50 hover:text-white hover:bg-white/8'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`transition-colors ${isActive ? 'text-indigo-400' : 'text-white/40 group-hover:text-white/70'}`}>
            {icon}
          </span>
          <span>{label}</span>
          {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const userRole = role()
  const email = localStorage.getItem('userId') ? `User #${localStorage.getItem('userId')}` : 'User'
  const initials = (localStorage.getItem('userEmail') || 'U').slice(0, 1).toUpperCase()

  const handleLogout = () => {
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    localStorage.removeItem('employeeId')
    localStorage.removeItem('userEmail')
    navigate('/login', { replace: true })
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none">OnboardAI</p>
            <p className="text-white/40 text-xs mt-0.5">Employee Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="text-white/25 text-xs font-semibold uppercase tracking-widest px-3 mb-3">Main</p>
        {userRole === 'admin' && (
          <>
            <NavItem to="/" end icon={<IconGrid />} label="Dashboard" />
            <NavItem to="/admin" icon={<IconShield />} label="Admin Panel" />
          </>
        )}
        {userRole === 'employee' && (
          <NavItem
            to={`/employee/${localStorage.getItem('employeeId')}`}
            icon={<IconUser />}
            label="My Progress"
          />
        )}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/8">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white/80 text-xs font-medium truncate">{email}</p>
            <p className="text-white/35 text-xs capitalize">{userRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/8 transition-all group"
        >
          <span className="text-white/40 group-hover:text-red-400 transition-colors"><IconLogout /></span>
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[#0f172a] border-r border-white/8 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-64 bg-[#0f172a] h-full flex flex-col z-10">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <IconX />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}

export function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
    >
      <IconMenu />
    </button>
  )
}
