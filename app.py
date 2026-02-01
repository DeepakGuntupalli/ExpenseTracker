"""
Flask Backend for Personal Expense Tracker
==========================================
This file contains the REST API endpoints for the expense tracker application.
It uses SQLite for data persistence and Flask for handling HTTP requests.

Author: Personal Expense Tracker
Date: February 2026
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
from datetime import datetime
import os

# ============================================================================
# FLASK APP INITIALIZATION
# ============================================================================

# Create Flask application instance
app = Flask(__name__, static_folder='.', static_url_path='')

# Enable CORS (Cross-Origin Resource Sharing) to allow frontend requests
# This is necessary when frontend and backend are on different ports during development
CORS(app)

# Database file path - stored in the same directory as app.py
DATABASE = 'expenses.db'


# ============================================================================
# DATABASE HELPER FUNCTIONS
# ============================================================================

def get_db_connection():
    """
    Create and return a database connection.
    
    Returns:
        sqlite3.Connection: A connection object to the SQLite database
        
    Note:
        - sqlite3.Row allows accessing columns by name (like a dictionary)
        - Connection should be closed after use
    """
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # Enable column access by name
    return conn


def init_db():
    """
    Initialize the database by creating the expenses table if it doesn't exist.
    
    Table Schema:
        - id: Unique identifier (auto-incrementing primary key)
        - title: Name/description of the expense
        - category: Type of expense (Food, Transport, etc.)
        - amount: Cost of the expense (stored as REAL for decimal values)
        - date: When the expense was recorded (ISO format string)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create expenses table with all required columns
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully!")


def row_to_dict(row):
    """
    Convert a sqlite3.Row object to a dictionary.
    
    Args:
        row: A sqlite3.Row object
        
    Returns:
        dict: Dictionary representation of the row
    """
    return dict(row)


# ============================================================================
# STATIC FILE ROUTES
# ============================================================================

@app.route('/')
def serve_index():
    """
    Serve the main HTML page.
    
    This route serves the index.html file when users visit the root URL.
    Flask will look for index.html in the static_folder (current directory).
    """
    return send_from_directory('.', 'index.html')


@app.route('/<path:filename>')
def serve_static(filename):
    """
    Serve static files (CSS, JS, etc.).
    
    Args:
        filename: The name of the file to serve
        
    This route handles requests for CSS, JavaScript, and other static files.
    """
    return send_from_directory('.', filename)


# ============================================================================
# REST API ENDPOINTS
# ============================================================================

