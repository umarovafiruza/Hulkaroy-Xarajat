/**
 * ===================================================================
 * SMART EXPENSE TRACKER - HIGH-PERFORMANCE JS ENGINE
 * Features: Mobile Tab Switcher, Bottom Nav, Debounced Search, 60 FPS
 * Architecture: Clean Vanilla ES6+
 * ===================================================================
 */

'use strict';

// -------------------------------------------------------------------
// 1. CONFIGURATION & CONSTANTS
// -------------------------------------------------------------------
const STORAGE_KEYS = {
  TRANSACTIONS: 'smart_expense_transactions_v1',
  SETTINGS: 'smart_expense_settings_v1',
  ACTIVE_VIEW: 'smart_expense_active_view_v1'
};

const CATEGORIES = {
  food: { name: "Oziq-ovqat", emoji: "🍔", color: "#f97316" },
  transport: { name: "Transport", emoji: "🚗", color: "#3b82f6" },
  utilities: { name: "Kommunal", emoji: "💡", color: "#eab308" },
  education: { name: "Ta'lim", emoji: "📚", color: "#8b5cf6" },
  entertainment: { name: "Ko'ngilochar", emoji: "🎮", color: "#ec4899" },
  shopping: { name: "Xaridlar", emoji: "🛍️", color: "#06b6d4" },
  health: { name: "Salomatlik", emoji: "💊", color: "#14b8a6" },
  other: { name: "Boshqa", emoji: "✨", color: "#a855f7" },
  income: { name: "Daromad", emoji: "💰", color: "#10b981" }
};

const MONTH_NAMES_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktyabr", "Noyabr", "Dekabr"
];

const DEFAULT_SETTINGS = {
  initialBalance: 7500000,
  monthlyBudget: 5000000
};

// -------------------------------------------------------------------
// 2. STATE MANAGEMENT
// -------------------------------------------------------------------
let state = {
  transactions: [],
  settings: { ...DEFAULT_SETTINGS },
  currentView: 'dashboard', // 'dashboard', 'add', 'analytics', 'history', 'all'
  chartPeriod: 'month',
  deleteTargetId: null,
  isClearAllAction: false
};

let categoryChartInstance = null;

// -------------------------------------------------------------------
// 3. UTILITY FUNCTIONS & PERFORMANCE HELPERS
// -------------------------------------------------------------------

