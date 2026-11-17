// Mục lục. Trang truyện có sẵn trang 1 của danh sách chương; các trang sau lấy qua admin-ajax
// (type=pagination, không cần nonce), số trang ở input#total-page, id truyện ở input#id_post.
load("site.js");

function execute(url) {
  var response = siteFetch(url + "/");
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tải được mục lục (HTTP " + response.status + ")");
  var doc = response.html();

  var chapters = [];
  addChapters(chapters, doc.select("#list-chapter ul.list-chapter li a"));

  var postId = first(doc, "#id_post");
  var total = first(doc, "#total-page");
  var totalPages = total != null ? parseInt("" + total.attr("value"), 10) || 1 : 1;
  var postHeaders = { "User-Agent": HEADERS["User-Agent"], "Content-Type": "application/x-www-form-urlencoded" };
  for (var p = 2; postId != null && p <= totalPages; p++) {
    var r = siteFetch("/wp-admin/admin-ajax.php", {
      method: "POST",
      headers: postHeaders,
      body: { action: "tw_ajax", type: "pagination", id: "" + postId.attr("value"), page: "" + p },
    });
    if (r == null || !r.ok) return Response.error("Không tải được trang " + p + " của mục lục");
    var data = null;
    try { data = JSON.parse(r.text()); } catch (e) { data = null; }
    if (data == null || !data.list_chap) return Response.error("Trang " + p + " của mục lục không đúng định dạng");
    addChapters(chapters, Html.parse(data.list_chap).select("ul.list-chapter li a"));
  }
  return Response.success(chapters);
}

function addChapters(chapters, links) {
  for (var i = 0; i < links.size(); i++) {
    var a = links.get(i);
    var name = ("" + a.attr("title")).trim() || ("" + a.text()).trim();
    chapters.push({ name: name, url: BASE + toPath(a.attr("href")) });
  }
}
