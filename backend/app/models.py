# app/models.py

import sqlite3
import hashlib
import uuid
import secrets
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import os
from collections import defaultdict

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
        
        # Create vocabulary_library table for users' custom vocabulary lists
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vocabulary_library (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                word TEXT NOT NULL,
                translation TEXT,
                level TEXT,
                notes TEXT,
                added_from TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_reviewed TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, word)
            )
        ''')
        
        # Create system_vocabulary table for core system vocabulary words
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS system_vocabulary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT NOT NULL,
                level TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(word, level)
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
        
    @staticmethod
    def get_user_mistakes(user_id: int, level: str = None) -> Dict:
        """Get user's mistake records"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        query = '''
            SELECT 
                word,
                level,
                incorrect_count as miss_count,
                correct_count,
                last_practiced
            FROM user_progress 
            WHERE user_id = ? AND incorrect_count > 0
        '''
        
        params = [user_id]
        
        if level and level != 'all':
            query += ' AND level = ?'
            params.append(level)
            
        query += ' ORDER BY incorrect_count DESC, last_practiced DESC'
        
        cursor.execute(query, params)
        
        mistakes = [dict(row) for row in cursor.fetchall()]
        
        # For each word, get its translation
        from app.services.translation import translate_text
        for mistake in mistakes:
            try:
                mistake['translation'] = translate_text(mistake['word'])
            except Exception:
                mistake['translation'] = '翻譯失敗'
        
        conn.close()
        
        return {'mistakes': mistakes}


class SystemVocabulary:
    @staticmethod
    def add_word(word: str, level: str) -> bool:
        """Add a word to the system vocabulary"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                'INSERT OR REPLACE INTO system_vocabulary (word, level) VALUES (?, ?)',
                (word, level)
            )
            
            conn.commit()
            return True
            
        except Exception as e:
            print(f"Error adding word to system vocabulary: {e}")
            return False
        finally:
            conn.close()
    
    @staticmethod
    def add_multiple_words(word_level_pairs: List[tuple]) -> bool:
        """Add multiple words to the system vocabulary"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.executemany(
                'INSERT OR REPLACE INTO system_vocabulary (word, level) VALUES (?, ?)',
                word_level_pairs
            )
            
            conn.commit()
            return True
            
        except Exception as e:
            print(f"Error adding words to system vocabulary: {e}")
            return False
        finally:
            conn.close()
    
    @staticmethod
    def get_words_by_level(level: str) -> List[str]:
        """Get all vocabulary words for a specific level"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT word FROM system_vocabulary WHERE level = ? ORDER BY word',
            (level,)
        )
        
        words = [row['word'] for row in cursor.fetchall()]
        conn.close()
        
        return words
    
    @staticmethod
    def get_all_words() -> Dict[str, List[str]]:
        """Get all vocabulary words grouped by level"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT word, level FROM system_vocabulary ORDER BY level, word')
        
        result = defaultdict(list)
        for row in cursor.fetchall():
            result[row['level']].append(row['word'])
        
        conn.close()
        return dict(result)
    
    @staticmethod
    def get_random_words(level: str, count: int = 4) -> List[str]:
        """Get random words from a specific level"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT word FROM system_vocabulary WHERE level = ? ORDER BY RANDOM() LIMIT ?',
            (level, count)
        )
        
        words = [row['word'] for row in cursor.fetchall()]
        conn.close()
        
        return words

class VocabularyLibrary:
    @staticmethod
    def add_word(user_id: int, word: str, translation: str = None, level: str = None, notes: str = None, added_from: str = 'manual') -> bool:
        """Add a word to user's vocabulary library"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        try:
            # If translation is not provided, try to translate the word
            if not translation:
                from app.services.translation import translate_text
                try:
                    translation = translate_text(word)
                except Exception:
                    translation = '翻譯失敗'
            
            cursor.execute('''
                INSERT INTO vocabulary_library (user_id, word, translation, level, notes, added_from, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, word) DO UPDATE SET
                    translation = COALESCE(?, translation),
                    level = COALESCE(?, level),
                    notes = COALESCE(?, notes),
                    added_from = COALESCE(?, added_from)
            ''', (user_id, word, translation, level, notes, added_from, translation, level, notes, added_from))
            
            conn.commit()
            return True
            
        except Exception as e:
            print(f"Error adding word to vocabulary library: {e}")
            return False
        finally:
            conn.close()
    
    @staticmethod
    def remove_word(user_id: int, word: str) -> bool:
        """Remove a word from user's vocabulary library"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                DELETE FROM vocabulary_library 
                WHERE user_id = ? AND word = ?
            ''', (user_id, word))
            
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            print(f"Error removing word from vocabulary library: {e}")
            return False
        finally:
            conn.close()
    
    @staticmethod
    def get_user_vocabulary(user_id: int, search_term: str = None, level: str = None) -> Dict:
        """Get user's vocabulary library with optional filtering"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        query = '''
            SELECT 
                id,
                word,
                translation,
                level,
                notes,
                added_from,
                created_at,
                last_reviewed
            FROM vocabulary_library 
            WHERE user_id = ?
        '''
        
        params = [user_id]
        
        if search_term:
            query += ' AND (word LIKE ? OR translation LIKE ?)'
            search_param = f'%{search_term}%'
            params.extend([search_param, search_param])
        
        if level and level != 'all':
            query += ' AND (level = ? OR level IS NULL)'
            params.append(level)
            
        query += ' ORDER BY created_at DESC'
        
        cursor.execute(query, params)
        
        vocabulary = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return {'vocabulary': vocabulary}
    
    @staticmethod
    def update_word_notes(user_id: int, word: str, notes: str) -> bool:
        """Update notes for a word in user's vocabulary library"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                UPDATE vocabulary_library 
                SET notes = ?
                WHERE user_id = ? AND word = ?
            ''', (notes, user_id, word))
            
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            print(f"Error updating word notes in vocabulary library: {e}")
            return False
        finally:
            conn.close()
    
    @staticmethod
    def record_review(user_id: int, word: str) -> bool:
        """Record that a word has been reviewed"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                UPDATE vocabulary_library 
                SET last_reviewed = CURRENT_TIMESTAMP
                WHERE user_id = ? AND word = ?
            ''', (user_id, word))
            
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            print(f"Error recording word review in vocabulary library: {e}")
            return False
        finally:
            conn.close()
