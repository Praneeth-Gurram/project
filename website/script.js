// Initialize Lucide Icons
lucide.createIcons();

// Configure Chart.js default colors for Dark Mode
Chart.defaults.color = '#c5c6c7';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

// Function to animate counting numbers
function animateValue(id, start, end, duration, prefix = '', suffix = '') {
    if (start === end) return;
    let range = end - start;
    let current = start;
    let increment = end > start ? 1 : -1;
    let stepTime = Math.abs(Math.floor(duration / range));
    if (stepTime < 10) stepTime = 10;
    if (range > duration/10) {
        increment = (range / (duration/10));
    }
    let obj = document.getElementById(id);
    if (!obj) return;

    let timer = setInterval(function() {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        let displayVal = current;
        if(current > 1000 && prefix === '$') {
            displayVal = (current / 1000).toFixed(1) + 'k';
        } else if (current % 1 !== 0) {
            displayVal = current.toFixed(1);
        } else {
            displayVal = Math.floor(current);
        }
        obj.innerHTML = prefix + displayVal + suffix;
    }, stepTime);
}

// ----------------------------------------------------
// Navigation Logic (SPA Tab Switching)
// ----------------------------------------------------
const navItems = document.querySelectorAll('#nav-menu li');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');

const titles = {
    'overview-section': { title: 'Executive Overview', sub: 'Real-time AI analysis of network health and operational efficiency.' },
    'tracking-section': { title: 'Live Fleet Tracking', sub: 'Real-time road corridor routing, fleet tracking, and live simulation.' },
    'geo-section': { title: 'Geo-Routing & Weather', sub: 'Geographical bottleneck analysis and extreme weather impacts.' },
    'fleet-section': { title: 'Fleet & Correlations', sub: 'Asset utilization efficiency and demand bivariate correlations.' },
    'reports-section': { title: 'Executive Reports', sub: 'Prescriptive analytics, automated ROI forecasting, and actionable strategic directives.' },
    'xai-section': { title: 'Explainable AI Module', sub: 'Transparent insights and prescriptive recommendations.' }
};

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active from all nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Hide all tabs
        tabContents.forEach(tab => tab.classList.add('hidden'));

        // Show target tab
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');

        // Update headers
        pageTitle.innerText = titles[targetId].title;
        pageSubtitle.innerText = titles[targetId].sub;
    });
});


// ====================================================
// AUTHENTICATION & ROUTE PROTECTION CONTROLLER
// ====================================================

function getStoredAuthUser() {
    try {
        const rawUser = localStorage.getItem('logisphere_user') || sessionStorage.getItem('logisphere_user') || localStorage.getItem('auth_user');
        return rawUser ? JSON.parse(rawUser) : null;
    } catch (e) {
        return null;
    }
}

function getStoredAuthToken() {
    return localStorage.getItem('logisphere_auth_token') || sessionStorage.getItem('logisphere_auth_token') || localStorage.getItem('auth_token');
}

function isAuthenticated() {
    return Boolean(getStoredAuthToken());
}

function mountAuthScreen(mode = 'login') {
    const authRoot = document.getElementById('auth-root');
    const dashboardRoot = document.getElementById('dashboard-root');
    
    if (dashboardRoot) dashboardRoot.style.display = 'none';
    if (authRoot) {
        authRoot.style.display = 'block';
        
        if (window.ReactDOM && window.LogiSphereAuth) {
            const root = window.ReactDOM.createRoot 
                ? (window.__authReactRoot || (window.__authReactRoot = window.ReactDOM.createRoot(authRoot)))
                : null;
            
            const element = React.createElement(window.LogiSphereAuth, {
                onLoginSuccess: handleAuthSuccess,
                initialMode: mode
            });

            if (root) {
                root.render(element);
            } else if (window.ReactDOM.render) {
                window.ReactDOM.render(element, authRoot);
            }
        } else {
            // Retry until React / Babel transpiles LogiSphereAuth
            setTimeout(() => mountAuthScreen(mode), 60);
        }
    }
}

function handleAuthSuccess(user) {
    const authRoot = document.getElementById('auth-root');
    const dashboardRoot = document.getElementById('dashboard-root');
    
    if (authRoot) authRoot.style.display = 'none';
    if (dashboardRoot) dashboardRoot.style.display = 'flex';
    
    updateSidebarUserProfile(user);
    
    if (typeof showNotification === 'function') {
        showNotification('Authenticated', `Welcome, ${user ? user.name : 'Leader'}!`, 'success');
    }
    
    if (!window.masterDataset || window.masterDataset.length === 0) {
        loadOverviewData();
    }
    
    // Switch to active tab or default to overview
    window.location.hash = '#overview-section';
    const activeTab = document.querySelector('#nav-menu li.active');
    if (!activeTab) {
        const firstNav = document.querySelector('#nav-menu li');
        if (firstNav) firstNav.click();
    }
    if (window.lucide) lucide.createIcons();
}

function applyRoleBasedNavigation(user) {
    const u = user || getStoredAuthUser();
    if (!u) return;

    const roleKey = (u.role_key || (u.role && u.role.toLowerCase().includes('operator') ? 'operator' : u.role && u.role.toLowerCase().includes('director') ? 'director' : 'admin')).toLowerCase();
    
    // Module permissions according to role:
    // ADMIN: all 6
    // DIRECTOR: overview, geo, fleet, reports, xai (hides tracking)
    // OPERATOR: overview, tracking, geo (hides fleet, reports, xai)
    const allowedMap = {
        'admin': ['overview-section', 'tracking-section', 'geo-section', 'fleet-section', 'reports-section', 'xai-section'],
        'director': ['overview-section', 'geo-section', 'fleet-section', 'reports-section', 'xai-section'],
        'operator': ['overview-section', 'tracking-section', 'geo-section']
    };

    const allowed = u.allowed_modules || allowedMap[roleKey] || allowedMap['admin'];
    
    const navItems = document.querySelectorAll('#nav-menu li');
    navItems.forEach(li => {
        const target = li.getAttribute('data-target');
        if (target) {
            if (allowed.includes(target)) {
                li.style.display = 'block';
            } else {
                li.style.display = 'none';
            }
        }
    });

    // Check if active tab is currently forbidden
    const activeTab = document.querySelector('#nav-menu li.active');
    if (activeTab && activeTab.style.display === 'none') {
        const firstVisible = Array.from(navItems).find(li => li.style.display !== 'none');
        if (firstVisible) firstVisible.click();
    }
}

function updateSidebarUserProfile(user) {
    const u = user || getStoredAuthUser() || {
        name: "Sarah Chen",
        role: "Lead Enterprise Supply Chain Officer",
        role_key: "admin",
        badge: "ADMIN",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
    };
    
    const nameEl = document.getElementById('user-display-name');
    const roleEl = document.getElementById('user-display-role');
    const avatarEl = document.getElementById('user-avatar-img');
    const badgeEl = document.getElementById('user-role-badge');
    
    if (nameEl) nameEl.innerText = u.name || "Sarah Chen";
    if (roleEl) roleEl.innerText = u.role || "Lead Enterprise Supply Chain Officer";
    if (avatarEl && u.avatar) avatarEl.src = u.avatar;

    if (badgeEl) {
        let badge = u.badge;
        if (!badge) {
            if (u.role_key) badge = u.role_key.toUpperCase();
            else if (u.role && u.role.toLowerCase().includes('director')) badge = 'DIRECTOR';
            else if (u.role && u.role.toLowerCase().includes('operator')) badge = 'OPERATOR';
            else badge = 'ADMIN';
        }
        badgeEl.innerText = badge;
        badgeEl.style.display = 'inline-block';

        if (badge === 'DIRECTOR') {
            badgeEl.style.background = 'rgba(168, 85, 247, 0.18)';
            badgeEl.style.color = '#c084fc';
            badgeEl.style.borderColor = 'rgba(168, 85, 247, 0.35)';
        } else if (badge === 'OPERATOR') {
            badgeEl.style.background = 'rgba(16, 185, 129, 0.18)';
            badgeEl.style.color = '#34d399';
            badgeEl.style.borderColor = 'rgba(16, 185, 129, 0.35)';
        } else {
            badgeEl.style.background = 'rgba(56, 189, 248, 0.18)';
            badgeEl.style.color = '#38bdf8';
            badgeEl.style.borderColor = 'rgba(56, 189, 248, 0.35)';
        }
    }

    applyRoleBasedNavigation(u);
}

function handleLogout() {
    localStorage.removeItem('logisphere_auth_token');
    localStorage.removeItem('logisphere_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('logisphere_auth_token');
    sessionStorage.removeItem('logisphere_user');
    
    if (typeof showNotification === 'function') {
        showNotification('Signed Out', 'You have been signed out of your workspace.', 'info');
    }
    
    window.location.hash = '#login';
    mountAuthScreen('login');
}

function initAuthSession() {
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
    
    const isRegisterHash = window.location.hash === '#register' || window.location.pathname.endsWith('/register');

    if (isAuthenticated()) {
        const user = getStoredAuthUser();
        const authRoot = document.getElementById('auth-root');
        const dashboardRoot = document.getElementById('dashboard-root');
        if (authRoot) authRoot.style.display = 'none';
        if (dashboardRoot) dashboardRoot.style.display = 'flex';
        updateSidebarUserProfile(user);

        if (window.location.hash === '#login' || isRegisterHash) {
            window.location.hash = '#overview-section';
        }
    } else {
        mountAuthScreen(isRegisterHash ? 'register' : 'login');
    }
}

// ====================================================
// EXECUTIVE OVERVIEW CONTROLLER & DATA STATE
// ====================================================

window.masterDataset = [];
window.originalData = null;
window.filteredData = [];
let overviewMap = null;
let overviewMapMarkers = [];
let overviewDonutChart = null;
let overviewLineChart = null;

// Initialize Overview on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initAuthSession();
    initOverview();
});

