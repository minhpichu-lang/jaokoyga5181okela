// Danh sách thể loại, lấy từ menu "Thể loại" ở đầu trang (link /tag/<slug>/).
load("site.js");

function execute() {
  var response = siteFetch("/");
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tải được danh sách thể loại (HTTP " + response.status + ")");

  var links = response.html().select(".dropdown-menu a[href*='/tag/']");
  var result = [];
  var seen = {};
  for (var i = 0; i < links.size(); i++) {
    var path = toPath(links.get(i).attr("href"));
    if (seen[path]) continue;
    seen[path] = true;
    result.push({ title: ("" + links.get(i).text()).trim(), input: path, script: "list.js" });
  }
  return Response.success(result);
}
