import sys
import os
import pytest

# Ensure backend/ is on the path so `from app import db` works in models.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


def test_models_importable():
    """Test that models.py imports without error.

    Validates: Requirements 5.1, 5.2, 5.3
    """
    import importlib
    mod = importlib.import_module('models')
    assert mod is not None


def test_employee_is_db_model_subclass():
    """Assert Employee is a db.Model subclass.

    Validates: Requirements 5.2
    """
    from extensions import db
    from models import Employee

    assert issubclass(Employee, db.Model)


def test_task_is_db_model_subclass():
    """Assert Task is a db.Model subclass.

    Validates: Requirements 5.3
    """
    from extensions import db
    from models import Task

    assert issubclass(Task, db.Model)


@pytest.fixture
def app_ctx():
    """Provide a Flask app context with an in-memory SQLite DB."""
    from app import create_app
    from extensions import db as _db
    app = create_app()
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.app_context():
        _db.create_all()
        yield app


def test_employee_table_created(app_ctx):
    """Employee table exists after db.create_all().

    Validates: Requirements 5.2
    """
    from extensions import db
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    assert 'employees' in inspector.get_table_names()


def test_task_table_created(app_ctx):
    """Task table exists after db.create_all().

    Validates: Requirements 5.3
    """
    from extensions import db
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    assert 'tasks' in inspector.get_table_names()
