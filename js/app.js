let RKApp = {
    initEvents: function() {
        $('.btn-import').click(function() {
            $('.import').toggleClass("hidden");
        });
    },
    flags: {
        rowEmpty: 1,
    },
    findRowEmpty: function() {
        var isEmpty;
        do {
            isEmpty = true;
            $('td input', 'table tr:eq(' + RKApp.flags.rowEmpty + ')').each(function(i, e) {
                if ($(e).val() != "" && $(e).val() != "0.00") {
                    RKApp.flags.rowEmpty++;
                    isEmpty = false;
                    return false; // break;
                }
            })
        } while(!isEmpty)
    },
    readRow: function(row) {
        let cols = row.split('\t');
        RKApp.fillCols(cols)
    },
    fillCols: function(cols) {
        RKApp.findRowEmpty();
        let feature = RKFeature.read(cols[3]);

        if (feature.category == undefined ) {
            RKApp.fillCategory(312)
        } else {
            RKApp.fillCategory(feature.category.split(":")[0])
        }

        RKSettings.mapdata.forEach(function(map) {
            let col = map.colDes;
            let data = cols[map.colData];
            let name = map.name;
            let cell = $('td:eq(' +  col + ')', 'tr:eq(' + RKApp.flags.rowEmpty + ')');

            switch(name) {
                case "hour":
                    RKApp.actionElement($('input', cell), data)
                    break;
                case "comment":
                    $('input', cell).val(feature.ticket + "／" + data);
                    break;
                case "function":
                    {
                        let tryNumberFunction = 0;
                        let timerFunction = setInterval(() => {
                            tryNumberFunction++;
                            if (tryNumberFunction >= 5) { //1000ms
                                clearInterval(timerFunction)
                            }
                            if (!$('select', cell).is(':disabled')) {
                                // kiem tra fuction ton tai
                                let option = "select option:contains('" + feature.featureName + "')";
                                if ($(option, cell).length > 0) {
                                    let valueOption = $(option, cell).val();
                                    RKApp.actionElement($('select', cell), valueOption)
                                    RKApp.activeNextElement(col)
                                }
                                clearInterval(timerFunction)
                            }
                        }, 100);
                    }
                    break;
                case "phase":
                    {
                        let tryNumberPhase = 0;
                        let timerPhase = setInterval(() => {
                            tryNumberPhase++;
                            if (tryNumberPhase >= 10) { //1000ms
                                clearInterval(tryNumberPhase)
                            }
                            if (!$('select', cell).is(':disabled') && $('select', cell).attr('entered')) {
                                let option = "select option:contains('" + data + "')";
                                let options = $(option, cell);
                                if (options.length == 1) {
                                    RKApp.actionElement($('select', cell), options.val())
                                }
                                clearInterval(timerPhase)
                            }
                            console.log("phase" + tryNumberPhase);
                        }, 100);
                    }
                    break;
            }
        });
    },
    actionElement: function(element, value) {
        element.val(value)
        element.get(0).dispatchEvent(new Event('change'));
    },
    activeNextElement: function(col) {
        let element = $('td:eq(' +  (col + 1) + ')', 'tr:eq(' + RKApp.flags.rowEmpty + ')');
        let select = $('select', element);
        select.attr('entered', true);
    },
    fillCategory: function(categoryNumber) {
        let cell = $('td:eq(0)', 'tr:eq(' + RKApp.flags.rowEmpty + ')');
        RKApp.actionElement($('select', cell), categoryNumber)
    },
    execute: function () {
        let contentData = $('#valueContainer').val();
        let rows = contentData.split('\n');

        async function fillRows() {
            for (let i = 0; i < rows.length ; i++) {
                RKApp.readRow(rows[i]);
                await RKApp.sleep(600);
            }
        }
        fillRows()

        // close content
        $('.btn-import').trigger('click');
        $('#valueContainer').val("")
    },
    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

$(document).ready(function() {
    //RKFeature.init()
    //RKFeature.fillContent();
    //RKUI.init();
    //RKUI.displayButton();
    //RKApp.initEvents();
});
