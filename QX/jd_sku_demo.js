/*
jd_sku_debug.js
增强型调试脚本：在 response 或 request 的 body 中查找 skuId/wareId 等
适用于 QX 的 script-response-body 环境
*/

function tryParseJSON(str) {
  try { return JSON.parse(str); } catch (e) { return null; }
}

function findKeysRecursively(obj, keys, path = '') {
  let found = [];
  if (obj && typeof obj === 'object') {
    for (let k in obj) {
      try {
        let newPath = path ? path + '.' + k : k;
        if (keys.includes(k.toLowerCase())) {
          found.push({path: newPath, value: obj[k]});
        }
        found = found.concat(findKeysRecursively(obj[k], keys, newPath));
      } catch (e) {}
    }
  }
  return found;
}

function findNumbersInText(text, minLen = 6, maxLen = 13) {
  let regex = new RegExp('\\b\\d{' + minLen + ',' + maxLen + '}\\b', 'g');
  let arr = text.match(regex) || [];
  // 过滤重复
  return Array.from(new Set(arr));
}

// main
(function() {
  let requestUrl = $request && $request.url ? $request.url : '';
  let responseBody = $response && $response.body ? $response.body : '';
  console.log('【jd_sku_debug】请求 URL：' + requestUrl);

  let foundItems = [];

  // 1) 尝试解析 responseBody 为 JSON 并搜索常见键
  let json = tryParseJSON(responseBody);
  if (json) {
    let keys = ['skuid','skuId'.toLowerCase(),'wareid','wareId'.toLowerCase(),'productid','productId'.toLowerCase()];
    // unify keys to lower case in search
    foundItems = foundItems.concat(findKeysRecursively(json, keys));
    if (foundItems.length) {
      console.log('【jd_sku_debug】在 response JSON 中找到：', foundItems);
      $notify('JD SKU 调试', '在 response JSON 找到 sku', JSON.stringify(foundItems.slice(0,5)));
      $done({body: responseBody});
      return;
    }
  } else {
    console.log('【jd_sku_debug】response 不是纯 JSON（或无法解析）。尝试文本搜索...');
  }

  // 2) 在 response 文本中用正则找数字序列（可能是 sku）
  let nums = findNumbersInText(responseBody, 6, 13);
  if (nums.length) {
    console.log('【jd_sku_debug】在 response 文本中找到可能的数字：' + nums.join(','));
    // 只通知前 5 个，避免太长
    $notify('JD SKU 调试', 'response 中可能的数字', nums.slice(0,5).join(','));
    $done({body: responseBody});
    return;
  }

  // 3) 检查 request 的 URL query（尤其是 body= 参数）——很多 JD 请求会把参数放在 body=xxxx
  try {
    let urlObj = new URL(requestUrl);
    let bodyParam = urlObj.searchParams.get('body') || urlObj.searchParams.get('param') || '';
    if (bodyParam) {
      // 尝试 decodeURIComponent
      let dec = '';
      try { dec = decodeURIComponent(bodyParam); } catch(e) { dec = bodyParam; }
      // 尝试 base64 decode
      let base64Decoded = '';
      try { base64Decoded = atob(dec); } catch(e) { base64Decoded = ''; }
      // 若解码得到 JSON，解析并搜索
      let j1 = tryParseJSON(dec);
      let j2 = tryParseJSON(base64Decoded);
      if (j1) {
        let found = findKeysRecursively(j1, ['skuid','skuid'.toLowerCase(),'wareid','productid']);
        if (found.length) {
          console.log('【jd_sku_debug】在 request.body(JSON) 中找到：', found);
          $notify('JD SKU 调试', 'request.body(JSON) 找到 sku', JSON.stringify(found.slice(0,5)));
          $done({body: responseBody});
          return;
        }
      }
      if (j2) {
        let found = findKeysRecursively(j2, ['skuid','wareid','productid']);
        if (found.length) {
          console.log('【jd_sku_debug】在 request.body(base64->JSON) 中找到：', found);
          $notify('JD SKU 调试', 'request.body(base64->JSON) 找到 sku', JSON.stringify(found.slice(0,5)));
          $done({body: responseBody});
          return;
        }
      }
      // 如果仍然不是 JSON，搜索数字
      let candidates = findNumbersInText(dec, 6, 13).concat(findNumbersInText(base64Decoded, 6, 13));
      if (candidates.length) {
        console.log('【jd_sku_debug】在 request body 参数中找到数字：' + Array.from(new Set(candidates)).slice(0,6).join(','));
        $notify('JD SKU 调试', 'request body 中可能的数字', Array.from(new Set(candidates)).slice(0,6).join(','));
        $done({body: responseBody});
        return;
      }
    }
  } catch (e) {
    console.log('【jd_sku_debug】解析 request URL 出错：' + e);
  }

  // 4) 最后兜底：把 responseBody 的前 1200 字节截取到日志，便于你截图或把日志贴出来
  let excerpt = responseBody && responseBody.length > 1200 ? responseBody.substring(0,1200) + '...[截断]' : responseBody;
  console.log('【jd_sku_debug】未找到明确 skuId，response 前 1200 字节：\n' + excerpt);
  $notify('JD SKU 调试', '未找到 skuId', '已在控制台打印 response 前 1200 字节');
  $done({body: responseBody});
})();
