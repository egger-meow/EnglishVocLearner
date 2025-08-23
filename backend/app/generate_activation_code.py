#!/usr/bin/env python3
# generate_activation_code.py - Generate or find unused activation codes

import os
import sys
import random
import string
import sqlite3
from datetime import datetime

# Constants
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')
ACTIVATION_CODE_LENGTH = 8  # Length of generated activation codes
DEFAULT_NEW_CODES = 5  # Default number of new codes to generate if needed

def generate_random_code(length=ACTIVATION_CODE_LENGTH):
    """Generate a random alphanumeric activation code"""
    # Use only uppercase letters and numbers for codes (avoid ambiguous characters)
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  # No I, O, 0, 1
    return ''.join(random.choice(chars) for _ in range(length))

def get_db_connection():
    """Create a database connection with row factory"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def list_activation_codes():
    """List all activation codes in the system with their status"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get counts of used and unused codes
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as used,
                SUM(CASE WHEN is_active != 1 OR is_active IS NULL THEN 1 ELSE 0 END) as unused
            FROM users
        """)
        
        counts = cursor.fetchone()
        
        print(f"\nACTIVATION CODE STATISTICS:")
        print(f"- Total codes: {counts['total']}")
        print(f"- Used codes: {counts['used']}")
        print(f"- Unused codes: {counts['unused']}")
        
        # List unused codes
        if counts['unused'] > 0:
            print("\nUNUSED ACTIVATION CODES:")
            cursor.execute("""
                SELECT activation_code, created_at
                FROM users
                WHERE is_active != 1 OR is_active IS NULL
                LIMIT 10
            """)
            
            for i, row in enumerate(cursor.fetchall(), 1):
                # Only display the code for cleaner output
                print(f"{i}. {row['activation_code']}")
                
            if counts['unused'] > 10:
                print(f"...and {counts['unused'] - 10} more unused codes available")
    
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    
    finally:
        if conn:
            conn.close()

def get_unused_activation_code(num_codes_to_generate=DEFAULT_NEW_CODES):
    """Get an unused activation code or generate new ones if needed"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check for unused codes
        cursor.execute("""
            SELECT activation_code FROM users
            WHERE is_active != 1 OR is_active IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        """)
        
        result = cursor.fetchone()
        
        # If unused code exists, return it
        if result:
            return result['activation_code']
        
        # Generate new codes
        print(f"\nGenerating {num_codes_to_generate} new activation codes...")
        
        # Create codes that don't exist in the database
        new_codes = []
        for _ in range(num_codes_to_generate):
            while True:
                code = generate_random_code()
                cursor.execute("SELECT COUNT(*) FROM users WHERE activation_code = ?", (code,))
                if cursor.fetchone()[0] == 0:
                    new_codes.append(code)
                    break
        
        # Insert the new codes
        current_time = datetime.now().isoformat()
        for code in new_codes:
            cursor.execute("""
                INSERT INTO users (activation_code, created_at, is_active)
                VALUES (?, ?, 0)
            """, (code, current_time))
        
        conn.commit()
        
        # Return one of the new codes
        return new_codes[0]
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return None
        
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    # Parse command line arguments
    num_codes = DEFAULT_NEW_CODES
    list_only = False
    
    for arg in sys.argv[1:]:
        if arg.lower() == '--list':
            list_only = True
        elif arg.isdigit():
            num_codes = int(arg)
    
    if list_only:
        list_activation_codes()
    else:
        # Get and print an activation code
        code = get_unused_activation_code(num_codes)
        
        if code:
            print("\nACTIVATION CODE: " + code)
            print("\nRun with --list to see all unused codes")
        else:
            print("Failed to get or generate an activation code.")

