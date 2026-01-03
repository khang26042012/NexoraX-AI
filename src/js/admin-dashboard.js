/**
 * ADMIN-DASHBOARD.JS
 * Quản lý logic cho giao diện Admin NexoraX AI
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initOverview();
    initLogs();
    initConfig();
});

// ===================================
// TAB SYSTEM
// ===================================
function initTabs() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');

            // Cập nhật UI menu
            navLinks.forEach(l => {
                l.classList.remove('active', 'text-white', 'bg-slate-800');
                l.classList.add('text-slate-400');
            });
            link.classList.add('active', 'text-white');
            link.classList.remove('text-slate-400');

            // Chuyển tab nội dung
            sections.forEach(s => s.classList.add('hidden'));
            document.getElementById(`tab-${tabId}`).classList.remove('hidden');

            // Trigger data fetch tùy theo tab
            if (tabId === 'overview') refreshOverview();
            if (tabId === 'config') refreshConfig();
        });
    });
}

// ===================================
// OVERVIEW & CHARTS
// ===================================
let modelChart = null;
let usageChart = null;

async function initOverview() {
    refreshOverview();
    // Refresh stats mỗi 30s
    setInterval(refreshOverview, 30000);
}

async function refreshOverview() {
    try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        
        if (!data) return;

        // Update cards
        document.getElementById('stat-users').textContent = data.total_users || 0;
        document.getElementById('stat-sessions').textContent = data.active_sessions || 0;
        document.getElementById('stat-requests').textContent = data.total_requests || 0;
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();

        // Render Charts
        renderModelChart(data.usage_stats?.per_model || {});
        renderUsageChart(data.usage_stats?.daily_trends || []);
    } catch (err) {
        console.error('Lỗi fetch stats:', err);
        showToast('❌ Không thể kết nối tới server API.', 'error');
    }
}

function renderModelChart(modelData) {
    const ctx = document.getElementById('modelChart').getContext('2d');
    const labels = Object.keys(modelData);
    const values = Object.values(modelData);

    if (modelChart) modelChart.destroy();

    modelChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'
                ],
                borderWidth: 0,
                hoverOffset: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', font: { size: 11, family: 'Inter' }, usePointStyle: true, padding: 15 }
                }
            },
            cutout: '70%'
        }
    });
}

function renderUsageChart(trends) {
    const ctx = document.getElementById('usageChart').getContext('2d');
    
    // Mock data nếu backend chưa có lịch sử theo ngày
    const labels = trends.length > 0 ? trends.map(t => t.date) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = trends.length > 0 ? trends.map(t => t.count) : [12, 19, 15, 25, 22, 30, 45];

    if (usageChart) usageChart.destroy();

    usageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Requests',
                data: values,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// ===================================
// LIVE LOGS
// ===================================
let logInterval = null;

function initLogs() {
    const container = document.getElementById('logsContainer');
    const clearBtn = document.getElementById('clearLogsBtn');

    clearBtn.addEventListener('click', () => {
        container.innerHTML = '<div class="text-slate-600 italic mb-2">// View đã được làm sạch...</div>';
    });

    // Start polling khi tab logs được click (xử lý bởi initTabs gọi refresh)
    // Nhưng vì logs cần real-time, ta sẽ chạy ngầm hoặc chạy khi tab active
    logInterval = setInterval(fetchLogs, 3000);
}

async function fetchLogs() {
    const logsTab = document.getElementById('tab-logs');
    if (logsTab.classList.contains('hidden')) return;

    try {
        const res = await fetch('/api/admin/logs?limit=50');
        const data = await res.json();
        
        if (data && data.logs) {
            renderLogs(data.logs);
        }
    } catch (err) {
        console.error('Lỗi fetch logs:', err);
    }
}

function renderLogs(logs) {
    const container = document.getElementById('logsContainer');
    const isAtBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 50;

    container.innerHTML = logs.map(log => {
        let colorClass = 'text-green-500';
        if (log.includes('ERROR')) colorClass = 'text-red-400';
        if (log.includes('WARNING')) colorClass = 'text-yellow-400';
        if (log.includes('INFO')) colorClass = 'text-blue-400';
        
        return `<div class="mb-1 font-mono"><span class="text-slate-700 select-none mr-2">➜</span><span class="${colorClass}">${escapeHtml(log)}</span></div>`;
    }).join('');

    if (isAtBottom) {
        container.scrollTop = container.scrollHeight;
    }
}

// ===================================
// CONFIG MANAGEMENT
// ===================================
function initConfig() {
    const form = document.getElementById('configForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const config = {};
        
        formData.forEach((value, key) => {
            if (value.trim()) config[key] = value.trim();
        });

        try {
            const res = await fetch('/api/admin/config/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            const result = await res.json();
            if (result.status === 'success') {
                showToast('🚀 Cấu hình đã được cập nhật thành công!');
                refreshConfig(); // Tải lại để xem masked keys
            } else {
                showToast('❌ Lỗi: ' + result.message, 'error');
            }
        } catch (err) {
            showToast('❌ Lỗi kết nối server.', 'error');
        }
    });
}

async function refreshConfig() {
    try {
        const res = await fetch('/api/admin/config');
        const data = await res.json();
        
        if (data) {
            const inputs = document.querySelectorAll('#configForm input');
            inputs.forEach(input => {
                const key = input.name;
                if (data[key]) {
                    input.placeholder = data[key]; // Hiển thị masked value làm placeholder
                    input.value = ''; // Để trống để user nhập mới nếu muốn
                }
            });
        }
    } catch (err) {
        console.error('Lỗi fetch config:', err);
    }
}

// ===================================
// UTILS
// ===================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = document.getElementById('toastIcon');

    msgEl.textContent = message;
    iconEl.textContent = type === 'success' ? '✨' : '⚠️';
    toast.querySelector('div').className = `${type === 'success' ? 'bg-blue-600' : 'bg-red-600'} text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3`;

    toast.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
