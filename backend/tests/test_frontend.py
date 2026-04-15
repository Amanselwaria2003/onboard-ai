"""Tests for frontend file existence. Requirements: 6.3, 6.4"""
import os

# Workspace root is two levels up from backend/tests/
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def test_frontend_index_html_exists():
    path = os.path.join(WORKSPACE_ROOT, 'frontend', 'index.html')
    assert os.path.isfile(path), f"Expected frontend/index.html to exist at {path}"


def test_frontend_src_entry_exists():
    path = os.path.join(WORKSPACE_ROOT, 'frontend', 'src', 'main.jsx')
    assert os.path.isfile(path), f"Expected frontend/src/main.jsx to exist at {path}"
