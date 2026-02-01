/**
 * =============================================================================
 * Personal Expense Tracker - Frontend JavaScript
 * =============================================================================
 * 
 * This file handles all frontend functionality including:
 * - Making API calls to the Flask backend
 * - Rendering the UI components
 * - Handling user interactions
 * 
 * Backend API Endpoints Used:
 * - GET    /api/expenses          → Fetch all expenses
 * - POST   /api/expenses          → Add new expense
 * - PUT    /api/expenses/<id>     → Update expense
 * - DELETE /api/expenses/<id>     → Delete single expense
 * - DELETE /api/expenses          → Delete all expenses
 * - GET    /api/summary           → Get statistics
 * 
 * =============================================================================
 */

// API Base URL - Empty string means same origin (Flask serves the frontend)
const API_BASE_URL = '';

/**
 * ExpenseTracker Class
 * Main application class that manages all expense tracking functionality
 */
class ExpenseTracker {
    /**
     * Constructor - Initialize the application
     */
    constructor() {
        // Array to store all expenses (loaded from backend)
        this.expenses = [];
        
        // Chart.js instances
        this.chart = null;
        this.compareChart = null;
        
        // Filter state for monthly view
        this.currentMonthFilter = null;
        this.selectedYear = new Date().getFullYear();
        
        // Initialize DOM element references
        this.initializeElements();
        
        // Set up event listeners
        this.bindEvents();
        
        // Load data from backend and render UI
        this.loadExpensesFromBackend();
    }

    // =========================================================================
    // DOM ELEMENT INITIALIZATION
    // =========================================================================
    
    initializeElements() {
        // Form elements
        this.form = document.getElementById('expense-form');
        this.titleInput = document.getElementById('title');
        this.categoryInput = document.getElementById('category');
        this.amountInput = document.getElementById('amount');

        // Table elements
        this.tbody = document.getElementById('expense-tbody');
        this.noDataDiv = document.getElementById('no-data');
        this.searchInput = document.getElementById('search');

        // Summary elements
        this.totalAmountEl = document.getElementById('total-amount');
        this.totalCountEl = document.getElementById('total-count');
        this.averageAmountEl = document.getElementById('average-amount');

        // Buttons
        this.showGraphBtn = document.getElementById('show-graph-btn');
        this.clearAllBtn = document.getElementById('clear-all-btn');

        // Chart modal
        this.chartModal = document.getElementById('chart-modal');
        this.closeModalBtn = document.getElementById('close-modal');
        this.chartCanvas = document.getElementById('expense-chart');

        // Edit modal
        this.editModal = document.getElementById('edit-modal');
        this.closeEditModalBtn = document.getElementById('close-edit-modal');
        this.editForm = document.getElementById('edit-form');
        this.editIdInput = document.getElementById('edit-id');
        this.editTitleInput = document.getElementById('edit-title');
        this.editCategoryInput = document.getElementById('edit-category');
        this.editAmountInput = document.getElementById('edit-amount');

        // Toast
        this.toast = document.getElementById('toast');

        // Monthly elements
        this.monthsGrid = document.getElementById('months-grid');
        this.yearSelect = document.getElementById('year-select');
        this.compareBtn = document.getElementById('compare-btn');
        this.filterInfo = document.getElementById('filter-info');
        this.filterText = document.getElementById('filter-text');
        this.clearFilterBtn = document.getElementById('clear-filter');

        // Compare modal elements
        this.compareModal = document.getElementById('compare-modal');
        this.closeCompareModalBtn = document.getElementById('close-compare-modal');
        this.compareMonth1 = document.getElementById('compare-month-1');
        this.compareMonth2 = document.getElementById('compare-month-2');
        this.runCompareBtn = document.getElementById('run-compare');
        this.compareResults = document.getElementById('compare-results');
        this.compareChartCanvas = document.getElementById('compare-chart');
    }

