// Phân trang danh sách truyện. url: tham số thêm vào /api/stories ("sort=views", "tag=ntr"...), page: số trang (rỗng = 1).
load("site.js");

function execute(url, page) {
  return listPage(url, page);
}
