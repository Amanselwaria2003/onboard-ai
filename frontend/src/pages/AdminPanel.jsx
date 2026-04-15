import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEmployees, createEmployee, deleteEmployee, createTask, getAllMLStatuses } from '../api'

const STATUS_BADGE = {
  'On Track': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'At Risk':  'bg-amber-50 text-amber-700 border border-amber-200',
  'Delayed':  'bg-red-50 text-red-700 border border-red-200',
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"

export default function AdminPanel() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [empForm, setEmpForm] = useState({ name: '', email: '', department: '', start_date: '' })
  const [empError, setEmpError] = useState('')
  const [empSuccess, setEmpSuccess] = useState('')

  const [taskForm, setTaskForm] = useState({ employee_id: '', title: '', category: 'document', due_date: '', description: '' })
  const [taskError, setTaskError] = useState('')
  const [taskSuccess, setTaskSuccess] = useState('')

  const load = () => {
    setLoading(true); setLoadError(null)
    Promise.all([getEmployees(), getAllMLStatuses()])
      .then(([emps, sts]) => { setEmployees(emps); setStatuses(sts) })
      .catch(() => setLoadError('Failed to load data. Is the Flask backend running on port 5000?'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const statusMap = Object.fromEntries(statuses.map(s => [s.employee_id, s]))

  const handleAddEmployee = async (e) => {
    e.preventDefault(); setEmpError(''); setEmpSuccess('')
    if (!empForm.name || !empForm.email) { setEmpError('Name and email are required'); return }
    try {
      await createEmployee(empForm)
      setEmpForm({ name: '', email: '', department: '', start_date: '' })
      setEmpSuccess('Employee added successfully!')
      setTimeout(() => setEmpSuccess(''), 3000)
      load()
    } catch (err) { setEmpError(err.response?.data?.error || err.message) }
  }

  const handleAddTask = async (e) => {
    e.preventDefault(); setTaskError(''); setTaskSuccess('')
    if (!taskForm.employee_id || !taskForm.title) { setTaskError('Employee and title are required'); return }
    try {
      await createTask({ ...taskForm, employee_id: parseInt(taskForm.employee_id) })
      setTaskForm({ employee_id: '', title: '', category: 'document', due_date: '', description: '' })
      setTaskSuccess('Task assigned successfully!')
      setTimeout(() => setTaskSuccess(''), 3000)
      load()
    } catch (err) { setTaskError(err.response?.data?.error || err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee and all their tasks?')) return
    await deleteEmployee(id); load()
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-400 text-sm mt-1">Manage employees and onboarding tasks</p>
      </div>

      {loadError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-5 py-4">{loadError}</div>
      )}

      {/* Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Add Employee */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <h2 className="font-semibold text-gray-800">Add New Employee</h2>
          </div>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Full Name">
                <input className={inputCls} placeholder="Priya Sharma" value={empForm.name}
                  onChange={e => setEmpForm(f => ({ ...f, name: e.target.value }))} />
              </FormField>
              <FormField label="Email">
                <input type="email" className={inputCls} placeholder="priya@company.com" value={empForm.email}
                  onChange={e => setEmpForm(f => ({ ...f, email: e.target.value }))} />
              </FormField>
              <FormField label="Department">
                <input className={inputCls} placeholder="Engineering" value={empForm.department}
                  onChange={e => setEmpForm(f => ({ ...f, department: e.target.value }))} />
              </FormField>
              <FormField label="Start Date">
                <input type="date" className={inputCls} value={empForm.start_date}
                  onChange={e => setEmpForm(f => ({ ...f, start_date: e.target.value }))} />
              </FormField>
            </div>
            {empError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{empError}</p>}
            {empSuccess && <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{empSuccess}</p>}
            <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-200">
              Add Employee
            </button>
          </form>
        </div>

        {/* Assign Task */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
              </svg>
            </div>
            <h2 className="font-semibold text-gray-800">Assign Task</h2>
          </div>
          <form onSubmit={handleAddTask} className="space-y-4">
            <FormField label="Employee">
              <select className={inputCls} value={taskForm.employee_id}
                onChange={e => setTaskForm(f => ({ ...f, employee_id: e.target.value }))}>
                <option value="">Select employee…</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </FormField>
            <FormField label="Task Title">
              <input className={inputCls} placeholder="Complete HR Orientation" value={taskForm.title}
                onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Category">
                <select className={inputCls} value={taskForm.category}
                  onChange={e => setTaskForm(f => ({ ...f, category: e.target.value }))}>
                  {['document', 'training', 'form', 'meeting'].map(c =>
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  )}
                </select>
              </FormField>
              <FormField label="Due Date">
                <input type="date" className={inputCls} value={taskForm.due_date}
                  onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="Description (optional)">
              <input className={inputCls} placeholder="Brief description…" value={taskForm.description}
                onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} />
            </FormField>
            {taskError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{taskError}</p>}
            {taskSuccess && <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{taskSuccess}</p>}
            <button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm shadow-purple-200">
              Assign Task
            </button>
          </form>
        </div>
      </div>

      {/* Employees table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">All Employees</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{employees.length} total</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Employee', 'Department', 'Progress', 'Status', 'Tasks', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      Loading…
                    </div>
                  </td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">No employees yet.</td></tr>
                ) : employees.map((emp, idx) => {
                  const st = statusMap[emp.id]
                  const pct = Math.round(st?.percent_complete ?? emp.task_summary.percent_complete)
                  const initials = emp.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => navigate(`/employee/${emp.id}`)}
                      className={`cursor-pointer hover:bg-indigo-50/50 transition-colors border-b border-gray-50 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{emp.name}</p>
                            <p className="text-xs text-gray-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                          {emp.department || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5 min-w-[120px]">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-indigo-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {st ? (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[st.status]}`}>
                            {st.status}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">{emp.task_summary.completed}</span>/{emp.task_summary.total}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(emp.id) }}
                          className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
