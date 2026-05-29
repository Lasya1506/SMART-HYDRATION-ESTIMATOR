// --- DOM Elements ---
// Navigation
const navItems = document.querySelectorAll('.nav-item');
const screens = document.querySelectorAll('.screen');
const navAlert = document.getElementById('nav-alert');
const alertBadge = document.getElementById('alert-badge');

// Dashboard Elements
const btnSimulate = document.getElementById('btn-simulate-connection');
const btnCheckHydration = document.getElementById('btn-check-hydration');
const bleIndicator = document.getElementById('ble-indicator');
const valTemp = document.getElementById('val-temp');
const valImp = document.getElementById('val-imp');
const hydPercent = document.getElementById('hyd-percent');
const hydStatusText = document.getElementById('hyd-status-text');
const hydrationCircle = document.getElementById('hydration-circle');

// Alert Elements
const alertBanner = document.getElementById('alert-banner');
const alertTitle = document.getElementById('alert-title');
const alertMessage = document.getElementById('alert-message');
const alertHydPercent = document.getElementById('alert-hyd-percent');
const alertStatusName = document.getElementById('alert-status-name');
const btnViewHealth = document.getElementById('btn-view-health');
const healthModal = document.getElementById('health-modal');
const btnAlgorithmInfo = document.getElementById('btn-algorithm-info');
const algorithmModal = document.getElementById('algorithm-modal');
const closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');

// Global Toast Elements
const globalToast = document.getElementById('global-toast');
const closeToastBtn = document.getElementById('close-toast-btn');
const toastContentP = globalToast.querySelector('.toast-content p');

// Analytics Elements
const statAvg = document.getElementById('stat-avg');
const statIntake = document.getElementById('stat-intake');

// --- State Variables ---
let isConnected = false;
let simulationInterval = null;
let currentTemp = 36.5;
let currentImp = 450;
let currentHydrationScore = 100;
let hydrationHistory = [];
let hasAlertedDehydration = false;

// --- Navigation Logic ---
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all
        navItems.forEach(nav => nav.classList.remove('active'));
        screens.forEach(screen => screen.classList.remove('active'));
        
        // Add active class to clicked
        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
        
        // Clear alert badge if alert screen is visited
        if (targetId === 'screen-alert') {
            alertBadge.classList.add('hidden');
        }
    });
});

// --- Modal & Toast Logic ---
btnViewHealth.addEventListener('click', () => healthModal.classList.add('active'));
btnAlgorithmInfo.addEventListener('click', () => algorithmModal.classList.add('active'));

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        healthModal.classList.remove('active');
        algorithmModal.classList.remove('active');
    });
});

closeToastBtn.addEventListener('click', () => {
    globalToast.classList.add('hidden');
});

// --- ESP32 Simulation Logic ---
btnSimulate.addEventListener('click', () => {
    if (!isConnected) {
        // Connect
        isConnected = true;
        btnSimulate.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> Disconnect ESP32';
        btnSimulate.classList.add('scanning');
        bleIndicator.classList.remove('disconnected');
        bleIndicator.classList.add('connected');
        
        startSimulation();
    } else {
        // Disconnect
        isConnected = false;
        btnSimulate.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> Connect ESP32';
        btnSimulate.classList.remove('scanning');
        bleIndicator.classList.remove('connected');
        bleIndicator.classList.add('disconnected');
        
        stopSimulation();
    }
});

function startSimulation() {
    // Initial values
    currentTemp = 36.8;
    currentImp = 480;
    
    valTemp.textContent = currentTemp.toFixed(1);
    valImp.textContent = currentImp;
    
    simulationInterval = setInterval(() => {
        // Randomly fluctuate values to simulate real sensor reading
        // Gradually increase impedance to simulate dehydration over time if unchecked
        currentTemp += (Math.random() * 0.4 - 0.15); // fluctuates around 37
        currentImp += (Math.random() * 20 + 5);      // slowly rising impedance
        
        // Bound the values
        if (currentTemp < 36.0) currentTemp = 36.0;
        if (currentTemp > 39.0) currentTemp = 39.0;
        if (currentImp > 1000) currentImp = 450; // Reset loop
        
        valTemp.textContent = currentTemp.toFixed(1);
        valImp.textContent = Math.round(currentImp);
        
        // Auto check hydration every 3 seconds for continuous monitoring feel
        calculateHydration();
        
    }, 3000);
}

function stopSimulation() {
    clearInterval(simulationInterval);
    valTemp.textContent = '--';
    valImp.textContent = '--';
    hydPercent.textContent = '--';
    hydStatusText.textContent = 'Waiting...';
    hydrationCircle.style.background = 'conic-gradient(var(--text-light) 0%, #e0e0e0 0%)';
}

