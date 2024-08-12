var RKFeature = {
    data: {},
    init: function() {
        // Read it using the storage API
        chrome.storage.sync.get(['setting'], function(items) {
            RKFeature.data = items.setting;
            RKFeature.fillContent();
        });
    },
    add: function() {
        var ticket = $('#ticket', '#featureForm').val()
        var title = $('#title', '#featureForm').val()
        var feature = $('#feature', '#featureForm').val()
        var category = $('#category', '#featureForm').val()
        var featureData = new Feature(ticket, title, feature, category);

        chrome.storage.sync.get(["setting"], function(items) {
            if (items.setting == undefined) {
                items.setting = {};
            }
            items.setting[featureData.ticket] = featureData;
            chrome.storage.sync.set({"setting": items.setting}, function() {
                console.log('Settings saved');
                $('#import-feature-status').html('Đã thêm');
                RKFeature.init()
            });
        });
    },
    clean: function() {
        chrome.storage.sync.set({"setting": {}}, function() {
            RKFeature.data = {};
            console.log('Settings clean!!');
        });
    },
    read: function(title) {
        return Object.keys(RKFeature.data)
        .filter(function(ticketKey) {
            var feature = RKFeature.data[ticketKey]
            return feature.title == title;
        })
        .reduce(function (result, ticketKey) {
            return RKFeature.data[ticketKey];
        }, {});
    },
    fillContent: function() {
        // display status
        $('#import-feature-status').html('');
        var ticket = $('.contextual a.icon-edit:eq(0)');
        if (ticket.length > 0) {
            var hrf = ticket.attr('href').split("/")
            $('#ticket', '#featureForm').val(hrf[hrf.length - 2])
        }

        chrome.storage.sync.get(['setting'], function(items) {
            var ticket = $('#ticket', '#featureForm').val()
            if (items.setting && items.setting[ticket]) {
                $('#import-feature-status').html('Đã thêm');
                $('#ticket', '#featureForm').val(items.setting[ticket]['ticket'])
                $('#title', '#featureForm').val(items.setting[ticket]['title'])
                $('#feature', '#featureForm').val(items.setting[ticket]['featureName'])
                $('#category', '#featureForm').val(items.setting[ticket]['category'])
            } else {
                // fill content
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

                var regexCategory = /(\d+:[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han} ぁ-んァ-ンa-zA-Z_]+)/u;
                if (regexCategory.test($('body').html())) {
                    var categories = $('body').html().match(regexCategory);
                    if (categories.length >= 2) {
                        $('#category', '#featureForm').val(categories[1].trim())
                    }
                }
            }
        });
    }
}