function debounce(fn, delay = 120) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOffsetDateString(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCurrency(amount) {
  if (isNaN(amount)) return "0 so'm";
  const num = Math.round(amount);
  return `${num.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`;
}

function formatDateUZ(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = MONTH_NAMES_UZ[monthIdx] || '';
  return `${day}-${monthName}, ${year}`;
}

function generateId() {
  return 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
}

function getFreshDemoTransactions() {
  return [
    {
      id: "tx-demo-1",
      type: "expense",
      amount: 145000,
      category: "food",
      paymentMethod: "card",
      note: "Korzinka supermarket bozorlik",
      date: getTodayDateString(),
      createdAt: Date.now() - 3600000 * 2
    },
    {
      id: "tx-demo-2",
      type: "expense",
      amount: 32000,
      category: "transport",
      paymentMethod: "card",
      note: "Yandex Go taksi safari",
      date: getTodayDateString(),
      createdAt: Date.now() - 3600000 * 4
    },
    {
      id: "tx-demo-3",
      type: "expense",
      amount: 450000,
      category: "utilities",
      paymentMethod: "card",
      note: "Elektr va gaz to'lovi",
      date: getOffsetDateString(-2),
      createdAt: Date.now() - 86400000 * 2
    },
    {
      id: "tx-demo-4",
      type: "expense",
      amount: 280000,
      category: "shopping",
      paymentMethod: "card",
      note: "Uzum Market xaridlar",
      date: getOffsetDateString(-4),
      createdAt: Date.now() - 86400000 * 4
    },
    {
      id: "tx-demo-5",
      type: "expense",
      amount: 85000,
      category: "entertainment",
      paymentMethod: "cash",
      note: "Kinoteatr chiptasi va qahva",
      date: getOffsetDateString(-5),
      createdAt: Date.now() - 86400000 * 5
    },
    {
      id: "tx-demo-6",
      type: "expense",
      amount: 600000,
      category: "education",
      paymentMethod: "card",
      note: "Ingliz tili kursi to'lovi",
      date: getOffsetDateString(-8),
      createdAt: Date.now() - 86400000 * 8
    },
    {
      id: "tx-demo-7",
      type: "income",
      amount: 2500000,
      category: "income",
      paymentMethod: "card",
      note: "Freelance loyiha avansi",
      date: getOffsetDateString(-10),
      createdAt: Date.now() - 86400000 * 10
    }
  ];
}

// -------------------------------------------------------------------
// 4. VIEW / PAGE SWITCHER (MOBIL UCHUN TUGMALI SAHIFALAR)
// -------------------------------------------------------------------
function setActiveView(viewName) {
  state.currentView = viewName;
  document.body.dataset.activeView = viewName;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_VIEW, viewName);

  // Update Top Navigation Bar Tabs
  const topTabs = document.querySelectorAll('.nav-tab-btn');
  topTabs.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Update Mobile Bottom Navigation Bar Buttons
  const bottomBtns = document.querySelectorAll('.mobile-nav-btn[data-view]');
  bottomBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Dynamic refresh for specific views
  if (viewName === 'analytics' || viewName === 'all') {
    initOrUpdateChart();
    if (categoryChartInstance) {
      setTimeout(() => categoryChartInstance.resize(), 50);
    }
  }

  if (viewName === 'history' || viewName === 'all') {
    renderTransactionsList();
  }

  if (viewName === 'dashboard' || viewName === 'all') {
    updateDashboardUI();
    renderDashboardSnippet();
  }

  // Smooth scroll to top when changing views
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupViewNavigation() {
  // Top nav bar buttons
  const topNav = document.querySelector('.view-navigation-bar');
  if (topNav) {
    topNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-tab-btn');
      if (btn && btn.dataset.view) {
        setActiveView(btn.dataset.view);
      }
    });
  }

  // Mobile bottom bar buttons
  const bottomNav = document.querySelector('.mobile-bottom-nav');
  if (bottomNav) {
    bottomNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.mobile-nav-btn');
      if (!btn) return;

      if (btn.id === 'btn-mobile-budget') {
        const btnOpenBudget = document.getElementById('btn-open-budget-modal');
        if (btnOpenBudget) btnOpenBudget.click();
        return;
      }

      if (btn.dataset.view) {
        setActiveView(btn.dataset.view);
      }
    });
  }

  // In-page quick action buttons (data-action="switch-view")
  document.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action="switch-view"]');
    if (actionBtn && actionBtn.dataset.target) {
      setActiveView(actionBtn.dataset.target);
    }
  });

  // Initialize initial view (Default 'dashboard' on mobile, or saved view)
  const savedView = localStorage.getItem(STORAGE_KEYS.ACTIVE_VIEW);
  const initialView = savedView || 'dashboard';
  setActiveView(initialView);
}

// -------------------------------------------------------------------
// 5. STORAGE CONTROLLER
// -------------------------------------------------------------------
function loadStateFromStorage() {
  try {
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (storedSettings) {
      state.settings = JSON.parse(storedSettings);
    } else {
      state.settings = { ...DEFAULT_SETTINGS };
      saveSettingsToStorage();
    }

    const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (storedTx) {
      state.transactions = JSON.parse(storedTx);
    } else {
      state.transactions = getFreshDemoTransactions();
      saveTransactionsToStorage();
    }
  } catch (err) {
    console.error("Storage loading error:", err);
    state.transactions = getFreshDemoTransactions();
    state.settings = { ...DEFAULT_SETTINGS };
  }
}

function saveTransactionsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
  } catch (err) {
    console.error("Failed to save transactions:", err);
  }
}

function saveSettingsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
  } catch (err) {
    console.error("Failed to save settings:", err);
  }
}

// -------------------------------------------------------------------
// 6. TOAST NOTIFICATION SYSTEM
// -------------------------------------------------------------------
function showToast(message, type = 'info', title = null) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: 'fa-solid fa-circle-check',
    warning: 'fa-solid fa-triangle-exclamation',
    error: 'fa-solid fa-circle-xmark',
    info: 'fa-solid fa-circle-info'
  };

  const titles = {
    success: title || 'Muvaffaqiyatli',
    warning: title || 'Diqqat',
    error: title || 'Xatolik',
    info: title || 'Ma\'lumot'
  };

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="${icons[type] || icons.info}"></i>
    </div>
    <div class="toast-content">
      <strong>${titles[type]}</strong>
      <p>${message}</p>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 260);
  }, 3200);
}

