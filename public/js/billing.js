const BillingModule = (function() {
    let petSizes = [];
    let extraServices = [];
    let bills = [];

    async function init() {
        try {
            [petSizes, extraServices] = await Promise.all([
                API.getPetSizes(),
                API.getExtraServices(),
            ]);

            populateQuickPetSizeSelect();
            populateQuickExtraServices();
            setupEventListeners();
            refreshData();
        } catch (error) {
            console.error('Billing init error:', error);
        }
    }

    function refreshData() {
        loadBills();
        loadDailyRevenue();
    }

    function populateQuickPetSizeSelect() {
        const select = document.getElementById('quick-pet-size');
        select.innerHTML = '<option value="">请选择宠物体型</option>';
        
        petSizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size.id;
            option.textContent = `${size.name} - ${formatCurrency(size.basePrice)}`;
            select.appendChild(option);
        });
    }

    function populateQuickExtraServices() {
        const container = document.getElementById('quick-extra-services');
        container.innerHTML = '';

        extraServices.forEach(service => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" value="${service.id}" class="quick-extra-checkbox">
                <span>${service.name} (${formatCurrency(service.price)})</span>
            `;
            container.appendChild(label);
        });
    }

    function setupEventListeners() {
        document.getElementById('quick-pet-size').addEventListener('change', updateQuickResult);
        
        document.getElementById('quick-extra-services').addEventListener('change', (e) => {
            if (e.target.classList.contains('quick-extra-checkbox')) {
                updateQuickResult();
            }
        });
    }

    function getQuickSelectedServiceIds() {
        const checkboxes = document.querySelectorAll('.quick-extra-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    async function updateQuickResult() {
        const petSizeId = document.getElementById('quick-pet-size').value;
        const extraServiceIds = getQuickSelectedServiceIds();
        const resultElement = document.getElementById('quick-result');

        if (!petSizeId) {
            resultElement.textContent = formatCurrency(0);
            return;
        }

        try {
            const result = await API.quickCalculate(petSizeId, extraServiceIds);
            resultElement.textContent = formatCurrency(result);
        } catch (error) {
            showToast('计算失败', 'error');
        }
    }

    async function loadBills() {
        try {
            bills = await API.getBills();
            renderBills();
        } catch (error) {
            console.error('Load bills error:', error);
        }
    }

    async function loadDailyRevenue() {
        try {
            const revenue = await API.getDailyRevenue();
            document.getElementById('today-revenue').textContent = formatCurrency(revenue.totalRevenue);
            document.getElementById('today-paid-count').textContent = revenue.paidCount;
            document.getElementById('today-avg-order').textContent = formatCurrency(revenue.avgOrderValue);
        } catch (error) {
            console.error('Load daily revenue error:', error);
        }
    }

    function renderBills() {
        const container = document.getElementById('bills-container');
        
        if (bills.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">暂无账单</p>';
            return;
        }

        container.innerHTML = bills.map(bill => {
            const statusClass = bill.status === 'paid' ? 'paid' : 'unpaid';
            const statusText = bill.status === 'paid' ? '已支付' : '待支付';

            let itemsHtml = '';
            bill.items.forEach(item => {
                itemsHtml += `
                    <div class="bill-item">
                        <span>${item.name}</span>
                        <span>${formatCurrency(item.price * item.quantity)}</span>
                    </div>
                `;
            });

            if (bill.discounts.length > 0) {
                bill.discounts.forEach(d => {
                    itemsHtml += `
                        <div class="bill-item bill-discount">
                            <span>${d.ruleName}</span>
                            <span>-${formatCurrency(d.discountAmount)}</span>
                        </div>
                    `;
                });
            }

            let actions = '';
            if (bill.status === 'unpaid') {
                actions = `
                    <button class="btn btn-success" onclick="BillingModule.markPaid('${bill.id}')">标记已支付</button>
                `;
            }

            return `
                <div class="bill-card ${statusClass}">
                    <div class="bill-header">
                        <h4>账单 #${bill.id.substring(0, 8)}</h4>
                        <span class="bill-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="bill-items">
                        ${itemsHtml}
                    </div>
                    <div class="bill-total">
                        <span>合计：</span>
                        <span>${formatCurrency(bill.totalAmount)}</span>
                    </div>
                    <div class="bill-actions">
                        ${actions}
                    </div>
                </div>
            `;
        }).join('');
    }

    async function viewBill(bookingId) {
        try {
            const bill = await API.getBill(`booking/${bookingId}`);
            
            let itemsHtml = '';
            bill.items.forEach(item => {
                itemsHtml += `
                    <div class="bill-item">
                        <span>${item.name}</span>
                        <span>${formatCurrency(item.price * item.quantity)}</span>
                    </div>
                `;
            });

            if (bill.discounts.length > 0) {
                bill.discounts.forEach(d => {
                    itemsHtml += `
                        <div class="bill-item bill-discount">
                            <span>${d.ruleName}</span>
                            <span>-${formatCurrency(d.discountAmount)}</span>
                        </div>
                    `;
                });
            }

            const statusClass = bill.status === 'paid' ? 'paid' : 'unpaid';
            const statusText = bill.status === 'paid' ? '已支付' : '待支付';

            const modalContent = `
                <h3 style="margin-bottom: 20px;">账单详情</h3>
                <div class="bill-card ${statusClass}" style="margin: 0;">
                    <div class="bill-header">
                        <h4>账单 #${bill.id.substring(0, 8)}</h4>
                        <span class="bill-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="bill-items">
                        ${itemsHtml}
                    </div>
                    <div class="bill-total">
                        <span>合计：</span>
                        <span style="color: #667eea; font-size: 24px;">${formatCurrency(bill.totalAmount)}</span>
                    </div>
                    ${bill.status === 'unpaid' ? `
                        <div style="margin-top: 20px; text-align: right;">
                            <button class="btn btn-success" onclick="BillingModule.markPaidAndCloseModal('${bill.id}')">标记已支付</button>
                        </div>
                    ` : ''}
                </div>
            `;

            showModal(modalContent);
        } catch (error) {
            showToast('获取账单失败', 'error');
        }
    }

    async function markPaid(id) {
        try {
            await API.markBillPaid(id);
            showToast('账单已标记为已支付', 'success');
            refreshData();
        } catch (error) {
            showToast('操作失败', 'error');
        }
    }

    async function markPaidAndCloseModal(id) {
        await markPaid(id);
        hideModal();
    }

    function refreshQuickCalc() {
        const petSizeId = document.getElementById('quick-pet-size').value;
        if (petSizeId) {
            updateQuickResult();
        }
    }

    return {
        init,
        loadBills,
        viewBill,
        markPaid,
        markPaidAndCloseModal,
        refreshData,
        refreshQuickCalc,
    };
})();
