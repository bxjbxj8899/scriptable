/*
 * 京东App商品详情跳转京粉App返利（优化版）
 * Quantumult X 脚本
 * MITM: api.m.jd.com, router.jd.com
 * Rewrite: ^https?://api\.m\.jd\.com/client\.action\?functionId=wareBusiness url script-response-body https://your-github-raw-link/jd_to_jingfen.js
 * Author: Grok (2025-09-30)
 * Notes: 替换你的app_key, app_secret, pid, siteId。确保QX支持$utils.md5。
 */

const appKey = 'dfb1d213da0d7d788b9b37846e671960c763dd65a9f010185d4f61c7ed4f1e449f111d86397bc164'; // 替换为你的京东联盟app_key
const appSecret = '2020869031_4102153475_3102423369'; // 替换为你的app_secret
const pid = '3102423369'; // 替换为你的推广位ID，例如 '1001_1001_12345'
const siteId = '4102153475'; // 替换为你的网站ID

let body = $response.body;
let url = $request.url;

if (url.includes('api.m.jd.com/client.action?functionId=wareBusiness')) {
  // 解析京东App商品详情API响应，提取SKU ID
  let obj;
  try {
    obj = JSON.parse(body);
  } catch (e) {
    $notify('京东商品', '解析错误', '响应体不是JSON: ' + e.message);
    $done();
  }
  let skuId = obj?.wareBusiness?.wareId || obj?.wareId;
  if (!skuId) {
    $notify('京东商品', '错误', '无法提取SKU ID');
    $done();
  }

  // 构造materialId (商品URL)
  const materialId = `https://item.jd.com/${skuId}.html`;

  // 京东联盟API参数
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; // UTC时间
  const params = {
    method: 'jd.union.open.promotion.common.get',
    app_key: appKey,
    timestamp: timestamp,
    v: '1.0',
    sign_method: 'md5',
    format: 'json',
    360buy_param_json: JSON.stringify({
      promotionCodeReq: {
        materialId: materialId,
        siteId: siteId,
        positionId: pid,
        chainType: 1 // 无线推广
      }
    })
  };

  // 计算sign (京东MD5签名：appSecret + 排序参数 + appSecret)
  let signStr = appSecret;
  Object.keys(params).sort().forEach(key => {
    if (key !== 'sign') signStr += key + params[key];
  });
  signStr += appSecret;
  params.sign = $utils.md5(signStr).toUpperCase(); // QX内置MD5

  // 调用京东联盟API
  $httpClient.get({
    url: 'https://router.jd.com/api?' + Object.keys(params).map(k => k + '=' + encodeURIComponent(params[k])).join('&'),
    headers: { 'Content-Type': 'application/json' }
  }, (err, resp, data) => {
    if (err || resp.status !== 200) {
      $notify('京东联盟', 'API错误', '请求失败: ' + (err || resp.status));
      $done();
    }
    let res;
    try {
      res = JSON.parse(data)?.jd_union_open_promotion_common_get_response?.result;
      res = JSON.parse(res);
    } catch (e) {
      $notify('京东联盟', '解析失败', 'API响应格式错误: ' + e.message);
      $done();
    }
    if (res.code !== 200 || !res.data?.clickUrl) {
      $notify('京东联盟', '无返利', res.msg || '商品不支持返利');
      $done();
    }

    // 检查佣金率
    if (parseFloat(res.data.commissionShare) <= 0) {
      $notify('京东联盟', '无返利', '佣金率为0');
      $done();
    }

    const shortUrl = res.data.shortUrl || res.data.clickUrl; // 短链接

    // 京粉App Scheme跳转
    const jingfenScheme = `openapp.jdpingou://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      des: 'm',
      url: shortUrl
    }))}`;
    const fallbackScheme = `openapp.jdmobile://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      des: 'm',
      url: shortUrl
    }))}`;

    $notify('京东返利', '有返利活动', `点击跳转京粉App购买：${shortUrl}`, {
      'open-url': jingfenScheme,
      'media-url': '',
      'fallback-url': fallbackScheme // 备选Scheme
    });

    $done();
  });

  $done({ body }); // 继续原响应
}