// --- Hydration Calculation & Update Logic ---
btnCheckHydration.addEventListener('click', () => {
    if(!isConnected) {
        alert("Please connect the ESP32 simulator first.");
        return;
    }
    calculateHydration();
});

function calculateHydration() {
    // Simple heuristic for demonstration
    // Base score 100. High impedance -> lower hydration. High temp -> penalty.
    let score = 100;
    
    // Impedance penalty
    if (currentImp > 500) {
        score -= (currentImp - 500) * 0.1;
    }
    
    // Temp penalty
    if (currentTemp > 37.5) {
        score -= (currentTemp - 37.5) * 10;
    }
    
    score = Math.max(20, Math.min(100, Math.round(score)));
    currentHydrationScore = score;
    
    updateDashboardUI(score);
    updateAlertSystem(score);
    saveToHistory(score);
}

function updateDashboardUI(score) {
    hydPercent.textContent = score;
    
    let color, text;
    if (score >= 80) {
        color = 'var(--status-good)';
        text = 'Well Hydrated';
    } else if (score >= 60) {
        color = 'var(--status-mild)';
        text = 'Mild Dehydration';
    } else {
        color = 'var(--status-bad)';
        text = 'Dehydrated';
    }
    
    hydStatusText.textContent = text;
    hydStatusText.style.color = color;
    
    // Update circular progress bar
    hydrationCircle.style.background = `conic-gradient(${color} ${score}%, #e0e0e0 ${score}%)`;
}

function updateAlertSystem(score) {
    alertHydPercent.textContent = score + '%';
    
    // Reset classes
    alertBanner.className = 'alert-banner';
    
    if (score >= 80) {
        alertTitle.textContent = "Healthy";
        alertMessage.textContent = "Your hydration levels are optimal.";
        alertStatusName.textContent = "Well Hydrated";
        alertStatusName.style.color = "var(--status-good)";
        alertBanner.style.borderLeftColor = "var(--status-good)";
        alertBanner.querySelector('.alert-icon').className = "fa-solid fa-circle-check alert-icon";
        alertBanner.querySelector('.alert-icon').style.color = "var(--status-good)";
        
        // Hide badge if we're healthy
        if(!navAlert.classList.contains('active')) alertBadge.classList.add('hidden');
        
        // Reset alert tracking since they are healthy again
        hasAlertedDehydration = false;
        
    } else if (score >= 60) {
        alertTitle.textContent = "⚠ Mild Dehydration Detected";
        alertMessage.textContent = "You are starting to lose water. Consider drinking some fluids soon.";
        alertStatusName.textContent = "Mild Dehydration";
        alertStatusName.style.color = "var(--status-mild)";
        alertBanner.classList.add('warning');
        alertBanner.querySelector('.alert-icon').className = "fa-solid fa-triangle-exclamation alert-icon";
        
        // Show badge if not on screen
        if(!navAlert.classList.contains('active')) alertBadge.classList.remove('hidden');
        
    } else {
        alertTitle.textContent = "🚨 Severe Dehydration";
        alertMessage.textContent = "Critical water loss detected. Please drink water immediately and rest.";
        alertStatusName.textContent = "Dehydrated";
        alertStatusName.style.color = "var(--status-bad)";
        alertBanner.classList.add('danger');
        alertBanner.querySelector('.alert-icon').className = "fa-solid fa-triangle-exclamation alert-icon";
        
        // Show badge if not on screen
        if(!navAlert.classList.contains('active')) alertBadge.classList.remove('hidden');
        
        // Trigger global toast if we haven't already
        if (!hasAlertedDehydration) {
            toastContentP.textContent = `Your hydration has dropped to ${score}%. Please drink water.`;
            globalToast.classList.remove('hidden');
            hasAlertedDehydration = true;
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                globalToast.classList.add('hidden');
            }, 5000);
        }
    }
}

// --- Analytics Chart Logic ---
let hydrationChart;

function initChart() {
    const ctx = document.getElementById('hydrationChart').getContext('2d');
    
    // Dummy Data for visual
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
    const data = [85, 78, 90, 65, 88, 72, 80]; // percentages
    
    hydrationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avg Hydration %',
                data: data,
                borderColor: '#00b4d8',
                backgroundColor: 'rgba(0, 180, 216, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#03045e',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    updateStats(data);
}

function updateStats(dataArr) {
    const sum = dataArr.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / dataArr.length);
    statAvg.textContent = avg + '%';
    
    // Estimate intake based on goal 2500ml
    const estIntake = Math.round((avg / 100) * 2500);
    statIntake.textContent = estIntake + ' ml';
}

function saveToHistory(score) {
    // In a real app, we'd update the chart data here.
    // For prototype, we update the 'Today' value dynamically.
    if(hydrationChart) {
        let currentData = hydrationChart.data.datasets[0].data;
        currentData[currentData.length - 1] = score; // Update today
        hydrationChart.update();
        updateStats(currentData);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initChart();
});
