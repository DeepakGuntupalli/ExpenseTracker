import tkinter as tk
from tkinter import ttk, messagebox
from database import BudgetDB
from analytics import show_category_graph

class ExpenseTrackerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Personal Expense Tracker")
        self.root.geometry("700x500")

        self.db = BudgetDB()

        self.create_widgets()
        self.load_data()

    def create_widgets(self):
        frame = tk.Frame(self.root)
        frame.pack(pady=10)

        tk.Label(frame, text="Title").grid(row=0, column=0)
        tk.Label(frame, text="Category").grid(row=0, column=1)
        tk.Label(frame, text="Amount").grid(row=0, column=2)

        self.title_entry = tk.Entry(frame)
        self.category_entry = tk.Entry(frame)
        self.amount_entry = tk.Entry(frame)

        self.title_entry.grid(row=1, column=0)
        self.category_entry.grid(row=1, column=1)
        self.amount_entry.grid(row=1, column=2)

        tk.Button(frame, text="Add Expense", command=self.add_expense)\
            .grid(row=1, column=3, padx=10)

        self.tree = ttk.Treeview(
            self.root,
            columns=("ID", "Title", "Category", "Amount"),
            show="headings"
        )

        for col in ("ID", "Title", "Category", "Amount"):
            self.tree.heading(col, text=col)

        self.tree.pack(fill=tk.BOTH, expand=True, pady=10)

        btn_frame = tk.Frame(self.root)
        btn_frame.pack()

        tk.Button(btn_frame, text="Delete Selected", command=self.delete_expense)\
            .pack(side=tk.LEFT, padx=10)

        tk.Button(btn_frame, text="Show Graph", command=self.show_graph)\
            .pack(side=tk.LEFT, padx=10)

    def load_data(self):
        for row in self.tree.get_children():
            self.tree.delete(row)

        for expense in self.db.fetch_all():
            self.tree.insert("", tk.END, values=expense)

    def add_expense(self):
        title = self.title_entry.get()
        category = self.category_entry.get()
        amount = self.amount_entry.get()

        if not title or not category or not amount:
            messagebox.showwarning("Error", "All fields are required")
            return

        try:
            amount = float(amount)
        except ValueError:
            messagebox.showwarning("Error", "Amount must be a number")
            return

        self.db.add_expense(title, category, amount)
        self.load_data()

        self.title_entry.delete(0, tk.END)
        self.category_entry.delete(0, tk.END)
        self.amount_entry.delete(0, tk.END)

    def delete_expense(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Error", "Select a record to delete")
            return

        expense_id = self.tree.item(selected[0])["values"][0]
        self.db.delete_expense(expense_id)
        self.load_data()

    def show_graph(self):
        data = self.db.fetch_all()
        show_category_graph(data)

if __name__ == "__main__":
    root = tk.Tk()
    app = ExpenseTrackerApp(root)
    root.mainloop()
