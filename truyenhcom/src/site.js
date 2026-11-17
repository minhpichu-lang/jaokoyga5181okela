// Helper dùng chung cho mọi script (nạp bằng load("site.js")).
//
// truyen-h.com là SPA trên Cloudflare, dữ liệu lấy qua JSON API (không cần cookie):
// - GET /api/stories?page=N&limit=L[&sort=views|chapters][&tag=<slug>][&q=<từ khóa>] -> { data: [truyện], pagination: { totalPages } }
// - GET /api/stories/<slug> -> truyện; GET /api/stories/<slug>/chapters -> [{ id, title, number }]
// - GET /api/stories/<slug>/chapters/<id chương> -> { content, original_content, ... } (xem chap.js)
// URL truyện: /story?id=<slug>; URL chương (trang đọc): /reader?story=<slug>&chapter=<số>, thêm &cid=<id chương> cho chap.js.

var BASE = "https://truyen-h.com";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
};
var PER_PAGE = 40;

// GET API. path: "/api/stories?page=1". Trả { ok, status, data } hoặc null nếu lỗi mạng.
function apiGet(path) {
  var r = null;
  try { r = fetch(BASE + path, { headers: HEADERS }); } catch (e) { r = null; }
  if (r == null) return null;
  var data = null;
  try { data = JSON.parse("" + r.text()); } catch (e2) { data = null; }
  return { ok: r.ok && data != null, status: r.status, data: data };
}

// slug truyện từ URL truyện (/story?id=<slug>) hoặc URL chương (/reader?story=<slug>&...)
function storySlug(url) {
  var m = ("" + url).match(/[?&](?:id|story)=([^&#]+)/);
  return m ? m[1] : "";
}

function storyUrl(slug) {
  return BASE + "/story?id=" + slug;
}

// Một số tên/tác giả bọc trong "**...**"
function cleanText(s) {
  return ("" + (s || "")).replace(/\*\*/g, "").trim();
}

function coverUrl(c) {
  c = "" + (c || "");
  if (!c) return BASE + "/apple-touch-icon.png";
  return c.indexOf("http") == 0 ? c : BASE + (c.indexOf("/") == 0 ? "" : "/") + c;
}

// Tag của truyện có khi là slug ("hau-cung"), có khi là tên ("Hậu Cung") -> slug cho tham số tag=.
function slugify(s) {
  return ("" + s).toLowerCase()
    .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
    .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
    .replace(/ì|í|ị|ỉ|ĩ/g, "i")
    .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
    .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
    .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Mảng truyện của API -> danh sách cho app
function toList(stories) {
  var result = [];
  for (var i = 0; i < stories.length; i++) {
    var s = stories[i];
    var n = s.total_chapters || s.chapterCount || 0;
    result.push({
      name: cleanText(s.title),
      link: storyUrl(s.slug || s.id),
      cover: coverUrl(s.cover_image),
      description: (n ? n + " chương - " : "") + cleanText(s.author),
    });
  }
  return result;
}

// Một trang danh sách. query: chuỗi tham số thêm vào ("sort=views", "tag=ntr", "q=..."), có thể rỗng.
function listPage(query, page) {
  var pageNum = page ? parseInt(page, 10) : 1;
  var r = apiGet("/api/stories?page=" + pageNum + "&limit=" + PER_PAGE + (query ? "&" + query : ""));
  if (r == null) return Response.error("Không kết nối được tới trang");
  if (!r.ok) return Response.error("Không tải được danh sách (HTTP " + r.status + ")");
  var items = toList(r.data.data || []);
  var totalPages = r.data.pagination ? r.data.pagination.totalPages : 0;
  return Response.success(items, items.length > 0 && pageNum < totalPages ? "" + (pageNum + 1) : null);
}
