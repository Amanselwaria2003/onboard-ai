import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEmployees, createEmployee, deleteEmployee, createTask, getAllMLStatuses } from '../api'

const STATUS_BADGE = {
  'On Track': 'bg-green-500/20 text-green-600 border border-green-500/30',
  'At Risk':  'bg-amber-500/20 text-amber-600 border border-amber-500/30',
  'Delayed':  'bg-red-500/20 text-red-600 border border-red-500/30',
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Add employee form
  const [empForm, setEmpForm] = useState({ name: '', email: '', department: '', start_date: '' })
  const [empError, setEmpError] = useState('')
  const [empSuccess, setEmpSuccess] = useState('')

  // Add task form
  const [taskForm, setTaskForm] = useState({ employee_id: '', title: '', category: 'document', due_date: '', description: '' })
  const [taskError, setTaskError] = useState('')
  const [taskSuccess, setTaskSuccess] = useState('')

  const load = () => {
    setLoading(true)
    setLoadError(null)
    Promise.all([getEmployees(), getAllMLStatuses()])
      .then(([emps, sts]) => { setEmployees(emps); setStatuses(sts) })
      .catch(() => setLoadError('Failed to load data. Is the Flask backend running on port 5000?'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const statusMap = Object.fromEntries(statuses.map(s => [s.employee_id, s]))

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    setEmpError(''); setEmpSuccess('')
    if (!empForm.name || !empForm.email) { setEmpError('Name and email are required'); return }
    try {
      await createEmployee(empForm)
      setEmpForm({ name: '', email: '', department: '', start_date: '' })
      setEmpSuccess('Employee added successfully!')
      setTimeout(() => setEmpSuccess(''), 3000)
      load()
    } catch (err) {
      setEmpError(err.response?.data?.error || err.message)
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    setTaskError(''); setTaskSuccess('')
    if (!taskForm.employee_id || !taskForm.title) { setTaskError('Employee and title are required'); return }
    try {
      await createTask({ ...taskForm, employee_id: parseInt(taskForm.employee_id) })
      setTaskForm({ employee_id: '', title: '', category: 'document', due_date: '', description: '' })
      setTaskSuccess('Task assigned successfully!')
      setTimeout(() => setTaskSuccess(''), 3000)
      load()
    } catch (err) {
      setTaskError(err.response?.data?.error || err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee and all their tasks?')) return
    await deleteEmployee(id)
    load()
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Manage employees and onboarding tasks</p>
      </div>

      {loadError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Add Employee */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Add New Employee</h2>
          <form onSubmit={handleAddEmployee} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Full Name</label>
                <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="Priya Sharma" value={empForm.name}
                  onChange={e => setEmpForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Email</label>
                <input type="email" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="priya@company.com" value={empForm.email}
                  onChange={e => setEmpForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Department</label>
                <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="Engineering" value={empForm.department}
                  onChange={e => setEmpForm(f => ({ ...f, department: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Start Date</label>
                <input type="date" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={empForm.start_date}
                  onChange={e => setEmpForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
            </div>
            {empError && <p className="text-xs text-red-500">{empError}</p>}
            {empSuccess && <p className="text-xs text-green-600">{empSuccess}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Add Employee
            </button>
          </form>
        </div>

        {/* Assign Task */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Assign Task</h2>
          <form onSubmit={handleAddTask} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">Employee</label>
              <select className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                value={taskForm.employee_id}
                onChange={e => setTaskForm(f => ({ ...f, employee_id: e.target.value }))}>
                <option value="">Select employee...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">Task Title</label>
              <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="Complete HR Orientation" value={taskForm.title}
                onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Category</label>
                <select className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  value={taskForm.category}
                  onChange={e => setTaskForm(f => ({ ...f, category: e.target.value }))}>
                  {['document', 'training', 'form', 'meeting'].map(c =>
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Due Date</label>
                <input type="date" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={taskForm.due_date}
                  onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">Description</label>
              <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="Optional" value={taskForm.description}
                onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            {taskError && <p className="text-xs text-red-500">{taskError}</p>}
            {taskSuccess && <p className="text-xs text-green-600">{taskSuccess}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Assign Task
            </button>
          </form>
        </div>
      </div>

      {/* Employees table */}
      <h2 className="font-semibold text-gray-800 mb-3">All Employees</h2>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Email', 'Department', 'Progress', 'Status', 'Total', 'Completed', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No employees yet.</td></tr>
            ) : employees.map(emp => {
              const st = statusMap[emp.id]
              const pct = st?.percent_complete ?? emp.task_summary.percent_complete
              return (
                <tr key={emp.id} onClick={() => navigate(`/employee/${emp.id}`)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{emp.email}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.department || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-24">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{Math.round(pct)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {st && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[st.status]}`}>
                        {st.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-center">{emp.task_summary.total}</td>
                  <td className="px-4 py-3 text-gray-500 text-center">{emp.task_summary.completed}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(emp.id) }}
                      className="text-xs text-red-500 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
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
  )
}
