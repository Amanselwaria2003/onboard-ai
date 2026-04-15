# Requirements Document

## Introduction

This feature adds an authentication system to the OnboardAI employee onboarding tracker. The system introduces two user roles — Admin and Employee — each with distinct access rights. Admins can view the full Dashboard and Admin Panel, while Employees are restricted to their own onboarding detail page. Authentication is handled via email/password login, with passwords stored as hashes. Auth state is persisted in localStorage on the frontend. A seed script provisions one admin account and one user account per existing employee.

## Glossary

- **Auth_System**: The authentication subsystem responsible for login, registration, session management, and route protection across the OnboardAI application.
- **User**: A record in the `users` table with an email, hashed password, role, and optional link to an Employee record.
- **Admin**: A User with `role = "admin"` who has access to the Dashboard and Admin Panel.
- **Employee_User**: A User with `role = "employee"` who is linked to exactly one Employee record and may only access that employee's onboarding detail page.
- **Session**: The client-side auth state stored in localStorage, containing `role`, `userId`, and `employeeId`.
- **Protected_Route**: A frontend route that redirects unauthenticated users to `/login`.
- **Password_Hash**: A bcrypt-compatible hash produced by `werkzeug.security.generate_password_hash`.
- **Login_Endpoint**: `POST /api/auth/login`
- **Register_Endpoint**: `POST /api/auth/register`

---

## Requirements

### Requirement 1: User Model

**User Story:** As a developer, I want a User model in the database, so that authentication credentials and role assignments can be persisted alongside existing employee data.

#### Acceptance Criteria

1. THE Auth_System SHALL store each User with the fields: `id` (integer primary key), `email` (unique, non-nullable string), `password_hash` (non-nullable string), `role` (string, one of `"admin"` or `"employee"`), and `employee_id` (nullable integer foreign key referencing `employees.id`).
2. WHEN a User record is created with `role = "employee"`, THE Auth_System SHALL require `employee_id` to reference a valid Employee record.
3. WHEN a User record is created with `role = "admin"`, THE Auth_System SHALL allow `employee_id` to be null.
4. THE Auth_System SHALL import `db` from `extensions.py` and define the User model in `backend/models.py`.

---

### Requirement 2: Password Hashing

**User Story:** As a security-conscious developer, I want passwords stored as hashes, so that plaintext credentials are never persisted in the database.

#### Acceptance Criteria

1. WHEN a User is registered, THE Auth_System SHALL hash the provided password using `werkzeug.security.generate_password_hash` before storing it.
2. WHEN a login attempt is made, THE Auth_System SHALL verify the provided password against the stored hash using `werkzeug.security.check_password_hash`.
3. THE Auth_System SHALL never store or return a plaintext password in any API response.

---

### Requirement 3: Login Endpoint

**User Story:** As a user, I want to log in with my email and password, so that I can access the parts of the application appropriate to my role.

#### Acceptance Criteria

1. WHEN a `POST /api/auth/login` request is received with a valid email and matching password, THE Login_Endpoint SHALL return a JSON response containing `userId`, `email`, `role`, and `employeeId` with HTTP status 200.
2. WHEN a `POST /api/auth/login` request is received with an email that does not exist in the database, THE Login_Endpoint SHALL return a JSON error response with HTTP status 401.
3. WHEN a `POST /api/auth/login` request is received with a correct email but incorrect password, THE Login_Endpoint SHALL return a JSON error response with HTTP status 401.
4. WHEN a `POST /api/auth/login` request is received with a missing `email` or `password` field, THE Login_Endpoint SHALL return a JSON error response with HTTP status 400.

---

### Requirement 4: Register Endpoint

**User Story:** As an admin, I want to register new user accounts, so that employees can be given login credentials.

#### Acceptance Criteria

1. WHEN a `POST /api/auth/register` request is received with a unique email, a password, a valid role, and (for `"employee"` role) a valid `employee_id`, THE Register_Endpoint SHALL create a new User record and return the created user's `userId`, `email`, `role`, and `employeeId` with HTTP status 201.
2. WHEN a `POST /api/auth/register` request is received with an email that already exists in the database, THE Register_Endpoint SHALL return a JSON error response with HTTP status 409.
3. WHEN a `POST /api/auth/register` request is received with a `role` value other than `"admin"` or `"employee"`, THE Register_Endpoint SHALL return a JSON error response with HTTP status 400.
4. WHEN a `POST /api/auth/register` request is received with `role = "employee"` and a missing or invalid `employee_id`, THE Register_Endpoint SHALL return a JSON error response with HTTP status 400.
5. WHEN a `POST /api/auth/register` request is received with a missing required field (`email`, `password`, or `role`), THE Register_Endpoint SHALL return a JSON error response with HTTP status 400.

