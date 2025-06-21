# app/auth.py

from flask import Blueprint, request, jsonify, session
from functools import wraps
from app.models import User, Session, Database
import re

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username):
    """Validate username format"""
    # Username should be 3-20 characters, alphanumeric and underscore only
    pattern = r'^[a-zA-Z0-9_]{3,20}$'
    return re.match(pattern, username) is not None

def validate_password(password):
    """Validate password strength"""
    # Password should be at least 6 characters
    return len(password) >= 6

def login_required(f):
    """Decorator to require login for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        session_token = request.headers.get('Authorization')
        if not session_token:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Remove 'Bearer ' prefix if present
        if session_token.startswith('Bearer '):
            session_token = session_token[7:]
        
        session_data = Session.validate_session(session_token)
        if not session_data:
            return jsonify({'error': 'Invalid or expired session'}), 401
        
        # Add user info to request context
        request.current_user = session_data
        return f(*args, **kwargs)
    
    return decorated_function

@auth_bp.route('/api/auth/check-activation-code', methods=['POST'])
def check_activation_code():
    """Check if activation code is valid"""
    data = request.get_json()
    if not data or not data.get('activation_code'):
        return jsonify({'error': 'Activation code is required'}), 400
    
    activation_code = data['activation_code'].strip().upper()
    
    if User.validate_activation_code(activation_code):
        return jsonify({'valid': True, 'message': 'Activation code is valid'})
    else:
        return jsonify({'valid': False, 'message': 'Invalid or already used activation code'}), 400

@auth_bp.route('/api/auth/signup', methods=['POST'])
def signup():
    """Register a new user with activation code"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    activation_code = data.get('activation_code', '').strip().upper()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    # Validate input
    if not activation_code:
        return jsonify({'error': 'Activation code is required'}), 400
    
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    
    # Validate format
    if not validate_username(username):
        return jsonify({'error': 'Username must be 3-20 characters and contain only letters, numbers, and underscores'}), 400
    
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    if not validate_password(password):
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
    
    # Create user
    user = User.create_user(activation_code, username, email, password)
    if not user:
        return jsonify({'error': 'Invalid activation code or username/email already exists'}), 400
    
    # Create session
    session_token = Session.create_session(user['id'])
    
    return jsonify({
        'message': 'Account created successfully',
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email']
        },
        'session_token': session_token
    }), 201

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Authenticate user
    user = User.authenticate(username, password)
    if not user:
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Create session
    session_token = Session.create_session(user['id'])
    
    return jsonify({
        'message': 'Login successful',
        'user': user,
        'session_token': session_token
    })

@auth_bp.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    """Logout user"""
    session_token = request.headers.get('Authorization')
    if session_token and session_token.startswith('Bearer '):
        session_token = session_token[7:]
        Session.invalidate_session(session_token)
    
    return jsonify({'message': 'Logout successful'})

@auth_bp.route('/api/auth/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current user info"""
    user_data = request.current_user
    user = User.get_user_by_id(user_data['user_id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user})

@auth_bp.route('/api/auth/available-codes', methods=['GET'])
def get_available_codes():
    """Get available activation codes (for admin/debugging purposes)"""
    codes = User.get_available_activation_codes()
    return jsonify({
        'available_codes': codes,
        'count': len(codes)
    })

@auth_bp.route('/api/auth/generate-codes', methods=['POST'])
def generate_activation_codes():
    """Generate new activation codes"""
    data = request.get_json()
    count = data.get('count', 10) if data else 10
    
    if count < 1 or count > 100:
        return jsonify({'error': 'Count must be between 1 and 100'}), 400
    
    codes = User.create_activation_codes(count)
    return jsonify({
        'message': f'Generated {len(codes)} activation codes',
        'codes': codes
    })
