// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: magic;
// 10099 小号小组件（剩余量显示 / 进度条百分比 / 实时拉取 / 机密信息安全存储）
// ✅ 你的布局参数：PADDING_H=1, CONTENT_WIDTH=150, BAR_HEIGHT=14

/************** 可选开关 **************/
const RESET_SECRETS = false;  // ← 想更换/重置账号，把它改为 true 运行一次；之后改回 false
const REFRESH_MINUTES = 60;   // 自动刷新周期（分钟）
const SHOW_SETUP_TIPS = true; // 首次未配置时，在组件里提示“点我配置”

/************** 接口固定信息（非个人） **************/
const FETCH_URL = "https://wx.10099.com.cn/contact-web/api/busi/qryUserInfo";
const METHOD = "POST";
// 这些头不是个人敏感信息，一般保持这样（需要保持 WeChat UA/Referer）
const COMMON_HEADERS = {
  "content-type": "application/json",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.62(0x18003e39) NetType/WIFI Language/zh_CN",
  "Referer": "https://servicewechat.com/wxfa72ff5488bbd1d9/120/page-frame.html",
  "Accept-Encoding": "gzip,compress,br,deflate"
};

/************** 你的布局数值（按你要求已设置） **************/
const PADDING_H = 1;        // 左右极窄安全边（更贴边，若被裁可调到 4~6）
const CONTENT_WIDTH = 150;  // 统一内容宽度（行/进度条都用它）
const BAR_HEIGHT = 14;      // 进度条高度

/************** 字体与颜色 **************/
function getTheme() {
  const hour = new Date().getHours()
  const night = (hour >= 18 || hour < 6)

  return {
    bg:     new Color(night ? "#0b0e13" : "#FAF3E0"), 
    text:   new Color(night ? "#FFD700" : "#222222"), 
    sub:    new Color(night ? "#C0C0C0" : "#555555"), 
    barBg:  new Color(night ? "#333333" : "#DDDDDD"),
    flow:   new Color("#DAA520"), 
    voice:  new Color("#FFB800"), 
    warn:   new Color("#FFA500"), 
    err:    new Color("#FF6347"), 
    pctText:new Color(night ? "#FFD700" : "#222222")
  }
}

const THEME = getTheme()

/************** 字体大小 **************/
const FONT_TITLE = 15,
      FONT_BAL_L = 11,
      FONT_BAL_V = 13,
      FONT_ROW_L = 12,
      FONT_ROW_V = 12,
      FONT_FOOT  = 10,
      FONT_PCT   = 11;

/************** 进度以“剩余”为准 **************/
const PROGRESS_BY = "remaining"; // 固定显示“剩余比例”

/************** Keychain 存储（安全保存机密） **************/
const KC_PREFIX = "10099.";
function kcKey(name){ return KC_PREFIX + name; }
function getSecret(name){ try{ return Keychain.contains(kcKey(name)) ? Keychain.get(kcKey(name)) : null; }catch{ return null; } }
function setSecret(name, value){ try{ Keychain.set(kcKey(name), value ?? ""); return true; }catch{ return false; } }
function delSecret(name){ try{ if(Keychain.contains(kcKey(name))) Keychain.remove(kcKey(name)); }catch{} }

async function ensureSecrets(){
  if (RESET_SECRETS){
    ["Session","Access","BodyData"].forEach(delSecret);
  }
  let Session = getSecret("Session");
  let Access  = getSecret("Access");
  let BodyData= getSecret("BodyData");

  if (Session && Access && BodyData) {
    return { Session, Access, BodyData };
  }

  // 首次或重置后：弹窗引导填写
  const a = new Alert();
  a.title = "配置 10099 接口机密";
  a.message = "请从抓包里复制粘贴：\n1) Session 请求头值\n2) Access 请求头值\n3) 请求体中的 data（整段 Base64 文本）";
  a.addTextField("Session", Session ?? "");
  a.addTextField("Access",  Access ?? "");
  a.addTextField("data（Base64）", BodyData ?? "");
  a.addAction("保存");
  a.addCancelAction("取消");
  const idx = await a.present();
  if (idx === -1) {
    // 用户取消
    return null;
  }
  Session = a.textFieldValue(0).trim();
  Access  = a.textFieldValue(1).trim();
  BodyData= a.textFieldValue(2).trim();
  if (!Session || !Access || !BodyData) return null;

  setSecret("Session", Session);
  setSecret("Access", Access);
  setSecret("BodyData", BodyData);
  return { Session, Access, BodyData };
}

