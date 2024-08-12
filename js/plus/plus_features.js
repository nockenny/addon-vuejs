const KEY_EX = 'kadou';
const KEY_SETTING_FEATURES = 'features';

function addFeature() {
    var ticket = $('#ticket', '#featureForm').val()
    var title = $('#title', '#featureForm').val()
    var feature = $('#feature', '#featureForm').val()
    var featureData = new Feature(ticket, title, feature);

    chrome.storage.sync.get(["setting"], function(items) {
        if (items.setting == undefined) {
            items.setting = {};
        }
        items.setting[featureData.ticket] = featureData;
        chrome.storage.sync.set({"setting": items.setting}, function() {
            console.log('Settings saved');
            $('#import-feature-status').html('Đã thêm');
        });
    });
}


var settingsFeatures = {}

function loadFeatures() {
    // Read it using the storage API
    chrome.storage.sync.get(['setting'], function(items) {
        settingsFeatures = items.setting;
    });
}

function cleanFeatures() {
    chrome.storage.sync.set({"setting": {}}, function() {
        console.log('Settings clean!!');
    });
}

function displayStatus() {
    $('#import-feature-status').html('');
    chrome.storage.sync.get(['setting'], function(items) {
        var ticket = $('#ticket', '#featureForm').val()
        if (items.setting[ticket]) {
            $('#import-feature-status').html('Đã thêm');
        }
    });
}

function fillData() {
    var ticket = $('.contextual a.icon-edit:eq(0)');
    if (ticket.length > 0) {
        var hrf = ticket.attr('href').split("/")
        $('#ticket', '#featureForm').val(hrf[hrf.length - 2])
    }

    var title = $('.subject h3', 'body');
    if (title.length > 0) {
        $('#title', '#featureForm').val(title.html().trim())
    }

    if (/機能：(.*?)($|<)/.test($('body').html())) {
        var featureNames = $('body').html().match(/機能：(.*?)($|<)/);
        if (featureNames.length >= 2) {
            $('#feature', '#featureForm').val(featureNames[1])
        }
    }
}

function getFeature(title) {
    return Object.keys(settingsFeatures)
        .filter(function(ticketKey) {
            var feature = settingsFeatures[ticketKey]
            return feature.title == title;
        })
        .reduce(function (result, ticketKey) {
            return settingsFeatures[ticketKey];
        }, {});
}


var ticketsSkip = [];
var notMap = [];
var statusSkip = ["終了"];

function getPage(ticket) {
    var url = "https://cl-redmine02.ssl.mdomain/redmine/issues/" + ticket;
    $.ajax({
        url: url, 
        async: false,
        success: function(html) {
            if (isFinish(html)) {
                ticketsSkip.push(ticket);
                return false;
            }

            var title = $('.subject h3', $(html)).html();
            var featureNames = html.match(/機能：(.*?)($|<)/);

            if (featureNames) {
                localStorage.setItem(ticket, new Feature(ticket, title, featureNames[1]));
                //localStorage.setItem(titles[1], new Feature(tickets[1], titles[1], featureNames[1]));
            } else {
                var obj = new Feature(ticket, title, null);
                notMap.push({ticket: JSON.stringify(obj)});
            }
        }
    });
}

function isFinish(html) {
    var status = $('.value', $('div.status.attribute', $(html))).html();
    return statusSkip.includes(status);
}


function getMaxIssue() {
    var url = "https://cl-redmine02.ssl.mdomain/redmine/issues";
    var max = 0;
    $.ajax({
        url: url,
        async: false,
        success: function(html) {
        max = $('tbody tr:eq(0) td.id a' , $('table.list.issues', $(html))).html();
    }});
    return max;
}

function allFeatures() {
    ticketsSkip = [];
    var max = getMaxIssue();

    for (var i = 36119; i < max; i++) {
        getPage(i);
    }
    console.log("==== skip: " + ticketsSkip);
    console.log("==== not: " + notMap);
}

