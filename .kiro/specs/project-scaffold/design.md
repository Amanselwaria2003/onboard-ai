# Design Document: project-scaffold

## Overview

The `project-scaffold` feature establishes the foundational structure for a full-stack employee onboarding tracker. The system is split into two independently runnable applications:

- **Backend**: A Flask REST API backed by SQLite via SQLAlchemy, with CORS enabled for the frontend origin and three blueprint-based route groups (employees, tasks, ml).
- **Frontend**: A React single-page application built with Vite and styled with Tailwind CSS.

The scaffold intentionally contains no route logic — it only wires up the application factory, database, CORS, blueprint registration, model declarations, and frontend tooling. This gives developers a clean, reproducible starting point to add feature logic incrementally.

---

## Architecture

```mermaid
graph TD
    subgraph Frontend ["/frontend (Vite + React + Tailwind)"]
        HTML[index.html]
        Entry[src/main.jsx]
        Components[src/components/]
        Pages[src/pages/]
        API[src/api/]
    end

    subgraph Backend ["/backend (Flask + SQLAlchemy)"]
        AppFactory[app.py — create_app()]
        Models[models.py]
        DB[(onboard.db — SQLite)]
        subgraph Routes ["/routes"]
            EmpBP[employees.py — employees_bp]
            TaskBP[tasks.py — tasks_bp]
            MLBP[ml.py — ml_bp]
            Init[__init__.py]
        end
    end

    HTML --> Entry
    Entry --> Components
    Entry --> Pages
    Pages --> API
    API -->|HTTP / CORS| AppFactory
    AppFactory --> Models
    AppFactory --> DB
    AppFactory --> EmpBP
    AppFactory --> TaskBP
    AppFactory --> MLBP
    Models --> DB
```

The backend uses the **application factory pattern** (`create_app()`) so the app can be instantiated with different configurations (e.g., test vs. production). The `db` SQLAlchemy instance is module-level and bound to the app inside the factory via `db.init_app(app)`.

---

## Components and Interfaces

### Backend

#### `backend/app.py`

- Exports a module-level `db = SQLAlchemy()` instance.
- Exports `create_app() -> Flask` — the application factory.
- Inside `create_app()`:
  - Sets `SQLALCHEMY_DATABASE_URI` to `sqlite:///onboard.db` (resolves to `backend/onboard.db` at runtime).
  - Calls `CORS(app, origins=["http://localhost:3000"])`.
  - Calls `db.init_app(app)`.
  - Imports and registers `employees_bp`, `tasks_bp`, `ml_bp`.
  - Calls `db.create_all()` inside an `app.app_context()` block.
- Entry point: `if __name__ == '__main__': create_app().run(debug=True, port=5000)`.

#### `backend/requirements.txt`

Lists pinned Python dependencies:
- `flask`
- `flask-cors`
- `flask-sqlalchemy`
- `scikit-learn`
- `pandas`
- `numpy`

#### `backend/models.py`

- Imports `db` from `app`.
- Declares `Employee(db.Model)` with at minimum: `id`, `name`, `email`.
- Declares `Task(db.Model)` with at minimum: `id`, `employee_id` (FK → employees), `title`.

#### `backend/routes/__init__.py`

Empty file marking `routes/` as a Python package.

#### `backend/routes/employees.py`

- Declares `employees_bp = Blueprint('employees', __name__)`.
- No route handlers in the scaffold.

#### `backend/routes/tasks.py`

- Declares `tasks_bp = Blueprint('tasks', __name__)`.
- No route handlers in the scaffold.

#### `backend/routes/ml.py`

- Declares `ml_bp = Blueprint('ml', __name__)`.
- No route handlers in the scaffold.

### Frontend

#### `frontend/index.html`

Vite entry point at the project root. References `src/main.jsx` via a `<script type="module">` tag.

#### `frontend/src/main.jsx`

React application entry — renders `<App />` into the DOM root.

#### `frontend/vite.config.js`

Configures Vite with the React plugin. Dev server runs on port 3000 to match the CORS origin.

#### `frontend/tailwind.config.js` + `frontend/postcss.config.js`

Tailwind CSS configured as a PostCSS plugin, scanning `./src/**/*.{js,jsx}` for class names.

#### `frontend/package.json`

