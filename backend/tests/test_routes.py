import sys
import os
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.strategies import sampled_from

# Ensure backend/ is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


# ---------------------------------------------------------------------------
# Task 4.1 — Unit tests for route modules
# ---------------------------------------------------------------------------

def test_route_modules_importable():
    """Each of routes.employees, routes.tasks, routes.ml imports without error.

    Validates: Requirements 4.1, 4.2, 4.3
    """
    import importlib
    for module_name in ('routes.employees', 'routes.tasks', 'routes.ml'):
        mod = importlib.import_module(module_name)
        assert mod is not None, f"Module '{module_name}' failed to import"


def test_blueprint_instances():
    """employees_bp, tasks_bp, ml_bp are Blueprint instances.

    Validates: Requirements 4.1, 4.2, 4.3
    """
    from flask import Blueprint
    from routes.employees import employees_bp
    from routes.tasks import tasks_bp
    from routes.ml import ml_bp

    assert isinstance(employees_bp, Blueprint), "employees_bp is not a Blueprint"
    assert isinstance(tasks_bp, Blueprint), "tasks_bp is not a Blueprint"
    assert isinstance(ml_bp, Blueprint), "ml_bp is not a Blueprint"


def test_routes_init_exists():
    """backend/routes/__init__.py exists on disk.

    Validates: Requirements 4.4
    """
    routes_init = os.path.join(os.path.dirname(__file__), '..', 'routes', '__init__.py')
    assert os.path.isfile(routes_init), "backend/routes/__init__.py does not exist"


# ---------------------------------------------------------------------------
# Task 4.2 — Property 4: empty blueprints register without error
# ---------------------------------------------------------------------------

# Feature: project-scaffold, Property 4: empty blueprints register without error

@given(
    st.text(
        alphabet=st.characters(
            whitelist_categories=('Ll', 'Lu'),
            min_codepoint=97,
            max_codepoint=122,
        ),
        min_size=1,
        max_size=20,
    )
)
@settings(max_examples=100)
def test_empty_blueprint_registers_without_error(name):
    """Property 4: empty blueprints register without error.

    Validates: Requirements 3.4
    """
    from flask import Flask, Blueprint

    # Use a fresh Flask app per iteration to avoid blueprint name collision errors
    app = Flask(__name__)
    bp = Blueprint(name, __name__)

    try:
        app.register_blueprint(bp)
    except Exception as exc:
        pytest.fail(
            f"register_blueprint raised an exception for name={name!r}: {exc}"
        )


# ---------------------------------------------------------------------------
# Task 4.3 — Property 5: each route module exports a Blueprint instance
# ---------------------------------------------------------------------------

# Feature: project-scaffold, Property 5: each route module exports a Blueprint instance

@given(
    sampled_from([
        ('routes.employees', 'employees_bp'),
        ('routes.tasks', 'tasks_bp'),
        ('routes.ml', 'ml_bp'),
    ])
)
@settings(max_examples=100)
def test_route_module_exports_blueprint(module_attr_pair):
    """Property 5: each route module exports a Blueprint instance.

    Validates: Requirements 4.1, 4.2, 4.3
    """
    import importlib
    from flask import Blueprint

    module_name, attr_name = module_attr_pair
    mod = importlib.import_module(module_name)
    bp = getattr(mod, attr_name, None)

    assert bp is not None, (
        f"Module '{module_name}' has no attribute '{attr_name}'"
    )
    assert isinstance(bp, Blueprint), (
        f"'{module_name}.{attr_name}' is not a Blueprint instance (got {type(bp)})"
    )