async function initOverview() {
    initGlobalFilters();
    if (isAuthenticated()) {
        await loadOverviewData();
    }
}

async function loadOverviewData() {
    try {
        const [fullRes, summaryRes] = await Promise.allSettled([
            fetch('full_data.json').then(r => { if (!r.ok) throw new Error('full_data.json fetch failed'); return r.json(); }),
            fetch('data.json').then(r => { if (!r.ok) throw new Error('data.json fetch failed'); return r.json(); })
        ]);

        if (fullRes.status === 'fulfilled' && Array.isArray(fullRes.value) && fullRes.value.length > 0) {
            window.masterDataset = fullRes.value;
            window.filteredData = [...window.masterDataset];
        }

        if (summaryRes.status === 'fulfilled' && summaryRes.value) {
            window.originalData = summaryRes.value;
        }

        if (window.masterDataset.length > 0) {
            updateKPIsFromDataset(window.masterDataset);
            updateSupplyChainHealth(window.masterDataset);
            updateAIExecutiveSummary(window.masterDataset);
            initOverviewChartsFromDataset(window.masterDataset);
            if (typeof generateRecommendations === 'function') {
                generateRecommendations(window.masterDataset);
            }
        } else if (window.originalData) {
            renderKPIsFromSummary(window.originalData.kpis);
            updateSupplyChainHealth([]);
            updateAIExecutiveSummary([]);
            initOverviewChartsFromSummary(window.originalData.charts);
        } else {
            showSectionError('kpi');
            showSectionError('health');
            showSectionError('ai');
            showSectionError('charts');
        }
    } catch (err) {
        console.error("Overview data initialization error:", err);
        showSectionError('kpi');
        showSectionError('health');
        showSectionError('ai');
        showSectionError('charts');
    }
}

function updateKPIsFromDataset(dataset) {
    if (!Array.isArray(dataset) || dataset.length === 0) {
        animateValue('kpi-deliveries', 0, 0, 400);
        animateValue('kpi-ontime', 0, 0, 400, '', '%');
        animateValue('kpi-waittime', 0, 0, 400, '', ' min');
        animateValue('kpi-revenue', 0, 0, 400, '$');
        animateValue('kpi-efficiency', 0, 0, 400);
        return;
    }

    const total = dataset.length;
    const onTimeCount = dataset.filter(d => d.Shipment_Status === 'Delivered' || (d.Shipment_Status !== 'Delayed' && (d.Waiting_Time || 0) <= 35)).length;
    const onTimePct = (onTimeCount / total) * 100;

    let totalWait = 0;
    let totalRev = 0;
    let totalEff = 0;

    dataset.forEach(d => {
        totalWait += (typeof d.Waiting_Time === 'number' ? d.Waiting_Time : 0);
        totalRev += (typeof d.User_Transaction_Amount === 'number' ? d.User_Transaction_Amount : 0);
        totalEff += (typeof d.Asset_Performance_Score === 'number' ? d.Asset_Performance_Score : 0);
    });

    const avgWait = total > 0 ? (totalWait / total) : 0;
    const avgEff = total > 0 ? (totalEff / total) : 0;

    animateValue('kpi-deliveries', 0, total, 600);
    animateValue('kpi-ontime', 0, onTimePct, 600, '', '%');
    animateValue('kpi-waittime', 0, avgWait, 600, '', ' min');
    animateValue('kpi-revenue', 0, totalRev, 600, '$');
    animateValue('kpi-efficiency', 0, avgEff, 600);
}

function renderKPIsFromSummary(kpis) {
    if (!kpis) return;
    animateValue('kpi-deliveries', 0, kpis.totalDeliveries || 0, 600);
    animateValue('kpi-ontime', 0, kpis.onTimePercentage || 0, 600, '', '%');
    animateValue('kpi-waittime', 0, kpis.avgWaitTime || 0, 600, '', ' min');
    animateValue('kpi-revenue', 0, kpis.totalRevenue || 0, 600, '$');
    animateValue('kpi-efficiency', 0, kpis.efficiencyScore || 0, 600);
}

function updateSupplyChainHealth(dataset) {
    const valEl = document.getElementById('health-score-val');
    const circleEl = document.getElementById('health-score-circle');
    const subEl = document.getElementById('health-score-sub');

    if (!valEl || !circleEl) return;

    if (!Array.isArray(dataset) || dataset.length === 0) {
        valEl.innerHTML = `0<span style="font-size: 1rem; color: #a0aec0;">/100</span>`;
        circleEl.style.strokeDashoffset = 408;
        circleEl.style.stroke = '#9ca3af';
        if (subEl) {
            subEl.innerText = 'No matching records';
            subEl.style.color = '#9ca3af';
        }
        return;
    }

    const total = dataset.length;
    const onTimeCount = dataset.filter(d => d.Shipment_Status !== 'Delayed').length;
    const onTimePct = (onTimeCount / total) * 100;

    let totalWait = 0;
    let totalUtil = 0;
    dataset.forEach(d => {
        totalWait += (d.Waiting_Time || 0);
        totalUtil += (d.Asset_Utilization || 0);
    });
    const avgWait = totalWait / total;
    const avgUtil = totalUtil / total;

    let score = (onTimePct * 0.5) + (avgUtil * 0.3) + (Math.max(0, 100 - avgWait * 1.5) * 0.2);
    score = Math.min(99, Math.max(10, Math.round(score)));

    const offset = 408 - (score / 100) * 408;
    circleEl.style.strokeDashoffset = offset;

    let color = '#4ade80';
    let statusText = 'Optimal Operational Health';
    if (score < 60) {
        color = '#f87171';
        statusText = 'Critical Network Delays Detected';
    } else if (score < 80) {
        color = '#fbbf24';
        statusText = 'Moderate Congestion / Bottlenecks';
    }

    circleEl.style.stroke = color;
    valEl.innerHTML = `${score}<span style="font-size: 1rem; color: #a0aec0;">/100</span>`;
    if (subEl) {
        subEl.innerText = statusText;
        subEl.style.color = color;
    }
}

function updateAIExecutiveSummary(dataset) {
    const summaryText = document.getElementById('executive-summary-text');
    const badge = document.getElementById('ai-summary-badge');
    if (!summaryText) return;

    if (!Array.isArray(dataset) || dataset.length === 0) {
        summaryText.innerHTML = `
            <p style="color: #9ca3af; margin: 0;">No matching records found for active filters. Adjust your filter parameters to view real-time AI summary analytics.</p>
        `;
        if (badge) {
            badge.innerText = 'Empty Filter';
            badge.style.color = '#9ca3af';
            badge.style.background = 'rgba(255,255,255,0.05)';
        }
        return;
    }

    const total = dataset.length;
    const delayedCount = dataset.filter(d => d.Shipment_Status === 'Delayed').length;
    const weatherDelayed = dataset.filter(d => d.Logistics_Delay_Reason === 'Weather' || d.Extreme_Weather_Flag === 1).length;
    const trafficDelayed = dataset.filter(d => d.Traffic_Status === 'Heavy' || d.Traffic_Status === 'Detour').length;

    let totalWait = 0;
    dataset.forEach(d => totalWait += (d.Waiting_Time || 0));
    const avgWait = Math.round(totalWait / total);

    const estSavings = Math.round(delayedCount * 1450).toLocaleString();
    const priorityRecShipments = Math.min(delayedCount, Math.max(1, Math.round(delayedCount * 0.4)));

    summaryText.innerHTML = `
        <p style="margin-bottom: 8px;">Active network monitoring evaluates <strong>${total.toLocaleString()} shipments</strong>.</p>
        <p style="margin-bottom: 8px;"><strong style="color: ${delayedCount > 0 ? '#f87171' : '#4ade80'};">${delayedCount} delayed shipments</strong> identified (${weatherDelayed} due to extreme weather, ${trafficDelayed} congested in traffic).</p>
        <p style="margin-bottom: 8px;">Prescriptive AI recommends <strong>Air Freight & Dynamic Rerouting</strong> for ${priorityRecShipments} priority shipments. Projected savings: <strong style="color: #4ade80;">$${estSavings}</strong>.</p>
        <p style="margin: 0;">Average fleet delay stands at <strong>${avgWait} minutes</strong> with active automated mitigation protocols.</p>
    `;

    if (badge) {
        badge.innerText = 'Live Analysis';
        badge.style.color = '#60a5fa';
        badge.style.background = 'rgba(59,130,246,0.2)';
    }
}

