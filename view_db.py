import sqlite3
import os
import sys

def view_database():
    try:
        # Connect to the SQLite database
        print(f"Connecting to database at: e:\\EnglishVocLearner\\backend\\app\\database.db")
        conn = sqlite3.connect('backend/app/database.db')
        cursor = conn.cursor()
        
        # Get list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("\n=== TABLES IN DATABASE ===")
        for table in tables:
            table_name = table[0]
            print(f"\n--- Table: {table_name} ---")
            
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            print("\nSchema:")
            for col in columns:
                print(f"  {col[1]} ({col[2]})", end="")
                if col[5] == 1:  # Primary key
                    print(" PRIMARY KEY", end="")
                print()
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"\nRow count: {count}")
            
            # Display sample data (first 5 rows)
            if count > 0:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
                rows = cursor.fetchall()
                print("\nSample data (up to 5 rows):")
                column_names = [col[1] for col in columns]
                print("  " + " | ".join(column_names))
                print("  " + "-" * (sum(len(name) + 3 for name in column_names) - 1))
                for row in rows:
                    formatted_row = []
                    for item in row:
                        if item is None:
                            formatted_row.append("NULL")
                        else:
                            formatted_row.append(str(item))
                    print("  " + " | ".join(formatted_row))
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    view_database()
