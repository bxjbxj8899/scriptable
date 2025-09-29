/*
 * 京东商品页面跳转京粉App返利购买
 * Quantumult X 脚本
 * MITM: *.jd.com
 * URL: https://item.jd.com/*.html, https://union.jd.com/api/receivecode/getCode
 * Author: Grok, created by xAI
 * Date: 2025-09-29
 */

let body = $response.body;
let url = $request.url;

if (url.includes('item.jd.com')) {
  // 商品页面处理
  let html = body;
  html = html.replace(/(<\/html>)/g, '') + `
    <script>
      setTimeout(() => {
        // 假设“立即购买”按钮的class为“btn-buy-now”（需根据实际页面调整）
        let buyButton = document.querySelector('.btn-buy-now') || document.querySelector('.btn-add-cart');
        if (buyButton) {
          buyButton.addEventListener('click', () => {
            // 提取商品ID（假设在URL中）
            let skuId = window.location.href.match(/(\\d+)\\.html/)[1];
            // 调用京东联盟API获取短链接
            fetch('https://union.jd.com/api/receivecode/getCode?skuId=' + skuId, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(data => {
              if (data.code === 200 && data.data && data.data.shortCode) {
                // 跳转到京粉App
                window.location.href = data.data.shortCode;
              } else {
                alert('获取返利链接失败：' + data.message);
              }
            })
            .catch(err => {
              alert('请求联盟链接失败：' + err);
            });
          });
        }
      }, 1000);
    </script>
  </html>
  `;
  $done({ body: html });
}

if (url.includes('union.jd.com/api/receivecode/getCode')) {
  // 处理联盟短链接API响应
  let obj = JSON.parse(body);
  if (obj.code !== 200) {
    $notify('京东联盟', '转链失败', obj.message);
    $done();
  }
  
  const { shortCode } = obj.data.data;
  // 假设京粉App的URL Scheme为jingfenapp://（需替换为实际Scheme）
  const jingfenUrl = `jingfenapp://open?params=${encodeURIComponent(shortCode)}`;
  
  $notify('京东联盟', '转链成功', `跳转至京粉App购买：${shortCode}`, {
    'open-url': jingfenUrl
  });
  
  $done({ body });
}
