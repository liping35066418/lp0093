const API_BASE = '/api';

async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...defaultOptions,
            ...options,
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || '请求失败');
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

const API = {
    getStations: (date) => apiRequest(`/stations${date ? `?date=${date}` : ''}`),
    getStationAvailability: (stationId, date) => 
        apiRequest(`/stations/${stationId}/availability${date ? `?date=${date}` : ''}`),
    
    getPetSizes: () => apiRequest('/pet-sizes'),
    getExtraServices: () => apiRequest('/extra-services'),
    
    createBooking: (bookingData) => 
        apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        }),
    getBookings: (date) => 
        apiRequest(`/bookings${date ? `?date=${date}` : ''}`),
    getBooking: (id) => apiRequest(`/bookings/${id}`),
    updateBookingStatus: (id, status) => 
        apiRequest(`/bookings/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),
    
    calculateBill: (data) => 
        apiRequest('/billing/calculate', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    createBill: (bookingId, data) => 
        apiRequest(`/billing/booking/${bookingId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    getBills: () => apiRequest('/billing'),
    getBill: (id) => apiRequest(`/billing/${id}`),
    markBillPaid: (id) => 
        apiRequest(`/billing/${id}/pay`, {
            method: 'PUT',
        }),
    quickCalculate: (petSizeId, extraServiceIds) => 
        apiRequest(`/billing/quick?petSizeId=${petSizeId}&extraServiceIds=${extraServiceIds.join(',')}`),
    
    getDiscountRules: () => apiRequest('/discounts'),
    getEnabledDiscountRules: () => apiRequest('/discounts/enabled'),
    createDiscountRule: (data) => 
        apiRequest('/discounts', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    updateDiscountRule: (id, data) => 
        apiRequest(`/discounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    toggleDiscountRule: (id) => 
        apiRequest(`/discounts/${id}/toggle`, {
            method: 'PUT',
        }),
    deleteDiscountRule: (id) => 
        apiRequest(`/discounts/${id}`, {
            method: 'DELETE',
        }),
};

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function showModal(content) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = content;
    modal.classList.remove('hidden');
}

function hideModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
}

document.getElementById('modal-close').addEventListener('click', hideModal);
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
        hideModal();
    }
});

function formatCurrency(amount) {
    return `¥${amount.toFixed(2)}`;
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
