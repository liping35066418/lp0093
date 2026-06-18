const BookingModule = (function() {
    let bookingInfo = null;
    let petSizes = [];
    let extraServices = [];

    async function init() {
        try {
            [petSizes, extraServices] = await Promise.all([
                API.getPetSizes(),
                API.getExtraServices(),
            ]);
            
            populatePetSizeSelect();
            populateExtraServices();
            setupEventListeners();
            loadBookings();
        } catch (error) {
            console.error('Booking init error:', error);
        }
    }

    function setBookingInfo(info) {
        bookingInfo = info;
        updateBookingSummary();
    }

    function updateBookingSummary() {
        if (!bookingInfo) return;
        
        document.getElementById('summary-station').textContent = bookingInfo.stationName;
        document.getElementById('summary-date').textContent = bookingInfo.date;
        document.getElementById('summary-time').textContent = 
            `${bookingInfo.startTime} - ${bookingInfo.endTime}`;
    }

    function populatePetSizeSelect() {
        const select = document.getElementById('pet-size');
        select.innerHTML = '<option value="">请选择宠物体型</option>';
        
        petSizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size.id;
            option.textContent = `${size.name} - ${formatCurrency(size.basePrice)}`;
            select.appendChild(option);
        });
    }

    function populateExtraServices() {
        const container = document.getElementById('extra-services');
        container.innerHTML = '';

        extraServices.forEach(service => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" value="${service.id}" class="extra-service-checkbox">
                <span>${service.name} (${formatCurrency(service.price)})</span>
            `;
            container.appendChild(label);
        });
    }

    function setupEventListeners() {
        document.getElementById('pet-size').addEventListener('change', updatePricePreview);
        
        document.getElementById('extra-services').addEventListener('change', (e) => {
            if (e.target.classList.contains('extra-service-checkbox')) {
                updatePricePreview();
            }
        });

        document.getElementById('booking-form').addEventListener('submit', handleSubmit);
        document.getElementById('back-to-stations').addEventListener('click', () => {
            navigateToPage('stations');
        });
    }

    function getSelectedExtraServiceIds() {
        const checkboxes = document.querySelectorAll('.extra-service-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    async function updatePricePreview() {
        const petSizeId = document.getElementById('pet-size').value;
        const extraServiceIds = getSelectedExtraServiceIds();

        const breakdownContainer = document.getElementById('price-breakdown');
        const totalElement = document.getElementById('estimated-total');

        if (!petSizeId) {
            breakdownContainer.innerHTML = '<p style="color: #999;">请先选择宠物体型</p>';
            totalElement.textContent = formatCurrency(0);
            return;
        }

        try {
            const result = await API.calculateBill({
                bookingId: 'preview',
                petSizeId,
                extraServiceIds,
            });

            let html = '';
            result.items.forEach(item => {
                html += `
                    <div class="price-item">
                        <span>${item.name}</span>
                        <span>${formatCurrency(item.price * item.quantity)}</span>
                    </div>
                `;
            });

            if (result.discounts.length > 0) {
                result.discounts.forEach(d => {
                    html += `
                        <div class="price-item discount">
                            <span>${d.ruleName}</span>
                            <span>-${formatCurrency(d.discountAmount)}</span>
                        </div>
                    `;
                });
            }

            breakdownContainer.innerHTML = html;
            totalElement.textContent = formatCurrency(result.totalAmount);
        } catch (error) {
            showToast('价格计算失败', 'error');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!bookingInfo) {
            showToast('请先选择工位和时段', 'error');
            navigateToPage('stations');
            return;
        }

        const formData = {
            stationId: bookingInfo.stationId,
            petName: document.getElementById('pet-name').value,
            petSizeId: document.getElementById('pet-size').value,
            extraServiceIds: getSelectedExtraServiceIds(),
            startTime: bookingInfo.startTime,
            endTime: bookingInfo.endTime,
            date: bookingInfo.date,
            customerName: document.getElementById('customer-name').value,
            customerPhone: document.getElementById('customer-phone').value,
        };

        try {
            const result = await API.createBooking(formData);
            
            if (result.success) {
                showToast('预约创建成功！', 'success');
                
                await API.createBill(result.booking.id, {
                    petSizeId: formData.petSizeId,
                    extraServiceIds: formData.extraServiceIds,
                });

                resetForm();
                loadBookings();
                StationModule.loadStations();
            } else {
                showToast(result.error || '预约创建失败', 'error');
            }
        } catch (error) {
            showToast(error.message || '预约创建失败', 'error');
        }
    }

    function resetForm() {
        document.getElementById('booking-form').reset();
        document.getElementById('price-breakdown').innerHTML = '';
        document.getElementById('estimated-total').textContent = formatCurrency(0);
        bookingInfo = null;
        updateBookingSummary();
        document.getElementById('summary-station').textContent = '-';
        document.getElementById('summary-date').textContent = '-';
        document.getElementById('summary-time').textContent = '-';
    }

    async function loadBookings() {
        try {
            const date = StationModule.getSelectedDate();
            const bookings = await API.getBookings(date);
            renderBookings(bookings);
        } catch (error) {
            console.error('Load bookings error:', error);
        }
    }

    function renderBookings(bookings) {
        const container = document.getElementById('bookings-container');
        
        if (bookings.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">暂无预约</p>';
            return;
        }

        const statusMap = {
            pending: { text: '待确认', class: 'pending' },
            confirmed: { text: '已确认', class: 'confirmed' },
            completed: { text: '已完成', class: 'completed' },
            cancelled: { text: '已取消', class: 'cancelled' },
        };

        const petSizeMap = {};
        petSizes.forEach(s => petSizeMap[s.id] = s.name);

        const serviceMap = {};
        extraServices.forEach(s => serviceMap[s.id] = s.name);

        container.innerHTML = bookings.map(booking => {
            const status = statusMap[booking.status];
            const petSizeName = petSizeMap[booking.petSizeId] || booking.petSizeId;
            const serviceNames = booking.extraServiceIds
                .map(id => serviceMap[id] || id)
                .join('、') || '无';

            let actions = '';
            if (booking.status === 'confirmed') {
                actions = `
                    <button class="btn btn-success" onclick="BookingModule.completeBooking('${booking.id}')">完成服务</button>
                    <button class="btn btn-danger" onclick="BookingModule.cancelBooking('${booking.id}')">取消预约</button>
                    <button class="btn btn-primary" onclick="BillingModule.viewBill('${booking.id}')">查看账单</button>
                `;
            } else if (booking.status === 'completed') {
                actions = `
                    <button class="btn btn-primary" onclick="BillingModule.viewBill('${booking.id}')">查看账单</button>
                `;
            }

            return `
                <div class="booking-card ${booking.status}">
                    <div class="booking-header">
                        <h4>${booking.petName} (${petSizeName})</h4>
                        <span class="booking-status ${status.class}">${status.text}</span>
                    </div>
                    <div class="booking-info">
                        <p><strong>客户：</strong>${booking.customerName}</p>
                        <p><strong>电话：</strong>${booking.customerPhone}</p>
                        <p><strong>工位：</strong>${booking.stationId}</p>
                        <p><strong>时段：</strong>${booking.startTime}-${booking.endTime}</p>
                        <p><strong>附加服务：</strong>${serviceNames}</p>
                    </div>
                    <div class="booking-actions">
                        ${actions}
                    </div>
                </div>
            `;
        }).join('');
    }

    async function completeBooking(id) {
        if (!confirm('确认完成此服务？')) return;
        
        try {
            await API.updateBookingStatus(id, 'completed');
            showToast('服务已完成', 'success');
            loadBookings();
        } catch (error) {
            showToast('操作失败', 'error');
        }
    }

    async function cancelBooking(id) {
        if (!confirm('确认取消此预约？')) return;
        
        try {
            await API.updateBookingStatus(id, 'cancelled');
            showToast('预约已取消', 'info');
            loadBookings();
            StationModule.loadStations();
        } catch (error) {
            showToast('操作失败', 'error');
        }
    }

    return {
        init,
        setBookingInfo,
        loadBookings,
        completeBooking,
        cancelBooking,
    };
})();
