// Background service worker for managing alarms and reminders

const DB_NAME = "ExtensionLargeDB";
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("custom_tabs")) {
                db.createObjectStore("custom_tabs", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("notes_reminders")) {
                db.createObjectStore("notes_reminders", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("birthdays")) {
                db.createObjectStore("birthdays", { keyPath: "id", autoIncrement: true });
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

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name.startsWith("reminder_")) {
        const id = alarm.name.split("_")[1];

        try {
            const db = await openDB();
            const transaction = db.transaction("notes_reminders", "readonly");
            const store = transaction.objectStore("notes_reminders");
            const getReq = store.get(Number(id));

            getReq.onsuccess = () => {
                const note = getReq.result;
                if (note && note.status !== "dismissed") {
                    chrome.notifications.create(`note_${id}`, {
                        type: "basic",
                        iconUrl: "../images/icon.png",
                        title: "Nhắc nhở nhanh!",
                        message: note.text || "Bạn có một nhắc nhở mới.",
                        priority: 2
                    });

                    // Update status in DB to alerted
                    const updateTransaction = db.transaction("notes_reminders", "readwrite");
                    const updateStore = updateTransaction.objectStore("notes_reminders");
                    note.status = "alerted";
                    updateStore.put(note);
                }
            };
        } catch (err) {
            console.error("Error reading indexedDB in background service worker: ", err);
        }
    }
});
