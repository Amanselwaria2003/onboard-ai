from flask import Blueprint, jsonify
from models import Employee
from datetime import date

ml_bp = Blueprint('ml', __name__)

COLORS = {'On Track': 'green', 'At Risk': 'amber', 'Delayed': 'red'}


def rule_based(pct, overdue):
    if pct >= 70:
        return 'On Track'
    elif pct >= 40 and overdue <= 1:
        return 'At Risk'
    return 'Delayed'


def compute_status(employee):
    tasks = employee.tasks
    total = len(tasks)
    today = date.today()

    completed_tasks = [t for t in tasks if t.status == 'Completed']
    percent_complete = round(len(completed_tasks) / total * 100, 1) if total > 0 else 0

    overdue_count = sum(
        1 for t in tasks
        if t.due_date and t.due_date < today and t.status != 'Completed'
    )

    start = employee.start_date if employee.start_date else today
    days_since_start = (today - start).days

    avg_days_to_complete = 0
    if completed_tasks:
        durations = [
            (t.completed_at - t.created_at).days
            for t in completed_tasks
            if t.completed_at and t.created_at
        ]
        avg_days_to_complete = round(sum(durations) / len(durations), 2) if durations else 0

    # Try ML model, fall back to rule-based if model.pkl not available
    try:
        from ml_model import predict
        label = predict(percent_complete, overdue_count, days_since_start, avg_days_to_complete)
    except Exception:
        label = rule_based(percent_complete, overdue_count)

    return {
        'status': label,
        'color': COLORS.get(label, 'gray'),
        'percent_complete': percent_complete,
        'overdue_count': overdue_count,
        'days_since_start': days_since_start,
    }


@ml_bp.route('/api/ml/status/<int:eid>', methods=['GET'])
def ml_status(eid):
    emp = Employee.query.get_or_404(eid)
    result = compute_status(emp)
    result['employee_id'] = eid
    return jsonify(result)


@ml_bp.route('/api/ml/status/all', methods=['GET'])
def ml_status_all():
    employees = Employee.query.all()
    results = []
    for emp in employees:
        r = compute_status(emp)
        r['employee_id'] = emp.id
        r['employee_name'] = emp.name
        results.append(r)
    return jsonify(results)
