/*
京东商品 skuId 捕捉 Demo
用法：在京东APP里打开商品详情页，看 QX 通知 & 日志
*/

let body = $response.body;

try {
  let obj = JSON.parse(body);

  // 不同接口返回字段可能不一样，常见是 wareId 或 skuId
  let skuId = obj?.wareInfo?.basicInfo?.wareId 
           || obj?.wareInfo?.basicInfo?.skuId 
           || obj?.wareId 
           || obj?.skuId;

  if (skuId) {
    $notify("京东商品捕捉成功 ✅", "skuId", skuId.toString());
    console.log("捕捉到 skuId: " + skuId);
  } else {
    console.log("没有找到 skuId，接口结构可能变化");
  }

} catch (e) {
  console.log("解析错误: " + e);
}

$done({});