// -------------------------------------------------------------------
// 7. DASHBOARD & STATS CALCULATIONS
// -------------------------------------------------------------------
function calculateMetrics() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayStr = getTodayDateString();

  let totalIncome = 0;
  let totalExpense = 0;
  let monthlyExpense = 0;
  let monthlyCount = 0;
  let todayExpense = 0;
  let todayCount = 0;

  for (let i = 0; i < state.transactions.length; i++) {
    const tx = state.transactions[i];
    const amount = Number(tx.amount) || 0;
    const [txYear, txMonth] = (tx.date || '').split('-').map(Number);
    const isThisMonth = txYear === currentYear && txMonth === currentMonth;
    const isToday = tx.date === todayStr;

    if (tx.type === 'income') {
      totalIncome += amount;
    } else {
      totalExpense += amount;
      if (isThisMonth) {
        monthlyExpense += amount;
        monthlyCount++;
      }
      if (isToday) {
        todayExpense += amount;
        todayCount++;
      }
    }
  }

  const totalBalance = state.settings.initialBalance + totalIncome - totalExpense;
  const budget = state.settings.monthlyBudget || 1;
  const budgetPercent = Math.min(Math.round((monthlyExpense / budget) * 100), 100);
  const rawBudgetPercent = Math.round((monthlyExpense / budget) * 100);
  const budgetRemaining = Math.max(0, budget - monthlyExpense);
  const daysInCurrentMonth = now.getDate();
  const avgDaily = daysInCurrentMonth > 0 ? Math.round(monthlyExpense / daysInCurrentMonth) : 0;

  return {
    totalBalance,
    totalIncome,
    totalExpense,
    monthlyExpense,
    monthlyCount,
    todayExpense,
    todayCount,
    budget,
    budgetPercent,
    rawBudgetPercent,
    budgetRemaining,
    avgDaily
  };
}

function updateDashboardUI() {
  const metrics = calculateMetrics();

  // 1. Total Balance
  const elBalance = document.getElementById('stat-total-balance');
  if (elBalance) {
    elBalance.textContent = formatCurrency(metrics.totalBalance);
    elBalance.classList.toggle('text-danger', metrics.totalBalance < 0);
  }

  // 2. Monthly Budget & Progress
  const elBudget = document.getElementById('stat-monthly-budget');
  const elBudgetBadge = document.getElementById('budget-percent-badge');
  const elProgressBar = document.getElementById('budget-progress-bar');
  const elSpentText = document.getElementById('budget-spent-text');
  const elRemainingText = document.getElementById('budget-remaining-text');

  if (elBudget) elBudget.textContent = formatCurrency(metrics.budget);
  if (elBudgetBadge) {
    elBudgetBadge.textContent = `${metrics.rawBudgetPercent}%`;
    elBudgetBadge.className = 'badge';
    if (metrics.rawBudgetPercent >= 100) {
      elBudgetBadge.classList.add('badge-danger');
    } else if (metrics.rawBudgetPercent >= 80) {
      elBudgetBadge.classList.add('badge-warning');
    } else {
      elBudgetBadge.classList.add('badge-success');
    }
  }

  if (elProgressBar) {
    elProgressBar.style.width = `${metrics.budgetPercent}%`;
    elProgressBar.className = 'progress-bar-fill';
    if (metrics.rawBudgetPercent >= 100) {
      elProgressBar.classList.add('danger');
    } else if (metrics.rawBudgetPercent >= 80) {
      elProgressBar.classList.add('warning');
    }
  }

  if (elSpentText) elSpentText.textContent = `${formatCurrency(metrics.monthlyExpense)} sarflandi`;
  if (elRemainingText) {
    if (metrics.monthlyExpense > metrics.budget) {
      const overspent = metrics.monthlyExpense - metrics.budget;
      elRemainingText.textContent = `Limitdan oshdi: ${formatCurrency(overspent)}`;
      elRemainingText.classList.add('text-danger');
    } else {
      elRemainingText.textContent = `Qoldi: ${formatCurrency(metrics.budgetRemaining)}`;
      elRemainingText.classList.remove('text-danger');
    }
  }

  // 3. Today's Expenses
  const elToday = document.getElementById('stat-today-expense');
  const elTodayCount = document.getElementById('stat-today-count');
  if (elToday) elToday.textContent = formatCurrency(metrics.todayExpense);
  if (elTodayCount) elTodayCount.textContent = `${metrics.todayCount} ta to'lov`;

  // 4. Monthly Total Expenses
  const elMonthly = document.getElementById('stat-monthly-expense');
  const elMonthlyCount = document.getElementById('stat-monthly-count');
  const elAvgDaily = document.getElementById('stat-avg-daily');
  if (elMonthly) elMonthly.textContent = formatCurrency(metrics.monthlyExpense);
  if (elMonthlyCount) elMonthlyCount.textContent = `${metrics.monthlyCount} ta to'lov`;
  if (elAvgDaily) elAvgDaily.textContent = `O'rtacha kunlik: ${formatCurrency(metrics.avgDaily)}`;

  // 5. Budget Warning Banner (>80%)
  const warningBanner = document.getElementById('budget-warning-banner');
  const alertTitle = document.getElementById('alert-title');
  const alertDesc = document.getElementById('alert-desc');

  if (warningBanner) {
    if (metrics.rawBudgetPercent >= 80) {
      warningBanner.classList.remove('hidden');
      if (metrics.rawBudgetPercent >= 100) {
        alertTitle.textContent = `Diqqat: Oylik byudjet ${metrics.rawBudgetPercent}% sarflanib, limit oshib ketdi!`;
        alertDesc.textContent = `Rejalashtirilgan ${formatCurrency(metrics.budget)} limitidan ${formatCurrency(metrics.monthlyExpense - metrics.budget)} ko'p mablag' sarflandi.`;
      } else {
        alertTitle.textContent = `Diqqat: Oylik byudjetning ${metrics.rawBudgetPercent}% qismi ishlatildi!`;
        alertDesc.textContent = `Limit tugashiga oz qoldi. Byudjetingizdan faqat ${formatCurrency(metrics.budgetRemaining)} mablag' qoldi.`;
      }
    } else {
      warningBanner.classList.add('hidden');
    }
  }
}

