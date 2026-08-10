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
    'geo-section': { title: 'Geo-Routing & Weather', sub: 'Geographical bottleneck analysis and extreme weather impacts.' },
    'fleet-section': { title: 'Fleet & Correlations', sub: 'Asset utilization efficiency and demand bivariate correlations.' },
    'reports-section': { title: 'Executive Reports', sub: 'Actionable business recommendations based on Day 1-12 insights.' },
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

// ----------------------------------------------------
// Data Fetching and Chart Initialization
// ----------------------------------------------------
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        // 1. Set KPIs
        const kpis = data.kpis;
        animateValue('kpi-deliveries', 0, kpis.totalDeliveries, 1500);
        animateValue('kpi-ontime', 0, kpis.onTimePercentage, 1500, '', '%');
        animateValue('kpi-waittime', 0, kpis.avgWaitTime, 1500, '', 'm');
        animateValue('kpi-revenue', 0, kpis.totalRevenue, 1500, '$');
        animateValue('kpi-efficiency', 0, kpis.efficiencyScore, 1500);

        // ----------------------------------------------------
        // Overview Charts
        // ----------------------------------------------------
        const ctxDonut = document.getElementById('donutChart').getContext('2d');
        new Chart(ctxDonut, {
            type: 'doughnut',
            data: {
                labels: data.charts.deliveryStatus.labels,
                datasets: [{
                    data: data.charts.deliveryStatus.data,
                    backgroundColor: ['#4ade80', '#f87171'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });

        const ctxLine = document.getElementById('lineChart').getContext('2d');
        let gradientLine = ctxLine.createLinearGradient(0, 0, 0, 300);
        gradientLine.addColorStop(0, 'rgba(192, 132, 252, 0.5)');
        gradientLine.addColorStop(1, 'rgba(192, 132, 252, 0.0)');

        new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: data.charts.trafficDelays.labels,
                datasets: [{
                    label: 'Number of Delays',
                    data: data.charts.trafficDelays.data,
                    borderColor: '#c084fc',
                    backgroundColor: gradientLine,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });

        // ----------------------------------------------------
        // Geo-Routing Charts
        // ----------------------------------------------------
        const ctxBar = document.getElementById('barChart').getContext('2d');
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: data.charts.clusterDelays.labels,
                datasets: [{
                    label: 'Delay %',
                    data: data.charts.clusterDelays.data,
                    backgroundColor: 'rgba(96, 165, 250, 0.7)',
                    borderColor: '#60a5fa',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });

        const ctxWeather = document.getElementById('weatherChart').getContext('2d');
        new Chart(ctxWeather, {
            type: 'bar',
            data: {
                labels: data.charts.weatherImpact.labels,
                datasets: [{
                    label: 'Delay %',
                    data: data.charts.weatherImpact.data,
                    backgroundColor: ['#66fcf1', '#f87171'],
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });

        // ----------------------------------------------------
        // Fleet & Correlation Charts
        // ----------------------------------------------------
        const ctxScatter = document.getElementById('scatterChart').getContext('2d');
        new Chart(ctxScatter, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Deliveries',
                    data: data.charts.scatterDemandWait.data,
                    backgroundColor: 'rgba(255, 191, 0, 0.6)',
                    borderColor: '#FFBF00',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { title: { display: true, text: 'Demand Forecast' } },
                    y: { title: { display: true, text: 'Waiting Time (Mins)' } }
                }
            }
        });

        const ctxAsset = document.getElementById('assetChart').getContext('2d');
        new Chart(ctxAsset, {
            type: 'bar',
            data: {
                labels: data.charts.assetPerformance.labels,
                datasets: [{
                    label: 'Performance Score',
                    data: data.charts.assetPerformance.data,
                    backgroundColor: (ctx) => {
                        return ctx.raw > 50 ? 'rgba(74, 222, 128, 0.7)' : 'rgba(248, 113, 113, 0.7)';
                    },
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });

    })
    .catch(error => {
        console.error("Error loading dashboard data:", error);
        alert("Failed to load dashboard data. Ensure you run generate_dashboard_data.py and are using a web server.");
    });

// ====================================================
// AI CONTROL TOWER JS LOGIC (Patches 1, 2, 3, 5, 8, 9)
// ====================================================

// 1. Initialize Leaflet Map
let map;
if (document.getElementById('shipment-map')) {
    map = L.map('shipment-map').setView([39.8283, -98.5795], 4); // US Center
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);
}

// 2. Dummy Data for Live Feed & Map
const activeShipments = [
    { id: 'SHP-902', lat: 34.0522, lng: -118.2437, route: 'Los Angeles → Seattle', status: 'critical', delay: '45 mins', risk: 'High', prob: '89%' },
    { id: 'SHP-441', lat: 41.8781, lng: -87.6298, route: 'Chicago → New York', status: 'warning', delay: '12 mins', risk: 'Medium', prob: '45%' },
    { id: 'SHP-105', lat: 29.7604, lng: -95.3698, route: 'Houston → Dallas', status: 'ok', delay: '0 mins', risk: 'Low', prob: '5%' }
];

// Add markers and populate live feed
const feedContainer = document.getElementById('live-feed');
if (map && feedContainer) {
    activeShipments.forEach(shp => {
        // Map Marker
        const color = shp.status === 'critical' ? 'red' : shp.status === 'warning' ? 'yellow' : 'green';
        const circle = L.circleMarker([shp.lat, shp.lng], {
            color: color, fillColor: color, fillOpacity: 0.8, radius: 8
        }).addTo(map);
        
        // Feed Item
        const div = document.createElement('div');
        div.className = `alert-item ${shp.status === 'critical' ? 'critical' : ''}`;
        div.innerHTML = `
            <div>
                <strong>${shp.id}</strong><br>
                <span style="font-size: 0.8rem; color: #9ca3af;">${shp.route}</span>
            </div>
            <div style="text-align: right;">
                <span style="color: ${color === 'red' ? '#f87171' : color === 'yellow' ? '#fbbf24' : '#4ade80'}; font-weight: bold;">${shp.delay}</span>
            </div>
        `;
        div.onclick = () => openDrawer(shp);
        circle.on('click', () => openDrawer(shp));
        feedContainer.appendChild(div);
    });
}

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

// Explain button opens existing XAI Modal logic (if needed)
document.getElementById('btn-explain')?.addEventListener('click', () => {
    // You can hook this to fetch /prediction-explanation from FastAPI just like the XAI tab
    showNotification('Explanation Generation', 'Fetching SHAP values from FastAPI backend...');
});


// ====================================================
// SMART LIVE ANALYTICS CONTROL CENTER (Filtering)
// ====================================================

window.masterDataset = [];

// Fetch the full dataset once
fetch('full_data.json')
    .then(response => response.json())
    .then(data => {
        window.masterDataset = data;
        console.log("Master dataset loaded:", data.length, "records");
        if (typeof generateRecommendations === 'function') generateRecommendations(data);
    })
    .catch(err => console.error("Error loading full_data.json:", err));

function getFilterValues() {
    return {
        searchId: document.getElementById('filter-search-id').value.trim().toLowerCase(),
        time: document.getElementById('filter-time').value,
        region: document.getElementById('filter-region').value,
        warehouse: document.getElementById('filter-warehouse').value,
        vehicle: document.getElementById('filter-vehicle').value,
        traffic: document.getElementById('filter-traffic').value,
        status: document.getElementById('filter-status').value,
        priority: document.getElementById('filter-priority').value,
        weather: document.getElementById('filter-weather').value,
        geocluster: document.getElementById('filter-geocluster').value,
        driver: document.getElementById('filter-driver').value
    };
}

function updateActiveChips(filters) {
    const container = document.getElementById('active-filter-chips');
    container.innerHTML = '';
    
    let activeCount = 0;
    for (const [key, val] of Object.entries(filters)) {
        if (val !== 'all' && val !== '') {
            activeCount++;
            const chip = document.createElement('span');
            chip.style.cssText = "background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.5); color: #93c5fd; padding: 3px 10px; border-radius: 15px; font-size: 0.8rem; display: flex; align-items: center; gap: 5px;";
            chip.innerHTML = `${key}: ${val} <i data-lucide="x" style="width: 12px; height: 12px; cursor: pointer;" onclick="removeFilter('${key}')"></i>`;
            container.appendChild(chip);
        }
    }
    
    if (activeCount === 0) {
        container.innerHTML = '<span style="color: #9ca3af; font-size: 0.9rem; margin-top: 5px;">No active filters</span>';
    }
    lucide.createIcons();
}

window.removeFilter = function(key) {
    if (key === 'searchId') {
        document.getElementById('filter-search-id').value = '';
    } else {
        document.getElementById(`filter-${key}`).value = 'all';
    }
    applyFilters();
}

document.getElementById('btn-filter-apply').addEventListener('click', applyFilters);
document.getElementById('btn-filter-reset').addEventListener('click', () => {
    const selects = document.querySelectorAll('#overview-section select');
    selects.forEach(s => s.value = 'all');
    document.getElementById('filter-search-id').value = '';
    applyFilters();
});

function applyFilters() {
    if (!window.masterDataset || window.masterDataset.length === 0) return;
    
    const filters = getFilterValues();
    updateActiveChips(filters);
    
    // Animate button
    const btn = document.getElementById('btn-filter-apply');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i> Applying...';
    lucide.createIcons();
    
    setTimeout(() => {
        const filteredData = window.masterDataset.filter(row => {
            // Mapping filters to dataset columns
            
            // Search Route ID -> We don't have Route ID, we have Asset_ID. Let's use Asset_ID.
            if (filters.searchId && !row.Asset_ID.toLowerCase().includes(filters.searchId)) return false;
            
            // Time: all, today, week, month -> Mock logic based on Timestamp
            if (filters.time !== 'all') {
                // Since dataset is 2024, let's just do a string match for simplicity or keep it basic
                if (filters.time === 'today' && !row.Timestamp.includes('2024-12-28')) return false; // hardcoded "today" for mock data
                if (filters.time === 'week' && !row.Timestamp.includes('2024-12-2')) return false;
                if (filters.time === 'month' && !row.Timestamp.includes('2024-12')) return false;
            }
            
            // Region -> map to Geo_Cluster (North, South, East, West)
            if (filters.region !== 'all' && !row.Geo_Cluster.includes(filters.region)) return false;
            
            // Geo Cluster -> map to Geo_Cluster directly
            if (filters.geocluster !== 'all') {
                const map = { "Cluster_A": "North", "Cluster_B": "South", "Cluster_C": "East" };
                const matchStr = map[filters.geocluster] || "None";
                if (!row.Geo_Cluster.includes(matchStr)) return false;
            }
            
            // Warehouse -> map to Inventory_Level (mock: WH-1 > 400, WH-2 > 300, etc)
            if (filters.warehouse !== 'all') {
                if (filters.warehouse === 'WH-1' && row.Inventory_Level < 400) return false;
                if (filters.warehouse === 'WH-2' && (row.Inventory_Level >= 400 || row.Inventory_Level < 300)) return false;
                if (filters.warehouse === 'WH-3' && (row.Inventory_Level >= 300 || row.Inventory_Level < 200)) return false;
                if (filters.warehouse === 'WH-4' && row.Inventory_Level >= 200) return false;
            }
            
            // Vehicle Type -> map to Asset_ID (e.g. Truck_X)
            if (filters.vehicle !== 'all' && !row.Asset_ID.includes(filters.vehicle)) return false;
            
            // Traffic Condition -> map to Traffic_Status
            if (filters.traffic !== 'all' && row.Traffic_Status !== filters.traffic) return false;
            
            // Delivery Status -> map to Shipment_Status
            if (filters.status !== 'all' && row.Shipment_Status !== filters.status) return false;
            
            // Delivery Priority -> map to User_Transaction_Amount (mock: >400 High, >200 Medium, Low)
            if (filters.priority !== 'all') {
                if (filters.priority === 'High' && row.User_Transaction_Amount <= 400) return false;
                if (filters.priority === 'Medium' && (row.User_Transaction_Amount > 400 || row.User_Transaction_Amount <= 200)) return false;
                if (filters.priority === 'Low' && row.User_Transaction_Amount > 200) return false;
            }
            
            // Weather Condition -> map to Logistics_Delay_Reason == "Weather" or Extreme_Weather_Flag
            if (filters.weather !== 'all') {
                if (filters.weather === 'Clear' && (row.Logistics_Delay_Reason === 'Weather' || row.Extreme_Weather_Flag === 1)) return false;
                if (filters.weather === 'Rain' && row.Logistics_Delay_Reason !== 'Weather') return false;
                if (filters.weather === 'Storm' && row.Extreme_Weather_Flag !== 1) return false;
            }
            
            // Driver -> Map to Asset_ID suffix (D-101 -> Truck_1)
            if (filters.driver !== 'all') {
                const dMap = { 'D-101': 'Truck_1', 'D-102': 'Truck_2', 'D-103': 'Truck_3' };
                if (row.Asset_ID !== dMap[filters.driver]) return false;
            }
            
            return true;
        });
        
        // --- 1. Update UI Counts ---
        document.getElementById('filter-matching-records').innerText = `${filteredData.length.toLocaleString()} matching records`;
        
        if (filteredData.length === 0) {
            btn.innerHTML = originalText;
            document.getElementById('ai-insight-section').style.display = 'none';
            // Set KPIs to 0
            animateValue('kpi-deliveries', 0, 0, 500);
            animateValue('kpi-ontime', 0, 0, 500, '', '%');
            animateValue('kpi-waittime', 0, 0, 500, '', 'm');
            animateValue('kpi-revenue', 0, 0, 500, '$');
            animateValue('kpi-efficiency', 0, 0, 500);
            return;
        }

        // --- 2. Calculate KPIs ---
        const total = filteredData.length;
        const onTime = filteredData.filter(d => d.Shipment_Status !== 'Delayed').length;
        const onTimePct = (onTime / total) * 100;
        
        let totalWait = 0;
        let totalRev = 0;
        let totalEff = 0;
        
        const statusCounts = { 'Delivered': 0, 'In Transit': 0, 'Delayed': 0 };
        const trafficDelays = { 'Clear': 0, 'Detour': 0, 'Heavy': 0 };
        
        filteredData.forEach(d => {
            totalWait += d.Waiting_Time;
            totalRev += d.User_Transaction_Amount;
            totalEff += d.Asset_Performance_Score;
            
            statusCounts[d.Shipment_Status] = (statusCounts[d.Shipment_Status] || 0) + 1;
            
            if (d.Shipment_Status === 'Delayed' && (d.Traffic_Status === 'Clear' || d.Traffic_Status === 'Detour' || d.Traffic_Status === 'Heavy')) {
                trafficDelays[d.Traffic_Status] = (trafficDelays[d.Traffic_Status] || 0) + 1;
            }
        });
        
        const avgWait = totalWait / total;
        const avgEff = totalEff / total;
        
        // Update KPI HTML
        animateValue('kpi-deliveries', 0, total, 1000);
        animateValue('kpi-ontime', 0, onTimePct, 1000, '', '%');
        animateValue('kpi-waittime', 0, avgWait, 1000, '', 'm');
        animateValue('kpi-revenue', 0, totalRev, 1000, '$');
        animateValue('kpi-efficiency', 0, avgEff, 1000);
        
        // --- 3. Update Charts ---
        // Donut Chart (Status)
        let chart1 = Chart.getChart('donutChart');
        if (chart1) {
            chart1.data.labels = Object.keys(statusCounts);
            chart1.data.datasets[0].data = Object.values(statusCounts);
            chart1.data.datasets[0].backgroundColor = ['#4ade80', '#fbbf24', '#f87171'];
            chart1.update();
        }
        
        // Line Chart (Traffic)
        let chart2 = Chart.getChart('lineChart');
        if (chart2) {
            chart2.data.labels = Object.keys(trafficDelays);
            chart2.data.datasets[0].data = Object.values(trafficDelays);
            chart2.update();
        }
        
        // --- 4. Update AI Insight ---
        document.getElementById('ai-insight-section').style.display = 'grid';
        
        // Find highest risk factor
        const highestTrafficDelay = Object.keys(trafficDelays).reduce((a, b) => trafficDelays[a] > trafficDelays[b] ? a : b, 'Clear');
        
        document.getElementById('insight-primary-risk').innerText = `${highestTrafficDelay} Traffic`;
        document.getElementById('insight-avg-delay').innerText = `${Math.round(avgWait)} min`;
        document.getElementById('insight-affected').innerText = `${statusCounts['Delayed']} Deliveries`;
        
        if (avgWait > 40) {
            document.getElementById('insight-text').innerText = `Critical systemic delays detected in the selected subset. ${highestTrafficDelay} traffic conditions are severely impacting operations, resulting in an average wait time of ${Math.round(avgWait)} minutes.`;
            document.getElementById('rec-text').innerText = `Initiate emergency re-routing for all critical shipments avoiding ${highestTrafficDelay} traffic zones. Deploy overflow fleet if available.`;
            document.getElementById('rec-delay-reduction').innerText = "-45 mins";
            document.getElementById('rec-cost-impact').innerText = "+$12.5k Saved";
            document.getElementById('rec-priority').innerText = "Critical (Immediate Action Required)";
            document.getElementById('rec-priority').style.color = "#f87171";
        } else {
            document.getElementById('insight-text').innerText = `Network performance is stable for this filter. Minor bottlenecks observed in ${highestTrafficDelay} traffic conditions, but operations are within SLA limits.`;
            document.getElementById('rec-text').innerText = `Maintain current routing algorithms. Schedule preventative maintenance for assets showing early signs of degradation.`;
            document.getElementById('rec-delay-reduction').innerText = "-10 mins";
            document.getElementById('rec-cost-impact').innerText = "+$2.1k Saved";
            document.getElementById('rec-priority').innerText = "Low (Monitor Continuously)";
            document.getElementById('rec-priority').style.color = "#4ade80";
        }
        
        if (typeof generateRecommendations === 'function') {
            generateRecommendations(filteredData);
        }
        
        btn.innerHTML = originalText;
    }, 400);
}

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
let xaiBaselineData = null;

async function loadXAIData(shipmentId) {
    try {
        document.getElementById('xai-shipment-id-badge').innerText = `Shipment ID: ${shipmentId}`;
        
        // 1. Fetch Prediction Explanation
        const predRes = await fetch(`http://localhost:8080/prediction-explanation/${shipmentId}`);
        if (!predRes.ok) throw new Error("Failed to fetch prediction");
        const predData = await predRes.json();
        
        // 2. Fetch Recommendation Explanation
        const recRes = await fetch(`http://localhost:8080/recommendation-explanation/${shipmentId}`);
        const recData = await recRes.json();
        
        // 3. Fetch Confidence Scores
        const confRes = await fetch(`http://localhost:8080/confidence-score/${shipmentId}`);
        const confData = await confRes.json();
        
        xaiBaselineData = { predData, recData, confData };
        updateXAIUI(xaiBaselineData);
        
    } catch (error) {
        console.error("XAI Data Load Error:", error);
        if (typeof showNotification === 'function') {
            showNotification('XAI Error', 'Failed to load explainability data.', 'error');
        }
    }
}

function updateXAIUI(data) {
    const { predData, recData, confData } = data;
    
    // 1. Recommendation Card
    if (recData.action) {
        document.getElementById('xai-rec-action').innerText = recData.action;
        document.getElementById('xai-rec-impact').innerText = recData.impact || "Delay reduction";
        document.getElementById('xai-rec-risk').innerText = "Significant"; // Simulated based on payload
        document.getElementById('xai-rec-cost').innerText = recData.estimated_cost ? `$${recData.estimated_cost.toFixed(2)}` : "--";
        document.getElementById('xai-rec-conf').innerText = `${confData.RecommendationConfidence}%`;
        document.getElementById('xai-rec-status').innerText = "Pending Review";
    } else {
        document.getElementById('xai-rec-action').innerText = "No action required";
        document.getElementById('xai-rec-impact').innerText = "--";
        document.getElementById('xai-rec-cost').innerText = "--";
        document.getElementById('xai-rec-conf').innerText = "--";
        document.getElementById('xai-rec-status').innerText = "Optimal";
    }
    
    // 2. Feature Contributions (SHAP)
    const barsContainer = document.getElementById('xai-feature-bars-container');
    barsContainer.innerHTML = '';
    
    if (predData.top_features && predData.top_features.length > 0) {
        let maxAbsContrib = Math.max(...predData.top_features.map(f => Math.abs(f.contribution)));
        if (maxAbsContrib === 0) maxAbsContrib = 1;
        
        predData.top_features.slice(0, 5).forEach(feat => {
            const width = (Math.abs(feat.contribution) / maxAbsContrib) * 100;
            const isPos = feat.contribution > 0;
            const colorClass = isPos ? 'positive' : 'negative';
            
            barsContainer.innerHTML += `
                <div class="xai-feature-row">
                    <div class="xai-feature-name">${feat.feature} (${feat.value.toFixed(1)})</div>
                    <div class="xai-feature-bar-container">
                        <div class="xai-feature-bar ${colorClass}" style="width: ${width}%;"></div>
                    </div>
                    <div style="width: 20%; text-align: right; font-size: 0.8rem; color: #e5e7eb;">
                        ${feat.contribution > 0 ? '+' : ''}${feat.contribution.toFixed(2)}
                    </div>
                </div>
            `;
        });
    }
    
    // 6. Constraint Checks (Mock baseline until simulation)
    document.getElementById('xai-chk-budget').innerText = "Baseline";
    document.getElementById('xai-chk-wh').innerText = "Baseline";
    document.getElementById('xai-chk-trans').innerText = "Baseline";
    
    // Update initial simulator KPIs
    const stockRiskVal = predData.predicted_delay_mins > 30 ? Math.min(99, predData.predicted_delay_mins) : 15;
    document.getElementById('sim-kpi-risk').innerText = `${stockRiskVal}%`;
    document.getElementById('sim-kpi-cost').innerText = recData.estimated_cost ? `₹${recData.estimated_cost.toFixed(0)}` : "₹0";
    document.getElementById('sim-kpi-service').innerText = `${confData.PredictionConfidence}%`;
    document.getElementById('sim-kpi-action').innerText = recData.action || "None";
    
    // 8. Explanation Summary
    document.getElementById('xai-summary-text').innerText = predData.business_explanation || "Optimization engine recommends taking action based on evaluated constraints.";
}

// Interactivity & Sliders
document.addEventListener('DOMContentLoaded', () => {
    
    // Navigation
    document.getElementById('xai-prev-btn')?.addEventListener('click', () => {
        if (currentXaiShipmentId > 0) {
            currentXaiShipmentId--;
            loadXAIData(currentXaiShipmentId);
        }
    });
    
    document.getElementById('xai-next-btn')?.addEventListener('click', () => {
        currentXaiShipmentId++;
        loadXAIData(currentXaiShipmentId);
    });
    
    // Simulator Sliders UI Update
    const sliders = ['demand', 'inv', 'lead', 'cost', 'wh'];
    sliders.forEach(key => {
        const slider = document.getElementById(`sim-${key}`);
        const valDisplay = document.getElementById(`val-${key}`);
        if (slider && valDisplay) {
            slider.addEventListener('input', (e) => {
                let v = parseInt(e.target.value);
                if (key === 'cost') {
                    valDisplay.innerText = `$${v}`;
                } else {
                    valDisplay.innerText = v > 0 ? `+${v}%` : `${v}%`;
                }
            });
        }
    });
    
    // Simulator Apply (Mock Logic for UI demonstration due to backend limitation)
    document.getElementById('sim-apply-btn')?.addEventListener('click', async () => {
        // Trigger real backend optimization constraint check with Budget/Cost limit
        const costLimit = parseInt(document.getElementById('sim-cost').value);
        
        try {
            const req = {
                shipment_id: currentXaiShipmentId,
                required_quantity: 100, // mock quantity
                maximum_budget: costLimit
            };
            const optRes = await fetch('http://localhost:8080/simulate-optimization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(req)
            });
            const optData = await optRes.json();
            
            if (optData.status === "success") {
                const audit = optData.audit;
                document.getElementById('xai-chk-budget').innerText = `$${audit.calculated_total_cost.toFixed(0)} / $${audit.maximum_budget}`;
                document.getElementById('xai-chk-solver').innerText = audit.solver_success ? "OPTIMAL" : "FAILED";
                document.getElementById('xai-chk-solver').parentElement.className = audit.solver_success ? "xai-check-item pass" : "xai-check-item fail";
                
                // Update Simulator KPIs based on slider inputs (frontend simulation for Demand/Inv)
                const dem = parseInt(document.getElementById('sim-demand').value);
                const inv = parseInt(document.getElementById('sim-inv').value);
                
                let newStockRisk = 50 + (dem * 0.5) - (inv * 0.5);
                newStockRisk = Math.max(5, Math.min(99, newStockRisk));
                document.getElementById('sim-kpi-risk').innerText = `${Math.round(newStockRisk)}%`;
                
                let simulatedCost = audit.calculated_total_cost;
                document.getElementById('sim-kpi-cost').innerText = `₹${Math.round(simulatedCost)}`;
                
                let action = "No change required";
                if (dem > 10) action = "Increase allocation";
                if (inv < -10) action = "Expedite shipment";
                document.getElementById('sim-kpi-action').innerText = action;
                
                if (typeof showNotification === 'function') {
                    showNotification('Simulation', 'Scenario updated based on constraints.', 'success');
                }
            }
        } catch (e) {
            console.error("Simulation error", e);
        }
    });
    
    // Simulator Reset
    document.getElementById('sim-reset-btn')?.addEventListener('click', () => {
        document.getElementById('sim-demand').value = 0;
        document.getElementById('val-demand').innerText = 'Baseline';
        document.getElementById('sim-inv').value = 0;
        document.getElementById('val-inv').innerText = 'Baseline';
        document.getElementById('sim-lead').value = 0;
        document.getElementById('val-lead').innerText = 'Baseline';
        document.getElementById('sim-cost').value = 10000;
        document.getElementById('val-cost').innerText = 'Baseline';
        document.getElementById('sim-wh').value = 0;
        if (document.getElementById('val-wh')) document.getElementById('val-wh').innerText = 'Baseline';
        
        if (xaiBaselineData) updateXAIUI(xaiBaselineData);
    });
    
    // Also load XAI data when tab is clicked
    const xaiTab = document.querySelector('[data-target="xai-section"]');
    if (xaiTab) {
        xaiTab.addEventListener('click', () => {
            if (!xaiBaselineData) loadXAIData(currentXaiShipmentId);
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
        const temp = parseFloat(tempEl.value);
        const priority = parseInt(priorityEl.value);
        const avail = parseFloat(availEl.value);
        const budget = parseFloat(budgetEl.value);
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
        .then(res => res.json())
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
