# app/models.py

import sqlite3
import hashlib
import uuid
import secrets
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

class Database:
    @staticmethod
    def get_connection():
        """Get database connection"""
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row  # Enable dict-like access to rows
        return conn
    
    @staticmethod
    def init_db():
        """Initialize database with required tables"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                activation_code TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                password_hash TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activated_at TIMESTAMP,
                is_active BOOLEAN DEFAULT FALSE,
                last_login TIMESTAMP
            )
        ''')
        
        # Create user_progress table for tracking quiz progress
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                level TEXT NOT NULL,
                word TEXT NOT NULL,
                correct_count INTEGER DEFAULT 0,
                incorrect_count INTEGER DEFAULT 0,
                last_practiced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, level, word)
            )
        ''')
        
        # Create sessions table for managing user sessions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()

class User:
    @staticmethod
    def generate_activation_code():
        """Generate a unique activation code using hash function"""
        # Create a unique identifier
        unique_id = str(uuid.uuid4()) + str(datetime.now().timestamp())
        
        # Generate hash
        hash_object = hashlib.sha256(unique_id.encode())
        activation_code = hash_object.hexdigest()[:16].upper()  # Use first 16 chars, uppercase
        
        return activation_code
    
    @staticmethod
    def create_activation_codes(count: int = 50):
        """Create multiple activation codes in advance"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        created_codes = []
        for _ in range(count):
            while True:
                try:
                    activation_code = User.generate_activation_code()
                    cursor.execute(
                        'INSERT INTO users (activation_code) VALUES (?)',
                        (activation_code,)
                    )
                    created_codes.append(activation_code)
                    break
                except sqlite3.IntegrityError:
                    # Code already exists, generate a new one
                    continue
        
        conn.commit()
        conn.close()
        return created_codes
    
    @staticmethod
    def get_available_activation_codes():
        """Get all unused activation codes"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT activation_code FROM users WHERE username IS NULL AND email IS NULL'
        )
        codes = [row['activation_code'] for row in cursor.fetchall()]
        
        conn.close()
        return codes
    
    @staticmethod
    def validate_activation_code(activation_code: str) -> bool:
        """Check if activation code exists and is unused"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT id FROM users WHERE activation_code = ? AND username IS NULL AND email IS NULL',
            (activation_code,)
        )
        result = cursor.fetchone()
        
        conn.close()
        return result is not None
    
    @staticmethod
    def create_user(activation_code: str, username: str, email: str, password: str) -> Optional[Dict]:
        """Create a new user account using activation code"""
        if not User.validate_activation_code(activation_code):
            return None
        
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        try:
            # Hash password
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Update the user record
            cursor.execute('''
                UPDATE users 
                SET username = ?, email = ?, password_hash = ?, 
                    activated_at = CURRENT_TIMESTAMP, is_active = TRUE
                WHERE activation_code = ? AND username IS NULL AND email IS NULL
            ''', (username, email, password_hash, activation_code))
            
            if cursor.rowcount == 0:
                return None
            
            # Get the created user
            cursor.execute(
                'SELECT id, username, email, activation_code, created_at, activated_at FROM users WHERE activation_code = ?',
                (activation_code,)
            )
            user_data = dict(cursor.fetchone())
            
            conn.commit()
            conn.close()
            
            return user_data
            
        except sqlite3.IntegrityError:
            conn.close()
            return None
    
    @staticmethod
    def authenticate(username: str, password: str) -> Optional[Dict]:
        """Authenticate user with username and password"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT id, username, email, password_hash, is_active FROM users WHERE username = ? AND is_active = TRUE',
            (username,)
        )
        user = cursor.fetchone()
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            # Update last login
            cursor.execute(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                (user['id'],)
            )
            conn.commit()
            
            user_data = {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'is_active': user['is_active']
            }
            
            conn.close()
            return user_data
        
        conn.close()
        return None
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[Dict]:
        """Get user by ID"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT id, username, email, created_at, activated_at, last_login FROM users WHERE id = ? AND is_active = TRUE',
            (user_id,)
        )
        user = cursor.fetchone()
        
        conn.close()
        return dict(user) if user else None

class Session:
    @staticmethod
    def create_session(user_id: int) -> str:
        """Create a new session for user"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        # Generate secure session token
        session_token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(days=7)  # Session expires in 7 days
        
        cursor.execute('''
            INSERT INTO sessions (user_id, session_token, expires_at)
            VALUES (?, ?, ?)
        ''', (user_id, session_token, expires_at))
        
        conn.commit()
        conn.close()
        
        return session_token
    
    @staticmethod
    def validate_session(session_token: str) -> Optional[Dict]:
        """Validate session token and return user data"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT s.user_id, u.username, u.email, s.expires_at
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? AND s.is_active = TRUE AND s.expires_at > CURRENT_TIMESTAMP
        ''', (session_token,))
        
        session_data = cursor.fetchone()
        conn.close()
        
        return dict(session_data) if session_data else None
    
    @staticmethod
    def invalidate_session(session_token: str):
        """Invalidate a session"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'UPDATE sessions SET is_active = FALSE WHERE session_token = ?',
            (session_token,)
        )
        
        conn.commit()
        conn.close()

class UserProgress:
    @staticmethod
    def record_answer(user_id: int, level: str, word: str, is_correct: bool):
        """Record user's answer for a word"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        if is_correct:
            cursor.execute('''
                INSERT INTO user_progress (user_id, level, word, correct_count, last_practiced)
                VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, level, word) DO UPDATE SET
                    correct_count = correct_count + 1,
                    last_practiced = CURRENT_TIMESTAMP
            ''', (user_id, level, word))
        else:
            cursor.execute('''
                INSERT INTO user_progress (user_id, level, word, incorrect_count, last_practiced)
                VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, level, word) DO UPDATE SET
                    incorrect_count = incorrect_count + 1,
                    last_practiced = CURRENT_TIMESTAMP
            ''', (user_id, level, word))
        
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_user_stats(user_id: int) -> Dict:
        """Get user's learning statistics"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                level,
                COUNT(*) as words_practiced,
                SUM(correct_count) as total_correct,
                SUM(incorrect_count) as total_incorrect,
                AVG(CAST(correct_count AS FLOAT) / (correct_count + incorrect_count + 1)) as accuracy
            FROM user_progress 
            WHERE user_id = ?
            GROUP BY level
        ''', (user_id,))
        
        stats = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return {'level_stats': stats}