/**
 * Renders the 3 most recent transactions on the Dashboard view
 */
function renderDashboardSnippet() {
  const container = document.getElementById('dashboard-snippet-list');
  if (!container) return;

  const top3 = state.transactions.slice(0, 3);
  if (top3.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-dimmed); font-size: 0.82rem; padding: 16px;">
        Hali xarajatlar kiritilmadi.
      </div>
    `;
    return;
  }

  let html = '';
  for (let i = 0; i < top3.length; i++) {
    const tx = top3[i];
    const isExpense = tx.type === 'expense';
    const cat = isExpense ? (CATEGORIES[tx.category] || CATEGORIES.other) : CATEGORIES.income;
    const sign = isExpense ? '-' : '+';
    const amountClass = isExpense ? 'expense' : 'income';

    html += `
      <li class="transaction-item" style="padding: 10px 14px;">
        <div class="t-left">
          <div class="t-icon-box" style="width: 38px; height: 38px; border-color: ${cat.color}40; background: ${cat.color}15; font-size: 1.1rem;">
            <span>${cat.emoji}</span>
          </div>
          <div class="t-details">
            <span class="t-title" style="font-size: 0.88rem;">${escapeHtml(tx.note || cat.name)}</span>
            <span style="font-size: 0.72rem; color: var(--text-dimmed);">${formatDateUZ(tx.date)}</span>
          </div>
        </div>
        <div class="t-right">
          <span class="t-amount ${amountClass}" style="font-size: 0.95rem;">
            ${sign} ${formatCurrency(tx.amount)}
          </span>
        </div>
      </li>
    `;
  }
  container.innerHTML = html;
}

// -------------------------------------------------------------------
// 8. CHART.JS VISUAL ANALYTICS
// -------------------------------------------------------------------
function initOrUpdateChart() {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const categoryTotals = {};
  let totalSpent = 0;

  for (let i = 0; i < state.transactions.length; i++) {
    const tx = state.transactions[i];
    if (tx.type !== 'expense') continue;

    if (state.chartPeriod === 'month') {
      const [txYear, txMonth] = (tx.date || '').split('-').map(Number);
      if (txYear !== currentYear || txMonth !== currentMonth) continue;
    }

    const cat = tx.category || 'other';
    const amt = Number(tx.amount) || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    totalSpent += amt;
  }

  const centerAmount = document.getElementById('center-amount');
  if (centerAmount) {
    centerAmount.textContent = formatCurrency(totalSpent);
  }

  renderCategoryBreakdown(categoryTotals, totalSpent);

  const categoriesWithData = Object.keys(categoryTotals).filter(cat => categoryTotals[cat] > 0);

  let labels = [];
  let data = [];
  let colors = [];

  if (categoriesWithData.length === 0) {
    labels = ["Xarajat yo'q"];
    data = [1];
    colors = ["rgba(255, 255, 255, 0.1)"];
  } else {
    for (let i = 0; i < categoriesWithData.length; i++) {
      const cat = categoriesWithData[i];
      const meta = CATEGORIES[cat] || CATEGORIES.other;
      labels.push(`${meta.emoji} ${meta.name}`);
      data.push(categoryTotals[cat]);
      colors.push(meta.color);
    }
  }

  if (categoryChartInstance) {
    categoryChartInstance.data.labels = labels;
    categoryChartInstance.data.datasets[0].data = data;
    categoryChartInstance.data.datasets[0].backgroundColor = colors;
    categoryChartInstance.update('none');
  } else {
    const ctx = canvas.getContext('2d');
    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#1e293b',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 120,
        animation: { duration: 350 },
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            usePointStyle: true,
            callbacks: {
              label: function (context) {
                if (categoriesWithData.length === 0) return " Hali xarajatlar yo'q";
                const val = context.raw || 0;
                const pct = totalSpent > 0 ? Math.round((val / totalSpent) * 100) : 0;
                return ` ${formatCurrency(val)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }
}

