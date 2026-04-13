from app import db
from datetime import datetime

class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    department = db.Column(db.String(100))
    role = db.Column(db.String(100))
    start_date = db.Column(db.Date, default=datetime.utcnow().date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tasks = db.relationship('Task', backref='employee', cascade='all, delete-orphan', lazy=True)

    def to_dict(self, include_tasks=False):
        total = len(self.tasks)
        completed = sum(1 for t in self.tasks if t.status == 'Completed')
        in_progress = sum(1 for t in self.tasks if t.status == 'In Progress')
        not_started = sum(1 for t in self.tasks if t.status == 'Not Started')
        pct = round((completed / total * 100) if total > 0 else 0, 1)
        d = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'department': self.department,
            'role': self.role,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'task_summary': {
                'total': total,
                'completed': completed,
                'in_progress': in_progress,
                'not_started': not_started,
                'percent_complete': pct
            }
        }
        if include_tasks:
            d['tasks'] = [t.to_dict() for t in self.tasks]
        return d


class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='Not Started')
    due_date = db.Column(db.Date)
    category = db.Column(db.String(50), default='document')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'category': self.category,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }
