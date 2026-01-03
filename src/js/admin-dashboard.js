/**
 * ADMIN-DASHBOARD.JS
 * Logic điều khiển trang quản trị NexoraX AI
 */

const ADMIN_PIN = "26042012";

// Quản lý trạng thái Dashboard
const state = {
    isUnlocked: false,
    currentTab: 'overview',
    charts: {
        model: null,
        user: null
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo Lucide Icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Kiểm tra trạng thái đã đăng nhập từ sessionStorage
    if (sessionStorage.getItem('admin_session') === 'true') {
        unlockDashboard();
    }

    initAuthLogic();
    initSidebarLogic();
    initTabLogic();
});

/**
 * LOGIC XÁC THỰC PIN
 */
function initAuthLogic() {
    const unlockBtn = document.getElementById('unlockBtn');
    const pinInput = document.getElementById('pinInput');
    const errorMsg = document.getElementById('pinError');

    const handleUnlock = () => {
        if (pinInput.value === ADMIN_PIN) {
            sessionStorage.setItem('admin_session', 'true');
            unlockDashboard();
        } else {
            errorMsg.classList.remove('hidden');
            pinInput.classList.add('border-red-500');
            pinInput.value = '';
            setTimeout(() => {
                errorMsg.classList.add('hidden');
                pinInput.classList.remove('border-red-500');
            }, 3000);
        }
    };

    unlockBtn.addEventListener('click', handleUnlock);
    pinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUnlock();
    });
}

function unlockDashboard() {
    state.isUnlocked = true;
    document.getElementById('lockScreen').style.display = 'none';
    document.getElementById('dashboardContent').style.opacity = '1';
    
    // Khởi động fetch dữ liệu
    refreshData();
    setInterval(refreshData, 5000); // Polling mỗi 5s
    startLogPolling();
}

/**
 * LOGIC SIDEBAR (MOBILE RESPONSIVE)
 */
function initSidebarLogic() {
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('openSidebar');
    const closeBtn = document.getElementById('closeSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    const toggleSidebar = (isOpen) => {
        if (isOpen) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    };

    openBtn.addEventListener('click', () => toggleSidebar(true));
    closeBtn.addEventListener('click', () => toggleSidebar(false));
    overlay.addEventListener('click', () => toggleSidebar(false));

    // Đóng sidebar khi click chọn tab trên mobile
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) toggleSidebar(false);
        });
    });
}

/**
 * LOGIC CHUYỂN TAB
 */
function initTabLogic() {
    const tabs = document.querySelectorAll('.nav-link');
    const contents = document.querySelectorAll('.tab-content');
    const title = document.getElementById('currentTabTitle');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            state.currentTab = tabId;

            // Cập nhật UI nút
            tabs.forEach(t => t.classList.remove('bg-blue-600/10', 'text-blue-400'));
            tabs.forEach(t => t.classList.add('text-slate-400'));
            tab.classList.remove('text-slate-400');
            tab.classList.add('bg-blue-600/10', 'text-blue-400');

            // Hiển thị nội dung
            contents.forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${tabId}`).classList.remove('hidden');

            // Cập nhật tiêu đề
            const titles = {
                'overview': 'Tổng quan hệ thống',
                'logs': 'Nhật ký hệ thống',
                'config': 'Cấu hình API'
            };
            title.textContent = titles[tabId];

            if (tabId === 'config') refreshConfig();
        });
    });
}

/**
 * FETCH DỮ LIỆU & RENDER BIỂU ĐỒ
 */
async function refreshData() {
    if (!state.isUnlocked || state.currentTab !== 'overview') return;

    try {
        const [usageRes, statsRes] = await Promise.all([
            fetch('/api/admin/usage'),
            fetch('/api/admin/stats')
        ]);

        const usage = await usageRes.json();
        const stats = await statsRes.json();

        // Cập nhật số liệu Cards
        document.getElementById('totalCalls').textContent = usage.total_calls || 0;
        document.getElementById('uniqueUsers').textContent = usage.unique_users || 0;
        document.getElementById('activeSessions').textContent = stats.active_sessions || 0;

        // Render Biểu đồ Model AI
        renderModelChart(usage.models_stats || {});
        
        // Render Biểu đồ Người dùng (Top 5)
        renderUserChart(usage.users_stats || {});

    } catch (err) {
        console.error('Lỗi fetch dữ liệu admin:', err);
    }
}

function renderModelChart(data) {
    const ctx = document.getElementById('modelChart').getContext('2d');
    const labels = Object.keys(data);
    const values = Object.values(data);

    if (state.charts.model) {
        state.charts.model.data.labels = labels;
        state.charts.model.data.datasets[0].data = values;
        state.charts.model.update();
        return;
    }

    state.charts.model = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 10 } } }
            }
        }
    });
}

function renderUserChart(data) {
    const ctx = document.getElementById('userChart').getContext('2d');
    
    // Lấy top 7 người dùng active nhất
    const sortedUsers = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7);
    
    const labels = sortedUsers.map(u => u[0]);
    const values = sortedUsers.map(u => u[1]);

    if (state.charts.user) {
        state.charts.user.data.labels = labels;
        state.charts.user.data.datasets[0].data = values;
        state.charts.user.update();
        return;
    }

    state.charts.user = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Requests',
                data: values,
                backgroundColor: '#8b5cf6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

/**
 * NHẬT KÝ (LOGS)
 */
function startLogPolling() {
    const container = document.getElementById('logsContainer');
    document.getElementById('clearLogs').addEventListener('click', () => {
        container.innerHTML = '<div class="text-slate-700 italic">// View cleared...</div>';
    });

    setInterval(async () => {
        if (state.currentTab !== 'logs') return;

        try {
            const res = await fetch('/api/admin/logs?limit=40');
            const data = await res.json();
            
            if (data && data.logs) {
                const logsHtml = data.logs.map(log => {
                    let color = 'text-green-500';
                    if (log.includes('ERROR')) color = 'text-red-400';
                    if (log.includes('WARNING')) color = 'text-yellow-400';
                    return `<div class="mb-1 ${color} font-mono">${escapeHtml(log)}</div>`;
                }).join('');
                
                const isAtBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 50;
                container.innerHTML = logsHtml;
                if (isAtBottom) container.scrollTop = container.scrollHeight;
            }
        } catch (err) { console.error('Log fetch error'); }
    }, 3000);
}

/**
 * CẤU HÌNH (CONFIG)
 */
async function refreshConfig() {
    const container = document.getElementById('configList');
    try {
        const res = await fetch('/api/admin/config');
        const config = await res.json();
        
        container.innerHTML = Object.entries(config).map(([key, value]) => `
            <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase">${key}</label>
                <div class="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm">
                    ${value}
                </div>
            </div>
        `).join('');
    } catch (err) { console.error('Config fetch error'); }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