function renderCategoryBreakdown(categoryTotals, totalSpent) {
  const container = document.getElementById('category-breakdown');
  if (!container) return;

  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0 || totalSpent === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-dimmed); font-size: 0.82rem; padding: 20px;">
        Tanlangan davr uchun hech qanday xarajat mavjud emas.
      </div>
    `;
    return;
  }

  let html = '';
  for (let i = 0; i < entries.length; i++) {
    const [catKey, amount] = entries[i];
    const meta = CATEGORIES[catKey] || CATEGORIES.other;
    const percent = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;

    html += `
      <div class="breakdown-item">
        <div class="breakdown-left">
          <span class="breakdown-color-dot" style="background-color: ${meta.color}"></span>
          <span class="breakdown-name">${meta.emoji} ${meta.name}</span>
        </div>
        <div class="breakdown-right">
          <span class="breakdown-amount">${formatCurrency(amount)}</span>
          <span class="breakdown-percent">${percent}%</span>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

// -------------------------------------------------------------------
// 9. TRANSACTIONS LIST RENDERING & FILTERING
// -------------------------------------------------------------------
function getFilteredAndSortedTransactions() {
  const searchInput = document.getElementById('search-input');
  const filterCat = document.getElementById('filter-category');
  const filterPayment = document.getElementById('filter-payment');
  const sortSelect = document.getElementById('sort-transactions');

  const query = (searchInput?.value || '').toLowerCase().trim();
  const selectedCat = filterCat?.value || 'all';
  const selectedPayment = filterPayment?.value || 'all';
  const sortMode = sortSelect?.value || 'date-desc';

  let list = state.transactions;

  if (selectedCat !== 'all') {
    if (selectedCat === 'income') {
      list = list.filter(t => t.type === 'income');
    } else {
      list = list.filter(t => t.category === selectedCat && t.type === 'expense');
    }
  }

  if (selectedPayment !== 'all') {
    list = list.filter(t => t.paymentMethod === selectedPayment);
  }

  if (query) {
    list = list.filter(t => {
      const noteMatch = (t.note || '').toLowerCase().includes(query);
      const catMeta = CATEGORIES[t.category] || {};
      const catMatch = (catMeta.name || '').toLowerCase().includes(query);
      const amtMatch = String(t.amount).includes(query);
      return noteMatch || catMatch || amtMatch;
    });
  }

  const sorted = [...list];
  sorted.sort((a, b) => {
    switch (sortMode) {
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'amount-desc':
        return Number(b.amount) - Number(a.amount);
      case 'amount-asc':
        return Number(a.amount) - Number(b.amount);
      case 'date-desc':
      default:
        return new Date(b.date) - new Date(a.date) || (b.createdAt - a.createdAt);
    }
  });

  return sorted;
}

function renderTransactionsList() {
  const listEl = document.getElementById('transactions-list');
  const emptyStateEl = document.getElementById('empty-state');
  const counterEl = document.getElementById('transaction-counter');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const searchInput = document.getElementById('search-input');

  if (btnClearSearch && searchInput) {
    btnClearSearch.classList.toggle('hidden', searchInput.value.trim().length === 0);
  }

  const items = getFilteredAndSortedTransactions();

  if (counterEl) {
    counterEl.textContent = `${items.length} ta yozuv`;
  }

  if (items.length === 0) {
    listEl.innerHTML = '';
    emptyStateEl.classList.remove('hidden');
    return;
  }

  emptyStateEl.classList.add('hidden');

  let html = '';
  for (let i = 0; i < items.length; i++) {
    const tx = items[i];
    const isExpense = tx.type === 'expense';
    const cat = isExpense ? (CATEGORIES[tx.category] || CATEGORIES.other) : CATEGORIES.income;
    const paymentLabel = tx.paymentMethod === 'card' ? '💳 Karta' : '💵 Naqd pul';
    const sign = isExpense ? '-' : '+';
    const amountClass = isExpense ? 'expense' : 'income';

    html += `
      <li class="transaction-item" data-id="${tx.id}">
        <div class="t-left">
          <div class="t-icon-box" style="border-color: ${cat.color}40; background: ${cat.color}15;">
            <span>${cat.emoji}</span>
          </div>
          <div class="t-details">
            <div class="t-title-row">
              <span class="t-title" title="${escapeHtml(tx.note || cat.name)}">${escapeHtml(tx.note || cat.name)}</span>
              <span class="t-badge-category">${cat.name}</span>
            </div>
            <div class="t-meta-row">
              <span>${formatDateUZ(tx.date)}</span>
              <span>•</span>
              <span class="t-badge-payment">${paymentLabel}</span>
            </div>
          </div>
        </div>

        <div class="t-right">
          <span class="t-amount ${amountClass}">
            ${sign} ${formatCurrency(tx.amount)}
          </span>
          <button 
            class="btn-delete-item" 
            title="O'chirish" 
            data-delete-id="${tx.id}"
            aria-label="Xarajatni o'chirish"
          >
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </li>
    `;
  }
  listEl.innerHTML = html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
}

