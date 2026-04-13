import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEmployees, getAllMLStatuses } from '../api'

const STATUS_COLORS = {
  'On Track': { badge: 'bg-green-500/20 text-green-400 border border-green-500/30', bar: 'bg-green-500' },
  'At Risk':  { badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',  bar: 'bg-amber-500'  },
  'Delayed':  { badge: 'bg-red-500/20 text-red-400 border border-red-500/30',         bar: 'bg-red-500'    },
}

function MetricCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function EmployeeCard({ emp, status, onClick }) {
  const colors = STATUS_COLORS[status?.status] || STATUS_COLORS['At Risk']
  const pct = status?.percent_complete ?? emp.task_summary.percent_complete

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-gray-900">{emp.name}</p>
          <p className="text-sm text-gray-500">{emp.department}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>
          {status?.status ?? 'At Risk'}
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${colors.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{emp.task_summary.completed}/{emp.task_summary.total} tasks done</span>
        <span className="font-medium text-gray-700">{Math.round(pct)}%</span>
      </div>

      <button className="mt-4 w-full text-sm text-blue-600 border border-blue-200 rounded-lg py-1.5 hover:bg-blue-50 transition-colors">
        View Details →
      </button>
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
  const avgPct = total
    ? Math.round(employees.reduce((a, e) => a + e.task_summary.percent_complete, 0) / total)
    : 0
  const delayed = statuses.filter(s => s.status === 'Delayed').length

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
  )
  if (error) return (
    <div className="p-8 text-red-500">Error: {error} — is the Flask backend running on port 5000?</div>
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Onboarding Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">AI-powered progress tracking for new hires</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricCard label="Total Employees" value={total} color="text-blue-600" />
        <MetricCard label="Avg Completion" value={`${avgPct}%`} color="text-green-600" />
        <MetricCard label="Delayed" value={delayed} color="text-red-500" />
      </div>

      {/* Employee grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {employees.map(emp => (
          <EmployeeCard
            key={emp.id}
            emp={emp}
            status={statusMap[emp.id]}
            onClick={() => navigate(`/employee/${emp.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