function updateSmartAIInsight(dataset) {
    const insightSection = document.getElementById('ai-insight-section');
    if (!insightSection) return;

    if (!Array.isArray(dataset) || dataset.length === 0) {
        insightSection.style.display = 'none';
        return;
    }

    insightSection.style.display = 'grid';

    let totalWait = 0;
    const trafficDelays = { 'Clear': 0, 'Detour': 0, 'Heavy': 0 };
    let delayedCount = 0;

    dataset.forEach(d => {
        totalWait += (d.Waiting_Time || 0);
        if (d.Shipment_Status === 'Delayed') {
            delayedCount++;
            if (d.Traffic_Status && trafficDelays.hasOwnProperty(d.Traffic_Status)) {
                trafficDelays[d.Traffic_Status]++;
            }
        }
    });

    const avgWait = Math.round(totalWait / dataset.length);
    const highestTrafficDelay = Object.keys(trafficDelays).reduce((a, b) => trafficDelays[a] > trafficDelays[b] ? a : b, 'Heavy');

    const riskEl = document.getElementById('insight-primary-risk');
    const avgDelayEl = document.getElementById('insight-avg-delay');
    const affectedEl = document.getElementById('insight-affected');
    const insightText = document.getElementById('insight-text');
    const recText = document.getElementById('rec-text');
    const recDelay = document.getElementById('rec-delay-reduction');
    const recCost = document.getElementById('rec-cost-impact');
    const recPriority = document.getElementById('rec-priority');

    if (riskEl) riskEl.innerText = `${highestTrafficDelay} Traffic`;
    if (avgDelayEl) avgDelayEl.innerText = `${avgWait} min`;
    if (affectedEl) affectedEl.innerText = `${delayedCount} Deliveries`;

    if (avgWait > 35) {
        if (insightText) insightText.innerText = `Critical systemic delays detected in the selected subset. ${highestTrafficDelay} traffic conditions are severely impacting operations, resulting in an average wait time of ${avgWait} minutes.`;
        if (recText) recText.innerText = `Initiate emergency re-routing for all critical shipments avoiding ${highestTrafficDelay} traffic corridors. Deploy 3PL overflow fleet if available.`;
        if (recDelay) recDelay.innerText = "-45 mins";
        if (recCost) recCost.innerText = "+$12.5k Saved";
        if (recPriority) {
            recPriority.innerText = "Critical (Immediate Action Required)";
            recPriority.style.color = "#f87171";
        }
    } else {
        if (insightText) insightText.innerText = `Network performance is stable for this filter view. Minor bottlenecks observed under ${highestTrafficDelay} conditions, but deliveries remain within baseline SLA tolerances.`;
        if (recText) recText.innerText = `Maintain active routing algorithms. Schedule preventative maintenance for assets showing early signs of performance degradation.`;
        if (recDelay) recDelay.innerText = "-12 mins";
        if (recCost) recCost.innerText = "+$3.4k Saved";
        if (recPriority) {
            recPriority.innerText = "Normal (Monitor Continuously)";
            recPriority.style.color = "#4ade80";
        }
    }
}

function initOverviewChartsFromDataset(dataset) {
    if (!dataset || dataset.length === 0) return;

    const statusCounts = { 'Delivered': 0, 'In Transit': 0, 'Delayed': 0 };
    const trafficDelays = { 'Clear': 0, 'Detour': 0, 'Heavy': 0 };

    dataset.forEach(d => {
        if (d.Shipment_Status && statusCounts.hasOwnProperty(d.Shipment_Status)) {
            statusCounts[d.Shipment_Status]++;
        }
        if (d.Shipment_Status === 'Delayed' && d.Traffic_Status && trafficDelays.hasOwnProperty(d.Traffic_Status)) {
            trafficDelays[d.Traffic_Status]++;
        }
    });

    const donutCanvas = document.getElementById('donutChart');
    if (donutCanvas) {
        const existing = Chart.getChart(donutCanvas);
        if (existing) existing.destroy();

        overviewDonutChart = new Chart(donutCanvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#4ade80', '#fbbf24', '#f87171'],
                    borderColor: '#1f2833',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15, color: '#c5c6c7' } }
                },
                cutout: '70%'
            }
        });
    }

    const lineCanvas = document.getElementById('lineChart');
    if (lineCanvas) {
        const existing = Chart.getChart(lineCanvas);
        if (existing) existing.destroy();

        const ctx = lineCanvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(192, 132, 252, 0.4)');
        gradient.addColorStop(1, 'rgba(192, 132, 252, 0.0)');

        overviewLineChart = new Chart(lineCanvas, {
            type: 'line',
            data: {
                labels: Object.keys(trafficDelays),
                datasets: [{
                    label: 'Delayed Shipments',
                    data: Object.values(trafficDelays),
                    borderColor: '#c084fc',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#c084fc',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }
}

function initOverviewChartsFromSummary(charts) {
    if (!charts) return;
    if (charts.deliveryStatus) {
        const donutCanvas = document.getElementById('donutChart');
        if (donutCanvas) {
            const existing = Chart.getChart(donutCanvas);
            if (existing) existing.destroy();
            overviewDonutChart = new Chart(donutCanvas, {
                type: 'doughnut',
                data: {
                    labels: charts.deliveryStatus.labels,
                    datasets: [{
                        data: charts.deliveryStatus.data,
                        backgroundColor: ['#4ade80', '#f87171'],
                        borderColor: '#1f2833',
                        borderWidth: 2
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
            });
        }
    }
}

function updateOverviewCharts(dataset) {
    if (!Array.isArray(dataset) || dataset.length === 0) {
        if (overviewDonutChart) {
            overviewDonutChart.data.datasets[0].data = [0, 0, 0];
            overviewDonutChart.update();
        }
        if (overviewLineChart) {
            overviewLineChart.data.datasets[0].data = [0, 0, 0];
            overviewLineChart.update();
        }
        const avgDelayEl = document.getElementById('metric-avg-delay');
        if (avgDelayEl) avgDelayEl.innerText = '0 min';
        return;
    }

    const statusCounts = { 'Delivered': 0, 'In Transit': 0, 'Delayed': 0 };
    const trafficDelays = { 'Clear': 0, 'Detour': 0, 'Heavy': 0 };
    let totalWait = 0;

    dataset.forEach(d => {
        totalWait += (d.Waiting_Time || 0);
        if (d.Shipment_Status && statusCounts.hasOwnProperty(d.Shipment_Status)) {
            statusCounts[d.Shipment_Status]++;
        }
        if (d.Shipment_Status === 'Delayed' && d.Traffic_Status && trafficDelays.hasOwnProperty(d.Traffic_Status)) {
            trafficDelays[d.Traffic_Status]++;
        }
    });

    const avgWait = (totalWait / dataset.length).toFixed(1);
    const avgDelayEl = document.getElementById('metric-avg-delay');
    if (avgDelayEl) avgDelayEl.innerText = `${avgWait} min`;

    const highestRiskKey = Object.keys(trafficDelays).reduce((a, b) => trafficDelays[a] > trafficDelays[b] ? a : b, 'Heavy');
    const riskEl = document.getElementById('metric-highest-risk');
    if (riskEl) riskEl.innerText = `${highestRiskKey} Traffic`;

    const donutCanvas = document.getElementById('donutChart');
    if (donutCanvas) {
        if (!overviewDonutChart) {
            initOverviewChartsFromDataset(dataset);
        } else {
            overviewDonutChart.data.labels = Object.keys(statusCounts);
            overviewDonutChart.data.datasets[0].data = Object.values(statusCounts);
            overviewDonutChart.update();
        }
    }

    const lineCanvas = document.getElementById('lineChart');
    if (lineCanvas) {
        if (!overviewLineChart) {
            initOverviewChartsFromDataset(dataset);
        } else {
            overviewLineChart.data.labels = Object.keys(trafficDelays);
            overviewLineChart.data.datasets[0].data = Object.values(trafficDelays);
            overviewLineChart.update();
        }
    }
}

function initOverviewMap(dataset) {}
function updateOverviewMap(dataset) {}
function renderActiveAlerts(dataset) {}

function initGlobalFilters() {
    const applyBtn = document.getElementById('btn-filter-apply');
    const resetBtn = document.getElementById('btn-filter-reset');

    if (applyBtn) {
        applyBtn.onclick = () => applyGlobalFilters();
    }

    if (resetBtn) {
        resetBtn.onclick = () => resetGlobalFilters();
    }

    const filterIds = [
        'filter-time', 'filter-region', 'filter-warehouse', 'filter-vehicle',
        'filter-traffic', 'filter-status', 'filter-priority', 'filter-weather',
        'filter-geocluster', 'filter-driver'
    ];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => applyGlobalFilters());
        }
    });

    const mapRetryBtn = document.getElementById('map-retry-btn');
    if (mapRetryBtn) {
        mapRetryBtn.onclick = () => initOverviewMap(window.filteredData || window.masterDataset);
    }
}

function applyGlobalFilters() {
    const btn = document.getElementById('btn-filter-apply');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) btn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i> Filtering...';
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        const filters = {
            time: document.getElementById('filter-time')?.value || 'all',
            region: document.getElementById('filter-region')?.value || 'all',
            warehouse: document.getElementById('filter-warehouse')?.value || 'all',
            vehicle: document.getElementById('filter-vehicle')?.value || 'all',
            traffic: document.getElementById('filter-traffic')?.value || 'all',
            status: document.getElementById('filter-status')?.value || 'all',
            priority: document.getElementById('filter-priority')?.value || 'all',
            weather: document.getElementById('filter-weather')?.value || 'all',
            geocluster: document.getElementById('filter-geocluster')?.value || 'all',
            driver: document.getElementById('filter-driver')?.value || 'all'
        };

        renderActiveFilterChips(filters);

        const base = Array.isArray(window.masterDataset) ? window.masterDataset : [];
        const filtered = base.filter(row => {
            if (!row) return false;

            // 1. Time Filter
            if (filters.time !== 'all') {
                if (filters.time === 'today' && (!row.Timestamp || !row.Timestamp.startsWith('2024-12'))) return false;
                if (filters.time === 'week' && (!row.Timestamp || !(row.Timestamp.startsWith('2024-12') || row.Timestamp.startsWith('2024-11')))) return false;
                if (filters.time === 'month' && (!row.Timestamp || !(row.Timestamp.startsWith('2024-12') || row.Timestamp.startsWith('2024-11') || row.Timestamp.startsWith('2024-10')))) return false;
                if (filters.time === 'quarter' && (!row.Timestamp || !(row.Timestamp.startsWith('2024-12') || row.Timestamp.startsWith('2024-11') || row.Timestamp.startsWith('2024-10') || row.Timestamp.startsWith('2024-09')))) return false;
            }

            // 2. Region Filter (maps to Geo_Cluster)
            if (filters.region !== 'all') {
                const regMap = {
                    'North America': ['Zone North', 'Zone West'],
                    'Europe': ['Zone Central', 'Zone East'],
                    'Asia Pacific': ['Zone East', 'Zone South'],
                    'Latin America': ['Zone South', 'Zone Central']
                };
                const allowed = regMap[filters.region] || [];
                if (allowed.length > 0 && !allowed.includes(row.Geo_Cluster)) return false;
            }

            // 3. Warehouse Filter
            if (filters.warehouse !== 'all') {
                if (filters.warehouse === 'WH-1' && row.Inventory_Level < 400) return false;
                if (filters.warehouse === 'WH-2' && (row.Inventory_Level >= 400 || row.Inventory_Level < 300)) return false;
                if (filters.warehouse === 'WH-3' && (row.Inventory_Level >= 300 || row.Inventory_Level < 200)) return false;
                if (filters.warehouse === 'WH-4' && row.Inventory_Level >= 200) return false;
            }

            // 4. Vehicle Filter
            if (filters.vehicle !== 'all') {
                if (row.Asset_ID !== filters.vehicle && !String(row.Asset_ID).includes(filters.vehicle)) return false;
            }

            // 5. Traffic Filter
            if (filters.traffic !== 'all') {
                if (filters.traffic === 'Heavy' && row.Traffic_Status !== 'Heavy') return false;
                if (filters.traffic === 'Detour' && row.Traffic_Status !== 'Detour') return false;
                if (filters.traffic === 'Clear' && row.Traffic_Status !== 'Clear') return false;
            }

            // 6. Status Filter
            if (filters.status !== 'all') {
                if (row.Shipment_Status !== filters.status) return false;
            }

            // 7. Priority Filter
            if (filters.priority !== 'all') {
                if (filters.priority === 'High' && (row.User_Transaction_Amount || 0) <= 400) return false;
                if (filters.priority === 'Medium' && ((row.User_Transaction_Amount || 0) > 400 || (row.User_Transaction_Amount || 0) <= 200)) return false;
                if (filters.priority === 'Low' && (row.User_Transaction_Amount || 0) > 200) return false;
            }

            // 8. Weather Filter
            if (filters.weather !== 'all') {
                if (filters.weather === 'Clear' && (row.Logistics_Delay_Reason === 'Weather' || row.Extreme_Weather_Flag === 1)) return false;
                if (filters.weather === 'Rain' && row.Logistics_Delay_Reason !== 'Weather') return false;
                if (filters.weather === 'Storm' && row.Extreme_Weather_Flag !== 1) return false;
            }

            // 9. Geo Cluster Filter
            if (filters.geocluster !== 'all') {
                if (row.Geo_Cluster !== filters.geocluster) return false;
            }

            // 10. Driver Filter
            if (filters.driver !== 'all') {
                const driverMap = { 'D-101': 'Truck_1', 'D-102': 'Truck_2', 'D-103': 'Truck_3' };
                if (driverMap[filters.driver] && row.Asset_ID !== driverMap[filters.driver]) return false;
            }

            return true;
        });

        window.filteredData = filtered ?? [];

        const counter = document.getElementById('filter-matching-records');
        if (counter) {
            counter.innerText = `${filtered.length.toLocaleString()} matching records`;
            if (filtered.length === 0) {
                counter.style.color = '#f87171';
                counter.style.background = 'rgba(248,113,113,0.1)';
                counter.style.borderColor = 'rgba(248,113,113,0.3)';
            } else {
                counter.style.color = '#38bdf8';
                counter.style.background = 'rgba(56,189,248,0.1)';
                counter.style.borderColor = 'rgba(56,189,248,0.2)';
            }
        }

        updateKPIsFromDataset(window.filteredData);
        updateSupplyChainHealth(window.filteredData);
        updateAIExecutiveSummary(window.filteredData);
        updateOverviewCharts(window.filteredData);
        updateSmartAIInsight(window.filteredData);

        if (typeof generateRecommendations === 'function') {
            generateRecommendations(window.filteredData);
        }

        window.dispatchEvent(new CustomEvent('globalFilterDataUpdated', { detail: { filteredData: window.filteredData } }));
        window.dispatchEvent(new CustomEvent('globalFilterChange', { detail: { filteredData: window.filteredData } }));

        if (btn) btn.innerHTML = originalText;
        if (window.lucide) lucide.createIcons();
    }, 150);
}

function resetGlobalFilters() {
    const filterIds = [
        'filter-time', 'filter-region', 'filter-warehouse', 'filter-vehicle',
        'filter-traffic', 'filter-status', 'filter-priority', 'filter-weather',
        'filter-geocluster', 'filter-driver'
    ];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = 'all';
    });

    applyGlobalFilters();
}