// -------------------------------------------------------------------
// 10. FORM INTERACTIONS & SUBMISSIONS
// -------------------------------------------------------------------
function setupFormHandlers() {
  const form = document.getElementById('transaction-form');
  const typeBtns = document.querySelectorAll('.type-btn');
  const catPills = document.querySelectorAll('.cat-pill');
  const selectedCatInput = document.getElementById('selected-category');
  const chips = document.querySelectorAll('.chip');
  const inputAmount = document.getElementById('input-amount');
  const inputDate = document.getElementById('input-date');
  const categoryGroup = document.getElementById('category-group');

  if (inputDate) {
    inputDate.value = getTodayDateString();
  }

  let currentType = 'expense';
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;

      const submitBtnSpan = document.querySelector('#btn-submit-transaction span');
      if (currentType === 'income') {
        if (categoryGroup) categoryGroup.style.display = 'none';
        if (submitBtnSpan) submitBtnSpan.textContent = "Daromadni saqlash";
      } else {
        if (categoryGroup) categoryGroup.style.display = 'flex';
        if (submitBtnSpan) submitBtnSpan.textContent = "Xarajatni saqlash";
      }
    });
  });

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      if (selectedCatInput) {
        selectedCatInput.value = pill.dataset.cat;
      }
    });
  });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = parseInt(chip.dataset.amount, 10);
      const current = parseInt(inputAmount.value, 10) || 0;
      inputAmount.value = current + val;
      inputAmount.focus();
    });
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const amount = parseFloat(inputAmount.value);
      const note = document.getElementById('input-note').value.trim();
      const date = inputDate.value;
      const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'card';
      const category = currentType === 'income' ? 'income' : (selectedCatInput.value || 'other');

      if (!amount || isNaN(amount) || amount <= 0) {
        showToast("Iltimos, to'g'ri summani kiriting!", 'warning');
        inputAmount.focus();
        return;
      }

      if (!note) {
        showToast("Iltimos, xarajat uchun qisqa izoh yoki nom yozing!", 'warning');
        document.getElementById('input-note').focus();
        return;
      }

      if (!date) {
        showToast("Iltimos, sanani tanlang!", 'warning');
        inputDate.focus();
        return;
      }

      const newTx = {
        id: generateId(),
        type: currentType,
        amount: Math.round(amount),
        category: category,
        paymentMethod: paymentMethod,
        note: note,
        date: date,
        createdAt: Date.now()
      };

      state.transactions.unshift(newTx);
      saveTransactionsToStorage();

      updateDashboardUI();
      renderDashboardSnippet();
      initOrUpdateChart();
      renderTransactionsList();

      const metrics = calculateMetrics();
      const catMeta = CATEGORIES[category] || {};
      const typeLabel = currentType === 'income' ? 'Daromad' : 'Xarajat';
      showToast(`${catMeta.emoji || '✅'} ${formatCurrency(amount)} saqlandi!`, 'success', `${typeLabel} qo'shildi`);

      if (currentType === 'expense' && metrics.rawBudgetPercent >= 80) {
        setTimeout(() => {
          showToast(`Oylik byudjetning ${metrics.rawBudgetPercent}% qismi ishlatildi! Ehtiyotkorlik bilan sarflang.`, 'warning', 'Limit Ogohlantirishi');
        }, 900);
      }

      inputAmount.value = '';
      document.getElementById('input-note').value = '';
      inputDate.value = getTodayDateString();

      // On mobile devices, offer smooth return to dashboard or stay
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          setActiveView('dashboard');
        }, 800);
      }
    });
  }
}