# ----------------------------------------------------------------------------
# GET /api/expenses - Retrieve all expenses
# ----------------------------------------------------------------------------
@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    """
    Retrieve all expenses from the database.
    
    HTTP Method: GET
    URL: /api/expenses
    
    Returns:
        JSON array of all expenses, sorted by date (newest first)
        
    Example Response:
        [
            {
                "id": 1,
                "title": "Lunch",
                "category": "Food",
                "amount": 250.00,
                "date": "2026-02-01T12:00:00.000Z"
            },
            ...
        ]
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Fetch all expenses, ordered by date descending (newest first)
        cursor.execute('SELECT * FROM expenses ORDER BY date DESC')
        expenses = cursor.fetchall()
        
        conn.close()
        
        # Convert Row objects to dictionaries for JSON serialization
        expenses_list = [row_to_dict(expense) for expense in expenses]
        
        return jsonify(expenses_list), 200
        
    except Exception as e:
        # Return error message if something goes wrong
        return jsonify({'error': str(e)}), 500


# ----------------------------------------------------------------------------
# POST /api/expenses - Add a new expense
# ----------------------------------------------------------------------------
@app.route('/api/expenses', methods=['POST'])
def add_expense():
    """
    Add a new expense to the database.
    
    HTTP Method: POST
    URL: /api/expenses
    Content-Type: application/json
    
    Request Body:
        {
            "title": "Expense title",
            "category": "Category name",
            "amount": 100.00,
            "date": "2026-02-01T12:00:00.000Z" (optional, defaults to now)
        }
        
    Returns:
        The created expense object with its assigned ID
        
    Example Response:
        {
            "id": 5,
            "title": "Dinner",
            "category": "Food",
            "amount": 450.00,
            "date": "2026-02-01T19:00:00.000Z"
        }
    """
    try:
        # Parse JSON data from request body
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        title = data.get('title')
        category = data.get('category')
        amount = data.get('amount')
        date = data.get('date', datetime.now().isoformat())  # Default to current time
        
        # Check for missing required fields
        if not title or not category or amount is None:
            return jsonify({'error': 'Missing required fields: title, category, amount'}), 400
        
        # Validate amount is a positive number
        try:
            amount = float(amount)
            if amount <= 0:
                return jsonify({'error': 'Amount must be a positive number'}), 400
        except ValueError:
            return jsonify({'error': 'Amount must be a valid number'}), 400
        
        # Insert the new expense into the database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO expenses (title, category, amount, date)
            VALUES (?, ?, ?, ?)
        ''', (title, category, amount, date))
        
        # Get the ID of the newly inserted expense
        expense_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        
        # Return the created expense with its ID
        new_expense = {
            'id': expense_id,
            'title': title,
            'category': category,
            'amount': amount,
            'date': date
        }
        
        return jsonify(new_expense), 201  # 201 = Created
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ----------------------------------------------------------------------------
# PUT /api/expenses/<id> - Update an existing expense
# ----------------------------------------------------------------------------
@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    """
    Update an existing expense in the database.
    
    HTTP Method: PUT
    URL: /api/expenses/<id>
    Content-Type: application/json
    
    Args:
        expense_id: The ID of the expense to update
        
    Request Body:
        {
            "title": "Updated title",
            "category": "Updated category",
            "amount": 150.00
        }
        
    Returns:
        The updated expense object
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        title = data.get('title')
        category = data.get('category')
        amount = data.get('amount')
        
        # Validate required fields
        if not title or not category or amount is None:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0:
                return jsonify({'error': 'Amount must be a positive number'}), 400
        except ValueError:
            return jsonify({'error': 'Amount must be a valid number'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if expense exists
        cursor.execute('SELECT * FROM expenses WHERE id = ?', (expense_id,))
        expense = cursor.fetchone()
        
        if not expense:
            conn.close()
            return jsonify({'error': 'Expense not found'}), 404
        
        # Update the expense
        cursor.execute('''
            UPDATE expenses 
            SET title = ?, category = ?, amount = ?
            WHERE id = ?
        ''', (title, category, amount, expense_id))
        
        conn.commit()
        
        # Fetch the updated expense
        cursor.execute('SELECT * FROM expenses WHERE id = ?', (expense_id,))
        updated_expense = cursor.fetchone()
        
        conn.close()
        
        return jsonify(row_to_dict(updated_expense)), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ----------------------------------------------------------------------------
# DELETE /api/expenses/<id> - Delete an expense
# ----------------------------------------------------------------------------
@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """
    Delete an expense from the database.
    
    HTTP Method: DELETE
    URL: /api/expenses/<id>
    
    Args:
        expense_id: The ID of the expense to delete
        
    Returns:
        Success message if deleted, error if not found
        
    Example Response:
        {"message": "Expense deleted successfully"}
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if expense exists before deleting
        cursor.execute('SELECT * FROM expenses WHERE id = ?', (expense_id,))
        expense = cursor.fetchone()
        
        if not expense:
            conn.close()
            return jsonify({'error': 'Expense not found'}), 404
        
        # Delete the expense
        cursor.execute('DELETE FROM expenses WHERE id = ?', (expense_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Expense deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ----------------------------------------------------------------------------
# DELETE /api/expenses - Delete all expenses
# ----------------------------------------------------------------------------
@app.route('/api/expenses', methods=['DELETE'])
def delete_all_expenses():
    """
    Delete all expenses from the database.
    
    HTTP Method: DELETE
    URL: /api/expenses
    
    Returns:
        Success message with count of deleted expenses
        
    Example Response:
        {"message": "Deleted 15 expenses"}
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get count before deleting
        cursor.execute('SELECT COUNT(*) as count FROM expenses')
        count = cursor.fetchone()['count']
        
        # Delete all expenses
        cursor.execute('DELETE FROM expenses')
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': f'Deleted {count} expenses'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ----------------------------------------------------------------------------
# GET /api/summary - Get expense statistics
# ----------------------------------------------------------------------------
@app.route('/api/summary', methods=['GET'])
def get_summary():
    """
    Get summary statistics of all expenses.
    
    HTTP Method: GET
    URL: /api/summary
    
    Returns:
        JSON object with total, average, and count statistics
        
    Example Response:
        {
            "total": 15000.00,
            "average": 500.00,
            "count": 30
        }
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Calculate statistics using SQL aggregate functions
        cursor.execute('''
            SELECT 
                COALESCE(SUM(amount), 0) as total,
                COALESCE(AVG(amount), 0) as average,
                COUNT(*) as count
            FROM expenses
        ''')
        
        result = cursor.fetchone()
        conn.close()
        
        summary = {
            'total': round(result['total'], 2),
            'average': round(result['average'], 2),
            'count': result['count']
        }
        
        return jsonify(summary), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ----------------------------------------------------------------------------
# GET /api/expenses/month/<year>/<month> - Get expenses for a specific month
# ----------------------------------------------------------------------------
@app.route('/api/expenses/month/<int:year>/<int:month>', methods=['GET'])
def get_expenses_by_month(year, month):
    """
    Get all expenses for a specific month.
    
    HTTP Method: GET
    URL: /api/expenses/month/<year>/<month>
    
    Args:
        year: The year (e.g., 2026)
        month: The month (1-12)
        
    Returns:
        JSON array of expenses for that month
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create date range for the month
        # SQLite stores dates as TEXT, so we use string comparison
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"
        
        cursor.execute('''
            SELECT * FROM expenses 
            WHERE date >= ? AND date < ?
            ORDER BY date DESC
        ''', (start_date, end_date))
        
        expenses = cursor.fetchall()
        conn.close()
        
        expenses_list = [row_to_dict(expense) for expense in expenses]
        
        return jsonify(expenses_list), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == '__main__':
    """
    Main entry point for the Flask application.
    
    Steps:
    1. Initialize the database (create tables if they don't exist)
    2. Start the Flask development server
    
    Server Configuration:
    - Host: 0.0.0.0 (accessible from any network interface)
    - Port: 5000 (default Flask port)
    - Debug: True (enables auto-reload and detailed error messages)
    
    To run:
        python app.py
        
    Then open: http://localhost:5000
    """
    print("=" * 60)
    print("🚀 Personal Expense Tracker - Flask Backend")
    print("=" * 60)
    
    # Initialize database on startup
    init_db()
    
    print("\n📍 Server starting...")
    print("🌐 Open http://localhost:5000 in your browser")
    print("=" * 60 + "\n")
    
    # Run the Flask development server
    app.run(host='0.0.0.0', port=5000, debug=True)
