// Tìm kiếm theo tên truyện: /api/stories?q=<key>
load("site.js");

function execute(key, page) {
  return listPage("q=" + encodeURIComponent(key), page);
}