// -------------------------------------------------------------------
// 11. MODALS CONTROLLER (BUDGET SETTINGS & CONFIRM DELETE)
// -------------------------------------------------------------------
function setupModals() {
  const budgetModal = document.getElementById('budget-modal');
  const confirmModal = document.getElementById('confirm-modal');
  const btnOpenBudget = document.getElementById('btn-open-budget-modal');
  const btnQuickBalance = document.getElementById('btn-quick-balance');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const settingsForm = document.getElementById('settings-form');
  const inputBalance = document.getElementById('input-modal-balance');
  const inputBudget = document.getElementById('input-modal-budget');

  const openBudgetModalHandler = () => {
    inputBalance.value = state.settings.initialBalance;
    inputBudget.value = state.settings.monthlyBudget;
    budgetModal.classList.remove('hidden');
    inputBudget.focus();
  };

  if (btnOpenBudget) btnOpenBudget.addEventListener('click', openBudgetModalHandler);
  if (btnQuickBalance) btnQuickBalance.addEventListener('click', openBudgetModalHandler);

  const closeBudgetModal = () => {
    budgetModal.classList.add('hidden');
  };
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeBudgetModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeBudgetModal);

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newBalance = parseFloat(inputBalance.value);
      const newBudget = parseFloat(inputBudget.value);

      if (isNaN(newBalance) || newBalance < 0) {
        showToast("Boshlang'ich balans noto'g'ri kiritildi!", 'warning');
        return;
      }

      if (isNaN(newBudget) || newBudget < 10000) {
        showToast("Oylik byudjet kamida 10 000 so'm bo'lishi kerak!", 'warning');
        return;
      }

      state.settings.initialBalance = Math.round(newBalance);
      state.settings.monthlyBudget = Math.round(newBudget);
      saveSettingsToStorage();

      updateDashboardUI();
      initOrUpdateChart();
      closeBudgetModal();

      showToast("Byudjet va balans muvaffaqiyatli yangilandi!", 'success');
    });
  }

  const btnCloseConfirm = document.getElementById('btn-close-confirm');
  const btnCancelConfirm = document.getElementById('btn-cancel-confirm');
  const btnAgreeConfirm = document.getElementById('btn-agree-confirm');

  const closeConfirmModal = () => {
    confirmModal.classList.add('hidden');
    state.deleteTargetId = null;
    state.isClearAllAction = false;
  };

  if (btnCloseConfirm) btnCloseConfirm.addEventListener('click', closeConfirmModal);
  if (btnCancelConfirm) btnCancelConfirm.addEventListener('click', closeConfirmModal);

  if (btnAgreeConfirm) {
    btnAgreeConfirm.addEventListener('click', () => {
      if (state.isClearAllAction) {
        state.transactions = [];
        saveTransactionsToStorage();
        updateDashboardUI();
        renderDashboardSnippet();
        initOrUpdateChart();
        renderTransactionsList();
        showToast("Barcha xarajatlar tarixi o'chirildi.", 'info');
      } else if (state.deleteTargetId) {
        const itemToDelete = state.transactions.find(t => t.id === state.deleteTargetId);
        state.transactions = state.transactions.filter(t => t.id !== state.deleteTargetId);
        saveTransactionsToStorage();
        updateDashboardUI();
        renderDashboardSnippet();
        initOrUpdateChart();
        renderTransactionsList();

        const amountFormatted = itemToDelete ? formatCurrency(itemToDelete.amount) : '';
        showToast(`${amountFormatted} miqdoridagi xarajat o'chirildi.`, 'info');
      }
      closeConfirmModal();
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === budgetModal) closeBudgetModal();
    if (e.target === confirmModal) closeConfirmModal();
  });
}

