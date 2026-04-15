import sys
import os
import uuid
import pytest
from hypothesis import given, settings, assume, HealthCheck
from hypothesis import strategies as st
from werkzeug.security import generate_password_hash, check_password_hash

# Ensure backend/ is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


# ---------------------------------------------------------------------------
# Shared fixture: fresh in-memory Flask app + test client
# ---------------------------------------------------------------------------

def make_app():
    """Create a fresh Flask app backed by an in-memory SQLite database.

    We set DATABASE_URL to ':memory:' before calling create_app() so that
    db.create_all() inside create_app() targets the in-memory DB, not the
    file-based instance DB.
    """
    import os
    from app import create_app
    os.environ['DATABASE_URL'] = ':memory:'
    app = create_app()
    app.config['TESTING'] = True
    return app


def fresh_client():
    """Return (app, client) with all tables created in a clean in-memory DB."""
    app = make_app()
    client = app.test_client()
    return app, client


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

# Safe printable ASCII text, no NUL bytes, non-empty
safe_text = st.text(
    alphabet=st.characters(
        whitelist_categories=('Ll', 'Lu', 'Nd'),
        whitelist_characters='-_.',
    ),
    min_size=1,
    max_size=40,
)

# Email-like strings: localpart@domain.tld
email_strategy = st.builds(
    lambda local, domain: f"{local}@{domain}.test",
    local=safe_text,
    domain=safe_text,
)

# Passwords: printable ASCII, non-empty, min length 8 to avoid false positives
# where a short password substring appears in other JSON fields (email, userId, etc.)
password_strategy = st.text(
    alphabet=st.characters(
        whitelist_categories=('Ll', 'Lu', 'Nd'),
        whitelist_characters='!@#$%^&*()-_=+',
    ),
    min_size=8,
    max_size=50,
)

# Invalid role strings: anything that is not "admin" or "employee"
invalid_role_strategy = st.text(min_size=1).filter(
    lambda r: r not in ('admin', 'employee')
)

# Common settings for all property tests: disable deadline (bcrypt is slow),
# suppress too_slow health check
common_settings = settings(
    max_examples=50,
    deadline=None,
    suppress_health_check=[HealthCheck.too_slow],
)


# ---------------------------------------------------------------------------
# Property 1: Password hashing round-trip
# Feature: user-authentication, Property 1: Password hashing round-trip
# ---------------------------------------------------------------------------

@given(password=password_strategy)
@settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_password_hashing_round_trip(password):
    """Property 1: generate_password_hash then check_password_hash returns True;
    hash != plaintext.

    Validates: Requirements 2.1, 2.2
    """
    hashed = generate_password_hash(password)
    assert check_password_hash(hashed, password), (
        "check_password_hash returned False for a freshly hashed password"
    )
    assert hashed != password, (
        "Password hash must not equal the plaintext password"
    )


# ---------------------------------------------------------------------------
# Property 2: Plaintext password never appears in API response
# Feature: user-authentication, Property 2: Plaintext password never appears in API response
# ---------------------------------------------------------------------------

@given(
    email=email_strategy,
    password=password_strategy,
)
@common_settings
def test_plaintext_password_not_in_register_response(email, password):
    """Property 2 (register): raw password absent from register response body.

    Validates: Requirements 2.3
    """
    app, client = fresh_client()
    with app.app_context():
        resp = client.post('/api/auth/register', json={
            'email': email,
            'password': password,
            'role': 'admin',
        })
        data = resp.get_json() or {}
        # The password must not appear as a value in the response JSON
        for v in data.values():
            assert v != password, (
                f"Plaintext password found as a value in register response body"
            )
        # Also check the raw body doesn't contain the password as a JSON string value
        body = resp.get_data(as_text=True)
        import json
        assert json.dumps(password) not in body, (
            f"Plaintext password found as JSON string in register response body"
        )


