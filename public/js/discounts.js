const DiscountModule = (function() {
    let discountRules = [];

    async function init() {
        setupEventListeners();
        await loadDiscountRules();
    }

    function setupEventListeners() {
        document.getElementById('discount-type').addEventListener('change', (e) => {
            const thresholdGroup = document.getElementById('threshold-group');
            thresholdGroup.style.display = e.target.value === 'threshold' ? 'block' : 'none';
        });

        document.getElementById('discount-form').addEventListener('submit', handleCreateDiscount);
    }

    async function loadDiscountRules() {
        try {
            discountRules = await API.getDiscountRules();
            renderDiscountRules();
        } catch (error) {
            console.error('Load discounts error:', error);
        }
    }

    function renderDiscountRules() {
        const container = document.getElementById('discounts-container');

        if (discountRules.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">暂无折扣规则</p>';
            return;
        }

        const typeLabels = {
            percentage: '折扣百分比',
            fixed: '固定金额减免',
            threshold: '满减',
        };

        container.innerHTML = discountRules.map(rule => {
            const statusClass = rule.enabled ? 'enabled' : 'disabled';
            const statusText = rule.enabled ? '启用中' : '已停用';

            let valueDisplay = '';
            switch (rule.type) {
                case 'percentage':
                    valueDisplay = `${100 - rule.value}折 (减${rule.value}%)`;
                    break;
                case 'fixed':
                    valueDisplay = `立减 ¥${rule.value}`;
                    break;
                case 'threshold':
                    valueDisplay = `满¥${rule.threshold}减¥${rule.value}`;
                    break;
            }

            return `
                <div class="discount-card ${statusClass}">
                    <div class="discount-info">
                        <h4>${rule.name} <span style="font-size: 12px; color: #999; font-weight: normal;">(${statusText})</span></h4>
                        <p><strong>类型：</strong>${typeLabels[rule.type]}</p>
                        <p><strong>优惠：</strong>${valueDisplay}</p>
                        <p style="margin-bottom: 0;"><strong>描述：</strong>${rule.description}</p>
                    </div>
                    <div class="discount-actions">
                        <label class="switch">
                            <input type="checkbox" ${rule.enabled ? 'checked' : ''} 
                                onchange="DiscountModule.toggleRule('${rule.id}')">
                            <span class="slider"></span>
                        </label>
                        <button class="btn btn-danger" onclick="DiscountModule.deleteRule('${rule.id}')">删除</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function handleCreateDiscount(e) {
        e.preventDefault();

        const type = document.getElementById('discount-type').value;
        const name = document.getElementById('discount-name').value.trim();
        const value = parseFloat(document.getElementById('discount-value').value);
        const description = document.getElementById('discount-description').value.trim();
        const enabled = document.getElementById('discount-enabled').checked;

        const discountData = {
            name,
            type,
            value,
            description,
            enabled,
        };

        if (type === 'threshold') {
            const threshold = parseFloat(document.getElementById('discount-threshold').value);
            if (!threshold || threshold <= 0) {
                showToast('请输入有效的满减门槛', 'error');
                return;
            }
            discountData.threshold = threshold;
        }

        try {
            await API.createDiscountRule(discountData);
            showToast('折扣规则创建成功', 'success');
            document.getElementById('discount-form').reset();
            document.getElementById('threshold-group').style.display = 'none';
            loadDiscountRules();
        } catch (error) {
            showToast('创建失败: ' + error.message, 'error');
        }
    }

    async function toggleRule(id) {
        try {
            await API.toggleDiscountRule(id);
            showToast('规则状态已更新', 'success');
            loadDiscountRules();
        } catch (error) {
            showToast('操作失败', 'error');
        }
    }

    async function deleteRule(id) {
        if (!confirm('确认删除此折扣规则？')) return;

        try {
            await API.deleteDiscountRule(id);
            showToast('规则已删除', 'success');
            loadDiscountRules();
        } catch (error) {
            showToast('删除失败', 'error');
        }
    }

    return {
        init,
        loadDiscountRules,
        toggleRule,
        deleteRule,
    };
})();
