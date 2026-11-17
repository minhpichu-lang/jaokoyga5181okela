// Nội dung chương. url: https://truyen-h.com/reader?story=<slug>&chapter=<số>&cid=<id chương>
//
// GET /api/stories/<slug>/chapters/<id> -> { content (bản dịch, text thuần, xuống dòng bằng \n), original_content (tiếng Trung) }.
// API từ chối trong 2 trường hợp (HTTP 403):
// - { code: 21 } IP chưa xác minh chống bot. Trang đọc tự chạy Cloudflare Turnstile (ẩn) rồi POST /auth/verify-turnstile
//   để mở khóa IP -> mở trang đọc trong WebView và lấy nội dung trang hiện ra.
// - { code: 40, freeLimit: 10 } khách chỉ đọc được 10 chương đầu mỗi truyện, phải đăng nhập (cookie phiên HttpOnly).
//   Đăng nhập bằng form /auth trong WebView (form có Turnstile hiển thị, tự qua sau ~20 s). Cookie của WebView dùng chung
//   với fetch của app, nên đăng nhập xong gọi lại API là được. Tài khoản khai báo trong cài đặt extension -> "Add code":
//     let USERNAME = "tên đăng nhập"; let PASSWORD = "mật khẩu";
//
// WebView của vbook mặc định tự xưng "Edge 89 trên Windows" (thực chất là Android WebView đời mới), Turnstile không qua
// được với UA lệch này -> đặt UA Android WebView đúng phiên bản Chromium thật trước khi mở trang.
load("site.js");

var WAIT_MS = 60000; // Turnstile trên WebView mất 15-30 s, có lúc lâu hơn

