document.addEventListener('DOMContentLoaded', async function() {
    // Tab 1: Default Profile Vue instance
    var a = new Vue({
        el: '#birthdayData',
        render(h) {
            const vm = this;
            const tableRows = vm.items.map(row =>
                h('tr', [
                    h('td', row.col1),
                    h('td', row.col2),
                    h('td', row.col3),
                    h('td', row.col4),
                ])
            );

            return h('table', {"class": "table table-bordered table-hover"}, [
                h('thead', [
                    h('tr', [
                        h('th', 'Cột 1'),
                        h('th', 'Cột 2'),
                        h('th', 'Cột 3'),
                        h('th', 'Cột 4'),
                    ])
                ]),
                h('tbody', tableRows)
            ]);
        },
        data: {
            items: [
                { col1: 'Dữ liệu 1', col2: 'Dữ liệu 2', col3: 'Dữ liệu 3', col4: 'Dữ liệu 3'},
                { col1: 'Dữ liệu 4', col2: 'Dữ liệu 5', col3: 'Dữ liệu 6', col4: 'Dữ liệu 3'},
                { col1: 'Dữ liệu 7', col2: 'Dữ liệu 8', col3: 'Dữ liệu 9', col4: 'Dữ liệu 3'}
            ]
        },
    });

    // Tab 2: Add Feature original Vue instance (for legacy compatibility)
    var addFeature = new Vue({
        el: '#vue-import-feature',
        data: {
            formFields: [
                {name: 'category'},
                {name: 'ticket'},
                {name: 'title'},
                {name: 'feature'}
            ],
            checkbox: { id: 'gridCheck', label: 'Remember' },
            alert: { message: 'Success!', class: 'alert-success' }
        },
        render(h) {
            const vm = this;

            const formElements = vm.formFields.map(field =>
                h('div', { class: 'col-md-12' }, [
                    h('div', { class: 'form-group' }, [
                        h('input', {
                            attrs: {
                                type: "text",
                                id: field.name,
                                placeholder: field.name
                            },
                            class: "form-control"
                        })
                    ])
                ])
            );

            const checkboxElement = h('div', { class: 'col-md-12' }, [
                h('div', { class: 'form-group' }, [
                    h('div', { class: 'form-check' }, [
                        h('input', {
                            attrs: { type: 'checkbox', id: vm.checkbox.id },
                            class: 'form-check-input'
                        }),
                        h('label', {
                            attrs: { for: vm.checkbox.id },
                            class: 'form-check-label'
                        }, vm.checkbox.label)
                    ])
                ])
            ]);

            const buttonElement = h('div', { class: 'col-md-3' }, [
                h('button', { class: 'btn btn-primary' }, [
                    h('i', { class: 'fa fa-save' })
                ])
            ]);

            const alertElement = h('div', {
                class: `alert ${vm.alert.class} alert-dismissible col-md-5`,
                attrs: { role: 'alert' },
                style: { padding: '6px', margin: '0' }
            }, [
                h('button', {
                    class: 'close',
                    attrs: { type: 'button', 'data-dismiss': 'alert', 'aria-label': 'Close' },
                    style: { padding: '5px' }
                }, [
                    h('span', { attrs: { 'aria-hidden': 'true' } }, 'x')
                ]),
                h('strong', vm.alert.message)
            ]);

            return h('div', { class: 'row' }, [
                ...formElements,
                checkboxElement,
                h('div', { class: 'row' }, [
                    buttonElement,
                    alertElement
                ])
            ]);
        }
    });

    // Mapping original Vue instance
    var mapQC = new Vue({
        el: '#vue-map-qc',
        data: {
            formFields: [
                { label: 'Comment', idResource: 'comment-resource', placeholderResource: 'Excel', idDes: 'comment-des', placeholderDes: 'QC' },
                { label: 'Function', idResource: 'function-resource', placeholderResource: 'Excel', idDes: 'function-des', placeholderDes: 'QC' },
                { label: 'Hour', idResource: 'hour-resource', placeholderResource: 'Excel', idDes: 'hour-des', placeholderDes: 'QC' },
                { label: 'Phase', idResource: 'phase-resource', placeholderResource: 'Excel', idDes: 'phase-des', placeholderDes: 'QC' }
            ]
        },
        render(h) {
            const vm = this;

            // Tạo các hàng cho từng trường
            const rows = vm.formFields.map(field =>
                h('div', { class: 'row mb-3' }, [
                    h('label', { class: 'col-sm-4 col-form-label' }, field.label),
                    h('div', { class: 'col-sm-3' }, [
                        h('input', {
                            attrs: { id: field.idResource, placeholder: field.placeholderResource },
                            class: 'form-control'
                        })
                    ]),
                    h('div', { class: 'col-sm-3' }, [
                        h('input', {
                            attrs: { id: field.idDes, placeholder: field.placeholderDes },
                            class: 'form-control'
                        })
                    ])
                ])
            );

            // Nút lưu
            const saveButton = h('button', {
                class: 'btn btn-primary',
                attrs: { type: 'button', id: 'fnSaveMapping' }
            }, [
                h('i', { class: 'fa fa-save' })
            ]);

            return h('div', [ ...rows, saveButton ]);
        }
    });

    // --- Dynamic User Tabs loader & builder ---
    window.renderDynamicTabs = async function() {
        const customTabs = await getAllCustomTabs();

        // Remove existing custom tab buttons & contents
        $('.custom-dyn-tab').remove();

        customTabs.forEach(tab => {
            const tabId = `custom-tab-${tab.id}`;

            // Append nav link button to navigation tablist
            const tabBtnHtml = `
                <li class="nav-item custom-dyn-tab" role="presentation">
                  <button class="nav-link" id="${tabId}-tab" data-toggle="tab" data-target="#${tabId}" type="button" role="tab" aria-controls="${tabId}" aria-selected="false">${tab.name}</button>
                </li>
            `;
            // Insert custom tab right before settings tab
            $('#setting-tab').parent().before(tabBtnHtml);

            // Construct content section
            const tabContentHtml = `
                <div class="tab-pane fade custom-dyn-tab" id="${tabId}" role="tabpanel" aria-labelledby="${tabId}-tab">
                    <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <h4>${tab.name}</h4>
                        <div class="actions">
                            ${(tab.execTrigger === 'both' || tab.execTrigger === 'manual') ?
                              `<button class="btn btn-sm btn-primary btn-run-custom-js" data-id="${tab.id}"><i class="fa fa-play"></i> Thực thi (Run)</button>` : ''}
                        </div>
                    </div>
                    <div class="tab-custom-html-container">${tab.html || '<p class="text-muted">Tab này chưa có mã HTML hiển thị.</p>'}</div>
                </div>
            `;
            $('#myTabContent').append(tabContentHtml);

            // Setup Tab selection events
            document.getElementById(`${tabId}-tab`).addEventListener('shown.bs.tab', function (e) {
                if (tab.execTrigger === 'both' || tab.execTrigger === 'auto') {
                    executeCustomTabJS(tab);
                }
            });
        });

        // Delegate run click button events
        $(document).off('click', '.btn-run-custom-js').on('click', '.btn-run-custom-js', async function() {
            const tabId = $(this).data('id');
            const customTabs = await getAllCustomTabs();
            const tab = customTabs.find(t => t.id === tabId);
            if (tab) {
                executeCustomTabJS(tab);
            }
        });
    };

    // Evaluator for User-defined JS
    async function executeCustomTabJS(tab) {
        if (!tab.js || tab.js.trim() === "") return;

        if (tab.execContext === "popup") {
            try {
                // Warning note about MV3 restrictions on unsafe-eval
                console.warn("Lưu ý: Manifest V3 chặn việc thực thi eval/new Function trực tiếp trong Popup. Khuyến khích chọn ngữ cảnh 'Nhúng vào trang Web' để thực thi đầy đủ.");
                // Execute directly in context of extension popup if allowed, otherwise fail gracefully with instructions
                const run = new Function(tab.js);
                run();
            } catch (err) {
                alert(`Lưu ý bảo mật Manifest V3:\nKhông thể thực thi mã eval/new Function tùy ý trực tiếp trong ngữ cảnh Popup Extension do rào cản CSP của Chrome.\n\nHướng dẫn: Hãy mở 'Quản lý Tab' -> Chỉnh sửa -> Chọn ngữ cảnh là 'Nhúng vào trang Web hiện tại (Active Page Content)'.`);
                console.error(err);
            }
        } else if (tab.execContext === "activeTab") {
            // Script scripting to inject in Web Active page
            if (window.chrome && chrome.tabs && chrome.scripting) {
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!activeTab) {
                    alert("Không tìm thấy tab web hiện tại để thực thi!");
                    return;
                }

                try {
                    chrome.scripting.executeScript({
                        target: { tabId: activeTab.id },
                        func: (codeToExec) => {
                            try {
                                const run = new Function(codeToExec);
                                run();
                            } catch (err) {
                                alert("Lỗi thực thi Script: " + err.message);
                            }
                        },
                        args: [tab.js]
                    });
                } catch (err) {
                    alert(`Lỗi nhúng script: ${err.message}`);
                    console.error(err);
                }
            } else {
                console.log("Mock Environment: Script executed on mock tab:", tab.js);
            }
        }
    }

    // Call dynamic render on initiation
    await window.renderDynamicTabs();
});
