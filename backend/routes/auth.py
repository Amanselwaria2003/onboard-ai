from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from models import User, Employee

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    # Validate required fields
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    if not email or not password or not role:
        return jsonify({'error': 'email, password, and role are required'}), 400

    # Validate role
    if role not in ('admin', 'employee'):
        return jsonify({'error': 'role must be "admin" or "employee"'}), 400

    # Validate employee_id when role is employee
    employee_id = data.get('employee_id')
    if role == 'employee':
        if not employee_id:
            return jsonify({'error': 'employee_id is required for employee role'}), 400
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'employee_id does not reference a valid Employee'}), 400

    # Check for duplicate email
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'email already registered'}), 409

    # Hash password and persist user
    password_hash = generate_password_hash(password)
    user = User(
        email=email,
        password_hash=password_hash,
        role=role,
        employee_id=employee_id if role == 'employee' else None
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({
        'userId': user.id,
        'email': user.email,
        'role': user.role,
        'employeeId': user.employee_id
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'invalid credentials'}), 401

    if not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'invalid credentials'}), 401

    return jsonify({
        'userId': user.id,
        'email': user.email,
        'role': user.role,
        'employeeId': user.employee_id
    }), 200
