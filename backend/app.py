from flask import Flask
from flask_cors import CORS
from extensions import db
import os

def create_app():
    app = Flask(__name__)

    db_path = os.environ.get(
        'DATABASE_URL',
        os.path.join(app.instance_path, 'onboard.db')
    )
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    frontend_origin = os.environ.get('FRONTEND_URL', None)
    if frontend_origin:
        allowed_origins = [frontend_origin]
    else:
        allowed_origins = r"http://localhost:.*"
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

    db.init_app(app)

    from routes.employees import employees_bp
    from routes.tasks import tasks_bp
    from routes.ml import ml_bp
    from routes.auth import auth_bp

    app.register_blueprint(employees_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(ml_bp)
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    create_app().run(debug=True, port=5000)
