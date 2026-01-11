/**
 * Main JavaScript for Prediction Market Dashboard
 */

// API Helper
async function fetchData(endpoint) {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        return null;
    }
}

async function postData(endpoint, data) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        return null;
    }
}

// Format helpers
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatPercent(num, decimals = 1) {
    if (num === null || num === undefined) return '-';
    return `${(num * 100).toFixed(decimals)}%`;
}

function formatCurrency(num) {
    if (num === null || num === undefined) return '-';
    return `$${formatNumber(num)}`;
}

function formatTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function timeAgo(timestamp) {
    if (!timestamp) return 'Never';
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// Sentiment color helper
function getSentimentClass(sentiment) {
    if (sentiment > 0.1) return 'sentiment-bullish';
    if (sentiment < -0.1) return 'sentiment-bearish';
    return 'sentiment-neutral';
}

function getSentimentBadge(sentiment) {
    if (sentiment > 0.3) return '<span class="badge badge-green">Very Bullish</span>';
    if (sentiment > 0.1) return '<span class="badge badge-green">Bullish</span>';
    if (sentiment < -0.3) return '<span class="badge badge-red">Very Bearish</span>';
    if (sentiment < -0.1) return '<span class="badge badge-red">Bearish</span>';
    return '<span class="badge badge-blue">Neutral</span>';
}

// Direction badge
function getDirectionBadge(direction) {
    if (direction === 'BUY' || direction === 'YES') {
        return '<span class="badge badge-green"><i class="fas fa-arrow-up"></i> BUY</span>';
    } else if (direction === 'SELL' || direction === 'NO') {
        return '<span class="badge badge-red"><i class="fas fa-arrow-down"></i> SELL</span>';
    }
    return '<span class="badge badge-blue">HOLD</span>';
}

// Score badge
function getScoreBadge(score) {
    if (score >= 0.8) return 'badge-green';
    if (score >= 0.6) return 'badge-blue';
    if (score >= 0.4) return 'badge-yellow';
    return 'badge-red';
}

// Loading state
function showLoading(element) {
    element.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

function showEmpty(element, message = 'No data available') {
    element.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>${message}</p>
        </div>
    `;
}

// Chart helpers
function createChartConfig(type, data, options = {}) {
    const defaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: options.showLegend || false,
                position: 'bottom',
                labels: {
                    color: '#a0a0b0',
                    usePointStyle: true,
                    padding: 15
                }
            }
        },
        scales: type !== 'doughnut' && type !== 'pie' ? {
            x: {
                grid: {
                    color: 'rgba(42, 42, 58, 0.5)',
                    drawBorder: false
                },
                ticks: { color: '#6b6b7b' }
            },
            y: {
                grid: {
                    color: 'rgba(42, 42, 58, 0.5)',
                    drawBorder: false
                },
                ticks: { color: '#6b6b7b' }
            }
        } : undefined
    };

    return {
        type,
        data,
        options: { ...defaults, ...options }
    };
}

// Color palette for charts
const chartColors = {
    blue: 'rgba(59, 130, 246, 0.8)',
    green: 'rgba(0, 210, 106, 0.8)',
    red: 'rgba(255, 71, 87, 0.8)',
    yellow: 'rgba(251, 191, 36, 0.8)',
    purple: 'rgba(139, 92, 246, 0.8)',
    cyan: 'rgba(6, 182, 212, 0.8)',
    blueDim: 'rgba(59, 130, 246, 0.2)',
    greenDim: 'rgba(0, 210, 106, 0.2)',
    redDim: 'rgba(255, 71, 87, 0.2)'
};

// Refresh button handler
async function refreshData() {
    const btn = document.querySelector('[onclick="refreshData()"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;"></div>';
    }

    await postData('/api/refresh');

    // Reload page data
    if (typeof loadPageData === 'function') {
        await loadPageData();
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    }
}

// Auto-refresh handler
let autoRefreshInterval = null;

function startAutoRefresh(interval = 300000) { // 5 minutes default
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(async () => {
        if (typeof loadPageData === 'function') {
            await loadPageData();
        }
    }, interval);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Toast notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `alert alert-${type}`;
    toast.style.cssText = 'margin-bottom: 0.5rem; animation: slideIn 0.3s ease;';
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 1000;
        max-width: 350px;
    `;
    document.body.appendChild(container);
    return container;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Start auto-refresh
    startAutoRefresh();

    // Load page data if function exists
    if (typeof loadPageData === 'function') {
        loadPageData();
    }
});

// Export for use in templates
window.PredictFlow = {
    fetchData,
    postData,
    formatNumber,
    formatPercent,
    formatCurrency,
    formatTime,
    formatDate,
    timeAgo,
    getSentimentClass,
    getSentimentBadge,
    getDirectionBadge,
    getScoreBadge,
    showLoading,
    showEmpty,
    createChartConfig,
    chartColors,
    showToast,
    refreshData,
    startAutoRefresh,
    stopAutoRefresh
};
