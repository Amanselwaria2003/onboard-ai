/**
 * Property 11: Login stores correct data in localStorage
 *
 * For any authenticated user (any role, any userId, any employeeId),
 * after a successful login the values stored in localStorage for
 * `role`, `userId`, and `employeeId` SHALL exactly match the values
 * returned by the login API response.
 *
 * Validates: Requirements 7.2
 *
 * ---
 *
 * Property 12: Employee user redirected to their own detail page after login
 *
 * For any employee user with any employeeId, after a successful login
 * the application SHALL navigate to `/employee/{employeeId}` where
 * `{employeeId}` matches the value returned by the login API.
 *
 * Validates: Requirements 7.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'

// Mock the login API function
vi.mock('../api', () => ({
  login: vi.fn(),
}))

import { login as mockLogin } from '../api'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  )
}

async function submitLoginForm(email, password) {
  fireEvent.change(screen.getByPlaceholderText(/you@company\.com/i), {
    target: { value: email },
  })
  fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
    target: { value: password },
  })
  fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'))
}

beforeEach(() => {
  localStorage.clear()
  mockNavigate.mockClear()
  mockLogin.mockClear()
})

afterEach(() => {
  localStorage.clear()
})

// --- Property 11 ---

describe('Property 11: Login stores correct data in localStorage', () => {
  const cases = [
    { role: 'admin',    userId: 1,   employeeId: null,  desc: 'admin user, no employeeId' },
    { role: 'admin',    userId: 42,  employeeId: null,  desc: 'admin user, userId=42' },
    { role: 'employee', userId: 7,   employeeId: 3,     desc: 'employee user, employeeId=3' },
    { role: 'employee', userId: 99,  employeeId: 17,    desc: 'employee user, employeeId=17' },
    { role: 'employee', userId: 100, employeeId: 1,     desc: 'employee user, employeeId=1' },
  ]

  cases.forEach(({ role, userId, employeeId, desc }) => {
    it(`stores role, userId, employeeId matching API response — ${desc}`, async () => {
      const apiResponse = { role, userId, employeeId }
      mockLogin.mockResolvedValueOnce(apiResponse)

      renderLogin()
      await submitLoginForm('user@example.com', 'password123')

      await waitFor(() => {
        expect(localStorage.getItem('role')).toBe(role)
        expect(localStorage.getItem('userId')).toBe(String(userId))
        expect(localStorage.getItem('employeeId')).toBe(
          employeeId != null ? String(employeeId) : ''
        )
      })
    })
  })
})

// --- Property 12 ---

describe('Property 12: Employee user redirected to their own detail page after login', () => {
  const employeeIds = [1, 3, 7, 17, 42, 99, 100]

  employeeIds.forEach((employeeId) => {
    it(`navigates to /employee/${employeeId} after employee login`, async () => {
      mockLogin.mockResolvedValueOnce({ role: 'employee', userId: 10, employeeId })

      renderLogin()
      await submitLoginForm('emp@example.com', 'pass')

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          `/employee/${employeeId}`,
          { replace: true }
        )
      })
    })
  })

  it('does NOT navigate to /employee/:id for admin users', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'admin', userId: 1, employeeId: null })

    renderLogin()
    await submitLoginForm('admin@example.com', 'admin123')

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })

    // Ensure no /employee/ navigation happened
    const employeeNavCalls = mockNavigate.mock.calls.filter(([path]) =>
      typeof path === 'string' && path.startsWith('/employee/')
    )
    expect(employeeNavCalls).toHaveLength(0)
  })
})