// -------------------------------------------------------------------
// 12. TOOLBAR, SEARCH, FILTERS & ACTIONS
// -------------------------------------------------------------------
function setupToolbarAndActions() {
  const searchInput = document.getElementById('search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const filterCat = document.getElementById('filter-category');
  const filterPayment = document.getElementById('filter-payment');
  const sortSelect = document.getElementById('sort-transactions');
  const btnClearAll = document.getElementById('btn-clear-all');
  const btnLoadDemo = document.getElementById('btn-load-demo');
  const btnEmptyDemo = document.getElementById('btn-empty-demo');
  const btnExportData = document.getElementById('btn-export-data');
  const btnDismissAlert = document.getElementById('btn-dismiss-alert');
  const warningBanner = document.getElementById('budget-warning-banner');

  if (searchInput) {
    const debouncedFilter = debounce(() => {
      renderTransactionsList();
    }, 120);
    searchInput.addEventListener('input', debouncedFilter);
  }

  if (btnClearSearch && searchInput) {
    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      renderTransactionsList();
      searchInput.focus();
    });
  }

  if (filterCat) filterCat.addEventListener('change', renderTransactionsList);
  if (filterPayment) filterPayment.addEventListener('change', renderTransactionsList);
  if (sortSelect) sortSelect.addEventListener('change', renderTransactionsList);

  const chartTabs = document.querySelectorAll('.chart-tab');
  chartTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      chartTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.chartPeriod = tab.dataset.period;
      initOrUpdateChart();
    });
  });

  const txListEl = document.getElementById('transactions-list');
  if (txListEl) {
    txListEl.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-item');
      if (deleteBtn) {
        const id = deleteBtn.dataset.deleteId;
        const targetTx = state.transactions.find(t => t.id === id);
        if (!targetTx) return;

        state.deleteTargetId = id;
        state.isClearAllAction = false;

        const confirmModal = document.getElementById('confirm-modal');
        const confirmText = document.getElementById('confirm-modal-text');
        const confirmTitle = document.getElementById('confirm-modal-title');

        if (confirmTitle) confirmTitle.textContent = "Xarajatni o'chirish";
        if (confirmText) {
          confirmText.textContent = `"${targetTx.note}" (${formatCurrency(targetTx.amount)}) xarajatini o'chirishga ishonchingiz komilmi?`;
        }
        if (confirmModal) confirmModal.classList.remove('hidden');
      }
    });
  }

  if (btnClearAll) {
    btnClearAll.addEventListener('click', () => {
      if (state.transactions.length === 0) {
        showToast("O'chirish uchun xarajatlar mavjud emas.", 'info');
        return;
      }
      state.isClearAllAction = true;
      state.deleteTargetId = null;

      const confirmModal = document.getElementById('confirm-modal');
      const confirmText = document.getElementById('confirm-modal-text');
      const confirmTitle = document.getElementById('confirm-modal-title');

      if (confirmTitle) confirmTitle.textContent = "Barcha xarajatlarni tozalash";
      if (confirmText) {
        confirmText.textContent = "Barcha kiritilgan xarajatlar butunlay o'chiriladi. Ushbu amalni ortga qaytarib bo'lmaydi!";
      }
      if (confirmModal) confirmModal.classList.remove('hidden');
    });
  }

  const loadDemoDataHandler = () => {
    state.transactions = getFreshDemoTransactions();
    state.settings = { ...DEFAULT_SETTINGS };
    saveTransactionsToStorage();
    saveSettingsToStorage();

    updateDashboardUI();
    renderDashboardSnippet();
    initOrUpdateChart();
    renderTransactionsList();

    showToast("Namunaviy xarajatlar muvaffaqiyatli yuklandi!", 'success', 'Demo ma\'lumotlar');
  };

  if (btnLoadDemo) btnLoadDemo.addEventListener('click', loadDemoDataHandler);
  if (btnEmptyDemo) btnEmptyDemo.addEventListener('click', loadDemoDataHandler);

  if (btnExportData) {
    btnExportData.addEventListener('click', exportToCSV);
  }

  if (btnDismissAlert && warningBanner) {
    btnDismissAlert.addEventListener('click', () => {
      warningBanner.classList.add('hidden');
    });
  }
}

// -------------------------------------------------------------------
// 13. DATA EXPORT TO CSV
// -------------------------------------------------------------------
function exportToCSV() {
  if (state.transactions.length === 0) {
    showToast("Eksport qilish uchun hech qanday ma'lumot topilmadi!", 'warning');
    return;
  }

  const headers = ["ID", "Turi", "Summa (so'm)", "Kategoriya", "To'lov turi", "Sana", "Izoh"];
  const rows = state.transactions.map(t => [
    t.id,
    t.type === 'income' ? 'Daromad' : 'Xarajat',
    t.amount,
    (CATEGORIES[t.category] || {}).name || t.category,
    t.paymentMethod === 'card' ? 'Karta' : 'Naqd pul',
    t.date,
    `"${(t.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `xarajatlar_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast("Ma'lumotlar CSV fayl ko'rinishida yuklab olindi.", 'success', 'Eksport qilindi');
}

// -------------------------------------------------------------------
// 14. DATE DISPLAY
// -------------------------------------------------------------------
function updateCurrentDateDisplay() {
  const display = document.getElementById('current-date-display');
  if (display) {
    const now = new Date();
    const day = now.getDate();
    const month = MONTH_NAMES_UZ[now.getMonth()];
    const year = now.getFullYear();
    display.textContent = `Bugun: ${day}-${month}, ${year}`;
  }
}

// -------------------------------------------------------------------
// 15. INITIALIZATION
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadStateFromStorage();
  updateCurrentDateDisplay();
  setupViewNavigation();
  setupFormHandlers();
  setupModals();
  setupToolbarAndActions();
  updateDashboardUI();
  renderDashboardSnippet();
  initOrUpdateChart();
  renderTransactionsList();

  console.log("💎 Smart Expense Tracker mobil navigatsiya va tejamkor rejimda ishga tushdi!");
});
