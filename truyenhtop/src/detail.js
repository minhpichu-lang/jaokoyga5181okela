// Thông tin truyện. url: https://truyenh.top/<slug> (app đã bỏ dấu / cuối).
load("site.js");

function execute(url) {
  var response = siteFetch(url + "/");
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tải được thông tin truyện (HTTP " + response.status + ")");
  var doc = response.html();

  var h3 = first(doc, ".desc h3.title");
  var img = first(doc, ".info-holder .book img");
  var cover = img != null ? "" + img.attr("data-src") : ""; // ảnh lazy-load, src là SVG giữ chỗ
  if (!cover) cover = img != null ? "" + img.attr("src") : "";
  if (!cover || cover.indexOf("data:") == 0) cover = DEFAULT_COVER;

  var authors = [];
  var al = doc.select(".info a[href*='/tac-gia/']");
  for (var i = 0; i < al.size(); i++) authors.push(("" + al.get(i).text()).trim());

  var status = infoText(doc, "Trạng thái");
  var detailLines = [];
  if (status) detailLines.push("Trạng thái: " + status);
  var views = infoText(doc, "Lượt xem");
  if (views) detailLines.push("Lượt xem: " + views);

  var genres = [];
  var gl = doc.select(".info a[href*='/category/'], .info a[href*='/tag/']");
  for (var j = 0; j < gl.size(); j++) {
    genres.push({ title: ("" + gl.get(j).text()).trim(), input: toPath(gl.get(j).attr("href")), script: "list.js" });
  }

  var desc = first(doc, ".desc-text");
  return Response.success({
    name: h3 != null ? ("" + h3.text()).trim() : "",
    cover: cover,
    host: BASE,
    author: authors.join(", "),
    description: desc != null ? ("" + desc.html()).trim() : "",
    detail: detailLines.join("<br>"), // app hiển thị detail dạng HTML, "\n" không xuống dòng
    ongoing: !/hoàn|full|xong/i.test(status),
    genres: genres,
  });
}

// Giá trị của dòng "<h3>Nhãn:</h3><span>giá trị</span>" trong .info
function infoText(doc, label) {
  var span = first(doc, ".info h3:containsOwn(" + label + ") + span");
  return span != null ? ("" + span.text()).trim() : "";
}
