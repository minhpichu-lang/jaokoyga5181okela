// Tìm kiếm: /?s=<key>, trang N: /page/N/?s=<key> (cùng layout với danh sách).
load("site.js");

function execute(key, page) {
  var pageNum = page ? parseInt(page, 10) : 1;

  var response = siteFetch(pageUrl("/?s=" + encodeURIComponent(key), pageNum));
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tìm kiếm được (HTTP " + response.status + ")");

  var doc = response.html();
  var items = parseList(doc);
  var next = items.length > 0 && hasPage(doc, pageNum + 1) ? "" + (pageNum + 1) : null;
  return Response.success(items, next);
}
