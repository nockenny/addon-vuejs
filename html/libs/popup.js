function Mapping(name, colDes, colData) {
    this.name = name;
    this.colDes = colDes - 1;
    this.colData = colData - 1;
}

$(document).ready(async function() {
    // --- Load Mapping settings from IndexedDB store "settings" on popup open ---
    async function loadMappings() {
        try {
            const mapper = await getSetting("RKSetings_mapper");
            if (mapper && Array.isArray(mapper)) {
                mapper.forEach(map => {
                    const colDesVal = Number(map.colDes) + 1;
                    const colDataVal = Number(map.colData) + 1;
                    if (map.name === "hour") {
                        $('#hour-des').val(colDesVal);
                        $('#hour-resource').val(colDataVal);
                    } else if (map.name === "comment") {
                        $('#comment-des').val(colDesVal);
                        $('#comment-resource').val(colDataVal);
                    } else if (map.name === "function") {
                        $('#function-des').val(colDesVal);
                        $('#function-resource').val(colDataVal);
                    } else if (map.name === "phase") {
                        $('#phase-des').val(colDesVal);
                        $('#phase-resource').val(colDataVal);
                    }
                });
            }
        } catch (e) {
            console.error("Lỗi tải mapping từ IndexedDB:", e);
        }
    }

    // --- Legacy / QC Logic ---
    if (document.getElementById('fnSaveMapping')) {
        document.getElementById('fnSaveMapping').addEventListener('click', async () => {
            var mapdata = [
                new Mapping("hour", $('#hour-des').val(), $('#hour-resource').val()),
                new Mapping("comment", $('#comment-des').val(), $('#comment-resource').val()),
                new Mapping("function", $('#function-des').val(), $('#function-resource').val()),
                new Mapping("phase", $('#phase-des').val(), $('#phase-resource').val())
            ];

            try {
                // Save settings purely in IndexedDB
                await setSetting("RKSetings_mapper", mapdata);
                alert('Settings saved to IndexedDB!');
            } catch (err) {
                alert("Lỗi lưu cấu hình: " + err.message);
            }
        });
    }

    // --- Drag and Drop File Handlers ---
    const dropZone = $('#drop-zone');
    const fileInput = $('#importSetting');
    const fileInfo = $('#selected-file-info');

    // Click on drop zone triggers hidden file input click
    dropZone.on('click', function() {
        fileInput.trigger('click');
    });

    // File input selection change
    fileInput.on('change', function() {
        const file = this.files[0];
        if (file) {
            fileInfo.text(`Đã chọn: ${file.name}`).removeClass('d-none');
        } else {
            fileInfo.addClass('d-none');
        }
    });

    // Drag events for drop zone
    dropZone.on('dragover dragenter', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.addClass('dragover');
    });

    dropZone.on('dragleave drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.removeClass('dragover');
    });

    dropZone.on('drop', function(e) {
        const files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
            fileInput[0].files = files;
            const file = files[0];
            fileInfo.text(`Đã chọn: ${file.name}`).removeClass('d-none');
        }
    });

    // Helper to process restore logic
    async function processRestore(file) {
        if (!file) {
            alert("Vui lòng kéo thả hoặc chọn tệp tin sao lưu (.json) trước!");
            return;
        }
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = async function (evt) {
            try {
                var backupData = JSON.parse(evt.target.result);

                // Determine target DB object to compute counts
                let dbData = backupData.indexedDBBackup ? backupData.indexedDBBackup : backupData;

                // Count items to formulate comprehensive Vietnamese stats message
                const tabCount = (dbData.custom_tabs && Array.isArray(dbData.custom_tabs)) ? dbData.custom_tabs.length : 0;
                const noteCount = (dbData.notes_reminders && Array.isArray(dbData.notes_reminders)) ? dbData.notes_reminders.length : 0;
                const bdayCount = (dbData.birthdays && Array.isArray(dbData.birthdays)) ? dbData.birthdays.length : 0;
                const settingCount = (dbData.settings && Array.isArray(dbData.settings)) ? dbData.settings.length : 0;

                // Restore IndexedDB Data
                if (backupData.indexedDBBackup) {
                    await importFullBackup(backupData.indexedDBBackup);
                } else {
                    await importFullBackup(backupData);
                }

                // Display statistics details inside success alert
                alert(`Khôi phục thành công: ${tabCount} Tab tùy biến, ${noteCount} Ghi chú nhắc nhở, ${bdayCount} thông tin Sinh nhật và cấu hình cài đặt (${settingCount} cài đặt)!`);

                // Refresh dynamic elements
                if (window.renderDynamicTabs) {
                    await window.renderDynamicTabs();
                }
                refreshNotesList();
                refreshTabsList();
                refreshBirthdaysList();
                await loadMappings();

                // Reset file info
                fileInput.val('');
                fileInfo.addClass('d-none');

            } catch (e) {
                alert("Lỗi phân tích file sao lưu: " + e.message);
            }
        };
        reader.onerror = function (evt) {
            alert("Lỗi đọc file sao lưu.");
        };
    }

    // --- Import / Export Backup and settings ---
    if (document.getElementById('fnImportSetting')) {
        document.getElementById('fnImportSetting').addEventListener('click', () => {
            var file = fileInput[0].files[0];
            processRestore(file);
        });
    }

    if (document.getElementById('fnExportSetting')) {
        document.getElementById('fnExportSetting').addEventListener('click', async () => {
            try {
                // Fetch IndexedDB Full Backup (which contains settings, custom_tabs, notes, and birthdays)
                const dbBackup = await exportFullBackup();

                // Assemble combined backup payload
                const backupPayload = {
                    indexedDBBackup: dbBackup
                };

                // Formulate a beautiful time-stamped backup name with the extension name prefix
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const date = String(now.getDate()).padStart(2, '0');
                const hour = String(now.getHours()).padStart(2, '0');
                const minute = String(now.getMinutes()).padStart(2, '0');

                const filename = `AdvancedLargeDBExtension_Backup_${year}-${month}-${date}_${hour}h${minute}.json`;

                // Robust Exporting using Blob & URL.createObjectURL to support large database sizes cleanly
                const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json;charset=utf-8" });
                const downloadUrl = URL.createObjectURL(blob);

                var a = window.document.createElement('a');
                a.setAttribute('href', downloadUrl);
                a.setAttribute('download', filename);
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

            // Sort birthdays strictly ascending by date of birth (month first, then day)
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
            const currentMonth = now.getMonth(); // 0-indexed (0 is January, 11 is December)
            const currentYear = now.getFullYear();

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

                    // Calculate upcoming age
                    const ageNext = nextBday.getFullYear() - dob.getFullYear();

                    // Check if birthday is in the CURRENT calendar month
                    if (dob.getMonth() === currentMonth) {
                        upcomingList.push({
                            name: item.name,
                            nextAge: ageNext,
                            bdayFormatted: formatDate(item.date),
                            day: dob.getDate()
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

                // Display upcoming birthdays of CURRENT calendar month in alert banner
                const alertBanner = $('#upcoming-birthdays-alert');
                const alertListContainer = $('#upcoming-birthdays-list');
                alertListContainer.empty();

                if (upcomingList.length > 0) {
                    // Sort the upcoming list by day ascending
                    upcomingList.sort((a, b) => a.day - b.day);

                    alertBanner.show();
                    upcomingList.forEach(up => {
                        const isToday = up.day === now.getDate();
                        const whenText = isToday ? "hôm nay!" : `vào ngày ${up.day}/${currentMonth + 1}`;
                        const itemHtml = `<li><strong>${up.name}</strong> bước sang tuổi ${up.nextAge} <strong>${whenText}</strong></li>`;
                        alertListContainer.append(itemHtml);

                        // Trigger Chrome System Notification
                        if (window.chrome && chrome.notifications) {
                            chrome.notifications.create(`bday_${up.name}_month`, {
                                type: "basic",
                                iconUrl: "../images/icon.png",
                                title: "Sinh nhật trong tháng này!",
                                message: `${up.name} bước sang tuổi ${up.nextAge} vào ngày ${up.day}/${currentMonth + 1}.`,
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

    function resetTabForm() {
        editMode = false;
        editId = null;
        $('#custom-tab-edit-id').val('');
        $('#custom-tab-name').val('');
        $('#custom-tab-html').val('');
        $('#custom-tab-js').val('');
        $('#custom-tab-exec-trigger').val('both');
        $('#custom-tab-exec-context').val('activeTab');
        $('#custom-tab-form-title').text('Đăng ký Tab');
    }

    $('#btn-cancel-custom-tab').on('click', function(e) {
        e.preventDefault();
        resetTabForm();
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

            resetTabForm();

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
                // Scroll smoothly to form
                $('html, body').animate({
                    scrollTop: $("#custom-tab-form-card").offset().top
                }, 500);
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

    // Make global functions so helper tools can trigger reload
    window.refreshNotesList = refreshNotesList;
    window.refreshTabsList = refreshTabsList;
    window.refreshBirthdaysList = refreshBirthdaysList;

    // Load initial data
    refreshNotesList();
    refreshTabsList();
    refreshBirthdaysList();
    await loadMappings();
});
