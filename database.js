// IndexedDB Database Manager for MeetingManager
class DatabaseManager {
    constructor() {
        this.dbName = 'MeetingManagerDB';
        this.version = 1;
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject('Error opening database');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Object store for persons
                if (!db.objectStoreNames.contains('persons')) {
                    const personStore = db.createObjectStore('persons', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    personStore.createIndex('name', 'name', { unique: false });
                    personStore.createIndex('email', 'email', { unique: false });
                }

                // Object store for meetings
                if (!db.objectStoreNames.contains('meetings')) {
                    const meetingStore = db.createObjectStore('meetings', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    meetingStore.createIndex('personId', 'personId', { unique: false });
                    meetingStore.createIndex('date', 'date', { unique: false });
                    meetingStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    // Person operations
    async addPerson(person) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readwrite');
            const store = transaction.objectStore('persons');
            const request = store.add({
                name: person.name,
                email: person.email || '',
                notes: person.notes || '',
                createdAt: new Date().toISOString()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error adding person');
        });
    }

    async updatePerson(id, person) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readwrite');
            const store = transaction.objectStore('persons');
            const request = store.get(id);

            request.onsuccess = () => {
                const data = request.result;
                data.name = person.name;
                data.email = person.email || '';
                data.notes = person.notes || '';
                data.updatedAt = new Date().toISOString();

                const updateRequest = store.put(data);
                updateRequest.onsuccess = () => resolve(updateRequest.result);
                updateRequest.onerror = () => reject('Error updating person');
            };

            request.onerror = () => reject('Person not found');
        });
    }

    async deletePerson(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons', 'meetings'], 'readwrite');
            const personStore = transaction.objectStore('persons');
            const meetingStore = transaction.objectStore('meetings');

            // Delete all meetings of the person
            const index = meetingStore.index('personId');
            const range = IDBKeyRange.only(id);
            const cursorRequest = index.openCursor(range);

            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            // Delete the person
            const deleteRequest = personStore.delete(id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject('Error deleting person');
        });
    }

    async getAllPersons() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readonly');
            const store = transaction.objectStore('persons');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error loading persons');
        });
    }

    async getPerson(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readonly');
            const store = transaction.objectStore('persons');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error loading person');
        });
    }

    // Meeting operations
    async addMeeting(meeting) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['meetings'], 'readwrite');
            const store = transaction.objectStore('meetings');
            const request = store.add({
                personId: meeting.personId,
                type: meeting.type,
                date: meeting.date,
                time: meeting.time || '',
                notes: meeting.notes || '',
                reminderDays: meeting.reminderDays || null,
                createdAt: new Date().toISOString()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error adding meeting');
        });
    }

    async updateMeeting(id, meeting) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['meetings'], 'readwrite');
            const store = transaction.objectStore('meetings');
            const request = store.get(id);

            request.onsuccess = () => {
                const data = request.result;
                data.personId = meeting.personId;
                data.type = meeting.type;
                data.date = meeting.date;
                data.time = meeting.time || '';
                data.notes = meeting.notes || '';
                data.reminderDays = meeting.reminderDays || null;
                data.updatedAt = new Date().toISOString();

                const updateRequest = store.put(data);
                updateRequest.onsuccess = () => resolve(updateRequest.result);
                updateRequest.onerror = () => reject('Error updating meeting');
            };

            request.onerror = () => reject('Meeting not found');
        });
    }

    async deleteMeeting(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['meetings'], 'readwrite');
            const store = transaction.objectStore('meetings');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject('Error deleting meeting');
        });
    }

    async getAllMeetings() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['meetings'], 'readonly');
            const store = transaction.objectStore('meetings');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error loading meetings');
        });
    }

    async getMeeting(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['meetings'], 'readonly');
            const store = transaction.objectStore('meetings');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error loading meeting');
        });
    }

    async getMeetingsByPerson(personId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['meetings'], 'readonly');
            const store = transaction.objectStore('meetings');
            const index = store.index('personId');
            const request = index.getAll(personId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error loading meetings');
        });
    }

    async getMeetingsByDateRange(startDate, endDate) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['meetings'], 'readonly');
            const store = transaction.objectStore('meetings');
            const index = store.index('date');
            const range = IDBKeyRange.bound(startDate, endDate);
            const request = index.getAll(range);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error loading meetings');
        });
    }
}

// Export für Verwendung in app.js
const db = new DatabaseManager();
