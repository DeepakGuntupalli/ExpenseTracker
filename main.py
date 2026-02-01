"""
Local Development Entry Point for Flask Expense Tracker
========================================================
This file is used to run the Flask app locally for development.

Usage:
    python main.py

For production deployment (Render/Gunicorn):
    gunicorn app:app
"""

from app import app, init_db

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Personal Expense Tracker - Flask Backend")
    print("=" * 60)
    
    # Initialize database on startup (already called in app.py, but safe to call again)
    init_db()
    
    print("\n📍 Server starting...")
    print("🌐 Open http://localhost:5000 in your browser")
    print("=" * 60 + "\n")
    
    # Run Flask development server (debug mode for local development)
    app.run(host='0.0.0.0', port=5000, debug=True)
