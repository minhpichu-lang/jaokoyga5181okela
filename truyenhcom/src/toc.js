// Mục lục: GET /api/stories/<slug>/chapters trả toàn bộ chương một lần.
// Tên chương thường là "Chương N", nhưng truyện nhập từ Telegram lấy nguyên đoạn văn đầu làm tên -> khi đó chỉ ghi "Chương N".
load("site.js");

function execute(url) {
  var slug = storySlug(url);
  if (!slug) return Response.error("URL truyện không hợp lệ");
  var r = apiGet("/api/stories/" + slug + "/chapters");
  if (r == null) return Response.error("Không kết nối được tới trang");
  if (!r.ok) return Response.error("Không tải được mục lục (HTTP " + r.status + ")");

  var chapters = [];
  for (var i = 0; i < r.data.length; i++) {
    var c = r.data[i];
    var num = c.number || c.chapter_index || (i + 1);
    var title = cleanText(c.title);
    chapters.push({
      name: title && title.length <= 80 ? title : "Chương " + num,
      url: BASE + "/reader?story=" + slug + "&chapter=" + num + "&cid=" + c.id,
    });
  }
  return Response.success(chapters);
}
