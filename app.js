/**
 * STUDIOUS - Student Task & Study Manager
 * Single Source of Truth & Real Data-Driven Application Engine
 */

(function () {
  'use strict';

  // --- Constants & Keys ---
  const STORAGE_KEY = 'studious_tasks_v1';
  const THEME_KEY = 'studious_theme_v1';
  const SUBJECT_COLORS_KEY = 'studious_subject_colors_v1';
  const FOCUS_ACTIVE_KEY = 'studious_active_focus_v1';
  const FOCUS_HISTORY_KEY = 'studious_focus_history_v1';
  const SOUND_ENABLED_KEY = 'studious_sound_enabled_v1';
  const DEADLINE_ALERT_KEY = 'studious_deadline_alert_v1';

  // Priority numerical values for sorting
  const PRIORITY_ORDER = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  // Task Types & Icons
  const TASK_TYPE_ICONS = {
    Assignment: '📝',
    Exam: '🎯',
    Quiz: '⚡',
    Lab: '🧪',
    Project: '🚀',
    Reading: '📖',
    Other: '📌'
  };

  // Accessible Subject Palette
  const PALETTE = [
    { bg: 'rgba(99, 102, 241, 0.15)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.3)' }, // Indigo
    { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' }, // Emerald
    { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' }, // Amber
    { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.3)' }, // Pink
    { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' }, // Purple
    { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' }, // Cyan
    { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: 'rgba(249, 115, 22, 0.3)' }, // Orange
    { bg: 'rgba(20, 184, 166, 0.15)', text: '#14b8a6', border: 'rgba(20, 184, 166, 0.3)' }  // Teal
  ];

  // --- Initial Demo Tasks ---
  const DEFAULT_DEMO_TASKS = [
    {
      id: 'demo-task-1',
      title: 'CS101: Submit Binary Search Tree Lab Assignment',
      subject: 'Computer Science',
      type: 'Lab',
      priority: 'urgent',
      dueDate: getRelativeDateOffset(1, 14, 0), // Tomorrow 2:00 PM
      estimatedTime: 90,
      reminder: '2hours',
      reminderFired: false,
      deadlineAlertFired: false,
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
      type: 'Exam',
      priority: 'high',
      dueDate: getRelativeDateOffset(0, 18, 0), // Today 6:00 PM
      estimatedTime: 120,
      reminder: '1day',
      reminderFired: false,
      deadlineAlertFired: false,
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
      type: 'Assignment',
      priority: 'medium',
      dueDate: getRelativeDateOffset(5, 18, 0),
      estimatedTime: 45,
      reminder: 'none',
      reminderFired: false,
      deadlineAlertFired: false,
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
      type: 'Lab',
      priority: 'low',
      dueDate: getRelativeDateOffset(-1, 12, 0), // Yesterday
      estimatedTime: 60,
      reminder: 'none',
      reminderFired: true,
      deadlineAlertFired: true,
      description: 'Plot fringe separation vs distance graphs and submit final PDF report.',
      subtasks: [
        { id: 'st-8', text: 'Calibrate laser wavelength data', completed: true },
        { id: 'st-9', text: 'Export graphs from Excel', completed: true }
      ],
      completed: true,
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    }
  ];

  // Helper to generate ISO local datetime string for relative offsets
  function getRelativeDateOffset(daysOffset, hours, minutes) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hours, minutes, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hours)}:${pad(minutes)}`;
  }

  // --- App State ---
  let tasks = [];
  let subjectColorsMap = {};
  let activeView = 'all'; // 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'
  let searchQuery = '';
  let priorityFilter = 'all';
  let typeFilter = 'all';
  let subjectFilter = 'all';
  let sortBy = 'dueDateAsc';
  let viewMode = 'grid'; // 'grid' | 'list'
  let currentModalSubtasks = [];
  let currentCalendarDate = new Date();
  let calendarFilterDate = null;
  let activeFocusSession = null;
  let focusTicker = null;
  let selectedFocusDurationMinutes = 25;

  // --- DOM Elements ---
  const elements = {
    // Layout & Navigation
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    dashboardBody: document.getElementById('dashboardBody'),
    openSidebarBtn: document.getElementById('openSidebarBtn'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    navButtons: document.querySelectorAll('.nav-btn'),
    resetDemoBtn: document.getElementById('resetDemoBtn'),
    clearAllTasksBtn: document.getElementById('clearAllTasksBtn'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    importDataTriggerBtn: document.getElementById('importDataTriggerBtn'),
    importFileInput: document.getElementById('importFileInput'),

    // Notifications & Browser Alerts
    notificationsBtn: document.getElementById('notificationsBtn'),
    notificationsPanel: document.getElementById('notificationsPanel'),
    notificationBadgeCount: document.getElementById('notificationBadgeCount'),
    notifPermissionCard: document.getElementById('notifPermissionCard'),
    notifStatusDot: document.getElementById('notifStatusDot'),
    notifPermissionStatusText: document.getElementById('notifPermissionStatusText'),
    notifPermissionDesc: document.getElementById('notifPermissionDesc'),
    requestNotifPermissionBtn: document.getElementById('requestNotifPermissionBtn'),
    testNotifBtn: document.getElementById('testNotifBtn'),
    toggleSoundBtn: document.getElementById('toggleSoundBtn'),
    soundToggleDot: document.getElementById('soundToggleDot'),
    soundToggleText: document.getElementById('soundToggleText'),
    testSoundBtn: document.getElementById('testSoundBtn'),
    toggleDeadlineAlertBtn: document.getElementById('toggleDeadlineAlertBtn'),
    deadlineToggleDot: document.getElementById('deadlineToggleDot'),
    deadlineToggleText: document.getElementById('deadlineToggleText'),

    // Today's Plan
    todaysPlanCard: document.getElementById('todaysPlanCard'),
    todaysPlanBadge: document.getElementById('todaysPlanBadge'),
    todaysPlanSummary: document.getElementById('todaysPlanSummary'),
    todaysPlanList: document.getElementById('todaysPlanList'),
    viewFullPlanBtn: document.getElementById('viewFullPlanBtn'),

    // Header & View titles
    viewTitle: document.getElementById('viewTitle'),
    viewSubtitle: document.getElementById('viewSubtitle'),
    sectionHeaderTitle: document.getElementById('sectionHeaderTitle'),
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
    typeFilter: document.getElementById('typeFilter'),
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
    taskTypeInput: document.getElementById('taskTypeInput'),
    taskPriorityInput: document.getElementById('taskPriorityInput'),
    taskDueDateInput: document.getElementById('taskDueDateInput'),
    presetChips: document.querySelectorAll('.preset-chip:not(.est-chip)'),

    // Modal Fields
    taskEstTimeSelect: document.getElementById('taskEstTimeSelect'),
    taskEstTimeCustomInput: document.getElementById('taskEstTimeCustomInput'),
    estChips: document.querySelectorAll('.preset-chip.est-chip'),
    taskReminderSelect: document.getElementById('taskReminderSelect'),
    taskReminderCustomInput: document.getElementById('taskReminderCustomInput'),

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
    loadSubjectColors();
    loadTasks();
    setupEventListeners();
    initSoundAndDeadlineSettings();
    renderApp();
    checkRemindersAndDeadlines();
    updateNotificationPermissionUi();
    initFocusMode();

    // Check reminders and refresh overdue counters periodically every 10 seconds
    setInterval(() => {
      checkRemindersAndDeadlines();
      renderStatsAndBadges();
    }, 10000);
  }

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    showToast(`Switched to ${newTheme} mode`, 'info');
  }

  // --- Subject Color Management ---
  function loadSubjectColors() {
    const data = localStorage.getItem(SUBJECT_COLORS_KEY);
    if (data) {
      try {
        subjectColorsMap = JSON.parse(data);
      } catch (e) {
        subjectColorsMap = {};
      }
    }
  }

  function saveSubjectColors() {
    localStorage.setItem(SUBJECT_COLORS_KEY, JSON.stringify(subjectColorsMap));
  }

  function getSubjectStyle(subjectStr) {
    if (!subjectStr) return PALETTE[0];
    const key = subjectStr.trim().toLowerCase();

    if (subjectColorsMap[key] === undefined) {
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % PALETTE.length;
      subjectColorsMap[key] = index;
      saveSubjectColors();
    }

    const paletteIndex = subjectColorsMap[key] % PALETTE.length;
    return PALETTE[paletteIndex];
  }

  // --- Format Helpers ---
  function formatEstTime(minutes) {
    const m = parseInt(minutes, 10);
    if (isNaN(m) || m <= 0) return '';
    if (m < 60) return `${m}m`;
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  // --- Data Migration & Storage Operations ---
  function migrateTaskData(t) {
    return {
      id: t.id || 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: t.title || 'Untitled Task',
      subject: t.subject || '',
      type: t.type || 'Other',
      priority: t.priority || 'medium',
      dueDate: t.dueDate || '',
      estimatedTime: typeof t.estimatedTime === 'number' ? t.estimatedTime : (parseInt(t.estimatedTime, 10) || 0),
      reminder: t.reminder || 'none',
      reminderCustomDate: t.reminderCustomDate || '',
      reminderFired: !!t.reminderFired,
      deadlineAlertFired: !!t.deadlineAlertFired,
      description: t.description || '',
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.map(st => ({
        id: st.id || 'st-' + Math.random().toString(36).substr(2, 6),
        text: st.text || '',
        completed: !!st.completed
      })) : [],
      completed: !!t.completed,
      completedAt: t.completedAt || (t.completed ? new Date().toISOString() : null),
      createdAt: t.createdAt || new Date().toISOString()
    };
  }

  function loadTasks() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const raw = JSON.parse(data);
        tasks = Array.isArray(raw) ? raw.map(migrateTaskData) : [];
      } catch (e) {
        console.error('Failed to parse tasks from localStorage', e);
        tasks = [];
      }
    } else {
      tasks = [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function resetDemoData() {
    if (confirm('Load sample student tasks to explore Studious? This will replace your current tasks.')) {
      tasks = DEFAULT_DEMO_TASKS.map(migrateTaskData);
      saveTasks();
      renderApp();
      showToast('Sample demo tasks loaded successfully!', 'success');
    }
  }

  function clearAllTasks() {
    if (confirm('Are you sure? This will permanently remove all current tasks from this browser. Export your tasks first if you want a backup.')) {
      tasks = [];
      saveTasks();

      searchQuery = '';
      priorityFilter = 'all';
      typeFilter = 'all';
      subjectFilter = 'all';
      calendarFilterDate = null;

      if (elements.searchInput) elements.searchInput.value = '';
      if (elements.priorityFilter) elements.priorityFilter.value = 'all';
      if (elements.typeFilter) elements.typeFilter.value = 'all';
      if (elements.subjectFilter) elements.subjectFilter.value = 'all';

      renderApp();
      showToast('All tasks cleared. Started fresh!', 'info');
    }
  }

  // Helper for safe Date parsing
  function parseAppDate(dateStr) {
    if (!dateStr) return null;
    const normalized = dateStr.includes(' ') && !dateStr.includes('T') ? dateStr.replace(' ', 'T') : dateStr;
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  }

  // --- In-App Reminders Engine ---
  function calculateReminderTime(task) {
    if (!task || task.completed || !task.reminder || task.reminder === 'none') return null;

    if (task.reminder === 'custom') {
      return parseAppDate(task.reminderCustomDate);
    }

    const due = parseAppDate(task.dueDate);
    if (!due) return null;

    const dueTimestamp = due.getTime();

    if (task.reminder === 'at-deadline') {
      return due;
    }
    if (task.reminder === '30min') {
      return new Date(dueTimestamp - 30 * 60 * 1000);
    }
    if (task.reminder === '2hours') {
      return new Date(dueTimestamp - 2 * 60 * 60 * 1000);
    }
    if (task.reminder === '1day') {
      return new Date(dueTimestamp - 24 * 60 * 60 * 1000);
    }

    return null;
  }

  // --- In-App Reminders & Browser Notification Engine ---
  function updateNotificationPermissionUi() {
    const dot = elements.notifStatusDot || document.getElementById('notifStatusDot');
    const text = elements.notifPermissionStatusText || document.getElementById('notifPermissionStatusText');
    const desc = elements.notifPermissionDesc || document.getElementById('notifPermissionDesc');
    const reqBtn = elements.requestNotifPermissionBtn || document.getElementById('requestNotifPermissionBtn');
    const testBtn = elements.testNotifBtn || document.getElementById('testNotifBtn');

    if (!text || !dot) return;

    if (!('Notification' in window)) {
      text.textContent = 'Desktop Notifications: Not Supported';
      dot.className = 'notif-status-dot unsupported';
      if (desc) desc.textContent = 'This browser does not support Web Notifications. Studious will use in-app alerts.';
      if (reqBtn) reqBtn.style.display = 'none';
      if (testBtn) testBtn.style.display = 'none';
      return;
    }

    const perm = Notification.permission;
    if (perm === 'granted') {
      text.textContent = 'Desktop Notifications: Active';
      dot.className = 'notif-status-dot granted';
      if (desc) desc.textContent = 'Browser notifications are enabled. You will receive alerts for upcoming reminders.';
      if (reqBtn) reqBtn.style.display = 'none';
      if (testBtn) testBtn.style.display = 'inline-flex';
    } else if (perm === 'denied') {
      text.textContent = 'Desktop Notifications: Blocked';
      dot.className = 'notif-status-dot denied';
      if (desc) desc.textContent = 'Notifications are blocked in your browser settings. To enable them, allow notifications for this site.';
      if (reqBtn) reqBtn.style.display = 'none';
      if (testBtn) testBtn.style.display = 'none';
    } else {
      text.textContent = 'Desktop Notifications: Disabled';
      dot.className = 'notif-status-dot default';
      if (desc) desc.textContent = 'Enable browser notifications to receive alerts for upcoming task deadlines and focus sessions.';
      if (reqBtn) reqBtn.style.display = 'inline-flex';
      if (testBtn) testBtn.style.display = 'none';
    }
  }

  function requestNotificationPermission() {
    if (!('Notification' in window)) {
      showToast('Browser notifications are not supported in this browser.', 'warning');
      return;
    }

    if (Notification.permission === 'granted') {
      showToast('Browser notifications are already enabled!', 'info');
      updateNotificationPermissionUi();
      return;
    }

    if (Notification.permission === 'denied') {
      showToast('Notifications are blocked by your browser settings. Please allow notifications in site settings.', 'warning');
      updateNotificationPermissionUi();
      return;
    }

    const onPermissionResolved = (perm) => {
      updateNotificationPermissionUi();
      if (perm === 'granted') {
        showToast('Desktop notifications enabled successfully!', 'success');
        try {
          const welcome = new Notification('Studious Reminders Active 🔔', {
            body: 'You will now receive desktop alerts for study reminders and focus sessions.',
            tag: 'studious-welcome-alert'
          });
          welcome.onclick = () => {
            try { window.focus(); } catch (e) {}
            welcome.close();
          };
        } catch (e) {
          console.warn('Welcome notification dispatch error:', e);
        }
      } else if (perm === 'denied') {
        showToast('Notification permission was denied. In-app alerts will continue to work.', 'warning');
      }
    };

    try {
      const promise = Notification.requestPermission(onPermissionResolved);
      if (promise && typeof promise.then === 'function') {
        promise.then(onPermissionResolved).catch(err => {
          console.warn('Error requesting notification permission:', err);
        });
      }
    } catch (err) {
      console.warn('Error invoking requestPermission:', err);
    }
  }

  function sendTestNotification() {
    if (!('Notification' in window)) {
      showToast('Notifications are not supported in this browser.', 'warning');
      return;
    }
    if (Notification.permission !== 'granted') {
      showToast('Notification permission is not granted yet.', 'warning');
      return;
    }

    try {
      const notif = new Notification('Studious Test Alert 🔔', {
        body: 'This is a test notification. Your study reminders are working perfectly!',
        tag: 'studious-test-alert'
      });
      notif.onclick = () => {
        try { window.focus(); } catch (e) {}
        notif.close();
      };
      showToast('Test notification dispatched!', 'success');
    } catch (err) {
      showToast('Could not dispatch notification: ' + err.message, 'error');
    }
  }

  function highlightTask(taskId) {
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If currently filtered out, reset view to all so the task card is rendered
    const visibleTasks = (typeof getFilteredTasks === 'function') ? getFilteredTasks() : [];
    const isVisible = visibleTasks.some(t => t.id === taskId);
    if (!isVisible) {
      currentView = 'all';
      currentSubjectFilter = 'all';
      priorityFilter = 'all';
      typeFilter = 'all';
      searchQuery = '';
      if (elements.searchInput) elements.searchInput.value = '';
      document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.toggle('active', n.dataset.filterView === 'all');
      });
      renderApp();
    }

    setTimeout(() => {
      const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.remove('task-card-highlighted');
        void card.offsetWidth;
        card.classList.add('task-card-highlighted');
        setTimeout(() => card.classList.remove('task-card-highlighted'), 3000);
      }
    }, 60);
  }

  // --- Audio Chime & Deadline Alerts Manager ---
  let audioCtx = null;

  function getOrCreateAudioContext() {
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('Web Audio Context initialization warning:', e);
    }
    return audioCtx;
  }

  function isSoundEnabled() {
    return localStorage.getItem(SOUND_ENABLED_KEY) === 'true';
  }

  function setSoundEnabled(enabled) {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
    updateSoundUi();
  }

  function toggleSound() {
    getOrCreateAudioContext();
    const newState = !isSoundEnabled();
    setSoundEnabled(newState);
    if (newState) {
      playAlertSound();
      showToast('Alert sound enabled 🔔', 'info');
    } else {
      showToast('Alert sound disabled 🔕', 'info');
    }
  }

  function isDeadlineAlertEnabled() {
    return localStorage.getItem(DEADLINE_ALERT_KEY) !== 'false';
  }

  function setDeadlineAlertEnabled(enabled) {
    localStorage.setItem(DEADLINE_ALERT_KEY, enabled ? 'true' : 'false');
    updateDeadlineAlertUi();
  }

  function toggleDeadlineAlert() {
    const newState = !isDeadlineAlertEnabled();
    setDeadlineAlertEnabled(newState);
    showToast(newState ? 'Deadline alerts enabled ⏰' : 'Deadline alerts paused ⏸️', 'info');
  }

  function playAlertSound() {
    if (!isSoundEnabled()) return;
    try {
      const ctx = getOrCreateAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      // Primary harmonic tone: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Second harmonic tone: A5 (880 Hz) slightly staggered
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (err) {
      console.warn('Audio chime playback error:', err);
    }
  }

  function updateSoundUi() {
    const enabled = isSoundEnabled();
    const btn = elements.toggleSoundBtn || document.getElementById('toggleSoundBtn');
    const dot = elements.soundToggleDot || document.getElementById('soundToggleDot');
    const text = elements.soundToggleText || document.getElementById('soundToggleText');
    const testBtn = elements.testSoundBtn || document.getElementById('testSoundBtn');
    const icon = document.getElementById('soundIcon');
    const desc = document.getElementById('soundStatusDesc');

    if (btn) {
      btn.classList.toggle('active', enabled);
      btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    }
    if (dot) dot.classList.toggle('active', enabled);
    if (text) text.textContent = enabled ? 'Sound: ON' : 'Sound: OFF';
    if (testBtn) testBtn.style.display = enabled ? 'inline-flex' : 'none';
    if (icon) {
      icon.className = enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    }
    if (desc) {
      desc.textContent = enabled ? 'Chime will play when reminders or deadlines fire' : 'Play Web Audio chime on alert';
    }
  }

  function updateDeadlineAlertUi() {
    const enabled = isDeadlineAlertEnabled();
    const btn = elements.toggleDeadlineAlertBtn || document.getElementById('toggleDeadlineAlertBtn');
    const dot = elements.deadlineToggleDot || document.getElementById('deadlineToggleDot');
    const text = elements.deadlineToggleText || document.getElementById('deadlineToggleText');

    if (btn) {
      btn.classList.toggle('active', enabled);
      btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    }
    if (dot) dot.classList.toggle('active', enabled);
    if (text) text.textContent = enabled ? 'Alerts: ON' : 'Alerts: OFF';
  }

  function initSoundAndDeadlineSettings() {
    updateSoundUi();
    updateDeadlineAlertUi();

    const toggleSoundBtn = elements.toggleSoundBtn || document.getElementById('toggleSoundBtn');
    if (toggleSoundBtn) {
      toggleSoundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSound();
      });
    }

    const testSoundBtn = elements.testSoundBtn || document.getElementById('testSoundBtn');
    if (testSoundBtn) {
      testSoundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        getOrCreateAudioContext();
        playAlertSound();
        showToast('Playing sample alert chime 🔔', 'info');
      });
    }

    const toggleDeadlineAlertBtn = elements.toggleDeadlineAlertBtn || document.getElementById('toggleDeadlineAlertBtn');
    if (toggleDeadlineAlertBtn) {
      toggleDeadlineAlertBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDeadlineAlert();
      });
    }
  }

  function checkRemindersAndDeadlines() {
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) return;

    const now = Date.now();
    const safeExpirationWindowMs = 24 * 60 * 60 * 1000; // 24 hours safe window
    let stateChanged = false;
    let playSoundNeeded = false;

    tasks.forEach(task => {
      if (!task || task.completed) return;

      const due = parseAppDate(task.dueDate);
      const dueTimestamp = due && !isNaN(due.getTime()) ? due.getTime() : null;

      // 1. Advance Reminders Check (e.g. 30min, 2hours, 1day, custom, at-deadline)
      if (task.reminder && task.reminder !== 'none' && !task.reminderFired) {
        const remTime = calculateReminderTime(task);
        if (remTime) {
          const remTimestamp = remTime.getTime();
          if (now >= remTimestamp) {
            if (now - remTimestamp > safeExpirationWindowMs) {
              task.reminderFired = true;
              stateChanged = true;
            } else {
              showToast(`⏰ Reminder: "${escapeHtml(task.title || 'Task')}" is scheduled soon!`, 'warning');
              playSoundNeeded = true;

              if ('Notification' in window && Notification.permission === 'granted') {
                try {
                  const dueStr = task.dueDate ? new Date(task.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Soon';
                  const notif = new Notification(`⏰ Task Reminder: ${task.title || 'Study Task'}`, {
                    body: `Due: ${dueStr}\nPriority: ${task.priority || 'Normal'} | Subject: ${task.subject || 'General'}`,
                    tag: `studious-task-${task.id}`,
                    renotify: false
                  });
                  notif.onclick = function () {
                    try { window.focus(); } catch (e) {}
                    notif.close();
                    highlightTask(task.id);
                  };
                } catch (err) {
                  console.warn('Browser notification dispatch error:', err);
                }
              }

              task.reminderFired = true;
              stateChanged = true;
            }
          }
        }
      }

      // 2. Deadline Alerts Check (fires when active incomplete task reaches or passes deadline)
      if (dueTimestamp && !task.deadlineAlertFired && isDeadlineAlertEnabled()) {
        if (now >= dueTimestamp) {
          const dueObj = new Date(dueTimestamp);
          const timeStr = dueObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isMissed = (now - dueTimestamp) > 10 * 60 * 1000; // Over 10m ago (tab closed / hidden)

          if (isMissed) {
            showToast(`⚠️ Missed Deadline: "${escapeHtml(task.title || 'Task')}" was due at ${timeStr}!`, 'danger');
          } else {
            showToast(`⏰ Deadline Reached: "${escapeHtml(task.title || 'Task')}" is due now!`, 'danger');
          }

          playSoundNeeded = true;

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const notif = new Notification(`⏰ Task Deadline: ${task.title || 'Study Task'}`, {
                body: `Deadline reached (${timeStr})! Priority: ${task.priority || 'Normal'} | Subject: ${task.subject || 'General'}`,
                tag: `studious-deadline-${task.id}`,
                renotify: false
              });
              notif.onclick = function () {
                try { window.focus(); } catch (e) {}
                notif.close();
                highlightTask(task.id);
              };
            } catch (err) {
              console.warn('Browser deadline notification dispatch error:', err);
            }
          }

          task.deadlineAlertFired = true;
          stateChanged = true;
        }
      }
    });

    if (playSoundNeeded) {
      playAlertSound();
    }

    if (stateChanged) {
      saveTasks();
      renderStatsAndBadges();
      renderTaskList();
      renderNotificationsPanel();
    }
  }

  // Backwards compatibility alias for callers of checkInAppReminders
  function checkInAppReminders() {
    checkRemindersAndDeadlines();
  }

  // --- Backup Export & Import ---
  function exportData() {
    const data = {
      version: '1.0',
      appName: 'Studious',
      exportDate: new Date().toISOString(),
      tasks: tasks,
      subjectColors: subjectColorsMap,
      theme: localStorage.getItem(THEME_KEY) || 'light'
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `studious-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Task backup exported successfully!', 'success');
  }

  function importDataFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);

        if (!imported || typeof imported !== 'object') {
          throw new Error('Invalid JSON structure');
        }

        const importedTasks = imported.tasks || (Array.isArray(imported) ? imported : null);
        if (!Array.isArray(importedTasks)) {
          throw new Error('No task array found in JSON file');
        }

        if (!confirm(`Import ${importedTasks.length} task(s)? This will replace your current tasks.`)) {
          elements.importFileInput.value = '';
          return;
        }

        tasks = importedTasks.map(migrateTaskData);
        if (imported.subjectColors && typeof imported.subjectColors === 'object') {
          subjectColorsMap = imported.subjectColors;
          saveSubjectColors();
        }

        if (imported.theme && (imported.theme === 'light' || imported.theme === 'dark')) {
          localStorage.setItem(THEME_KEY, imported.theme);
          document.documentElement.setAttribute('data-theme', imported.theme);
        }

        saveTasks();
        renderApp();
        showToast(`Successfully imported ${tasks.length} task(s)!`, 'success');
      } catch (err) {
        console.error('Import Error:', err);
        showToast('Failed to import: Invalid or corrupted JSON file', 'danger');
      } finally {
        elements.importFileInput.value = '';
      }
    };
    reader.readAsText(file);
  }

  // --- Date & Time Calculations ---
  function isDueToday(dueDateStr) {
    if (!dueDateStr) return false;
    const due = parseAppDate(dueDateStr);
    if (!due) return false;
    const now = new Date();
    return (
      due.getFullYear() === now.getFullYear() &&
      due.getMonth() === now.getMonth() &&
      due.getDate() === now.getDate()
    );
  }

  // Single shared function for overdue calculation across sidebar, lists, cards, and badges
  function isTaskOverdue(task) {
    if (!task || task.completed || !task.dueDate) return false;
    const due = parseAppDate(task.dueDate);
    return !!(due && !isNaN(due.getTime()) && due.getTime() < Date.now());
  }

  function getOverdueTasks() {
    return (Array.isArray(tasks) ? tasks : []).filter(isTaskOverdue);
  }

  // Backwards compatibility alias for components calling isOverdue(dueDateStr, isCompleted)
  function isOverdue(dueDateStr, isCompleted) {
    return isTaskOverdue({ dueDate: dueDateStr, completed: !!isCompleted });
  }

  // --- SINGLE SOURCE OF TRUTH TASK CALCULATIONS ---
  function calculateTaskStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    const todayCount = tasks.filter(t => !t.completed && isDueToday(t.dueDate)).length;

    const now = new Date();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const upcomingCount = tasks.filter(t => {
      if (t.completed || !t.dueDate) return false;
      const due = parseAppDate(t.dueDate);
      return due && due > todayEnd;
    }).length;

    const overdueCount = getOverdueTasks().length;

    return {
      total,
      completed,
      pending,
      today: todayCount,
      upcoming: upcomingCount,
      overdue: overdueCount
    };
  }

  // Calculate Real Weekly Progress
  function calculateWeeklyProgress() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const monday = new Date(now);
    monday.setDate(now.getDate() + distToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const tasksThisWeek = tasks.filter(t => {
      if (!t.dueDate) return false;
      const due = parseAppDate(t.dueDate);
      return due && due >= monday && due <= sunday;
    });

    const totalThisWeek = tasksThisWeek.length;
    const completedThisWeek = tasksThisWeek.filter(t => t.completed).length;
    const pct = totalThisWeek === 0 ? 0 : Math.round((completedThisWeek / totalThisWeek) * 100);

    return {
      percentage: pct,
      completed: completedThisWeek,
      total: totalThisWeek
    };
  }

  // Calculate Real Study Streak
  function calculateStudyStreak() {
    const completionDates = new Set();

    tasks.forEach(t => {
      if (t.completed && t.completedAt) {
        const d = parseAppDate(t.completedAt);
        if (d) {
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          completionDates.add(dateKey);
        }
      }
    });

    if (completionDates.size === 0) return 0;

    const getFormattedDate = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

    const today = new Date();
    const todayKey = getFormattedDate(today);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayKey = getFormattedDate(yesterday);

    let checkDate = new Date();
    if (!completionDates.has(todayKey) && completionDates.has(yesterdayKey)) {
      checkDate = yesterday;
    } else if (!completionDates.has(todayKey) && !completionDates.has(yesterdayKey)) {
      return 0;
    }

    let streak = 0;
    while (true) {
      const key = getFormattedDate(checkDate);
      if (completionDates.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  function applyDatePreset(presetType) {
    const d = new Date();

    if (presetType === 'today') {
      d.setHours(17, 0, 0, 0);
    } else if (presetType === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(17, 0, 0, 0);
    } else if (presetType === 'next-monday') {
      const day = d.getDay();
      const daysUntilMonday = ((8 - day) % 7) || 7;
      d.setDate(d.getDate() + daysUntilMonday);
      d.setHours(9, 0, 0, 0);
    } else if (presetType === 'next-week') {
      d.setDate(d.getDate() + 7);
      d.setHours(9, 0, 0, 0);
    }

    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    elements.taskDueDateInput.value = formatted;
    elements.dateError.parentElement.classList.remove('error');
  }

  // --- Filtering & Sorting Core ---
  function getFilteredTasks() {
    return tasks.filter(task => {
      // Date Filter from Calendar click
      if (calendarFilterDate) {
        if (!task.dueDate) return false;
        const due = parseAppDate(task.dueDate);
        if (!due) return false;
        if (due.getFullYear() !== calendarFilterDate.getFullYear() ||
            due.getMonth() !== calendarFilterDate.getMonth() ||
            due.getDate() !== calendarFilterDate.getDate()) {
          return false;
        }
      }

      // View Navigation Filter
      if (activeView === 'today' && (task.completed || !isDueToday(task.dueDate))) return false;
      if (activeView === 'upcoming') {
        const due = parseAppDate(task.dueDate);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        if (task.completed || !due || due <= todayEnd) return false;
      }
      if (activeView === 'overdue' && !isTaskOverdue(task)) return false;
      if (activeView === 'completed' && !task.completed) return false;

      // Priority Filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      // Task Type Filter
      if (typeFilter !== 'all' && (task.type || 'Other') !== typeFilter) return false;

      // Subject Filter
      if (subjectFilter !== 'all' && task.subject !== subjectFilter) return false;

      // Search Query Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesSubject = (task.subject || '').toLowerCase().includes(q);
        const matchesType = (task.type || '').toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const matchesSubtasks = (task.subtasks || []).some(st => (st.text || '').toLowerCase().includes(q));
        if (!matchesTitle && !matchesSubject && !matchesType && !matchesDesc && !matchesSubtasks) return false;
      }

      return true;
    }).sort((a, b) => {
      // Priority Highest
      if (sortBy === 'priorityDesc') {
        const pA = PRIORITY_ORDER[a.priority] || 0;
        const pB = PRIORITY_ORDER[b.priority] || 0;
        if (pB !== pA) return pB - pA;
      }
      // Due Date Earliest
      if (sortBy === 'dueDateAsc') {
        const dA = parseAppDate(a.dueDate);
        const dB = parseAppDate(b.dueDate);
        if (dA && dB) return dA - dB;
        if (dA) return -1;
        if (dB) return 1;
      }
      // Due Date Latest
      if (sortBy === 'dueDateDesc') {
        const dA = parseAppDate(a.dueDate);
        const dB = parseAppDate(b.dueDate);
        if (dA && dB) return dB - dA;
        if (dA) return 1;
        if (dB) return -1;
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
    renderTodaysPlan();
    renderTaskList();
    renderCalendar();
  }

  function renderStatsAndBadges() {
    const stats = calculateTaskStats();

    if (elements.statTotal) elements.statTotal.textContent = stats.total;
    if (elements.statPending) elements.statPending.textContent = stats.pending;
    if (elements.statCompleted) elements.statCompleted.textContent = stats.completed;
    if (elements.statOverdue) elements.statOverdue.textContent = stats.overdue;

    const statUpcomingKpi = document.getElementById('statUpcomingKpi');
    if (statUpcomingKpi) statUpcomingKpi.textContent = stats.upcoming;

    if (elements.badgeAll) elements.badgeAll.textContent = stats.total;
    if (elements.badgeToday) elements.badgeToday.textContent = stats.today;
    if (elements.badgeUpcoming) elements.badgeUpcoming.textContent = stats.upcoming;
    if (elements.badgeOverdue) elements.badgeOverdue.textContent = stats.overdue;
    if (elements.badgeCompleted) elements.badgeCompleted.textContent = stats.completed;

    // Update Overall Progress Ring & Text
    const percentage = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);
    if (elements.progressPercentage) elements.progressPercentage.textContent = `${percentage}%`;
    if (elements.progressRing) {
      const circumference = 251.2;
      const offset = circumference - (percentage / 100) * circumference;
      elements.progressRing.style.strokeDashoffset = offset;
    }

    // Weekly Progress Widget
    const weekly = calculateWeeklyProgress();
    const weeklyPctEl = document.getElementById('weeklyProgressPercentage');
    const weeklyGoalTagEl = document.getElementById('weeklyProgressGoalTag');
    const weeklyBarFillEl = document.getElementById('weeklyProgressBarFill');

    if (weeklyPctEl) weeklyPctEl.textContent = `${weekly.percentage}%`;
    if (weeklyGoalTagEl) weeklyGoalTagEl.textContent = `${weekly.completed} / ${weekly.total} tasks completed this week`;
    if (weeklyBarFillEl) weeklyBarFillEl.style.width = `${weekly.percentage}%`;

    // Study Streak Widget
    const streak = calculateStudyStreak();
    const streakDaysEl = document.getElementById('studyStreakDays');
    const streakCaptionEl = document.getElementById('streakCaption');
    const streakRingFillEl = document.getElementById('streakRingFill');

    if (streakDaysEl) streakDaysEl.textContent = streak;
    if (streakCaptionEl) {
      if (streak === 0) streakCaptionEl.textContent = 'Complete daily tasks to build your streak!';
      else if (streak === 1) streakCaptionEl.textContent = 'Awesome! 1-day study streak started 🔥';
      else streakCaptionEl.textContent = `Great job! ${streak}-day study streak 🔥`;
    }
    if (streakRingFillEl) {
      const circumference = 276;
      const streakPct = Math.min(streak / 7, 1);
      const offset = circumference - (streakPct * circumference);
      streakRingFillEl.style.strokeDashoffset = offset;
    }

    renderNotificationsPanel();
  }

  function renderNotificationsPanel() {
    const notifListEl = document.getElementById('notificationsList');
    const badgeEl = document.getElementById('notificationBadgeCount');
    const panelCountEl = document.getElementById('notificationsPanelCount');

    updateNotificationPermissionUi();
    updateSoundUi();
    updateDeadlineAlertUi();

    if (!notifListEl) return;

    const activeReminders = tasks.filter(t => !t.completed && t.reminder && t.reminder !== 'none' && !t.reminderFired);

    if (badgeEl) {
      if (activeReminders.length > 0) {
        badgeEl.textContent = activeReminders.length;
        badgeEl.style.display = 'inline-block';
      } else {
        badgeEl.style.display = 'none';
      }
    }

    if (panelCountEl) {
      panelCountEl.textContent = `${activeReminders.length} active`;
    }

    if (activeReminders.length === 0) {
      notifListEl.innerHTML = `<div class="notifications-empty"><i class="fa-regular fa-bell-slash"></i> No pending reminders</div>`;
    } else {
      notifListEl.innerHTML = activeReminders.map(t => {
        const remTime = calculateReminderTime(t);
        const timeStr = remTime ? remTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        return `
          <div class="notification-item" data-notif-task-id="${t.id}" title="Click to view task in dashboard">
            <span class="notif-title">${escapeHtml(t.title)}</span>
            <span class="notif-time">⏰ ${t.reminder} ${timeStr ? '(' + timeStr + ')' : ''}</span>
          </div>
        `;
      }).join('');
    }
  }

  function renderTodaysPlan() {
    const todaysPendingTasks = tasks.filter(t => !t.completed && isDueToday(t.dueDate))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const totalMins = todaysPendingTasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0);
    elements.todaysPlanBadge.textContent = `${todaysPendingTasks.length} task(s) scheduled for today`;
    elements.todaysPlanSummary.textContent = `Total Study Time: ${formatEstTime(totalMins) || '0m'}`;

    if (todaysPendingTasks.length === 0) {
      elements.todaysPlanList.innerHTML = `
        <div class="todays-plan-empty">
          <i class="fa-regular fa-calendar-check"></i>
          <span>No study tasks scheduled for today. Great time to catch up or plan ahead!</span>
        </div>
      `;
      return;
    }

    elements.todaysPlanList.innerHTML = todaysPendingTasks.map(t => {
      const style = getSubjectStyle(t.subject);
      const estStr = formatEstTime(t.estimatedTime);
      const dueTime = t.dueDate ? new Date(t.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      return `
        <div class="todays-plan-item">
          <div class="todays-plan-item-left">
            <input type="checkbox" class="task-checkbox" data-task-id="${t.id}" title="Mark completed">
            <span class="todays-plan-item-title">${escapeHtml(t.title)}</span>
            ${t.subject ? `<span class="subject-tag" style="--subject-bg: ${style.bg}; --subject-color: ${style.text}; --subject-border: ${style.border};"><span class="subject-color-dot"></span>${escapeHtml(t.subject)}</span>` : ''}
          </div>
          <div class="todays-plan-item-right">
            <span class="priority-badge priority-${t.priority}">🚩 ${t.priority}</span>
            ${estStr ? `<span class="est-time-tag"><i class="fa-regular fa-hourglass-half"></i> ${estStr}</span>` : ''}
            <span class="due-date-indicator today"><i class="fa-regular fa-clock"></i> ${dueTime}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderSubjectFilterOptions() {
    const subjects = Array.from(new Set(tasks.map(t => t.subject).filter(Boolean)));

    if (subjectFilter !== 'all' && !subjects.includes(subjectFilter)) {
      subjectFilter = 'all';
    }

    elements.subjectFilter.innerHTML = '<option value="all">📚 All Subjects</option>';
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
    if (typeFilter !== 'all') {
      activeTags.push({ type: 'type', label: `Type: ${typeFilter}` });
    }
    if (subjectFilter !== 'all') {
      activeTags.push({ type: 'subject', label: `Subject: ${subjectFilter}` });
    }
    if (calendarFilterDate) {
      const dStr = calendarFilterDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      activeTags.push({ type: 'calendar', label: `Date: ${dStr}` });
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
    if (elements.visibleTaskCount) elements.visibleTaskCount.textContent = filtered.length;

    if (filtered.length === 0) {
      elements.taskListContainer.style.display = 'none';
      elements.emptyState.style.display = 'flex';
      updateEmptyStateText();
      return;
    }

    elements.emptyState.style.display = 'none';
    elements.taskListContainer.style.display = 'grid';
    elements.taskListContainer.className = `task-grid ${viewMode === 'list' ? 'list-view' : ''}`;

    elements.taskListContainer.innerHTML = filtered.map(t => createTaskCardHtml(t)).join('');
  }

  function updateEmptyStateText() {
    if (tasks.length === 0) {
      elements.emptyStateTitle.textContent = 'Welcome to Studious! 👋';
      elements.emptyStateDesc.textContent = 'Your task hub is empty. Add your coursework assignments, exams, and study checklists to stay organized!';
      elements.emptyStateAddBtn.style.display = 'inline-flex';
    } else {
      elements.emptyStateTitle.textContent = 'No matching tasks found';
      elements.emptyStateDesc.textContent = 'Try adjusting your search query, filters, or date selection.';
      elements.emptyStateAddBtn.style.display = 'none';
    }
  }

  function createTaskCardHtml(task) {
    const style = getSubjectStyle(task.subject);
    const typeIcon = TASK_TYPE_ICONS[task.type] || TASK_TYPE_ICONS.Other;
    const estStr = formatEstTime(task.estimatedTime);

    let dueHtml = '';
    if (task.dueDate) {
      const isToday = isDueToday(task.dueDate);
      const isPast = isTaskOverdue(task);
      const dueObj = new Date(task.dueDate);
      const dateFormatted = dueObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const timeFormatted = dueObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let stateClass = '';
      let label = `${dateFormatted}, ${timeFormatted}`;
      if (isPast) {
        stateClass = 'overdue';
        label = `Overdue: ${dateFormatted}, ${timeFormatted}`;
      } else if (isToday) {
        stateClass = 'today';
        label = `Today, ${timeFormatted}`;
      }

      dueHtml = `<span class="due-date-indicator ${stateClass}"><i class="fa-regular fa-clock"></i> ${label}</span>`;
    } else {
      dueHtml = `<span class="due-date-indicator"><i class="fa-regular fa-calendar"></i> No due date</span>`;
    }

    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter(s => s.completed).length;
    let subtaskHtml = '';

    if (subtasks.length > 0) {
      subtaskHtml = `
        <div class="subtasks-container">
          <div class="subtasks-header-toggle" data-toggle-subtasks="${task.id}">
            <span><i class="fa-solid fa-list-check"></i> Subtasks (${completedSubtasks}/${subtasks.length})</span>
            <i class="fa-solid fa-chevron-down"></i>
          </div>
          <div class="subtasks-list" id="subtasks-list-${task.id}">
            ${subtasks.map(st => `
              <div class="subtask-item">
                <input type="checkbox" class="subtask-checkbox" data-task-id="${task.id}" data-subtask-id="${st.id}" ${st.completed ? 'checked' : ''}>
                <span class="${st.completed ? 'done' : ''}">${escapeHtml(st.text)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-card-header">
          <div class="task-checkbox-wrapper">
            <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${task.completed ? 'checked' : ''} title="Mark task completed">
          </div>
          <div class="task-title-area">
            <h4 class="task-title">${escapeHtml(task.title)}</h4>
            <div class="task-meta-row">
              <span class="type-badge">${typeIcon} ${escapeHtml(task.type || 'Other')}</span>
              <span class="priority-badge priority-${task.priority}">🚩 ${task.priority}</span>
              ${task.subject ? `<span class="subject-tag" style="--subject-bg: ${style.bg}; --subject-color: ${style.text}; --subject-border: ${style.border};"><span class="subject-color-dot"></span>${escapeHtml(task.subject)}</span>` : ''}
              ${estStr ? `<span class="est-time-tag"><i class="fa-regular fa-hourglass-half"></i> ${estStr}</span>` : ''}
              ${task.reminder && task.reminder !== 'none' ? `<span class="reminder-tag" title="In-App Reminder"><i class="fa-regular fa-bell"></i> ${task.reminder}</span>` : ''}
            </div>
          </div>
        </div>

        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
        ${subtaskHtml}

        <div class="task-card-footer">
          ${dueHtml}
          <div class="task-actions">
            <button class="action-btn edit-btn" data-edit-id="${task.id}" title="Edit Task"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="action-btn delete-btn" data-delete-id="${task.id}" title="Delete Task"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      </div>
    `;
  }

  // --- Real Dynamic Calendar Engine ---
  function renderCalendar() {
    const monthLabelEl = document.getElementById('calendarMonthLabel');
    const gridEl = document.getElementById('calendarGridContainer');
    if (!gridEl) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    if (monthLabelEl) monthLabelEl.textContent = `${monthNames[month]} ${year}`;

    // Collect dates with incomplete tasks
    const taskDateSet = new Set();
    tasks.forEach(t => {
      if (!t.completed && t.dueDate) {
        const d = parseAppDate(t.dueDate);
        if (d) {
          taskDateSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        }
      }
    });

    const firstDayOfMonth = new Date(year, month, 1);
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6; // Monday-first

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const now = new Date();
    const isCurrentMonthYear = (now.getFullYear() === year && now.getMonth() === month);
    const todayDateNum = now.getDate();

    let html = `
      <div class="cal-day-head">MON</div>
      <div class="cal-day-head">TUE</div>
      <div class="cal-day-head">WED</div>
      <div class="cal-day-head">THU</div>
      <div class="cal-day-head">FRI</div>
      <div class="cal-day-head">SAT</div>
      <div class="cal-day-head">SUN</div>
    `;

    for (let i = startDay - 1; i >= 0; i--) {
      html += `<div class="cal-date muted">${daysInPrevMonth - i}</div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month}-${day}`;
      const isToday = isCurrentMonthYear && (day === todayDateNum);
      const hasTasks = taskDateSet.has(dateKey);

      let classes = 'cal-date';
      if (isToday) classes += ' today-date';
      if (hasTasks) classes += ' has-tasks';
      if (calendarFilterDate && calendarFilterDate.getFullYear() === year && calendarFilterDate.getMonth() === month && calendarFilterDate.getDate() === day) {
        classes += ' active-date';
      }

      html += `<div class="${classes}" data-cal-day="${day}">${day}</div>`;
    }

    const totalCells = startDay + daysInMonth;
    const remainingCells = (totalCells > 35 ? 42 : 35) - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      html += `<div class="cal-date muted">${day}</div>`;
    }

    gridEl.innerHTML = html;
  }

  // --- Task CRUD Operations ---
  function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      if (task.completed) {
        task.completedAt = new Date().toISOString();
      } else {
        task.completedAt = null;
      }
      saveTasks();
      renderApp();
      showToast(task.completed ? 'Task completed! 🎉' : 'Task marked active', task.completed ? 'success' : 'info');
    }
  }

  function toggleSubtaskCompletion(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const subtask = task.subtasks.find(st => st.id === subtaskId);
      if (subtask) {
        subtask.completed = !subtask.completed;
        saveTasks();
        renderApp();
      }
    }
  }

  function deleteTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task && confirm(`Delete "${task.title}"?`)) {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderApp();
      showToast('Task deleted', 'info');
    }
  }

  function openModal(editId = null) {
    elements.taskForm.reset();
    currentModalSubtasks = [];
    elements.modalSubtaskList.innerHTML = '';
    elements.titleError.parentElement.classList.remove('error');
    elements.dateError.parentElement.classList.remove('error');

    if (elements.taskEstTimeCustomInput) elements.taskEstTimeCustomInput.style.display = 'none';
    if (elements.taskReminderCustomInput) elements.taskReminderCustomInput.style.display = 'none';

    if (editId) {
      const task = tasks.find(t => t.id === editId);
      if (task) {
        elements.modalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Task';
        elements.taskIdInput.value = task.id;
        elements.taskTitleInput.value = task.title;
        elements.taskSubjectInput.value = task.subject || '';
        elements.taskTypeInput.value = task.type || 'Other';
        elements.taskPriorityInput.value = task.priority || 'medium';
        elements.taskDueDateInput.value = task.dueDate || '';
        elements.taskDescInput.value = task.description || '';

        const estVal = task.estimatedTime || 0;
        const estOptions = Array.from(elements.taskEstTimeSelect.options).map(o => parseInt(o.value, 10));
        if (estOptions.includes(estVal)) {
          elements.taskEstTimeSelect.value = String(estVal);
        } else if (estVal > 0) {
          elements.taskEstTimeSelect.value = 'custom';
          elements.taskEstTimeCustomInput.style.display = 'block';
          elements.taskEstTimeCustomInput.value = estVal;
        } else {
          elements.taskEstTimeSelect.value = '0';
        }

        const remVal = task.reminder || 'none';
        if (remVal === 'custom') {
          elements.taskReminderSelect.value = 'custom';
          elements.taskReminderCustomInput.style.display = 'block';
          elements.taskReminderCustomInput.value = task.reminderCustomDate || '';
        } else {
          elements.taskReminderSelect.value = remVal;
        }

        currentModalSubtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
        renderModalSubtasks();
      }
    } else {
      elements.modalTitle.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Create New Task';
      elements.taskIdInput.value = '';
      elements.taskTypeInput.value = 'Other';
      elements.taskPriorityInput.value = 'medium';
      elements.taskEstTimeSelect.value = '0';
      elements.taskReminderSelect.value = 'none';
    }

    elements.taskModalBackdrop.classList.add('active');
    elements.taskTitleInput.focus();
  }

  function closeModal() {
    elements.taskModalBackdrop.classList.remove('active');
  }

  function renderModalSubtasks() {
    elements.modalSubtaskList.innerHTML = currentModalSubtasks.map((st, index) => `
      <li class="modal-subtask-item">
        <span>${escapeHtml(st.text)}</span>
        <button type="button" class="btn-text-only" data-remove-modal-subtask="${index}" aria-label="Remove subtask">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </li>
    `).join('');
  }

  function handleTaskFormSubmit(e) {
    e.preventDefault();

    const title = elements.taskTitleInput.value.trim();
    const dueDate = elements.taskDueDateInput.value;
    const priority = elements.taskPriorityInput.value;
    const type = elements.taskTypeInput.value;
    const subject = elements.taskSubjectInput.value.trim();
    const description = elements.taskDescInput.value.trim();

    let isValid = true;
    if (!title) {
      elements.titleError.parentElement.classList.add('error');
      isValid = false;
    } else {
      elements.titleError.parentElement.classList.remove('error');
    }

    if (!dueDate) {
      elements.dateError.parentElement.classList.add('error');
      isValid = false;
    } else {
      elements.dateError.parentElement.classList.remove('error');
    }

    if (!isValid) return;

    let estimatedTime = 0;
    const estSel = elements.taskEstTimeSelect.value;
    if (estSel === 'custom') {
      estimatedTime = parseInt(elements.taskEstTimeCustomInput.value, 10) || 0;
    } else {
      estimatedTime = parseInt(estSel, 10) || 0;
    }

    let reminder = elements.taskReminderSelect.value;
    let reminderCustomDate = '';
    if (reminder === 'custom') {
      reminderCustomDate = elements.taskReminderCustomInput.value;
    }

    const id = elements.taskIdInput.value;
    const taskData = {
      title,
      subject,
      type,
      priority,
      dueDate,
      estimatedTime,
      reminder,
      reminderCustomDate,
      description,
      subtasks: currentModalSubtasks
    };

    if (id) {
      const existing = tasks.find(t => t.id === id);
      if (existing) {
        if (existing.dueDate !== dueDate) {
          taskData.deadlineAlertFired = false;
        }
        if (existing.reminder !== reminder || existing.dueDate !== dueDate || existing.reminderCustomDate !== reminderCustomDate) {
          taskData.reminderFired = false;
        }
        Object.assign(existing, taskData);
        showToast('Task updated successfully!', 'success');
      }
    } else {
      const newTask = {
        id: 'task-' + Date.now(),
        ...taskData,
        reminderFired: false,
        deadlineAlertFired: false,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString()
      };
      tasks.unshift(newTask);
      showToast('New task created!', 'success');
    }

    saveTasks();
    closeModal();
    renderApp();
    checkInAppReminders();
  }

  // --- Sidebar Collapse & Drawer Handler ---
  function toggleSidebar() {
    if (window.innerWidth <= 992) {
      elements.sidebar.classList.toggle('open');
      elements.sidebarOverlay.classList.toggle('active');
    } else {
      elements.sidebar.classList.toggle('collapsed');
      if (elements.dashboardBody) {
        elements.dashboardBody.classList.toggle('sidebar-collapsed');
      }
    }
  }

  function closeSidebar() {
    elements.sidebar.classList.remove('open');
    elements.sidebarOverlay.classList.remove('active');
  }

  // ==========================================================================
  // --- Smart Study Focus Mode (Phase 2 Unique Feature) ---
  // ==========================================================================
  function getLocalDateKey(dateObj = new Date()) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getFocusHistory() {
    try {
      const data = localStorage.getItem(FOCUS_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse focus history:', e);
      return [];
    }
  }

  function saveFocusHistory(history) {
    try {
      localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save focus history:', e);
    }
  }

  function getTodayFocusStats() {
    const history = getFocusHistory();
    const todayKey = getLocalDateKey();
    const todaySessions = history.filter(s => s.date === todayKey);
    const totalMinutes = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    return {
      count: todaySessions.length,
      minutes: totalMinutes
    };
  }

  function renderFocusStats() {
    const stats = getTodayFocusStats();
    const countEl = document.getElementById('focusTodaySessionsCount');
    const minsEl = document.getElementById('focusTodayMinutesCount');
    if (countEl) countEl.textContent = stats.count;
    if (minsEl) minsEl.textContent = stats.minutes;
  }

  function updateFocusTimerDisplay(seconds) {
    const displayEl = document.getElementById('focusTimerDisplay');
    if (!displayEl) return;
    const clamped = Math.max(0, Math.floor(seconds));
    const m = Math.floor(clamped / 60);
    const s = clamped % 60;
    displayEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function setFocusOrbState(state, badgeText) {
    const orb = document.getElementById('focusOrb');
    const badge = document.getElementById('focusStateBadge');
    if (orb) {
      orb.className = `focus-orb state-${state}`;
    }
    if (badge && badgeText) {
      badge.textContent = badgeText;
    }
  }

  function setFocusControls(mode) {
    const startBtn = document.getElementById('startFocusBtn');
    const pauseBtn = document.getElementById('pauseFocusBtn');
    const resumeBtn = document.getElementById('resumeFocusBtn');
    const cancelBtn = document.getElementById('cancelFocusBtn');
    const resetBtn = document.getElementById('resetFocusBtn');
    const taskSelect = document.getElementById('focusTaskSelect');
    const presetChips = document.getElementById('focusPresetChips');
    const customWrap = document.getElementById('focusCustomDurationWrap');

    if (startBtn) startBtn.style.display = (mode === 'ready') ? 'inline-flex' : 'none';
    if (pauseBtn) pauseBtn.style.display = (mode === 'running') ? 'inline-flex' : 'none';
    if (resumeBtn) resumeBtn.style.display = (mode === 'paused') ? 'inline-flex' : 'none';
    if (cancelBtn) cancelBtn.style.display = (mode === 'running' || mode === 'paused') ? 'inline-flex' : 'none';
    if (resetBtn) resetBtn.style.display = (mode === 'completed') ? 'inline-flex' : 'none';

    const isLocked = (mode === 'running' || mode === 'paused');
    if (taskSelect) taskSelect.disabled = isLocked;
    if (presetChips) {
      presetChips.querySelectorAll('.preset-chip').forEach(chip => {
        chip.style.pointerEvents = isLocked ? 'none' : 'auto';
        chip.style.opacity = isLocked ? '0.6' : '1';
      });
    }
    if (customWrap) {
      const inp = customWrap.querySelector('input');
      if (inp) inp.disabled = isLocked;
    }
  }

  function populateFocusTaskSelect() {
    const select = document.getElementById('focusTaskSelect');
    if (!select) return;

    const currentVal = (activeFocusSession && activeFocusSession.taskId) ? activeFocusSession.taskId : select.value;
    const pendingTasks = tasks.filter(t => !t.completed);

    let html = `<option value="">🎯 Free Focus (General Study)</option>`;
    if (pendingTasks.length > 0) {
      html += `<optgroup label="Coursework Tasks">`;
      pendingTasks.forEach(t => {
        const icon = TASK_TYPE_ICONS[t.type] || '📌';
        const subj = t.subject ? `[${escapeHtml(t.subject)}] ` : '';
        html += `<option value="${t.id}">${icon} ${subj}${escapeHtml(t.title)}</option>`;
      });
      html += `</optgroup>`;
    }
    select.innerHTML = html;
    if (currentVal) {
      select.value = currentVal;
    }
    updateFocusTaskPreview();
  }

  function updateFocusTaskPreview() {
    const select = document.getElementById('focusTaskSelect');
    const preview = document.getElementById('focusTaskPreview');
    if (!preview) return;

    if (activeFocusSession && activeFocusSession.taskTitle) {
      preview.textContent = activeFocusSession.taskTitle;
      return;
    }

    if (!select || !select.value) {
      preview.textContent = 'General Study';
    } else {
      const task = tasks.find(t => t.id === select.value);
      preview.textContent = task ? task.title : 'General Study';
    }
  }

  function updateFocusBadge(isActive) {
    const badge = document.getElementById('focusModeBadge');
    if (badge) {
      badge.style.display = isActive ? 'inline-block' : 'none';
    }
  }

  function openFocusModal() {
    populateFocusTaskSelect();
    renderFocusStats();

    if (activeFocusSession && (activeFocusSession.isRunning || activeFocusSession.isPaused)) {
      updateFocusTaskPreview();
      updateFocusTimerDisplay(activeFocusSession.remainingSeconds);
      if (activeFocusSession.isRunning) {
        setFocusOrbState('focusing', 'Focusing');
        setFocusControls('running');
      } else {
        setFocusOrbState('paused', 'Paused');
        setFocusControls('paused');
      }
    } else if (activeFocusSession && activeFocusSession.isCompleted) {
      updateFocusTaskPreview();
      updateFocusTimerDisplay(0);
      setFocusOrbState('completed', 'Done! 🎉');
      setFocusControls('completed');
    } else {
      updateFocusTimerDisplay(selectedFocusDurationMinutes * 60);
      setFocusOrbState('ready', 'Ready');
      setFocusControls('ready');
      updateFocusTaskPreview();
    }

    const backdrop = document.getElementById('focusModalBackdrop');
    if (backdrop) backdrop.classList.add('active');
  }

  function closeFocusModal() {
    const backdrop = document.getElementById('focusModalBackdrop');
    if (backdrop) backdrop.classList.remove('active');
  }

  function startFocusSession() {
    let durationMins = selectedFocusDurationMinutes;
    if (isNaN(durationMins) || durationMins <= 0) durationMins = 25;

    const select = document.getElementById('focusTaskSelect');
    const taskId = select && select.value ? select.value : null;
    let taskTitle = 'General Study';
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) taskTitle = task.title;
    }

    const totalSeconds = durationMins * 60;
    const now = Date.now();
    const endTime = now + totalSeconds * 1000;

    activeFocusSession = {
      taskId: taskId,
      taskTitle: taskTitle,
      totalSeconds: totalSeconds,
      durationMinutes: durationMins,
      startTime: now,
      endTime: endTime,
      remainingSeconds: totalSeconds,
      isRunning: true,
      isPaused: false,
      sessionRecorded: false
    };

    saveActiveFocusSession();
    startFocusTicker();

    setFocusOrbState('focusing', 'Focusing');
    setFocusControls('running');
    updateFocusTimerDisplay(totalSeconds);
    updateFocusTaskPreview();
    updateFocusBadge(true);

    showToast(`Smart Study Focus started (${durationMins}m). Stay in the zone! 🚀`, 'info');
  }

  function pauseFocusSession() {
    if (!activeFocusSession || !activeFocusSession.isRunning) return;

    stopFocusTicker();

    const now = Date.now();
    const remaining = Math.max(0, Math.round((activeFocusSession.endTime - now) / 1000));
    activeFocusSession.remainingSeconds = remaining;
    activeFocusSession.isRunning = false;
    activeFocusSession.isPaused = true;

    saveActiveFocusSession();

    setFocusOrbState('paused', 'Paused');
    setFocusControls('paused');
    updateFocusTimerDisplay(remaining);

    showToast('Focus session paused. Take a breath! ⏸️', 'info');
  }

  function resumeFocusSession() {
    if (!activeFocusSession || !activeFocusSession.isPaused) return;

    const now = Date.now();
    activeFocusSession.endTime = now + activeFocusSession.remainingSeconds * 1000;
    activeFocusSession.isRunning = true;
    activeFocusSession.isPaused = false;

    saveActiveFocusSession();
    startFocusTicker();

    setFocusOrbState('focusing', 'Focusing');
    setFocusControls('running');

    showToast('Focus session resumed. Back to work! 🎯', 'info');
  }

  function cancelFocusSession() {
    if (!confirm('Cancel current focus session? Unfinished time will not be recorded.')) return;

    stopFocusTicker();
    activeFocusSession = null;
    localStorage.removeItem(FOCUS_ACTIVE_KEY);

    updateFocusBadge(false);
    updateFocusTimerDisplay(selectedFocusDurationMinutes * 60);
    setFocusOrbState('ready', 'Ready');
    setFocusControls('ready');
    updateFocusTaskPreview();

    showToast('Focus session cancelled', 'info');
  }

  function resetFocusState() {
    activeFocusSession = null;
    localStorage.removeItem(FOCUS_ACTIVE_KEY);

    updateFocusBadge(false);
    updateFocusTimerDisplay(selectedFocusDurationMinutes * 60);
    setFocusOrbState('ready', 'Ready');
    setFocusControls('ready');
    updateFocusTaskPreview();
  }

  function completeFocusSession() {
    stopFocusTicker();

    if (activeFocusSession && !activeFocusSession.sessionRecorded) {
      activeFocusSession.sessionRecorded = true;
      activeFocusSession.isRunning = false;
      activeFocusSession.isPaused = false;
      activeFocusSession.isCompleted = true;
      activeFocusSession.remainingSeconds = 0;

      const durationMins = activeFocusSession.durationMinutes || Math.round(activeFocusSession.totalSeconds / 60);
      const history = getFocusHistory();
      history.push({
        id: 'fs-' + Date.now(),
        date: getLocalDateKey(),
        durationMinutes: durationMins,
        taskId: activeFocusSession.taskId,
        taskTitle: activeFocusSession.taskTitle || 'General Study',
        completedAt: new Date().toISOString()
      });
      saveFocusHistory(history);

      // CRITICAL REQUIREMENT 12: Never automatically mark the selected task as completed
      // The task remains completely intact and active in the user's dashboard.

      setFocusOrbState('completed', 'Done! 🎉');
      setFocusControls('completed');
      updateFocusTimerDisplay(0);
      updateFocusBadge(false);
      renderFocusStats();

      localStorage.removeItem(FOCUS_ACTIVE_KEY);

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const focusNotif = new Notification('Focus Session Complete! 🎯', {
            body: `Great job! You finished your ${durationMins}-minute study focus session.`,
            tag: 'studious-focus-complete'
          });
          focusNotif.onclick = function () {
            try { window.focus(); } catch (e) {}
            focusNotif.close();
          };
        } catch (e) {
          console.warn('Focus notification dispatch error:', e);
        }
      }

      showToast(`🎉 Focus session complete! Outstanding work staying focused for ${durationMins} minutes. (Your linked task remains active).`, 'success');
    }
  }

  function updateFocusTick() {
    if (!activeFocusSession || !activeFocusSession.isRunning) return;

    const now = Date.now();
    const remaining = Math.max(0, Math.round((activeFocusSession.endTime - now) / 1000));
    activeFocusSession.remainingSeconds = remaining;

    updateFocusTimerDisplay(remaining);

    if (remaining % 5 === 0) {
      saveActiveFocusSession();
    }

    if (remaining <= 0) {
      completeFocusSession();
    }
  }

  function startFocusTicker() {
    stopFocusTicker();
    focusTicker = setInterval(updateFocusTick, 500);
  }

  function stopFocusTicker() {
    if (focusTicker) {
      clearInterval(focusTicker);
      focusTicker = null;
    }
  }

  function saveActiveFocusSession() {
    if (activeFocusSession) {
      try {
        localStorage.setItem(FOCUS_ACTIVE_KEY, JSON.stringify(activeFocusSession));
      } catch (e) {
        console.error('Failed to save active focus session:', e);
      }
    } else {
      localStorage.removeItem(FOCUS_ACTIVE_KEY);
    }
  }

  function initFocusMode() {
    try {
      const saved = localStorage.getItem(FOCUS_ACTIVE_KEY);
      if (saved) {
        activeFocusSession = JSON.parse(saved);
        if (activeFocusSession && activeFocusSession.isRunning) {
          const now = Date.now();
          if (now >= activeFocusSession.endTime) {
            completeFocusSession();
          } else {
            activeFocusSession.remainingSeconds = Math.max(0, Math.round((activeFocusSession.endTime - now) / 1000));
            startFocusTicker();
            updateFocusBadge(true);
          }
        } else if (activeFocusSession && activeFocusSession.isPaused) {
          updateFocusBadge(true);
        }
      }
    } catch (e) {
      console.error('Failed to restore active focus session:', e);
      activeFocusSession = null;
    }
    renderFocusStats();
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Sidebar Hamburger Button
    if (elements.openSidebarBtn) elements.openSidebarBtn.addEventListener('click', toggleSidebar);
    if (elements.closeSidebarBtn) elements.closeSidebarBtn.addEventListener('click', closeSidebar);
    if (elements.sidebarOverlay) elements.sidebarOverlay.addEventListener('click', closeSidebar);

    // Escape Key Handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSidebar();
        closeModal();
        closeFocusModal();
        const notifPanel = document.getElementById('notificationsPanel');
        if (notifPanel) notifPanel.style.display = 'none';
      }
    });

    // Theme Toggle
    if (elements.themeToggleBtn) elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Notifications Button
    if (elements.notificationsBtn) {
      elements.notificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const panel = document.getElementById('notificationsPanel');
        if (panel) {
          const isVisible = panel.style.display === 'flex';
          panel.style.display = isVisible ? 'none' : 'flex';
          renderNotificationsPanel();
        }
      });
    }

    // Notification Permission Request Button
    if (elements.requestNotifPermissionBtn) {
      elements.requestNotifPermissionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        requestNotificationPermission();
      });
    }

    // Notification Test Alert Button
    if (elements.testNotifBtn) {
      elements.testNotifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sendTestNotification();
      });
    }

    // Notification Item Click Handler (Highlight task & close panel)
    if (elements.notificationsPanel) {
      elements.notificationsPanel.addEventListener('click', (e) => {
        const item = e.target.closest('[data-notif-task-id]');
        if (item) {
          const taskId = item.dataset.notifTaskId;
          highlightTask(taskId);
          elements.notificationsPanel.style.display = 'none';
        }
      });
    }

    document.addEventListener('click', (e) => {
      const panel = document.getElementById('notificationsPanel');
      const btn = document.getElementById('notificationsBtn');
      if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
        panel.style.display = 'none';
      }
    });

    // Backup Triggers
    if (elements.exportDataBtn) elements.exportDataBtn.addEventListener('click', exportData);
    if (elements.importDataTriggerBtn) {
      elements.importDataTriggerBtn.addEventListener('click', () => {
        elements.importFileInput.click();
      });
    }
    if (elements.importFileInput) {
      elements.importFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          importDataFile(e.target.files[0]);
        }
      });
    }

    if (elements.resetDemoBtn) elements.resetDemoBtn.addEventListener('click', resetDemoData);
    if (elements.clearAllTasksBtn) elements.clearAllTasksBtn.addEventListener('click', clearAllTasks);

    // Navigation Views
    elements.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeView = btn.dataset.filterView;
        calendarFilterDate = null;

        const viewTitles = {
          all: ['Dashboard', 'Manage your coursework, assignments, and study schedules'],
          today: ['Due Today', 'Tasks requiring your focus today'],
          upcoming: ['Upcoming Tasks', 'Assignments and exams scheduled for the future'],
          overdue: ['Overdue Tasks', 'Urgent items requiring immediate attention'],
          completed: ['Completed Tasks', 'Archive of your finished coursework']
        };

        const [title, subtitle] = viewTitles[activeView] || ['Dashboard', ''];
        if (elements.viewTitle) elements.viewTitle.textContent = title;
        if (elements.viewSubtitle) elements.viewSubtitle.textContent = subtitle;
        if (elements.sectionHeaderTitle) elements.sectionHeaderTitle.textContent = title;

        renderStatsAndBadges();
        renderTaskList();
        renderCalendar();
        if (window.innerWidth <= 992) closeSidebar();
      });
    });

    // Smart Tools Buttons Handler
    const smartToolsButtons = document.querySelectorAll('[data-tool]');
    smartToolsButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool === 'focus') {
          openFocusModal();
        } else if (tool === 'today-plan') {
          const planEl = document.getElementById('todaysPlanCard');
          if (planEl) planEl.scrollIntoView({ behavior: 'smooth' });
        } else if (tool === 'planner') {
          const navUpcoming = document.querySelector('[data-filter-view="upcoming"]');
          if (navUpcoming) navUpcoming.click();
        } else if (tool === 'revision') {
          typeFilter = 'Reading';
          if (elements.typeFilter) elements.typeFilter.value = 'Reading';
          renderTaskList();
          showToast('Showing Reading & Revision coursework', 'info');
        } else if (tool === 'stats') {
          const kpiEl = document.getElementById('kpiMetricsRow');
          if (kpiEl) kpiEl.scrollIntoView({ behavior: 'smooth' });
        }
        if (window.innerWidth <= 992) closeSidebar();
      });
    });

    // Calendar Navigation
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
      });
    }
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
      });
    }

    // Calendar Date Click Filter
    const calContainer = document.getElementById('calendarGridContainer');
    if (calContainer) {
      calContainer.addEventListener('click', (e) => {
        const dayEl = e.target.closest('[data-cal-day]');
        if (dayEl && !dayEl.classList.contains('muted')) {
          const day = parseInt(dayEl.dataset.calDay, 10);
          const year = currentCalendarDate.getFullYear();
          const month = currentCalendarDate.getMonth();

          if (calendarFilterDate && calendarFilterDate.getFullYear() === year && calendarFilterDate.getMonth() === month && calendarFilterDate.getDate() === day) {
            calendarFilterDate = null; // Toggle off
            showToast('Cleared calendar date filter', 'info');
          } else {
            calendarFilterDate = new Date(year, month, day);
            showToast(`Filtering for ${calendarFilterDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`, 'info');
          }
          renderTaskList();
          renderCalendar();
          renderActiveFilterTags();
        }
      });
    }

    // Modal Triggers
    if (elements.openAddTaskModalBtn) elements.openAddTaskModalBtn.addEventListener('click', () => openModal());
    if (elements.fabAddTaskBtn) elements.fabAddTaskBtn.addEventListener('click', () => openModal());
    if (elements.emptyStateAddBtn) elements.emptyStateAddBtn.addEventListener('click', () => openModal());
    if (elements.closeModalBtn) elements.closeModalBtn.addEventListener('click', closeModal);
    if (elements.cancelModalBtn) elements.cancelModalBtn.addEventListener('click', closeModal);
    if (elements.taskModalBackdrop) {
      elements.taskModalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.taskModalBackdrop) closeModal();
      });
    }

    // Preset Chips Handlers
    elements.presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        applyDatePreset(chip.dataset.preset);
      });
    });

    elements.estChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const estVal = chip.dataset.est;
        elements.taskEstTimeSelect.value = estVal;
        elements.taskEstTimeCustomInput.style.display = 'none';
      });
    });

    if (elements.taskEstTimeSelect) {
      elements.taskEstTimeSelect.addEventListener('change', (e) => {
        elements.taskEstTimeCustomInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
      });
    }

    if (elements.taskReminderSelect) {
      elements.taskReminderSelect.addEventListener('change', (e) => {
        elements.taskReminderCustomInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
      });
    }

    // Modal Subtasks Handlers
    if (elements.addSubtaskBtn) {
      elements.addSubtaskBtn.addEventListener('click', () => {
        const text = elements.newSubtaskInput.value.trim();
        if (text) {
          currentModalSubtasks.push({
            id: 'st-' + Math.random().toString(36).substr(2, 6),
            text: text,
            completed: false
          });
          elements.newSubtaskInput.value = '';
          renderModalSubtasks();
        }
      });
    }

    if (elements.newSubtaskInput) {
      elements.newSubtaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          elements.addSubtaskBtn.click();
        }
      });
    }

    if (elements.modalSubtaskList) {
      elements.modalSubtaskList.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove-modal-subtask]');
        if (btn) {
          const index = parseInt(btn.dataset.removeModalSubtask, 10);
          currentModalSubtasks.splice(index, 1);
          renderModalSubtasks();
        }
      });
    }

    if (elements.taskForm) elements.taskForm.addEventListener('submit', handleTaskFormSubmit);

    // Search Box Handlers
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        elements.clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        renderTaskList();
        renderActiveFilterTags();
      });
    }

    if (elements.clearSearchBtn) {
      elements.clearSearchBtn.addEventListener('click', () => {
        searchQuery = '';
        elements.searchInput.value = '';
        elements.clearSearchBtn.style.display = 'none';
        renderTaskList();
        renderActiveFilterTags();
      });
    }

    // Filter Selects Handlers
    if (elements.priorityFilter) {
      elements.priorityFilter.addEventListener('change', (e) => {
        priorityFilter = e.target.value;
        renderTaskList();
        renderActiveFilterTags();
      });
    }

    if (elements.typeFilter) {
      elements.typeFilter.addEventListener('change', (e) => {
        typeFilter = e.target.value;
        renderTaskList();
        renderActiveFilterTags();
      });
    }

    if (elements.subjectFilter) {
      elements.subjectFilter.addEventListener('change', (e) => {
        subjectFilter = e.target.value;
        renderTaskList();
        renderActiveFilterTags();
      });
    }

    if (elements.sortBySelect) {
      elements.sortBySelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        renderTaskList();
      });
    }

    if (elements.resetFiltersBtn) {
      elements.resetFiltersBtn.addEventListener('click', () => {
        searchQuery = '';
        priorityFilter = 'all';
        typeFilter = 'all';
        subjectFilter = 'all';
        calendarFilterDate = null;

        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.priorityFilter) elements.priorityFilter.value = 'all';
        if (elements.typeFilter) elements.typeFilter.value = 'all';
        if (elements.subjectFilter) elements.subjectFilter.value = 'all';

        renderTaskList();
        renderActiveFilterTags();
        renderCalendar();
      });
    }

    // View Mode Toggle Handlers
    if (elements.viewModeGridBtn) {
      elements.viewModeGridBtn.addEventListener('click', () => {
        viewMode = 'grid';
        elements.viewModeGridBtn.classList.add('active');
        elements.viewModeListBtn.classList.remove('active');
        renderTaskList();
      });
    }

    if (elements.viewModeListBtn) {
      elements.viewModeListBtn.addEventListener('click', () => {
        viewMode = 'list';
        elements.viewModeListBtn.classList.add('active');
        elements.viewModeGridBtn.classList.remove('active');
        renderTaskList();
      });
    }

    // Task List Container Delegated Clicks
    if (elements.taskListContainer) {
      elements.taskListContainer.addEventListener('click', (e) => {
        const checkbox = e.target.closest('.task-checkbox');
        if (checkbox) {
          toggleTaskCompletion(checkbox.dataset.taskId);
          return;
        }

        const subtaskCb = e.target.closest('.subtask-checkbox');
        if (subtaskCb) {
          toggleSubtaskCompletion(subtaskCb.dataset.taskId, subtaskCb.dataset.subtaskId);
          return;
        }

        const editBtn = e.target.closest('[data-edit-id]');
        if (editBtn) {
          openModal(editBtn.dataset.editId);
          return;
        }

        const deleteBtn = e.target.closest('[data-delete-id]');
        if (deleteBtn) {
          deleteTask(deleteBtn.dataset.deleteId);
          return;
        }
      });
    }

    // Today's Plan Checklist Clicks
    if (elements.todaysPlanList) {
      elements.todaysPlanList.addEventListener('click', (e) => {
        const checkbox = e.target.closest('.task-checkbox');
        if (checkbox) {
          toggleTaskCompletion(checkbox.dataset.taskId);
        }
      });
    }

    // View Full Plan Button
    if (elements.viewFullPlanBtn) {
      elements.viewFullPlanBtn.addEventListener('click', () => {
        const navToday = document.querySelector('[data-filter-view="today"]');
        if (navToday) navToday.click();
      });
    }

    // Delegated Remove Active Filter Tag Clicks
    if (elements.activeFiltersBar) {
      elements.activeFiltersBar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove-filter]');
        if (btn) {
          const type = btn.dataset.removeFilter;
          if (type === 'search') {
            searchQuery = '';
            if (elements.searchInput) elements.searchInput.value = '';
          } else if (type === 'priority') {
            priorityFilter = 'all';
            if (elements.priorityFilter) elements.priorityFilter.value = 'all';
          } else if (type === 'type') {
            typeFilter = 'all';
            if (elements.typeFilter) elements.typeFilter.value = 'all';
          } else if (type === 'subject') {
            subjectFilter = 'all';
            if (elements.subjectFilter) elements.subjectFilter.value = 'all';
          } else if (type === 'calendar') {
            calendarFilterDate = null;
          }
          renderTaskList();
          renderActiveFilterTags();
          renderCalendar();
        }
      });
    }

    // Focus Mode Triggers
    const toolBtnFocus = document.getElementById('toolBtnFocus');
    const headerFocusBtn = document.getElementById('headerFocusBtn');
    const closeFocusModalBtn = document.getElementById('closeFocusModalBtn');
    const focusModalBackdrop = document.getElementById('focusModalBackdrop');

    if (toolBtnFocus) toolBtnFocus.addEventListener('click', openFocusModal);
    if (headerFocusBtn) headerFocusBtn.addEventListener('click', openFocusModal);
    if (closeFocusModalBtn) closeFocusModalBtn.addEventListener('click', closeFocusModal);
    if (focusModalBackdrop) {
      focusModalBackdrop.addEventListener('click', (e) => {
        if (e.target === focusModalBackdrop) closeFocusModal();
      });
    }

    // Focus Duration Preset Chips
    const focusPresetChips = document.querySelectorAll('#focusPresetChips .preset-chip');
    const focusCustomDurationWrap = document.getElementById('focusCustomDurationWrap');
    const focusCustomDurationInput = document.getElementById('focusCustomDurationInput');

    focusPresetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (activeFocusSession && (activeFocusSession.isRunning || activeFocusSession.isPaused)) return;
        focusPresetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const dur = chip.dataset.duration;
        if (dur === 'custom') {
          if (focusCustomDurationWrap) focusCustomDurationWrap.style.display = 'flex';
          const customVal = parseInt(focusCustomDurationInput.value, 10) || 30;
          selectedFocusDurationMinutes = customVal;
          updateFocusTimerDisplay(customVal * 60);
        } else {
          if (focusCustomDurationWrap) focusCustomDurationWrap.style.display = 'none';
          selectedFocusDurationMinutes = parseInt(dur, 10) || 25;
          updateFocusTimerDisplay(selectedFocusDurationMinutes * 60);
        }
      });
    });

    if (focusCustomDurationInput) {
      focusCustomDurationInput.addEventListener('input', (e) => {
        if (activeFocusSession && (activeFocusSession.isRunning || activeFocusSession.isPaused)) return;
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 180) val = 180;
        selectedFocusDurationMinutes = val;
        updateFocusTimerDisplay(val * 60);
      });
    }

    const focusTaskSelect = document.getElementById('focusTaskSelect');
    if (focusTaskSelect) {
      focusTaskSelect.addEventListener('change', updateFocusTaskPreview);
    }

    // Focus Controls
    const startFocusBtn = document.getElementById('startFocusBtn');
    const pauseFocusBtn = document.getElementById('pauseFocusBtn');
    const resumeFocusBtn = document.getElementById('resumeFocusBtn');
    const cancelFocusBtn = document.getElementById('cancelFocusBtn');
    const resetFocusBtn = document.getElementById('resetFocusBtn');

    if (startFocusBtn) startFocusBtn.addEventListener('click', startFocusSession);
    if (pauseFocusBtn) pauseFocusBtn.addEventListener('click', pauseFocusSession);
    if (resumeFocusBtn) resumeFocusBtn.addEventListener('click', resumeFocusSession);
    if (cancelFocusBtn) cancelFocusBtn.addEventListener('click', cancelFocusSession);
    if (resetFocusBtn) resetFocusBtn.addEventListener('click', resetFocusState);

    // Tab Visibility Change Handler & Window Focus Recalculation
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        if (activeFocusSession && activeFocusSession.isRunning) {
          updateFocusTick();
        }
        checkRemindersAndDeadlines();
        renderStatsAndBadges();
        renderTaskList();
      }
    });

    window.addEventListener('focus', () => {
      checkRemindersAndDeadlines();
      renderStatsAndBadges();
      renderTaskList();
    });

    // Subtle 3D Perspective Tilt on Desktop Task Cards
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    if (!prefersReducedMotion && !isTouchDevice && elements.taskListContainer) {
      elements.taskListContainer.addEventListener('pointermove', (e) => {
        const card = e.target.closest('.task-card');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = -((y - centerY) / centerY) * 4;
        const rotateY = ((x - centerX) / centerX) * 4;
        card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      });

      elements.taskListContainer.addEventListener('pointerleave', (e) => {
        const card = e.target.closest('.task-card') || e.target;
        if (card && card.classList && card.classList.contains('task-card')) {
          card.style.transform = '';
        }
      }, true);

      elements.taskListContainer.addEventListener('pointerout', (e) => {
        if (e.target.classList && e.target.classList.contains('task-card')) {
          e.target.style.transform = '';
        }
      });
    }
  }

  // --- Toast Manager ---
  function showToast(message, type = 'info') {
    const iconMap = {
      info: 'fa-info-circle',
      success: 'fa-check-circle',
      danger: 'fa-exclamation-circle',
      warning: 'fa-triangle-exclamation'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${iconMap[type] || iconMap.info}"></i>
      <span>${escapeHtml(message)}</span>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- XSS Helper ---
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Test Automation & Clean Interface Bridge
  window.__studious = {
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    cancelFocusSession,
    completeFocusSession,
    resetFocusState,
    getActiveFocusSession: () => activeFocusSession,
    getFocusHistory,
    getTodayFocusStats,
    // Notification & Utility Bridge
    requestNotificationPermission,
    sendTestNotification,
    updateNotificationPermissionUi,
    checkInAppReminders,
    checkRemindersAndDeadlines,
    highlightTask,
    getTasks: () => tasks,
    getTheme: () => document.documentElement.getAttribute('data-theme'),
    toggleTheme,
    // Overdue & Sound Bridge
    isTaskOverdue,
    getOverdueTasks,
    calculateTaskStats,
    renderStatsAndBadges,
    playAlertSound,
    toggleSound,
    isSoundEnabled,
    setSoundEnabled,
    toggleDeadlineAlert,
    isDeadlineAlertEnabled,
    setDeadlineAlertEnabled,
    getAudioContext: () => audioCtx
  };

  // Run Initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
