// Phân trang danh sách truyện. url: path (có thể có query string), page: số trang (rỗng = 1).
load("site.js");

function execute(url, page) {
  var pageNum = page ? parseInt(page, 10) : 1;

  var response = siteFetch(pageUrl(url, pageNum));
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tải được danh sách (HTTP " + response.status + ")");

  var doc = response.html();
  var items = parseList(doc);
  var next = items.length > 0 && hasPage(doc, pageNum + 1) ? "" + (pageNum + 1) : null;
  return Response.success(items, next);
}