@given(
    email=email_strategy,
    password=password_strategy,
)
@common_settings
def test_plaintext_password_not_in_login_response(email, password):
    """Property 2 (login): raw password absent from login response body.

    Validates: Requirements 2.3
    """
    app, client = fresh_client()
    with app.app_context():
        # Register first so login has something to find
        client.post('/api/auth/register', json={
            'email': email,
            'password': password,
            'role': 'admin',
        })
        resp = client.post('/api/auth/login', json={
            'email': email,
            'password': password,
        })
        data = resp.get_json() or {}
        for v in data.values():
            assert v != password, (
                f"Plaintext password found as a value in login response body"
            )
        import json
        body = resp.get_data(as_text=True)
        assert json.dumps(password) not in body, (
            f"Plaintext password found as JSON string in login response body"
        )


# ---------------------------------------------------------------------------
# Property 3: Login with valid credentials returns correct user data
# Feature: user-authentication, Property 3: Login with valid credentials returns correct user data
# ---------------------------------------------------------------------------

@given(
    email=email_strategy,
    password=password_strategy,
)
@common_settings
def test_login_valid_credentials_returns_correct_data(email, password):
    """Property 3: POST /api/auth/login with valid credentials returns 200
    with matching userId, email, role, employeeId.

    Validates: Requirements 3.1
    """
    app, client = fresh_client()
    with app.app_context():
        reg_resp = client.post('/api/auth/register', json={
            'email': email,
            'password': password,
            'role': 'admin',
        })
        assume(reg_resp.status_code == 201)
        reg_data = reg_resp.get_json()

        login_resp = client.post('/api/auth/login', json={
            'email': email,
            'password': password,
        })
        assert login_resp.status_code == 200, (
            f"Expected 200, got {login_resp.status_code}"
        )
        data = login_resp.get_json()
        assert data['userId'] == reg_data['userId']
        assert data['email'] == email
        assert data['role'] == 'admin'
        assert data['employeeId'] is None


# ---------------------------------------------------------------------------
# Property 4: Login with invalid credentials returns 401
# Feature: user-authentication, Property 4: Login with invalid credentials returns 401
# ---------------------------------------------------------------------------

@given(email=email_strategy, password=password_strategy)
@common_settings
def test_login_unknown_email_returns_401(email, password):
    """Property 4a: unknown email → 401.

    Validates: Requirements 3.2
    """
    app, client = fresh_client()
    with app.app_context():
        # Do NOT register — email is unknown
        resp = client.post('/api/auth/login', json={
            'email': email,
            'password': password,
        })
        assert resp.status_code == 401, (
            f"Expected 401 for unknown email, got {resp.status_code}"
        )


@given(
    email=email_strategy,
    correct_password=password_strategy,
    wrong_password=password_strategy,
)
@common_settings
def test_login_wrong_password_returns_401(email, correct_password, wrong_password):
    """Property 4b: correct email + wrong password → 401.

    Validates: Requirements 3.3
    """
    assume(correct_password != wrong_password)
    app, client = fresh_client()
    with app.app_context():
        reg = client.post('/api/auth/register', json={
            'email': email,
            'password': correct_password,
            'role': 'admin',
        })
        assume(reg.status_code == 201)

        resp = client.post('/api/auth/login', json={
            'email': email,
            'password': wrong_password,
        })
        assert resp.status_code == 401, (
            f"Expected 401 for wrong password, got {resp.status_code}"
        )


# ---------------------------------------------------------------------------
# Property 5: Registration with valid data creates user and returns correct fields
# Feature: user-authentication, Property 5: Registration with valid data creates user and returns correct fields
# ---------------------------------------------------------------------------

@given(
    email=email_strategy,
    password=password_strategy,
)
@common_settings
def test_register_valid_admin_creates_user(email, password):
    """Property 5: POST /api/auth/register with valid data returns 201 with
    correct fields and user exists in DB.

    Validates: Requirements 4.1
    """
    from extensions import db
    from models import User

    app, client = fresh_client()
    with app.app_context():
        resp = client.post('/api/auth/register', json={
            'email': email,
            'password': password,
            'role': 'admin',
        })
        assume(resp.status_code == 201)
        data = resp.get_json()

        assert 'userId' in data
        assert data['email'] == email
        assert data['role'] == 'admin'
        assert data['employeeId'] is None

        # Verify user exists in DB
        user = User.query.filter_by(email=email).first()
        assert user is not None, "User not found in database after registration"
        assert user.id == data['userId']


