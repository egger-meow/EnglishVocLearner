import sqlite3
import os
from datetime import datetime

def inspect_database(db_path):
    """Inspect SQLite database and print its structure and contents"""
    print(f"\n{'='*60}")
    print(f"DATABASE INSPECTION: {db_path}")
    print(f"{'='*60}")
    
    try:
        # Check if file exists
        if not os.path.exists(db_path):
            print(f"Error: Database file not found at {db_path}")
            return
            
        print(f"Database file size: {os.path.getsize(db_path):,} bytes")
        print(f"Last modified: {datetime.fromtimestamp(os.path.getmtime(db_path))}")
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row  # Use dictionary-like rows
        cursor = conn.cursor()
        
        # Get list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        tables = [row[0] for row in cursor.fetchall()]
        
        if not tables:
            print("\nNo tables found in the database.")
            return
            
        print(f"\nFound {len(tables)} tables: {', '.join(tables)}\n")
        
        # Examine each table
        for table in tables:
            print(f"\n{'='*60}")
            print(f"TABLE: {table}")
            print(f"{'='*60}")
            
            # Get schema
            cursor.execute(f"PRAGMA table_info({table})")
            columns = cursor.fetchall()
            
            print("\nCOLUMN DEFINITIONS:")
            print(f"{'NAME':<20} {'TYPE':<12} {'NOT NULL':<10} {'DEFAULT':<15} {'PRIMARY KEY'}")
            print("-" * 70)
            
            for col in columns:
                print(f"{col['name']:<20} {col['type']:<12} {'Yes' if col['notnull'] else 'No':<10} "
                      f"{str(col['dflt_value']):<15} {'Yes' if col['pk'] else 'No'}")
            
            # Count rows
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]
            print(f"\nTotal rows: {row_count}")
            
            # Get sample data (up to 10 rows)
            if row_count > 0:
                cursor.execute(f"SELECT * FROM {table} LIMIT 10")
                rows = cursor.fetchall()
                
                print("\nSAMPLE DATA (up to 10 rows):")
                # Print column headers
                col_names = [col['name'] for col in columns]
                print(" | ".join(col_names))
                print("-" * (sum(len(name) + 3 for name in col_names)))
                
                # Print data
                for row in rows:
                    row_values = []
                    for col_name in col_names:
                        value = row[col_name]
                        # Format None values and limit long strings
                        if value is None:
                            row_values.append("NULL")
                        elif isinstance(value, str) and len(value) > 30:
                            row_values.append(f"{value[:27]}...")
                        else:
                            row_values.append(str(value))
                    print(" | ".join(row_values))
    
    except sqlite3.Error as e:
        print(f"\nSQLite Error: {e}")
    except Exception as e:
        print(f"\nError: {e}")
    finally:
        if 'conn' in locals():
            conn.close()
            
if __name__ == "__main__":
    db_path = os.path.abspath("backend/app/database.db")
    inspect_database(db_path)
