!(async () => {
  try {
    if (!sku) {
      $.subt = '无法获取 SKU';
      $.desc = '请检查 URL 是否包含有效的 SKU';
      $.msg($.name, $.subt, $.desc);
      $.done();
      return;
    }

    if (platformType === 'DIY') {
      if (!diyApi) {
        $.subt = '缺少 DIY API';
        $.desc = '请配置自建服务 API';
        $.msg($.name, $.subt, $.desc);
        $.done();
        return;
      }
      const diyData = await getData({ url: `${diyApi}${skuId}` });
      if (!diyData) {
        $.subt = 'DIY API 响应为空';
        $.desc = '请检查自建服务配置';
        $.msg($.name, $.subt, $.desc);
        $.done();
        return;
      }
      $.subt = '';
      $.desc = diyData.briefInfo;
      $.copyText = diyData.details;
      setScheme(
        diyData.cvLink ||
          diyData.shortUrl ||
          diyData.promotionUrl ||
          diyData.originalContext
      );
      $.msgOpts = {
        openUrl: $.openUrl,
        mediaUrl: `https://img20.360buyimg.com/devfe/${diyData.imageUrl}`,
        'update-pasteboard':
          diyCopy === 'diy'
            ? $.copyText
            : diyData.cvLink ||
              diyData.shortUrl ||
              diyData.promotionUrl ||
              diyData.originalContext,
      };
      if (schemeFlag === 'Y') delete $.msgOpts.openUrl;
      $.setData($.subt, 'id77_JDSubt_Cache');
      $.setData($.desc, 'id77_JDDesc_Cache');
      $.setData(JSON.stringify($.msgOpts), 'id77_JDMsgOpts_Cache');
      $.msg($.name, $.subt, $.desc, $.msgOpts);
      $.done();
      return;
    }

    if (platformType === 'WeChat-MiniApp') {
      // ... 微信小程序逻辑
      const response = await getData($.opts);
      if (!response) {
        $.subt = 'API 响应为空';
        $.desc = '无法获取商品信息，请检查网络或 Cookie 配置';
        $.msg($.name, $.subt, $.desc);
        $.done();
        return;
      }
      result = response;
      if (!result.code) {
        $.subt = 'API 响应无效';
        $.desc = '响应中缺少 code 字段';
        $.msg($.name, $.subt, $.desc);
        $.done();
        return;
      }
      if (result.code !== 200) {
        $.desc = result.message || '未知错误';
        $.msg($.name, $.subt, $.desc);
        $.done();
        return;
      }
      // ... 继续处理
    } else {
      setReqOpts('jd.union.open.goods.promotiongoodsinfo.query', {
        skuIds: skuId + '',
      });
      const response = await getData($.opts);
      if (!response) {
        $.subt = 'API 响应为空';
        $.desc = '无法获取商品信息，请检查网络或参数配置';
        $.msg($.name, $.subt, $.desc);
        $.done();
        return;
      }
      result = JSON.parse(
        response.jd_union_open_goods_promotiongoodsinfo_query_responce
          ?.queryResult || '{}'
      );
      if (!result.code) {
        $.subt = 'API 响应无效';
        $.desc = '响应中缺少 code 字段';
        $.msg($.name, $.subt, $.desc);
        $.done();
        return;
      }
      // ... 继续处理
    }
  } catch (error) {
    $.logErr(error);
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());
