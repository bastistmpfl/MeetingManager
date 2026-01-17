// MeetingManager main application
class MeetingManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedPerson = null;
        this.currentView = 'month';
        this.persons = [];
        this.meetings = [];
        this.currentMeeting = null;
    }

    async init() {
        try {
            await db.init();
            await this.loadData();
            await this.ensurePersistentStorage();
            this.setupEventListeners();
            this.renderCalendar();
            this.renderPersonList();
        } catch (error) {
            console.error('Error during initialization:', error);
            alert('Error starting the application. Please reload the page.');
        }
    }

    async ensurePersistentStorage() {
        try {
            const statusEl = document.getElementById('storageStatus');
            if (!navigator.storage || !navigator.storage.persist) {
                if (statusEl) statusEl.textContent = 'Storage: unknown';
                return;
            }

            const alreadyPersisted = await navigator.storage.persisted();
            if (alreadyPersisted) {
                if (statusEl) statusEl.textContent = 'Storage: persistent';
                return;
            }

            const granted = await navigator.storage.persist();
            if (statusEl) statusEl.textContent = granted ? 'Storage: persistent' : 'Storage: not persistent';
        } catch (e) {
            const statusEl = document.getElementById('storageStatus');
            if (statusEl) statusEl.textContent = 'Storage: error';
            console.warn('Persistent storage request failed:', e);
        }
    }

    async loadData() {
        this.persons = await db.getAllPersons();
        this.meetings = await db.getAllMeetings();
    }

    setupEventListeners() {
        // Kalender Navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        document.getElementById('todayBtn').addEventListener('click', () => {
            this.currentDate = new Date();
            this.renderCalendar();
        });

        // View Toggle
        document.getElementById('monthViewBtn').addEventListener('click', () => {
            this.switchView('month');
        });

        document.getElementById('listViewBtn').addEventListener('click', () => {
            this.switchView('list');
        });

        // Person hinzufügen
        document.getElementById('addPersonBtn').addEventListener('click', () => {
            this.openPersonModal();
        });

        // Person suchen
        document.getElementById('personSearch').addEventListener('input', (e) => {
            this.filterPersons(e.target.value);
        });

        // Personen-Formular
        document.getElementById('personForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePerson();
        });

        // Meeting-Formular
        document.getElementById('meetingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMeeting();
        });

        // Modal schließen
        document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Modal außerhalb klicken
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Detail Modal Buttons
        document.getElementById('editMeetingBtn').addEventListener('click', () => {
            if (this.currentMeeting) {
                this.openMeetingModal(this.currentMeeting);
            }
        });

        document.getElementById('deleteMeetingBtn').addEventListener('click', () => {
            if (this.currentMeeting) {
                this.deleteMeeting(this.currentMeeting.id);
            }
        });

        // List View Filter
        document.getElementById('filterType').addEventListener('change', () => {
            this.renderListView();
        });

        document.getElementById('filterStatus').addEventListener('change', () => {
            this.renderListView();
        });

        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Display month
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

        // Generate calendar days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        
        const firstDayWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        const daysInPrevMonth = prevLastDay.getDate();

        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Previous month days
        for (let i = firstDayWeek - 1; i > 0; i--) {
            const day = daysInPrevMonth - i + 1;
            const dayElement = this.createDayElement(day, year, month - 1, true);
            calendarDays.appendChild(dayElement);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this.createDayElement(day, year, month, false);
            const dayDate = new Date(year, month, day);
            dayDate.setHours(0, 0, 0, 0);
            
            if (dayDate.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }
            
            calendarDays.appendChild(dayElement);
        }

        // Next month days
        const totalDays = calendarDays.children.length;
        const remainingDays = 42 - totalDays; // 6 weeks * 7 days
        for (let day = 1; day <= remainingDays; day++) {
            const dayElement = this.createDayElement(day, year, month + 1, true);
            calendarDays.appendChild(dayElement);
        }
    }

    createDayElement(day, year, month, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        // Meetings for this day
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayMeetings = this.meetings.filter(m => m.date === dateStr);

        if (dayMeetings.length > 0) {
            const meetingsContainer = document.createElement('div');
            meetingsContainer.className = 'day-meetings';
            
            dayMeetings.forEach(meeting => {
                const badge = document.createElement('span');
                badge.className = `meeting-badge ${meeting.type}`;
                badge.textContent = meeting.type === 'coffee' ? '☕' : '🍽️';
                badge.title = this.getPersonName(meeting.personId);
                meetingsContainer.appendChild(badge);
            });
            
            dayElement.appendChild(meetingsContainer);
        }

        // Click Event
        dayElement.addEventListener('click', () => {
            this.showDayMeetings(dateStr, dayMeetings);
        });

        return dayElement;
    }

    showDayMeetings(date, meetings) {
        if (meetings.length > 1) {
            this.showDayMeetingsList(date, meetings);
        } else if (meetings.length === 1) {
            // Show details of the first meeting
            this.showMeetingDetails(meetings[0]);
        } else {
            // Create new meeting
            this.openMeetingModal(null, date);
        }
    }

    showDayMeetingsList(date, meetings) {
        const modal = document.getElementById('detailModal');
        const content = document.getElementById('detailContent');
        const header = modal.querySelector('.modal-header h3');

        header.textContent = `Meetings on ${this.formatDate(date)}`;
        document.getElementById('editMeetingBtn').style.display = 'none';
        document.getElementById('deleteMeetingBtn').style.display = 'none';

        content.innerHTML = '';

        const listContainer = document.createElement('div');
        listContainer.className = 'day-meeting-list';

        meetings.forEach(meeting => {
            const card = document.createElement('div');
            card.className = 'meeting-card';

            const meetingDate = new Date(meeting.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            meetingDate.setHours(0, 0, 0, 0);

            if (meetingDate < today && this.isOverdue(meeting)) {
                card.classList.add('overdue');
            } else if (meetingDate >= today) {
                card.classList.add('upcoming');
            }

            const person = this.persons.find(p => p.id === meeting.personId);
            const typeLabel = meeting.type === 'coffee' ? '☕ Coffee' : '🍽️ Lunch';

            card.innerHTML = `
                <div class="meeting-header">
                    <div class="meeting-person">${person ? person.name : 'Unknown'}</div>
                    <div class="meeting-type-badge ${meeting.type}">${typeLabel}</div>
                </div>
                <div class="meeting-info">📅 ${this.formatDate(meeting.date)}${meeting.time ? ' at ' + meeting.time : ''}</div>
                ${meeting.notes ? `<div class="meeting-info">📝 ${meeting.notes}</div>` : ''}
            `;

            const actions = document.createElement('div');
            actions.className = 'person-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-primary btn-small';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openMeetingModal(meeting);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-small';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteMeeting(meeting.id);
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            card.appendChild(actions);
            listContainer.appendChild(card);
        });

        content.appendChild(listContainer);

        const addWrapper = document.createElement('div');
        addWrapper.style.marginTop = '12px';
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-primary';
        addBtn.textContent = '+ Add meeting';
        addBtn.addEventListener('click', () => this.openMeetingModal(null, date));
        addWrapper.appendChild(addBtn);
        content.appendChild(addWrapper);

        this.currentMeeting = null;
        this.closeAllModals();
        modal.classList.add('active');
    }

    renderPersonList() {
        const personList = document.getElementById('personList');
        personList.innerHTML = '';

        if (this.persons.length === 0) {
            personList.innerHTML = '<li style="padding: 20px; text-align: center; color: #64748b;">No people yet</li>';
            return;
        }

        // Sort people: without meeting first, then by days since last meeting (descending)
        const sortedPersons = [...this.persons].sort((a, b) => {
            const aMeetings = this.meetings.filter(m => m.personId === a.id);
            const bMeetings = this.meetings.filter(m => m.personId === b.id);
            
            const aLastMeeting = this.getLastMeeting(aMeetings);
            const bLastMeeting = this.getLastMeeting(bMeetings);
            
            const aDays = this.getDaysSince(aLastMeeting);
            const bDays = this.getDaysSince(bLastMeeting);
            
            // People without meetings (null) first
            if (aDays === null && bDays === null) return 0;
            if (aDays === null) return -1;
            if (bDays === null) return 1;
            
            // Sort by days descending (longest period first)
            return bDays - aDays;
        });

        sortedPersons.forEach(person => {
            const li = document.createElement('li');
            li.className = 'person-item';
            
            const personMeetings = this.meetings.filter(m => m.personId === person.id);
            const lastMeeting = this.getLastMeeting(personMeetings);
            const nextReminder = this.getNextReminder(lastMeeting);
            const daysSinceLastMeeting = this.getDaysSince(lastMeeting);

            li.innerHTML = `
                <div class="person-name">${person.name}</div>
                <div class="person-stats">
                    <span>☕ ${personMeetings.filter(m => m.type === 'coffee').length}</span>
                    <span>🍽️ ${personMeetings.filter(m => m.type === 'lunch').length}</span>
                </div>
                ${lastMeeting ? `<div style="font-size: 0.8em; margin-top: 5px; color: #64748b;">Last meeting: ${this.formatDate(lastMeeting.date)}</div>` : ''}
                ${daysSinceLastMeeting !== null ? (daysSinceLastMeeting === 0 ? `<div style="font-size: 0.8em; color: ${this.getDaysColor(daysSinceLastMeeting)};">🕒 Today</div>` : daysSinceLastMeeting > 0 ? `<div style="font-size: 0.8em; color: ${this.getDaysColor(daysSinceLastMeeting)};">🕒 ${daysSinceLastMeeting} ${daysSinceLastMeeting === 1 ? 'day' : 'days'} ago</div>` : `<div style="font-size: 0.8em; color: ${this.getDaysColor(daysSinceLastMeeting)};">📅 in ${Math.abs(daysSinceLastMeeting)} ${Math.abs(daysSinceLastMeeting) === 1 ? 'day' : 'days'}</div>`) : '<div style="font-size: 0.8em; color: #94a3b8;">No meeting yet</div>'}
                ${nextReminder ? `<div style="font-size: 0.8em; color: #ea580c;">⚠️ Next meeting due</div>` : ''}
                <div class="person-actions">
                    <button class="btn btn-primary btn-small" onclick="app.openMeetingModal(null, null, ${person.id})">+ Meeting</button>
                    <button class="btn btn-secondary btn-small" onclick="app.openPersonModal(${person.id})">✏️</button>
                    <button class="btn btn-danger btn-small" onclick="app.deletePersonConfirm(${person.id})">🗑️</button>
                </div>
            `;

            li.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn')) {
                    this.selectPerson(person.id);
                }
            });

            personList.appendChild(li);
        });
    }

    filterPersons(searchTerm) {
        const items = document.querySelectorAll('.person-item');
        items.forEach(item => {
            const name = item.querySelector('.person-name').textContent.toLowerCase();
            if (name.includes(searchTerm.toLowerCase())) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    selectPerson(personId) {
        this.selectedPerson = personId;
        
        // Visual feedback
        document.querySelectorAll('.person-item').forEach(item => {
            item.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');

        // Filter Meetings im List View
        if (this.currentView === 'list') {
            this.renderListView();
        }
    }

    switchView(view) {
        this.currentView = view;
        
        document.getElementById('monthViewBtn').classList.toggle('active', view === 'month');
        document.getElementById('listViewBtn').classList.toggle('active', view === 'list');
        
        document.getElementById('calendarView').style.display = view === 'month' ? 'block' : 'none';
        document.getElementById('listView').style.display = view === 'list' ? 'block' : 'none';
        
        if (view === 'list') {
            this.renderListView();
        }
    }

    renderListView() {
        const meetingList = document.getElementById('meetingList');
        const filterType = document.getElementById('filterType').value;
        const filterStatus = document.getElementById('filterStatus').value;
        
        let filteredMeetings = [...this.meetings];
        
        // Filter nach Typ
        if (filterType !== 'all') {
            filteredMeetings = filteredMeetings.filter(m => m.type === filterType);
        }
        
        // Filter nach Person
        if (this.selectedPerson) {
            filteredMeetings = filteredMeetings.filter(m => m.personId === this.selectedPerson);
        }
        
        // Filter nach Status
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (filterStatus !== 'all') {
            filteredMeetings = filteredMeetings.filter(m => {
                const meetingDate = new Date(m.date);
                meetingDate.setHours(0, 0, 0, 0);
                
                if (filterStatus === 'past') {
                    return meetingDate < today;
                } else if (filterStatus === 'upcoming') {
                    return meetingDate >= today;
                } else if (filterStatus === 'overdue') {
                    return this.isOverdue(m);
                }
                return true;
            });
        }
        
        // Sortieren nach Datum
        filteredMeetings.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        meetingList.innerHTML = '';
        
        if (filteredMeetings.length === 0) {
            meetingList.innerHTML = '<div style="padding: 40px; text-align: center; color: #64748b;">No meetings found</div>';
            return;
        }
        
        filteredMeetings.forEach(meeting => {
            const card = this.createMeetingCard(meeting);
            meetingList.appendChild(card);
        });
    }

    createMeetingCard(meeting) {
        const card = document.createElement('div');
        card.className = 'meeting-card';
        
        const meetingDate = new Date(meeting.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        meetingDate.setHours(0, 0, 0, 0);
        
        if (meetingDate < today && this.isOverdue(meeting)) {
            card.classList.add('overdue');
        } else if (meetingDate >= today) {
            card.classList.add('upcoming');
        }
        
        const person = this.persons.find(p => p.id === meeting.personId);
        const typeLabel = meeting.type === 'coffee' ? '☕ Coffee' : '🍽️ Lunch';
        
        card.innerHTML = `
            <div class="meeting-header">
                <div class="meeting-person">${person ? person.name : 'Unknown'}</div>
                <div class="meeting-type-badge ${meeting.type}">${typeLabel}</div>
            </div>
            <div class="meeting-info">
                📅 ${this.formatDate(meeting.date)}${meeting.time ? ' at ' + meeting.time : ''}
            </div>
            ${meeting.notes ? `<div class="meeting-info">📝 ${meeting.notes}</div>` : ''}
        `;
        
        card.addEventListener('click', () => {
            this.showMeetingDetails(meeting);
        });
        
        return card;
    }

    isOverdue(meeting) {
        if (!meeting.reminderDays) return false;
        
        const meetingDate = new Date(meeting.date);
        const today = new Date();
        const daysSince = Math.floor((today - meetingDate) / (1000 * 60 * 60 * 24));
        
        return daysSince >= meeting.reminderDays;
    }

    getLastMeeting(meetings) {
        if (meetings.length === 0) return null;
        return meetings.reduce((latest, meeting) => {
            return new Date(meeting.date) > new Date(latest.date) ? meeting : latest;
        });
    }

    getNextReminder(lastMeeting) {
        if (!lastMeeting || !lastMeeting.reminderDays) return null;
        
        const meetingDate = new Date(lastMeeting.date);
        const today = new Date();
        const daysSince = Math.floor((today - meetingDate) / (1000 * 60 * 60 * 24));
        
        return daysSince >= lastMeeting.reminderDays;
    }

    getDaysSince(meeting) {
        if (!meeting) return null;
        
        const meetingDate = new Date(meeting.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        meetingDate.setHours(0, 0, 0, 0);
        
        const daysSince = Math.floor((today - meetingDate) / (1000 * 60 * 60 * 24));
        return daysSince;
    }

    getDaysColor(days) {
        if (days === 0) return '#16a34a';
        if (days < 0) return '#1b96d4';
        if (days <= 7) return '#16a34a';
        if (days <= 30) return '#e88103';
        if (days <= 90) return '#dc2626';
        return '#dc2626';
    }

    // Modal Funktionen
    openPersonModal(personId = null) {
        const modal = document.getElementById('personModal');
        const form = document.getElementById('personForm');
        
        if (personId) {
            const person = this.persons.find(p => p.id === personId);
            document.getElementById('personModalTitle').textContent = 'Edit Person';
            document.getElementById('personId').value = person.id;
            document.getElementById('personName').value = person.name;
            document.getElementById('personEmail').value = person.email || '';
            document.getElementById('personNotes').value = person.notes || '';
        } else {
            document.getElementById('personModalTitle').textContent = 'Add Person';
            form.reset();
        }
        
        modal.classList.add('active');
    }

    openMeetingModal(meeting = null, date = null, personId = null) {
        const modal = document.getElementById('meetingModal');
        const form = document.getElementById('meetingForm');
        const personSelect = document.getElementById('meetingPerson');
        
        // Fill people dropdown
        personSelect.innerHTML = '<option value="">-- Select person --</option>'; 
        this.persons.forEach(person => {
            const option = document.createElement('option');
            option.value = person.id;
            option.textContent = person.name;
            personSelect.appendChild(option);
        });
        
        if (meeting) {
            document.getElementById('meetingModalTitle').textContent = 'Edit Meeting';
            document.getElementById('meetingId').value = meeting.id;
            document.getElementById('meetingPerson').value = meeting.personId;
            document.getElementById('meetingType').value = meeting.type;
            document.getElementById('meetingDate').value = meeting.date;
            document.getElementById('meetingTime').value = meeting.time || '';
            document.getElementById('meetingNotes').value = meeting.notes || '';
            document.getElementById('reminderDays').value = meeting.reminderDays || '';
        } else {
            document.getElementById('meetingModalTitle').textContent = 'Add Meeting';
            form.reset();
            if (date) {
                document.getElementById('meetingDate').value = date;
            }
            if (personId) {
                document.getElementById('meetingPerson').value = personId;
            }
        }
        
        this.closeAllModals();
        modal.classList.add('active');
    }

    showMeetingDetails(meeting) {
        const modal = document.getElementById('detailModal');
        const content = document.getElementById('detailContent');
        const header = modal.querySelector('.modal-header h3');
        header.textContent = 'Meeting Details';
        document.getElementById('editMeetingBtn').style.display = '';
        document.getElementById('deleteMeetingBtn').style.display = '';
        
        const person = this.persons.find(p => p.id === meeting.personId);
        const typeLabel = meeting.type === 'coffee' ? '☕ Coffee' : '🍽️ Lunch';
        
        content.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">Person</div>
                <div class="detail-value">${person ? person.name : 'Unknown'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Type</div>
                <div class="detail-value">${typeLabel}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Date</div>
                <div class="detail-value">${this.formatDate(meeting.date)}</div>
            </div>
            ${meeting.time ? `
            <div class="detail-row">
                <div class="detail-label">Time</div>
                <div class="detail-value">${meeting.time}</div>
            </div>
            ` : ''}
            ${meeting.notes ? `
            <div class="detail-row">
                <div class="detail-label">Notes</div>
                <div class="detail-value">${meeting.notes}</div>
            </div>
            ` : ''}
            ${meeting.reminderDays ? `
            <div class="detail-row">
                <div class="detail-label">Reminder</div>
                <div class="detail-value">Every ${meeting.reminderDays} days</div>
            </div>
            ` : ''}
        `;
        
        this.currentMeeting = meeting;
        this.closeAllModals();
        modal.classList.add('active');
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Speichern und Löschen
    async savePerson() {
        const id = document.getElementById('personId').value;
        const person = {
            name: document.getElementById('personName').value,
            email: document.getElementById('personEmail').value,
            notes: document.getElementById('personNotes').value
        };

        try {
            if (id) {
                await db.updatePerson(parseInt(id), person);
            } else {
                await db.addPerson(person);
            }
            
            await this.loadData();
            this.renderPersonList();
            this.renderCalendar();
            this.closeAllModals();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error saving person');
        }
    }

    async saveMeeting() {
        const id = document.getElementById('meetingId').value;
        const meeting = {
            personId: parseInt(document.getElementById('meetingPerson').value),
            type: document.getElementById('meetingType').value,
            date: document.getElementById('meetingDate').value,
            time: document.getElementById('meetingTime').value,
            notes: document.getElementById('meetingNotes').value,
            reminderDays: parseInt(document.getElementById('reminderDays').value) || null
        };

        try {
            if (id) {
                await db.updateMeeting(parseInt(id), meeting);
            } else {
                await db.addMeeting(meeting);
            }
            
            await this.loadData();
            this.renderCalendar();
            this.renderPersonList();
            if (this.currentView === 'list') {
                this.renderListView();
            }
            this.closeAllModals();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error saving meeting');
        }
    }

    async deletePersonConfirm(personId) {
        const person = this.persons.find(p => p.id === personId);
        if (confirm(`Do you really want to delete ${person.name} and all associated meetings?`)) {
            try {
                await db.deletePerson(personId);
                await this.loadData();
                this.renderPersonList();
                this.renderCalendar();
                if (this.currentView === 'list') {
                    this.renderListView();
                }
            } catch (error) {
                console.error('Error deleting:', error);
                alert('Error deleting person');
            }
        }
    }

    async deleteMeeting(meetingId) {
        if (confirm('Do you really want to delete this meeting?')) {
            try {
                await db.deleteMeeting(meetingId);
                await this.loadData();
                this.renderCalendar();
                this.renderPersonList();
                if (this.currentView === 'list') {
                    this.renderListView();
                }
                this.closeAllModals();
            } catch (error) {
                console.error('Error deleting:', error);
                alert('Error deleting meeting');
            }
        }
    }

    // Hilfsfunktionen
    getPersonName(personId) {
        const person = this.persons.find(p => p.id === personId);
        return person ? person.name : 'Unknown';
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Export-Funktion
    async exportData() {
        try {
            const data = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                persons: this.persons,
                meetings: this.meetings
            };

            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `meetingmanager-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('✅ Data exported successfully!');
        } catch (error) {
            console.error('Error during export:', error);
            alert('❌ Error exporting data');
        }
    }

    // Import-Funktion
    async importData(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validation
            if (!data.persons || !data.meetings) {
                throw new Error('Invalid data format');
            }

            const confirmMsg = `Do you want to import the data?\n\nThe file contains:\n- ${data.persons.length} person(s)\n- ${data.meetings.length} meeting(s)\n\n⚠️ Warning: Existing data will be replaced!`;
            
            if (!confirm(confirmMsg)) {
                return;
            }

            // Datenbank leeren und neue Daten einfügen
            const transaction = db.db.transaction(['persons', 'meetings'], 'readwrite');
            const personStore = transaction.objectStore('persons');
            const meetingStore = transaction.objectStore('meetings');

            // Alte Daten löschen
            await personStore.clear();
            await meetingStore.clear();

            // Neue Daten einfügen
            for (const person of data.persons) {
                // ID entfernen, damit neue IDs generiert werden
                const { id, ...personData } = person;
                const newId = await db.addPerson(personData);
                
                // Meeting personId aktualisieren
                data.meetings.forEach(meeting => {
                    if (meeting.personId === id) {
                        meeting.personId = newId;
                    }
                });
            }

            for (const meeting of data.meetings) {
                const { id, ...meetingData } = meeting;
                await db.addMeeting(meetingData);
            }

            // Daten neu laden und UI aktualisieren
            await this.loadData();
            this.renderPersonList();
            this.renderCalendar();
            if (this.currentView === 'list') {
                this.renderListView();
            }

            alert('✅ Data imported successfully!');
            
            // File Input zurücksetzen
            document.getElementById('importFile').value = '';
        } catch (error) {
            console.error('Error during import:', error);
            alert('❌ Error importing data. Please check the file.');
            document.getElementById('importFile').value = '';
        }
    }
}

// App initialisieren
const app = new MeetingManager();
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
