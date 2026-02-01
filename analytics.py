import pandas as pd
import plotly.express as px

def show_category_graph(data):
    if not data:
        return

    df = pd.DataFrame(data, columns=["ID", "Title", "Category", "Amount"])
    summary = df.groupby("Category")["Amount"].sum().reset_index()

    fig = px.pie(
        summary,
        values="Amount",
        names="Category",
        title="Expense Distribution by Category"
    )
    fig.show()
