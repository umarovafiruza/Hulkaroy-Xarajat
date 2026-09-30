/**
 * ===================================================================
 * SMART EXPENSE TRACKER - MODERN MOBILE FINTECH ENGINE
 * Architecture: Clean Vanilla ES6+ with High Performance 60 FPS
 * Inspired by modern iOS/Android fintech mobile banking apps
 * ===================================================================
 */

'use strict';

// -------------------------------------------------------------------
// 1. CONFIGURATION & CONSTANTS
// -------------------------------------------------------------------
const STORAGE_KEYS = {
  TRANSACTIONS: 'smart_expense_transactions_v4',
  SETTINGS: 'smart_expense_settings_v4',
  ACTIVE_VIEW: 'smart_expense_active_view_v4',
  BALANCE_HIDDEN: 'smart_expense_balance_hidden_v4',
  THEME: 'smart_expense_theme_v4'
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
  initialBalance: 0,
  monthlyBudget: 0
};

// -------------------------------------------------------------------
// 2. STATE MANAGEMENT
// -------------------------------------------------------------------
let state = {
  transactions: [],
  settings: { ...DEFAULT_SETTINGS },
  currentView: 'dashboard', // 'dashboard', 'history', 'add', 'analytics'
  chartPeriod: 'month',
  selectedMonthKey: getTodayDateString().substring(0, 7), // 'YYYY-MM' e.g. '2026-09'
  deleteTargetId: null,
  isClearAllAction: false,
  isBalanceHidden: false,
  theme: 'light'
};

let categoryChartInstance = null;

// -------------------------------------------------------------------
// 3. UTILITY FUNCTIONS & HELPERS
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

function getYesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
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
  return `${num.toLocaleString('en-US')} so'm`;
}

function formatNumberWithCommas(value) {
  if (value === null || value === undefined) return '';
  const digitsOnly = String(value).replace(/\D/g, '');
  if (!digitsOnly) return '';
  return Number(digitsOnly).toLocaleString('en-US');
}

function parseFormattedNumber(value) {
  if (!value) return 0;
  const digitsOnly = String(value).replace(/\D/g, '');
  return Number(digitsOnly) || 0;
}

function attachCommaInputFormatter(inputEl) {
  if (!inputEl) return;
  inputEl.addEventListener('input', () => {
    const raw = inputEl.value;
    const formatted = formatNumberWithCommas(raw);
    inputEl.value = formatted;
  });
}

function animateCurrencyNumber(el, targetAmount, duration = 380) {
  if (!el || state.isBalanceHidden) return;
  const currentAttr = el.getAttribute('data-raw-value');
  const endNum = Math.round(targetAmount);
  
  if (currentAttr === null) {
    el.setAttribute('data-raw-value', endNum);
    el.textContent = formatCurrency(endNum);
    return;
  }
  
  const startNum = Number(currentAttr) || 0;
  el.setAttribute('data-raw-value', endNum);

  if (startNum === endNum) {
    el.textContent = formatCurrency(endNum);
    return;
  }

  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.round(startNum + (endNum - startNum) * ease);
    el.textContent = formatCurrency(currentVal);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = formatCurrency(endNum);
    }
  }
  requestAnimationFrame(step);
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
    // --- Sentabr (Joriy oy) ---
    {
      id: "tx-demo-1",
      type: "expense",
      amount: 145000,
      category: "food",
      paymentMethod: "card",
      note: "Korzinka supermarket",
      date: getTodayDateString(),
      createdAt: Date.now() - 3600000 * 2
    },
    {
      id: "tx-demo-2",
      type: "expense",
      amount: 32000,
      category: "transport",
      paymentMethod: "card",
      note: "Yandex Go taksi",
      date: getTodayDateString(),
      createdAt: Date.now() - 3600000 * 4
    },
    {
      id: "tx-demo-3",
      type: "income",
      amount: 2500000,
      category: "income",
      paymentMethod: "card",
      note: "Freelance loyiha to'lovi",
      date: getYesterdayDateString(),
      createdAt: Date.now() - 86400000
    },
    {
      id: "tx-demo-4",
      type: "expense",
      amount: 450000,
      category: "utilities",
      paymentMethod: "card",
      note: "Elektr va gaz to'lovi",
      date: getYesterdayDateString(),
      createdAt: Date.now() - 86400000 * 1.5
    },
    {
      id: "tx-demo-5",
      type: "expense",
      amount: 280000,
      category: "shopping",
      paymentMethod: "card",
      note: "Uzum Market xaridlar",
      date: getOffsetDateString(-3),
      createdAt: Date.now() - 86400000 * 3
    },
    {
      id: "tx-demo-6",
      type: "expense",
      amount: 85000,
      category: "entertainment",
      paymentMethod: "cash",
      note: "Kinoteatr chiptasi & qahva",
      date: getOffsetDateString(-5),
      createdAt: Date.now() - 86400000 * 5
    },

    // --- Avgust 2026 ---
    {
      id: "tx-demo-aug-1",
      type: "income",
      amount: 5000000,
      category: "income",
      paymentMethod: "card",
      note: "Oylik maosh",
      date: "2026-08-05",
      createdAt: Date.now() - 86400000 * 40
    },
    {
      id: "tx-demo-aug-2",
      type: "expense",
      amount: 1250000,
      category: "food",
      paymentMethod: "card",
      note: "Oylik katta bozorlik",
      date: "2026-08-10",
      createdAt: Date.now() - 86400000 * 35
    },
    {
      id: "tx-demo-aug-3",
      type: "expense",
      amount: 450000,
      category: "education",
      paymentMethod: "card",
      note: "Maktab va kitoblar xaridi",
      date: "2026-08-18",
      createdAt: Date.now() - 86400000 * 27
    },
    {
      id: "tx-demo-aug-4",
      type: "expense",
      amount: 380000,
      category: "utilities",
      paymentMethod: "card",
      note: "Kommunal to'lovlar (Avgust)",
      date: "2026-08-22",
      createdAt: Date.now() - 86400000 * 23
    },
    {
      id: "tx-demo-aug-5",
      type: "expense",
      amount: 120000,
      category: "health",
      paymentMethod: "cash",
      note: "Dorixona va vitaminlar",
      date: "2026-08-28",
      createdAt: Date.now() - 86400000 * 17
    },

    // --- Iyul 2026 ---
    {
      id: "tx-demo-jul-1",
      type: "income",
      amount: 5000000,
      category: "income",
      paymentMethod: "card",
      note: "Oylik maosh",
      date: "2026-07-05",
      createdAt: Date.now() - 86400000 * 70
    },
    {
      id: "tx-demo-jul-2",
      type: "expense",
      amount: 1650000,
      category: "entertainment",
      paymentMethod: "card",
      note: "Tog'da dam olish maskani",
      date: "2026-07-12",
      createdAt: Date.now() - 86400000 * 63
    },
    {
      id: "tx-demo-jul-3",
      type: "expense",
      amount: 880000,
      category: "food",
      paymentMethod: "card",
      note: "Yozgi meva-cheva va bozorlik",
      date: "2026-07-19",
      createdAt: Date.now() - 86400000 * 56
    },
    {
      id: "tx-demo-jul-4",
      type: "expense",
      amount: 310000,
      category: "utilities",
      paymentMethod: "card",
      note: "Elektr va suv to'lovi",
      date: "2026-07-24",
      createdAt: Date.now() - 86400000 * 51
    },

    // --- Iyun 2026 ---
    {
      id: "tx-demo-jun-1",
      type: "income",
      amount: 4800000,
      category: "income",
      paymentMethod: "card",
      note: "Oylik maosh",
      date: "2026-06-05",
      createdAt: Date.now() - 86400000 * 100
    },
    {
      id: "tx-demo-jun-2",
      type: "expense",
      amount: 950000,
      category: "food",
      paymentMethod: "card",
      note: "Chorsu bozorlik",
      date: "2026-06-14",
      createdAt: Date.now() - 86400000 * 91
    },
    {
      id: "tx-demo-jun-3",
      type: "expense",
      amount: 650000,
      category: "shopping",
      paymentMethod: "card",
      note: "Yozgi kiyim-kechak",
      date: "2026-06-20",
      createdAt: Date.now() - 86400000 * 85
    },
    {
      id: "tx-demo-jun-4",
      type: "expense",
      amount: 270000,
      category: "utilities",
      paymentMethod: "card",
      note: "Kommunal to'lovlar",
      date: "2026-06-26",
      createdAt: Date.now() - 86400000 * 79
    }
  ];
}

