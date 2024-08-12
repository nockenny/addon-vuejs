var RKAPI = {
  downloadFileName: function() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    // Pad the numbers with leading zeros
    const paddedMonth = month.toString().padStart(2, "0");
    const paddedDay = day.toString().padStart(2, "0");
    const paddedHours = hours.toString().padStart(2, "0");
    const paddedMinutes = minutes.toString().padStart(2, "0");
    const paddedSeconds = seconds.toString().padStart(2, "0");


    const branch = 'api'

    // Create the formatted date string
    return `${branch}_${year}${paddedMonth}${paddedDay}${paddedHours}${paddedMinutes}${paddedSeconds}`;
  },
  download: function(data) {
    //const csvString = data.join('\r\n')
    const csvString = data.map(row =>
        Object.values(row)
        .map(String)  // convert every value to String
        .map(v => v.trim().replaceAll('"', '""'))  // escape double quotes
        .map(v => `"${v}"`)  // quote it
        .join(',')  // comma-separated
    ).join('\r\n');  // rows starting on new lines



    var universalBOM = "\uFEFF";
    var a = window.document.createElement('a');
    a.setAttribute('href', 'data:text/csv; charset=utf-8,' + encodeURIComponent(universalBOM+csvString));
    a.setAttribute('download', RKAPI.downloadFileName() + '.csv');
    window.document.body.appendChild(a);
    a.click();
  },
  api: function() {
    var data = [];
    $('div.api-content div.sc-dcJsrY.cqVkUp').each(function (i, e) {
      var title = $("h2.sc-jXbUNg.fWnwAh", e).text();
      var method = $("span.sc-dlWCHZ.http-verb", e).text();
      var url = $("span.sc-EgOXT.fVtHyw", e).text();

      obj = {API: title, METHOD: method.toUpperCase(), URL: url};
      data.push(obj);
    });

    RKAPI.download(data);
  }
}