/************** 工具函数 **************/
let OPEN_URL = "https://app.10099.com.cn/h5-app/#/pages/meal/packQuery/index";
function kbToGB(kb, d=1){ if(kb==null) return "-"; return (kb/(1024*1024)).toFixed(d)+"GB"; }
function clamp01(x){ return Math.max(0, Math.min(1, x)); }
function pct(n,d){ if(!d) return 0; return clamp01(Number(n)/Number(d)); }
function fen2yuan(fen){ if(fen==null) return "-"; return (Number(fen)/100).toFixed(2); }
function icloudFile(name){ const fm = FileManager.iCloud(); return fm.joinPath(fm.documentsDirectory(), name); }
async function saveCache(obj){ FileManager.iCloud().writeString(icloudFile("10099_small_cache.json"), JSON.stringify(obj)); }
async function loadCache(){ const fm=FileManager.iCloud(); const p=icloudFile("10099_small_cache.json"); if(!fm.fileExists(p)) return null; try{ if(fm.isFileStoredIniCloud(p)) await fm.downloadFileFromiCloud(p); return JSON.parse(fm.readString(p)); }catch{ return null; } }

/************** 拉取实时数据（用 Keychain 中的机密） **************/
async function fetchData(secrets){
  try{
    const req = new Request(FETCH_URL);
    req.method = METHOD;
    req.timeoutInterval = 12;
    req.headers = {
      ...COMMON_HEADERS,
      "Session": secrets.Session,
      "Access":  secrets.Access
    };
    req.body = JSON.stringify({ data: secrets.BodyData });
    const json = await req.loadJSON();
    await saveCache(json);
    return {json, fromCache:false};
  }catch(e){
    const cache = await loadCache();
    if(cache) return {json: cache, fromCache:true, error: String(e)};
    return {json: null, fromCache:false, error: String(e)};
  }
}

async function loadLogo(u){ try{ return await new Request(u).loadImage(); }catch{ try{ return await new Request("https://m.10099.com.cn/gwecdq/qiuti20230807.png").loadImage(); }catch{ return null; } } }
function parsePayload(j){
  const ud=j?.data?.userData??{}, rules=ud.rules||{};
  const flowUrl=(rules.flowBalance||"").replace(/^needLogin=/,""); if(flowUrl) OPEN_URL=flowUrl;

  const pack=ud.packName||"惠民卡", feeStr=ud.finBalance??(ud.fee!=null?fen2yuan(ud.fee):"-");

  const flowAll=+ud.flowAll||0, flowUsed=+ud.flowUserd||0, flowLeft=+(ud.flow??Math.max(0,flowAll-flowUsed));
  const voiceAll=+ud.voiceAll||0, voiceUsed=+ud.voiceUsed||0, voiceLeft=+(ud.voice??Math.max(0,voiceAll-voiceUsed));

  // 进度显示：剩余比例
  const flowRatio  = pct(flowLeft,  flowAll);
  const voiceRatio = pct(voiceLeft, voiceAll);

  return {pack, feeStr, flowAll, flowUsed, flowLeft, flowRatio, voiceAll, voiceUsed, voiceLeft, voiceRatio, iconUrl: ud.iconImg || ""};
}

/************** 百分比进度条（高清） **************/
function drawBarWithPercent(width, height, ratio, fgColor, bgColor){
  const dc=new DrawContext(); dc.size=new Size(width,height); dc.opaque=false;
  if(dc.respectScreenScale!==undefined) dc.respectScreenScale=true;
  dc.setFillColor(bgColor); dc.fillRect(new Rect(0,0,width,height));
  const fillW=Math.max(2, Math.floor(width*clamp01(ratio)));
  dc.setFillColor(fgColor); dc.fillRect(new Rect(0,0,fillW,height));
  const percent=Math.round(clamp01(ratio)*100);
  dc.setFont(Font.boldSystemFont(FONT_PCT)); dc.setTextColor(THEME.pctText);
  if(dc.setTextAlignedCenter) dc.setTextAlignedCenter();
  dc.drawTextInRect(`${percent}%`, new Rect(0,0,width,height));
  return dc.getImage();
}

/************** 统一内容容器（左右贴边但保留极小安全边） **************/
function addContentRow(parent, topPad=0){
  const wrap = parent.addStack(); wrap.layoutHorizontally(); wrap.setPadding(topPad, PADDING_H, 0, PADDING_H);
  wrap.addSpacer();
  const row = wrap.addStack(); row.layoutHorizontally(); row.size = new Size(CONTENT_WIDTH, 0);
  wrap.addSpacer();
  return row;
}

