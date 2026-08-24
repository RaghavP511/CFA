/**
 * CFA Study Tracker - Main Application Logic
 */

// State Management Keys
const STORAGE_KEYS = {
  MODULES: 'cfa_tracker_modules_v1',
  SPRINT_DAYS: 'cfa_sprint_days_v1',
  STUDY_LOGS: 'cfa_study_logs_v1',
  EXAM_DATE: 'cfa_exam_target_date_v1',
  THEME: 'cfa_theme_preference_v1',
  NOTES: 'cfa_module_notes_v1',
  DATA_VERSION: 'cfa_data_version_v1'
};

class CFATrackerApp {
  constructor() {
    this.data = window.CFA_DATA || {};

    // When data.js ships a new curriculum (e.g. Level I -> Level II), clear the
    // saved copies of module/sprint/exam state so the new data actually shows up.
    const shippedVersion = this.data.dataVersion || null;
    if (shippedVersion) {
      let savedVersion = null;
      try { savedVersion = JSON.parse(localStorage.getItem(STORAGE_KEYS.DATA_VERSION)); } catch (e) { savedVersion = null; }
      if (savedVersion !== shippedVersion) {
        [STORAGE_KEYS.MODULES, STORAGE_KEYS.SPRINT_DAYS, STORAGE_KEYS.EXAM_DATE].forEach(k => localStorage.removeItem(k));
        try { localStorage.setItem(STORAGE_KEYS.DATA_VERSION, JSON.stringify(shippedVersion)); } catch (e) {}
      }
    }
    this.reviewLevel = 'L2';
    this.modules = this.loadState(STORAGE_KEYS.MODULES, this.data.initialModules || []);
    this.sprintDays = this.loadState(STORAGE_KEYS.SPRINT_DAYS, this.data.initialSprintDays || []);
    this.studyLogs = this.loadState(STORAGE_KEYS.STUDY_LOGS, []);
    this.moduleNotes = this.loadState(STORAGE_KEYS.NOTES, {});
    this.examDate = this.loadState(STORAGE_KEYS.EXAM_DATE, this.data.examDate || '2026-11-21T08:30:00');
    this.activeTab = 'dashboard';
    
    // Timer state
    this.timer = {
      interval: null,
      seconds: 25 * 60,
      initialSeconds: 25 * 60,
      isRunning: false,
      mode: 'pomodoro' // 'pomodoro', 'shortBreak', 'stopwatch'
    };

    // Chart instances
    this.progressChart = null;

    this.init();
  }