    // =========================================================================
    // EVENT BINDING
    // =========================================================================
    
    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleAddExpense(e));

        // Search functionality
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));

        // Show graph button
        this.showGraphBtn.addEventListener('click', () => this.showChart());

        // Clear all button
        this.clearAllBtn.addEventListener('click', () => this.handleClearAll());

        // Modal close buttons
        this.closeModalBtn.addEventListener('click', () => this.closeChartModal());
        this.closeEditModalBtn.addEventListener('click', () => this.closeEditModal());

        // Close modals on outside click
        this.chartModal.addEventListener('click', (e) => {
            if (e.target === this.chartModal) this.closeChartModal();
        });
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeEditModal();
        });

        // Edit form submission
        this.editForm.addEventListener('submit', (e) => this.handleEditExpense(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeChartModal();
                this.closeEditModal();
                this.closeCompareModal();
            }
        });

        // Monthly overview events
        this.yearSelect.addEventListener('change', (e) => {
            this.selectedYear = parseInt(e.target.value);
            this.renderMonthlyOverview();
        });

        this.clearFilterBtn.addEventListener('click', () => this.clearMonthFilter());
        this.compareBtn.addEventListener('click', () => this.openCompareModal());
        this.closeCompareModalBtn.addEventListener('click', () => this.closeCompareModal());
        this.compareModal.addEventListener('click', (e) => {
            if (e.target === this.compareModal) this.closeCompareModal();
        });
        this.runCompareBtn.addEventListener('click', () => this.runComparison());
    }

    // =========================================================================
    // BACKEND API CALLS (Replaced localStorage with fetch() API)
    // =========================================================================
    
    /**
     * Load all expenses from the Flask backend
     * 
     * API Endpoint: GET /api/expenses
     * 
     * This replaces localStorage.getItem() with a fetch() call to the backend,
     * ensuring data persists in SQLite database.
     */
    async loadExpensesFromBackend() {
        try {
            // Make GET request to fetch all expenses from backend
            const response = await fetch(`${API_BASE_URL}/api/expenses`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Parse JSON response from backend
            this.expenses = await response.json();
            
            // Render the UI with loaded data
            this.render();
            
            console.log('✅ Expenses loaded from backend:', this.expenses.length);
            
        } catch (error) {
            console.error('❌ Error loading expenses:', error);
            this.showToast('Failed to load expenses from server', 'error');
            this.expenses = [];
            this.render();
        }
    }

    /**
     * Add a new expense to the backend
     * 
     * API Endpoint: POST /api/expenses
     * Content-Type: application/json
     * 
     * @param {Object} expenseData - The expense data to add
     * @returns {Object|null} The created expense with ID, or null on failure
     */
    async addExpenseToBackend(expenseData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(expenseData),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add expense');
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('❌ Error adding expense:', error);
            this.showToast('Failed to add expense', 'error');
            return null;
        }
    }

    /**
     * Update an existing expense in the backend
     * 
     * API Endpoint: PUT /api/expenses/<id>
     * 
     * @param {number} id - The ID of the expense to update
     * @param {Object} expenseData - The updated expense data
     * @returns {Object|null} The updated expense, or null on failure
     */
    async updateExpenseInBackend(id, expenseData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(expenseData),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update expense');
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('❌ Error updating expense:', error);
            this.showToast('Failed to update expense', 'error');
            return null;
        }
    }

    /**
     * Delete an expense from the backend
     * 
     * API Endpoint: DELETE /api/expenses/<id>
     * 
     * @param {number} id - The ID of the expense to delete
     * @returns {boolean} True if deleted successfully
     */
    async deleteExpenseFromBackend(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete expense');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting expense:', error);
            this.showToast('Failed to delete expense', 'error');
            return false;
        }
    }

    /**
     * Delete all expenses from the backend
     * 
     * API Endpoint: DELETE /api/expenses
     * 
     * @returns {boolean} True if all deleted successfully
     */
    async deleteAllExpensesFromBackend() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete all expenses');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting all expenses:', error);
            this.showToast('Failed to clear expenses', 'error');
            return false;
        }
    }

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    /**
     * Handle adding a new expense
     * Now sends data to backend via POST request instead of localStorage
     */
    async handleAddExpense(e) {
        e.preventDefault();

        const title = this.titleInput.value.trim();
        const category = this.categoryInput.value;
        const amount = parseFloat(this.amountInput.value);

        if (!title || !category || isNaN(amount) || amount <= 0) {
            this.showToast('Please fill in all fields correctly', 'error');
            return;
        }

        // Prepare expense data for backend
        const expenseData = {
            title,
            category,
            amount,
            date: new Date().toISOString()
        };

        // Send to backend (replaces localStorage.setItem)
        const newExpense = await this.addExpenseToBackend(expenseData);
        
        if (newExpense) {
            // Add to local array
            this.expenses.unshift(newExpense);
            this.render();
            this.form.reset();
            this.titleInput.focus();
            this.showToast('Expense added successfully!', 'success');
        }
    }

    /**
     * Handle deleting an expense
     * Now sends DELETE request to backend
     */
    async handleDeleteExpense(id) {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        const success = await this.deleteExpenseFromBackend(id);
        
        if (success) {
            this.expenses = this.expenses.filter(exp => exp.id !== id);
            this.render();
            this.showToast('Expense deleted!', 'info');
        }
    }

    openEditModal(id) {
        const expense = this.expenses.find(exp => exp.id === id);
        if (!expense) return;

        this.editIdInput.value = expense.id;
        this.editTitleInput.value = expense.title;
        this.editCategoryInput.value = expense.category;
        this.editAmountInput.value = expense.amount;

        this.editModal.classList.add('show');
    }

    closeEditModal() {
        this.editModal.classList.remove('show');
        this.editForm.reset();
    }

    /**
     * Handle editing an expense
     * Now sends PUT request to backend
     */
    async handleEditExpense(e) {
        e.preventDefault();

        const id = parseInt(this.editIdInput.value);
        const title = this.editTitleInput.value.trim();
        const category = this.editCategoryInput.value;
        const amount = parseFloat(this.editAmountInput.value);

        if (!title || !category || isNaN(amount) || amount <= 0) {
            this.showToast('Please fill in all fields correctly', 'error');
            return;
        }

        const expenseData = { title, category, amount };
        const updatedExpense = await this.updateExpenseInBackend(id, expenseData);
        
        if (updatedExpense) {
            const index = this.expenses.findIndex(exp => exp.id === id);
            if (index !== -1) {
                this.expenses[index] = updatedExpense;
            }
            this.render();
            this.closeEditModal();
            this.showToast('Expense updated successfully!', 'success');
        }
    }

    handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();
        if (this.currentMonthFilter) {
            this.renderFilteredTable();
        } else {
            this.renderTable(query);
        }
    }

    /**
     * Handle clearing all expenses
     * Now sends DELETE request to backend for all expenses
     */
    async handleClearAll() {
        if (this.expenses.length === 0) {
            this.showToast('No expenses to clear', 'info');
            return;
        }

        if (!confirm('Are you sure you want to delete ALL expenses? This cannot be undone.')) return;

        const success = await this.deleteAllExpensesFromBackend();
        
        if (success) {
            this.expenses = [];
            this.render();
            this.showToast('All expenses cleared!', 'info');
        }
    }

    // =========================================================================
    // CHART FUNCTIONALITY
    // =========================================================================

    showChart() {
        if (this.expenses.length === 0) {
            this.showToast('No expenses to display in chart', 'info');
            return;
        }

        this.chartModal.classList.add('show');
        this.renderChart();
    }

    closeChartModal() {
        this.chartModal.classList.remove('show');
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    renderChart() {
        const categoryTotals = {};
        this.expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);

        const colors = {
            'Food': '#f59e0b',
            'Transport': '#3b82f6',
            'Entertainment': '#8b5cf6',
            'Shopping': '#ec4899',
            'Bills': '#6366f1',
            'Health': '#22c55e',
            'Other': '#64748b'
        };

        const backgroundColors = labels.map(label => colors[label] || '#64748b');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.chartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: '#ffffff',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 20, font: { size: 14 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${this.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // =========================================================================
    // UI RENDERING
    // =========================================================================

    updateSummary() {
        const total = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const count = this.expenses.length;
        const average = count > 0 ? total / count : 0;

        this.totalAmountEl.textContent = this.formatCurrency(total);
        this.totalCountEl.textContent = count;
        this.averageAmountEl.textContent = this.formatCurrency(average);
    }

    renderTable(searchQuery = '') {
        let filteredExpenses = this.expenses;

        if (searchQuery) {
            filteredExpenses = this.expenses.filter(exp => 
                exp.title.toLowerCase().includes(searchQuery) ||
                exp.category.toLowerCase().includes(searchQuery) ||
                exp.amount.toString().includes(searchQuery)
            );
        }

        this.tbody.innerHTML = '';

        if (filteredExpenses.length === 0) {
            this.noDataDiv.classList.add('show');
            document.getElementById('expense-table').style.display = 'none';
            return;
        }

        this.noDataDiv.classList.remove('show');
        document.getElementById('expense-table').style.display = 'table';

        filteredExpenses.forEach((expense, index) => {
            const row = document.createElement('tr');
            row.className = 'fade-in-row';
            row.style.animationDelay = `${index * 0.05}s`;

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.escapeHtml(expense.title)}</td>
                <td>
                    <span class="category-badge category-${expense.category}">
                        ${expense.category}
                    </span>
                </td>
                <td class="amount-cell">${this.formatCurrency(expense.amount)}</td>
                <td>${this.formatDate(expense.date)}</td>
                <td>
                    <div class="action-btns">
                        <button class="edit-btn" onclick="app.openEditModal(${expense.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="delete-btn" onclick="app.handleDeleteExpense(${expense.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            `;

            this.tbody.appendChild(row);
        });
    }

    render() {
        this.updateSummary();
        this.renderTable(this.searchInput.value.toLowerCase().trim());
        this.renderYearSelector();
        this.renderMonthlyOverview();
    }

    // =========================================================================
    // MONTHLY OVERVIEW FUNCTIONALITY
    // =========================================================================

    getMonthName(monthIndex) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
        return months[monthIndex];
    }

    getShortMonthName(monthIndex) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[monthIndex];
    }

    getExpensesForMonth(year, month) {
        return this.expenses.filter(exp => {
            const date = new Date(exp.date);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    }

    getAvailableYears() {
        const years = new Set();
        const currentYear = new Date().getFullYear();
        
        years.add(currentYear);
        years.add(currentYear - 1);
        
        this.expenses.forEach(exp => {
            const year = new Date(exp.date).getFullYear();
            years.add(year);
        });
        
        return Array.from(years).sort((a, b) => b - a);
    }

    renderYearSelector() {
        const years = this.getAvailableYears();
        this.yearSelect.innerHTML = years.map(year => 
            `<option value="${year}" ${year === this.selectedYear ? 'selected' : ''}>${year}</option>`
        ).join('');
    }

    renderMonthlyOverview() {
        this.monthsGrid.innerHTML = '';
        
        for (let month = 0; month < 12; month++) {
            const monthExpenses = this.getExpensesForMonth(this.selectedYear, month);
            const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            const count = monthExpenses.length;
            
            const card = document.createElement('div');
            card.className = `month-card ${count === 0 ? 'no-data' : ''} ${
                this.currentMonthFilter && 
                this.currentMonthFilter.year === this.selectedYear && 
                this.currentMonthFilter.month === month ? 'active' : ''
            }`;
            
            card.innerHTML = `
                <div class="month-name">${this.getShortMonthName(month)}</div>
                <div class="month-amount">${this.formatCurrency(total)}</div>
                <div class="month-count">${count} expense${count !== 1 ? 's' : ''}</div>
            `;
            
            if (count > 0) {
                card.addEventListener('click', () => this.filterByMonth(this.selectedYear, month));
            }
            
            this.monthsGrid.appendChild(card);
        }
    }

    filterByMonth(year, month) {
        this.currentMonthFilter = { year, month };
        this.filterInfo.style.display = 'flex';
        this.filterText.textContent = `Showing: ${this.getMonthName(month)} ${year}`;
        
        document.querySelectorAll('.month-card').forEach((card, index) => {
            card.classList.toggle('active', 
                this.selectedYear === year && index === month
            );
        });
        
        this.renderFilteredTable();
    }

    clearMonthFilter() {
        this.currentMonthFilter = null;
        this.filterInfo.style.display = 'none';
        
        document.querySelectorAll('.month-card').forEach(card => {
            card.classList.remove('active');
        });
        
        this.renderTable(this.searchInput.value.toLowerCase().trim());
    }

    renderFilteredTable() {
        if (!this.currentMonthFilter) {
            this.renderTable(this.searchInput.value.toLowerCase().trim());
            return;
        }
        
        const { year, month } = this.currentMonthFilter;
        const filteredExpenses = this.getExpensesForMonth(year, month);
        const searchQuery = this.searchInput.value.toLowerCase().trim();
        
        let displayExpenses = filteredExpenses;
        if (searchQuery) {
            displayExpenses = filteredExpenses.filter(exp => 
                exp.title.toLowerCase().includes(searchQuery) ||
                exp.category.toLowerCase().includes(searchQuery) ||
                exp.amount.toString().includes(searchQuery)
            );
        }
        
        this.tbody.innerHTML = '';
        
        if (displayExpenses.length === 0) {
            this.noDataDiv.classList.add('show');
            document.getElementById('expense-table').style.display = 'none';
            return;
        }
        
        this.noDataDiv.classList.remove('show');
        document.getElementById('expense-table').style.display = 'table';
        
        displayExpenses.forEach((expense, index) => {
            const row = document.createElement('tr');
            row.className = 'fade-in-row';
            row.style.animationDelay = `${index * 0.05}s`;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.escapeHtml(expense.title)}</td>
                <td>
                    <span class="category-badge category-${expense.category}">
                        ${expense.category}
                    </span>
                </td>
                <td class="amount-cell">${this.formatCurrency(expense.amount)}</td>
                <td>${this.formatDate(expense.date)}</td>
                <td>
                    <div class="action-btns">
                        <button class="edit-btn" onclick="app.openEditModal(${expense.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="delete-btn" onclick="app.handleDeleteExpense(${expense.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            
            this.tbody.appendChild(row);
        });
    }

    // =========================================================================
    // COMPARISON FUNCTIONALITY
    // =========================================================================

    openCompareModal() {
        this.populateCompareSelectors();
        this.compareModal.classList.add('show');
        this.compareResults.classList.remove('show');
    }

    closeCompareModal() {
        this.compareModal.classList.remove('show');
        if (this.compareChart) {
            this.compareChart.destroy();
            this.compareChart = null;
        }
    }

    populateCompareSelectors() {
        const options = [];
        const currentYear = new Date().getFullYear();
        
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentYear, new Date().getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth();
            const expenses = this.getExpensesForMonth(year, month);
            const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            
            options.push({
                value: `${year}-${month}`,
                label: `${this.getMonthName(month)} ${year} (${this.formatCurrency(total)})`,
                hasData: expenses.length > 0
            });
        }
        
        const optionsHtml = options.map(opt => 
            `<option value="${opt.value}" ${!opt.hasData ? 'disabled' : ''}>${opt.label}</option>`
        ).join('');
        
        this.compareMonth1.innerHTML = optionsHtml;
        this.compareMonth2.innerHTML = optionsHtml;
        
        const monthsWithData = options.filter(opt => opt.hasData);
        if (monthsWithData.length >= 2) {
            this.compareMonth1.value = monthsWithData[0].value;
            this.compareMonth2.value = monthsWithData[1].value;
        } else if (monthsWithData.length === 1) {
            this.compareMonth1.value = monthsWithData[0].value;
        }
    }

    runComparison() {
        const [year1, month1] = this.compareMonth1.value.split('-').map(Number);
        const [year2, month2] = this.compareMonth2.value.split('-').map(Number);
        
        const expenses1 = this.getExpensesForMonth(year1, month1);
        const expenses2 = this.getExpensesForMonth(year2, month2);
        
        const total1 = expenses1.reduce((sum, exp) => sum + exp.amount, 0);
        const total2 = expenses2.reduce((sum, exp) => sum + exp.amount, 0);
        
        const diff = total1 - total2;
        const percentChange = total2 !== 0 ? ((diff / total2) * 100) : (total1 > 0 ? 100 : 0);
        
        document.getElementById('compare-month1-title').textContent = `${this.getMonthName(month1)} ${year1}`;
        document.getElementById('compare-month1-total').textContent = this.formatCurrency(total1);
        document.getElementById('compare-month1-count').textContent = `${expenses1.length} expenses`;
        
        document.getElementById('compare-month2-title').textContent = `${this.getMonthName(month2)} ${year2}`;
        document.getElementById('compare-month2-total').textContent = this.formatCurrency(total2);
        document.getElementById('compare-month2-count').textContent = `${expenses2.length} expenses`;
        
        const diffEl = document.getElementById('compare-diff');
        const percentEl = document.getElementById('compare-percent');
        
        diffEl.textContent = `${diff >= 0 ? '+' : ''}${this.formatCurrency(Math.abs(diff))}`;
        diffEl.className = `compare-diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}`;
        
        percentEl.textContent = `${diff >= 0 ? '↑' : '↓'} ${Math.abs(percentChange).toFixed(1)}%`;
        percentEl.className = `compare-percent ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}`;
        
        this.renderCompareChart(expenses1, expenses2, month1, year1, month2, year2);
        this.renderCategoryBreakdown(expenses1, expenses2, month1, year1, month2, year2);
        
        this.compareResults.classList.add('show');
    }

    renderCompareChart(expenses1, expenses2, month1, year1, month2, year2) {
        const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];
        
        const getData = (expenses) => {
            const totals = {};
            categories.forEach(cat => totals[cat] = 0);
            expenses.forEach(exp => {
                if (totals.hasOwnProperty(exp.category)) {
                    totals[exp.category] += exp.amount;
                }
            });
            return categories.map(cat => totals[cat]);
        };
        
        const data1 = getData(expenses1);
        const data2 = getData(expenses2);
        
        if (this.compareChart) {
            this.compareChart.destroy();
        }
        
        this.compareChart = new Chart(this.compareChartCanvas, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [
                    {
                        label: `${this.getShortMonthName(month1)} ${year1}`,
                        data: data1,
                        backgroundColor: '#3b82f6',
                        borderRadius: 5
                    },
                    {
                        label: `${this.getShortMonthName(month2)} ${year2}`,
                        data: data2,
                        backgroundColor: '#8b5cf6',
                        borderRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }

    renderCategoryBreakdown(expenses1, expenses2, month1, year1, month2, year2) {
        const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];
        const breakdown = document.getElementById('category-breakdown');
        
        const getCategoryTotal = (expenses, category) => {
            return expenses.filter(exp => exp.category === category)
                          .reduce((sum, exp) => sum + exp.amount, 0);
        };
        
        let maxAmount = 0;
        categories.forEach(cat => {
            const t1 = getCategoryTotal(expenses1, cat);
            const t2 = getCategoryTotal(expenses2, cat);
            maxAmount = Math.max(maxAmount, t1, t2);
        });
        
        let html = `<h3>Category Breakdown</h3>`;
        
        categories.forEach(cat => {
            const total1 = getCategoryTotal(expenses1, cat);
            const total2 = getCategoryTotal(expenses2, cat);
            const percent1 = maxAmount > 0 ? (total1 / maxAmount) * 100 : 0;
            const percent2 = maxAmount > 0 ? (total2 / maxAmount) * 100 : 0;
            
            if (total1 > 0 || total2 > 0) {
                html += `
                    <div class="category-compare-row">
                        <span class="category-compare-name">${cat}</span>
                        <div class="category-compare-bar month1">
                            <div class="bar-fill" style="width: ${percent1}%"></div>
                        </div>
                        <span class="category-compare-amount month1">${this.formatCurrency(total1)}</span>
                        <div class="category-compare-bar month2">
                            <div class="bar-fill" style="width: ${percent2}%"></div>
                        </div>
                        <span class="category-compare-amount month2">${this.formatCurrency(total2)}</span>
                    </div>
                `;
            }
        });
        
        breakdown.innerHTML = html;
    }
}

// =============================================================================
// APPLICATION INITIALIZATION
// =============================================================================

let app;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Personal Expense Tracker...');
    app = new ExpenseTracker();
    console.log('✅ Application initialized!');
});
