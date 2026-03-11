document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. MODAL LOGIC
    // ==========================================
    const addModalOverlay = document.getElementById("addModalOverlay");
    const subFormOverlay   = document.getElementById("subFormOverlay");
    const trialFormOverlay = document.getElementById("trialFormOverlay");

    function openModal() {
        addModalOverlay.classList.add("visible");
        addModalOverlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        addModalOverlay.classList.remove("visible");
        addModalOverlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    function openSubForm() {
        closeModal();
        subFormOverlay.classList.add("visible");
        subFormOverlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        document.getElementById("subForm").reset();
        document.getElementById("subFormError").textContent = "";
    }

    function closeSubForm() {
        subFormOverlay.classList.remove("visible");
        subFormOverlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    function openTrialForm() {
        closeModal();
        trialFormOverlay.classList.add("visible");
        trialFormOverlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        document.getElementById("trialForm").reset();
        document.getElementById("trialFormError").textContent = "";
    }

    function closeTrialForm() {
        trialFormOverlay.classList.remove("visible");
        trialFormOverlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    // Wire up choice modal
    document.getElementById("addBtn")?.addEventListener("click", openModal);
    document.getElementById("openAddModalNav")?.addEventListener("click", openModal);
    document.getElementById("closeAddModal")?.addEventListener("click", closeModal);
    addModalOverlay?.addEventListener("click", (e) => { if (e.target === addModalOverlay) closeModal(); });

    // Wire up choice buttons → open the right form
    document.getElementById("chooseSubscription")?.addEventListener("click", openSubForm);
    document.getElementById("chooseTrial")?.addEventListener("click", openTrialForm);

    // Close form modals
    document.getElementById("closeSubForm")?.addEventListener("click", closeSubForm);
    document.getElementById("closeTrialForm")?.addEventListener("click", closeTrialForm);
    subFormOverlay?.addEventListener("click", (e) => { if (e.target === subFormOverlay) closeSubForm(); });
    trialFormOverlay?.addEventListener("click", (e) => { if (e.target === trialFormOverlay) closeTrialForm(); });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { closeModal(); closeSubForm(); closeTrialForm(); }
    });

    // ==========================================
    // 2. SUBSCRIPTION FORM SUBMIT
    // ==========================================
    document.getElementById("subForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const name     = document.getElementById("subName").value.trim();
        const amount   = parseFloat(document.getElementById("subAmount").value);
        const category = document.getElementById("subCategory").value;
        const date     = document.getElementById("subDate").value;
        const errorEl  = document.getElementById("subFormError");

        if (!name || isNaN(amount) || !date) {
            errorEl.textContent = "Please fill in all required fields.";
            return;
        }
        if (amount < 0) {
            errorEl.textContent = "Amount must be a positive number.";
            return;
        }

        const CATEGORY_COLORS = {
            Entertainment: 'rgba(229,9,20,0.15)',
            Productivity:  'rgba(255,215,0,0.12)',
            Utilities:     'rgba(96,165,250,0.15)',
            Business:      'rgba(167,139,250,0.15)',
            Other:         'rgba(255,255,255,0.08)'
        };

        const newSub = {
            id:               Date.now(),
            name,
            amount,
            date,
            subscriptionType: category,
            color:            CATEGORY_COLORS[category] || CATEGORY_COLORS.Other,
            isTrial:          false
        };

        subscriptions.push(newSub);
        renderSubscriptions();
        updateMonthlySpending();
        closeSubForm();
    });

    // ==========================================
    // 3. FREE TRIAL FORM SUBMIT
    // ==========================================
    document.getElementById("trialForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const name     = document.getElementById("trialName").value.trim();
        const endDate  = document.getElementById("trialEndDate").value;
        const cost     = document.getElementById("trialCost").value;
        const category = document.getElementById("trialCategory").value;
        const errorEl  = document.getElementById("trialFormError");

        if (!name || !endDate) {
            errorEl.textContent = "Please fill in the service name and end date.";
            return;
        }

        const newTrial = {
            id:               Date.now(),
            name,
            amount:           cost ? parseFloat(cost) : 0,
            date:             endDate,
            subscriptionType: category,
            color:            'rgba(96,165,250,0.12)',
            isTrial:          true
        };

        subscriptions.push(newTrial);
        renderSubscriptions();
        updateMonthlySpending();
        closeTrialForm();
    });

    // ==========================================
    // 4. LOGIN LOGIC
    // ==========================================
    const VALID_USERS = { user1: "pass1", user2: "pass2" };
    let currentUser = null;

    const loginOverlay    = document.getElementById("loginOverlay");
    const loginForm       = document.getElementById("loginForm");
    const loginUsername   = document.getElementById("loginUsername");
    const loginPassword   = document.getElementById("loginPassword");
    const loginError      = document.getElementById("loginError");
    const currentUserLabel = document.getElementById("currentUserLabel");
    const logoutBtn       = document.getElementById("logoutBtn");

    const updateAuthUi = () => {
        if (!currentUser) {
            document.body.classList.add("auth-locked");
            if (loginOverlay) loginOverlay.style.display = "flex";
            if (currentUserLabel) currentUserLabel.textContent = "Not signed in";
            hideHeader();
        } else {
            document.body.classList.remove("auth-locked");
            if (loginOverlay) loginOverlay.style.display = "none";
            if (currentUserLabel) currentUserLabel.textContent = `Signed in as ${currentUser}`;
            showHeader();
        }
    };

    updateAuthUi();

    logoutBtn?.addEventListener("click", () => {
        currentUser = null;
        if (loginUsername) loginUsername.value = "";
        if (loginPassword) loginPassword.value = "";
        if (loginError) loginError.textContent = "";
        updateAuthUi();
    });

    loginForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = loginUsername?.value.trim();
        const password = loginPassword?.value;
        if (!username || !password) return;

        if (VALID_USERS[username] && VALID_USERS[username] === password) {
            currentUser = username;
            if (loginError) loginError.textContent = "";
            updateAuthUi();
        } else {
            if (loginError) loginError.textContent = "Invalid username or password.";
        }
    });

    renderSubscriptions();
    updateMonthlySpending();
});