Declares dependencies: `react`, `react-dom`; devDependencies: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`.

---

## Data Models

### Employee

| Column       | Type         | Constraints                  |
|--------------|--------------|------------------------------|
| `id`         | Integer      | Primary key, auto-increment  |
| `name`       | String(100)  | Not null                     |
| `email`      | String(120)  | Not null, unique             |
| `department` | String(100)  | Nullable                     |
| `role`       | String(100)  | Nullable                     |
| `start_date` | Date         | Nullable                     |
| `created_at` | DateTime     | Default: `utcnow`            |

Relationship: one Employee → many Tasks (cascade delete).

### Task

| Column        | Type         | Constraints                        |
|---------------|--------------|------------------------------------|
| `id`          | Integer      | Primary key, auto-increment        |
| `employee_id` | Integer      | FK → `employees.id`, not null      |
| `title`       | String(200)  | Not null                           |
| `description` | Text         | Nullable                           |
| `status`      | String(50)   | Default: `'Not Started'`           |
| `due_date`    | Date         | Nullable                           |
| `category`    | String(50)   | Default: `'document'`              |
| `created_at`  | DateTime     | Default: `utcnow`                  |
| `completed_at`| DateTime     | Nullable                           |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Requirements file contains all declared packages

*For any* package name in the set `{flask, flask-cors, flask-sqlalchemy, scikit-learn, pandas, numpy}`, the contents of `backend/requirements.txt` must contain a line that starts with that package name (case-insensitive).

This collapses requirements 1.1–1.6, which are all the same structural check applied to different package names.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**

---

### Property 2: App startup creates all declared model tables

*For any* fresh SQLite database (including an in-memory `:memory:` database), calling `create_app()` must result in all SQLAlchemy model tables (`employees`, `tasks`) existing in the database after the call returns.

This is a round-trip / invariant property: the factory function must always leave the DB in a state where declared tables are present, regardless of prior DB state.

**Validates: Requirements 2.5**

---

### Property 3: All declared blueprints are registered after app creation

*For any* blueprint name in the set `{employees, tasks, ml}`, after calling `create_app()` the resulting Flask app's `blueprints` dict must contain that name as a key.

This collapses requirements 3.1–3.3, which are the same registration check for each blueprint.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 4: Empty blueprints register without error

*For any* Flask Blueprint instance that contains no registered route handlers, calling `app.register_blueprint(bp)` on a Flask app must not raise an exception.

**Validates: Requirements 3.4**

---

### Property 5: Each route module exports a Blueprint instance

*For any* route module in the set `{routes.employees, routes.tasks, routes.ml}`, importing the module must expose an attribute (`employees_bp`, `tasks_bp`, `ml_bp` respectively) that is an instance of `flask.Blueprint`.

This collapses requirements 4.1–4.3.

**Validates: Requirements 4.1, 4.2, 4.3**

---

## Error Handling

Since this is a scaffold with no route logic, error handling at the route level is deferred. The scaffold-level concerns are:

- **Import errors**: Blueprint files must be importable without side effects. If a blueprint file raises on import (e.g., missing dependency), `create_app()` will fail. Each blueprint file should have minimal top-level code.
- **DB creation errors**: `db.create_all()` is called inside `app.app_context()`. If the SQLite file path is not writable, SQLAlchemy will raise. The factory does not suppress this — it should propagate so the developer sees the error immediately.
- **CORS misconfiguration**: If `flask-cors` is not installed, `create_app()` will raise `ImportError`. This is intentional — the requirements file must be installed before running.
- **Blueprint name collisions**: Each blueprint must use a unique `name` argument. The scaffold uses `'employees'`, `'tasks'`, and `'ml'` — these must not conflict with any future blueprints.

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:

- **Unit tests** verify specific examples, structural invariants, and integration points.
- **Property tests** verify universal properties across generated inputs.

### Unit Tests (pytest)

Focus on specific examples and integration points:

- `test_requirements_file_exists` — `backend/requirements.txt` is present on disk.
- `test_create_app_returns_flask_instance` — `create_app()` returns a `Flask` object.
- `test_db_uri_configured` — `app.config['SQLALCHEMY_DATABASE_URI'] == 'sqlite:///onboard.db'`.
- `test_cors_origin_header` — A test client request with `Origin: http://localhost:3000` receives `Access-Control-Allow-Origin` in the response.
- `test_blueprints_registered` — `app.blueprints` contains `employees`, `tasks`, `ml`.
- `test_route_modules_importable` — Each of `routes.employees`, `routes.tasks`, `routes.ml` imports without error.
- `test_blueprint_instances` — `employees_bp`, `tasks_bp`, `ml_bp` are `Blueprint` instances.
- `test_models_importable` — `models.py` imports without error; `Employee` and `Task` are `db.Model` subclasses.
- `test_routes_init_exists` — `backend/routes/__init__.py` exists on disk.
- `test_frontend_index_html_exists` — `frontend/index.html` exists.
- `test_frontend_src_entry_exists` — `frontend/src/main.jsx` (or equivalent) exists.

### Property-Based Tests (Hypothesis)

Use [Hypothesis](https://hypothesis.readthedocs.io/) for Python property tests. Configure each test with `@settings(max_examples=100)`.

Each property test must be tagged with a comment in the format:
`# Feature: project-scaffold, Property {N}: {property_text}`

**Property 1 test** — Generate package names from the required set; for each, assert `requirements.txt` contains a matching line.
```
# Feature: project-scaffold, Property 1: requirements.txt contains all declared packages
```

**Property 2 test** — Use a fresh in-memory SQLite URI; call `create_app()` with that URI; inspect `sqlite_master` to assert `employees` and `tasks` tables exist.
```
# Feature: project-scaffold, Property 2: app startup creates all declared model tables
```

**Property 3 test** — Generate blueprint names from `{employees, tasks, ml}`; assert each is in `app.blueprints` after `create_app()`.
```
# Feature: project-scaffold, Property 3: all declared blueprints are registered after app creation
```

**Property 4 test** — Generate arbitrary Blueprint names (random strings); create a blank Blueprint with that name; assert `app.register_blueprint(bp)` does not raise.
```
# Feature: project-scaffold, Property 4: empty blueprints register without error
```

**Property 5 test** — Generate module/attribute pairs from the declared route modules; import each and assert the exported attribute is a `Blueprint` instance.
```
# Feature: project-scaffold, Property 5: each route module exports a Blueprint instance
```

### Configuration

- Minimum 100 iterations per property test (`@settings(max_examples=100)`).
- Tests run with `pytest` from the `backend/` directory.
- Use a temporary directory or `:memory:` SQLite URI for DB tests to avoid polluting `onboard.db`.