function renderActiveFilterChips(filters) {
    const chipsContainer = document.getElementById('active-filter-chips');
    if (!chipsContainer) return;
    chipsContainer.innerHTML = '';

    const labels = {
        time: 'Time',
        region: 'Region',
        warehouse: 'Warehouse',
        vehicle: 'Vehicle',
        traffic: 'Traffic',
        status: 'Status',
        priority: 'Priority',
        weather: 'Weather',
        geocluster: 'Cluster',
        driver: 'Driver'
    };

    let activeCount = 0;
    for (const [key, val] of Object.entries(filters)) {
        if (val !== 'all') {
            activeCount++;
            const chip = document.createElement('span');
            chip.style.cssText = 'background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.3); color: #38bdf8; font-size: 0.75rem; padding: 3px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px; font-weight: 500;';
            chip.innerHTML = `${labels[key] || key}: <strong>${val}</strong> <span style="cursor:pointer; margin-left:2px; font-weight:bold;">×</span>`;
            chip.querySelector('span').onclick = () => {
                const el = document.getElementById(`filter-${key}`);
                if (el) el.value = 'all';
                applyGlobalFilters();
            };
            chipsContainer.appendChild(chip);
        }
    }

    if (activeCount === 0) {
        chipsContainer.innerHTML = '<span style="color: #9ca3af; font-size: 0.85rem;">No active filters</span>';
    }
}

function showSectionError(section) {
    if (section === 'kpi') {
        ['kpi-deliveries', 'kpi-ontime', 'kpi-waittime', 'kpi-revenue', 'kpi-efficiency'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<span style="font-size:0.9rem; color:#f87171;">Unavailable</span>';
        });
    } else if (section === 'health') {
        const sub = document.getElementById('health-score-sub');
        const val = document.getElementById('health-score-val');
        if (val) val.innerHTML = '--<span style="font-size: 1rem; color: #a0aec0;">/100</span>';
        if (sub) {
            sub.innerHTML = 'Unable to load supply-chain health. <a href="javascript:void(0)" onclick="loadOverviewData()" style="color:#60a5fa; text-decoration:underline; margin-left:4px;">Retry</a>';
            sub.style.color = '#f87171';
        }
    } else if (section === 'ai') {
        const summaryText = document.getElementById('executive-summary-text');
        if (summaryText) {
            summaryText.innerHTML = '<p style="color: #f87171;">AI summary temporarily unavailable. <a href="javascript:void(0)" onclick="loadOverviewData()" style="color:#60a5fa; text-decoration:underline;">Retry</a></p>';
        }
    } else if (section === 'map') {
        const mapEl = document.getElementById('shipment-map');
        const fallback = document.getElementById('map-error-fallback');
        if (mapEl && fallback) {
            mapEl.style.display = 'none';
            fallback.style.display = 'flex';
        }
    }
}

// ----------------------------------------------------
// AI CONTROL TOWER JS LOGIC (Patches 1, 2, 3, 5, 8, 9)
// ----------------------------------------------------



// 3. Slide-In Drawer Logic
const drawer = document.getElementById('slide-in-drawer');
const closeDrawerBtn = document.getElementById('close-drawer-btn');

function openDrawer(shipment) {
    document.getElementById('drawer-shipment-id').innerText = shipment.id;
    document.getElementById('drawer-route').innerText = shipment.route;
    document.getElementById('drawer-prob').innerText = shipment.prob;
    document.getElementById('drawer-risk').innerText = shipment.risk;
    document.getElementById('drawer-conf').innerText = '94%';
    
    const badge = document.getElementById('drawer-status-badge');
    badge.innerText = shipment.status.toUpperCase();
    badge.className = `badge bg-${shipment.status === 'critical' ? 'red' : shipment.status === 'warning' ? 'yellow' : 'green'}`;
    
    drawer.classList.add('open');
}

if(closeDrawerBtn) {
    closeDrawerBtn.onclick = () => drawer.classList.remove('open');
}

// 4. What-If Simulator
const simBudget = document.getElementById('sim-budget');
const simBudgetVal = document.getElementById('sim-budget-val');
const simMode = document.getElementById('sim-mode');
const runSimBtn = document.getElementById('run-sim-btn');
const simResults = document.getElementById('sim-results');
const simResDelay = document.getElementById('sim-res-delay');
const simResCost = document.getElementById('sim-res-cost');

