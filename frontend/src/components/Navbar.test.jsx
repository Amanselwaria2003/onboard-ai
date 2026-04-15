/**
 * Property 15: Logout clears all auth keys from localStorage
 *
 * For any authenticated session (any role, any userId, any employeeId),
 * triggering logout SHALL result in localStorage containing neither
 * `role`, `userId`, nor `employeeId`.
 *
 * Validates: Requirements 10.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

// Mock useNavigate so we don't need a full router history
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Navbar />
    </MemoryRouter>
  )
}

function setSession({ role, userId, employeeId }) {
  localStorage.setItem('role', role)
  localStorage.setItem('userId', String(userId))
  if (employeeId !== null && employeeId !== undefined) {
    localStorage.setItem('employeeId', String(employeeId))
  }
}

beforeEach(() => {
  localStorage.clear()
  mockNavigate.mockClear()
})

afterEach(() => {
  localStorage.clear()
})

// --- Property 15 ---

describe('Property 15: Logout clears all auth keys from localStorage', () => {
  // Test with various role / userId / employeeId combinations to cover the
  // "for any authenticated session" aspect of the property.
  const sessions = [
    { role: 'admin',    userId: 1,   employeeId: null },
    { role: 'admin',    userId: 42,  employeeId: null },
    { role: 'employee', userId: 7,   employeeId: 3 },
    { role: 'employee', userId: 99,  employeeId: 17 },
    { role: 'employee', userId: 100, employeeId: 1 },
    { role: 'admin',    userId: 999, employeeId: null },
  ]

  sessions.forEach(({ role, userId, employeeId }) => {
    it(`removes role/userId/employeeId after logout — role=${role}, userId=${userId}, employeeId=${employeeId}`, () => {
      setSession({ role, userId, employeeId })

      renderNavbar()

      const logoutBtn = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(logoutBtn)

      expect(localStorage.getItem('role')).toBeNull()
      expect(localStorage.getItem('userId')).toBeNull()
      expect(localStorage.getItem('employeeId')).toBeNull()
    })
  })

  it('navigates to /login after logout', () => {
    setSession({ role: 'admin', userId: 1, employeeId: null })
    renderNavbar()

    fireEvent.click(screen.getByRole('button', { name: /logout/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })
})
