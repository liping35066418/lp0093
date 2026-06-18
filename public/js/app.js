function navigateToPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === pageName) {
            btn.classList.add('active');
        }
    });

    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    if (pageName === 'booking') {
        BookingModule.loadBookings();
    } else if (pageName === 'billing') {
        BillingModule.loadBills();
    } else if (pageName === 'discounts') {
        DiscountModule.loadDiscountRules();
    }
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        navigateToPage(btn.dataset.page);
    });
});

async function initApp() {
    await Promise.all([
        StationModule.init(),
        BookingModule.init(),
        BillingModule.init(),
        DiscountModule.init(),
    ]);
}

document.addEventListener('DOMContentLoaded', initApp);
