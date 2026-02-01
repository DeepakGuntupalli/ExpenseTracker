import sqlite3

class BudgetDB:
    def __init__(self, db_name="expenses.db"):
        self.conn = sqlite3.connect(db_name)
        self.cursor = self.conn.cursor()
        self.create_table()

    def create_table(self):
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL
        )
        """)
        self.conn.commit()

    def add_expense(self, title, category, amount):
        self.cursor.execute(
            "INSERT INTO expenses (title, category, amount) VALUES (?, ?, ?)",
            (title, category, amount)
        )
        self.conn.commit()

    def delete_expense(self, expense_id):
        self.cursor.execute("DELETE FROM expenses WHERE id=?", (expense_id,))
        self.conn.commit()

    def fetch_all(self):
        self.cursor.execute("SELECT * FROM expenses")
        return self.cursor.fetchall()