if(simBudget) {
    simBudget.oninput = (e) => simBudgetVal.innerText = `$${parseInt(e.target.value).toLocaleString()}`;
    runSimBtn.onclick = async () => {
        runSimBtn.innerHTML = '<i data-lucide="loader"></i> Simulating...';
        lucide.createIcons();
        
        try {
            const reqBody = {
                shipment_id: 1, // Mock shipment ID for the UI drawer
                required_quantity: 800, // Hardcoded for this demo, usually would be from shipment data
                maximum_budget: parseInt(simBudget.value)
            };
            
            const response = await fetch('http://localhost:8080/simulate-optimization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
            });
            const result = await response.json();
            
            simResults.style.display = 'block';
            runSimBtn.innerHTML = 'Run Simulation';
            
            if (result.status === 'success') {
                simResDelay.innerText = `${result.feasible ? 'OPTIMAL' : 'INFEASIBLE'}`;
                simResCost.innerText = `$${result.total_cost.toLocaleString()}`;
                
                // Populate audit UI
                const audit = result.audit;
                const statusEl = document.getElementById('audit-solver-status');
                statusEl.innerText = audit.solver_success ? '✓ OPTIMAL' : '✗ FAILED';
                statusEl.style.color = audit.solver_success ? '#4ade80' : '#f87171';
                
                document.getElementById('audit-maximum-budget').innerText = `$${audit.maximum_budget.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}`;
                document.getElementById('audit-optimized-cost').innerText = `$${audit.calculated_total_cost.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}`;
                document.getElementById('audit-remaining-budget').innerText = `$${audit.remaining_budget.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}`;
                document.getElementById('audit-budget-utilization').innerText = `${audit.budget_utilization.toFixed(2)}%`;
                
                const constraintStatusEl = document.getElementById('audit-constraint-status');
                if (audit.budget_constraint_status === "PASSED") {
                    constraintStatusEl.innerText = '✓ PASSED';
                    constraintStatusEl.style.color = '#4ade80';
                } else {
                    constraintStatusEl.innerText = '✗ FAILED';
                    constraintStatusEl.style.color = '#f87171';
                }
                
                const recommendationEl = document.getElementById('audit-recommendation');
                if (audit.overall_feasibility === "FEASIBLE") {
                    recommendationEl.innerText = '✓ FEASIBLE';
                    recommendationEl.style.color = '#4ade80';
                } else {
                    recommendationEl.innerText = '✗ BLOCKED';
                    recommendationEl.style.color = '#f87171';
                }
                
                const executeBtn = document.getElementById('btn-execute');
                const blockedMsg = document.getElementById('execution-blocked-msg');
                if (audit.solver_success && audit.budget_constraint_status === "PASSED" && audit.overall_feasibility === "FEASIBLE") {
                    executeBtn.disabled = false;
                    executeBtn.style.opacity = "1";
                    document.getElementById('execution-feedback').style.display = "none";
                    blockedMsg.style.display = "none";
                } else {
                    executeBtn.disabled = true;
                    executeBtn.style.opacity = "0.5";
                    document.getElementById('execution-feedback').style.display = "none";
                    blockedMsg.style.display = "block";
                }
                window.currentAuditResult = result;
            }
        } catch (error) {
            console.error("Simulation error:", error);
            runSimBtn.innerHTML = 'Run Simulation';
            alert("Failed to connect to optimization server.");
        }
    };
}

const toggleAuditBtn = document.getElementById('toggle-audit-btn');
if (toggleAuditBtn) {
    toggleAuditBtn.onclick = () => {
        const container = document.getElementById('audit-table-container');
        if (container.style.display === 'none') {
            container.style.display = 'block';
            toggleAuditBtn.innerText = 'Hide Details';
        } else {
            container.style.display = 'none';
            toggleAuditBtn.innerText = 'View Solver Details';
        }
    };
}

const executeBtn = document.getElementById('btn-execute');
if (executeBtn) {
    executeBtn.onclick = async () => {
        if (!window.currentAuditResult || !window.currentAuditResult.feasible) {
            return;
        }
        executeBtn.innerHTML = '<i data-lucide="loader"></i> Executing...';
        lucide.createIcons();
        
        try {
            const reqBody = {
                shipment_id: 1, // Matches simulator
                required_quantity: 800,
                maximum_budget: parseInt(document.getElementById('sim-budget').value)
            };
            
            const response = await fetch('http://localhost:8080/execute-decision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
            });
            const result = await response.json();
            
            const fb = document.getElementById('execution-feedback');
            fb.style.display = "block";
            
            if (response.ok && result.status === 'success') {
                executeBtn.innerHTML = '<i data-lucide="check"></i> Decision Executed';
                
                fb.style.background = "rgba(74, 222, 128, 0.1)";
                fb.style.border = "1px solid rgba(74, 222, 128, 0.3)";
                fb.innerHTML = `
                    <div style="color: #4ade80; font-weight: bold; margin-bottom: 5px;">✓ Decision Executed</div>
                    <div><strong>Decision ID:</strong> ${result.decision_id}</div>
                    <div><strong>Selected Option:</strong> ${result.selected_option}</div>
                    <div><strong>Optimized Cost:</strong> $${result.total_cost.toLocaleString()}</div>
                    <div><strong>Execution Time:</strong> ${new Date().toLocaleString()}</div>
                    <div style="margin-top: 5px; color: #4ade80;">✓ CONSTRAINTS PASSED</div>
                    <div style="color: #4ade80;">✓ DATABASE INSERTED</div>
                `;
            } else {
                executeBtn.innerHTML = '<i data-lucide="play"></i> Execute';
                fb.style.background = "rgba(248, 113, 113, 0.1)";
                fb.style.border = "1px solid rgba(248, 113, 113, 0.3)";
                fb.innerHTML = `
                    <div style="color: #f87171; font-weight: bold; margin-bottom: 5px;">✗ Execution Failed</div>
                    <div style="color: #e2e8f0;">${result.detail || 'Database write-back was unsuccessful.'}</div>
                `;
            }
            lucide.createIcons();
        } catch (error) {
            console.error("Execution error:", error);
            executeBtn.innerHTML = '<i data-lucide="play"></i> Execute';
            lucide.createIcons();
            
            const fb = document.getElementById('execution-feedback');
            fb.style.display = "block";
            fb.style.background = "rgba(248, 113, 113, 0.1)";
            fb.style.border = "1px solid rgba(248, 113, 113, 0.3)";
            fb.innerHTML = `
                    <div style="color: #f87171; font-weight: bold; margin-bottom: 5px;">✗ Execution Failed</div>
                    <div style="color: #e2e8f0;">Server connection error.</div>
                `;
        }
    };
}

// 5. Floating AI Assistant
const fab = document.getElementById('ai-fab-btn');
const chatWindow = document.getElementById('ai-chat-window');
const closeChatBtn = document.getElementById('close-chat-btn');
const chatInput = document.getElementById('chat-input-field');
const sendChatBtn = document.getElementById('send-chat-btn');
const chatBody = document.getElementById('chat-body');

if(fab) {
    fab.onclick = () => chatWindow.classList.remove('hidden');
    closeChatBtn.onclick = () => chatWindow.classList.add('hidden');
    
    sendChatBtn.onclick = handleChat;
    chatInput.onkeypress = (e) => { if(e.key === 'Enter') handleChat(); };
    
    function handleChat() {
        const text = chatInput.value.trim();
        if(!text) return;
        
        // User bubble
        const userDiv = document.createElement('div');
        userDiv.className = 'chat-bubble user';
        userDiv.innerText = text;
        chatBody.appendChild(userDiv);
        chatInput.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;
        
        // Bot response (Mock)
        setTimeout(() => {
            const botDiv = document.createElement('div');
            botDiv.className = 'chat-bubble bot';
            botDiv.innerHTML = `I analyzed the network. <strong>SHP-902</strong> is your biggest risk due to severe weather in Seattle. Recommend switching to Air Freight to save $12,000 in SLA penalties.`;
            chatBody.appendChild(botDiv);
            chatBody.scrollTop = chatBody.scrollHeight;
            showNotification('AI Analysis Complete', 'Recommendation ready for SHP-902');
        }, 1000);
    }
}

