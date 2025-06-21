#!/usr/bin/env python3
"""
Database initialization script
Run this script to initialize the database and generate activation codes
"""

import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.models import Database, User

def main():
    print("Initializing database...")
    
    # Initialize database tables
    Database.init_db()
    print("✓ Database tables created successfully")
    
    # Generate initial activation codes
    print("Generating activation codes...")
    codes = User.create_activation_codes(20)  # Generate 20 codes initially
    
    print(f"✓ Generated {len(codes)} activation codes:")
    print("=" * 50)
    for i, code in enumerate(codes, 1):
        print(f"{i:2d}. {code}")
    print("=" * 50)
    
    print("\nDatabase initialization completed successfully!")
    print("Users can now use these activation codes to create accounts.")

if __name__ == "__main__":
    main()