/************** 构建组件 **************/
async function createWidget(p, fromCache=false, secretsMissing=false){
  const w=new ListWidget(); w.backgroundColor=THEME.bg; w.url=OPEN_URL;
  w.refreshAfterDate = new Date(Date.now()+REFRESH_MINUTES*60*1000);
  w.setPadding(0,0,0,0);

  // 顶部（居中）
  const topWrap=w.addStack(); topWrap.layoutHorizontally(); topWrap.setPadding(8,PADDING_H,0,PADDING_H);
  topWrap.addSpacer();
  const top=topWrap.addStack(); top.layoutHorizontally(); top.centerAlignContent(); top.spacing=6;
  const logo=await loadLogo(p.iconUrl || "https://m.10099.com.cn/gwecdq/qiuti20230807.png");
  if(logo){ const im=top.addImage(logo); im.imageSize=new Size(20,20); im.cornerRadius=4; }
  const name=top.addText("广电"+p.pack); name.font=Font.boldSystemFont(FONT_TITLE); name.textColor=THEME.text;
  topWrap.addSpacer();

  // 若未配置机密，给出可点提示（避免桌面空白）
  if (secretsMissing && SHOW_SETUP_TIPS){
    const tipRow = addContentRow(w, 6);
    const tip = tipRow.addText("⚙️ 点开脚本 → 粘贴 Session / Access / data 完成配置");
    tip.font = Font.systemFont(10); tip.textColor = THEME.warn;
    w.url = "scriptable:///run/" + encodeURIComponent(Script.name()); // 点组件直接打开脚本进行配置
  }

  // 余额
  const feeRow = addContentRow(w, 2);
  const feeLabel = feeRow.addText("话费余额 "); feeLabel.font=Font.mediumSystemFont(FONT_BAL_L); feeLabel.textColor=THEME.sub;
  const feeVal = feeRow.addText("¥"+p.feeStr); feeVal.font=Font.boldSystemFont(FONT_BAL_V); feeVal.textColor=THEME.text;

  // 流量（显示：剩余/总量，右对齐）
  const flowRow = addContentRow(w, 5);
  const fL = flowRow.addText("流量"); fL.font=Font.mediumSystemFont(FONT_ROW_L); fL.textColor=THEME.sub;
  flowRow.addSpacer();
  const fR = flowRow.addText(`${kbToGB(p.flowLeft,1)}/${kbToGB(p.flowAll,1)}`);
  fR.font=Font.boldSystemFont(FONT_ROW_V); fR.textColor=THEME.text;

  const flowBarWrap = addContentRow(w, 2);
  const flowImg = drawBarWithPercent(CONTENT_WIDTH, BAR_HEIGHT, p.flowRatio, THEME.flow, THEME.barBg);
  const flowBar = flowBarWrap.addImage(flowImg); flowBar.imageSize = new Size(CONTENT_WIDTH, BAR_HEIGHT); flowBar.cornerRadius = BAR_HEIGHT/2;

  // 语音（显示：剩余/总量，右对齐）
  const voiceRow = addContentRow(w, 6);
  const vL = voiceRow.addText("语音"); vL.font=Font.mediumSystemFont(FONT_ROW_L); vL.textColor=THEME.sub;
  voiceRow.addSpacer();
  const vR = voiceRow.addText(`${p.voiceLeft}/${p.voiceAll} 分钟`);
  vR.font=Font.boldSystemFont(FONT_ROW_V); vR.textColor=THEME.text;

  const voiceBarWrap = addContentRow(w, 2);
  const voiceImg = drawBarWithPercent(CONTENT_WIDTH, BAR_HEIGHT, p.voiceRatio, THEME.voice, THEME.barBg);
  const voiceBar = voiceBarWrap.addImage(voiceImg); voiceBar.imageSize = new Size(CONTENT_WIDTH, BAR_HEIGHT); voiceBar.cornerRadius = BAR_HEIGHT/2;

  // 底部
  const foot = addContentRow(w, 6);
  const now=new Date(); const hh=String(now.getHours()).padStart(2,"0"), mm=String(now.getMinutes()).padStart(2,"0");
  const ts=foot.addText(`更新 ${hh}:${mm}${fromCache?" · 缓存":" · 实时"}`); ts.font=Font.systemFont(FONT_FOOT); ts.textColor=THEME.sub;

  return w;
}

/************** 主流程 **************/
(async ()=>{
  const secrets = await ensureSecrets();
  if(!secrets){
    // 未配置：用空数据构建提示型组件
    const p = { pack:"惠民卡", feeStr:"--", flowLeft:0, flowAll:1, flowRatio:0, voiceLeft:0, voiceAll:1, voiceRatio:0, iconUrl:"" };
    const w = await createWidget(p, false, true);
    if(config.runsInWidget){ Script.setWidget(w); Script.complete(); } else { w.presentSmall(); }
    return;
  }

  const {json, fromCache} = await fetchData(secrets);
  if(!json){
    const w=new ListWidget(); w.backgroundColor=THEME.bg;
    const t=w.addText("拉取失败，且无缓存"); t.textColor=THEME.err; t.font=Font.boldSystemFont(12);
    w.refreshAfterDate = new Date(Date.now()+REFRESH_MINUTES*60*1000);
    if(config.runsInWidget){ Script.setWidget(w); Script.complete(); } else { w.presentSmall(); }
  }else{
    const p=parsePayload(json);
    const w=await createWidget(p, fromCache, false);
    if(config.runsInWidget){ Script.setWidget(w); Script.complete(); } else { w.presentSmall(); }
  }
})();