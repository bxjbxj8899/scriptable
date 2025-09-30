/*
京东商品 skuId 捕捉 Demo (增强版)
*/

let body = $response.body;

try {
  let obj = JSON.parse(body);

  // 多种可能字段
  let skuId = obj?.wareInfo?.basicInfo?.wareId 
           || obj?.wareInfo?.basicInfo?.skuId 
           || obj?.wareId 
           || obj?.skuId 
           || obj?.productInfo?.wareId 
           || obj?.productInfo?.skuId;

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
