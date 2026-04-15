# Implementation Plan: User Authentication

## Overview

Implement email/password authentication with two roles (admin, employee) using a Flask Blueprint on the backend and React Router v6 route protection on the frontend. Auth state is stored in localStorage — no JWT. Passwords are hashed with werkzeug.security.

## Tasks

- [x] 1. Add User model to backend/models.py
  - Append the `User` class to `backend/models.py`, importing `db` from `extensions`
  - Fields: `id`, `email` (unique, non-nullable), `password_hash` (non-nullable), `role` (`"admin"` | `"employee"`), `employee_id` (nullable FK → `employees.id`)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Create auth blueprint at backend/routes/auth.py
  - [x] 2.1 Implement POST /api/auth/register
    - Validate required fields (`email`, `password`, `role`); return 400 if missing
    - Validate `role` is `"admin"` or `"employee"`; return 400 otherwise
    - When `role = "employee"`, validate `employee_id` references an existing Employee; return 400 if missing/invalid
    - Check for duplicate email; return 409 if found
    - Hash password with `werkzeug.security.generate_password_hash`, persist User, return 201 with `{ userId, email, role, employeeId }`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 2.1, 2.3_

  - [x] 2.2 Implement POST /api/auth/login
    - Validate `email` and `password` present; return 400 if missing
    - Look up User by email; return 401 with `"invalid credentials"` if not found
    - Verify password with `werkzeug.security.check_password_hash`; return 401 with `"invalid credentials"` if mismatch
    - Return 200 with `{ userId, email, role, employeeId }`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 2.2, 2.3_

  - [x] 2.3 Write property tests for auth endpoints (P1–P8)
    - **Property 1: Password hashing round-trip** — `generate_password_hash` then `check_password_hash` returns True; hash ≠ plaintext
    - **Validates: Requirements 2.1, 2.2**
    - **Property 2: Plaintext password never in API response** — raw password absent from register and login response bodies
    - **Validates: Requirements 2.3**
    - **Property 3: Login with valid credentials returns correct user data** — 200 with matching `userId`, `email`, `role`, `employeeId`
    - **Validates: Requirements 3.1**
    - **Property 4: Login with invalid credentials returns 401** — unknown email or wrong password → 401
    - **Validates: Requirements 3.2, 3.3**
    - **Property 5: Registration with valid data creates user and returns correct fields** — 201 with matching fields, user exists in DB
    - **Validates: Requirements 4.1**
    - **Property 6: Duplicate email registration returns 409**
    - **Validates: Requirements 4.2**
    - **Property 7: Invalid role value returns 400**
    - **Validates: Requirements 4.3**
    - **Property 8: Employee role without valid employee_id returns 400**
    - **Validates: Requirements 1.2, 4.4**
    - Create `backend/tests/test_auth_properties.py` using `hypothesis`; run tests from `backend/` with `pytest`

- [x] 3. Register auth_bp in backend/app.py
  - Import `auth_bp` from `routes.auth` and call `app.register_blueprint(auth_bp)` with `url_prefix="/api/auth"` alongside the existing blueprints
  - _Requirements: 5.1, 5.2_

- [x] 4. Checkpoint — Ensure all backend tests pass
  - Run `pytest` from `backend/`; resolve any failures before continuing

- [x] 5. Extend backend/db_init.py with user seeding
  - Import `User` from `models` and `generate_password_hash` from `werkzeug.security`
  - After committing employees, create one admin User (`admin@company.com` / `admin123`)
  - For each seeded Employee, create one employee User using the employee's email and password `employee123`, with `employee_id` set to that employee's id
  - Wrap each creation in a skip-if-exists guard (check by email before inserting)
  - _Requirements: 6.1, 6.2, 6.3_

  - [x] 5.1 Write property tests for seeding (P9–P10)
    - **Property 9: Every seeded employee has a corresponding user** — after seed, every Employee has exactly one User with matching email and `role = "employee"`
    - **Validates: Requirements 6.2**
    - **Property 10: Seed is idempotent** — running seed twice does not increase User count
    - **Validates: Requirements 6.3**
    - Add to `backend/tests/test_auth_properties.py`

- [x] 6. Add auth API helpers to frontend/src/api/index.js
  - Append `login` and `register` functions using the existing `api` axios instance
  - `login`: `POST /api/auth/login`
  - `register`: `POST /api/auth/register`
  - _Requirements: 7.1, 8.1_

- [x] 7. Create frontend/src/pages/Login.jsx
  - Email + password form with controlled inputs
  - On submit: call `login()`, write `role`, `userId`, `employeeId` to localStorage, then redirect — admin → `/`, employee → `/employee/:employeeId`
  - On error: display inline error message; preserve email field, clear password field
  - On mount: if `localStorage.getItem('role')` exists, redirect immediately to appropriate page (no form flash)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 7.1 Write frontend tests for Login.jsx (P11–P12)
    - **Property 11: Login stores correct data in localStorage** — after success, `role`, `userId`, `employeeId` in localStorage match API response
    - **Validates: Requirements 7.2**
    - **Property 12: Employee user redirected to their own detail page after login**
    - **Validates: Requirements 7.4**
    - Use Vitest + React Testing Library with mocked localStorage and mocked `login` API call

- [x] 8. Create frontend/src/pages/Register.jsx
  - Form with email, password, role (select: admin/employee), and optional employee_id field (shown when role = "employee")
  - On submit: call `register()`, show success message, redirect to `/login`
  - On error: display inline error message; preserve form fields
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 9. Add ProtectedRoute and update routing in frontend/src/App.jsx
  - Implement `ProtectedRoute({ adminOnly, children })` component inside `App.jsx`:
    - Read `role` and `employeeId` from localStorage
    - No role → `<Navigate to="/login" replace />`
    - `adminOnly` and `role === "employee"` → `<Navigate to={"/employee/" + employeeId} replace />`
    - Otherwise → render `children`
  - Add routes: `/login` → `<Login />`, `/register` → `<Register />`
  - Wrap existing routes: `/` and `/admin` with `<ProtectedRoute adminOnly>`, `/employee/:id` with `<ProtectedRoute>`
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 9.1 Write frontend tests for ProtectedRoute (P13–P14)
    - **Property 13: Unauthenticated user redirected to /login on protected routes**
    - **Validates: Requirements 9.1**
    - **Property 14: Employee user redirected away from admin routes**
    - **Validates: Requirements 9.2**
    - Use Vitest + React Testing Library with mocked localStorage

- [x] 10. Update frontend/src/components/Navbar.jsx with logout
  - Add a Logout button visible on all authenticated pages
  - On click: remove `role`, `userId`, `employeeId` from localStorage, then `navigate('/login')`
  - _Requirements: 10.1, 10.2, 10.3_

  - [x] 10.1 Write frontend test for logout (P15)
    - **Property 15: Logout clears all auth keys from localStorage** — after logout, `role`, `userId`, `employeeId` are absent from localStorage
    - **Validates: Requirements 10.1**

- [x] 11. Final checkpoint — Ensure all tests pass
  - Run `pytest` from `backend/` and verify all backend tests pass
  - Ensure no TypeScript/lint errors in frontend files
  - Ask the user if any questions arise before closing out

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All backend imports of `db` must use `from extensions import db`
- The seed file is `backend/db_init.py` — not `seed.py`
- Backend tests run from the `backend/` directory: `pytest`
- `hypothesis` is already installed in the venv
- Auth blueprint must be registered with `url_prefix="/api/auth"`
- No JWT — session is a plain object in localStorage
