// Thông tin truyện. url: https://truyen-h.com/story?id=<slug>
load("site.js");

function execute(url) {
  var slug = storySlug(url);
  if (!slug) return Response.error("URL truyện không hợp lệ");
  var r = apiGet("/api/stories/" + slug);
  if (r == null) return Response.error("Không kết nối được tới trang");
  if (!r.ok) return Response.error("Không tải được thông tin truyện (HTTP " + r.status + ")");
  var s = r.data;

  var tags = s.tags || [];
  if (typeof tags == "string") { try { tags = JSON.parse(tags); } catch (e) { tags = []; } }
  var genres = [];
  for (var i = 0; i < tags.length; i++) {
    var tagSlug = slugify(tags[i]);
    if (tagSlug) genres.push({ title: "" + tags[i], input: "tag=" + tagSlug, script: "list.js" });
  }

  var ongoing = s.status != "completed";
  var detailLines = [];
  if (s.original_title) detailLines.push("Tên gốc: " + cleanText(s.original_title));
  detailLines.push("Trạng thái: " + (ongoing ? "Đang ra" : "Hoàn thành"));
  if (s.total_chapters) detailLines.push("Số chương: " + s.total_chapters);
  if (s.total_views) detailLines.push("Lượt xem: " + s.total_views);

  return Response.success({
    name: cleanText(s.title),
    cover: coverUrl(s.cover_image),
    host: BASE,
    author: cleanText(s.author),
    description: ("" + (s.description || "")).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>"),
    detail: detailLines.join("<br>"), // app hiển thị detail dạng HTML, "\n" không xuống dòng
    ongoing: ongoing,
    genres: genres,
  });
}