// -------------------------------------------------------------------
// 4. VIEW / SCREEN CONTROLLER (MOBILE TABS)
// -------------------------------------------------------------------
function setActiveView(viewName) {
  state.currentView = viewName;
  document.body.dataset.activeView = viewName;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_VIEW, viewName);

  // Update Floating Bottom Navigation buttons
  const floatingBtns = document.querySelectorAll('.mobile-floating-nav .nav-circle-btn[data-view]');
  floatingBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Top nav buttons (hidden compatibility)
  const topTabs = document.querySelectorAll('.nav-tab-btn');
  topTabs.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Dynamic refresh for specific views
  if (viewName === 'analytics') {
    initOrUpdateChart();
    if (categoryChartInstance) {
      setTimeout(() => categoryChartInstance.resize(), 50);
    }
  }

  if (viewName === 'history') {
    renderTransactionsList();
  }

  if (viewName === 'dashboard') {
    updateDashboardUI();
    renderDashboardSnippet();
  }

  if (viewName === 'add') {
    updatePayScreenAvailableBalance();
  }

  // Smooth scroll container to top
  const scrollArea = document.querySelector('.app-content-scroll');
  if (scrollArea) {
    scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function setupViewNavigation() {
  // Floating bottom bar buttons
  const floatingNav = document.querySelector('.mobile-floating-nav');
  if (floatingNav) {
    floatingNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-circle-btn[data-view]');
      if (btn && btn.dataset.view) {
        setActiveView(btn.dataset.view);
      }
    });
  }

  // In-page quick action buttons (data-action="switch-view")
  document.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action="switch-view"]');
    if (actionBtn && actionBtn.dataset.target) {
      const targetView = actionBtn.dataset.target;
      
      // If clicking Chiqim / Kirim quick actions on Hero card
      if (targetView === 'add' && actionBtn.dataset.mode) {
        setTransactionType(actionBtn.dataset.mode);
      }
      
      setActiveView(targetView);
    }
  });

  // Initialize initial view (Default 'dashboard')
  const savedView = localStorage.getItem(STORAGE_KEYS.ACTIVE_VIEW);
  const initialView = savedView || 'dashboard';
  setActiveView(initialView);
}

// -------------------------------------------------------------------
// 4.1. THEME CONTROLLER (LIGHT / DARK MOOD)
// -------------------------------------------------------------------
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.body.classList.toggle('dark-theme', theme === 'dark');
  localStorage.setItem(STORAGE_KEYS.THEME, theme);

  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    if (theme === 'dark') {
      themeIcon.className = 'fa-solid fa-sun';
      themeIcon.style.color = '#fbf279';
    } else {
      themeIcon.className = 'fa-regular fa-moon';
      themeIcon.style.color = '';
    }
  }

  // Update chart border for contrast in dark mode
  if (categoryChartInstance) {
    categoryChartInstance.data.datasets[0].borderColor = theme === 'dark' ? '#1a231f' : '#ffffff';
    categoryChartInstance.update('none');
  }
}

function toggleTheme() {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  const msg = newTheme === 'dark' ? "Tungi rejim yoqildi 🌙" : "Kunduzgi rejim yoqildi ☀️";
  showToast(msg, 'info');
}

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    // Respect system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
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
      // Yangi foydalanuvchi birinchi marta kirganda toza no'l ma'lumotlar bilan boshlaydi
      state.transactions = [];
      saveTransactionsToStorage();
    }

    const storedHidden = localStorage.getItem(STORAGE_KEYS.BALANCE_HIDDEN);
    if (storedHidden !== null) {
      state.isBalanceHidden = storedHidden === 'true';
    }
  } catch (err) {
    console.error("Storage loading error:", err);
    state.transactions = [];
    state.settings = { ...DEFAULT_SETTINGS };
  }
}


function saveTransactionsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
  } catch (err) {
    console.error("Failed to save transactions:", err);
    showToast("Ma'lumotlarni saqlashda xatolik yuz berdi!", 'error');
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

  let iconClass = 'fa-solid fa-circle-info';
  let defaultTitle = 'Eslatma';

  if (type === 'success') {
    iconClass = 'fa-solid fa-circle-check';
    defaultTitle = 'Muvaffaqiyatli';
  } else if (type === 'warning') {
    iconClass = 'fa-solid fa-triangle-exclamation';
    defaultTitle = 'Diqqat';
  } else if (type === 'error') {
    iconClass = 'fa-solid fa-circle-xmark';
    defaultTitle = 'Xatolik';
  }

  toast.innerHTML = `
    <i class="${iconClass} toast-icon"></i>
    <div class="toast-content">
      <strong>${title || defaultTitle}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 280);
  }, 3200);
}

// -------------------------------------------------------------------
// 7. FINANCIAL METRICS & DASHBOARD ENGINE
// -------------------------------------------------------------------
function computeFinancialMetrics() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayStr = getTodayDateString();

  let totalExpenseAllTime = 0;
  let totalIncomeAllTime = 0;
  let monthlyExpense = 0;
  let todayExpense = 0;
  let todayCount = 0;
  let monthlyCount = 0;

  for (let i = 0; i < state.transactions.length; i++) {
    const tx = state.transactions[i];
    const amt = Number(tx.amount) || 0;

    if (tx.type === 'income') {
      totalIncomeAllTime += amt;
    } else {
      totalExpenseAllTime += amt;

      if (tx.date === todayStr) {
        todayExpense += amt;
        todayCount++;
      }

      if (tx.date) {
        const [txYear, txMonth] = tx.date.split('-').map(Number);
        if (txYear === currentYear && txMonth === currentMonth) {
          monthlyExpense += amt;
          monthlyCount++;
        }
      }
    }
  }

  const initialBalance = Number(state.settings.initialBalance) || 0;
  const totalBalance = initialBalance + totalIncomeAllTime - totalExpenseAllTime;
  const budget = Number(state.settings.monthlyBudget) || 0;
  const budgetRemaining = budget > 0 ? Math.max(0, budget - monthlyExpense) : 0;
  const rawBudgetPercent = budget > 0 ? Math.round((monthlyExpense / budget) * 100) : 0;
  const budgetPercent = Math.min(100, Math.max(0, rawBudgetPercent));
  const daysInCurrentMonthSoFar = Math.max(1, now.getDate());
  const avgDaily = Math.round(monthlyExpense / daysInCurrentMonthSoFar);

  return {
    totalBalance,
    monthlyExpense,
    todayExpense,
    todayCount,
    monthlyCount,
    budget,
    budgetRemaining,
    budgetPercent,
    rawBudgetPercent,
    avgDaily
  };
}

function updateDashboardUI() {
  const metrics = computeFinancialMetrics();

  // 1. Total Balance on Hero Card
  const elBalance = document.getElementById('stat-total-balance');
  const eyeIcon = document.getElementById('eye-icon');
  
  if (elBalance) {
    if (state.isBalanceHidden) {
      elBalance.textContent = '••••••••';
      if (eyeIcon) {
        eyeIcon.className = 'fa-regular fa-eye-slash';
      }
    } else {
      animateCurrencyNumber(elBalance, metrics.totalBalance);
      if (eyeIcon) {
        eyeIcon.className = 'fa-regular fa-eye';
      }
    }
    elBalance.classList.toggle('text-danger', metrics.totalBalance < 0);
  }

  // 2. Budget Progress Bar inside Hero
  const elProgressBar = document.getElementById('budget-progress-bar');
  const elBudgetBadge = document.getElementById('budget-percent-badge');
  const elSpentText = document.getElementById('budget-spent-text');

  if (elProgressBar) {
    elProgressBar.style.width = `${metrics.budgetPercent}%`;
    elProgressBar.className = 'progress-bar-fill';
    if (metrics.rawBudgetPercent >= 100) {
      elProgressBar.classList.add('danger');
    } else if (metrics.rawBudgetPercent >= 80) {
      elProgressBar.classList.add('warning');
    }
  }

  if (elBudgetBadge) {
    elBudgetBadge.textContent = `${metrics.rawBudgetPercent}%`;
  }

  if (elSpentText) {
    elSpentText.textContent = `${formatCurrency(metrics.monthlyExpense)} sarflandi`;
  }

  // 3. Currency / Stats Cards
  const elBudget = document.getElementById('stat-monthly-budget');
  const elRemaining = document.getElementById('budget-remaining-text');
  if (elBudget) elBudget.textContent = formatCurrency(metrics.budget);
  if (elRemaining) {
    elRemaining.textContent = `Qoldi: ${formatCurrency(metrics.budgetRemaining)}`;
  }

  const elToday = document.getElementById('stat-today-expense');
  const elTodayCount = document.getElementById('stat-today-count');
  if (elToday) elToday.textContent = formatCurrency(metrics.todayExpense);
  if (elTodayCount) elTodayCount.textContent = `${metrics.todayCount} ta to'lov`;

  // Hidden trackers for complete compatibility
  const elMonthly = document.getElementById('stat-monthly-expense');
  const elMonthlyCount = document.getElementById('stat-monthly-count');
  const elAvgDaily = document.getElementById('stat-avg-daily');
  if (elMonthly) elMonthly.textContent = formatCurrency(metrics.monthlyExpense);
  if (elMonthlyCount) elMonthlyCount.textContent = `${metrics.monthlyCount} ta to'lov`;
  if (elAvgDaily) elAvgDaily.textContent = `O'rtacha: ${formatCurrency(metrics.avgDaily)}`;

  // 4. Budget Warning Banner (>80%)
  const warningBanner = document.getElementById('budget-warning-banner');
  const alertTitle = document.getElementById('alert-title');
  const alertDesc = document.getElementById('alert-desc');

  if (warningBanner) {
    if (metrics.rawBudgetPercent >= 80) {
      warningBanner.classList.remove('hidden');
      if (metrics.rawBudgetPercent >= 100) {
        if (alertTitle) alertTitle.textContent = `Diqqat: Oylik byudjet ${metrics.rawBudgetPercent}% oshib ketdi!`;
        if (alertDesc) alertDesc.textContent = `Limitdan ${formatCurrency(metrics.monthlyExpense - metrics.budget)} ko'proq sarflandi.`;
      } else {
        if (alertTitle) alertTitle.textContent = `Diqqat: Byudjetning ${metrics.rawBudgetPercent}% sarflab bo'lindi!`;
        if (alertDesc) alertDesc.textContent = `Qolgan mablag': ${formatCurrency(metrics.budgetRemaining)}.`;
      }
    } else {
      warningBanner.classList.add('hidden');
    }
  }

  updatePayScreenAvailableBalance();
}

