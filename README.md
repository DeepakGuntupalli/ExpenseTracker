# Personal Expense Tracker 💰

A full-stack expense tracking application built with **HTML/CSS/JavaScript** frontend and **Python Flask + SQLite** backend.

## 📁 Folder Structure

```
Expense tracker/
├── app.py              # Flask backend server (REST API)
├── app.js              # Frontend JavaScript (fetch API calls)
├── index.html          # Main HTML page
├── styles.css          # CSS styling
├── requirements.txt    # Python dependencies
├── expenses.db         # SQLite database (created automatically)
├── database.py         # Legacy Python database module
├── main.py             # Legacy Tkinter app
└── analytics.py        # Legacy analytics module
```

## 🚀 How to Run the Project

### Step 1: Install Python Dependencies

Open a terminal in the project folder and run:

```bash
pip install -r requirements.txt
```

This installs:
- **Flask** - Web framework for the REST API
- **flask-cors** - Cross-Origin Resource Sharing support

### Step 2: Start the Flask Server

```bash
python app.py
```

You should see:
```
============================================================
🚀 Personal Expense Tracker - Flask Backend
============================================================
✅ Database initialized successfully!

📍 Server starting...
🌐 Open http://localhost:5000 in your browser
============================================================
```

### Step 3: Open the App

Open your browser and go to: **http://localhost:5000**

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Add a new expense |
| PUT | `/api/expenses/<id>` | Update an expense |
| DELETE | `/api/expenses/<id>` | Delete an expense |
| DELETE | `/api/expenses` | Delete all expenses |
| GET | `/api/summary` | Get expense statistics |
| GET | `/api/expenses/month/<year>/<month>` | Get expenses by month |

### Example API Requests

**Add Expense:**
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"title": "Lunch", "category": "Food", "amount": 250}'
```

**Get All Expenses:**
```bash
curl http://localhost:5000/api/expenses
```

**Delete Expense:**
```bash
curl -X DELETE http://localhost:5000/api/expenses/1
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Browser)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  index.html │  │  styles.css │  │       app.js        │  │
│  │  (UI)       │  │  (Styling)  │  │  (fetch() calls)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP Requests (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Flask Server)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                     app.py                          │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │  │ REST API    │  │ Route       │  │ Database   │  │    │
│  │  │ Endpoints   │  │ Handlers    │  │ Functions  │  │    │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────┘
                              │ SQL Queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (SQLite)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   expenses.db                        │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ expenses table                              │    │    │
│  │  │ - id (INTEGER, PRIMARY KEY, AUTOINCREMENT)  │    │    │
│  │  │ - title (TEXT)                              │    │    │
│  │  │ - category (TEXT)                           │    │    │
│  │  │ - amount (REAL)                             │    │    │
│  │  │ - date (TEXT)                               │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Code Comments Guide

### Backend (app.py)

- **Flask Routes**: Each `@app.route()` decorator defines an API endpoint
- **Database Functions**: `get_db_connection()` and `init_db()` handle SQLite operations
- **Error Handling**: Try-catch blocks with JSON error responses

### Frontend (app.js)

- **API Calls**: All `fetch()` calls are documented with the endpoint they call
- **Event Handlers**: Methods like `handleAddExpense()` show the flow from UI to backend
- **Data Flow**: Comments explain how data moves between frontend and backend

## ✨ Features

- ➕ Add expenses with title, category, and amount
- ✏️ Edit existing expenses
- 🗑️ Delete individual or all expenses
- 🔍 Search/filter expenses
- 📊 Pie chart visualization
- 📅 Monthly overview (12 months)
- 📈 Compare two months side-by-side
- 💾 Persistent storage (SQLite database)
- 📱 Responsive design

## 🛠️ Technologies Used

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Charts | Chart.js |
| Backend | Python 3.x, Flask |
| Database | SQLite3 |
| API | RESTful JSON |

## 🎯 Interview-Ready Points

1. **Full-Stack Architecture**: Demonstrates frontend-backend separation
2. **REST API Design**: Proper HTTP methods (GET, POST, PUT, DELETE)
3. **Database Operations**: CRUD with SQLite
4. **Async JavaScript**: Uses `async/await` with `fetch()`
5. **Error Handling**: Both frontend and backend error handling
6. **Code Organization**: Clean separation of concerns
7. **Comments**: Well-documented code

## 📄 License

This project is for educational purposes.
