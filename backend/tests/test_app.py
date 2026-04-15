import sys
import os
import pytest
from hypothesis import given, settings
from hypothesis.strategies import sampled_from

# Ensure backend/ is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


# ---------------------------------------------------------------------------
# Task 3.1 — Unit tests for app factory
# ---------------------------------------------------------------------------

def test_create_app_returns_flask_instance():
    """create_app() returns a Flask object.

    Validates: Requirements 2.1
    """
    from flask import Flask
    from app import create_app
    app = create_app()
    assert isinstance(app, Flask)


def test_db_uri_configured():
    """App config contains a SQLite URI.

    Validates: Requirements 2.2
    """
    from app import create_app
    # Patch DATABASE_URL so the factory uses the default sqlite:///onboard.db path
    env_backup = os.environ.pop('DATABASE_URL', None)
    try:
        app = create_app()
        uri = app.config['SQLALCHEMY_DATABASE_URI']
        assert uri.startswith('sqlite:///'), (
            f"Expected SQLite URI, got: {uri}"
        )
    finally:
        if env_backup is not None:
            os.environ['DATABASE_URL'] = env_backup


def test_cors_origin_header():
    """A request with Origin: http://localhost:3000 receives Access-Control-Allow-Origin.

    Validates: Requirements 2.4
    """
    from app import create_app
    app = create_app()
    client = app.test_client()
    # Use OPTIONS preflight on an /api/* route so flask-cors adds the header
    response = client.options(
        '/api/employees',
        headers={
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
        }
    )
    assert 'Access-Control-Allow-Origin' in response.headers, (
        "CORS header missing from response"
    )


def test_blueprints_registered():
    """app.blueprints contains employees, tasks, ml.

    Validates: Requirements 3.1, 3.2, 3.3
    """
    from app import create_app
    app = create_app()
    for name in ('employees', 'tasks', 'ml'):
        assert name in app.blueprints, f"Blueprint '{name}' not registered"


# ---------------------------------------------------------------------------
# Task 3.2 — Property 2: app startup creates all declared model tables
# ---------------------------------------------------------------------------

# Feature: project-scaffold, Property 2: app startup creates all declared model tables

@given(sampled_from(['employees', 'tasks']))
@settings(max_examples=100)
def test_app_startup_creates_model_tables(table_name):
    """Property 2: app startup creates all declared model tables.

    Validates: Requirements 2.5
    """
    from app import create_app
    from extensions import db
    app = create_app()
    # Override to in-memory DB so we don't touch onboard.db
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.app_context():
        db.create_all()
        result = db.session.execute(
            db.text("SELECT name FROM sqlite_master WHERE type='table' AND name=:tname"),
            {'tname': table_name}
        ).fetchone()
        assert result is not None, f"Table '{table_name}' not found in sqlite_master"


# ---------------------------------------------------------------------------
# Task 3.3 — Property 3: all declared blueprints are registered after app creation
# ---------------------------------------------------------------------------

# Feature: project-scaffold, Property 3: all declared blueprints are registered after app creation

@given(sampled_from(['employees', 'tasks', 'ml']))
@settings(max_examples=100)
def test_all_blueprints_registered_after_create_app(blueprint_name):
    """Property 3: all declared blueprints are registered after app creation.

    Validates: Requirements 3.1, 3.2, 3.3
    """
    from app import create_app
    app = create_app()
    assert blueprint_name in app.blueprints, (
        f"Blueprint '{blueprint_name}' not in app.blueprints"
    )