  loadState(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.warn(`Error reading localStorage for ${key}`, e);
      return fallback;
    }
  }

  saveState(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving localStorage for ${key}`, e);
    }
  }

  init() {
    this.setupTheme();
    this.setupNavigation();
    this.setupCountdown();
    this.renderDashboard();
    this.renderModules();
    this.renderSprint();
    this.renderReviewGuide();
    this.renderStudyLogs();
    this.setupTimer();
    this.setupEventListeners();
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  setupTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  }

  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.add('hidden');
    });
    const targetPane = document.getElementById(`tab-${tabId}`);
    if (targetPane) {
      targetPane.classList.remove('hidden');
    }

    // Update nav button styles
    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
        btn.classList.remove('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800');
      } else {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
        btn.classList.add('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800');
      }
    });

    if (tabId === 'dashboard') {
      this.renderDashboard();
    } else if (tabId === 'curriculum') {
      this.renderModules();
    } else if (tabId === 'sprint') {
      this.renderSprint();
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  setupCountdown() {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(this.examDate).getTime();
      const diff = target - now;

      const daysEl = document.getElementById('cd-days');
      const hoursEl = document.getElementById('cd-hours');
      const minsEl = document.getElementById('cd-mins');
      const secsEl = document.getElementById('cd-secs');

      if (diff <= 0) {
        if (daysEl) daysEl.innerText = '00';
        if (hoursEl) hoursEl.innerText = '00';
        if (minsEl) minsEl.innerText = '00';
        if (secsEl) secsEl.innerText = '00';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (daysEl) daysEl.innerText = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
      if (minsEl) minsEl.innerText = String(minutes).padStart(2, '0');
      if (secsEl) secsEl.innerText = String(seconds).padStart(2, '0');
    };

    update();
    setInterval(update, 1000);
  }

  renderDashboard() {
    const totalModules = this.modules.length;
    const completedModules = this.modules.filter(m => m.status === 'Complete').length;
    const inProgressModules = this.modules.filter(m => m.status === 'In Progress').length;
    const pct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    // Sprint progress
    let totalSprintTasks = 0;
    let completedSprintTasks = 0;
    this.sprintDays.forEach(d => {
      if (d.tasks && Array.isArray(d.tasks)) {
        totalSprintTasks += d.tasks.length;
        completedSprintTasks += d.tasks.filter(t => t.completed).length;
      }
    });
    const sprintPct = totalSprintTasks > 0 ? Math.round((completedSprintTasks / totalSprintTasks) * 100) : 0;

    // Total study hours
    const totalMinutes = this.studyLogs.reduce((acc, log) => acc + (Number(log.minutes) || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    // Update DOM stats
    const totalModsEl = document.getElementById('stat-total-modules');
    const compModsEl = document.getElementById('stat-completed-modules');
    const progPctEl = document.getElementById('stat-progress-pct');
    const sprintPctEl = document.getElementById('stat-sprint-pct');
    const totalHoursEl = document.getElementById('stat-total-hours');
    const progressBarEl = document.getElementById('dashboard-progress-bar');

    if (totalModsEl) totalModsEl.innerText = totalModules;
    if (compModsEl) compModsEl.innerText = completedModules;
    if (progPctEl) progPctEl.innerText = `${pct}%`;
    if (sprintPctEl) sprintPctEl.innerText = `${sprintPct}%`;
    if (totalHoursEl) totalHoursEl.innerText = `${totalHours}h`;
    if (progressBarEl) progressBarEl.style.width = `${pct}%`;

    // Render Topic Cards
    this.renderTopicCards();
    this.renderTopicChart();
    this.renderTodaySprintBanner();
  }

  renderTodaySprintBanner() {
    const container = document.getElementById('today-sprint-banner');
    if (!container) return;

    // Find next incomplete sprint day or Day 1
    const nextDay = this.sprintDays.find(d => !d.done && d.tasks.some(t => !t.completed)) || this.sprintDays[0];
    if (!nextDay) {
      container.innerHTML = `
        <div class="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-5 text-center">
          <p class="text-emerald-400 font-semibold text-lg">🎉 All Sprint Days Completed!</p>
          <p class="text-slate-400 text-sm mt-1">Review formulas and practice ethics questions.</p>
        </div>
      `;
      return;
    }

    const pendingTasks = nextDay.tasks.filter(t => !t.completed);

    container.innerHTML = `
      <div class="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div class="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <i data-lucide="target" class="w-32 h-32 text-indigo-400"></i>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider">
              Sprint Day ${nextDay.dayNumber}
            </span>
            <span class="text-slate-400 text-sm">${nextDay.phase}</span>
          </div>
          <button onclick="app.switchTab('sprint')" class="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
            <span>View Full 88-Day Plan</span>
            <i data-lucide="chevron-right" class="w-4 h-4"></i>
          </button>
        </div>
        
        <h3 class="text-xl font-bold text-white mb-2">${nextDay.subject}</h3>
        <p class="text-slate-400 text-sm mb-4"><i data-lucide="calendar" class="w-4 h-4 inline mr-1 text-slate-500"></i> Scheduled Date: ${nextDay.date} (${nextDay.dayName}) ${nextDay.notes ? `• <span class="text-amber-300/80">Note: ${nextDay.notes}</span>` : ''}</p>
        
        <div class="space-y-2 mb-4">
          ${nextDay.tasks.map((task, idx) => `
            <label class="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer border border-slate-700/50">
              <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="app.toggleSprintTask(${nextDay.dayNumber - 1}, ${idx})" class="mt-1 w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-600 focus:ring-indigo-500">
              <span class="text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}">${task.task}</span>
            </label>
          `).join('')}
        </div>
        
        <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span>${pendingTasks.length} task${pendingTasks.length === 1 ? '' : 's'} remaining for today</span>
          <button onclick="app.switchTab('curriculum')" class="hover:text-slate-200 underline">Open Curriculum Tracker &rarr;</button>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  renderTopicCards() {
    const container = document.getElementById('topic-cards-grid');
    if (!container) return;

    const topicMeta = this.data.topicMeta || {};
    const topics = Object.keys(topicMeta);

    container.innerHTML = topics.map(topic => {
      const meta = topicMeta[topic];
      const topicMods = this.modules.filter(m => m.topic === topic);
      const total = topicMods.length;
      const completed = topicMods.filter(m => m.status === 'Complete').length;
      const inProg = topicMods.filter(m => m.status === 'In Progress').length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      return `
        <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 hover:border-slate-600 hover:shadow-lg transition flex flex-col justify-between cursor-pointer" onclick="app.filterByTopic('${topic}')">
          <div>
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white" style="background-color: ${meta.color || '#6366f1'}20; color: ${meta.color || '#6366f1'}">
                  <i data-lucide="${meta.icon || 'book-open'}" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="font-semibold text-sm text-slate-100 line-clamp-1">${topic}</h4>
                  <span class="text-xs text-indigo-400 font-medium">${meta.weight} Exam Weight</span>
                </div>
              </div>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full ${pct === 100 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'}">
                ${pct}%
              </span>
            </div>
            
            <div class="w-full bg-slate-700/70 h-2 rounded-full overflow-hidden my-3">
              <div class="h-full rounded-full transition-all duration-500" style="width: ${pct}%; background-color: ${meta.color || '#6366f1'}"></div>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/50">
            <span>${completed}/${total} Modules</span>
            <span class="text-indigo-400 hover:underline">View &rarr;</span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderTopicChart() {
    const canvas = document.getElementById('topicProgressChart');
    if (!canvas || !window.Chart) return;

    const topicMeta = this.data.topicMeta || {};
    const topics = Object.keys(topicMeta).filter(t => t !== 'Review');
    
    const labels = topics.map(t => t.length > 18 ? t.substring(0, 16) + '...' : t);
    const completionData = topics.map(topic => {
      const topicMods = this.modules.filter(m => m.topic === topic);
      const total = topicMods.length;
      const completed = topicMods.filter(m => m.status === 'Complete').length;
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    });

    const colors = topics.map(t => topicMeta[t]?.color || '#6366f1');

    if (this.progressChart) {
      this.progressChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.progressChart = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: '% Completed',
          data: completionData,
          backgroundColor: colors.map(c => c + 'cc'),
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => topics[items[0].dataIndex],
              label: (item) => `Completion: ${item.raw}% (${topicMeta[topics[item.dataIndex]]?.weight} Exam Weight)`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', callback: (v) => v + '%' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 0 }
          }
        }
      }
    });
  }

  filterByTopic(topic) {
    this.switchTab('curriculum');
    const topicSelect = document.getElementById('filter-topic');
    if (topicSelect) {
      topicSelect.value = topic;
      this.renderModules();
    }
  }

  renderModules() {
    const container = document.getElementById('curriculum-tbody');
    if (!container) return;

    const topicFilter = document.getElementById('filter-topic')?.value || 'all';
    const statusFilter = document.getElementById('filter-status')?.value || 'all';
    const searchTerm = document.getElementById('search-modules')?.value?.toLowerCase() || '';

    let filtered = this.modules.filter(m => {
      const matchTopic = (topicFilter === 'all' || m.topic === topicFilter);
      const matchStatus = (statusFilter === 'all' || m.status === statusFilter);
      const matchSearch = (!searchTerm || m.name.toLowerCase().includes(searchTerm) || m.topic.toLowerCase().includes(searchTerm));
      return matchTopic && matchStatus && matchSearch;
    });

    const countEl = document.getElementById('filtered-module-count');
    if (countEl) countEl.innerText = `${filtered.length} of ${this.modules.length} Modules`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-12 text-slate-400">
            <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 text-slate-500"></i>
            No learning modules found matching your criteria.
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = filtered.map((mod) => {
      const originalIdx = this.modules.findIndex(m => m.id === mod.id);
      const meta = this.data.topicMeta[mod.topic] || {};
      const note = this.moduleNotes[mod.id] || '';

      let statusBadge = '';
      if (mod.status === 'Complete') {
        statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-full status-badge-complete">Complete</span>';
      } else if (mod.status === 'In Progress') {
        statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-full status-badge-progress">In Progress</span>';
      } else {
        statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-full status-badge-notstarted">Not Started</span>';
      }

      return `
        <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition">
          <td class="py-3 px-4">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style="background-color: ${meta.color || '#6366f1'}20; color: ${meta.color || '#6366f1'}">
              ${mod.topic}
            </span>
          </td>
          <td class="py-3 px-4">
            <div class="font-medium text-slate-200 text-sm">${mod.name}</div>
            ${note ? `<div class="text-xs text-amber-400/90 mt-0.5"><i data-lucide="sticky-note" class="w-3 h-3 inline mr-1"></i>${note}</div>` : ''}
          </td>
          <td class="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
            ${mod.startDate ? mod.startDate : '—'}
          </td>
          <td class="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
            ${mod.endDate ? mod.endDate : '—'}
          </td>
          <td class="py-3 px-4 whitespace-nowrap">
            <div class="inline-block cursor-pointer" onclick="app.cycleStatus(${originalIdx})">
              ${statusBadge}
            </div>
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <button onclick="app.openNotesModal('${mod.id}', '${mod.name.replace(/'/g, "\\'")}')" class="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition" title="Add / Edit Note">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  cycleStatus(idx) {
    const statuses = ['Not Started', 'In Progress', 'Complete'];
    const current = this.modules[idx].status || 'Not Started';
    const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
    this.modules[idx].status = next;
    this.saveState(STORAGE_KEYS.MODULES, this.modules);
    this.renderModules();
    this.renderDashboard();

    if (next === 'Complete' && window.confetti) {
      window.confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }
  }

  setAllFilteredStatus(status) {
    const topicFilter = document.getElementById('filter-topic')?.value || 'all';
    const statusFilter = document.getElementById('filter-status')?.value || 'all';
    const searchTerm = document.getElementById('search-modules')?.value?.toLowerCase() || '';

    this.modules.forEach(m => {
      const matchTopic = (topicFilter === 'all' || m.topic === topicFilter);
      const matchStatus = (statusFilter === 'all' || m.status === statusFilter);
      const matchSearch = (!searchTerm || m.name.toLowerCase().includes(searchTerm) || m.topic.toLowerCase().includes(searchTerm));
      if (matchTopic && matchStatus && matchSearch) {
        m.status = status;
      }
    });

    this.saveState(STORAGE_KEYS.MODULES, this.modules);
    this.renderModules();
    this.renderDashboard();
  }

  renderSprint() {
    const container = document.getElementById('sprint-container');
    if (!container) return;

    // Render Rules
    const rulesContainer = document.getElementById('sprint-rules-list');
    if (rulesContainer && this.data.sprintRules) {
      rulesContainer.innerHTML = this.data.sprintRules.map(r => `
        <li class="flex items-start space-x-2 text-sm text-slate-300">
          <span class="text-indigo-400 font-bold">•</span>
          <span>${r}</span>
        </li>
      `).join('');
    }

    // Render Days
    container.innerHTML = this.sprintDays.map((day, dIdx) => {
      const totalTasks = day.tasks.length;
      const completedTasks = day.tasks.filter(t => t.completed).length;
      const isDayAllDone = totalTasks > 0 && completedTasks === totalTasks;

      return `
        <div class="border ${isDayAllDone ? 'border-emerald-500/40 bg-slate-900/90' : 'border-slate-700/60 bg-slate-800/80'} rounded-xl p-5 transition shadow-md">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-700/50">
            <div class="flex items-center space-x-3">
              <span class="px-3 py-1 text-xs font-bold rounded-md ${isDayAllDone ? 'bg-emerald-600 text-white' : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'}">
                Day ${day.dayNumber}
              </span>
              <h4 class="font-bold text-slate-100 text-base">${day.subject}</h4>
            </div>
            
            <div class="flex items-center space-x-3 text-xs">
              <span class="text-slate-400"><i data-lucide="calendar" class="w-3.5 h-3.5 inline mr-1"></i>${day.date} (${day.dayName})</span>
              <span class="px-2 py-0.5 rounded-full ${isDayAllDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'} font-semibold">
                ${completedTasks}/${totalTasks} Done
              </span>
            </div>
          </div>

          ${day.notes ? `
            <div class="mb-3 text-xs text-amber-300/90 bg-amber-950/30 border border-amber-500/20 rounded-lg p-2.5 flex items-center space-x-2">
              <i data-lucide="info" class="w-4 h-4 flex-shrink-0 text-amber-400"></i>
              <span><strong>Note / Commitment:</strong> ${day.notes}</span>
            </div>
          ` : ''}

          <div class="space-y-2">
            ${day.tasks.map((task, tIdx) => `
              <label class="flex items-start space-x-3 p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900/80 transition cursor-pointer border border-slate-800">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="app.toggleSprintTask(${dIdx}, ${tIdx})" class="mt-0.5 w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-600 focus:ring-indigo-500">
                <span class="text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}">${task.task}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  toggleSprintTask(dayIdx, taskIdx) {
    const day = this.sprintDays[dayIdx];
    if (day && day.tasks[taskIdx]) {
      day.tasks[taskIdx].completed = !day.tasks[taskIdx].completed;
      const allDone = day.tasks.every(t => t.completed);
      day.done = allDone;

      this.saveState(STORAGE_KEYS.SPRINT_DAYS, this.sprintDays);
      this.renderSprint();
      this.renderDashboard();

      if (allDone && window.confetti) {
        window.confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      }
    }
  }

  renderReviewGuide() {
    const container = document.getElementById('review-content-body');
    if (!container) return;

    const raw = (this.reviewLevel === 'L1'
      ? (this.data.reviewGuideL1Raw || '')
      : (this.data.reviewGuideRaw || ''));
    
    // Simple fast markdown formatter for the review guide
    let html = raw
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-indigo-300 mt-6 mb-2 flex items-center"><i data-lucide="bookmark" class="w-4 h-4 mr-2 text-indigo-400"></i>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-sky-400 mt-8 mb-4 border-b border-slate-700 pb-2 flex items-center"><i data-lucide="folder-check" class="w-5 h-5 mr-2 text-sky-400"></i>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black text-white mt-4 mb-3">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-slate-100">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="text-slate-300">$1</em>')
      .replace(/`([^`]+)`/gim, '<code class="bg-slate-950 px-1.5 py-0.5 rounded text-pink-400 font-mono text-xs">$1</code>')
      .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-indigo-500 bg-indigo-950/30 p-3 my-3 text-slate-300 italic rounded-r-lg">$1</blockquote>')
      .replace(/\n\n/gim, '<p class="mb-3 text-slate-300 leading-relaxed"></p>');

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  setReviewLevel(level) {
    this.reviewLevel = level;
    const l2 = document.getElementById('review-level-l2');
    const l1 = document.getElementById('review-level-l1');
    const on = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white transition';
    const off = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition';
    if (l2) l2.className = (level === 'L2') ? on : off;
    if (l1) l1.className = (level === 'L1') ? on : off;
    const search = document.getElementById('search-review');
    if (search) search.value = '';
    this.renderReviewGuide();
  }

  filterReviewGuide(searchTerm) {
    const container = document.getElementById('review-content-body');
    if (!container) return;

    if (!searchTerm) {
      this.renderReviewGuide();
      return;
    }

    const term = searchTerm.toLowerCase();
    const blocks = container.querySelectorAll('h2, h3, p, blockquote');
    blocks.forEach(b => {
      const match = b.innerText.toLowerCase().includes(term);
      b.style.display = match ? '' : 'none';
    });
  }

  setupTimer() {
    const display = document.getElementById('timer-display');
    const startBtn = document.getElementById('timer-start-btn');
    const resetBtn = document.getElementById('timer-reset-btn');

    if (!display || !startBtn) return;

    const updateDisplay = () => {
      const mins = Math.floor(this.timer.seconds / 60);
      const secs = this.timer.seconds % 60;
      display.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    updateDisplay();

    startBtn.addEventListener('click', () => {
      if (this.timer.isRunning) {
        clearInterval(this.timer.interval);
        this.timer.isRunning = false;
        startBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4 mr-1"></i> Start';
      } else {
        this.timer.isRunning = true;
        startBtn.innerHTML = '<i data-lucide="pause" class="w-4 h-4 mr-1"></i> Pause';
        this.timer.interval = setInterval(() => {
          if (this.timer.mode === 'stopwatch') {
            this.timer.seconds++;
          } else {
            if (this.timer.seconds > 0) {
              this.timer.seconds--;
            } else {
              clearInterval(this.timer.interval);
              this.timer.isRunning = false;
              startBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4 mr-1"></i> Start';
              alert('⏰ Timer finished! Great study session.');
              if (window.confetti) window.confetti();
            }
          }
          updateDisplay();
        }, 1000);
      }
      if (window.lucide) window.lucide.createIcons();
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        clearInterval(this.timer.interval);
        this.timer.isRunning = false;
        this.timer.seconds = this.timer.initialSeconds;
        startBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4 mr-1"></i> Start';
        updateDisplay();
        if (window.lucide) window.lucide.createIcons();
      });
    }
  }

  setTimerMode(mode, mins) {
    clearInterval(this.timer.interval);
    this.timer.isRunning = false;
    this.timer.mode = mode;
    this.timer.initialSeconds = mins * 60;
    this.timer.seconds = mins * 60;

    const display = document.getElementById('timer-display');
    if (display) {
      display.innerText = `${String(mins).padStart(2, '0')}:00`;
    }
    const startBtn = document.getElementById('timer-start-btn');
    if (startBtn) {
      startBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4 mr-1"></i> Start';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  logStudySession(e) {
    if (e) e.preventDefault();

    const topic = document.getElementById('log-topic')?.value || 'General';
    const minutes = parseInt(document.getElementById('log-minutes')?.value || '30', 10);
    const qAttempted = parseInt(document.getElementById('log-q-attempted')?.value || '0', 10);
    const qCorrect = parseInt(document.getElementById('log-q-correct')?.value || '0', 10);
    const notes = document.getElementById('log-notes')?.value || '';

    const newLog = {
      id: 'log_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      topic,
      minutes,
      qAttempted,
      qCorrect,
      accuracy: qAttempted > 0 ? Math.round((qCorrect / qAttempted) * 100) : 0,
      notes
    };

    this.studyLogs.unshift(newLog);
    this.saveState(STORAGE_KEYS.STUDY_LOGS, this.studyLogs);
    this.renderStudyLogs();
    this.renderDashboard();

    // Reset form
    const form = document.getElementById('study-log-form');
    if (form) form.reset();
  }

  renderStudyLogs() {
    const container = document.getElementById('study-logs-tbody');
    if (!container) return;

    if (this.studyLogs.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-slate-400">
            No study sessions logged yet. Use the form above to log your first session!
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = this.studyLogs.map((log, idx) => `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40">
        <td class="py-3 px-4 text-xs text-slate-300">${log.date} ${log.timestamp || ''}</td>
        <td class="py-3 px-4 text-xs font-semibold text-indigo-400">${log.topic}</td>
        <td class="py-3 px-4 text-xs text-slate-200">${log.minutes} mins</td>
        <td class="py-3 px-4 text-xs text-slate-200">${log.qAttempted > 0 ? `${log.qCorrect}/${log.qAttempted}` : '—'}</td>
        <td class="py-3 px-4 text-xs">
          ${log.qAttempted > 0 ? `
            <span class="px-2 py-0.5 rounded text-xs font-semibold ${log.accuracy >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}">
              ${log.accuracy}%
            </span>
          ` : '—'}
        </td>
        <td class="py-3 px-4 text-xs text-slate-400">${log.notes || '—'}</td>
      </tr>
    `).join('');
  }

  openNotesModal(modId, modName) {
    const currentNote = this.moduleNotes[modId] || '';
    const newNote = prompt(`Notes for: "${modName}"`, currentNote);
    if (newNote !== null) {
      if (newNote.trim() === '') {
        delete this.moduleNotes[modId];
      } else {
        this.moduleNotes[modId] = newNote.trim();
      }
      this.saveState(STORAGE_KEYS.NOTES, this.moduleNotes);
      this.renderModules();
    }
  }

  exportData(format = 'json') {
    const state = {
      modules: this.modules,
      sprintDays: this.sprintDays,
      studyLogs: this.studyLogs,
      moduleNotes: this.moduleNotes,
      examDate: this.examDate,
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `cfa_study_tracker_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else if (format === 'csv') {
      let csv = 'ID,Topic,Module Name,Start Date,End Date,Status,Notes\n';
      this.modules.forEach(m => {
        const note = (this.moduleNotes[m.id] || '').replace(/"/g, '""');
        csv += `"${m.id}","${m.topic}","${m.name.replace(/"/g, '""')}","${m.startDate}","${m.endDate}","${m.status}","${note}"\n`;
      });
      const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `cfa_curriculum_progress_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.modules) this.modules = imported.modules;
        if (imported.sprintDays) this.sprintDays = imported.sprintDays;
        if (imported.studyLogs) this.studyLogs = imported.studyLogs;
        if (imported.moduleNotes) this.moduleNotes = imported.moduleNotes;
        if (imported.examDate) this.examDate = imported.examDate;

        this.saveState(STORAGE_KEYS.MODULES, this.modules);
        this.saveState(STORAGE_KEYS.SPRINT_DAYS, this.sprintDays);
        this.saveState(STORAGE_KEYS.STUDY_LOGS, this.studyLogs);
        this.saveState(STORAGE_KEYS.NOTES, this.moduleNotes);
        this.saveState(STORAGE_KEYS.EXAM_DATE, this.examDate);

        this.renderDashboard();
        this.renderModules();
        this.renderSprint();
        this.renderStudyLogs();

        alert('✅ Data imported successfully!');
      } catch (err) {
        alert('❌ Error reading import file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  resetToDefaults() {
    if (confirm('Are you sure you want to reset all tracker data to original defaults? This will erase custom checkmarks and study logs.')) {
      localStorage.clear();
      this.modules = this.data.initialModules || [];
      this.sprintDays = this.data.initialSprintDays || [];
      this.studyLogs = [];
      this.moduleNotes = {};
      this.examDate = this.data.examDate || '2026-11-21T08:30:00';
      this.renderDashboard();
      this.renderModules();
      this.renderSprint();
      this.renderStudyLogs();
      alert('Reset complete.');
    }
  }

  setupEventListeners() {
    // Topic filter in curriculum
    document.getElementById('filter-topic')?.addEventListener('change', () => this.renderModules());
    document.getElementById('filter-status')?.addEventListener('change', () => this.renderModules());
    document.getElementById('search-modules')?.addEventListener('input', () => this.renderModules());

    // Review search
    document.getElementById('search-review')?.addEventListener('input', (e) => this.filterReviewGuide(e.target.value));

    // Study log form submit
    document.getElementById('study-log-form')?.addEventListener('submit', (e) => this.logStudySession(e));

    // Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => this.toggleTheme());
  }
}

// Instantiate on load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CFATrackerApp();
});
