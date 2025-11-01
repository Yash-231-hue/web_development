class MoneyManager {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
        this.categoryChart = null;
        this.trendChart = null;

        this.initializeEventListeners();
        this.updateDashboard();
        this.initializeCharts();
    }

    initializeEventListeners() {
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        document.getElementById('budgetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.setBudget();
        });

        document.getElementById('date').valueAsDate = new Date();
    }

    addExpense() {
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const paymentMethod = document.getElementById('paymentMethod').value;

        const expense = {
            id: Date.now(),
            amount,
            date,
            category,
            description,
            paymentMethod,
            timestamp: new Date().toISOString()
        };

        this.expenses.push(expense);
        this.saveToLocalStorage();
        this.updateDashboard();
        this.resetForm('expenseForm');
        this.showNotification('Expense added successfully!', 'success');
    }

    setBudget() {
        const budgetAmount = parseFloat(document.getElementById('budgetAmount').value);
        this.monthlyBudget = budgetAmount;
        localStorage.setItem('monthlyBudget', budgetAmount.toString());
        this.updateDashboard();
        this.resetForm('budgetForm');
        this.showNotification('Budget updated successfully!', 'info');
    }

    deleteExpense(id) {
        this.expenses = this.expenses.filter(expense => expense.id !== id);
        this.saveToLocalStorage();
        this.updateDashboard();
        this.showNotification('Expense deleted!', 'warning');
    }

    saveToLocalStorage() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    resetForm(formId) {
        document.getElementById(formId).reset();
        if (formId === 'expenseForm') {
            document.getElementById('date').valueAsDate = new Date();
        }
    }

    updateDashboard() {
        this.updateSummaryCards();
        this.updateExpenseTable();
        this.updateCharts();
    }

    updateSummaryCards() {
        const totalSpent = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const remaining = this.monthlyBudget - totalSpent;
        const expenseCount = this.expenses.length;

        document.getElementById('monthlyBudget').textContent = `₹${this.monthlyBudget.toFixed(2)}`;
        document.getElementById('totalSpent').textContent = `₹${totalSpent.toFixed(2)}`;
        document.getElementById('remainingBudget').textContent = `₹${remaining.toFixed(2)}`;
        document.getElementById('expenseCount').textContent = expenseCount;

        // Change card color based on remaining
        const remainingCard = document.getElementById('remainingBudget').closest('.card');
        if (remaining < 0) {
            remainingCard.style.background = '#e74c3c';
        } else if (remaining < this.monthlyBudget * 0.2) {
            remainingCard.style.background = '#f39c12';
        } else {
            remainingCard.style.background = '#181818';
        }
    }

    updateExpenseTable() {
        const tableBody = document.getElementById('expenseTable');
        tableBody.innerHTML = '';

        // Sort expenses by date (newest first)
        const sortedExpenses = [...this.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        sortedExpenses.forEach(expense => {
            const row = document.createElement('tr');
            row.className = 'fade-in';
            row.innerHTML = `
                <td>${new Date(expense.date).toLocaleDateString()}</td>
                <td>${expense.description}</td>
                <td>
                    <span class="badge">${expense.category}</span>
                </td>
                <td>${expense.paymentMethod}</td>
                <td class="fw-bold">₹${expense.amount.toFixed(2)}</td>
                <td>
                    <button class="btn small danger" onclick="moneyManager.deleteExpense(${expense.id})">
                        Delete
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    initializeCharts() {
        this.updateCharts();
    }

    updateCharts() {
        this.updateCategoryChart();
        this.updateTrendChart();
    }

    updateCategoryChart() {
        if (!window.Chart) return; // Chart.js required
        const ctx = document.getElementById('categoryChart').getContext('2d');
        const categoryTotals = {};
        this.expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });
        const categories = Object.keys(categoryTotals);
        const amounts = Object.values(categoryTotals);

        if (this.categoryChart) this.categoryChart.destroy();

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `₹${context.parsed}`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateTrendChart() {
        if (!window.Chart) return;
        const ctx = document.getElementById('trendChart').getContext('2d');
        const monthlyTotals = {};
        this.expenses.forEach(expense => {
            const date = new Date(expense.date);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + expense.amount;
        });
        const months = Object.keys(monthlyTotals).sort();
        const monthlyAmounts = months.map(month => monthlyTotals[month]);

        if (this.trendChart) this.trendChart.destroy();

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Monthly Spending',
                    data: monthlyAmounts,
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54,162,235,0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `₹${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} fade-in`;
        notification.style.cssText = `
            position:fixed; top:20px; right:20px; z-index:2000; min-width:200px; font-weight:bold;
        `;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn small" style="float:right;" onclick="this.parentElement.remove()">×</button>
        `;
        document.body.appendChild(notification);
        setTimeout(() => { if (notification.parentNode) notification.remove(); }, 3000);
    }

    // Optional: Export data as JSON
    exportData() {
        const data = {
            expenses: this.expenses,
            monthlyBudget: this.monthlyBudget,
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wallet-assistant-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.moneyManager = new MoneyManager();
});

// Demo sample data: call addSampleData(); in console for demo-mode
function addSampleData() {
    const sampleExpenses = [
        {
            id: 1,
            amount: 455.50,
            date: '2024-01-15',
            category: 'Food & Dining',
            description: 'Dinner at restaurant',
            paymentMethod: 'Credit Card'
        },
        {
            id: 2,
            amount: 350.00,
            date: '2024-01-14',
            category: 'Transportation',
            description: 'Gas for car',
            paymentMethod: 'Debit Card'
        },
        {
            id: 3,
            amount: 899.99,
            date: '2024-01-13',
            category: 'Shopping',
            description: 'New clothes',
            paymentMethod: 'Credit Card'
        }
    ];
    if (localStorage.getItem('expenses') === null) {
        localStorage.setItem('expenses', JSON.stringify(sampleExpenses));
        localStorage.setItem('monthlyBudget', '10000');
        location.reload();
    }
}
