/*
jd_sku_debug.js
增强型调试脚本：在 response 或 request 的 body 中查找 skuId/wareId 等
适用于 Quantumult X 的 script-response-body 环境
版本：2025-09-30
*/

let foundItems = [];

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

function findNumbersInText(text, minLen = 6, maxLen = 12) {
  let regex = new RegExp('\\b\\d{' + minLen + ',' + maxLen + '}\\b', 'g');
  let arr = text.match(regex) || [];
  return Array.from(new Set(arr));
}

function findAlphanumericIds(text, minLen = 6, maxLen = 12) {
  let regex = new RegExp('\\b[a-zA-Z0-9]{' + minLen + ',' + maxLen + '}\\b', 'g');
  let arr = text.match(regex) || [];
  let blacklist = [
    'closeNFC', 'openapp', 'jdmobile', 'virtual', 'params', 'category', 'newScan', '360buyimg',
    'LaunchOption', 'TabBar', 'needRequest', 'enableSound', 'EnableFuzzy', 'enableBackup', 'navTitle',
    'pointEnable', 'nearbyEnable', 'ErrorMsg', 'btnText', 'Reload', 'subTitle', 'footerText', 'currently',
    'visitors', 'please', 'verification', 'shopping', 'becomes', 'easier', 'LBSAddress', 'firstPages',
    'search', 'caller', 'TaroNative', 'templateIds', 'miniapp', 'jumpSource', 'pIdList', 'basicConfig',
    'feedsTab', 'switch', 'BizVersion', 'MixVersion', 'iPhone14', 'iPhone15', 'iPhone16', 'iPhone13',
    'iPhone17', 'JDAppManager', 'modules', 'JDDDIMMCU', 'toColorApi', 'useSoaColor', 'useDDMSColor',
    'useDDMSLog', 'rnChat', 'jdimtext', 'useTrackLog', 'magicFilter', 'useUGCAblum', 'useUGCRecord',
    'dynamicBtn', 'blackList', 'whiteList', 'allCases', 'record', 'uploadImage', 'frequency',
    'strategyDay', 'fileDownload', 'sayHello', 'imTrans', 'roamSwitch', 'openIM', 'webSource',
    'magicTextBtn', 'bottomOrder', 'nwsocket', 'useNWSocket', 'evaluate', 'disableEva', 'config',
    'protocol', 'graytcp', 'activity', 'imBrowser', 'uiSwitch', 'messageSkin', 'noDisturb',
    'jdimstyle', 'tracker', 'imnetwork', 'enableDarkUI', 'FA2C19', 'FF0F23', 'F27724', 'FF791A',
    '0073FF', 'reward', 'richTextLink', 'sendAck', 'rnReplace', 'rnModuleName', 'nativeId',
    'JDReactUrge', 'monitor', 'privacyPhone', 'mtaMap', 'dbhistory', 'retryLimit', 'mergeCbdata',
    'excodeReport', 'JDSearch', 'domainName', 'coupon', 'slideModule', 'abMtaTest', 'voiceInput',
    'isNewStyle', 'dynDownload', 'skuCountSize', 'clearMemory', 'clearType', 'offset', 'paipai',
    'paimai', 'elinkABTest', 'JDHybrid', '360buy', 'baitiao', 'jcloud', 'yiyaojd', '7fresh',
    'allianz360', 'healthjd', 'jdallianz', 'jdjygold', 'jingxi', 'jkcsjd', 'toplife', 'isvjcloud',
    'thunder', 'stores', 'ranking', 'rankingHome', 'h5platform', 'stable', 'lottery', 'giftcard',
    'tjjt360', 'insurance', 'hunter', '6qMfgJLpI9ZC', 'IiozvTADg', 'introduce', 'wxgrowing',
    'laputa', 'healthcare', 'center', 'jmiOrderList', 'lzkjdz', 'crmcjyy', 'cjhydz', 'mybbphdyh',
    'lzkjhyt', 'prodev', 'rebate', 'language', 'compactMode', 'webViewWidth', '0A0A0A', 'F2F3F5',
    'CEEBF3', 'CF2A1B', 'pNf0pArNw', 'F6D9DD', 'F5F6FA', '2A180E', 'signfree', 'CD0606',
    'jingdou', 'detail', 'BBE24B', 'EF2020', '4E854D', 'joypark', '97DB51', 'plantearth',
    'plantBean', '539F51', 'FF9400', 'static', 'wkClearCache', 'alipays', 'medical', 'minner',
    'ssZipUpgrade', 'dispatchTime', 'UAWebView', 'purchase', 'moreChannelB', 'inspect', 'settle',
    'subsidy', 'jiaofei', 'recharge', 'jdread', 'scontract', 'package', 'pickcard', 'mygiftcard',
    'myFuliIndex', 'bankicon', 'lifeTime', 'function', '20strict', '3Bconst', '22noscript',
    '7Bconst', '3Breturn', 'searchParams', 'append', 'toString', '7Clocation', 'navigator',
    'userAgent', 'toLowerCase', 'indexOf', '22android', 'filter', '3Dwindow', '2CerrMsg',
    '2Cextra', '3AJSON', 'stringify', 'XWebView', 'callNative', '2CJSON', '7Bparams', '22router',
    'routerURL', '3FbizId', '26eventName', '7Bnull', 'routerParam', '7Cvoid', '3Fvoid',
    '26pageName', '3Dsnapshot', '7Bplugin', '2Caction', '2Cparams', '2Csync', '2CcallbackId',
    '7Delse', '7BerrorType', '22active', 'window', 'return', '20window', '3Ddocument',
    'getAttribute', '3DJSON', '3DObject', 'assign', '7Dcatch', '96window', '7Dreturn',
    '2Cwindow', '22script', '20Array', 'attributes', 'forEach', 'setAttribute', 'textContent',
    '3Ffunction', '22textarea', 'innerHTML', '22async', '22link', '22stylesheet', 'crossOrigin',
    '22anonymous', 'appendChild', '3DArray', 'parentNode', 'concat', '7Bhead', '2Cbody',
    '2CheadCSS', '2CbodyCSS', '2CallCSS', '3Dasync', '20Promise', 'onload', 'onerror',
    '2Clocation', '7Bextra', '3Dnull', '3DsetTimeout', '20Error', '2C1500', '7Bdocument',
    '22vconsole', '20void', '2Fstorage', '2Ftower', '2Fbabelnode', '2Feruda', '3Bnull',
    '2Cdocument', '22complete', 'readyState', '3Adocument', '7Breturn', '2Cnull', '3Dlocation',
    '3Alocation', '7Dfinally', '3Dawait', '20fetch', 'location', '7Bsignal', 'signal', 'getItem',
    'removeItem', '3Bwindow', 'setItem', 'replace', '26await', 'length', '3Bbreak', '2Cother',
    'document', 'customcode', '3Bawait', '7Dconst', '3DPromise', 'resolve', '7BjdRouter',
    '7BbizId', '2CeventName', '2CpageName', '22snapshot', '2CmapData', '7Bversion', '20DOMParser',
    '22text', '2Fhtml', 'prefetch', '22preload', 'remove', 'allCSS', 'bodyCSS', 'headCSS',
    '7Bawait', '7BsetTimeout', '22Promise', '882000ms', '5BPromise', '20hrefList', '22hrefList',
    '84Promise', '2Cawait', '22undefined', '3Dtypeof', '3Dstylesheet', '5Bhref', '2CArray',
    'cssText', '22display', '20none', 'replaceChild', 'placeholder', '3BArray', '7BArray',
    'startsWith', '22true', '22noSeating', 'display', '22none', '22seating', 'visibility',
    '22hidden', 'firstChild', 'insertBefore', 'removeChild', '20null', '84Toast', '20function',
    'toastValue', 'position', '3Afixed', '3Bleft', '3Btransform', '3Atranslate', '3Bpadding',
    '3Bbackground', '3Bcolor', '3Awhite', '3Bdisplay', '3Aflex', '3Balign', '3Acenter',
    '3Bjustify', '3Aspace', 'between', '3A1000', '3Bborder', 'radius', 'sizing', '3Aborder',
    '3Bfont', 'weight', '20document', '20toastValue', 'toastElement', '20return', 'A4toast',
    '20clearToast', 'BAtoast', '20showToast', '20event', '20setTimeout', '202000', '20catch',
    '20console', '22onclick', '22showToast', '7Bwindow', '3Dfunction', '20config', 'configString',
    'exposureKey', '20exposure', '20MPing', 'inputs', 'Exposure', '3Bexposure', 'exposure',
    '22jdapp', '3DString', '20Date', '20isIphone', '22iphone', '22ipad', '22xrender', 'isIphone',
    'webkit', '26window', 'JDAppUnite', 'postMessage', '7Bmethod', '7BrenderTime', '7Dwindow',
    '7Bconsole', '2Funify', '22onload', '22window', 'outerHTML', '2CexpireTime', '22save',
    '22load', '3Awindow', '22html', '22rqID', '3DDate', '60HTTP', 'status', '2CdiffTime',
    '3AString', '2Cversion', '2CDate', '7Bdata', '22AbortError', '7Berror', '22fetchSSR',
    '3Belse', '22show', 'errorType', '22position', '3Bbottom', '3A16vw', '3Bwidth', '3Bheight',
    '22padding', '3Bmargin', '23FF0F23', 'onclick', '8EPromise', 'isEnabled', 'timeout',
    'reloadType', 'delayTime', 'Unexpected', 'script', 'JDMarket', 'webAddress', 'delivery',
    'cascade', 'nutrition', 'strategy', 'INSURANCE', 'GIFTCARD', 'PROTOCOL', 'JDReact',
    'JDReactAfs', 'JDReactDNS', 'except', 'quSerial', 'unification', 'addressCache', 'maxCount',
    'serviceInfo', 'serverConfig', 'maxVCCount', 'enableAoi', 'enableCache', 'navVCUp',
    'useSnapView', 'JDOAuth', 'JDOAuthURL', 'kploauth', 'authorize', 'baseinfo', 'useH265Url',
    'fixConfig', 'iOS161NavFix', 'checkSelect', 'zipUpdate', 'ugcPublish', 'BugFix', 'isFixNavBug',
    'ddRegister', 'isShowICloud', 'darkMode', 'coverage', 'openLoc', 'distance', 'shanxian',
    'changchun', 'changgeshi', 'xiamenshi', 'chumiaoxiang', 'shenqiuxian', 'qintongzhen',
    'biyangxian', 'changlequ', 'mianchixian', 'changanzhen', 'changningqu', 'qianweixian',
    'xunxian', 'changqingqu', 'changanqu', 'changshazhen', 'senxian', 'changzhouqu',
    'chashaxian', 'botoushi', 'yulixian', 'changyuanshi', 'shenbeixinqu', 'yanshanxian',
    'shenhequ', 'guobeizhen', 'changzhishi', 'changxindian', 'yueqingshi', 'junlianxian',
    'guoyangxian', 'changshouqu', 'changwuxian', 'biyang', 'panyuqu', 'changshou',
    'changshashi', 'qianxixiang', 'changgouzhen', 'configData', 'contentData', 'serviceId',
    'voiceConfig', '6c44102d', '7c10082d', '5bc44102d', 'maxTime', 'voiceName', 'xiaoqi',
    'vadBos', 'accent', 'mandarin', 'vadEos', 'minTime', 'domain', 'asrPtt', 'hostCity',
    'useNew', 'provinceName', 'provinceId', 'cityName', 'cityId', 'notifyType', 'unplEncode',
    '25257C', '2525257C', 'unionFilter', 'isAvailble', 'unplSwitch', 'unionSwitch', 'useAbTest',
    'useunionsdk', 'unionCookie', 'unplMaxAge', 'keplerConfig', 'cpsToSearch', 'cidName',
    'filterRules', 'jingfen', 'tnFloorId', 'JDEdgeEngine', 'JDEdge', 'exception', 'h5switch',
    'edgeConfig', 'aiModel', 'tabListCache', 'RedPoint', 'sendReq', 'maxSize', 'FindStyle',
    'BVideo', 'allowRefresh', 'xjSkuCardMta', 'clickMta', 'TabCache', 'ShortVideo',
    'xuanjiConfig', 'DegradeReq', 'useNewMapAPI', 'baseInfo', 'PVCounter', 'abTest',
    '900Style', 'is900UIStyle', 'Touch3D', 'quickaction', 'jumpMode', 'needLogin', 'saoasao',
    'orderlist', 'vapptype', 'source', 'currentType', 'logistics', 'express', 'appMyChannel',
    'JDMyJd', 'timeLimiter', 'isClose', 'liveroom', 'webview', 'disableTypes', 'timeOutSec',
    'poolSize', 'poolOpen', 'poolConfigs', 'forceLoad', 'noTipUI', 'scrollEnable', 'configType',
    'webViewType', 'heightType', 'webBackColor', 'FFFFFF', 'fixaudio', 'format', 'player',
    'LiveWebView', 'activityOpen', 'testOpen', 'removeQuery', 'needPreload', 'hPercent',
    'hasLodingUI', 'closeImage', 'chatKey', 'shieldType1', 'shieldType2', 'debugLogOpen',
    'config2509', 'config2409', 'config2504', 'config2503', 'config2501', 'windowHeight',
    'fixScroll', 'useNewUnpl', 'quickPass', 'recQuickPass', 'countReload', 'JDDMNew',
    'recOptimize', 'roomMutiple', 'xViewShow', 'liveHeadPlay', 'windowsuper', 'JoyWorker',
    'minipd', 'countdown', 'autoClose', 'Upload', 'switches', 'cartCheckAll', 'cartRemove',
    'inquiryYddp', 'barterNotice', 'myJingPaiJsf', 'searchOrder', 'cartAdd', 'favoriteList',
    'priceNotify', 'isAppoint', 'wait4Payment', 'takeCoupon', 'feedAction', 'ptLogin',
    'findgoodshop', 'storeContent', 'getShopRule', 'asynInteface', 'myOrderInfo',
    'assembleShop', 'searchWare', 'getFollows', 'newWareList', 'zhangyan1040', 'feedsIndex',
    'productQuery', 'skuDyInfo', 'platApplePay', 'weixin', 'platDFPay', 'jdPayV2', 'applePay',
    'platUnionPay', 'genPayId', 'platWapWXPay', 'platWXGzhPay', 'unionPayV2', 'payIndex',
    'platWXPay', 'platJDPayAcc', 'weixinPay', 'genAppPayId', 'platBestPay', 'bestPay',
    'qqWalletPay', 'weiXinDFPay', 'octopusPay', 'scanCodePay', 'payDollar', 'globalVerify',
    'couponSearch', 'hourReachTab', 'nearbyTab', 'oneboxSearch', 'welcomeHome', 'categoryHome',
    'submitOrder', 'currentOrder', 'wareBusiness', 'NewLogin', 'cartChange', 'configs',
    'downloadPath', 'device', 'security', 'getUrl', 'platform', 'appname', 'detect', 'ejdwgs',
    'ctcni6', 'sw4localsig', 'sw4evainfo', 'webcnf', 'report', 'xview2Config', 'switchQuery',
    'msgConfig', 'hybrid', 'widget', 'XDownloader', 'hotDownload', 'versionCode', 'switchConfig',
    'langSwitch', 'yiyaoguan', 'huishou', 'aihuishou', 'liveMessage', 'common', 'sendAckWS',
    'encryptPin', 'useQuic', 'useSEI', 'JDCart', 'Degrade', 'interface', 'cartSwitch',
    'cartReplace', 'voiceover', 'moreButton', 'accelerate', 'bugfix', 'sheildState', 'inteval',
    'shortenList', 'JDMiaoSha', 'jdssscache', 'JDCDNDomain', 'storage', 'seckill2022',
    'JDBizKey', 'seckill', 'newproduct', 'JDCDNSwitch', 'jdbskprice', 'livelink', 'linkSwitch',
    'feedbackUrl', 'feedbackurl', 'feedback', 'onlineSwitch', 'brDownLoad', 'newRender',
    'pvDataMta', 'routerTo', 'preHotEngine', 'pkgMd5Enable', 'regexList', 'preDownload',
    'localDisable', 'intervalTime', 'commentSmile', 'newStyle', 'homeQingdan', 'babelDark',
    'TTTNewLoad', 'TTTApiColor', 'confirmH5', 'transparent', 'useNewMTab', 'closeFlowMap',
    'realExpo', 'newIconLabel', 'mpdTnInfo', 'tnInfo', 'taroNative', 'jdrecommend', 'zipMd5',
    'zipCdnUrl', 'bamboo', 'projects', 'videoSDKAB', 'homeLayoutAB', 'JDShop', 'searchShop',
    'pageAB', 'coreImg', 'resize', 'h5BlackList', 'isReport', 'liveCartAdCl', 'jdvSmsEnable',
    'sysEnable', 'applet', 'separator', 'recommendsku', 'cvgsku', 'request', 'reduceEnable',
    'verifyEnable', 'verify', 'aoipoiEnable', 'deliver', 'takeDown', 'tagEnable', 'fingerEnable',
    'singleReport', 'langEnable', 'isMaXTime', 'h5ReportV1', 'jdTagEnable', 'isHttp',
    'SearchKey', 'liveid', 'jdmine', 'nearby', 'cdnURL', 'CDNWarmUp', 'ColorEgg', 'JDUpgrade',
    'unifyIcon', 'iconSwitch', 'singleWidget', 'useNewFeture', 'JDCronet', '0rOXDNebC',
    'r8Za2M', '1vNKqEjN', 'KIl66DYjw', 'JQk9lI', 'x0XpG8tTq8z', 'VjH6h1aC', 'vYAK56JX5re',
    'wloginConfig', 'lbsConfig', 'dialingTask', 'endpoint', 'JDShare', 'jcommSwitch',
    'createSwitch', 'imagetools', 'channelSort', 'WhatsApp', 'isJKLDegrade', 'JKLRegex',
    'engRegex', 'cnRegex', 'secKill', 'rating', 'plusMember', 'shangxiang', 'ugcAlbum',
    'pageSize', 'mediaConfig', 'cameraConfig', 'framerate', 'fileSize', 'quality', 'encode',
    'bitrate', 'degradeAlbum', 'JDMiaoSong', 'feekback', 'miniProgram', 'myJDHead', 'degrade',
    'videoExport', 'pagingLoad', 'checkoutEDE', 'regionName', 'iosSystem14', 'redirect',
    'modulename', 'ishidden', 'typeSceneId', 'playerApm', 'reportMTA', 'PlayerPolicy',
    'roiEnable', 'avplayer', 'fileCache', 'authReport', 'grayScale', 'aspBlist', 'playUASwitch',
    'ijkplayer', 'reconnect', 'grayscale', 'cached', 'duration', 'quicpro', 'jdpull', 'jdzbpull',
    'android', 'EMSGSIZE', 'EPROTOTYPE', 'ENOPROTOOPT', 'EOPNOTSUPP', 'EPFNOSUPPORT',
    'EAFNOSUPPORT', 'EADDRINUSE', 'EWOULDBLOCK', 'EAGAIN', 'ENOMEM', 'EACCES', 'EFAULT',
    'EHWPOISON', 'EOWNERDEAD', 'ERFKILL', 'ENOTDIR', 'EISDIR', 'EINVAL', 'ENOSPC', 'EDEADLK',
    'EDEADLOCK', 'ENAMETOOLONG', 'ENOLCK', 'ENOSYS', 'ENOTEMPTY', 'ENOMSG', 'ECHRNG',
    'EL2NSYNC', 'EL3HLT', 'EL3RST', 'ELNRNG', 'EUNATCH', 'ENOCSI', 'EL2HLT', 'EXFULL',
    'ENOANO', 'EBADRQC', 'EBADSLT', 'EBFONT', 'ENOENT', 'ENOSTR', 'ENODATA', 'ENONET',
    'ENOPKG', 'EREMOTE', 'ENOLINK', 'ESRMNT', 'ENETUNREACH', 'ENETDOWN', 'ECONNABORTED',
    'ENETRESET', 'ETOOMANYREFS', 'ESHUTDOWN', 'ENOBUFS', 'ECONNRESET', 'ENOTCONN', 'EISCONN',
    'EPROTO', 'EMULTIHOP', 'EDOTDOT', 'EBADMSG', 'EOVERFLOW', 'ENOTUNIQ', 'EBADFD', 'EREMCHG',
    'ELIBACC', 'EHOSTDOWN', 'ECONNREFUSED', 'EALREADY', 'EHOSTUNREACH', 'ETIMEDOUT', 'ENAVAIL',
    'ESTALE', 'EINPROGRESS', 'ENOTNAM', 'EUCLEAN', 'ELIBBAD', 'ELIBSCN', 'ELIBMAX', 'ELIBEXEC',
    'EILSEQ', 'ERESTART', 'ESTRPIPE', 'EUSERS', 'ENOTSOCK', 'EDESTADDRREQ', 'ENOMEDIUM',
    'EDQUOT', 'ECANCELED', 'EMEDIUMTYPE', 'EREMOTEIO', 'EISNAM', 'EKEYEXPIRED', 'ENOKEY',
    'EKEYREJECTED', 'EKEYREVOKED', 'custom', 'ffmpeg', 'storage1', 'storage2', 'storage3',
    'imgcps', 'imgcps1', 'imgcps2', 'imgcps3', 'statistic', 'dataNum', 'timeSpan',
    'diagnoEnable', 'dnsvipV6', 'hostList', 'imageV6Flag', 'imageDNS', 'avifConfig',
    'avifEnable', 'network', 'httpdns', 'safeIPOpt', 'socketopt', 'dnsvip', 'qpngConfig',
    'moitorEnable', 'Storage', 'ARMakeup', 'maximum', 'minimum', 'preferred', 'enableShake',
    'business', 'engine', 'spaceLimit', 'JDXView', 'TejiaTabTip', 'bubbletip', 'JDLogin',
    'defaultSampl', 'SDKCrashFix1', 'busSkinLogo', 'enDarkUrl', 'enLightUrl', 'newconfig',
    'plogin', 'qtktaHl2k', 'sdkOpen', 'sdkOpenFag', 'saveA2Fix', 'jdxiaojintou', 'jdcloud',
    'jdworldwide', 'duolabao', 'lending51', 'advisor', 'wuliujie', 'marisa6', 'vipmro',
    'ztfsec', 'zhzydtest', 'avictc', '91taogu', 'efivestar', 'qqlinkurl', 'timeStamp',
    'loginDelay', 'hiddenClose', 'gwLogin', 'darkUrl', 'lightUrl', 'code3Enable', 'userSwitch',
    'fakeCookie', 'active', 'authSwitch', 'unreportlist', 'syncIntvl', 'configVer', 'LogoUrl',
    'mobilecal', 'oneclick', 'whiteHosts', 'koHosts', 'divide', 'operator', 'preget',
    'JDPublisher', 'pageSwitch', 'useNewPage', 'VoiceOver', 'isAsync', 'UnusedClass',
    'maxUpload', 'errorCodes', 'getInformBar', 'couponRule', 'shopwebapi', 'ImageConfig',
    'imgUASwitch', 'isMemoryCost', 'netUASwitch', 'dlbEnable', 'ishttps', 'explosive',
    'explData', 'localize', 'TNLoadLimit', 'hotActivity', 'mpdz13', 'compare', 'jingyun',
    'channel', 'surveys', 'poplist', 'uranus', 'answer', 'airtickets', 'interact', 'itunes',
    'shopmember', 'shopjump', 'caract', 'membercard', 'allbuy', 'jingcai', 'dolphin',
    'dolphinId', 'jdbeverage', 'pageKey', 'bizSource', 'xjkJdr', 'rights', 'mobile',
    'chancode', 'recycling', 'guangdong', 'deepal', 'a02066', 'a02065', 'babelChannel',
    'parking', 'venderId', 'scaleId', 'appUnid', 'health', 'tenantUnid', 'activityCode',
    'unstar', 'shopId', 'quanwubaojia', 'mauction', 'authorId', 'kqmfgmrzh7m7', 'hospital',
    'pethospital', 'inquiry', 'drugskuId', 'typeId', 'scopeId', 'quanqiugou', 'ebayIntro',
    'jrpmobile', 'btbullion', 'bullion', 'jinTiaoIndex', 'sysCode', 'sourceLink', 'Fmk7PzULD1A',
    'regPage', 'biguser', 'mirror', 'insCarHome', 'sourceType', 'sccxhb', 'preInquiry',
    'motherBaby', 'blindBox', 'mpshare', 'action', 'partnerCode', 'productCode', 'JDAZXSMZYL',
    'classCode', '48aeabc7', 'market', 'pageId', 'random', 'allowance', 'activityId',
    'landpage', 'iosapp', 'appshare', 'CopyURL', 'jintiao', 'credit', 'account', 'channelName',
    'ppinspect', 'hideProgress', 'qtggtg', 'rankType', 'contentId', 'charger', 'dataMap',
    'bpBarter2', 'bpAdword', 'bpGroup', 'bpblank', 'bpblank26', 'bpblank25', 'bpyxlc',
    'bpSeckill', 'bpkdht', 'bpCertify', 'bpShop', 'bpyxlc14', 'bpnewlx', 'nextFloor',
    'paddingTop', 'bpnewdsj', 'bpName', '3dPreload', 'isFullScreen', 'pdException', 'fzbSDK',
    'fzbConfig', 'lockControl', 'userLogin', 'isUpdatedAoi', 'RSADisable', 'update',
    'JDImageGif', 'imageWidth', 'imageSize', 'gifImageSize', 'imageHeight', 'JDRiskHandle',
    'loginhandle', 'simplify', 'waterStyle', 'E0D000', '90A040', 'loopHandle', 'timeInterval',
    'waterMark', 'sdtokentime', 'pushanimated', 'JDCashier', 'xuanji', 'mPaaSABTest',
    'noLoading', 'XuanjiNotice', 'VideoWXH163', 'novalid', 'middle', 'buriedStr', 'tsabtest',
    'base64', 'JDDynamic', 'events', 'dynRender', 'dynDisplay', 'oldMtaApi', 'uniformity',
    'useSSZip', 'features', 'tagViewFix', 'binaryCache', 'jsCache', 'astCache', 'interval',
    'launch', 'module', 'shareorder', 'attrOptimize', 'reconfirm', 'assetsCache', 'JDMessage',
    'csNewList', 'redpoint', 'ratecontrol', 'periodtime', 'pushguide', 'popUpTimes',
    'requestTimes', 'newmessage', 'newskin', 'downgrade', 'listcellTN', 'stationmsgv2',
    'stationmsgTN', 'FFF0F3', 'preLoad', 'cservice', 'stationmsg', 'smsgctrl', 'LiveActivity',
    'jdpush', 'msgctrl', 'uploadSwitch', 'mtaMixExpo', 'floatingview', 'verctrl', 'remind',
    'controlFlag', 'getssstate', 'getinfostate', 'getvmpstate', 'isjailbreak', 'isroot',
    'gpuinfo', 'xtimestate', '1K2PY8wmEd', 'gfRmSw', 'CpS6EQwzH', 'GERe8eD', 'getvmpaid',
    'JDBMapModule', 'writeSwitch', 'rtcode', 'dtcode', 'slowTime', 'metricEnable',
    'perfMonitor', 'diskEnable', 'SocketConfig', 'SocketGoBack', 'JDNewProduct', 'autoReload',
    'feedSkuStyle', 'secendgo', 'addressFlag', 'uiMode', 'addressType', 'JDPromotion',
    'PRMExposedAB', 'JDCoupon', 'couponTab', 'preStart', 'JDCDSHOP', 'jdshop', 'videoCache',
    'codeReset', 'rnRealse', 'homeHotView', 'scoreView', 'manualScroll', 'shopIds', 'shopModel',
    'rnNewVersion', 'homePage', 'shopHeader', 'useUnifyIcon', 'mobilecms', 'commonConfig',
    'aniVelocity', 'minUpOffset', 'navBarAlpha', 'target', 'visitSpanDay', 'loadTimeOut',
    'timeOutDay', 'visitMax', 'tabbar', 'wrtPage', 'forceBackTop', 'memberPage', 'backToRn',
    'productPage', 'shopDetail', 'pageType', 'webConfig', 'webBounces', 'showLoading',
    'inspectable', 'newProduct', 'stowShop', 'favorite', 'classify', 'shopMember', 'member',
    'homeV2', 'avifSwitch', 'globalOn', 'product', 'isOpen', 'shopModule', 'jumpPlans',
    'isDefault', 'clickSku', 'sourceSku', 'ttt212', 'sourceInfo', 'moduleId', 'entrance',
    'searchList', 'ttt340', 'ttt341', 'ttt342', 'ttt343', 'cartList', 'ttt352', 'orderList',
    'ttt353', 'orderDetail', 'ttt354', 'jwebprog', 'hideNavi', 'JDZstd', 'JDStartupMta',
    'degradeUrl', 'isOpenV3', 'pingou', 'v3JumpUrl', 'checkoutH5', 'wqdeal', 'appredirect',
    'JDCrash', 'crashType', 'TNUnionFetch', 'jdhome', 'LBSwitcher', 'failure', 'PageOff',
    'MainImageOff', 'darkSwitch', 'babelDiy', 'systemId', 'businessId', 'subPosition', 'button',
    'traffic', 'Please', 'SPMEnable', 'hasReward', 'hasNoReward', 'shshshfpx'
  ];
  return Array.from(new Set(arr)).filter(id => /^\d+$/.test(id) && id.length >= 9);
}

