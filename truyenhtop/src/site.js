// Helper dùng chung cho mọi script (nạp bằng load("site.js")).
//
// truyenh.top là WordPress (theme boxtruyen), HTML render sẵn phía server, không cần cookie.
// - Danh sách (trang chủ, /category/*, /tag/*, /bang-xep-hang/?sort=*, tìm kiếm /?s=) cùng layout div.post-row,
//   20 truyện/trang, trang N là <path>page/N/<query>. Danh sách không có ảnh bìa.
// - Mục lục: trang truyện chỉ có trang 1 (28 chương); trang sau lấy qua
//   POST /wp-admin/admin-ajax.php action=tw_ajax&type=pagination&id=<id truyện>&page=N -> JSON { list_chap, pagination }.
// - Trang chương (*.html) bị Cloudflare challenge -> chap.js đọc bằng WebView (xem chap.js).

var BASE = "https://truyenh.top";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
};
var DEFAULT_COVER = BASE + "/wp-content/uploads/2024/08/icon.png";

// Tải một trang của site. `target` là path ("/tag/ntr/") hoặc URL đầy đủ (host bị bỏ, ghép với BASE).
// Body của Response chỉ đọc được MỘT lần, nên trả về wrapper giữ sẵn body. null nếu lỗi mạng.
function siteFetch(target, options) {
  var opts = options || {};
  if (!opts.headers) opts.headers = HEADERS;
  var r = null;
  try { r = fetch(BASE + toPath(target), opts); } catch (e) { r = null; }
  if (r == null) return null;
  var body = "";
  try { body = "" + r.text(); } catch (e2) { body = ""; }
  return {
    ok: r.ok,
    status: r.status,
    text: function () { return body; },
    html: function () { return Html.parse(body); },
  };
}

function toPath(target) {
  var t = "" + target;
  if (t.indexOf("http") == 0) t = t.replace(/^https?:\/\/[^\/?#]+/, "");
  if (t.indexOf("/") != 0) t = "/" + t;
  return t;
}

// Trên engine của app, Elements.first() KHÔNG trả về null khi rỗng -> luôn dùng hàm này.
function first(el, selector) {
  var els = el.select(selector);
  return els.size() > 0 ? els.get(0) : null;
}

// URL trang N của một danh sách: "/tag/ntr/" -> "/tag/ntr/page/2/", "/?s=abc" -> "/page/2/?s=abc".
function pageUrl(path, page) {
  if (page <= 1) return path;
  var q = "", i = path.indexOf("?");
  if (i >= 0) { q = path.substring(i); path = path.substring(0, i); }
  if (path.charAt(path.length - 1) != "/") path += "/";
  return path + "page/" + page + "/" + q;
}

// Danh sách truyện: div.post-row (tên, chương mới nhất), ngay sau là div#post-content-<id> (đoạn giới thiệu).
function parseList(doc) {
  var rows = doc.select("div.post-row");
  var result = [];
  for (var i = 0; i < rows.size(); i++) {
    var row = rows.get(i);
    var a = first(row, "h3 a");
    if (a == null) continue;
    var chap = first(row, ".col-chap");
    var desc = first(doc, "#post-content-" + row.attr("data-post-id") + " > p");
    var parts = [];
    if (chap != null && ("" + chap.text()).trim()) parts.push(("" + chap.text()).trim());
    if (desc != null && ("" + desc.text()).trim()) parts.push(("" + desc.text()).trim().substring(0, 200));
    result.push({
      name: ("" + a.text()).trim(),
      link: BASE + toPath(a.attr("href")),
      cover: DEFAULT_COVER,
      description: parts.join(" - "),
    });
  }
  return result;
}

// Còn trang sau khi phân trang có link tới trang page + 1.
function hasPage(doc, page) {
  return doc.select("ul.pagination a[data-page=" + page + "]").size() > 0;
}
