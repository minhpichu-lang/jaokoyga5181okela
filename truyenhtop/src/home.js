// Các tab ở mục Khám phá. input là PATH (list.js tự thêm page/N/).
function execute() {
  return Response.success([
    { title: "Mới cập nhật", input: "/", script: "list.js" },
    { title: "Top tuần", input: "/bang-xep-hang/?sort=week", script: "list.js" },
    { title: "Top tháng", input: "/bang-xep-hang/?sort=month", script: "list.js" },
    { title: "Top tất cả", input: "/bang-xep-hang/?sort=all", script: "list.js" },
    { title: "Nam chính", input: "/category/nam-chinh/", script: "list.js" },
    { title: "Nữ chính", input: "/category/nu-chinh/", script: "list.js" },
    { title: "Text Trung", input: "/category/text-trung/", script: "list.js" },
  ]);
}
