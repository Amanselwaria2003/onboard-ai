import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEmployees, getAllMLStatuses } from '../api'

const STATUS_CONFIG = {
  'On Track': { badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', ring: '#10b981', dot: 'bg-emerald-500' },
  'At Risk':  { badge: 'bg-amber-50 text-amber-700 border border-amber-200',   ring: '#f59e0b', dot: 'bg-amber-500'   },
  'Delayed':  { badge: 'bg-red-50 text-red-700 border border-red-200',           ring: '#ef4444', dot: 'bg-red-500'     },
}

const DEPT_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-purple-100 text-purple-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-orange-100 text-orange-700',
]
const deptColor = (dept) => DEPT_COLORS[(dept || '').charCodeAt(0) % DEPT_COLORS.length]

function ProgressRing({ pct, color = '#6366f1', size = 56, stroke = 5 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

function MetricCard({ label, value, sub, icon, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
          <p className={`text-3xl font-bold ${accent}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent.replace('text-', 'bg-').replace('-600', '-50').replace('-500', '-50')}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function EmployeeCard({ emp, status, onClick }) {
  const cfg = STATUS_CONFIG[status?.status] || STATUS_CONFIG['At Risk']
  const pct = Math.round(status?.percent_complete ?? emp.task_summary.percent_complete)
  const initials = emp.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">{emp.name}</p>
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${deptColor(emp.department)}`}>
              {emp.department || 'No dept'}
            </span>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
          {status?.status ?? 'At Risk'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center">
          <ProgressRing pct={pct} color={cfg.ring} size={56} stroke={5} />
          <span className="absolute text-xs font-bold text-gray-700">{pct}%</span>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">{emp.task_summary.completed} of {emp.task_summary.total} tasks done</p>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(emp.task_summary.total, 8) }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i < emp.task_summary.completed ? 'bg-indigo-500' : 'bg-gray-100'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
        <p className="text-xs text-gray-400">{emp.email}</p>
        <span className="text-xs text-indigo-500 font-medium group-hover:text-indigo-600 transition-colors">
          View →
        </span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [employees, setEmployees] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getEmployees(), getAllMLStatuses()])
      .then(([emps, sts]) => { setEmployees(emps); setStatuses(sts) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const statusMap = Object.fromEntries(statuses.map(s => [s.employee_id, s]))
  const total = employees.length
  const avgPct = total ? Math.round(employees.reduce((a, e) => a + e.task_summary.percent_complete, 0) / total) : 0
  const onTrack = statuses.filter(s => s.status === 'On Track').length
  const delayed = statuses.filter(s => s.status === 'Delayed').length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading dashboard…</p>
      </div>
    </div>
  )
  if (error) return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-5 text-sm">{error}</div>
    </div>
  )

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Onboarding Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">AI-powered progress tracking for new hires</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <MetricCard
          label="Total Employees" value={total} sub="Active onboarding" accent="text-indigo-600"
          icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
        />
        <MetricCard
          label="Avg Completion" value={`${avgPct}%`} sub={`${onTrack} on track`} accent="text-emerald-600"
          icon={<svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        />
        <MetricCard
          label="Delayed" value={delayed} sub="Need attention" accent="text-red-500"
          icon={<svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
      </div>

      {/* Employee grid */}
      {employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          No employees yet. Add some from the Admin Panel.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map(emp => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              status={statusMap[emp.id]}
              onClick={() => navigate(`/employee/${emp.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
