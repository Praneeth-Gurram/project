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
    runSimBtn.onclick = () => {
        runSimBtn.innerHTML = '<i data-lucide="loader"></i> Simulating...';
        lucide.createIcons();
        setTimeout(() => {
            simResults.style.display = 'block';
            runSimBtn.innerHTML = 'Run Simulation';
            
            // Dummy logic for simulation
            let delay = 45;
            let cost = 500;
            if (simMode.value === 'air') { delay = 0; cost = 3000; }
            if (simMode.value === 'rail') { delay = 120; cost = 200; }
            if (simBudget.value > 6000) { delay = Math.max(0, delay - 20); }
            
            simResDelay.innerText = `${delay} mins`;
            simResCost.innerText = `$${cost.toLocaleString()}`;
        }, 800);
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
