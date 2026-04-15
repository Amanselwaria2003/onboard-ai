import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({ baseURL: BASE_URL })

export const getEmployees = () => api.get('/api/employees').then(r => r.data)
export const getEmployee = (id) => api.get(`/api/employees/${id}`).then(r => r.data)
export const createEmployee = (data) => api.post('/api/employees', data).then(r => r.data)
export const deleteEmployee = (id) => api.delete(`/api/employees/${id}`).then(r => r.data)

export const getTasks = (employeeId) =>
  api.get('/api/tasks', { params: { employee_id: employeeId } }).then(r => r.data)
export const createTask = (data) => api.post('/api/tasks', data).then(r => r.data)
export const updateTask = (id, data) => api.patch(`/api/tasks/${id}`, data).then(r => r.data)
export const deleteTask = (id) => api.delete(`/api/tasks/${id}`).then(r => r.data)

export const getMLStatus = (employeeId) =>
  api.get(`/api/ml/status/${employeeId}`).then(r => r.data)
export const getAllMLStatuses = () => api.get('/api/ml/status/all').then(r => r.data)

// Auth
export const login = (data) => api.post('/api/auth/login', data).then(r => r.data)
export const register = (data) => api.post('/api/auth/register', data).then(r => r.data)