@given(
    email=email_strategy,
    password=password_strategy,
)
@common_settings
def test_register_valid_employee_creates_user(email, password):
    """Property 5 (employee role): registration with valid employee_id returns 201
    with correct fields and user exists in DB.

    Validates: Requirements 4.1
    """
    from extensions import db
    from models import User, Employee
    from datetime import date

    app, client = fresh_client()
    with app.app_context():
        # Use a unique email for the Employee record to avoid UNIQUE constraint
        # collisions across hypothesis examples
        emp_email = f"emp_{uuid.uuid4().hex}@internal.test"
        emp = Employee(
            name='Test Employee',
            email=emp_email,
            department='Engineering',
            role='Engineer',
            start_date=date.today(),
        )
        db.session.add(emp)
        db.session.commit()
        emp_id = emp.id

        resp = client.post('/api/auth/register', json={
            'email': email,
            'password': password,
            'role': 'employee',
            'employee_id': emp_id,
        })
        assume(resp.status_code == 201)
        data = resp.get_json()

        assert data['email'] == email
        assert data['role'] == 'employee'
        assert data['employeeId'] == emp_id

        user = User.query.filter_by(email=email).first()
        assert user is not None
        assert user.employee_id == emp_id


# ---------------------------------------------------------------------------
# Property 6: Duplicate email registration returns 409
# Feature: user-authentication, Property 6: Duplicate email registration returns 409
# ---------------------------------------------------------------------------

@given(
    email=email_strategy,
    password1=password_strategy,
    password2=password_strategy,
)
@common_settings
def test_duplicate_email_returns_409(email, password1, password2):
    """Property 6: second registration with same email returns 409.

    Validates: Requirements 4.2
    """
    app, client = fresh_client()
    with app.app_context():
        first = client.post('/api/auth/register', json={
            'email': email,
            'password': password1,
            'role': 'admin',
        })
        assume(first.status_code == 201)

        second = client.post('/api/auth/register', json={
            'email': email,
            'password': password2,
            'role': 'admin',
        })
        assert second.status_code == 409, (
            f"Expected 409 for duplicate email, got {second.status_code}"
        )


# ---------------------------------------------------------------------------
# Property 7: Invalid role value returns 400
# Feature: user-authentication, Property 7: Invalid role value returns 400
# ---------------------------------------------------------------------------

@given(
    email=email_strategy,
    password=password_strategy,
    role=invalid_role_strategy,
)
@common_settings
def test_invalid_role_returns_400(email, password, role):
    """Property 7: role not in ('admin', 'employee') → 400.

    Validates: Requirements 4.3
    """
    app, client = fresh_client()
    with app.app_context():
        resp = client.post('/api/auth/register', json={
            'email': email,
            'password': password,
            'role': role,
        })
        assert resp.status_code == 400, (
            f"Expected 400 for invalid role {role!r}, got {resp.status_code}"
        )


# ---------------------------------------------------------------------------
# Property 8: Employee role without valid employee_id returns 400
# Feature: user-authentication, Property 8: Employee role without valid employee_id returns 400
# ---------------------------------------------------------------------------

@given(
    email=email_strategy,
    password=password_strategy,
)
@common_settings
def test_employee_role_missing_employee_id_returns_400(email, password):
    """Property 8a: role='employee' with no employee_id → 400.

    Validates: Requirements 1.2, 4.4
    """
    app, client = fresh_client()
    with app.app_context():
        resp = client.post('/api/auth/register', json={
            'email': email,
            'password': password,
            'role': 'employee',
        })
        assert resp.status_code == 400, (
            f"Expected 400 for employee role without employee_id, got {resp.status_code}"
        )


@given(
    email=email_strategy,
    password=password_strategy,
    nonexistent_id=st.integers(min_value=99999, max_value=9999999),
)
@common_settings
def test_employee_role_nonexistent_employee_id_returns_400(email, password, nonexistent_id):
    """Property 8b: role='employee' with non-existent employee_id → 400.

    Validates: Requirements 1.2, 4.4
    """
    app, client = fresh_client()
    with app.app_context():
        resp = client.post('/api/auth/register', json={
            'email': email,
            'password': password,
            'role': 'employee',
            'employee_id': nonexistent_id,
        })
        assert resp.status_code == 400, (
            f"Expected 400 for non-existent employee_id, got {resp.status_code}"
        )


