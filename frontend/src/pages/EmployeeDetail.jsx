import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getEmployee, getMLStatus, updateTask } from '../api'

const CATEGORIES = ['document', 'training', 'form', 'meeting']
const CAT_CONFIG = {
  document: { color: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-700', dot: '#6366f1' },
  training: { color: 'bg-purple-500', light: 'bg-purple-50 text-purple-700', dot: '#a855f7' },
  form:     { color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700', dot: '#10b981' },
  meeting:  { color: 'bg-amber-500', light: 'bg-amber-50 text-amber-700', dot: '#f59e0b' },
}
const STATUS_ORDER = ['Not Started', 'In Progress', 'Completed']
const STATUS_BADGE = {
  'On Track': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'At Risk':  'bg-amber-50 text-amber-700 border border-amber-200',
  'Delayed':  'bg-red-50 text-red-700 border border-red-200',
}
const STATUS_SELECT = {
  'Not Started': 'text-gray-600 bg-gray-50 border-gray-200',
  'In Progress': 'text-indigo-600 bg-indigo-50 border-indigo-200',
  'Completed':   'text-emerald-600 bg-emerald-50 border-emerald-200',
}

function ProgressRing({ pct, size = 80, stroke = 7 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#6366f1" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
    </svg>
  )
}

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [emp, setEmp] = useState(null)
  const [mlStatus, setMlStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [taskError, setTaskError] = useState(null)

  const load = useCallback(() => {
    setLoading(true); setError(null)
    Promise.all([getEmployee(id), getMLStatus(id)])
      .then(([e, s]) => { setEmp(e); setMlStatus(s) })
      .catch(() => setError('Failed to load employee data. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (taskId, newStatus) => {
    setTaskError(null)
    try { await updateTask(taskId, { status: newStatus }); load() }
    catch { setTaskError('Failed to update task status.') }
  }

  const role = localStorage.getItem('role')

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    </div>
  )
  if (error) return (
    <div className="p-8">
      {role === 'admin' && (
        <button onClick={() => navigate('/')} className="mb-4 text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to Dashboard
        </button>
      )}
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-5 text-sm">{error}</div>
    </div>
  )
  if (!emp) return null

  const tasks = emp.tasks || []
  const grouped = Object.fromEntries(STATUS_ORDER.map(s => [s, tasks.filter(t => t.status === s)]))
  const pct = Math.round(mlStatus?.percent_complete ?? emp.task_summary.percent_complete)
  const initials = emp.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const chartData = CATEGORIES.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat)
    return {
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      Completed: catTasks.filter(t => t.status === 'Completed').length,
      Remaining: catTasks.filter(t => t.status !== 'Completed').length,
    }
  })

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {role === 'admin' && (
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-sm text-gray-400 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to Dashboard
        </button>
      )}

      {taskError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-5 py-3">{taskError}</div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Profile sidebar */}
        <aside className="lg:w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-6">
            {/* Header band */}
            <div className="h-20 bg-gradient-to-r from-indigo-500 to-purple-600" />
            <div className="px-5 pb-5">
              {/* Avatar */}
              <div className="-mt-10 mb-3">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 border-4 border-white flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {initials}
                </div>
              </div>

              <h2 className="font-bold text-gray-900 text-lg leading-tight">{emp.name}</h2>
              {mlStatus && (
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1 ${STATUS_BADGE[mlStatus.status] || ''}`}>
                  {mlStatus.status}
                </span>
              )}

              {/* Progress ring */}
              <div className="flex items-center gap-4 my-5 p-4 bg-gray-50 rounded-xl">
                <div className="relative flex items-center justify-center">
                  <ProgressRing pct={pct} size={72} stroke={6} />
                  <span className="absolute text-sm font-bold text-gray-800">{pct}%</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-2">Overall Progress</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">{emp.task_summary.completed}</p>
                      <p className="text-xs text-gray-400">Done</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-500">{mlStatus?.overdue_count ?? 0}</p>
                      <p className="text-xs text-gray-400">Overdue</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3">
                {[
                  ['Email', emp.email],
                  ['Department', emp.department || '—'],
                  ['Start Date', emp.start_date || '—'],
                  ['Days Since Start', mlStatus ? `${mlStatus.days_since_start} days` : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex flex-col">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{label}</p>
                    <p className="text-sm text-gray-700 mt-0.5 break-all">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-6 min-w-0">
          {tasks.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400">
              No tasks assigned yet.
            </div>
          ) : (
            STATUS_ORDER.map(status => {
              const group = grouped[status]
              if (!group.length) return null
              const statusDot = { 'Not Started': 'bg-gray-300', 'In Progress': 'bg-indigo-500', 'Completed': 'bg-emerald-500' }
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${statusDot[status]}`} />
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{status}</h3>
                    <span className="text-xs text-gray-300 font-medium">({group.length})</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="space-y-2">
                    {group.map(task => {
                      const cat = CAT_CONFIG[task.category] || CAT_CONFIG.document
                      return (
                        <div key={task.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-indigo-200 hover:shadow-sm transition-all">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cat.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.light}`}>
                                {task.category}
                              </span>
                              {task.due_date && (
                                <span className="text-xs text-gray-400">Due {task.due_date}</span>
                              )}
                            </div>
                          </div>
                          <select
                            value={task.status}
                            onChange={e => handleStatusChange(task.id, e.target.value)}
                            className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-400 cursor-pointer font-medium transition-colors ${STATUS_SELECT[task.status] || 'bg-white border-gray-200 text-gray-600'}`}
                          >
                            {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}

          {/* Chart */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-5">Tasks by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Bar dataKey="Completed" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Remaining" fill="#e5e7eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </main>
      </div>
    </div>
  )
}
