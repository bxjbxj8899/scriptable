/*
[rewrite_local]
# 京东联盟
https:\/\/union\.jd\.com\/proManager\/index\?pageNo=1&keywords=\d+ url script-response-body jd_union.js
# 京东联盟短链接
https:\/\/union\.jd\.com\/api\/receivecode\/getCode url script-response-body jd_union.js
[mitm]
hostname = *.jd.com
*/

let body = $response.body;
let url = $request.url.replace(/https?:\/\/|\?.*/g, '');

if (url.includes('/api/receivecode/getCode')) {
  let bodyObj;
  try {
    bodyObj = JSON.parse(body);
  } catch (e) {
    console.log(`JSON 解析失败：${e.message}`);
    $notify('京东联盟', '解析错误', 'API 响应格式无效', {});
    $done();
    return;
  }

  if (!bodyObj || typeof bodyObj !== 'object') {
    console.log('响应为空或不是对象');
    $notify('京东联盟', '响应错误', 'API 响应为空或无效', {});
    $done();
    return;
  }

  if (bodyObj.code !== 200) {
    console.log(`转链失败：${bodyObj.message || '未知错误'}`);
    $notify('京东联盟', '转链失败', bodyObj.message || '未知错误', {});
    $done();
    return;
  }

  if (!bodyObj.data || !bodyObj.data.data) {
    console.log('响应缺少 data.data 字段');
    $notify('京东联盟', '转链失败', 'API 响应缺少必要字段', {});
    $done();
    return;
  }

  const { shortCode, rqCode } = bodyObj.data.data;
  if (!shortCode) {
    console.log('响应缺少 shortCode 字段');
    $notify('京东联盟', '转链失败', '无法获取短链接', {});
    $done();
    return;
  }

  console.log(`转链成功：shortCode=${shortCode}, rqCode=${rqCode || ''}`);
  $notify('京东联盟', '', `转链成功：${shortCode}`, {
    'open-url': shortCode,
    'media-url': rqCode || '',
  });

  $done();
}

if (url.includes('/proManager/index')) {
  let html = body;
  html = html.replace(/(<\/html>)/g, '') + `
    <script>
      // 确保 jQuery 已加载
      function waitForJQuery(callback) {
        if (typeof $ !== 'undefined') {
          callback();
        } else {
          setTimeout(() => waitForJQuery(callback), 100);
        }
      }

      waitForJQuery(() => {
        setTimeout(() => {
          const skuBtn = $('#first_sku_btn');
          if (skuBtn.length) {
            skuBtn.click();
            const appWrapper = $('.app-wrapper')[0];
            if (appWrapper) {
              appWrapper.scrollTop = 230;
            } else {
              console.log('未找到 .app-wrapper 元素');
            }

            setTimeout(() => {
              const linkBtn = $('[aria-label="生成推广链接"] .el-button--default');
              if (linkBtn.length) {
                linkBtn.click();
              } else {
                console.log('未找到生成推广链接按钮');
              }
            }, 1000);
          } else {
            console.log('未找到 SKU 按钮');
          }
        }, 1200);
      });
    </script>
  </html>
  `;

  $done({ body: html });
}