// 6. Smart Notifications
function showNotification(title, msg) {
    const container = document.getElementById('notification-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="bell" style="color: var(--text-highlight);"></i> <div><strong style="display:block;">${title}</strong><span style="font-size:0.8rem; color:#9ca3af;">${msg}</span></div>`;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 5s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Explain button opens XAI tab and loads explanation
document.getElementById('btn-explain')?.addEventListener('click', () => {
    const xaiNav = document.querySelector('[data-target="xai-section"]');
    if (xaiNav) {
        xaiNav.click();
    }
});




// ====================================================
// EXECUTIVE DECISION CENTER (Recommendations Logic)
// ====================================================

function generateRecommendations(dataset) {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (!dataset || dataset.length === 0) {
        document.getElementById('rec-total-count').innerText = 0;
        document.getElementById('rec-high-count').innerText = 0;
        document.getElementById('rec-medium-count').innerText = 0;
        document.getElementById('rec-low-count').innerText = 0;
        container.innerHTML = '<div style="color: #9ca3af;">No data available to generate recommendations.</div>';
        return;
    }

    const recs = [];

    // 1. Route Optimization & Geo-Cluster Performance
    const clusterWait = {};
    const clusterCount = {};
    dataset.forEach(d => {
        clusterWait[d.Geo_Cluster] = (clusterWait[d.Geo_Cluster] || 0) + d.Waiting_Time;
        clusterCount[d.Geo_Cluster] = (clusterCount[d.Geo_Cluster] || 0) + 1;
    });
    let worstCluster = 'None';
    let worstClusterDelay = 0;
    for (const c in clusterWait) {
        const avg = clusterWait[c] / clusterCount[c];
        if (avg > worstClusterDelay) {
            worstClusterDelay = avg;
            worstCluster = c;
        }
    }
    
    recs.push({
        id: 'rec-1',
        title: 'Route Optimization & Geo-Cluster Performance',
        category: 'Routing',
        shortDesc: 'Implement dynamic routing algorithms for underperforming regions.',
        keyMetric: `${Math.round(worstClusterDelay)} min avg delay`,
        priority: worstClusterDelay > 30 ? 'HIGH' : worstClusterDelay > 15 ? 'MEDIUM' : 'LOW',
        priorityScore: worstClusterDelay > 30 ? 3 : worstClusterDelay > 15 ? 2 : 1,
        evidence: `Geo-Cluster "${worstCluster}" shows the highest average delay of ${Math.round(worstClusterDelay)} minutes across ${clusterCount[worstCluster] || 0} shipments in the current dataset.`,
        supportingMetrics: `Affected Shipments: ${clusterCount[worstCluster] || 0} | Max Allowed Wait: 20 mins`,
        action: `Prioritize route analysis and allocate overflow assets to ${worstCluster} during peak demand.`,
        hasExecution: true,
        buttonText: "Apply Recommendation (Optimize)"
    });

    // 2. Driver & Asset Performance Improvement
    let totalScore = 0;
    let mechFailures = 0;
    dataset.forEach(d => {
        totalScore += d.Asset_Performance_Score;
        if (d.Logistics_Delay_Reason === 'Mechanical Failure') mechFailures++;
    });
    const avgScore = totalScore / dataset.length;
    
    recs.push({
        id: 'rec-2',
        title: 'Driver & Asset Performance Improvement',
        category: 'Assets',
        shortDesc: 'Institute targeted training and preventative maintenance schedules.',
        keyMetric: `${Math.round(avgScore)} Avg Score`,
        priority: avgScore < 4500 ? 'HIGH' : avgScore < 6000 ? 'MEDIUM' : 'LOW',
        priorityScore: avgScore < 4500 ? 3 : avgScore < 6000 ? 2 : 1,
        evidence: `Average asset performance score is currently ${Math.round(avgScore)} with ${mechFailures} recorded mechanical failures in the subset.`,
        supportingMetrics: `Mechanical Failures: ${mechFailures} | Target Score: >6000`,
        action: `Implement preventative maintenance schedules for vehicles that repeatedly log "Vehicle Breakdown" and trigger retraining.`,
        hasExecution: false,
        buttonText: "View Asset Analysis"
    });

    // 3. Cost Optimization & Revenue Alignment
    let highValueCount = 0;
    let highValueDelayed = 0;
    let highValueRevenueAtRisk = 0;
    dataset.forEach(d => {
        if (d.User_Transaction_Amount > 350) {
            highValueCount++;
            if (d.Shipment_Status === 'Delayed') {
                highValueDelayed++;
                highValueRevenueAtRisk += d.User_Transaction_Amount;
            }
        }
    });
    
    recs.push({
        id: 'rec-3',
        title: 'Cost Optimization & Revenue Alignment',
        category: 'Cost',
        shortDesc: 'Introduce a tiered SLA system prioritizing high-value transactions.',
        keyMetric: `${highValueDelayed} High-Value Delays`,
        priority: highValueDelayed > 20 ? 'HIGH' : highValueDelayed > 5 ? 'MEDIUM' : 'LOW',
        priorityScore: highValueDelayed > 20 ? 3 : highValueDelayed > 5 ? 2 : 1,
        evidence: `${highValueDelayed} high-value shipments (>$350) were delayed, putting $${Math.round(highValueRevenueAtRisk).toLocaleString()} of premium revenue at risk.`,
        supportingMetrics: `Premium Shipments: ${highValueCount} | Revenue at Risk: $${Math.round(highValueRevenueAtRisk).toLocaleString()}`,
        action: `Algorithmically prioritize premium shipments in dispatching queues over standard deliveries.`,
        hasExecution: false,
        buttonText: "View Revenue KPIs"
    });

    // 4. Delay Reduction via Predictive Modeling
    let totalDelayed = 0;
    let trafficDelayed = 0;
    dataset.forEach(d => {
        if (d.Shipment_Status === 'Delayed') {
            totalDelayed++;
            if (d.Traffic_Status === 'Heavy' || d.Traffic_Status === 'Detour') {
                trafficDelayed++;
            }
        }
    });
    const trafficDelayPct = totalDelayed > 0 ? (trafficDelayed / totalDelayed) * 100 : 0;
    
    recs.push({
        id: 'rec-4',
        title: 'Delay Reduction via Predictive Modeling',
        category: 'Delays',
        shortDesc: 'Integrate real-time APIs to dynamically pad ETAs.',
        keyMetric: `${Math.round(trafficDelayPct)}% Traffic Delays`,
        priority: trafficDelayPct > 40 ? 'HIGH' : trafficDelayPct > 20 ? 'MEDIUM' : 'LOW',
        priorityScore: trafficDelayPct > 40 ? 3 : trafficDelayPct > 20 ? 2 : 1,
        evidence: `Adverse traffic conditions (Heavy/Detour) directly account for ${Math.round(trafficDelayPct)}% of all delayed shipments.`,
        supportingMetrics: `Traffic Delays: ${trafficDelayed} | Total Delays: ${totalDelayed}`,
        action: `Integrate real-time traffic APIs. When heavy traffic is anticipated, automatically pad estimated delivery times by 25%.`,
        hasExecution: false,
        buttonText: "View Traffic Analysis"
    });

    // 5. Vehicle Utilization
    let totalUtil = 0;
    dataset.forEach(d => {
        totalUtil += d.Asset_Utilization;
    });
    const avgUtil = totalUtil / dataset.length;
    
    recs.push({
        id: 'rec-5',
        title: 'Vehicle Utilization',
        category: 'Assets',
        shortDesc: 'Develop a hybrid fleet model balancing internal and 3PL assets.',
        keyMetric: `${avgUtil.toFixed(1)}% Avg Utilization`,
        priority: avgUtil < 70 ? 'HIGH' : avgUtil < 85 ? 'MEDIUM' : 'LOW',
        priorityScore: avgUtil < 70 ? 3 : avgUtil < 85 ? 2 : 1,
        evidence: `Average fleet utilization is currently at ${avgUtil.toFixed(1)}%, indicating inefficiencies in baseline demand planning.`,
        supportingMetrics: `Current Fleet Avg: ${avgUtil.toFixed(1)}% | Ideal Baseline: 80%`,
        action: `Maintain a core fleet running at 80% utilization for baseline demand, and rely on 3PL contractors for peak periods.`,
        hasExecution: false,
        buttonText: "View Utilization KPIs"
    });

    // Sorting
    const sortVal = document.getElementById('rec-sort-select') ? document.getElementById('rec-sort-select').value : 'priority';
    if (sortVal === 'category') {
        recs.sort((a, b) => a.category.localeCompare(b.category));
    } else {
        recs.sort((a, b) => b.priorityScore - a.priorityScore);
    }

    // Rendering
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    recs.forEach(rec => {
        if (rec.priority === 'HIGH') highCount++;
        else if (rec.priority === 'MEDIUM') mediumCount++;
        else lowCount++;

        const colorMap = { 'HIGH': '#f87171', 'MEDIUM': '#fbbf24', 'LOW': '#4ade80' };
        const bgMap = { 'HIGH': 'rgba(248, 113, 113, 0.1)', 'MEDIUM': 'rgba(251, 191, 36, 0.1)', 'LOW': 'rgba(74, 222, 128, 0.1)' };
        const color = colorMap[rec.priority];
        const bg = bgMap[rec.priority];

        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.cssText = `border-left: 4px solid ${color}; padding: 15px; position: relative; transition: all 0.3s ease; margin-bottom: 0;`;
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer;" onclick="toggleRec('${rec.id}')">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <h3 style="margin: 0; font-size: 1.1rem; color: #fff;">${rec.title}</h3>
                        <span style="background: ${bg}; color: ${color}; border: 1px solid ${color}80; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: bold;">${rec.priority}</span>
                    </div>
                    <p style="margin: 0; color: #9ca3af; font-size: 0.9rem;">${rec.shortDesc}</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold; color: #60a5fa; font-size: 1.1rem;">${rec.keyMetric}</div>
                    <i data-lucide="chevron-down" id="icon-${rec.id}" style="transition: transform 0.3s; color: #9ca3af; width: 20px; margin-top: 5px; display: inline-block;"></i>
                </div>
            </div>

            <div id="details-${rec.id}" style="display: none; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; animation: fadeIn 0.3s ease;">
                
                <div style="margin-bottom: 15px;">
                    <strong style="color: #c084fc; font-size: 0.85rem; text-transform: uppercase;">Evidence (Data-driven insight)</strong>
                    <p style="margin: 5px 0 0 0; color: #e5e7eb; font-size: 0.95rem;">${rec.evidence}</p>
                    <div style="color: #9ca3af; font-size: 0.8rem; margin-top: 5px;">Metrics: ${rec.supportingMetrics}</div>
                </div>

                <div style="margin-bottom: 15px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; border-left: 2px solid #60a5fa;">
                    <strong style="color: #60a5fa; font-size: 0.85rem; text-transform: uppercase;">Recommended Action</strong>
                    <p style="margin: 5px 0 0 0; color: #e5e7eb; font-size: 0.95rem;">${rec.action}</p>
                </div>

                <div style="display: flex; justify-content: flex-end;">
                    <button class="glass-btn ${rec.hasExecution ? 'primary' : ''}" onclick="executeRecAction('${rec.id}')">
                        <i data-lucide="${rec.hasExecution ? 'play' : 'bar-chart-2'}" style="width: 16px; height: 16px;"></i> 
                        <span style="margin-left: 5px;">${rec.buttonText}</span>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    document.getElementById('rec-total-count').innerText = recs.length;
    document.getElementById('rec-high-count').innerText = highCount;
    document.getElementById('rec-medium-count').innerText = mediumCount;
    document.getElementById('rec-low-count').innerText = lowCount;
    
    if (window.lucide) lucide.createIcons();
}

window.toggleRec = function(id) {
    const details = document.getElementById(`details-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    if (details.style.display === 'none' || details.style.display === '') {
        details.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
    } else {
        details.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
}

window.executeRecAction = function(id) {
    if (id === 'rec-1') {
        document.getElementById('xai-section').classList.remove('hidden');
        document.getElementById('reports-section').classList.add('hidden');
        document.querySelectorAll('#nav-menu li').forEach(nav => nav.classList.remove('active'));
        document.querySelector('[data-target="xai-section"]').classList.add('active');
        
        setTimeout(() => {
            const simBtn = document.querySelector('#xai-recommendation-panel button');
            if (simBtn) simBtn.click();
        }, 100);
    } else if (id === 'rec-4') {
        document.getElementById('geo-section').classList.remove('hidden');
        document.getElementById('reports-section').classList.add('hidden');
        document.querySelectorAll('#nav-menu li').forEach(nav => nav.classList.remove('active'));
        document.querySelector('[data-target="geo-section"]').classList.add('active');
    } else {
        document.getElementById('overview-section').classList.remove('hidden');
        document.getElementById('reports-section').classList.add('hidden');
        document.querySelectorAll('#nav-menu li').forEach(nav => nav.classList.remove('active'));
        document.querySelector('[data-target="overview-section"]').classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('rec-sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            // Re-apply filters which will also trigger generateRecommendations with filteredData
            if (typeof applyFilters === 'function') {
                applyFilters();
            } else if (window.masterDataset) {
                generateRecommendations(window.masterDataset);
            }
        });
    }
});

// ==============================
// XAI MODULE LOGIC
// ==============================

let currentXaiShipmentId = 0;
let currentXaiIndex = 0;
let xaiBaselineData = null;
let xaiLoading = false;
let xaiError = null;

function getXAIScopeList() {
    if (Array.isArray(window.filteredData) && window.filteredData.length > 0) {
        return window.filteredData;
    }
    if (Array.isArray(window.masterDataset) && window.masterDataset.length > 0) {
        return window.masterDataset;
    }
    return [];
}

async function loadXAIData(targetIdentifier) {
    const scopeList = getXAIScopeList();
    const badgeEl = document.getElementById('xai-shipment-id-badge');
    const barsContainer = document.getElementById('xai-feature-bars-container');
    const decisionFlowContainer = document.getElementById('xai-decision-flow');
    const summaryText = document.getElementById('xai-summary-text');
    const prevBtn = document.getElementById('xai-prev-btn');
    const nextBtn = document.getElementById('xai-next-btn');

    // 1. Validate Scope and Identifier
    if (scopeList.length === 0) {
        if (badgeEl) badgeEl.innerText = "No Shipments";
        if (barsContainer) {
            barsContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #9ca3af;">No explainability data is available for this asset.</div>`;
        }
        if (decisionFlowContainer) {
            decisionFlowContainer.innerHTML = `<div class="xai-flow-node" style="color: #9ca3af;">No active data in current filter</div>`;
        }
        if (summaryText) {
            summaryText.innerText = "Selected asset is outside the current filter scope. Adjust filters to load data.";
        }
        return;
    }

    // Determine target index and record
    let targetRecord = null;
    if (typeof targetIdentifier === 'number') {
        if (targetIdentifier >= 0 && targetIdentifier < scopeList.length) {
            currentXaiIndex = targetIdentifier;
            targetRecord = scopeList[currentXaiIndex];
        } else {
            currentXaiIndex = 0;
            targetRecord = scopeList[0];
        }
    } else if (typeof targetIdentifier === 'string') {
        const foundIdx = scopeList.findIndex(s => 
            String(s.Asset_ID || '').toLowerCase() === targetIdentifier.toLowerCase() ||
            String(s.shipment_id || '') === targetIdentifier
        );
        if (foundIdx !== -1) {
            currentXaiIndex = foundIdx;
            targetRecord = scopeList[currentXaiIndex];
        } else {
            currentXaiIndex = 0;
            targetRecord = scopeList[0];
        }
    } else {
        currentXaiIndex = 0;
        targetRecord = scopeList[0];
    }

    const assetId = targetRecord.Asset_ID || `Shipment_${currentXaiIndex}`;
    currentXaiShipmentId = currentXaiIndex;
    window.currentXaiShipmentId = currentXaiShipmentId;

    // Update navigation button states
    if (prevBtn) prevBtn.disabled = currentXaiIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentXaiIndex >= scopeList.length - 1;

    // 2. Set LOADING State
    xaiLoading = true;
    xaiError = null;
    if (badgeEl) badgeEl.innerText = `Shipment #${currentXaiIndex + 1} (${assetId})`;
    
    if (barsContainer) {
        barsContainer.innerHTML = `
            <div id="xai-loading-indicator" style="padding: 30px; text-align: center; color: #60a5fa;">
                <div style="display: inline-block; width: 24px; height: 24px; border: 3px solid rgba(96,165,250,0.3); border-top-color: #60a5fa; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 10px;"></div>
                <div style="font-size: 0.9rem;">Loading explainability data for ${assetId}...</div>
            </div>
        `;
    }
    if (decisionFlowContainer) {
        decisionFlowContainer.innerHTML = `
            <div class="xai-flow-node" style="opacity: 0.5;">Analyzing Features...</div>
            <div class="xai-flow-arrow" style="opacity: 0.5;">↓</div>
            <div class="xai-flow-node" style="opacity: 0.5;">Evaluating Constraints...</div>
        `;
    }
    if (summaryText) summaryText.innerText = "Loading explainability...";

    // 3. Fetch from Backend with Timeout & Auth Handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const headers = { 'Accept': 'application/json' };
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const fetchUrl = `http://localhost:8080/xai-explanation/${encodeURIComponent(assetId)}`;
        const res = await fetch(fetchUrl, {
            headers,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.status === 401 || res.status === 403) {
            throw new Error("AUTH_ERROR: Authentication required or session expired.");
        }
        if (res.status === 404) {
            throw new Error(`NOT_FOUND: Explainability unavailable for selected asset (${assetId}).`);
        }
        if (!res.ok) {
            throw new Error(`SERVER_ERROR: Backend returned HTTP ${res.status}`);
        }

        const data = await res.json();
        xaiBaselineData = data;
        xaiLoading = false;
        xaiError = null;

        updateXAIUI(data);

    } catch (err) {
        clearTimeout(timeoutId);
        xaiLoading = false;
        console.error("XAI Data Load Error:", err);

        let errorMsg = "Unable to load explainability data.";
        if (err.name === 'AbortError') {
            errorMsg = "XAI request timed out.";
        } else if (err.message && err.message.startsWith("AUTH_ERROR")) {
            errorMsg = "Authentication required. Please log in.";
        } else if (err.message && err.message.startsWith("NOT_FOUND")) {
            errorMsg = `Explainability unavailable for selected asset (${assetId}).`;
        }

        xaiError = errorMsg;

        // Render ERROR State with Retry Button
        if (barsContainer) {
            barsContainer.innerHTML = `
                <div style="padding: 24px; text-align: center; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.3); border-radius: 8px; margin: 10px 0;">
                    <div style="color: #f87171; font-weight: 600; margin-bottom: 8px;">${errorMsg}</div>
                    <p style="color: #9ca3af; font-size: 0.8rem; margin-bottom: 12px;">The server or network could not fulfill the explainability calculation.</p>
                    <button class="glass-btn primary" onclick="retryXAILoad()" style="padding: 6px 18px; font-size: 0.85rem;">Retry</button>
                </div>
            `;
        }
        if (decisionFlowContainer) {
            decisionFlowContainer.innerHTML = `
                <div class="xai-flow-node" style="border-color: rgba(248,113,113,0.4); color: #fca5a5;">Decision Flow Unavailable</div>
            `;
        }
        if (summaryText) {
            summaryText.innerText = "Explainability analysis could not be generated. Click Retry to re-attempt.";
        }

        if (typeof showNotification === 'function') {
            showNotification('XAI Error', errorMsg, 'error');
        }
    }
}

window.retryXAILoad = function() {
    xaiError = null;
    loadXAIData(currentXaiShipmentId);
};

function updateXAIUI(data) {
    if (!data) return;

    const predData = data.prediction_data || data;
    const recData = data.recommendation || {};
    const confData = data.confidence || {};
    const decisionFlow = data.decision_flow || [];

    // 1. Prescriptive AI Recommendation Card
    const actionEl = document.getElementById('xai-rec-action');
    const impactEl = document.getElementById('xai-rec-impact');
    const riskEl = document.getElementById('xai-rec-risk');
    const costEl = document.getElementById('xai-rec-cost');
    const confEl = document.getElementById('xai-rec-conf');

    const actionVal = recData.action || recData.Recommendation || "No action required";
    if (actionEl) actionEl.innerText = actionVal;
    if (impactEl) impactEl.innerText = recData.impact || recData.expected_impact || recData.ExpectedDelayReduction || "--";
    if (riskEl) riskEl.innerText = recData.risk_reduction || recData.RiskReduction || "Moderate";
    if (costEl) costEl.innerText = recData.ExpectedCost || (recData.cost ? `$${Number(recData.cost).toLocaleString()}` : "--");
    if (confEl) confEl.innerText = recData.Confidence || (confData.RecommendationConfidence ? `${confData.RecommendationConfidence}%` : "95%");

    // 2. Feature Contributions (SHAP)
    const barsContainer = document.getElementById('xai-feature-bars-container');
    if (barsContainer) {
        barsContainer.innerHTML = '';
        const features = data.top_features || data.features || predData.top_features || [];

        if (Array.isArray(features) && features.length > 0) {
            let maxAbsContrib = Math.max(...features.map(f => Math.abs(Number(f.contribution) || 0)));
            if (maxAbsContrib === 0) maxAbsContrib = 1;

            features.slice(0, 6).forEach(feat => {
                const contribVal = Number(feat.contribution) || 0;
                const width = Math.min(100, Math.max(5, (Math.abs(contribVal) / maxAbsContrib) * 100));
                const isPositiveRisk = contribVal > 0;
                const colorClass = isPositiveRisk ? 'positive' : 'negative';
                const displayName = feat.business_name || feat.name || feat.feature || 'Feature';
                const featVal = typeof feat.value === 'number' ? feat.value.toFixed(1) : (feat.value || '0');

                barsContainer.innerHTML += `
                    <div class="xai-feature-row">
                        <div class="xai-feature-name" title="${displayName}">${displayName} (${featVal})</div>
                        <div class="xai-feature-bar-container">
                            <div class="xai-feature-bar ${colorClass}" style="width: ${width}%;"></div>
                        </div>
                        <div style="width: 22%; text-align: right; font-size: 0.8rem; color: ${isPositiveRisk ? '#fca5a5' : '#86efac'}; font-weight: 600;">
                            ${contribVal > 0 ? '+' : ''}${contribVal.toFixed(2)}
                        </div>
                    </div>
                `;
            });
        } else {
            barsContainer.innerHTML = '<div style="padding: 15px; color: #9ca3af; text-align: center;">No significant feature deviations detected.</div>';
        }
    }

    // 3. AI Decision Flow
    const decisionFlowContainer = document.getElementById('xai-decision-flow');
    if (decisionFlowContainer) {
        decisionFlowContainer.innerHTML = '';
        if (Array.isArray(decisionFlow) && decisionFlow.length > 0) {
            decisionFlow.forEach((nodeText, idx) => {
                let nodeStyle = '';
                if (nodeText.includes('Critical') || nodeText.includes('Elevated') || nodeText.includes('High')) {
                    nodeStyle = 'border-color: rgba(248,113,113,0.5); color: #fca5a5;';
                } else if (nodeText.includes('Action:') || nodeText.includes('Optimal') || nodeText.includes('Verified')) {
                    nodeStyle = 'border-color: rgba(16,185,129,0.5); color: #6ee7b7; background: rgba(16,185,129,0.1);';
                }

                decisionFlowContainer.innerHTML += `<div class="xai-flow-node" style="${nodeStyle}">${nodeText}</div>`;
                if (idx < decisionFlow.length - 1) {
                    decisionFlowContainer.innerHTML += `<div class="xai-flow-arrow">↓</div>`;
                }
            });
        } else {
            // Fallback dynamic flow
            decisionFlowContainer.innerHTML = `
                <div class="xai-flow-node">Model Features Ingested</div>
                <div class="xai-flow-arrow">↓</div>
                <div class="xai-flow-node">SHAP Attribution Computed</div>
                <div class="xai-flow-arrow">↓</div>
                <div class="xai-flow-node" style="border-color: rgba(16,185,129,0.5); color: #6ee7b7; background: rgba(16,185,129,0.1);">Prescriptive Strategy Derived</div>
            `;
        }
    }

    // 4. Explanation Summary Text
    const summaryText = document.getElementById('xai-summary-text');
    if (summaryText) {
        summaryText.innerText = data.business_explanation || predData.business_explanation || "Optimization engine evaluated operational features and verified constraint feasibility.";
    }

    // 5. Constraints baseline
    const chkBudget = document.getElementById('xai-chk-budget');
    const chkWh = document.getElementById('xai-chk-wh');
    const chkTrans = document.getElementById('xai-chk-trans');
    if (chkBudget) chkBudget.innerText = "Baseline";
    if (chkWh) chkWh.innerText = "Baseline";
    if (chkTrans) chkTrans.innerText = "Baseline";

    if (window.lucide) lucide.createIcons();
}

// Interactivity & Sliders
document.addEventListener('DOMContentLoaded', () => {
    
    // Navigation: Prev / Next
    document.getElementById('xai-prev-btn')?.addEventListener('click', () => {
        const scopeList = getXAIScopeList();
        if (currentXaiIndex > 0) {
            currentXaiIndex--;
            loadXAIData(currentXaiIndex);
        }
    });
    
    document.getElementById('xai-next-btn')?.addEventListener('click', () => {
        const scopeList = getXAIScopeList();
        if (currentXaiIndex < scopeList.length - 1) {
            currentXaiIndex++;
            loadXAIData(currentXaiIndex);
        }
    });
    
    // Also load XAI data when tab is clicked
    const xaiTab = document.querySelector('[data-target="xai-section"]');
    if (xaiTab) {
        xaiTab.addEventListener('click', () => {
            loadXAIData(currentXaiIndex);
        });
    }

    // Initialize What-If Decision Simulator
    initWhatIfSimulator();
});

function initWhatIfSimulator() {
    const trafficEl = document.getElementById('web-sim-traffic');
    const tempEl = document.getElementById('web-sim-temp');
    const priorityEl = document.getElementById('web-sim-priority');
    const availEl = document.getElementById('web-sim-avail');
    const budgetEl = document.getElementById('web-sim-budget');
    const routeEl = document.getElementById('web-sim-route');
    const resetBtn = document.getElementById('sim-reset-btn');

    if (!tempEl) return;

    function runWebSimulation() {
        const traffic = trafficEl ? trafficEl.value : "Clear";
        const temp = parseFloat(tempEl.value) || 25;
        const priority = parseInt(priorityEl.value) || 5;
        const avail = parseFloat(availEl.value) || 75;
        const budget = parseFloat(budgetEl.value) || 12500;
        const mode = routeEl ? routeEl.value : "Auto";

        if (document.getElementById('val-web-temp')) document.getElementById('val-web-temp').innerText = `${temp}°C`;
        if (document.getElementById('val-web-priority')) document.getElementById('val-web-priority').innerText = `Level ${priority}`;
        if (document.getElementById('val-web-avail')) document.getElementById('val-web-avail').innerText = `${avail}%`;
        if (document.getElementById('val-web-budget')) document.getElementById('val-web-budget').innerText = `₹${budget.toLocaleString()}`;

        fetch('http://localhost:8080/simulate-what-if', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shipment_id: window.currentXaiShipmentId || 0,
                modifications: {
                    Traffic_Status: traffic,
                    Temperature: temp,
                    User_Purchase_Frequency: priority,
                    Asset_Utilization: avail
                },
                maximum_budget: budget,
                selected_mode: mode
            })
        })
        .then(res => {
            if (!res.ok) throw new Error("Simulation endpoint error");
            return res.json();
        })
        .then(data => {
            if (!data || !data.what_if) return;
            if (document.getElementById('web-sim-traffic-val')) document.getElementById('web-sim-traffic-val').innerText = data.what_if.traffic;
            if (document.getElementById('web-sim-delay-val')) document.getElementById('web-sim-delay-val').innerText = `${data.what_if.predicted_delay_mins} min`;
            if (document.getElementById('web-sim-risk-val')) document.getElementById('web-sim-risk-val').innerText = data.what_if.risk_level;
            if (document.getElementById('web-sim-cost-val')) document.getElementById('web-sim-cost-val').innerText = data.what_if.cost_formatted;
            if (document.getElementById('web-sim-rec-val')) document.getElementById('web-sim-rec-val').innerText = data.what_if.recommendation;

            if (document.getElementById('web-curr-traffic')) document.getElementById('web-curr-traffic').innerText = data.current.traffic;
            if (document.getElementById('web-curr-delay')) document.getElementById('web-curr-delay').innerText = `${data.current.predicted_delay_mins} min`;
            if (document.getElementById('web-curr-risk')) document.getElementById('web-curr-risk').innerText = data.current.risk_level;
            if (document.getElementById('web-curr-cost')) document.getElementById('web-curr-cost').innerText = data.current.cost_formatted;
            if (document.getElementById('web-curr-rec')) document.getElementById('web-curr-rec').innerText = data.current.recommendation;

            if (document.getElementById('web-sim-rec-action')) document.getElementById('web-sim-rec-action').innerText = data.recommended_action;

            const chip = document.getElementById('web-sim-status-chip');
            if (chip) {
                chip.innerText = data.constraint_status;
                if (data.execution_blocked) {
                    chip.style.background = 'rgba(239,68,68,0.2)';
                    chip.style.border = '1px solid rgba(239,68,68,0.5)';
                    chip.style.color = '#f87171';
                } else {
                    chip.style.background = 'rgba(16,185,129,0.2)';
                    chip.style.border = '1px solid rgba(16,185,129,0.4)';
                    chip.style.color = '#34d399';
                }
            }

            const reasonsList = document.getElementById('web-sim-reasons-list');
            if (reasonsList && Array.isArray(data.why_changed)) {
                reasonsList.innerHTML = data.why_changed.map(r => `<li>${r}</li>`).join('');
            }
        })
        .catch(err => console.error("Web simulation error:", err));
    }

    [trafficEl, tempEl, priorityEl, availEl, budgetEl, routeEl].forEach(el => {
        if (el) {
            el.addEventListener('input', runWebSimulation);
            el.addEventListener('change', runWebSimulation);
        }
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (trafficEl) trafficEl.value = 'Clear';
            if (tempEl) tempEl.value = 25;
            if (priorityEl) priorityEl.value = 5;
            if (availEl) availEl.value = 75;
            if (budgetEl) budgetEl.value = 12500;
            if (routeEl) routeEl.value = 'Auto';
            runWebSimulation();
        });
    }
}