# ---------------------------------------------------------------------------
# Helpers for seeding tests
# ---------------------------------------------------------------------------

def _seed_user(email, password, role, employee_id=None):
    """Mirror of the seed_user helper in db_init.py — creates a User only if
    no User with that email already exists."""
    from extensions import db
    from models import User
    from werkzeug.security import generate_password_hash

    if not User.query.filter_by(email=email).first():
        user = User(
            email=email,
            password_hash=generate_password_hash(password),
            role=role,
            employee_id=employee_id,
        )
        db.session.add(user)


def _run_seed(employees):
    """Run the full seed logic (admin + one user per employee) against the
    current app context.  `employees` is a list of Employee ORM objects that
    have already been committed to the DB."""
    from models import User

    _seed_user('admin@company.com', 'admin123', 'admin')
    for emp in employees:
        _seed_user(emp.email, 'employee123', 'employee', emp.id)

    from extensions import db
    db.session.commit()


# ---------------------------------------------------------------------------
# Property 9: Every seeded employee has a corresponding user
# Feature: user-authentication, Property 9: Every seeded employee has a corresponding user
# ---------------------------------------------------------------------------

# Strategy: lists of (name, email) pairs — unique emails within each example
_employee_info_strategy = st.lists(
    st.tuples(
        safe_text,   # name
        email_strategy,  # email
    ),
    min_size=1,
    max_size=10,
    unique_by=lambda t: t[1],  # unique by email
)


@given(employee_infos=_employee_info_strategy)
@settings(max_examples=30, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_every_seeded_employee_has_a_user(employee_infos):
    """Property 9: After running the seed logic, every Employee record has
    exactly one User with role='employee', matching email, and employee_id
    pointing to that employee.

    # Feature: user-authentication, Property 9: Every seeded employee has a corresponding user
    Validates: Requirements 6.2
    """
    from extensions import db
    from models import Employee, User
    from datetime import date

    app, _ = fresh_client()
    with app.app_context():
        # Create Employee records
        employees = []
        for name, email in employee_infos:
            emp = Employee(
                name=name,
                email=email,
                department='Engineering',
                role='Engineer',
                start_date=date.today(),
            )
            db.session.add(emp)
        db.session.commit()

        employees = Employee.query.all()

        # Run seed
        _run_seed(employees)

        # Assert: every employee has exactly one matching User
        for emp in employees:
            users = User.query.filter_by(email=emp.email, role='employee').all()
            assert len(users) == 1, (
                f"Expected exactly 1 employee User for {emp.email!r}, found {len(users)}"
            )
            user = users[0]
            assert user.employee_id == emp.id, (
                f"User.employee_id {user.employee_id} != Employee.id {emp.id}"
            )
            assert user.role == 'employee', (
                f"Expected role='employee', got {user.role!r}"
            )


# ---------------------------------------------------------------------------
# Property 10: Seed is idempotent
# Feature: user-authentication, Property 10: Seed is idempotent
# ---------------------------------------------------------------------------

@given(employee_infos=_employee_info_strategy)
@settings(max_examples=30, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_seed_is_idempotent(employee_infos):
    """Property 10: Running the seed logic a second time does NOT increase the
    total number of User records — duplicate emails are silently skipped.

    # Feature: user-authentication, Property 10: Seed is idempotent
    Validates: Requirements 6.3
    """
    from extensions import db
    from models import Employee, User
    from datetime import date

    app, _ = fresh_client()
    with app.app_context():
        # Create Employee records
        for name, email in employee_infos:
            emp = Employee(
                name=name,
                email=email,
                department='Engineering',
                role='Engineer',
                start_date=date.today(),
            )
            db.session.add(emp)
        db.session.commit()

        employees = Employee.query.all()

        # First seed run
        _run_seed(employees)
        count_after_first = User.query.count()

        # Second seed run — must not add any new users
        _run_seed(employees)
        count_after_second = User.query.count()

        assert count_after_second == count_after_first, (
            f"Seed is not idempotent: user count grew from "
            f"{count_after_first} to {count_after_second} on second run"
        )
