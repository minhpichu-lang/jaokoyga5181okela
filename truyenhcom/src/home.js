// Các tab ở mục Khám phá. input là tham số thêm vào /api/stories (list.js lo phân trang).
function execute() {
  return Response.success([
    { title: "Mới cập nhật", input: "sort=updated", script: "list.js" },
    { title: "Xem nhiều", input: "sort=views", script: "list.js" },
    { title: "Nhiều chương", input: "sort=chapters", script: "list.js" },
  ]);
}
