import os
import pytest
from hypothesis import given, settings
from hypothesis.strategies import sampled_from

# Feature: project-scaffold, Property 1: requirements.txt contains all declared packages

REQUIREMENTS_PATH = os.path.join(os.path.dirname(__file__), '..', 'requirements.txt')

REQUIRED_PACKAGES = [
    'flask',
    'flask-cors',
    'flask-sqlalchemy',
    'scikit-learn',
    'pandas',
    'numpy',
]


def _load_requirements():
    with open(REQUIREMENTS_PATH, 'r') as f:
        return [line.strip().lower() for line in f if line.strip()]


@given(sampled_from(REQUIRED_PACKAGES))
@settings(max_examples=100)
def test_requirements_contains_all_declared_packages(package_name):
    """Property 1: requirements.txt contains all declared packages.

    Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
    """
    lines = _load_requirements()
    assert any(
        line.startswith(package_name.lower()) for line in lines
    ), f"requirements.txt does not contain a line starting with '{package_name}'"
