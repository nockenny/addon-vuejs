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

            // 3. Table for birthdays
            if (!db.objectStoreNames.contains("birthdays")) {
                db.createObjectStore("birthdays", { keyPath: "id", autoIncrement: true });
            }

            // 4. Table for settings (replacing chrome.storage.sync completely)
            if (!db.objectStoreNames.contains("settings")) {
                db.createObjectStore("settings", { keyPath: "key" });
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

// Birthdays API
async function getAllBirthdays() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("birthdays", "readonly");
        const store = transaction.objectStore("birthdays");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function addBirthday(bday) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("birthdays", "readwrite");
        const store = transaction.objectStore("birthdays");
        const request = store.add(bday);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteBirthday(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("birthdays", "readwrite");
        const store = transaction.objectStore("birthdays");
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Settings API (comprehensive replacement for chrome.storage.sync)
async function getSetting(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("settings", "readonly");
        const store = transaction.objectStore("settings");
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result ? request.result.value : null);
        request.onerror = () => reject(request.error);
    });
}

async function setSetting(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("settings", "readwrite");
        const store = transaction.objectStore("settings");
        const request = store.put({ key: key, value: value });
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
        birthdays: [],
        settings: []
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["custom_tabs", "notes_reminders", "birthdays", "settings"], "readonly");

        transaction.objectStore("custom_tabs").getAll().onsuccess = (e) => {
            backup.custom_tabs = e.target.result;
        };

        transaction.objectStore("notes_reminders").getAll().onsuccess = (e) => {
            backup.notes_reminders = e.target.result;
        };

        transaction.objectStore("birthdays").getAll().onsuccess = (e) => {
            backup.birthdays = e.target.result;
        };

        transaction.objectStore("settings").getAll().onsuccess = (e) => {
            backup.settings = e.target.result;
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
        const transaction = db.transaction(["custom_tabs", "notes_reminders", "birthdays", "settings"], "readwrite");

        // Clear all first
        transaction.objectStore("custom_tabs").clear();
        transaction.objectStore("notes_reminders").clear();
        transaction.objectStore("birthdays").clear();
        transaction.objectStore("settings").clear();

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

        // Add all birthdays
        if (backup.birthdays && Array.isArray(backup.birthdays)) {
            const birthdaysStore = transaction.objectStore("birthdays");
            backup.birthdays.forEach(item => {
                birthdaysStore.add(item);
            });
        }

        // Add all settings
        if (backup.settings && Array.isArray(backup.settings)) {
            const settingsStore = transaction.objectStore("settings");
            backup.settings.forEach(item => {
                settingsStore.add(item);
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
