import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getEmployee, getMLStatus, updateTask } from '../api'

const CATEGORIES = ['document', 'training', 'form', 'meeting']
const CAT_COLORS = {
  document: 'bg-blue-500',
  training: 'bg-purple-500',
  form: 'bg-green-500',
  meeting: 'bg-amber-500',
}
const STATUS_ORDER = ['Not Started', 'In Progress', 'Completed']
const STATUS_BADGE = {
  'On Track': 'bg-green-500/20 text-green-600 border border-green-500/30',
  'At Risk':  'bg-amber-500/20 text-amber-600 border border-amber-500/30',
  'Delayed':  'bg-red-500/20 text-red-600 border border-red-500/30',
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
    setLoading(true)
    setError(null)
    Promise.all([getEmployee(id), getMLStatus(id)])
      .then(([e, s]) => { setEmp(e); setMlStatus(s) })
      .catch(e => setError('Failed to load employee data. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (taskId, newStatus) => {
    setTaskError(null)
    try {
      await updateTask(taskId, { status: newStatus })
      load()
    } catch {
      setTaskError('Failed to update task status. Please try again.')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
  )
  if (error) return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors">
        ← Back to Dashboard
      </button>
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-5">{error}</div>
    </div>
  )
  if (!emp) return null

  const tasks = emp.tasks || []
  const grouped = Object.fromEntries(STATUS_ORDER.map(s => [s, tasks.filter(t => t.status === s)]))

  const chartData = CATEGORIES.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat)
    return {
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      Completed: catTasks.filter(t => t.status === 'Completed').length,
      Remaining: catTasks.filter(t => t.status !== 'Completed').length,
    }
  })

  const pct = mlStatus?.percent_complete ?? emp.task_summary.percent_complete

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/')}
        className="mb-6 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        ← Back to Dashboard
      </button>

      {taskError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {taskError}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm md:sticky md:top-20">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg mb-3">
              {emp.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <h2 className="font-bold text-gray-900 text-lg">{emp.name}</h2>
            {mlStatus && (
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1 mb-4 ${STATUS_BADGE[mlStatus.status] || ''}`}>
                {mlStatus.status}
              </span>
            )}

            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Overall Progress</span>
                <span className="font-semibold text-gray-700">{Math.round(pct)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-blue-600">{Math.round(pct)}%</p>
                <p className="text-xs text-gray-400">Complete</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-amber-500">{mlStatus?.overdue_count ?? 0}</p>
                <p className="text-xs text-gray-400">Overdue</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-green-600">{emp.task_summary.completed}</p>
                <p className="text-xs text-gray-400">Done</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {[
                ['Email', emp.email],
                ['Department', emp.department || '—'],
                ['Start Date', emp.start_date || '—'],
                ['Days Since Start', mlStatus ? `${mlStatus.days_since_start} days` : '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-gray-700 break-all">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 space-y-6">
          {tasks.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
              No tasks assigned yet.
            </div>
          ) : (
            STATUS_ORDER.map(status => {
              const group = grouped[status]
              if (!group.length) return null
              return (
                <div key={status}>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    {status}
                    <span className="text-gray-300">({group.length})</span>
                    <span className="flex-1 h-px bg-gray-100" />
                  </h3>
                  <div className="space-y-2">
                    {group.map(task => (
                      <div key={task.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:border-blue-300 transition-colors">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${CAT_COLORS[task.category] || 'bg-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            <span className="capitalize">{task.category}</span>
                            {task.due_date && <span className="ml-2">Due: {task.due_date}</span>}
                          </p>
                        </div>
                        <select
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                          {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}

          {/* Bar chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Tasks by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Remaining" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </main>
      </div>
    </div>
  )
}