---

### Requirement 5: Auth Blueprint Registration

**User Story:** As a developer, I want the auth routes registered in the Flask app, so that the login and register endpoints are reachable alongside the existing API routes.

#### Acceptance Criteria

1. THE Auth_System SHALL define the auth routes in `backend/routes/auth.py` as a Flask Blueprint named `auth_bp` with url prefix `/api/auth`.
2. WHEN the Flask application starts, THE Auth_System SHALL register `auth_bp` in `backend/app.py` alongside `employees_bp`, `tasks_bp`, and `ml_bp`.

---

### Requirement 6: Database Seeding

**User Story:** As a developer, I want the seed script to create default user accounts, so that the application is immediately usable after setup.

#### Acceptance Criteria

1. WHEN `seed.py` is executed, THE Auth_System SHALL create one Admin User with email `admin@company.com` and password `admin123`.
2. WHEN `seed.py` is executed, THE Auth_System SHALL create one Employee_User for each seeded Employee record, using the employee's email as the login email and `employee123` as the default password.
3. WHEN `seed.py` is executed and a User with the given email already exists, THE Auth_System SHALL skip creation of that User to avoid duplicate key errors.

---

### Requirement 7: Frontend Login Page

**User Story:** As a user, I want a login page with email and password fields, so that I can authenticate and be directed to the correct part of the application.

#### Acceptance Criteria

1. THE Auth_System SHALL provide a Login page at the `/login` route in the React frontend, rendered by `frontend/src/pages/Login.jsx`.
2. WHEN a user submits valid credentials on the Login page, THE Auth_System SHALL store `role`, `userId`, and `employeeId` in localStorage and redirect the user.
3. WHEN a logged-in user has `role = "admin"`, THE Auth_System SHALL redirect them to the Dashboard (`/`).
4. WHEN a logged-in user has `role = "employee"`, THE Auth_System SHALL redirect them to their own EmployeeDetail page (`/employee/:employeeId`).
5. WHEN a login request returns an error, THE Auth_System SHALL display an error message on the Login page without clearing the email field.
6. WHEN a user is already authenticated (Session exists in localStorage), THE Auth_System SHALL redirect them away from `/login` to their appropriate page.

---

### Requirement 8: Frontend Register Page

**User Story:** As an admin, I want a registration page, so that new user accounts can be created through the UI.

#### Acceptance Criteria

1. THE Auth_System SHALL provide a Register page at the `/register` route in the React frontend, rendered by `frontend/src/pages/Register.jsx`.
2. WHEN a user submits the registration form with valid data, THE Auth_System SHALL call the Register_Endpoint and display a success message.
3. WHEN the Register_Endpoint returns an error, THE Auth_System SHALL display the error message on the Register page.
4. WHEN registration succeeds, THE Auth_System SHALL redirect the user to the Login page (`/login`).

---

### Requirement 9: Route Protection

**User Story:** As a system owner, I want unauthenticated users redirected to the login page, so that protected content is not accessible without credentials.

#### Acceptance Criteria

1. WHEN an unauthenticated user (no valid Session in localStorage) navigates to any route other than `/login` or `/register`, THE Auth_System SHALL redirect them to `/login`.
2. WHEN an authenticated user with `role = "employee"` navigates to the Dashboard (`/`) or Admin Panel (`/admin`), THE Auth_System SHALL redirect them to their own EmployeeDetail page (`/employee/:employeeId`).
3. WHEN an authenticated user with `role = "admin"` navigates to any route, THE Auth_System SHALL allow access without restriction.
4. THE Auth_System SHALL implement route protection in `frontend/src/App.jsx` using a `ProtectedRoute` component.

---

### Requirement 10: Logout

**User Story:** As a user, I want to log out, so that my session is cleared and the application returns to the login screen.

#### Acceptance Criteria

1. WHEN a user triggers logout, THE Auth_System SHALL remove `role`, `userId`, and `employeeId` from localStorage.
2. WHEN logout is complete, THE Auth_System SHALL redirect the user to `/login`.
3. THE Auth_System SHALL expose a logout action in the Navbar component so it is accessible from all authenticated pages.
