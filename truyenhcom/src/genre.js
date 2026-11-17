// Danh sách thể loại, lấy từ /js/tags-data.js của site: { id, slug: '...', name: '...', ... }.
load("site.js");

function execute() {
  var r = null;
  try { r = fetch(BASE + "/js/tags-data.js", { headers: HEADERS }); } catch (e) { r = null; }
  if (r == null) return Response.error("Không kết nối được tới trang");
  if (!r.ok) return Response.error("Không tải được danh sách thể loại (HTTP " + r.status + ")");

  var re = /slug:\s*'([^']+)',\s*name:\s*'([^']+)'/g;
  var text = "" + r.text();
  var result = [];
  var m;
  while ((m = re.exec(text)) != null) {
    result.push({ title: m[2], input: "tag=" + encodeURIComponent(m[1]), script: "list.js" });
  }
  return Response.success(result);
}
