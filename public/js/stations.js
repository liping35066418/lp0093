const StationModule = (function() {
    let selectedStation = null;
    let selectedDate = getTodayDate();
    let selectedStartTime = null;
    let selectedEndTime = null;
    let currentAvailability = null;
    let stationsData = [];

    const stationTypeMap = {
        wash: { label: '洗护区', icon: '🛁' },
        dry: { label: '吹干区', icon: '💨' },
        groom: { label: '美容区', icon: '✂️' },
    };

    async function init() {
        const dateInput = document.getElementById('booking-date');
        dateInput.value = selectedDate;
        dateInput.addEventListener('change', (e) => {
            selectedDate = e.target.value;
            loadStations();
        });

        document.getElementById('start-time').addEventListener('change', onTimeSelectChange);
        document.getElementById('end-time').addEventListener('change', onTimeSelectChange);
        document.getElementById('show-booking-form').addEventListener('click', goToBookingForm);

        await loadStations();
    }

    async function loadStations() {
        try {
            stationsData = await API.getStations(selectedDate);
            renderStations();
        } catch (error) {
            showToast('加载工位数据失败', 'error');
        }
    }

    function renderStations() {
        const washContainer = document.getElementById('wash-stations');
        const dryContainer = document.getElementById('dry-stations');
        const groomContainer = document.getElementById('groom-stations');

        washContainer.innerHTML = '';
        dryContainer.innerHTML = '';
        groomContainer.innerHTML = '';

        stationsData.forEach(station => {
            const card = createStationCard(station);
            switch (station.type) {
                case 'wash':
                    washContainer.appendChild(card);
                    break;
                case 'dry':
                    dryContainer.appendChild(card);
                    break;
                case 'groom':
                    groomContainer.appendChild(card);
                    break;
            }
        });
    }

    function createStationCard(station) {
        const div = document.createElement('div');
        const typeInfo = stationTypeMap[station.type];
        
        const availableSlots = station.timeSlots.filter(s => s.available).length;
        const totalSlots = station.timeSlots.length;
        const isAvailable = availableSlots > 0;
        
        let statusClass = isAvailable ? 'available' : 'occupied';
        let statusText = isAvailable ? '可预约' : '已满';

        if (selectedStation && selectedStation.id === station.id) {
            statusClass = 'selected';
        }

        if (station.status === 'maintenance') {
            statusClass = 'maintenance';
            statusText = '维护中';
        }

        div.className = `station-card ${statusClass}`;
        div.innerHTML = `
            <div class="station-name">${typeInfo.icon} ${station.name}</div>
            <div class="station-type">${typeInfo.label}</div>
            <span class="station-status ${statusClass}">${statusText}</span>
            <div class="occupied-count">可用时段: ${availableSlots}/${totalSlots}</div>
        `;

        div.addEventListener('click', () => selectStation(station));
        return div;
    }

    async function selectStation(station) {
        if (station.status === 'maintenance') {
            showToast('该工位正在维护中', 'info');
            return;
        }

        selectedStation = station;
        renderStations();

        try {
            currentAvailability = await API.getStationAvailability(station.id, selectedDate);
            showTimeslotPanel();
        } catch (error) {
            showToast('加载时段数据失败', 'error');
        }
    }

    function showTimeslotPanel() {
        const panel = document.getElementById('timeslot-panel');
        const stationName = document.getElementById('selected-station-name');
        stationName.textContent = `${currentAvailability.stationName} - 选择时段`;

        populateTimeSelectors();
        renderTimeSlots();
        
        panel.classList.remove('hidden');
        panel.scrollIntoView({ behavior: 'smooth' });
    }

    function populateTimeSelectors() {
        const startSelect = document.getElementById('start-time');
        const endSelect = document.getElementById('end-time');

        const availableSlots = currentAvailability.timeSlots.filter(s => s.available);
        
        startSelect.innerHTML = '<option value="">请选择</option>';
        endSelect.innerHTML = '<option value="">请选择</option>';

        availableSlots.forEach(slot => {
            const option1 = document.createElement('option');
            option1.value = slot.startTime;
            option1.textContent = slot.startTime;
            startSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = slot.endTime;
            option2.textContent = slot.endTime;
            endSelect.appendChild(option2);
        });

        selectedStartTime = null;
        selectedEndTime = null;
        updateBookingButton();
    }

    function onTimeSelectChange() {
        const startSelect = document.getElementById('start-time');
        const endSelect = document.getElementById('end-time');
        
        selectedStartTime = startSelect.value || null;
        selectedEndTime = endSelect.value || null;

        if (selectedStartTime && selectedEndTime) {
            const startMin = timeToMinutes(selectedStartTime);
            const endMin = timeToMinutes(selectedEndTime);
            
            if (startMin >= endMin) {
                showToast('结束时间必须晚于开始时间', 'error');
                selectedEndTime = null;
                endSelect.value = '';
            }
        }

        renderTimeSlots();
        updateBookingButton();
    }

    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    function renderTimeSlots() {
        const container = document.getElementById('timeslots-container');
        container.innerHTML = '';

        const startMin = selectedStartTime ? timeToMinutes(selectedStartTime) : null;
        const endMin = selectedEndTime ? timeToMinutes(selectedEndTime) : null;

        currentAvailability.timeSlots.forEach(slot => {
            const div = document.createElement('div');
            const slotStart = timeToMinutes(slot.startTime);
            const slotEnd = timeToMinutes(slot.endTime);

            let slotClass = slot.available ? 'available' : 'occupied';
            
            if (startMin && endMin && slotStart >= startMin && slotEnd <= endMin) {
                if (slot.available) {
                    slotClass = 'selected';
                }
            }

            div.className = `timeslot ${slotClass}`;
            div.textContent = `${slot.startTime}-${slot.endTime}`;
            container.appendChild(div);
        });
    }

    function updateBookingButton() {
        const btn = document.getElementById('show-booking-form');
        btn.disabled = !(selectedStation && selectedStartTime && selectedEndTime);
    }

    function goToBookingForm() {
        if (!selectedStation || !selectedStartTime || !selectedEndTime) {
            showToast('请先选择工位和时段', 'error');
            return;
        }

        BookingModule.setBookingInfo({
            stationId: selectedStation.id,
            stationName: selectedStation.name,
            date: selectedDate,
            startTime: selectedStartTime,
            endTime: selectedEndTime,
        });

        navigateToPage('booking');
    }

    function getSelectedDate() {
        return selectedDate;
    }

    return {
        init,
        loadStations,
        getSelectedDate,
    };
})();
