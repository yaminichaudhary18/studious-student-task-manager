/**
 * STUDIOUS - Responsive Student Task & Study Manager
 * Application Logic & LocalStorage State Management
 */

(function () {
  'use strict';

  // --- Constants & Keys ---
  const STORAGE_KEY = 'studious_tasks_v1';
  const THEME_KEY = 'studious_theme_v1';

  // Priority numerical values for sorting
  const PRIORITY_ORDER = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  // --- Initial Demo Tasks ---
  const DEFAULT_DEMO_TASKS = [
    {
      id: 'demo-task-1',
      title: 'CS101: Submit Binary Search Tree Lab Assignment',
      subject: 'Computer Science',
      priority: 'urgent',
      dueDate: getRelativeDateOffset(1, 14, 0), // Tomorrow 2:00 PM
      description: 'Implement insertion, deletion, and in-order traversal methods. Write unit test cases and submit ZIP on portal.',
      subtasks: [
        { id: 'st-1', text: 'Write BST Node class', completed: true },
        { id: 'st-2', text: 'Implement rotation logic', completed: true },
        { id: 'st-3', text: 'Write test suite & documentation', completed: false }
      ],
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-task-2',
      title: 'MATH202: Multivariable Calculus Midterm Revision',
      subject: 'Mathematics',
      priority: 'high',
      dueDate: getRelativeDateOffset(3, 10, 30), // 3 days from now
      description: 'Review double integrals, partial derivatives, and Green\'s Theorem. Solve practice sets 4 to 7.',
      subtasks: [
        { id: 'st-4', text: 'Review Chapter 14 notes', completed: true },
        { id: 'st-5', text: 'Solve past exam papers', completed: false }
      ],
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-task-3',
      title: 'ENG110: Peer Review Literary Criticism Essay',
      subject: 'English',
      priority: 'medium',
      dueDate: getRelativeDateOffset(5, 18, 0),
      description: 'Read and provide constructive feedback on two peer drafts for the 20th century poetry essay.',
      subtasks: [
        { id: 'st-6', text: 'Read Sarah\'s draft on T.S. Eliot', completed: false },
        { id: 'st-7', text: 'Read Mark\'s essay analysis', completed: false }
      ],
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-task-4',
      title: 'PHYS105: Optics & Wave Interference Experiment Report',
      subject: 'Physics',
      priority: 'low',
      dueDate: getRelativeDateOffset(-1, 12, 0), // Yesterday
      description: 'Plot fringe separation vs distance graphs and submit final PDF report.',
      subtasks: [
        { id: 'st-8', text: 'Calibrate laser wavelength data', completed: true },
        { id: 'st-9', text: 'Export graphs from Excel', completed: true }
      ],
      completed: true,
      createdAt: new Date().toISOString()
    }
  ];

  // Helper to generate ISO local datetime string for relative offsets
  function getRelativeDateOffset(daysOffset, hours, minutes) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hours, minutes, 0, 0);
    
    // Format YYYY-MM-THH:mm for datetime-local input compatibility
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hours)}:${pad(minutes)}`;
  }

  // --- App State ---
  let tasks = [];
  let activeView = 'all'; // 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'
  let searchQuery = '';
  let priorityFilter = 'all';
  let subjectFilter = 'all';
  let sortBy = 'dueDateAsc';
  let viewMode = 'grid'; // 'grid' | 'list'
  let currentModalSubtasks = [];

  // --- DOM Elements ---
  const elements = {
    // Theme & Navigation
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    openSidebarBtn: document.getElementById('openSidebarBtn'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    navButtons: document.querySelectorAll('.nav-btn'),
    resetDemoBtn: document.getElementById('resetDemoBtn'),
    
    // Header & View titles
    viewTitle: document.getElementById('viewTitle'),
    viewSubtitle: document.getElementById('viewSubtitle'),
    openAddTaskModalBtn: document.getElementById('openAddTaskModalBtn'),
    fabAddTaskBtn: document.getElementById('fabAddTaskBtn'),

    // Stats
    progressRing: document.getElementById('progressRing'),
    progressPercentage: document.getElementById('progressPercentage'),
    statTotal: document.getElementById('statTotal'),
    statPending: document.getElementById('statPending'),
    statCompleted: document.getElementById('statCompleted'),
    statOverdue: document.getElementById('statOverdue'),

    // Badges
    badgeAll: document.getElementById('badgeAll'),
    badgeToday: document.getElementById('badgeToday'),
    badgeUpcoming: document.getElementById('badgeUpcoming'),
    badgeOverdue: document.getElementById('badgeOverdue'),
    badgeCompleted: document.getElementById('badgeCompleted'),

    // Controls
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    priorityFilter: document.getElementById('priorityFilter'),
    subjectFilter: document.getElementById('subjectFilter'),
    sortBySelect: document.getElementById('sortBySelect'),
    activeFiltersBar: document.getElementById('activeFiltersBar'),
    activeFilterTags: document.getElementById('activeFilterTags'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),

    // Task Grid & List View
    taskListContainer: document.getElementById('taskListContainer'),
    visibleTaskCount: document.getElementById('visibleTaskCount'),
    viewModeGridBtn: document.getElementById('viewModeGridBtn'),
    viewModeListBtn: document.getElementById('viewModeListBtn'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    emptyStateAddBtn: document.getElementById('emptyStateAddBtn'),

    // Modal
    taskModalBackdrop: document.getElementById('taskModalBackdrop'),
    taskModal: document.getElementById('taskModal'),
    modalTitle: document.getElementById('modalTitle'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    taskForm: document.getElementById('taskForm'),
    taskIdInput: document.getElementById('taskIdInput'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskSubjectInput: document.getElementById('taskSubjectInput'),
    taskPriorityInput: document.getElementById('taskPriorityInput'),
    taskDueDateInput: document.getElementById('taskDueDateInput'),
    taskDescInput: document.getElementById('taskDescInput'),
    newSubtaskInput: document.getElementById('newSubtaskInput'),
    addSubtaskBtn: document.getElementById('addSubtaskBtn'),
    modalSubtaskList: document.getElementById('modalSubtaskList'),
    titleError: document.getElementById('titleError'),
    dateError: document.getElementById('dateError'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // --- Initialization ---
  function init() {
    initTheme();
    loadTasks();
    setupEventListeners();
    renderApp();
  }

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    showToast(`Switched to ${newTheme} mode`, 'info');
  }

  // --- Storage Operations ---
  function loadTasks() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        tasks = JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse tasks from localStorage', e);
        tasks = [...DEFAULT_DEMO_TASKS];
        saveTasks();
      }
    } else {
      tasks = [...DEFAULT_DEMO_TASKS];
      saveTasks();
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function resetDemoData() {
    tasks = JSON.parse(JSON.stringify(DEFAULT_DEMO_TASKS));
    saveTasks();
    renderApp();
    showToast('Demo data restored successfully!', 'success');
  }

  // --- Date Logic & Helpers ---
  function isOverdue(dueDateStr, isCompleted) {
    if (isCompleted || !dueDateStr) return false;
    const due = new Date(dueDateStr);
    const now = new Date();
    return due < now;
  }

  function isDueToday(dueDateStr) {
    if (!dueDateStr) return false;
    const due = new Date(dueDateStr);
    const today = new Date();
    return (
      due.getDate() === today.getDate() &&
      due.getMonth() === today.getMonth() &&
      due.getFullYear() === today.getFullYear()
    );
  }

  function formatRelativeDueDate(dueDateStr) {
    if (!dueDateStr) return 'No due date';
    const due = new Date(dueDateStr);
    const now = new Date();
    
    // Time component string e.g. 2:30 PM
    const timeStr = due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (isDueToday(dueDateStr)) {
      return `Today at ${timeStr}`;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (due.getDate() === yesterday.getDate() && due.getMonth() === yesterday.getMonth() && due.getFullYear() === yesterday.getFullYear()) {
      return `Yesterday at ${timeStr}`;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (due.getDate() === tomorrow.getDate() && due.getMonth() === tomorrow.getMonth() && due.getFullYear() === tomorrow.getFullYear()) {
      return `Tomorrow at ${timeStr}`;
    }

    if (diffDays > 1 && diffDays <= 7) {
      const dayName = due.toLocaleDateString([], { weekday: 'short' });
      return `${dayName} at ${timeStr}`;
    }

    return due.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
  }

  // --- Filtering & Sorting Core ---
  function getFilteredTasks() {
    return tasks.filter(task => {
      // View Navigation Filter
      if (activeView === 'today' && !isDueToday(task.dueDate)) return false;
      if (activeView === 'upcoming') {
        const due = new Date(task.dueDate);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        if (task.completed || due <= todayEnd) return false;
      }
      if (activeView === 'overdue' && (!isOverdue(task.dueDate, task.completed))) return false;
      if (activeView === 'completed' && !task.completed) return false;

      // Priority Filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      // Subject Filter
      if (subjectFilter !== 'all' && task.subject !== subjectFilter) return false;

      // Search Query Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesSubject = (task.subject || '').toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const matchesSubtasks = (task.subtasks || []).some(st => (st.text || '').toLowerCase().includes(q));
        if (!matchesTitle && !matchesSubject && !matchesDesc && !matchesSubtasks) return false;
      }

      return true;
    }).sort((a, b) => {
      // Priority sorting
      if (sortBy === 'priorityDesc') {
        return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
      }
      // Due Date Earliest
      if (sortBy === 'dueDateAsc') {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      // Due Date Latest
      if (sortBy === 'dueDateDesc') {
        return new Date(b.dueDate) - new Date(a.dueDate);
      }
      // Title A-Z
      if (sortBy === 'titleAsc') {
        return a.title.localeCompare(b.title);
      }
      // Created Recently
      if (sortBy === 'createdDesc') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0;
    });
  }

  // --- Rendering UI Components ---
  function renderApp() {
    renderStatsAndBadges();
    renderSubjectFilterOptions();
    renderActiveFilterTags();
    renderTaskList();
  }

  function renderStatsAndBadges() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => isOverdue(t.dueDate, t.completed)).length;
    const todayCount = tasks.filter(t => !t.completed && isDueToday(t.dueDate)).length;
    const upcomingCount = tasks.filter(t => {
      const due = new Date(t.dueDate);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      return !t.completed && due > todayEnd;
    }).length;

    // Update Numbers
    elements.statTotal.textContent = total;
    elements.statPending.textContent = pending;
    elements.statCompleted.textContent = completed;
    elements.statOverdue.textContent = overdue;

    // Update Badges
    elements.badgeAll.textContent = total;
    elements.badgeToday.textContent = todayCount;
    elements.badgeUpcoming.textContent = upcomingCount;
    elements.badgeOverdue.textContent = overdue;
    elements.badgeCompleted.textContent = completed;

    // Update Progress Ring
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    elements.progressPercentage.textContent = `${percentage}%`;
    
    // SVG circle circumference for r=40 is ~251.2
    const circumference = 251.2;
    const offset = circumference - (percentage / 100) * circumference;
    elements.progressRing.style.strokeDashoffset = offset;
  }

  function renderSubjectFilterOptions() {
    const subjects = Array.from(new Set(tasks.map(t => t.subject).filter(Boolean)));
    
    // Reset subjectFilter state if current selected subject no longer exists
    if (subjectFilter !== 'all' && !subjects.includes(subjectFilter)) {
      subjectFilter = 'all';
    }

    elements.subjectFilter.innerHTML = '<option value="all">All Subjects</option>';
    subjects.sort().forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = sub;
      if (sub === subjectFilter) opt.selected = true;
      elements.subjectFilter.appendChild(opt);
    });
    elements.subjectFilter.value = subjectFilter;
  }

  function renderActiveFilterTags() {
    const activeTags = [];

    if (searchQuery.trim()) {
      activeTags.push({ type: 'search', label: `Search: "${searchQuery}"` });
    }
    if (priorityFilter !== 'all') {
      activeTags.push({ type: 'priority', label: `Priority: ${priorityFilter.toUpperCase()}` });
    }
    if (subjectFilter !== 'all') {
      activeTags.push({ type: 'subject', label: `Subject: ${subjectFilter}` });
    }

    if (activeTags.length > 0) {
      elements.activeFiltersBar.style.display = 'flex';
      elements.activeFilterTags.innerHTML = activeTags.map(tag => `
        <div class="filter-chip">
          <span>${escapeHtml(tag.label)}</span>
          <button data-remove-filter="${tag.type}" aria-label="Remove filter"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `).join('');
    } else {
      elements.activeFiltersBar.style.display = 'none';
    }
  }

  function renderTaskList() {
    const filtered = getFilteredTasks();
    elements.visibleTaskCount.textContent = filtered.length;

    if (filtered.length === 0) {
      elements.taskListContainer.style.display = 'none';
      elements.emptyState.style.display = 'block';
      updateEmptyStateText();
      return;
    }

    elements.emptyState.style.display = 'none';
    elements.taskListContainer.style.display = 'grid';

    elements.taskListContainer.className = `task-grid ${viewMode === 'list' ? 'list-view' : ''}`;

    elements.taskListContainer.innerHTML = filtered.map(task => createTaskCardHtml(task)).join('');
  }

  function createTaskCardHtml(task) {
    const overdue = isOverdue(task.dueDate, task.completed);
    const dueToday = isDueToday(task.dueDate);
    const formattedDate = formatRelativeDueDate(task.dueDate);

    // Subtasks summary
    const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
    const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;

    return `
      <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-card-header">
          <div class="task-checkbox-wrapper">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-action="toggle-complete" aria-label="Mark task completed">
          </div>
          <div class="task-title-area">
            <h4 class="task-title">${escapeHtml(task.title)}</h4>
            <div class="task-meta-row">
              <span class="priority-badge priority-${task.priority}">
                ${getPriorityIcon(task.priority)} ${task.priority}
              </span>
              ${task.subject ? `<span class="subject-tag"><i class="fa-solid fa-book-bookmark"></i> ${escapeHtml(task.subject)}</span>` : ''}
            </div>
          </div>
        </div>

        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}

        ${totalSubtasks > 0 ? `
          <div class="subtasks-container">
            <div class="subtasks-header-toggle" data-action="toggle-subtasks-view">
              <span><i class="fa-solid fa-bars-progress"></i> Checklist (${completedSubtasks}/${totalSubtasks})</span>
              <i class="fa-solid fa-chevron-down"></i>
            </div>
            <ul class="subtasks-list">
              ${task.subtasks.map(st => `
                <li class="subtask-item">
                  <input type="checkbox" ${st.completed ? 'checked' : ''} data-action="toggle-subtask" data-subtask-id="${st.id}">
                  <span class="${st.completed ? 'done' : ''}">${escapeHtml(st.text)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="task-card-footer">
          <div class="due-date-indicator ${overdue ? 'overdue' : (dueToday ? 'today' : '')}">
            <i class="fa-regular fa-clock"></i>
            <span>${formattedDate}</span>
            ${overdue ? ' ⚠️ Overdue' : ''}
          </div>

          <div class="task-actions">
            <button class="action-btn" data-action="edit-task" title="Edit Task">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="action-btn delete-btn" data-action="delete-task" title="Delete Task">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function getPriorityIcon(p) {
    switch (p) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  function updateEmptyStateText() {
    if (searchQuery || priorityFilter !== 'all' || subjectFilter !== 'all') {
      elements.emptyStateTitle.textContent = 'No matching tasks found';
      elements.emptyStateDesc.textContent = 'Try adjusting your search query or filter criteria to see more tasks.';
    } else {
      switch (activeView) {
        case 'today':
          elements.emptyStateTitle.textContent = 'No tasks due today!';
          elements.emptyStateDesc.textContent = 'You are all clear for today. Take a break or plan ahead!';
          break;
        case 'upcoming':
          elements.emptyStateTitle.textContent = 'No upcoming tasks';
          elements.emptyStateDesc.textContent = 'You have no scheduled tasks for the coming days.';
          break;
        case 'overdue':
          elements.emptyStateTitle.textContent = 'No overdue tasks 🎉';
          elements.emptyStateDesc.textContent = 'Great job staying on top of all your coursework deadlines!';
          break;
        case 'completed':
          elements.emptyStateTitle.textContent = 'No completed tasks yet';
          elements.emptyStateDesc.textContent = 'Finish a task to see it in your completed archive.';
          break;
        default:
          elements.emptyStateTitle.textContent = 'Your task list is empty';
          elements.emptyStateDesc.textContent = 'Add your first task to start organizing your study schedule!';
      }
    }
  }

  // --- Task CRUD Actions ---
  function toggleTaskCompletion(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.completed = !task.completed;
    saveTasks();
    renderApp();
    showToast(task.completed ? 'Task marked as completed! 🎯' : 'Task reopened', 'success');
  }

  function toggleSubtaskCompletion(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (sub) {
      sub.completed = !sub.completed;
      saveTasks();
      renderApp();
    }
  }

  function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      tasks = tasks.filter(t => t.id !== taskId);
      saveTasks();
      renderApp();
      showToast('Task deleted successfully', 'danger');
    }
  }

  // --- Modal Logic ---
  function openModal(editingTask = null) {
    // Reset validation errors
    elements.taskForm.classList.remove('was-validated');
    elements.titleError.parentElement.classList.remove('error');
    elements.dateError.parentElement.classList.remove('error');

    if (editingTask) {
      elements.modalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Task';
      elements.taskIdInput.value = editingTask.id;
      elements.taskTitleInput.value = editingTask.title;
      elements.taskSubjectInput.value = editingTask.subject || '';
      elements.taskPriorityInput.value = editingTask.priority;
      elements.taskDueDateInput.value = editingTask.dueDate;
      elements.taskDescInput.value = editingTask.description || '';
      currentModalSubtasks = JSON.parse(JSON.stringify(editingTask.subtasks || []));
    } else {
      elements.modalTitle.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Create New Task';
      elements.taskForm.reset();
      elements.taskIdInput.value = '';
      
      // Default due date: tomorrow at 5:00 PM
      elements.taskDueDateInput.value = getRelativeDateOffset(1, 17, 0);
      elements.taskPriorityInput.value = 'medium';
      currentModalSubtasks = [];
    }

    renderModalSubtasks();
    elements.taskModalBackdrop.classList.add('active');
    elements.taskTitleInput.focus();
  }

  function closeModal() {
    elements.taskModalBackdrop.classList.remove('active');
  }

  function renderModalSubtasks() {
    elements.modalSubtaskList.innerHTML = currentModalSubtasks.map((st, index) => `
      <li class="modal-subtask-item">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1; margin: 0;">
          <input type="checkbox" ${st.completed ? 'checked' : ''} data-toggle-modal-subtask="${index}">
          <span style="${st.completed ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${escapeHtml(st.text)}</span>
        </label>
        <button type="button" data-remove-subtask="${index}" aria-label="Remove subtask">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </li>
    `).join('');
  }

  function addSubtaskFromModalInput() {
    const text = elements.newSubtaskInput.value.trim();
    if (text) {
      currentModalSubtasks.push({
        id: 'st-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        text: text,
        completed: false
      });
      elements.newSubtaskInput.value = '';
      renderModalSubtasks();
    }
  }

  function handleTaskFormSubmit(e) {
    e.preventDefault();

    const title = elements.taskTitleInput.value.trim();
    const dueDate = elements.taskDueDateInput.value;

    let valid = true;

    if (!title) {
      elements.titleError.parentElement.classList.add('error');
      valid = false;
    } else {
      elements.titleError.parentElement.classList.remove('error');
    }

    if (!dueDate) {
      elements.dateError.parentElement.classList.add('error');
      valid = false;
    } else {
      elements.dateError.parentElement.classList.remove('error');
    }

    if (!valid) return;

    const id = elements.taskIdInput.value;
    const taskData = {
      title: title,
      subject: elements.taskSubjectInput.value.trim(),
      priority: elements.taskPriorityInput.value,
      dueDate: dueDate,
      description: elements.taskDescInput.value.trim(),
      subtasks: currentModalSubtasks
    };

    if (id) {
      // Edit existing
      const existing = tasks.find(t => t.id === id);
      if (existing) {
        Object.assign(existing, taskData);
        showToast('Task updated successfully!', 'success');
      }
    } else {
      // Create new
      const newTask = {
        id: 'task-' + Date.now(),
        ...taskData,
        completed: false,
        createdAt: new Date().toISOString()
      };
      tasks.unshift(newTask);
      showToast('New task created!', 'success');
    }

    saveTasks();
    closeModal();
    renderApp();
  }

  // --- Toasts Notifications ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'danger') icon = 'fa-circle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Helper XSS Escape
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Theme Toggle
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Sidebar Mobile Controls
    elements.openSidebarBtn.addEventListener('click', () => {
      elements.sidebar.classList.add('open');
      elements.sidebarOverlay.classList.add('active');
    });

    const closeSidebar = () => {
      elements.sidebar.classList.remove('open');
      elements.sidebarOverlay.classList.remove('active');
    };
    elements.closeSidebarBtn.addEventListener('click', closeSidebar);
    elements.sidebarOverlay.addEventListener('click', closeSidebar);

    // Navigation Views
    elements.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeView = btn.dataset.filterView;

        // Update Title & Subtitle
        const viewNames = {
          all: ['All Tasks', 'Manage your coursework, assignments, and study schedules'],
          today: ['Due Today', 'Tasks requiring your focus today'],
          upcoming: ['Upcoming Tasks', 'Assignments and exams scheduled for the future'],
          overdue: ['Overdue Tasks', 'Urgent items requiring immediate attention'],
          completed: ['Completed Tasks', 'Archive of your finished coursework']
        };

        const [title, subtitle] = viewNames[activeView] || ['Tasks', ''];
        elements.viewTitle.textContent = title;
        elements.viewSubtitle.textContent = subtitle;

        renderTaskList();
        if (window.innerWidth <= 992) closeSidebar();
      });
    });

    // Modal Triggers
    elements.openAddTaskModalBtn.addEventListener('click', () => openModal());
    elements.fabAddTaskBtn.addEventListener('click', () => openModal());
    elements.emptyStateAddBtn.addEventListener('click', () => openModal());
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.cancelModalBtn.addEventListener('click', closeModal);
    
    elements.taskModalBackdrop.addEventListener('click', (e) => {
      if (e.target === elements.taskModalBackdrop) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.taskModalBackdrop.classList.contains('active')) {
        closeModal();
      }
    });

    // Real-time Input Error Clearing
    elements.taskTitleInput.addEventListener('input', () => {
      if (elements.taskTitleInput.value.trim()) {
        elements.titleError.parentElement.classList.remove('error');
      }
    });

    elements.taskDueDateInput.addEventListener('input', () => {
      if (elements.taskDueDateInput.value) {
        elements.dateError.parentElement.classList.remove('error');
      }
    });

    // Subtask Modal Add Button
    elements.addSubtaskBtn.addEventListener('click', addSubtaskFromModalInput);
    elements.newSubtaskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSubtaskFromModalInput();
      }
    });

    // Subtask Modal Item Actions (Delete & Toggle Completed)
    elements.modalSubtaskList.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-remove-subtask]');
      if (deleteBtn) {
        const index = parseInt(deleteBtn.dataset.removeSubtask, 10);
        currentModalSubtasks.splice(index, 1);
        renderModalSubtasks();
      }
    });

    elements.modalSubtaskList.addEventListener('change', (e) => {
      const toggleCb = e.target.closest('[data-toggle-modal-subtask]');
      if (toggleCb) {
        const index = parseInt(toggleCb.dataset.toggleModalSubtask, 10);
        if (currentModalSubtasks[index]) {
          currentModalSubtasks[index].completed = toggleCb.checked;
          renderModalSubtasks();
        }
      }
    });

    // Task Form Submit
    elements.taskForm.addEventListener('submit', handleTaskFormSubmit);

    // Controls: Search, Priority & Subject Filters, Sort
    elements.searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      elements.clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      renderApp();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      searchQuery = '';
      elements.searchInput.value = '';
      elements.clearSearchBtn.style.display = 'none';
      renderApp();
    });

    elements.priorityFilter.addEventListener('change', (e) => {
      priorityFilter = e.target.value;
      renderApp();
    });

    elements.subjectFilter.addEventListener('change', (e) => {
      subjectFilter = e.target.value;
      renderApp();
    });

    elements.sortBySelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderTaskList();
    });

    // Reset Active Filters
    elements.resetFiltersBtn.addEventListener('click', () => {
      searchQuery = '';
      priorityFilter = 'all';
      subjectFilter = 'all';
      elements.searchInput.value = '';
      elements.priorityFilter.value = 'all';
      elements.subjectFilter.value = 'all';
      renderApp();
    });

    // Active Filter Chip Remove
    elements.activeFilterTags.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove-filter]');
      if (removeBtn) {
        const type = removeBtn.dataset.removeFilter;
        if (type === 'search') {
          searchQuery = '';
          elements.searchInput.value = '';
        }
        if (type === 'priority') {
          priorityFilter = 'all';
          elements.priorityFilter.value = 'all';
        }
        if (type === 'subject') {
          subjectFilter = 'all';
          elements.subjectFilter.value = 'all';
        }
        renderApp();
      }
    });

    // View Mode Toggle (Grid vs List)
    elements.viewModeGridBtn.addEventListener('click', () => {
      viewMode = 'grid';
      elements.viewModeGridBtn.classList.add('active');
      elements.viewModeListBtn.classList.remove('active');
      renderTaskList();
    });

    elements.viewModeListBtn.addEventListener('click', () => {
      viewMode = 'list';
      elements.viewModeListBtn.classList.add('active');
      elements.viewModeGridBtn.classList.remove('active');
      renderTaskList();
    });

    // Task Card Delegation (Check, Subtask Check, Edit, Delete, Accordion Toggle)
    elements.taskListContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.task-card');
      if (!card) return;
      const taskId = card.dataset.id;

      // Toggle Subtask Checklist Accordion View
      const accordionHeader = e.target.closest('[data-action="toggle-subtasks-view"]');
      if (accordionHeader) {
        const container = accordionHeader.closest('.subtasks-container');
        if (container) container.classList.toggle('collapsed');
        return;
      }

      // Complete toggle
      if (e.target.matches('[data-action="toggle-complete"]')) {
        toggleTaskCompletion(taskId);
        return;
      }

      // Subtask item check toggle
      if (e.target.matches('[data-action="toggle-subtask"]')) {
        const subtaskId = e.target.dataset.subtaskId;
        toggleSubtaskCompletion(taskId, subtaskId);
        return;
      }

      // Edit task button
      if (e.target.closest('[data-action="edit-task"]')) {
        const task = tasks.find(t => t.id === taskId);
        if (task) openModal(task);
        return;
      }

      // Delete task button
      if (e.target.closest('[data-action="delete-task"]')) {
        deleteTask(taskId);
        return;
      }
    });

    // Reset Demo Data
    elements.resetDemoBtn.addEventListener('click', () => {
      if (confirm('Reset to default sample student tasks? This will overwrite your custom tasks.')) {
        resetDemoData();
      }
    });
  }

  // Initialize application on DOM ready
  document.addEventListener('DOMContentLoaded', init);
})();