// ==========================================
// SUBSCRIPTION DATA
// ==========================================
let subscriptions = [
    { id: 1, name: 'Netflix',      amount: 22.99, date: '2026-03-07', subscriptionType: 'Entertainment', color: 'rgba(229,9,20,0.15)',   isTrial: false },
    { id: 2, name: 'Spotify',      amount: 10.99, date: '2026-03-12', subscriptionType: 'Entertainment', color: 'rgba(30,215,96,0.15)',   isTrial: false },
    { id: 3, name: 'ChatGPT Plus', amount: 26.99, date: '2026-03-05', subscriptionType: 'Productivity',  color: 'rgba(255,215,0,0.12)',   isTrial: false }
];

// ==========================================
// HELPERS
// ==========================================
function showHeader() {
    document.querySelector('header')?.classList.remove('hidden');
}
function hideHeader() {
    document.querySelector('header')?.classList.add('hidden');
}

function switchPage(pageId, clickedButton) {
    document.querySelectorAll('.app-page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId)?.classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    clickedButton?.classList.add('active');
}

function updateMonthlySpending() {
    const total = subscriptions
        .filter(s => !s.isTrial)
        .reduce((sum, s) => sum + s.amount, 0);
    document.querySelectorAll('#monthlySpending').forEach(el => {
        el.textContent = `$${total.toFixed(2)}`;
    });
}

// ==========================================
// RENDER TABLE
// ==========================================
function renderSubscriptions() {
    const container = document.getElementById('subs-container');
    if (!container) return;

    container.innerHTML = '';

    subscriptions.forEach(sub => {
        const daysRemaining = Math.ceil((new Date(sub.date) - new Date()) / (1000 * 60 * 60 * 24));

        let statusClass = 'status-ok';
        let statusText  = 'Active';

        if (sub.isTrial) {
            if (daysRemaining < 0)      { statusClass = 'status-cancel'; statusText = 'Expired'; }
            else if (daysRemaining <= 5) { statusClass = 'status-soon';   statusText = 'Ends Soon'; }
            else                         { statusClass = 'status-ok';     statusText = 'Trial'; }
        } else {
            if (daysRemaining < 0)      { statusClass = 'status-cancel'; statusText = 'Overdue'; }
            else if (daysRemaining <= 7) { statusClass = 'status-soon';   statusText = 'Soon'; }
        }

        const ICONS = { Entertainment: '🎬', Productivity: '📚', Utilities: '💡', Business: '💼' };
        sub.icon = ICONS[sub.subscriptionType] || (sub.isTrial ? '⏳' : '❓');

        const trialBadge = sub.isTrial
            ? `<span style="font-size:0.68rem;background:rgba(96,165,250,0.18);color:#93c5fd;padding:2px 7px;border-radius:999px;margin-left:6px;font-weight:600;">TRIAL</span>`
            : '';

        const amountDisplay = sub.isTrial && sub.amount === 0
            ? '<span style="color:var(--text-muted);font-size:0.8rem;">Free</span>'
            : `$${sub.amount.toFixed(2)}`;

        const item = document.createElement('div');
        item.className = 'table-row';
        item.innerHTML = `
            <div class="row-name">
                <div class="row-icon" style="background:${sub.color}">${sub.icon}</div>
                ${sub.name}${trialBadge}
            </div>
            <div>${amountDisplay}</div>
            <div class="row-muted">${sub.subscriptionType || 'Other'}</div>
            <div class="row-muted">${sub.date}</div>
            <div><span class="tag ${statusClass}">${statusText}</span></div>
            <div>
                <button onclick="deleteSub(${sub.id})"
                    style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.1rem;transition:color 0.2s;"
                    onmouseover="this.style.color='#ef4444'"
                    onmouseout="this.style.color='var(--text-muted)'">✕</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function deleteSub(id) {
    if (confirm("Remove this subscription?")) {
        subscriptions = subscriptions.filter(s => s.id !== id);
        renderSubscriptions();
        updateMonthlySpending();
    }
}

renderSubscriptions();

// ==========================================
// PIE CHART
// ==========================================
function renderPieChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Entertainment', 'Productivity', 'Utilities'],
            datasets: [{
                data: [45, 30, 120],
                backgroundColor: ['#FFD700', '#4ade80', '#a1a1aa'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            color: '#ffffff',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}