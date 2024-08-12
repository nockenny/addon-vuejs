let sumData = []
let textWeek = ["Sun", "Mon", "Tue", "Web", "Thu", "Fri", "Sat"];

function checkInput(data, date, monthExpect) {
  let month = date.getMonth()
  if (month != monthExpect) {
    return false;
  }

  let fullFormat = date.toISOString().slice(0, 10)
  let dayOfWeek = date.getDay();
  let strDateOfWeek = textWeek[dayOfWeek]
  let now = new Date().toISOString().slice(0, 10);

  let totalTime = data[date.getDate()] ?? "0"

  // current date
  if (now == fullFormat) {
    console.log("%c" + fullFormat + " | " + strDateOfWeek + " | " + totalTime, "color:blue;")
  } else {
    if (["Sun", "Sat"].includes(strDateOfWeek)) {
      //console.log(fullFormat + " | " + strDateOfWeek + " | " + totalTime)
    } else if (totalTime == "0.00" || totalTime != "8.00") {
      let color = "color:darkgray;"
      if (now > fullFormat) {
        color = "color:red;"
      }
      console.log("%c" + fullFormat + " | " + strDateOfWeek + " | " + totalTime, color)
    }
  }
  date.setDate(date.getDate() + 1);
  checkInput(data, date, monthExpect);
}

function excute(url, date) {
  $.get(url, function(html, status) {
    var data = [];
    $('table.monthly_list tr', $(html)).each(function(i, e) {
        if (i == 0) return;
        var day = $('td:nth(0)', e).text();
        var hour = $('td:nth(2)', e).text();

        if (data[day] == undefined) {
            data[day] = 0;
        }
        data[day] = parseFloat(data[day]) + parseFloat(hour);
    })
    checkInput(data, date, date.getMonth())

    $.get(location.href, function(html, status) {})
  });
}

function summaryDate() {
  let currentDate = $('#date','body').val()
  let date = new Date(currentDate.substr(0, 4) + '-' + currentDate.substr(4, 2) + '-01');
  let url = "http://qc-portal.hdomain/sagyou/RV/monthlyRV/index/d:" + date.getTime().toString().substr(0, 10)

  excute(url, date)
}

function summaryMonth() {
  let date = new Date(parseFloat(location.href.substr(-10) + "000"));
  date.setDate(1)
  date.setMonth(date.getMonth() + 1)

  excute(location.href, date)
}

$(document).ready(function() {
  if ("qc-portal.hdomain" != location.host ) {
    return;
  }

  if (location.href.includes("http://qc-portal.hdomain/sagyou/RV/monthlyRV")) {
    //summaryMonth();
  }

  if (location.href.includes("http://qc-portal.hdomain/sagyou/RV/registerRV")) {
    summaryDate();
  }
});

