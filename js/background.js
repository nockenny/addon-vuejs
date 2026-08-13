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

// Setup standard background alarms on startup or installation
chrome.runtime.onInstalled.addListener(() => {
    // Alarm to check monthly birthdays once every day
    chrome.alarms.create("daily_birthday_check", {
        periodInMinutes: 1440 // Every 24 hours
    });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create("daily_birthday_check", {
        periodInMinutes: 1440
    });
});

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
                if (note && note.status !== "dismissed" && note.status !== "done") {
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
    } else if (alarm.name === "daily_birthday_check") {
        // Run birthday scan in background at a fixed time
        try {
            const db = await openDB();
            const transaction = db.transaction("birthdays", "readonly");
            const store = transaction.objectStore("birthdays");
            const getReq = store.getAll();

            getReq.onsuccess = () => {
                const list = getReq.result || [];
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentDay = now.getDate();

                const birthdaysToday = list.filter(item => {
                    const dob = new Date(item.date);
                    return dob.getMonth() === currentMonth && dob.getDate() === currentDay;
                });

                if (birthdaysToday.length > 0) {
                    birthdaysToday.forEach(b => {
                        const dob = new Date(b.date);
                        const ageNext = now.getFullYear() - dob.getFullYear();
                        chrome.notifications.create(`bday_today_${b.id}`, {
                            type: "basic",
                            iconUrl: "../images/icon.png",
                            title: "Hôm nay có sinh nhật mới! 🎂",
                            message: `Chúc mừng sinh nhật ${b.name} bước sang tuổi ${ageNext}!`,
                            priority: 2
                        });
                    });
                }
            };
        } catch (err) {
            console.error("Error checking birthdays in background: ", err);
        }
    }
});
