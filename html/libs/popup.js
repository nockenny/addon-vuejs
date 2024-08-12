function Mapping(name, colDes, colData) {
    this.name = name;
    this.colDes = colDes - 1;
    this.colData = colData - 1;
}

$(document).ready(function() {
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

	document.getElementById('fnImportSetting').addEventListener('click', () => {
		var file = document.getElementById("importSetting").files[0];
		if (file) {
		    var reader = new FileReader();
		    reader.readAsText(file, "UTF-8");
		    reader.onload = function (evt) {
		    	var jsonData = JSON.parse(evt.target.result);
		    	
				
				
				chrome.storage.sync.set({"RKSetings": jsonData.RKSetings}, function() {
	                alert('Settings saved');
	            });
		    };
		    reader.onerror = function (evt) {
		        alert("error reading file");
		    }
		} else {
			alert("Select file settings");
		}
	});

	document.getElementById('fnExportSetting').addEventListener('click', () => {
		chrome.storage.sync.get(['RKSetings'], function(items) {
            var universalBOM = "\uFEFF";
            var a = window.document.createElement('a');
            a.setAttribute('href', 'data:text/csv; charset=utf-8,' + encodeURIComponent(universalBOM+JSON.stringify(items)));
            a.setAttribute('download', 'exportSetting.json');
            window.document.body.appendChild(a);
            a.click();
        });
	});
})
