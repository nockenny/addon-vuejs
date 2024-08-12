function summaryTimes() {
  // Lấy tất cả các hàng trong bảng, bỏ qua hàng đầu tiên (tiêu đề)
  var rows = document.querySelectorAll(".monthly_list tr:not(:first-child)");

  // Tạo một mảng để lưu trữ các đối tượng, mỗi đối tượng chứa thông tin về 機能, 工程 và tổng thời gian tương ứng
  var data = [];

  // Duyệt qua từng hàng
  for (var i = 0; i < rows.length; i++) {
      // Lấy giá trị của cột 時間(H), 機能 và 工程
      var time = parseFloat(rows[i].children[2].innerText);
      var function_ = rows[i].children[5].innerText;
      var process = rows[i].children[6].innerText;

      // Tìm đối tượng trong mảng data có 機能 và 工程 tương ứng
      var obj = data.find(o => o.function_ === function_ && o.process === process);

      // Nếu không tìm thấy đối tượng, tạo mới và thêm vào mảng data
      if (!obj) {
          obj = { function_: function_, process: process, total: 0 };
          data.push(obj);
      }

      // Cộng dồn thời gian vào tổng thời gian của đối tượng tương ứng
      obj.total += time;
  }

  // Sắp xếp dữ liệu theo function_
  data.sort((a, b) => a.function_.localeCompare(b.function_));

  // In ra dữ liệu theo dạng bảng
  console.table(data);
}

$(document).ready(function() {
  if ("qc-portal.hdomain" != location.host ) {
    return;
  }

  if (location.href.includes("http://qc-portal.hdomain/sagyou/RV/monthlyRV")) {
    summaryTimes();
  }
});

