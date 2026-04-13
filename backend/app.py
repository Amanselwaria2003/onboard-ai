from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # On Render, use the mounted persistent disk path; locally use instance/onboard.db
    db_path = os.environ.get(
        'DATABASE_URL',
        os.path.join(app.instance_path, 'onboard.db')
    )
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    frontend_origin = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    CORS(app, resources={r"/api/*": {"origins": frontend_origin}})

    db.init_app(app)

    from routes.employees import employees_bp
    from routes.tasks import tasks_bp
    from routes.ml import ml_bp

    app.register_blueprint(employees_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(ml_bp)

    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