function execute(url) {
  var slug = storySlug(url);
  var m = ("" + url).match(/[?&]cid=([^&#]+)/);
  if (!slug || !m) return Response.error("URL chương không hợp lệ, hãy tải lại mục lục");
  var api = "/api/stories/" + slug + "/chapters/" + m[1];

  var r = apiGet(api);
  if (r != null && r.data != null && r.data.code == 40 && account() != null) {
    var err = login();
    if (err) return Response.error(err);
    r = apiGet(api);
  }
  if (r == null) return Response.error("Không kết nối được tới trang");
  var data = r.data || {};
  if (r.ok && data.content) return Response.success(toHtml("" + data.content));
  if (r.ok && data.original_content) return Response.success(toHtml("" + data.original_content));
  if (data.code == 40) {
    return Response.error("Khách chỉ đọc được " + (data.freeLimit || 10) + " chương đầu. Vào cài đặt extension -> Add code, nhập: " +
      "let USERNAME = \"tên đăng nhập\"; let PASSWORD = \"mật khẩu\";");
  }
  if (data.code != 21) {
    return Response.error("Không tải được chương (HTTP " + r.status + ")" + (data.error ? ": " + data.error : ""));
  }

  var html = readInBrowser(url);
  if (html) return Response.success(html);
  return Response.error("Site yêu cầu xác minh chống bot nhưng xác minh tự động thất bại, hãy thử tải lại chương.");
}

// Tài khoản khai báo qua "Add code", null nếu chưa có
function account() {
  try {
    if (typeof USERNAME != "undefined" && typeof PASSWORD != "undefined" && USERNAME && PASSWORD) {
      return { user: "" + USERNAME, pass: "" + PASSWORD };
    }
  } catch (e) { /* chưa khai báo */ }
  return null;
}

// Đăng nhập bằng form /auth trong WebView: chờ Turnstile có token, điền form, bấm nút, đọc thông báo #authAlert.
// Trả "" nếu thành công, chuỗi lỗi nếu thất bại.
function login() {
  var acc = account();
  var browser = Engine.newBrowser();
  try {
    useRealUserAgent(browser);
    browser.launch(BASE + "/auth", 20000);
    if (!waitFor(browser, "(document.querySelector('[name=cf-turnstile-response]') || {}).value")) {
      return "Đăng nhập thất bại: không qua được bước xác minh Turnstile";
    }
    browser.callJs("document.getElementById('loginEmail').value = " + JSON.stringify(acc.user) + ";" +
      " document.getElementById('loginPassword').value = " + JSON.stringify(acc.pass) + ";" +
      " document.getElementById('loginBtn').click();", 200);
    var alert = waitFor(browser, "((document.getElementById('authAlert') || {}).textContent || '').trim()");
    if (alert.indexOf("thành công") >= 0) return "";
    return "Đăng nhập thất bại: " + (alert || "không có phản hồi");
  } catch (e) {
    return "Đăng nhập thất bại: " + e;
  } finally {
    browser.close();
  }
}

// Tính biểu thức JS `expr` trong trang mỗi giây tới khi trả chuỗi khác rỗng (tối đa WAIT_MS). Trả chuỗi đó hoặc "".
function waitFor(browser, expr) {
  var start = Date.now();
  while (Date.now() - start < WAIT_MS) {
    browser.callJs("var vbp = document.getElementById('vbout') || document.createElement('pre'); vbp.id = 'vbout';" +
      " vbp.style.display = 'none'; vbp.textContent = (" + expr + ") || ''; document.body.appendChild(vbp);", 100);
    var out = first(browser.html(), "#vbout");
    var v = out != null ? ("" + out.text()).trim() : "";
    if (v) return v;
    sleep(1000);
  }
  return "";
}

// Mở trang đọc trong WebView, chờ #chapterContent có nội dung. Trả HTML nội dung hoặc "" nếu hết giờ / xác minh thất bại.
function readInBrowser(url) {
  var browser = Engine.newBrowser();
  try {
    useRealUserAgent(browser);
    browser.launch(url, 20000);
    var start = Date.now();
    while (Date.now() - start < WAIT_MS) {
      var content = first(browser.html(), "#chapterContent");
      if (content != null) {
        var t = ("" + content.text()).trim();
        if (t.indexOf("Xác minh thất bại") >= 0 || first(content, "#loginGate") != null) return "";
        if (t.length > 200 && first(content, ".sk-line") == null && t.indexOf("Xác minh bảo mật") < 0) {
          content.select("script, style, button").remove();
          return ("" + content.html()).trim();
        }
      }
      sleep(500);
    }
  } catch (e) {
    // hết giờ / lỗi WebView: báo lỗi chung ở execute
  } finally {
    browser.close();
  }
  return "";
}

// Đặt UA Android WebView khớp phiên bản Chromium thật của WebView (mở một ảnh nhỏ của site để đọc userAgentData).
function useRealUserAgent(browser) {
  browser.launch(BASE + "/apple-touch-icon.png", 10000);
  browser.callJs("var p = document.createElement('pre'); p.id = 'vbua'; var d = navigator.userAgentData, v = '';" +
    " if (d) for (var i = 0; i < d.brands.length; i++) if (d.brands[i].brand == 'Chromium') v = d.brands[i].version;" +
    " p.textContent = v; document.body.appendChild(p);", 200);
  var el = first(browser.html(), "#vbua");
  var version = el != null ? ("" + el.text()).trim() : "";
  if (!/^\d+$/.test(version)) return; // không đọc được: giữ UA mặc định
  browser.setUserAgent("Mozilla/5.0 (Linux; Android 10; K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/" +
    version + ".0.0.0 Mobile Safari/537.36");
}

function first(el, selector) {
  var els = el.select(selector);
  return els.size() > 0 ? els.get(0) : null;
}

// Text thuần -> HTML: mỗi dòng không rỗng một đoạn <p>
function toHtml(text) {
  var lines = text.replace(/\r/g, "").split("\n");
  var out = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/^[\s　]+|[\s　]+$/g, "");
    if (line) out.push("<p>" + line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</p>");
  }
  return out.join("\n");
}
