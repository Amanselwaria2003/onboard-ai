"""Run this once to seed dummy data: python seed.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from models import Employee, Task
from datetime import date, timedelta
import random

app = create_app()

employees_data = [
    {"name": "Priya Sharma", "email": "priya@company.com", "department": "Engineering", "role": "Frontend Developer", "start_date": date.today() - timedelta(days=20)},
    {"name": "Rahul Mehta", "email": "rahul@company.com", "department": "Marketing", "role": "Growth Manager", "start_date": date.today() - timedelta(days=15)},
    {"name": "Anjali Singh", "email": "anjali@company.com", "department": "Design", "role": "UI Designer", "start_date": date.today() - timedelta(days=10)},
    {"name": "Vikram Patel", "email": "vikram@company.com", "department": "Engineering", "role": "Backend Developer", "start_date": date.today() - timedelta(days=5)},
    {"name": "Neha Gupta", "email": "neha@company.com", "department": "HR", "role": "HR Executive", "start_date": date.today() - timedelta(days=30)},
    {"name": "Arjun Nair", "email": "arjun@company.com", "department": "Sales", "role": "Sales Executive", "start_date": date.today() - timedelta(days=12)},
]

task_templates = [
    {"title": "Submit ID Documents", "category": "document", "description": "Upload Aadhaar, PAN, and passport copies"},
    {"title": "Complete HR Orientation", "category": "training", "description": "Attend 2-hour HR orientation session"},
    {"title": "Setup Workstation", "category": "form", "description": "Request equipment and setup dev environment"},
    {"title": "Complete Security Training", "category": "training", "description": "Watch security awareness videos and pass quiz"},
    {"title": "Fill Emergency Contact Form", "category": "form", "description": "Provide emergency contact details"},
    {"title": "Sign NDA & Offer Letter", "category": "document", "description": "Sign and return all legal documents"},
    {"title": "Meet Team Members", "category": "meeting", "description": "1:1 introductions with direct team"},
    {"title": "Complete Product Training", "category": "training", "description": "Go through product walkthrough modules"},
]

statuses_mix = [
    ['Completed', 'Completed', 'Completed', 'In Progress', 'Not Started'],
    ['Completed', 'In Progress', 'Not Started', 'Not Started', 'Not Started'],
    ['Completed', 'Completed', 'Completed', 'Completed', 'In Progress'],
    ['Not Started', 'Not Started', 'Not Started', 'Not Started', 'Not Started'],
    ['Completed', 'Completed', 'Completed', 'Completed', 'Completed'],
    ['Completed', 'In Progress', 'In Progress', 'Not Started', 'Not Started'],
]

with app.app_context():
    db.drop_all()
    db.create_all()
    for i, ed in enumerate(employees_data):
        emp = Employee(**ed)
        db.session.add(emp)
        db.session.flush()
        statuses = statuses_mix[i % len(statuses_mix)]
        for j, tmpl in enumerate(task_templates[:5]):
            from datetime import datetime
            status = statuses[j]
            due = date.today() + timedelta(days=random.randint(-3, 14))
            task = Task(
                employee_id=emp.id,
                title=tmpl['title'],
                description=tmpl['description'],
                category=tmpl['category'],
                status=status,
                due_date=due,
                completed_at=datetime.utcnow() if status == 'Completed' else None
            )
            db.session.add(task)
    db.session.commit()
    print("Seeded successfully!")