(function () {
  try {
    let requestUrl = $request.url;
    let responseBody = $response.body;

    // 检查 Cookie 中的 warehistory
    if ($request && $request.headers && $request.headers['Cookie']) {
      let cookies = $request.headers['Cookie'];
      let wareHistoryMatch = cookies.match(/warehistory=([^;]+)/);
      if (wareHistoryMatch) {
        let wareHistory = wareHistoryMatch[1].replace(/"/g, '');
        let skus = findNumbersInText(wareHistory, 6, 12);
        if (skus.length) {
          console.log('【jd_sku_debug】在 Cookie warehistory 中找到可能的 SKU：' + skus.join(','));
          $notify('JD SKU 调试', 'Cookie warehistory 中找到 SKU', skus.slice(0, 5).join(','));
          foundItems = foundItems.concat(skus.map(sku => ({ path: 'Cookie.warehistory', value: sku })));
        }
      }
    }

    // 检查请求头
    if ($request && $request.headers) {
      let headersStr = JSON.stringify($request.headers);
      let nums = findNumbersInText(headersStr, 6, 12);
      let alphaNums = findAlphanumericIds(headersStr, 6, 12);
      if (nums.length || alphaNums.length) {
        console.log('【jd_sku_debug】在 request headers 中找到可能的数字：' + nums.join(','));
        console.log('【jd_sku_debug】在 request headers 中找到可能的字母数字ID：' + alphaNums.join(','));
        $notify('JD SKU 调试', 'request headers 中可能的 ID', `数字: ${nums.slice(0, 5).join(',')}, 字母数字: ${alphaNums.slice(0, 5).join(',')}`);
        foundItems = foundItems.concat(nums.filter(num => num.length >= 9).map(num => ({ path: 'request.headers', value: num })));
        foundItems = foundItems.concat(alphaNums.filter(id => /^\d+$/.test(id) && id.length >= 9).map(id => ({ path: 'request.headers.alphanumeric', value: id })));
      }
    }

    // 检查请求查询参数
    try {
      let urlObj = new URL(requestUrl);
      let queryParams = urlObj.searchParams;
      let queryStr = queryParams.toString();
      let nums = findNumbersInText(queryStr, 6, 12);
      let alphaNums = findAlphanumericIds(queryStr, 6, 12);
      if (nums.length || alphaNums.length) {
        console.log('【jd_sku_debug】在 request query 参数中找到数字：' + nums.join(','));
        console.log('【jd_sku_debug】在 request query 参数中找到字母数字ID：' + alphaNums.join(','));
        $notify('JD SKU 调试', 'request query 中可能的 ID', `数字: ${nums.slice(0, 5).join(',')}, 字母数字: ${alphaNums.slice(0, 5).join(',')}`);
        foundItems = foundItems.concat(nums.filter(num => num.length >= 9).map(num => ({ path: 'request.query', value: num })));
        foundItems = foundItems.concat(alphaNums.filter(id => /^\d+$/.test(id) && id.length >= 9).map(id => ({ path: 'request.query.alphanumeric', value: id })));
      }

      // 检查 body 参数（可能编码）
      let bodyParam = queryParams.get('body') || '';
      if (bodyParam) {
        let dec = decodeURIComponent(bodyParam);
        let j1 = tryParseJSON(dec);
        if (j1) {
          let found = findKeysRecursively(j1, ['skuid', 'wareid', 'productid', 'itemid', 'goodsid', 'sku', 'id', 'ware', 'item', 'product'].map(k => k.toLowerCase()));
          if (found.length) {
            console.log('【jd_sku_debug】在 request.body(JSON) 中找到：', JSON.stringify(found));
            $notify('JD SKU 调试', 'request.body(JSON) 找到 SKU', JSON.stringify(found.slice(0, 5)));
            foundItems = foundItems.concat(found);
          }
        }
        let nums = findNumbersInText(dec, 6, 12);
        let alphaNums = findAlphanumericIds(dec, 6, 12);
        if (nums.length || alphaNums.length) {
          console.log('【jd_sku_debug】在 request body 参数中找到数字：' + Array.from(new Set(nums)).slice(0, 6).join(','));
          console.log('【jd_sku_debug】在 request body 参数中找到字母数字ID：' + Array.from(new Set(alphaNums)).slice(0, 6).join(','));
          $notify('JD SKU 调试', 'request body 中可能的 ID', `数字: ${Array.from(new Set(nums)).slice(0, 6).join(',')}, 字母数字: ${Array.from(new Set(alphaNums)).slice(0, 6).join(',')}`);
          foundItems = foundItems.concat(nums.filter(num => num.length >= 9).map(num => ({ path: 'request.body', value: num })));
          foundItems = foundItems.concat(alphaNums.filter(id => /^\d+$/.test(id) && id.length >= 9).map(id => ({ path: 'request.body.alphanumeric', value: id })));
        }
      }
    } catch (e) {
      console.log('【jd_sku_debug】解析 request query 或 body 出错：' + e);
    }

    // 检查响应体
    let body = tryParseJSON(responseBody);
    if (body) {
      let found = findKeysRecursively(body, ['skuid', 'wareid', 'productid', 'itemid', 'goodsid', 'sku', 'id', 'ware', 'item', 'product'].map(k => k.toLowerCase()));
      if (found.length) {
        console.log('【jd_sku_debug】在 response body(JSON) 中找到：', JSON.stringify(found));
        $notify('JD SKU 调试', 'response body(JSON) 找到 SKU', JSON.stringify(found.slice(0, 5)));
        foundItems = foundItems.concat(found);
      }
    }

    let nums = findNumbersInText(responseBody, 6, 12);
    let alphaNums = findAlphanumericIds(responseBody, 6, 12);
    if (nums.length || alphaNums.length) {
      console.log('【jd_sku_debug】在 response body 中找到数字：' + Array.from(new Set(nums)).slice(0, 6).join(','));
      console.log('【jd_sku_debug】在 response body 中找到字母数字ID：' + Array.from(new Set(alphaNums)).slice(0, 6).join(','));
      $notify('JD SKU 调试', 'response body 中可能的 ID', `数字: ${Array.from(new Set(nums)).slice(0, 6).join(',')}, 字母数字: ${Array.from(new Set(alphaNums)).slice(0, 6).join(',')}`);
      foundItems = foundItems.concat(nums.filter(num => num.length >= 9).map(num => ({ path: 'response.body', value: num })));
      foundItems = foundItems.concat(alphaNums.filter(id => /^\d+$/.test(id) && id.length >= 9).map(id => ({ path: 'response.body.alphanumeric', value: id })));
    }

    // 汇总输出
    if (foundItems.length) {
      console.log('【jd_sku_debug】汇总找到的 SKU：', JSON.stringify(foundItems, null, 2));
      $notify('JD SKU 调试', '汇总找到的 SKU', JSON.stringify(foundItems.slice(0, 5), null, 2));
      $done({ body: responseBody });
      return;
    } else {
      console.log('【jd_sku_debug】未找到任何 SKU');
      $notify('JD SKU 调试', '未找到 SKU', '请检查 API 或日志');
      $done({ body: responseBody });
    }
  } catch (e) {
    console.log('【jd_sku_debug】脚本执行出错：' + e);
    $notify('JD SKU 调试', '脚本错误', String(e));
    $done({ body: $response.body });
  }
})();
