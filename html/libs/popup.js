function Mapping(name, colDes, colData) {
    this.name = name;
    this.colDes = colDes - 1;
    this.colData = colData - 1;
}

// --- Floating non-blocking Toast notification helper ---
function showToast(message, type = "info") {
    const container = $('#toast-container');
    if (container.length === 0) return;

    // Map types to bootstrap alert classes
    let bgClass = "alert-info";
    let icon = "fa-info-circle";
    if (type === "success") {
        bgClass = "alert-success";
        icon = "fa-check-circle";
    } else if (type === "danger" || type === "error") {
        bgClass = "alert-danger";
        icon = "fa-exclamation-triangle";
    } else if (type === "warning") {
        bgClass = "alert-warning";
        icon = "fa-exclamation-circle";
    }

    const toastId = "toast_" + Date.now() + Math.floor(Math.random() * 100);
    const toastHtml = `
        <div id="${toastId}" class="alert ${bgClass} shadow-sm d-flex align-items-center mb-2" style="display: none; border-left: 5px solid; border-radius: 4px;">
            <i class="fa ${icon} mr-2" style="font-size: 18px;"></i>
            <div style="flex-grow: 1; font-size: 13.5px; line-height: 1.3;">${message}</div>
            <button type="button" class="close ml-2" style="font-size: 16px; line-height: 1;" onclick="$(this).parent().fadeOut(200, function(){ $(this).remove(); });">&times;</button>
        </div>
    `;

    container.append(toastHtml);
    const element = $(`#${toastId}`);
    element.fadeIn(300);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
        element.fadeOut(300, function() {
            $(this).remove();
        });
    }, 3500);
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
                showToast('Lưu cấu hình thành công!', 'success');
            } catch (err) {
                showToast("Lỗi lưu cấu hình: " + err.message, 'danger');
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
            showToast("Vui lòng kéo thả hoặc chọn tệp tin sao lưu (.json) trước!", "warning");
            return;
        }
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = async function (evt) {
            try {
                var backupData = JSON.parse(evt.target.result);

                // Determine target DB object to compute counts
                let dbData = backupData.indexedDBBackup ? backupData.indexedDBBackup : backupData;

                // --- 3. XSS Shield & Security Scan ---
                let detectedTabsWithJs = [];
                if (dbData.custom_tabs && Array.isArray(dbData.custom_tabs)) {
                    dbData.custom_tabs.forEach(tab => {
                        if (tab.js && tab.js.trim().length > 0) {
                            detectedTabsWithJs.push(tab.name);
                        }
                    });
                }

                if (detectedTabsWithJs.length > 0) {
                    const isConfirmed = confirm(
                        `⚠️ CẢNH BÁO BẢO MẬT (XSS SHIELD):\n\n` +
                        `Tệp tin sao lưu này chứa các đoạn mã JavaScript tự định nghĩa trong các Tab sau:\n` +
                        `- ${detectedTabsWithJs.join('\n- ')}\n\n` +
                        `Việc thực thi mã JavaScript từ một nguồn không tin cậy có thể gây mất an toàn thông tin (Self-XSS).\n` +
                        `Bạn có chắc chắn rằng bạn tin tưởng tệp tin sao lưu này và muốn tiếp tục khôi phục không?`
                    );
                    if (!isConfirmed) {
                        showToast("Đã hủy quá trình khôi phục dữ liệu để bảo vệ an toàn!", "info");
                        fileInput.val('');
                        fileInfo.addClass('d-none');
                        return;
                    }
                }

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

                // Display statistics details inside success toast
                showToast(`Khôi phục thành công: ${tabCount} Tab tùy biến, ${noteCount} Ghi chú nhắc nhở, ${bdayCount} thông tin Sinh nhật và cấu hình cài đặt (${settingCount} cài đặt)!`, "success");

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
                showToast("Lỗi phân tích file sao lưu: " + e.message, "danger");
            }
        };
        reader.onerror = function (evt) {
            showToast("Lỗi đọc file sao lưu.", "danger");
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

            const now = new Date();
            const currentYear = now.getFullYear();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

            // Helper to calculate exact countdown days until next birthday
            function getDaysUntilNextBirthday(dobString) {
                const dob = new Date(dobString);
                let nextBday = new Date(currentYear, dob.getMonth(), dob.getDate());

                // If the birthday has already passed this calendar year, look at next year
                if (nextBday.getTime() < todayStart) {
                    nextBday.setFullYear(currentYear + 1);
                }

                const diffTime = nextBday.getTime() - todayStart;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays;
            }

            // Sort birthdays strictly by days remaining until their next birthday (ascending)
            list.sort((a, b) => {
                return getDaysUntilNextBirthday(a.date) - getDaysUntilNextBirthday(b.date);
            });

            const tbody = $('#birthdays-tbody');
            tbody.empty();

            const currentMonth = now.getMonth(); // 0-indexed (0 is January, 11 is December)
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

                    // Days countdown formatting
                    const daysRemaining = getDaysUntilNextBirthday(item.date);
                    let countdownBadge = "";
                    if (daysRemaining === 0) {
                        countdownBadge = '<span class="badge badge-danger p-2"><i class="fa fa-gift"></i> Hôm nay! 🎉</span>';
                    } else if (daysRemaining === 1) {
                        countdownBadge = '<span class="badge badge-warning p-2">Ngày mai! ⭐</span>';
                    } else {
                        countdownBadge = `<span class="badge badge-info p-2">Còn ${daysRemaining} ngày</span>`;
                    }

                    // Check if birthday is in the CURRENT calendar month
                    if (dob.getMonth() === currentMonth) {
                        upcomingList.push({
                            name: item.name,
                            nextAge: ageNext,
                            bdayFormatted: formatDate(item.date),
                            day: dob.getDate(),
                            daysRemaining: daysRemaining
                        });
                    }

                    const rowHtml = `
                        <tr>
                            <td><strong>${item.name}</strong></td>
                            <td>${formatDate(item.date)}</td>
                            <td>${ageNext} tuổi (vào ngày ${dob.getDate()}/${dob.getMonth() + 1})</td>
                            <td>${countdownBadge}</td>
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
            showToast("Thêm sinh nhật mới thành công!", "success");
        } catch (err) {
            showToast("Lỗi thêm sinh nhật: " + err.message, "danger");
        }
    });

    // Delete Birthday trigger
    $(document).on('click', '.btn-delete-birthday', async function() {
        const id = $(this).data('id');
        if (confirm("Bạn có muốn xóa người này khỏi danh sách sinh nhật không?")) {
            try {
                await deleteBirthday(Number(id));
                await refreshBirthdaysList();
                showToast("Đã xóa sinh nhật khỏi danh sách!", "success");
            } catch (err) {
                showToast("Lỗi xóa: " + err.message, "danger");
            }
        }
    });


    // --- 1. Notes & Reminders Logic ---
    async function refreshNotesList() {
        try {
            const notes = await getAllNotes();

            // Sort: pending notes first, completed notes last
            notes.sort((a, b) => {
                const aDone = a.status === 'done' ? 1 : 0;
                const bDone = b.status === 'done' ? 1 : 0;
                if (aDone !== bDone) return aDone - bDone;
                return b.createdAt - a.createdAt;
            });

            const container = $('#notes-list-container');
            container.empty();

            if (notes.length === 0) {
                $('#notes-list-empty').show();
            } else {
                $('#notes-list-empty').hide();
                notes.forEach(note => {
                    const isAlerted = note.reminderTime && note.status === 'alerted';
                    const isDone = note.status === 'done';

                    const noteHtml = `
                        <div class="note-item ${isAlerted ? 'alerted' : ''} ${isDone ? 'bg-light border-secondary text-muted' : ''}" data-id="${note.id}">
                            <div class="d-flex justify-content-between align-items-start">
                                <div style="flex-grow: 1;">
                                    <p class="mb-1" style="font-size: 15px; word-break: break-word; ${isDone ? 'text-decoration: line-through;' : ''}">
                                        ${note.text}
                                    </p>
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
                                <div class="d-flex align-items-center">
                                    <button type="button" class="btn ${isDone ? 'btn-success' : 'btn-outline-secondary'} btn-sm mr-2 btn-toggle-note-status" data-id="${note.id}" title="${isDone ? 'Mở lại ghi chú' : 'Đánh dấu hoàn thành'}">
                                        <i class="fa ${isDone ? 'fa-check-square-o' : 'fa-square-o'}"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-danger btn-sm btn-delete-note" data-id="${note.id}">
                                        <i class="fa fa-trash"></i>
                                    </button>
                                </div>
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

    // Toggle note status between pending and done
    $(document).on('click', '.btn-toggle-note-status', async function() {
        const id = $(this).data('id');
        try {
            const notes = await getAllNotes();
            const note = notes.find(n => n.id === Number(id));
            if (note) {
                note.status = note.status === 'done' ? 'pending' : 'done';
                await updateNote(note);
                await refreshNotesList();
                showToast(note.status === 'done' ? "Đã đánh dấu hoàn thành công việc!" : "Đã mở lại ghi chú công việc!", "success");
            }
        } catch (err) {
            showToast("Lỗi cập nhật trạng thái: " + err.message, "danger");
        }
    });

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
            showToast("Thêm ghi chú mới thành công!", "success");
        } catch (err) {
            showToast("Lỗi lưu ghi chú: " + err.message, "danger");
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
                showToast("Đã xóa ghi chú thành công!", "success");
            } catch (err) {
                showToast("Lỗi xóa: " + err.message, "danger");
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

    // --- Auto Format & Check Syntax for Custom JS/HTML ---
    $('#btn-format-js').on('click', function(e) {
        e.preventDefault();
        const jsTextarea = $('#custom-tab-js');
        const jsVal = jsTextarea.val().trim();
        const htmlTextarea = $('#custom-tab-html');
        const htmlVal = htmlTextarea.val().trim();

        if (jsVal) {
            // Basic custom beautifier for custom code indentation
            let indentedJs = "";
            let level = 0;
            const lines = jsVal.split('\n');
            lines.forEach(line => {
                let trimmed = line.trim();
                if (trimmed.startsWith('}') || trimmed.startsWith(']')) level = Math.max(0, level - 1);
                indentedJs += "    ".repeat(level) + trimmed + "\n";
                if (trimmed.endsWith('{') || trimmed.endsWith('[')) level++;
            });
            jsTextarea.val(indentedJs.trim());
        }

        if (htmlVal) {
            let indentedHtml = "";
            let level = 0;
            const lines = htmlVal.split('\n');
            lines.forEach(line => {
                let trimmed = line.trim();
                if (trimmed.startsWith('</')) level = Math.max(0, level - 1);
                indentedHtml += "    ".repeat(level) + trimmed + "\n";
                if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
                    if (!trimmed.startsWith('<input') && !trimmed.startsWith('<img') && !trimmed.startsWith('<br') && !trimmed.startsWith('<hr')) {
                        level++;
                    }
                }
            });
            htmlTextarea.val(indentedHtml.trim());
        }

        showToast("Định dạng mã thành công!", "success");
    });

    $('#btn-check-syntax-js').on('click', function(e) {
        e.preventDefault();
        const jsVal = $('#custom-tab-js').val().trim();
        if (!jsVal) {
            showToast("Vui lòng nhập code JavaScript trước khi kiểm tra!", "warning");
            return;
        }
        try {
            // Fast check syntax using native Function constructor
            new Function(jsVal);
            showToast("Cú pháp JavaScript hoàn toàn hợp lệ!", "success");
        } catch (err) {
            showToast(`Lỗi cú pháp: ${err.message}`, "danger");
        }
    });

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
                showToast("Cập nhật Tab thành công!", "success");
            } else {
                await addCustomTab(tabData);
                showToast("Đăng ký Tab mới thành công!", "success");
            }

            resetTabForm();

            await refreshTabsList();
            if (window.renderDynamicTabs) {
                await window.renderDynamicTabs();
            }
        } catch (err) {
            showToast("Lỗi lưu Tab: " + err.message, "danger");
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
            showToast("Lỗi tải thông tin tab: " + err.message, "danger");
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
                showToast("Đã xóa tab thành công!", "success");
            } catch (err) {
                showToast("Lỗi xóa tab: " + err.message, "danger");
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
