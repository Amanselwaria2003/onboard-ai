from flask import Blueprint, request, jsonify
from app import db
from models import Employee, Task
from datetime import datetime

employees_bp = Blueprint('employees', __name__)

@employees_bp.route('/api/employees', methods=['GET'])
def get_employees():
    employees = Employee.query.all()
    return jsonify([e.to_dict() for e in employees])

@employees_bp.route('/api/employees/<int:eid>', methods=['GET'])
def get_employee(eid):
    e = Employee.query.get_or_404(eid)
    return jsonify(e.to_dict(include_tasks=True))

@employees_bp.route('/api/employees', methods=['POST'])
def create_employee():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({'error': 'name and email are required'}), 400
    try:
        start = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else datetime.utcnow().date()
        emp = Employee(
            name=data['name'],
            email=data['email'],
            department=data.get('department', ''),
            role=data.get('role', ''),
            start_date=start
        )
        db.session.add(emp)
        db.session.commit()
        return jsonify(emp.to_dict()), 201
    except Exception as ex:
        db.session.rollback()
        return jsonify({'error': str(ex)}), 400

@employees_bp.route('/api/employees/<int:eid>', methods=['DELETE'])
def delete_employee(eid):
    e = Employee.query.get_or_404(eid)
    db.session.delete(e)
    db.session.commit()
    return jsonify({'message': 'deleted'}), 200
