// Nội dung chương. url: https://truyenh.top/<slug truyện>/<slug chương>.html
//
// Trang chương bị Cloudflare challenge ("Just a moment..."), fetch thường nhận 403. Nội dung cũng không có
// trong HTML: JS của trang tải nó sau khi trang mở (truyện "Text Trung" còn được dịch máy phía trình duyệt).
// Vì vậy mở trang trong WebView như trình duyệt bình thường, chờ div.chapter-content có chữ rồi đọc DOM.
//
// WebView của vbook mặc định tự xưng "Edge 89 trên Windows" trong khi thực chất là Android WebView đời mới
// -> Cloudflare thấy UA không khớp nên kẹt mãi ở trang challenge. Đặt UA Android WebView đúng phiên bản Chromium thật
// (đọc từ navigator.userAgentData) thì challenge tự qua (~25 s lần đầu); cookie cf_clearance được giữ lại nên các
// chương sau chỉ mất ~5 s.
load("site.js");

var WAIT_MS = 40000;

function execute(url) {
  var browser = Engine.newBrowser();
  var title = "";
  try {
    useRealUserAgent(browser);
    browser.launch(url, 20000);
    var start = Date.now();
    while (Date.now() - start < WAIT_MS) {
      var doc = browser.html();
      var content = first(doc, ".chapter-content");
      if (content != null && first(content, "#chapter-loading-indicator") == null && ("" + content.text()).trim().length > 50) {
        content.select("script, style, iframe, ins, .a-responsive, [data-cl-spot], [id^=__clb]").remove();
        // Bản dịch máy (truyện Text Trung) bọc từng từ trong <i h="gốc" t="hán việt" v="nghĩa" id="ranN">từ</i> -> chỉ giữ chữ
        return Response.success(("" + content.html()).replace(/<i h="[^"]*"[^>]*>([^<]*)<\/i>/g, "$1").trim());
      }
      title = "" + doc.select("title").text();
      sleep(500);
    }
  } catch (e) {
    return Response.error("Lỗi khi mở trang chương: " + e);
  } finally {
    browser.close();
  }
  if (/just a moment|chờ một chút|attention required/i.test(title)) {
    return Response.error("Không vượt qua được bước xác minh của Cloudflare, hãy thử tải lại chương.");
  }
  return Response.error("Hết thời gian chờ tải nội dung chương");
}

// Đặt UA Android WebView khớp phiên bản Chromium thật của WebView (mở một ảnh nhỏ của site để đọc userAgentData).
function useRealUserAgent(browser) {
  browser.launch(DEFAULT_COVER, 10000);
  browser.callJs("var p = document.createElement('pre'); p.id = 'vbua'; var d = navigator.userAgentData, v = '';" +
    " if (d) for (var i = 0; i < d.brands.length; i++) if (d.brands[i].brand == 'Chromium') v = d.brands[i].version;" +
    " p.textContent = v; document.body.appendChild(p);", 200);
  var el = first(browser.html(), "#vbua");
  var version = el != null ? ("" + el.text()).trim() : "";
  if (!/^\d+$/.test(version)) return; // không đọc được: giữ UA mặc định
  browser.setUserAgent("Mozilla/5.0 (Linux; Android 10; K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/" +
    version + ".0.0.0 Mobile Safari/537.36");
}
