from flask import Blueprint, request, jsonify
from app import db
from models import Task, Employee
from datetime import datetime

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/api/tasks', methods=['GET'])
def get_tasks():
    eid = request.args.get('employee_id')
    if eid:
        Employee.query.get_or_404(int(eid))
        tasks = Task.query.filter_by(employee_id=int(eid)).all()
    else:
        tasks = Task.query.all()
    return jsonify([t.to_dict() for t in tasks])

@tasks_bp.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    if not data or not data.get('employee_id') or not data.get('title'):
        return jsonify({'error': 'employee_id and title required'}), 400
    Employee.query.get_or_404(int(data['employee_id']))
    try:
        due = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None
        task = Task(
            employee_id=int(data['employee_id']),
            title=data['title'],
            description=data.get('description', ''),
            status=data.get('status', 'Not Started'),
            due_date=due,
            category=data.get('category', 'document')
        )
        db.session.add(task)
        db.session.commit()
        return jsonify(task.to_dict()), 201
    except Exception as ex:
        db.session.rollback()
        return jsonify({'error': str(ex)}), 400

@tasks_bp.route('/api/tasks/<int:tid>', methods=['PATCH'])
def update_task(tid):
    task = Task.query.get_or_404(tid)
    data = request.get_json()
    if 'status' in data:
        task.status = data['status']
        if data['status'] == 'Completed' and not task.completed_at:
            task.completed_at = datetime.utcnow()
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'due_date' in data and data['due_date']:
        task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
    if 'category' in data:
        task.category = data['category']
    db.session.commit()
    return jsonify(task.to_dict())

@tasks_bp.route('/api/tasks/<int:tid>', methods=['DELETE'])
def delete_task(tid):
    task = Task.query.get_or_404(tid)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'deleted'})
