# Requirements Document

## Introduction

This feature defines the scaffold for a full-stack employee onboarding tracker application. The system consists of a Flask/SQLAlchemy backend with a SQLite database and a React + Tailwind CSS frontend. The scaffold establishes the project structure, dependency declarations, application initialization, and blueprint registration — without implementing route logic.

## Glossary

- **App**: The Flask application instance created and configured by the factory function
- **Backend**: The Python/Flask server-side application located in `/backend`
- **Blueprint**: A Flask modular component that groups related routes (employees, tasks, ml)
- **DB**: The SQLAlchemy database instance bound to the App, backed by a SQLite file at `backend/onboard.db`
- **Frontend**: The React + Tailwind CSS client-side application located in `/frontend`
- **CORS**: Cross-Origin Resource Sharing configuration that permits requests from `http://localhost:3000`
- **Requirements_File**: The `backend/requirements.txt` file listing Python package dependencies

## Requirements

### Requirement 1: Backend Dependency Declaration

**User Story:** As a developer, I want all Python dependencies declared in a requirements file, so that I can reproduce the environment with a single install command.

#### Acceptance Criteria

1. THE Requirements_File SHALL list `flask` as a dependency.
2. THE Requirements_File SHALL list `flask-cors` as a dependency.
3. THE Requirements_File SHALL list `flask-sqlalchemy` as a dependency.
4. THE Requirements_File SHALL list `scikit-learn` as a dependency.
5. THE Requirements_File SHALL list `pandas` as a dependency.
6. THE Requirements_File SHALL list `numpy` as a dependency.

---

### Requirement 2: Flask Application Initialization

**User Story:** As a developer, I want the Flask app initialized with SQLAlchemy and CORS configured, so that the backend is ready to serve API requests to the frontend.

#### Acceptance Criteria

1. THE App SHALL be created using an application factory function in `backend/app.py`.
2. THE App SHALL configure the SQLAlchemy database URI to `sqlite:///onboard.db`, resolving to `backend/onboard.db` at runtime.
3. THE App SHALL initialize the DB instance with the App via `db.init_app(app)`.
4. THE App SHALL enable CORS restricted to the origin `http://localhost:3000`.
5. WHEN the App starts, THE DB SHALL create all declared model tables if they do not already exist.

---

### Requirement 3: Blueprint Registration

**User Story:** As a developer, I want route blueprints registered on the App at startup, so that all API route groups are active when the server runs.

#### Acceptance Criteria

1. THE App SHALL register the employees blueprint from `backend/routes/employees.py`.
2. THE App SHALL register the tasks blueprint from `backend/routes/tasks.py`.
3. THE App SHALL register the ml blueprint from `backend/routes/ml.py`.
4. WHEN a blueprint module contains no route handlers, THE App SHALL still register the blueprint without error.

---

### Requirement 4: Route File Scaffolding

**User Story:** As a developer, I want empty blueprint files created for each route group, so that I can add route logic incrementally without restructuring the project.

#### Acceptance Criteria

1. THE Backend SHALL contain a `routes/employees.py` file that declares an `employees_bp` Blueprint instance.
2. THE Backend SHALL contain a `routes/tasks.py` file that declares a `tasks_bp` Blueprint instance.
3. THE Backend SHALL contain a `routes/ml.py` file that declares an `ml_bp` Blueprint instance.
4. THE Backend SHALL contain a `routes/__init__.py` file so that the `routes` directory is a valid Python package.

---

### Requirement 5: Data Model Declarations

**User Story:** As a developer, I want SQLAlchemy model classes declared in `backend/models.py`, so that the database schema is defined separately from route logic.

#### Acceptance Criteria

1. THE Backend SHALL contain a `models.py` file that imports the DB instance from `app.py`.
2. THE models.py SHALL declare at minimum one SQLAlchemy model class representing an Employee entity.
3. THE models.py SHALL declare at minimum one SQLAlchemy model class representing a Task entity.

---

### Requirement 6: Frontend Project Scaffold

**User Story:** As a developer, I want a React application with Tailwind CSS initialized in `/frontend`, so that I can build the UI without manual project setup.

#### Acceptance Criteria

1. THE Frontend SHALL be bootstrapped using Vite or Create React App with a React template.
2. THE Frontend SHALL include Tailwind CSS configured as a PostCSS plugin or via the Vite plugin.
3. THE Frontend SHALL contain an `index.html` entry point at the project root or `public/` directory.
4. THE Frontend SHALL contain a `src/` directory with at minimum an application entry file (e.g., `main.jsx` or `index.js`).
