/*
jd_sku_debug.js
增强型调试脚本：在 response 或 request 的 body 中查找 skuId/wareId 等
适用于 QX 的 script-response-body 环境
*/

function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

function findKeysRecursively(obj, keys, path = '') {
  let found = [];
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        found = found.concat(findKeysRecursively(item, keys, `${path}[${index}]`));
      });
    } else {
      for (let k in obj) {
        try {
          let newPath = path ? path + '.' + k : k;
          if (keys.includes(k.toLowerCase())) {
            found.push({ path: newPath, value: obj[k] });
          } else if (k.toLowerCase().includes('sku') || k.toLowerCase().includes('ware') || k.toLowerCase().includes('product')) {
            console.log('【jd_sku_debug】发现可能的 SKU 相关键：' + newPath);
          }
          found = found.concat(findKeysRecursively(obj[k], keys, newPath));
        } catch (e) {}
      }
    }
  }
  return found;
}

function findNumbersInText(text, minLen = 6, maxLen = 8) {
  let regex = new RegExp('\\b\\d{' + minLen + ',' + maxLen + '}\\b', 'g');
  let arr = text.match(regex) || [];
  return Array.from(new Set(arr));
}

function findAlphanumericIds(text, minLen = 6, maxLen = 12) {
  let regex = new RegExp('\\b[a-zA-Z0-9]{' + minLen + ',' + maxLen + '}\\b', 'g');
  let arr = text.match(regex) || [];
  return Array.from(new Set(arr));
}