function updatePayScreenAvailableBalance() {
  const elPayBal = document.getElementById('pay-available-balance');
  if (elPayBal) {
    const metrics = computeFinancialMetrics();
    elPayBal.textContent = formatCurrency(metrics.totalBalance);
  }
}

/**
 * Renders the 3 most recent transactions on the Dashboard (Home)
 */
function renderDashboardSnippet() {
  const container = document.getElementById('dashboard-snippet-list');
  if (!container) return;

  const top3 = state.transactions.slice(0, 3);
  if (top3.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 20px;">
        Hali xarajatlar mavjud emas.
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
      <li class="transaction-item">
        <div class="t-left">
          <div class="t-icon-box" style="background: ${cat.color}15; color: ${cat.color};">
            <span>${cat.emoji}</span>
          </div>
          <div class="t-details">
            <span class="t-title">${escapeHtml(tx.note || cat.name)}</span>
            <div class="t-meta-row">
              <span>${formatDateUZ(tx.date)}</span>
            </div>
          </div>
        </div>
        <div class="t-right">
          <span class="t-amount ${amountClass}">
            ${sign} ${formatCurrency(tx.amount)}
          </span>
        </div>
      </li>
    `;
  }
  container.innerHTML = html;
}

// -------------------------------------------------------------------
// 8. OYLIK TAHLIL VA ARXIV MOTOR (MONTH-BY-MONTH ANALYTICS & STATS)
// -------------------------------------------------------------------

function getMonthNameUZ(yearMonthStr) {
  if (!yearMonthStr || yearMonthStr === 'all') return 'Barcha Oylar';
  const parts = yearMonthStr.split('-');
  if (parts.length < 2) return yearMonthStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES_UZ[monthIdx] || '';
  return `${monthName}, ${year}`;
}

function getAllUniqueMonths() {
  const monthsSet = new Set();
  
  // Always include the last 8 months dynamically (Sentabr, Avgust, Iyul, Iyun, May, Aprel...)
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(ym);
  }

  // Include any other months that exist in transactions
  for (let i = 0; i < state.transactions.length; i++) {
    const d = state.transactions[i].date;
    if (d && d.length >= 7) {
      monthsSet.add(d.substring(0, 7));
    }
  }

  // Include currently selected month if valid
  if (state.selectedMonthKey && state.selectedMonthKey !== 'all') {
    monthsSet.add(state.selectedMonthKey);
  }

  const sorted = Array.from(monthsSet);
  sorted.sort().reverse();
  return sorted;
}

function changeSelectedMonth(monthKey) {
  state.selectedMonthKey = monthKey;
  updateMonthlyAnalyticsUI();
}

function stepMonth(direction) {
  // direction: -1 = previous month (back in time: Sentabr -> Avgust)
  // direction: +1 = next month (forward in time: Avgust -> Sentabr)
  if (!state.selectedMonthKey || state.selectedMonthKey === 'all') {
    const now = new Date();
    state.selectedMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  } else {
    const parts = state.selectedMonthKey.split('-');
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);

    if (direction < 0) {
      // Oldingi oyga o'tish (Orqaga)
      month -= 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
    } else {
      // Keyingi oyga o'tish (Oldinga)
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    state.selectedMonthKey = `${year}-${String(month).padStart(2, '0')}`;
  }

  updateMonthlyAnalyticsUI();
}



function updateMonthlyAnalyticsUI() {
  const monthDisplay = document.getElementById('selected-month-display');
  const chartBadge = document.getElementById('chart-month-badge');
  const monthTitle = getMonthNameUZ(state.selectedMonthKey);

  if (monthDisplay) monthDisplay.textContent = monthTitle;
  if (chartBadge) chartBadge.textContent = monthTitle;

  // Filter transactions for chosen month
  let txs = state.transactions;
  if (state.selectedMonthKey !== 'all') {
    txs = txs.filter(t => t.date && t.date.startsWith(state.selectedMonthKey));
  }

  let totalIncome = 0;
  let incomeCount = 0;
  let totalExpense = 0;
  let expenseCount = 0;
  const categoryTotals = {};

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amt;
      incomeCount++;
    } else {
      totalExpense += amt;
      expenseCount++;
      const cat = tx.category || 'other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    }
  }

  const netSavings = totalIncome - totalExpense;

  // Metric 1: Kirim
  const elIncome = document.getElementById('month-total-income');
  const elIncomeCount = document.getElementById('month-income-count');
  if (elIncome) elIncome.textContent = `+${formatCurrency(totalIncome)}`;
  if (elIncomeCount) elIncomeCount.textContent = `${incomeCount} ta daromad`;

  // Metric 2: Chiqim
  const elExpense = document.getElementById('month-total-expense');
  const elExpenseCount = document.getElementById('month-expense-count');
  if (elExpense) elExpense.textContent = `-${formatCurrency(totalExpense)}`;
  if (elExpenseCount) elExpenseCount.textContent = `${expenseCount} ta to'lov`;

  // Metric 3: Tejalgan Qoldiq
  const elSavings = document.getElementById('month-net-savings');
  const elSavingsStatus = document.getElementById('month-savings-status');
  if (elSavings) {
    if (netSavings >= 0) {
      elSavings.textContent = `+${formatCurrency(netSavings)}`;
      elSavings.className = 'metric-value text-success';
      if (elSavingsStatus) elSavingsStatus.textContent = 'Ortib qoldi (Tejaldi)';
    } else {
      elSavings.textContent = `-${formatCurrency(Math.abs(netSavings))}`;
      elSavings.className = 'metric-value text-danger';
      if (elSavingsStatus) elSavingsStatus.textContent = 'Ortiqcha sarf (Kamomad)';
    }
  }

  // Metric 4: Byudjet holati
  const elBudgetPct = document.getElementById('month-budget-percent');
  const elBudgetBar = document.getElementById('month-mini-bar-fill');
  const monthlyBudget = Number(state.settings.monthlyBudget) || 1;
  const budgetPct = Math.round((totalExpense / monthlyBudget) * 100);

  if (elBudgetPct) elBudgetPct.textContent = `${budgetPct}%`;
  if (elBudgetBar) {
    elBudgetBar.style.width = `${Math.min(100, budgetPct)}%`;
    if (budgetPct >= 100) {
      elBudgetBar.style.background = 'var(--accent-danger)';
    } else if (budgetPct >= 80) {
      elBudgetBar.style.background = '#f59e0b';
    } else {
      elBudgetBar.style.background = 'var(--text-primary)';
    }
  }

  // Update Center Total & Breakdown
  const centerAmount = document.getElementById('center-amount');
  if (centerAmount) centerAmount.textContent = formatCurrency(totalExpense);
  renderCategoryBreakdown(categoryTotals, totalExpense);
  updateChartWithData(categoryTotals, totalExpense);

  // Render Month Transactions List
  renderMonthTransactionsList(txs);
}

function updateChartWithData(categoryTotals, totalSpent) {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;

  const categoriesWithData = Object.keys(categoryTotals).filter(cat => categoryTotals[cat] > 0);
  let labels = [];
  let data = [];
  let colors = [];

  if (categoriesWithData.length === 0) {
    labels = ["Xarajat yo'q"];
    data = [1];
    colors = ["#e2e8e4"];
  } else {
    for (let i = 0; i < categoriesWithData.length; i++) {
      const cat = categoriesWithData[i];
      const meta = CATEGORIES[cat] || CATEGORIES.other;
      labels.push(`${meta.emoji} ${meta.name}`);
      data.push(categoryTotals[cat]);
      colors.push(meta.color);
    }
  }

  const borderColor = state.theme === 'dark' ? '#1a231f' : '#ffffff';

  if (categoryChartInstance) {
    categoryChartInstance.data.labels = labels;
    categoryChartInstance.data.datasets[0].data = data;
    categoryChartInstance.data.datasets[0].backgroundColor = colors;
    categoryChartInstance.data.datasets[0].borderColor = borderColor;
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
          borderColor: borderColor,
          borderWidth: 3,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#121413',
            titleColor: '#ffffff',
            bodyColor: '#e4ece7',
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              label: function (context) {
                if (categoriesWithData.length === 0) return " Xarajat yo'q";
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

  const categoriesWithData = Object.keys(categoryTotals).filter(cat => categoryTotals[cat] > 0);

  if (categoriesWithData.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 20px;">
        Tanlangan oy bo'yicha xarajatlar mavjud emas.
      </div>
    `;
    return;
  }

  categoriesWithData.sort((a, b) => categoryTotals[b] - categoryTotals[a]);

  let html = '';
  for (let i = 0; i < categoriesWithData.length; i++) {
    const cat = categoriesWithData[i];
    const meta = CATEGORIES[cat] || CATEGORIES.other;
    const amount = categoryTotals[cat];
    const percent = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;

    html += `
      <div class="breakdown-item">
        <div class="breakdown-row">
          <div class="breakdown-cat-name">
            <span>${meta.emoji}</span>
            <span>${meta.name}</span>
          </div>
          <span>${formatCurrency(amount)} (${percent}%)</span>
        </div>
        <div class="breakdown-bar-bg">
          <div class="breakdown-bar-fill" style="width: ${percent}%; background: ${meta.color};"></div>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function renderMonthTransactionsList(monthTxs) {
  const container = document.getElementById('month-transactions-list');
  const countBadge = document.getElementById('month-tx-total-count');
  if (!container) return;

  if (countBadge) {
    countBadge.textContent = `${monthTxs.length} ta yozuv`;
  }

  if (monthTxs.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 20px;">
        Tanlangan oyda amaliyotlar mavjud emas.
      </div>
    `;
    return;
  }

  let html = '';
  for (let i = 0; i < monthTxs.length; i++) {
    const tx = monthTxs[i];
    const isExpense = tx.type === 'expense';
    const cat = isExpense ? (CATEGORIES[tx.category] || CATEGORIES.other) : CATEGORIES.income;
    const sign = isExpense ? '-' : '+';
    const amountClass = isExpense ? 'expense' : 'income';
    const paymentLabel = tx.paymentMethod === 'card' ? '💳 Karta' : '💵 Naqd';

    html += `
      <li class="transaction-item">
        <div class="t-left">
          <div class="t-icon-box" style="background: ${cat.color}15; color: ${cat.color};">
            <span>${cat.emoji}</span>
          </div>
          <div class="t-details">
            <span class="t-title">${escapeHtml(tx.note || cat.name)}</span>
            <div class="t-meta-row">
              <span class="t-badge-payment">${paymentLabel}</span>
              <span>•</span>
              <span>${formatDateUZ(tx.date)}</span>
            </div>
          </div>
        </div>
        <div class="t-right">
          <span class="t-amount ${amountClass}">
            ${sign} ${formatCurrency(tx.amount)}
          </span>
        </div>
      </li>
    `;
  }
  container.innerHTML = html;
}

function exportCurrentMonthCSV() {
  let txs = state.transactions;
  if (state.selectedMonthKey !== 'all') {
    txs = txs.filter(t => t.date && t.date.startsWith(state.selectedMonthKey));
  }
  if (txs.length === 0) {
    showToast("Tanlangan oyda eksport qilish uchun ma'lumot yo'q!", 'warning');
    return;
  }
  const headers = ["ID", "Turi", "Summa (so'm)", "Kategoriya", "To'lov turi", "Sana", "Izoh"];
  const rows = txs.map(t => [
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
  const monthName = state.selectedMonthKey === 'all' ? 'barcha_oylar' : state.selectedMonthKey;
  link.setAttribute('download', `hisobot_${monthName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast("Oylik hisobot CSV faylda yuklab olindi!", 'success');
}

function initOrUpdateChart() {
  updateMonthlyAnalyticsUI();
}

// -------------------------------------------------------------------
// 9. TRANSACTIONS LIST & GROUPING BY DATE (From Screenshot)
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

  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  let html = '';
  let lastGroupHeader = null;

  for (let i = 0; i < items.length; i++) {
    const tx = items[i];
    const isExpense = tx.type === 'expense';
    const cat = isExpense ? (CATEGORIES[tx.category] || CATEGORIES.other) : CATEGORIES.income;
    const paymentLabel = tx.paymentMethod === 'card' ? '💳 Karta' : '💵 Naqd';
    const sign = isExpense ? '-' : '+';
    const amountClass = isExpense ? 'expense' : 'income';

    // Grouping by Date (Today, Yesterday, Date)
    let currentGroupHeader = '';
    if (tx.date === todayStr) {
      currentGroupHeader = 'Today (Bugun)';
    } else if (tx.date === yesterdayStr) {
      currentGroupHeader = 'Yesterday (Kecha)';
    } else {
      currentGroupHeader = formatDateUZ(tx.date);
    }

    if (currentGroupHeader !== lastGroupHeader) {
      html += `
        <li style="list-style: none; padding: 10px 4px 2px; font-size: 0.76rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">
          ${currentGroupHeader}
        </li>
      `;
      lastGroupHeader = currentGroupHeader;
    }

    html += `
      <li class="transaction-item" data-id="${tx.id}">
        <div class="t-left">
          <div class="t-icon-box" style="background: ${cat.color}15; color: ${cat.color};">
            <span>${cat.emoji}</span>
          </div>
          <div class="t-details">
            <div class="t-title-row">
              <span class="t-title" title="${escapeHtml(tx.note || cat.name)}">${escapeHtml(tx.note || cat.name)}</span>
              <span class="t-badge-category">${cat.name}</span>
            </div>
            <div class="t-meta-row">
              <span class="t-badge-payment">${paymentLabel}</span>
              <span>•</span>
              <span>${formatDateUZ(tx.date)}</span>
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
            aria-label="O'chirish"
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
// 10. PAY / ADD TRANSACTION FORM LOGIC
// -------------------------------------------------------------------
function setTransactionType(type) {
  // Update mini toggle on Pay screen
  const miniBtns = document.querySelectorAll('.mini-type-btn');
  miniBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  // Update title
  const payTitle = document.getElementById('pay-screen-title');
  if (payTitle) {
    payTitle.textContent = type === 'expense' ? 'Pay (Chiqim)' : 'Transfer (Kirim)';
  }

  // Update hidden type toggle
  const legacyBtns = document.querySelectorAll('.type-btn');
  legacyBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  const categoryGroup = document.getElementById('category-group');
  if (categoryGroup) {
    categoryGroup.style.display = type === 'income' ? 'none' : 'block';
  }

  if (type === 'income') {
    const payCatName = document.getElementById('pay-category-name');
    const payCatEmoji = document.getElementById('pay-category-emoji');
    const payCatSub = document.getElementById('pay-category-subtitle');
    if (payCatName) payCatName.textContent = "Daromad";
    if (payCatEmoji) payCatEmoji.textContent = "💰";
    if (payCatSub) payCatSub.textContent = "Kirim amaliyoti";
  } else {
    const selectedCatInput = document.getElementById('selected-category');
    const currentCat = selectedCatInput ? selectedCatInput.value : 'food';
    const catMeta = CATEGORIES[currentCat] || CATEGORIES.food;
    const payCatName = document.getElementById('pay-category-name');
    const payCatEmoji = document.getElementById('pay-category-emoji');
    const payCatSub = document.getElementById('pay-category-subtitle');
    if (payCatName) payCatName.textContent = catMeta.name;
    if (payCatEmoji) payCatEmoji.textContent = catMeta.emoji;
    if (payCatSub) payCatSub.textContent = "Kategoriya tanlandi";
  }
}

function setupFormHandlers() {
  const form = document.getElementById('transaction-form');
  const catPills = document.querySelectorAll('.cat-pill');
  const selectedCatInput = document.getElementById('selected-category');
  const chips = document.querySelectorAll('.chip');
  const inputAmount = document.getElementById('input-amount');
  const inputDate = document.getElementById('input-date');
  const categoryGroup = document.getElementById('category-group');

  if (inputDate) {
    inputDate.value = getTodayDateString();
  }

  // Mini Type Buttons
  const miniTypeBtns = document.querySelectorAll('.mini-type-btn');
  miniTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setTransactionType(btn.dataset.type);
    });
  });

  // Category Selection
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const catKey = pill.dataset.cat;
      if (selectedCatInput) selectedCatInput.value = catKey;

      const catMeta = CATEGORIES[catKey] || CATEGORIES.other;
      const payCatName = document.getElementById('pay-category-name');
      const payCatEmoji = document.getElementById('pay-category-emoji');
      if (payCatName) payCatName.textContent = catMeta.name;
      if (payCatEmoji) payCatEmoji.textContent = catMeta.emoji;
    });
  });

  // Toggle Category Grid
  const btnToggleCat = document.getElementById('btn-toggle-category-picker');
  if (btnToggleCat && categoryGroup) {
    btnToggleCat.addEventListener('click', () => {
      const isVisible = categoryGroup.style.display !== 'none';
      categoryGroup.style.display = isVisible ? 'none' : 'block';
    });
  }

  attachCommaInputFormatter(inputAmount);

  // Quick Amount Chips
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const chipVal = Number(chip.dataset.amount) || 0;
      const currentVal = parseFormattedNumber(inputAmount.value);
      inputAmount.value = formatNumberWithCommas(currentVal + chipVal);
      inputAmount.focus();
    });
  });

  // Form Submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const activeMiniBtn = document.querySelector('.mini-type-btn.active');
      const type = activeMiniBtn ? activeMiniBtn.dataset.type : 'expense';
      const amount = parseFormattedNumber(inputAmount.value);
      const category = type === 'expense' ? (selectedCatInput.value || 'food') : 'income';
      const note = document.getElementById('input-note').value.trim();
      const date = inputDate.value || getTodayDateString();
      const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'card';

      if (!amount || amount <= 0) {
        showToast("Iltimos, amaliyot summasini to'g'ri kiriting!", 'warning');
        inputAmount.focus();
        return;
      }

      if (!note) {
        showToast("Iltimos, qisqa izoh yoki nomini kiriting!", 'warning');
        document.getElementById('input-note').focus();
        return;
      }

      const newTx = {
        id: generateId(),
        type,
        amount,
        category,
        paymentMethod,
        note,
        date,
        createdAt: Date.now()
      };

      state.transactions.unshift(newTx);
      saveTransactionsToStorage();

      updateDashboardUI();
      renderDashboardSnippet();
      initOrUpdateChart();
      renderTransactionsList();

      const signLabel = type === 'expense' ? "Xarajat" : "Daromad";
      showToast(`${signLabel}: ${formatCurrency(amount)} muvaffaqiyatli saqlandi!`, 'success');

      // Reset form
      inputAmount.value = '';
      document.getElementById('input-note').value = '';

      // Return to Dashboard screen
      setActiveView('dashboard');
    });
  }
}

// -------------------------------------------------------------------
// 11. MODAL DIALOGS (SETTINGS & CONFIRM)
// -------------------------------------------------------------------
function setupModals() {
  const budgetModal = document.getElementById('budget-modal');
  const confirmModal = document.getElementById('confirm-modal');
  const btnOpenBudget = document.getElementById('btn-open-budget-modal');
  const btnQuickBalance = document.getElementById('btn-quick-balance');
  const btnCardSettings = document.getElementById('btn-card-add-settings');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const settingsForm = document.getElementById('settings-form');
  const inputBalance = document.getElementById('input-modal-balance');
  const inputBudget = document.getElementById('input-modal-budget');

  attachCommaInputFormatter(inputBalance);
  attachCommaInputFormatter(inputBudget);

  const openBudgetModal = () => {
    if (inputBalance) inputBalance.value = formatNumberWithCommas(state.settings.initialBalance);
    if (inputBudget) inputBudget.value = formatNumberWithCommas(state.settings.monthlyBudget);
    if (budgetModal) budgetModal.classList.remove('hidden');
  };

  const closeBudgetModal = () => {
    if (budgetModal) budgetModal.classList.add('hidden');
  };

  if (btnOpenBudget) btnOpenBudget.addEventListener('click', openBudgetModal);
  if (btnQuickBalance) btnQuickBalance.addEventListener('click', openBudgetModal);
  if (btnCardSettings) btnCardSettings.addEventListener('click', openBudgetModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeBudgetModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeBudgetModal);

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newBal = parseFormattedNumber(inputBalance.value);
      const newBud = parseFormattedNumber(inputBudget.value);

      if (isNaN(newBal) || newBal < 0) {
        showToast("Balans summasini to'g'ri kiriting!", 'warning');
        return;
      }

      if (isNaN(newBud) || newBud <= 0) {
        showToast("Oylik byudjet summasini to'g'ri kiriting!", 'warning');
        return;
      }

      state.settings.initialBalance = newBal;
      state.settings.monthlyBudget = newBud;
      saveSettingsToStorage();

      updateDashboardUI();
      closeBudgetModal();
      showToast("Balans va oylik byudjet muvaffaqiyatli saqlandi!", 'success');
    });
  }

  // Delete Confirm Modal
  const btnCloseConfirm = document.getElementById('btn-close-confirm');
  const btnCancelConfirm = document.getElementById('btn-cancel-confirm');
  const btnAgreeConfirm = document.getElementById('btn-agree-confirm');

  const closeConfirmModal = () => {
    if (confirmModal) confirmModal.classList.add('hidden');
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
        showToast("Barcha xarajatlar butunlay tozalab tashlandi!", 'info');
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
// 12. TOOLBAR, SEARCH, FILTERS & INTERACTIONS
// -------------------------------------------------------------------
function setupToolbarAndActions() {
  const searchInput = document.getElementById('search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const filterCat = document.getElementById('filter-category');
  const filterPayment = document.getElementById('filter-payment');
  const sortSelect = document.getElementById('sort-transactions');
  const btnClearAll = document.getElementById('btn-clear-all');
  const btnDismissAlert = document.getElementById('budget-warning-banner')?.querySelector('.btn-close');
  const warningBanner = document.getElementById('budget-warning-banner');

  // Search input debounced
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

  // Toggle Search input on History screen
  const btnToggleSearch = document.getElementById('btn-toggle-search');
  const searchContainer = document.getElementById('history-search-container');
  if (btnToggleSearch && searchContainer) {
    btnToggleSearch.addEventListener('click', () => {
      searchContainer.classList.toggle('active');
      if (searchContainer.classList.contains('active') && searchInput) {
        searchInput.focus();
      }
    });
  }

  // Theme toggle button (Light / Dark)
  const btnToggleTheme = document.getElementById('btn-toggle-theme');
  if (btnToggleTheme) {
    btnToggleTheme.addEventListener('click', toggleTheme);
  }

  // Eye toggle on Hero Balance
  const btnToggleEye = document.getElementById('btn-toggle-eye');
  if (btnToggleEye) {
    btnToggleEye.addEventListener('click', () => {
      state.isBalanceHidden = !state.isBalanceHidden;
      localStorage.setItem(STORAGE_KEYS.BALANCE_HIDDEN, String(state.isBalanceHidden));
      updateDashboardUI();
    });
  }

  // Horizontal Category Filter Chips on History screen
  const catFilterChips = document.querySelectorAll('.cat-filter-chip');
  catFilterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      catFilterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filterVal = chip.dataset.filter;
      if (filterCat) {
        filterCat.value = filterVal;
        renderTransactionsList();
      }
    });
  });

  // Card selector pill on History screen (•••• 2872 ⌵)
  const cardPillTrigger = document.getElementById('card-pill-trigger');
  const cardLabel = document.getElementById('selected-card-label');
  if (cardPillTrigger && filterPayment) {
    let modeIndex = 0;
    const modes = [
      { val: 'all', label: '•••• 2872 (Barchasi)' },
      { val: 'card', label: '•••• 2872 (Karta)' },
      { val: 'cash', label: '💵 Naqd pul' }
    ];

    cardPillTrigger.addEventListener('click', () => {
      modeIndex = (modeIndex + 1) % modes.length;
      filterPayment.value = modes[modeIndex].val;
      if (cardLabel) cardLabel.textContent = modes[modeIndex].label;
      renderTransactionsList();
    });
  }

  // Payment method pill on Pay screen
  const payMethodPill = document.getElementById('pay-method-pill');
  const payCardLabel = document.getElementById('pay-card-label');
  if (payMethodPill) {
    let isCard = true;
    payMethodPill.addEventListener('click', () => {
      isCard = !isCard;
      const radioCard = document.getElementById('pay-radio-card');
      const radioCash = document.getElementById('pay-radio-cash');
      if (isCard) {
        if (radioCard) radioCard.checked = true;
        if (payCardLabel) payCardLabel.textContent = '•••• 2872 (Karta)';
      } else {
        if (radioCash) radioCash.checked = true;
        if (payCardLabel) payCardLabel.textContent = '💵 Naqd pul';
      }
    });
  }

  // Month Navigator Controls (< Mart, 2026 >)
  const btnPrevMonth = document.getElementById('btn-prev-month');
  const btnNextMonth = document.getElementById('btn-next-month');
  const btnExportMonth = document.getElementById('btn-export-month');

  if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', () => stepMonth(-1));
  }
  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => stepMonth(1));
  }

  const monthNavCenter = document.querySelector('.month-nav-center');
  if (monthNavCenter) {
    monthNavCenter.addEventListener('click', () => {
      const currentYM = getTodayDateString().substring(0, 7);
      if (state.selectedMonthKey === 'all') {
        changeSelectedMonth(currentYM);
      } else {
        changeSelectedMonth('all');
      }
    });
  }

  if (btnExportMonth) {
    btnExportMonth.addEventListener('click', exportCurrentMonthCSV);
  }

  // Chart period tabs
  const chartTabs = document.querySelectorAll('.chart-tab');
  chartTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      chartTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.chartPeriod = tab.dataset.period;
      initOrUpdateChart();
    });
  });

  // Transaction item deletion from History list
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
          confirmText.textContent = `"${targetTx.note}" (${formatCurrency(targetTx.amount)}) o'chirilsinmi?`;
        }
        if (confirmModal) confirmModal.classList.remove('hidden');
      }
    });
  }

  // Clear all button
  if (btnClearAll) {
    btnClearAll.addEventListener('click', () => {
      if (state.transactions.length === 0) {
        showToast("O'chirish uchun ma'lumotlar mavjud emas.", 'info');
        return;
      }
      state.isClearAllAction = true;
      state.deleteTargetId = null;

      const confirmModal = document.getElementById('confirm-modal');
      const confirmText = document.getElementById('confirm-modal-text');
      const confirmTitle = document.getElementById('confirm-modal-title');

      if (confirmTitle) confirmTitle.textContent = "Barcha xarajatlarni tozalash";
      if (confirmText) {
        confirmText.textContent = "Barcha kiritilgan xarajatlar butunlay o'chiriladi. Rozimisiz?";
      }
      if (confirmModal) confirmModal.classList.remove('hidden');
    });
  }

  // Demo data loaders
  const loadDemoData = () => {
    state.transactions = getFreshDemoTransactions();
    state.settings = { ...DEFAULT_SETTINGS };
    saveTransactionsToStorage();
    saveSettingsToStorage();

    updateDashboardUI();
    renderDashboardSnippet();
    initOrUpdateChart();
    renderTransactionsList();

    showToast("Namunaviy ma'lumotlar muvaffaqiyatli yuklandi!", 'success');
  };

  const btnDemoTop = document.getElementById('btn-demo-data-top');
  const btnEmptyDemo = document.getElementById('btn-empty-demo');
  const btnModalDemo = document.getElementById('btn-modal-demo');
  if (btnDemoTop) btnDemoTop.addEventListener('click', loadDemoData);
  if (btnEmptyDemo) btnEmptyDemo.addEventListener('click', loadDemoData);
  if (btnModalDemo) btnModalDemo.addEventListener('click', loadDemoData);

  // CSV export
  const btnModalExport = document.getElementById('btn-modal-export');
  if (btnModalExport) btnModalExport.addEventListener('click', exportToCSV);

  // Dismiss alert banner
  if (btnDismissAlert && warningBanner) {
    btnDismissAlert.addEventListener('click', () => {
      warningBanner.classList.add('hidden');
    });
  }
}

// -------------------------------------------------------------------
// 13. CSV EXPORT
// -------------------------------------------------------------------
function exportToCSV() {
  if (state.transactions.length === 0) {
    showToast("Eksport qilish uchun hech qanday ma'lumot yo'q!", 'warning');
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
  link.setAttribute('download', `hisob_kitob_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast("Ma'lumotlar CSV formatida yuklab olindi.", 'success');
}

// -------------------------------------------------------------------
// 14. REAL-TIME CLOCK & DATE
// -------------------------------------------------------------------
function startStatusClock() {
  const clockEl = document.getElementById('status-clock');
  const updateTime = () => {
    if (!clockEl) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}`;
  };
  updateTime();
  setInterval(updateTime, 10000);
}

function updateCurrentDateDisplay() {
  const display = document.getElementById('current-date-display');
  if (display) {
    const now = new Date();
    const day = now.getDate();
    const month = MONTH_NAMES_UZ[now.getMonth()];
    display.textContent = `${day}-${month}`;
  }
}

// -------------------------------------------------------------------
// 15. INITIALIZATION
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadStateFromStorage();
  initTheme();
  startStatusClock();
  updateCurrentDateDisplay();
  setupViewNavigation();
  setupFormHandlers();
  setupModals();
  setupToolbarAndActions();
  updateDashboardUI();
  renderDashboardSnippet();
  initOrUpdateChart();
  renderTransactionsList();

  console.log("💎 Smart Expense Tracker - Yangi mobil dizayn muvaffaqiyatli ishga tushdi!");
});
