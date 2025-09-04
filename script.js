// Advanced To-Do List Application
class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.darkMode = this.loadDarkMode();
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeDarkMode();
        this.renderTasks();
        this.updateStats();
        this.checkReminders();
        
        // Check for reminders every minute
        setInterval(() => this.checkReminders(), 60000);
    }

    initializeElements() {
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.dueDateInput = document.getElementById('dueDateInput');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.taskStats = document.getElementById('taskStats');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.reminderModal = document.getElementById('reminderModal');
        this.reminderMessage = document.getElementById('reminderMessage');
        this.closeReminderModal = document.getElementById('closeReminderModal');
        this.dismissReminder = document.getElementById('dismissReminder');
    }

    initializeEventListeners() {
        // Task form submission
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Filter buttons
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.setFilter(button.dataset.filter);
            });
        });

        // Dark mode toggle
        this.darkModeToggle.addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // Modal controls
        this.closeReminderModal.addEventListener('click', () => {
            this.hideReminderModal();
        });

        this.dismissReminder.addEventListener('click', () => {
            this.hideReminderModal();
        });

        // Close modal on outside click
        this.reminderModal.addEventListener('click', (e) => {
            if (e.target === this.reminderModal) {
                this.hideReminderModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideReminderModal();
            }
        });
    }

    addTask() {
        const content = this.taskInput.value.trim();
        const category = this.categorySelect.value;
        const dueDate = this.dueDateInput.value;

        if (!content) return;

        const task = {
            id: Date.now().toString(),
            content,
            category,
            dueDate: dueDate || null,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        // Clear form
        this.taskInput.value = '';
        this.dueDateInput.value = '';
        this.taskInput.focus();

        // Show success feedback
        this.showNotification('Task added successfully! 🎉', 'success');
    }

    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? 'Task completed! Great job! 🎉' : 'Task marked as incomplete';
            this.showNotification(message, task.completed ? 'success' : 'info');
        }
    }

    deleteTask(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('removing');
            
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                this.showNotification('Task deleted successfully', 'info');
            }, 300);
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.filter === filter);
        });
        
        this.renderTasks();
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];
        
        switch (this.currentFilter) {
            case 'personal':
            case 'work':
            case 'urgent':
                filtered = filtered.filter(task => task.category === this.currentFilter);
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
            case 'all':
            default:
                // Show all tasks
                break;
        }
        
        return filtered;
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.taskList.style.display = 'none';
            this.emptyState.style.display = 'block';
        } else {
            this.taskList.style.display = 'flex';
            this.emptyState.style.display = 'none';
            
            this.taskList.innerHTML = filteredTasks
                .map(task => this.renderTask(task))
                .join('');
        }
    }

    renderTask(task) {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const now = new Date();
        let dueDateClass = '';
        let dueDateText = '';

        if (dueDate) {
            const timeDiff = dueDate.getTime() - now.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (timeDiff < 0) {
                dueDateClass = 'overdue';
                dueDateText = `Overdue (${Math.abs(daysDiff)} days ago)`;
            } else if (daysDiff <= 1) {
                dueDateClass = 'due-soon';
                dueDateText = daysDiff === 0 ? 'Due today' : 'Due tomorrow';
            } else {
                dueDateText = `Due in ${daysDiff} days`;
            }
        }

        const categoryEmojis = {
            personal: '📋',
            work: '💼',
            urgent: '🔥'
        };

        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${dueDateClass}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-content">${this.escapeHtml(task.content)}</div>
                    <div class="task-actions">
                        <button class="task-btn complete-btn" onclick="todoApp.completeTask('${task.id}')" 
                                title="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                            <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                        </button>
                        <button class="task-btn delete-btn" onclick="todoApp.deleteTask('${task.id}')" 
                                title="Delete task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-meta">
                    <span class="task-category ${task.category}">
                        ${categoryEmojis[task.category]} ${task.category}
                    </span>
                    ${dueDate ? `<span class="task-due-date ${dueDateClass}">
                        <i class="fas fa-calendar"></i>
                        ${dueDateText}
                    </span>` : ''}
                </div>
            </div>
        `;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        if (total === 0) {
            this.taskStats.textContent = '0 tasks';
        } else {
            this.taskStats.textContent = `${total} task${total !== 1 ? 's' : ''} (${pending} pending, ${completed} completed)`;
        }
    }

    checkReminders() {
        const now = new Date();
        
        this.tasks.forEach(task => {
            if (task.dueDate && !task.completed && !task.reminderShown) {
                const dueDate = new Date(task.dueDate);
                const timeDiff = dueDate.getTime() - now.getTime();
                const minutesDiff = Math.floor(timeDiff / (1000 * 60));
                
                // Show reminder for tasks due in next 30 minutes or overdue
                if (minutesDiff <= 30 && minutesDiff >= -60) {
                    this.showReminder(task);
                    task.reminderShown = true;
                    this.saveTasks();
                }
            }
        });
    }

    showReminder(task) {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const isOverdue = dueDate < now;
        
        const message = isOverdue 
            ? `⚠️ Task "${task.content}" is overdue!`
            : `📅 Task "${task.content}" is due soon!`;
            
        this.reminderMessage.textContent = message;
        this.showReminderModal();
        
        // Also show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Task Reminder', {
                body: message,
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNzY0YmE2Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+'
            });
        }
    }

    showReminderModal() {
        this.reminderModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideReminderModal() {
        this.reminderModal.classList.remove('show');
        document.body.style.overflow = '';
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        this.applyDarkMode();
        this.saveDarkMode();
    }

    initializeDarkMode() {
        // Check for system preference if no saved preference
        if (this.darkMode === null) {
            this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        this.applyDarkMode();
    }

    applyDarkMode() {
        if (this.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            this.darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    showNotification(message, type = 'info') {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            border-left: 4px solid ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--info-color)'};
            max-width: 300px;
            word-wrap: break-word;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Data persistence methods
    saveTasks() {
        try {
            localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save tasks:', error);
            this.showNotification('Failed to save tasks', 'error');
        }
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('todoTasks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load tasks:', error);
            return [];
        }
    }

    saveDarkMode() {
        try {
            localStorage.setItem('todoAppDarkMode', this.darkMode.toString());
        } catch (error) {
            console.error('Failed to save dark mode preference:', error);
        }
    }

    loadDarkMode() {
        try {
            const saved = localStorage.getItem('todoAppDarkMode');
            return saved ? saved === 'true' : null;
        } catch (error) {
            console.error('Failed to load dark mode preference:', error);
            return null;
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export/Import functionality (bonus feature)
    exportTasks() {
        const data = {
            tasks: this.tasks,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Tasks exported successfully!', 'success');
    }

    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.tasks && Array.isArray(data.tasks)) {
                    this.tasks = data.tasks;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    this.showNotification('Tasks imported successfully!', 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showNotification('Failed to import tasks. Invalid file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('ServiceWorker registered successfully:', registration);
        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
        }
    });
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Add toast animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the app
let todoApp;
document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
});

// Handle app install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or prompt
    const installButton = document.createElement('button');
    installButton.textContent = '📱 Install App';
    installButton.className = 'install-btn';
    installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary-gradient);
        color: white;
        border: none;
        padding: 0.75rem 1rem;
        border-radius: var(--border-radius);
        font-weight: 600;
        cursor: pointer;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        font-size: 0.875rem;
        transition: all 0.3s ease;
    `;
    
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
            installButton.remove();
        }
    });
    
    document.body.appendChild(installButton);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (installButton.parentNode) {
            installButton.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => installButton.remove(), 300);
        }
    }, 10000);
});

window.addEventListener('appinstalled', () => {
    console.log('App was installed successfully');
    deferredPrompt = null;
});