// main
(function () {
  let requestUrl = $request && $request.url ? $request.url : '';
  let responseBody = $response && $response.body ? $response.body : '';
  console.log('【jd_sku_debug】完整请求 URL：' + requestUrl);
  console.log('【jd_sku_debug】请求头：' + JSON.stringify($request.headers || {}));
  console.log('【jd_sku_debug】响应内容类型：' + ($response.headers && $response.headers['Content-Type'] || '未知'));

  let foundItems = [];

  // 1) 尝试解析 responseBody 为 JSON 并搜索常见键
  let json = tryParseJSON(responseBody);
  if (json) {
    let jsonExcerpt = JSON.stringify(json, null, 2).substring(0, 2000) + (JSON.stringify(json).length > 2000 ? '...[截断]' : '');
    console.log('【jd_sku_debug】response JSON 结构：\n' + jsonExcerpt);
    let keys = ['skuid', 'wareid', 'productid', 'itemid', 'goodsid', 'sku', 'id', 'ware', 'item', 'product'].map(k => k.toLowerCase());
    foundItems = findKeysRecursively(json, keys);
    if (foundItems.length) {
      console.log('【jd_sku_debug】在 response JSON 中找到：', foundItems);
      $notify('JD SKU 调试', '在 response JSON 找到 sku', JSON.stringify(foundItems.slice(0, 5)));
      $done({ body: responseBody });
      return;
    }
  } else {
    console.log('【jd_sku_debug】response 不是纯 JSON（或无法解析）。尝试文本搜索...');
  }

  // 2) 在 response 文本中用正则找数字序列（可能是 sku）
  let nums = findNumbersInText(responseBody, 6, 8);
  let alphaNums = findAlphanumericIds(responseBody, 6, 12);
  if (nums.length || alphaNums.length) {
    console.log('【jd_sku_debug】在 response 文本中找到可能的数字：' + nums.join(','));
    console.log('【jd_sku_debug】在 response 文本中找到可能的字母数字ID：' + alphaNums.join(','));
    $notify('JD SKU 调试', 'response 中可能的 ID', `数字: ${nums.slice(0, 5).join(',')}, 字母数字: ${alphaNums.slice(0, 5).join(',')}`);
    $done({ body: responseBody });
    return;
  }

  // 3) 检查 request headers
  if ($request && $request.headers) {
    let headersStr = JSON.stringify($request.headers);
    let nums = findNumbersInText(headersStr, 6, 8);
    let alphaNums = findAlphanumericIds(headersStr, 6, 12);
    if (nums.length || alphaNums.length) {
      console.log('【jd_sku_debug】在 request headers 中找到可能的数字：' + nums.join(','));
      console.log('【jd_sku_debug】在 request headers 中找到可能的字母数字ID：' + alphaNums.join(','));
      $notify('JD SKU 调试', 'request headers 中可能的 ID', `数字: ${nums.slice(0, 5).join(',')}, 字母数字: ${alphaNums.slice(0, 5).join(',')}`);
      $done({ body: responseBody });
      return;
    }
  }

  // 4) 检查 request 的 URL query（尤其是 body= 参数）
  try {
    let urlObj = new URL(requestUrl);
    let queryParams = [...urlObj.searchParams.entries()];
    console.log('【jd_sku_debug】请求查询参数：' + JSON.stringify(queryParams));
    let bodyParam = urlObj.searchParams.get('body') || urlObj.searchParams.get('param') || '';
    if (bodyParam) {
      let dec = '';
      try {
        dec = decodeURIComponent(bodyParam);
      } catch (e) {
        dec = bodyParam;
      }
      let base64Decoded = '';
      try {
        base64Decoded = atob(dec);
      } catch (e) {}
      let j1 = tryParseJSON(dec);
      let j2 = tryParseJSON(base64Decoded);
      if (j1) {
        let found = findKeysRecursively(j1, ['skuid', 'wareid', 'productid', 'itemid', 'goodsid', 'sku', 'id', 'ware', 'item', 'product'].map(k => k.toLowerCase()));
        if (found.length) {
          console.log('【jd_sku_debug】在 request.body(JSON) 中找到：', found);
          $notify('JD SKU 调试', 'request.body(JSON) 找到 sku', JSON.stringify(found.slice(0, 5)));
          $done({ body: responseBody });
          return;
        }
      }
      if (j2) {
        let found = findKeysRecursively(j2, ['skuid', 'wareid', 'productid', 'itemid', 'goodsid', 'sku', 'id', 'ware', 'item', 'product'].map(k => k.toLowerCase()));
        if (found.length) {
          console.log('【jd_sku_debug】在 request.body(base64->JSON) 中找到：', found);
          $notify('JD SKU 调试', 'request.body(base64->JSON) 找到 sku', JSON.stringify(found.slice(0, 5)));
          $done({ body: responseBody });
          return;
        }
      }
      let nums = findNumbersInText(dec, 6, 8).concat(findNumbersInText(base64Decoded, 6, 8));
      let alphaNums = findAlphanumericIds(dec, 6, 12).concat(findAlphanumericIds(base64Decoded, 6, 12));
      if (nums.length || alphaNums.length) {
        console.log('【jd_sku_debug】在 request body 参数中找到数字：' + Array.from(new Set(nums)).slice(0, 6).join(','));
        console.log('【jd_sku_debug】在 request body 参数中找到字母数字ID：' + Array.from(new Set(alphaNums)).slice(0, 6).join(','));
        $notify('JD SKU 调试', 'request body 中可能的 ID', `数字: ${Array.from(new Set(nums)).slice(0, 6).join(',')}, 字母数字: ${Array.from(new Set(alphaNums)).slice(0, 6).join(',')}`);
        $done({ body: responseBody });
        return;
      }
    }
  } catch (e) {
    console.log('【jd_sku_debug】解析 request URL 出错：' + e);
  }

  // 5) 检查 HTML response
  if ($response.headers && $response.headers['Content-Type'] && $response.headers['Content-Type'].includes('text/html')) {
    let nums = findNumbersInText(responseBody, 6, 8);
    let alphaNums = findAlphanumericIds(responseBody, 6, 12);
    if (nums.length || alphaNums.length) {
      console.log('【jd_sku_debug】在 HTML response 中找到可能的数字：' + nums.join(','));
      console.log('【jd_sku_debug】在 HTML response 中找到可能的字母数字ID：' + alphaNums.join(','));
      $notify('JD SKU 调试', 'HTML response 中可能的 ID', `数字: ${nums.slice(0, 5).join(',')}, 字母数字: ${alphaNums.slice(0, 5).join(',')}`);
      $done({ body: responseBody });
      return;
    }
  }

  // 6) 最后兜底：打印 response 前 5000 字节
  let excerpt = responseBody && responseBody.length > 5000 ? responseBody.substring(0, 5000) + '...[截断]' : responseBody;
  console.log('【jd_sku_debug】未找到明确 skuId，response 前 5000 字节：\n' + excerpt);
  $notify('JD SKU 调试', '未找到 skuId', '已在控制台打印 response 前 5000 字节');
  $done({ body: responseBody });
})();
