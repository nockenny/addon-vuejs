// IndexedDB database operations helper
const DB_NAME = "ExtensionLargeDB";
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // 1. Table for custom user tabs
            if (!db.objectStoreNames.contains("custom_tabs")) {
                db.createObjectStore("custom_tabs", { keyPath: "id", autoIncrement: true });
            }

            // 2. Table for notes & reminders
            if (!db.objectStoreNames.contains("notes_reminders")) {
                db.createObjectStore("notes_reminders", { keyPath: "id", autoIncrement: true });
            }

            // 3. Table for general large database records (Data Dashboard)
            if (!db.objectStoreNames.contains("general_large_data")) {
                db.createObjectStore("general_large_data", { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Custom Tabs API
async function getAllCustomTabs() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("custom_tabs", "readonly");
        const store = transaction.objectStore("custom_tabs");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function addCustomTab(tab) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("custom_tabs", "readwrite");
        const store = transaction.objectStore("custom_tabs");
        const request = store.add(tab);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateCustomTab(tab) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("custom_tabs", "readwrite");
        const store = transaction.objectStore("custom_tabs");
        const request = store.put(tab);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteCustomTab(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("custom_tabs", "readwrite");
        const store = transaction.objectStore("custom_tabs");
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Notes & Reminders API
async function getAllNotes() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("notes_reminders", "readonly");
        const store = transaction.objectStore("notes_reminders");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function addNote(note) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("notes_reminders", "readwrite");
        const store = transaction.objectStore("notes_reminders");
        const request = store.add(note);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateNote(note) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("notes_reminders", "readwrite");
        const store = transaction.objectStore("notes_reminders");
        const request = store.put(note);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteNote(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("notes_reminders", "readwrite");
        const store = transaction.objectStore("notes_reminders");
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// General Large Data API
async function getAllGeneralData() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("general_large_data", "readonly");
        const store = transaction.objectStore("general_large_data");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function addGeneralData(data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("general_large_data", "readwrite");
        const store = transaction.objectStore("general_large_data");
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function clearGeneralData() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("general_large_data", "readwrite");
        const store = transaction.objectStore("general_large_data");
        const request = store.clear();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteGeneralData(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("general_large_data", "readwrite");
        const store = transaction.objectStore("general_large_data");
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Backup & Restore Database Functions
async function exportFullBackup() {
    const db = await openDB();
    const backup = {
        custom_tabs: [],
        notes_reminders: [],
        general_large_data: []
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["custom_tabs", "notes_reminders", "general_large_data"], "readonly");

        transaction.objectStore("custom_tabs").getAll().onsuccess = (e) => {
            backup.custom_tabs = e.target.result;
        };

        transaction.objectStore("notes_reminders").getAll().onsuccess = (e) => {
            backup.notes_reminders = e.target.result;
        };

        transaction.objectStore("general_large_data").getAll().onsuccess = (e) => {
            backup.general_large_data = e.target.result;
        };

        transaction.oncomplete = () => {
            resolve(backup);
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}

async function importFullBackup(backup) {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["custom_tabs", "notes_reminders", "general_large_data"], "readwrite");

        // Clear all first
        transaction.objectStore("custom_tabs").clear();
        transaction.objectStore("notes_reminders").clear();
        transaction.objectStore("general_large_data").clear();

        // Add all custom_tabs
        if (backup.custom_tabs && Array.isArray(backup.custom_tabs)) {
            const customTabsStore = transaction.objectStore("custom_tabs");
            backup.custom_tabs.forEach(tab => {
                customTabsStore.add(tab);
            });
        }

        // Add all notes
        if (backup.notes_reminders && Array.isArray(backup.notes_reminders)) {
            const notesStore = transaction.objectStore("notes_reminders");
            backup.notes_reminders.forEach(note => {
                notesStore.add(note);
            });
        }

        // Add all general data
        if (backup.general_large_data && Array.isArray(backup.general_large_data)) {
            const generalDataStore = transaction.objectStore("general_large_data");
            backup.general_large_data.forEach(item => {
                generalDataStore.add(item);
            });
        }

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}
