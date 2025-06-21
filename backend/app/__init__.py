# app/__init__.py

import logging
from flask import Flask
from app.routes import quiz_bp
from app.auth import auth_bp
from app.models import Database
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    CORS(app)
    
    # Initialize database
    Database.init_db()
    
    # Register Blueprints
    app.register_blueprint(quiz_bp)
    app.register_blueprint(auth_bp)
    
    # Import and register initialization function
    from app.routes import init_vocabulary
    app.before_request(init_vocabulary)
    
    return app
