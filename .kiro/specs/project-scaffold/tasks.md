# Implementation Plan: project-scaffold

## Overview

Scaffold a full-stack employee onboarding tracker: a Flask/SQLAlchemy backend with SQLite, CORS, and three blueprint route groups, plus a React + Vite + Tailwind CSS frontend. No route logic is implemented — only the wiring, models, and seed script.

## Tasks

- [ ] 1. Create backend dependency file
  - Write `backend/requirements.txt` listing: `flask`, `flask-cors`, `flask-sqlalchemy`, `scikit-learn`, `pandas`, `numpy`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 1.1 Write property test for requirements file contents
    - **Property 1: requirements.txt contains all declared packages**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
    - Use `@given(sampled_from([...]))` over the required package names
    - Tag: `# Feature: project-scaffold, Property 1: requirements.txt contains all declared packages`

- [ ] 2. Implement SQLAlchemy models
  - Create `backend/models.py` importing `db` from `app`
  - Declare `Employee` model: `id` (Integer PK), `name` (String(100), not null), `email` (String(120), unique, not null), `department` (String(100)), `start_date` (Date), `created_at` (DateTime, default utcnow)
  - Declare `Task` model: `id` (Integer PK), `employee_id` (FK → employees.id, not null), `title` (String(200), not null), `description` (Text), `status` (String(50), default `'Not Started'`), `due_date` (Date), `completed_at` (DateTime, nullable), `category` (String(50), default `'document'`)
  - Add `tasks` relationship on `Employee` with cascade delete
  - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 2.1 Write unit test for models importability
    - Test `models.py` imports without error
    - Assert `Employee` and `Task` are `db.Model` subclasses
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 3. Implement Flask application factory
  - Create `backend/app.py` with module-level `db = SQLAlchemy()`
  - Implement `create_app()` factory: set `SQLALCHEMY_DATABASE_URI` to `sqlite:///onboard.db`, call `CORS(app, origins=["http://localhost:3000"])`, call `db.init_app(app)`, register blueprints, call `db.create_all()` inside `app.app_context()`
  - Add `if __name__ == '__main__': create_app().run(debug=True, port=5000)` entry point
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3_

  - [ ]* 3.1 Write unit tests for app factory
    - `test_create_app_returns_flask_instance`, `test_db_uri_configured`, `test_cors_origin_header`, `test_blueprints_registered`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 3.2 Write property test for table creation on startup
    - **Property 2: app startup creates all declared model tables**
    - **Validates: Requirements 2.5**
    - Use fresh in-memory SQLite URI; assert `employees` and `tasks` tables exist in `sqlite_master`
    - Tag: `# Feature: project-scaffold, Property 2: app startup creates all declared model tables`

  - [ ]* 3.3 Write property test for blueprint registration
    - **Property 3: all declared blueprints are registered after app creation**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - Use `@given(sampled_from(['employees', 'tasks', 'ml']))` and assert presence in `app.blueprints`
    - Tag: `# Feature: project-scaffold, Property 3: all declared blueprints are registered after app creation`

- [ ] 4. Scaffold route blueprint files
  - Create `backend/routes/__init__.py` (empty)
  - Create `backend/routes/employees.py` declaring `employees_bp = Blueprint('employees', __name__)`
  - Create `backend/routes/tasks.py` declaring `tasks_bp = Blueprint('tasks', __name__)`
  - Create `backend/routes/ml.py` declaring `ml_bp = Blueprint('ml', __name__)`
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.1 Write unit tests for route modules
    - `test_route_modules_importable`, `test_blueprint_instances`, `test_routes_init_exists`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.2 Write property test for empty blueprint registration
    - **Property 4: empty blueprints register without error**
    - **Validates: Requirements 3.4**
    - Generate arbitrary Blueprint names (random strings); assert `app.register_blueprint(bp)` does not raise
    - Tag: `# Feature: project-scaffold, Property 4: empty blueprints register without error`

  - [ ]* 4.3 Write property test for route module Blueprint exports
    - **Property 5: each route module exports a Blueprint instance**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Use `@given(sampled_from([...]))` over module/attribute pairs; assert each exported attribute is a `Blueprint` instance
    - Tag: `# Feature: project-scaffold, Property 5: each route module exports a Blueprint instance`

- [ ] 5. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create database seed script
  - Create `backend/db_init.py` that imports `create_app` and `db` from `app`, imports `Employee` and `Task` from `models`
  - Drop and recreate all tables via `db.drop_all()` then `db.create_all()` inside an app context
  - Seed 5 dummy employees, each with 5 tasks at varied statuses (`'Not Started'`, `'In Progress'`, `'Completed'`) and due dates spread across past and future dates
  - Tasks should cover all four categories: `'document'`, `'training'`, `'form'`, `'meeting'`
  - Set `completed_at` on tasks with status `'Completed'`
  - Run `db_init.py` once to verify it executes without error and populates `onboard.db`
  - _Requirements: 5.2, 5.3_

- [ ] 7. Scaffold React + Vite + Tailwind frontend
  - Create `frontend/package.json` with dependencies: `react`, `react-dom`; devDependencies: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`
  - Create `frontend/vite.config.js` with React plugin and dev server on port 3000
  - Create `frontend/tailwind.config.js` scanning `./src/**/*.{js,jsx}`
  - Create `frontend/postcss.config.js` with `tailwindcss` and `autoprefixer` plugins
  - Ensure `frontend/index.html` references `src/main.jsx` via `<script type="module">`
  - Create `frontend/src/main.jsx` rendering `<App />` into the DOM root
  - Create `frontend/src/App.jsx` as a minimal placeholder component
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 7.1 Write unit tests for frontend file existence
    - `test_frontend_index_html_exists`, `test_frontend_src_entry_exists`
    - _Requirements: 6.3, 6.4_

- [ ] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use Hypothesis with `@settings(max_examples=100)` and must be tagged with the feature/property comment format
- Run pytest from the `backend/` directory
- Use `:memory:` SQLite URI in tests to avoid polluting `onboard.db`
- `db_init.py` is a one-time dev utility and is not part of the app runtime
