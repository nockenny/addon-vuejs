function Mapping(name, colDes, colData) {
    this.name = name;
    this.colDes = colDes - 1;
    this.colData = colData - 1;
}

$(document).ready(function() {
    // --- Legacy / QC Logic ---
    if (document.getElementById('fnSaveMapping')) {
        document.getElementById('fnSaveMapping').addEventListener('click', () => {
            var mapdata = [
                new Mapping("hour", $('#hour-des').val(), $('#hour-resource').val()),
                new Mapping("comment", $('#comment-des').val(), $('#comment-resource').val()),
                new Mapping("function", $('#function-des').val(), $('#function-resource').val()),
                new Mapping("phase", $('#phase-des').val(), $('#phase-resource').val())
            ];

            chrome.storage.sync.get(["RKSetings"], function(items) {
                if (items == undefined) {
                    items = {};
                }
                items.mapper = mapdata;
                chrome.storage.sync.set({"RKSetings": items}, function() {
                    alert('Settings saved');
                });
            });
        });
    }

    // --- Import / Export Backup and settings ---
    if (document.getElementById('fnImportSetting')) {
        document.getElementById('fnImportSetting').addEventListener('click', () => {
            var file = document.getElementById("importSetting").files[0];
            if (file) {
                var reader = new FileReader();
                reader.readAsText(file, "UTF-8");
                reader.onload = async function (evt) {
                    try {
                        var backupData = JSON.parse(evt.target.result);

                        // Restore Chrome Sync setting
                        if (backupData.RKSetings) {
                            chrome.storage.sync.set({"RKSetings": backupData.RKSetings});
                        }
                        if (backupData.setting) {
                            chrome.storage.sync.set({"setting": backupData.setting});
                        }

                        // Restore IndexedDB Data if included in backup
                        if (backupData.indexedDBBackup) {
                            await importFullBackup(backupData.indexedDBBackup);
                        }

                        alert('Khôi phục dữ liệu sao lưu thành công!');

                        // Refresh dynamic elements
                        if (window.renderDynamicTabs) {
                            await window.renderDynamicTabs();
                        }
                        refreshNotesList();
                        refreshTabsList();
                        refreshDashboard();
                        refreshBirthdaysList();

                    } catch (e) {
                        alert("Lỗi phân tích file sao lưu: " + e.message);
                    }
                };
                reader.onerror = function (evt) {
                    alert("error reading file");
                }
            } else {
                alert("Vui lòng chọn file sao lưu (.json)");
            }
        });
    }

    if (document.getElementById('fnExportSetting')) {
        document.getElementById('fnExportSetting').addEventListener('click', async () => {
            chrome.storage.sync.get(null, async function(items) {
                try {
                    // Fetch IndexedDB Full Backup
                    const dbBackup = await exportFullBackup();

                    // Assemble combined backup payload
                    const backupPayload = {
                        ...items,
                        indexedDBBackup: dbBackup
                    };

                    // Robust Exporting using Blob & URL.createObjectURL to support large database sizes cleanly
                    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json;charset=utf-8" });
                    const downloadUrl = URL.createObjectURL(blob);

                    var a = window.document.createElement('a');
                    a.setAttribute('href', downloadUrl);
                    a.setAttribute('download', 'extension_full_backup.json');
                    window.document.body.appendChild(a);
                    a.click();

                    // Cleanup URL object
                    setTimeout(() => {
                        window.document.body.removeChild(a);
                        URL.revokeObjectURL(downloadUrl);
                    }, 100);
                } catch (err) {
                    alert("Lỗi xuất sao lưu: " + err.message);
                }
            });
        });
    }

    // Helpers
    function formatTime(timestamp) {
        if (!timestamp) return '';
        const d = new Date(timestamp);
        return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    }

    // --- Birthday list dynamic sorting, rendering, and notification system ---
    async function refreshBirthdaysList() {
        try {
            const list = await getAllBirthdays();

            // Sort birthdays by month & day (ascending order from Jan 1st to Dec 31st)
            list.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (dateA.getMonth() !== dateB.getMonth()) {
                    return dateA.getMonth() - dateB.getMonth();
                }
                return dateA.getDate() - dateB.getDate();
            });

            const tbody = $('#birthdays-tbody');
            tbody.empty();

            const now = new Date();
            const currentYear = now.getFullYear();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

            const upcomingList = [];

            if (list.length === 0) {
                $('#birthdays-list-empty').show();
                $('#birthdays-table-container').hide();
                $('#upcoming-birthdays-alert').hide();
            } else {
                $('#birthdays-list-empty').hide();
                $('#birthdays-table-container').show();

                list.forEach(item => {
                    const dob = new Date(item.date);

                    // Calculate next birthday date
                    let nextBday = new Date(currentYear, dob.getMonth(), dob.getDate());
                    if (nextBday.getTime() < todayStart) {
                        nextBday.setFullYear(currentYear + 1);
                    }

                    // Calculate upcoming age
                    const ageNext = nextBday.getFullYear() - dob.getFullYear();

                    // Check if upcoming birthday is within the next 7 days
                    const diffTime = nextBday.getTime() - todayStart;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays >= 0 && diffDays <= 7) {
                        upcomingList.push({
                            name: item.name,
                            daysLeft: diffDays,
                            nextAge: ageNext,
                            bdayFormatted: formatDate(item.date)
                        });
                    }

                    const rowHtml = `
                        <tr>
                            <td><strong>${item.name}</strong></td>
                            <td>${formatDate(item.date)}</td>
                            <td>${ageNext} tuổi (vào ngày ${dob.getDate()}/${dob.getMonth() + 1})</td>
                            <td>
                                <button class="btn btn-sm btn-danger btn-delete-birthday" data-id="${item.id}">
                                    <i class="fa fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                    tbody.append(rowHtml);
                });

                // Display upcoming birthdays banner and trigger chrome notifications
                const alertBanner = $('#upcoming-birthdays-alert');
                const alertListContainer = $('#upcoming-birthdays-list');
                alertListContainer.empty();

                if (upcomingList.length > 0) {
                    alertBanner.show();
                    upcomingList.forEach(up => {
                        const daysLeftText = up.daysLeft === 0 ? "hôm nay!" : `sau ${up.daysLeft} ngày nữa (${up.bdayFormatted})`;
                        const itemHtml = `<li><strong>${up.name}</strong> bước sang tuổi ${up.nextAge} vào <strong>${daysLeftText}</strong></li>`;
                        alertListContainer.append(itemHtml);

                        // Trigger Chrome System Notification
                        if (window.chrome && chrome.notifications) {
                            chrome.notifications.create(`bday_${up.name}_${up.daysLeft}`, {
                                type: "basic",
                                iconUrl: "../images/icon.png",
                                title: "Sắp tới sinh nhật!",
                                message: `Sắp tới sinh nhật của ${up.name} bước sang tuổi ${up.nextAge} vào ${daysLeftText}.`,
                                priority: 1
                            });
                        }
                    });
                } else {
                    alertBanner.hide();
                }
            }
        } catch (err) {
            console.error("Lỗi tải danh sách sinh nhật: ", err);
        }
    }

    // Add Birthday submit trigger
    $('#add-birthday-form').on('submit', async function(e) {
        e.preventDefault();
        const name = $('#birthday-name').val();
        const bdate = $('#birthday-date').val();

        if (!name.trim() || !bdate) return;

        try {
            await addBirthday({
                name: name,
                date: bdate,
                createdAt: Date.now()
            });

            $('#birthday-name').val('');
            $('#birthday-date').val('');
            await refreshBirthdaysList();
        } catch (err) {
            alert("Lỗi thêm sinh nhật: " + err.message);
        }
    });

    // Delete Birthday trigger
    $(document).on('click', '.btn-delete-birthday', async function() {
        const id = $(this).data('id');
        if (confirm("Bạn có muốn xóa người này khỏi danh sách sinh nhật không?")) {
            try {
                await deleteBirthday(Number(id));
                await refreshBirthdaysList();
            } catch (err) {
                alert("Lỗi xóa: " + err.message);
            }
        }
    });


    // --- 1. Notes & Reminders Logic ---
    async function refreshNotesList() {
        try {
            const notes = await getAllNotes();
            notes.sort((a, b) => b.createdAt - a.createdAt);

            const container = $('#notes-list-container');
            container.empty();

            if (notes.length === 0) {
                $('#notes-list-empty').show();
            } else {
                $('#notes-list-empty').hide();
                notes.forEach(note => {
                    const isAlerted = note.reminderTime && note.status === 'alerted';
                    const noteHtml = `
                        <div class="note-item ${isAlerted ? 'alerted' : ''}" data-id="${note.id}">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <p class="mb-1" style="font-size: 15px; word-break: break-word;">${note.text}</p>
                                    <small class="text-muted d-block">
                                        <i class="fa fa-calendar-plus-o"></i> Tạo lúc: ${formatTime(note.createdAt)}
                                    </small>
                                    ${note.reminderTime ? `
                                        <small class="text-danger d-block">
                                            <i class="fa fa-bell"></i> Hẹn giờ: ${formatTime(note.reminderTime)}
                                            ${isAlerted ? '<span class="badge badge-danger">Đã nhắc nhở</span>' : ''}
                                        </small>
                                    ` : ''}
                                </div>
                                <button type="button" class="btn btn-outline-danger btn-sm btn-delete-note" data-id="${note.id}">
                                    <i class="fa fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    container.append(noteHtml);
                });
            }
        } catch (e) {
            console.error(e);
        }
    }

    $('#add-note-form').on('submit', async function(e) {
        e.preventDefault();
        const text = $('#note-text-input').val();
        const rTime = $('#reminder-time-input').val();

        if (!text.trim()) return;

        const newNote = {
            text: text,
            createdAt: Date.now(),
            reminderTime: rTime ? new Date(rTime).getTime() : null,
            status: 'pending'
        };

        try {
            const savedId = await addNote(newNote);

            if (newNote.reminderTime) {
                const now = Date.now();
                const delayInMinutes = Math.max(0.1, (newNote.reminderTime - now) / 60000);
                if (window.chrome && chrome.alarms) {
                    chrome.alarms.create(`reminder_${savedId}`, {
                        delayInMinutes: delayInMinutes
                    });
                }
            }

            $('#note-text-input').val('');
            $('#reminder-time-input').val('');
            await refreshNotesList();
        } catch (err) {
            alert("Lỗi lưu ghi chú: " + err.message);
        }
    });

    $(document).on('click', '.btn-delete-note', async function() {
        const id = $(this).data('id');
        if (confirm("Bạn có chắc chắn muốn xóa ghi chú này?")) {
            try {
                await deleteNote(Number(id));
                if (window.chrome && chrome.alarms) {
                    chrome.alarms.clear(`reminder_${id}`);
                }
                await refreshNotesList();
            } catch (err) {
                alert("Lỗi xóa: " + err.message);
            }
        }
    });


    // --- 2. Custom Tabs Manager Logic ---
    let editMode = false;
    let editId = null;

    async function refreshTabsList() {
        try {
            const tabs = await getAllCustomTabs();
            const tbody = $('#tabs-list-tbody');
            tbody.empty();

            if (tabs.length === 0) {
                $('#tabs-list-empty').show();
                $('#tabs-list-table-container').hide();
            } else {
                $('#tabs-list-empty').hide();
                $('#tabs-list-table-container').show();

                tabs.forEach(t => {
                    const triggerText = t.execTrigger === 'both' ? 'Cả hai' : (t.execTrigger === 'manual' ? 'Thủ công' : 'Tự động');
                    const triggerClass = t.execTrigger === 'both' ? 'badge-info' : (t.execTrigger === 'manual' ? 'badge-secondary' : 'badge-success');

                    const contextText = t.execContext === 'popup' ? 'Popup' : 'Nhúng vào Web';
                    const contextClass = t.execContext === 'popup' ? 'badge-primary' : 'badge-dark';

                    const rowHtml = `
                        <tr>
                            <td><strong>${t.name}</strong></td>
                            <td><span class="badge ${triggerClass}">${triggerText}</span></td>
                            <td><span class="badge ${contextClass}">${contextText}</span></td>
                            <td>
                                <button class="btn btn-sm btn-info btn-edit-custom-tab" data-id="${t.id}"><i class="fa fa-pencil"></i></button>
                                <button class="btn btn-sm btn-danger btn-delete-custom-tab" data-id="${t.id}"><i class="fa fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                    tbody.append(rowHtml);
                });
            }
        } catch (e) {
            console.error(e);
        }
    }

    $('#btn-show-create-tab').on('click', function() {
        editMode = false;
        editId = null;
        $('#custom-tab-edit-id').val('');
        $('#custom-tab-name').val('');
        $('#custom-tab-html').val('');
        $('#custom-tab-js').val('');
        $('#custom-tab-exec-trigger').val('both');
        $('#custom-tab-exec-context').val('activeTab'); // Default to robust Active Page injection context

        $('#custom-tab-form-title').text('Tạo Tab Mới');
        $('#custom-tab-form-card').slideDown();
        $(this).hide();
    });

    $('#btn-cancel-custom-tab').on('click', function() {
        $('#custom-tab-form-card').slideUp();
        $('#btn-show-create-tab').show();
    });

    $('.btn-boilerplate').on('click', function() {
        const type = $(this).data('type');
        let code = '';
        if (type === 'alert') {
            code = `\n// Hiển thị thông báo Alert\nalert("Xin chào từ tab tùy biến của bạn!");\n`;
        } else if (type === 'dbAdd') {
            code = `\n// Thêm một bản ghi mới vào dữ liệu lớn IndexedDB\naddGeneralData({\n    key: "User Log",\n    value: "Mô tả dữ liệu được lưu trữ tự động lúc: " + new Date().toLocaleTimeString(),\n    createdAt: Date.now()\n}).then(() => {\n    alert("Lưu dữ liệu lớn vào IndexedDB thành công!");\n    if (window.refreshDashboard) window.refreshDashboard();\n});\n`;
        } else if (type === 'injectPage') {
            code = `\n// Nhúng và thay đổi màu nền trang web hiện tại\ndocument.body.style.backgroundColor = "lightyellow";\nconsole.log("Extension has updated active page background!");\n`;
        }

        const jsTextarea = $('#custom-tab-js');
        jsTextarea.val(jsTextarea.val() + code);
    });

    $('#custom-tab-form').on('submit', async function(e) {
        e.preventDefault();
        const name = $('#custom-tab-name').val();
        const html = $('#custom-tab-html').val();
        const js = $('#custom-tab-js').val();
        const execTrigger = $('#custom-tab-exec-trigger').val();
        const execContext = $('#custom-tab-exec-context').val();

        if (!name.trim()) return;

        const tabData = {
            name: name,
            html: html,
            js: js,
            execTrigger: execTrigger,
            execContext: execContext
        };

        try {
            if (editMode && editId !== null) {
                tabData.id = editId;
                await updateCustomTab(tabData);
            } else {
                await addCustomTab(tabData);
            }

            $('#custom-tab-form-card').slideUp();
            $('#btn-show-create-tab').show();

            await refreshTabsList();
            if (window.renderDynamicTabs) {
                await window.renderDynamicTabs();
            }
        } catch (err) {
            alert("Lỗi lưu Tab: " + err.message);
        }
    });

    $(document).on('click', '.btn-edit-custom-tab', async function() {
        const id = $(this).data('id');
        try {
            const tabs = await getAllCustomTabs();
            const tab = tabs.find(t => t.id === Number(id));
            if (tab) {
                editMode = true;
                editId = tab.id;
                $('#custom-tab-edit-id').val(tab.id);
                $('#custom-tab-name').val(tab.name);
                $('#custom-tab-html').val(tab.html || '');
                $('#custom-tab-js').val(tab.js || '');
                $('#custom-tab-exec-trigger').val(tab.execTrigger);
                $('#custom-tab-exec-context').val(tab.execContext);

                $('#custom-tab-form-title').text('Sửa Tab');
                $('#custom-tab-form-card').slideDown();
                $('#btn-show-create-tab').hide();
            }
        } catch (err) {
            alert("Lỗi tải thông tin tab: " + err.message);
        }
    });

    $(document).on('click', '.btn-delete-custom-tab', async function() {
        const id = $(this).data('id');
        if (confirm("Bạn có chắc chắn muốn xóa tab tùy biến này?")) {
            try {
                await deleteCustomTab(Number(id));
                await refreshTabsList();
                if (window.renderDynamicTabs) {
                    await window.renderDynamicTabs();
                }
            } catch (err) {
                alert("Lỗi xóa tab: " + err.message);
            }
        }
    });


    // --- 3. Large DB Dashboard Logic ---
    let allRecords = [];

    async function refreshDashboard() {
        try {
            allRecords = await getAllGeneralData();
            renderDashboardTable();
        } catch (e) {
            console.error(e);
        }
    }

    function renderDashboardTable() {
        const query = $('#dashboard-search-query').val().toLowerCase().trim();
        const filtered = query === "" ? allRecords : allRecords.filter(r =>
            (r.key && r.key.toLowerCase().includes(query)) ||
            (r.value && r.value.toLowerCase().includes(query))
        );

        const tbody = $('#dashboard-records-tbody');
        tbody.empty();

        if (filtered.length === 0) {
            $('#dashboard-list-empty').show();
            $('#dashboard-table-container').hide();
        } else {
            $('#dashboard-list-empty').hide();
            $('#dashboard-table-container').show();

            filtered.forEach(rec => {
                const rowHtml = `
                    <tr>
                        <td>${rec.id}</td>
                        <td><strong>${rec.key}</strong></td>
                        <td style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${rec.value}">
                            ${rec.value}
                        </td>
                        <td>${formatTime(rec.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-danger btn-delete-dashboard-rec" data-id="${rec.id}"><i class="fa fa-trash"></i></button>
                        </td>
                    </tr>
                `;
                tbody.append(rowHtml);
            });
        }
    }

    $('#add-test-data-form').on('submit', async function(e) {
        e.preventDefault();
        const key = $('#test-data-key').val();
        const value = $('#test-data-value').val();

        if (!key.trim() || !value.trim()) return;

        try {
            await addGeneralData({
                key: key,
                value: value,
                createdAt: Date.now()
            });

            $('#test-data-key').val('');
            $('#test-data-value').val('');
            await refreshDashboard();
        } catch (err) {
            alert("Lỗi thêm dữ liệu: " + err.message);
        }
    });

    $(document).on('click', '.btn-delete-dashboard-rec', async function() {
        const id = $(this).data('id');
        if (confirm("Bạn có chắc chắn muốn xóa bản ghi dữ liệu này?")) {
            try {
                await deleteGeneralData(Number(id));
                await refreshDashboard();
            } catch (err) {
                alert("Lỗi xóa bản ghi: " + err.message);
            }
        }
    });

    $('#btn-clear-all-db').on('click', async function() {
        if (confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa sạch toàn bộ bản ghi dữ liệu lớn?")) {
            try {
                await clearGeneralData();
                await refreshDashboard();
            } catch (err) {
                alert("Lỗi xóa dữ liệu: " + err.message);
            }
        }
    });

    $('#dashboard-search-query').on('input', function() {
        renderDashboardTable();
    });

    $('#btn-export-csv').on('click', function() {
        if (allRecords.length === 0) {
            alert("Không có dữ liệu để xuất!");
            return;
        }

        let csvContent = "ID,Khóa / Tiêu đề,Giá trị chi tiết,Thời gian tạo\n";

        allRecords.forEach(r => {
            const row = [
                r.id,
                `"${(r.key || '').replace(/"/g, '""')}"`,
                `"${(r.value || '').replace(/"/g, '""')}"`,
                `"${formatTime(r.createdAt)}"`
            ];
            csvContent += row.join(",") + "\n";
        });

        // Robust CSV Download using Blob to handle large datasets seamlessly without crashing
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
        const downloadUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.setAttribute("href", downloadUrl);
        a.setAttribute("download", `indexedDB_export_${Date.now()}.csv`);
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        }, 100);
    });

    // Make global functions so helper tools can trigger reload
    window.refreshNotesList = refreshNotesList;
    window.refreshTabsList = refreshTabsList;
    window.refreshDashboard = refreshDashboard;
    window.refreshBirthdaysList = refreshBirthdaysList;

    // Load initial data
    refreshNotesList();
    refreshTabsList();
    refreshDashboard();
    refreshBirthdaysList();
});
