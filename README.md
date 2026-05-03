🛡️ iStoreOS Telegram 防骚扰网关 (dm-gateway) 全攻略
这份方案是目前最完整的版本，它解决了你之前遇到的路径错误、依赖安装失败以及网络连接等所有“坑”。
第一步：创建代码文件
在 iStoreOS 的终端（Terminal）中，按顺序执行以下命令：
1:创建专属文件夹：mkdir -p ~/dm-bot && cd ~/dm-bot
2:写入机器人代码：
使用 cat 命令直接将代码写入文件（请直接复制下面整段代码并在终端粘贴）：cat <<EOF > bot.py
import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes
import random

# 从环境变量获取配置
TOKEN = os.getenv("BOT_TOKEN")
OWNER_ID = int(os.getenv("OWNER_ID"))

# 日志设置
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# 存储已验证用户
verified_users = set()

# 表情包验证码库
EMOJI_POOL = ['🍎', '🐱', '🚗', '🚀', '🌈', '🍦', '🎸', '🏀']

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if user_id == OWNER_ID:
        await update.message.reply_text("欢迎回来，主人！我是您的私聊网关。")
        return

    if user_id in verified_users:
        await update.message.reply_text("您已通过验证，可以直接发送消息。")
    else:
        target_emoji = random.choice(EMOJI_POOL)
        context.user_data['captcha'] = target_emoji

        # 生成干扰选项
        options = random.sample([e for e in EMOJI_POOL if e != target_emoji], 3)
        options.append(target_emoji)
        random.shuffle(options)

        keyboard = [[InlineKeyboardButton(e, callback_query_data=e) for e in options]]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            f"您好！为了防止骚扰，请点击下方的 {target_emoji} 按钮完成验证：",
            reply_markup=reply_markup
        )

async def handle_captcha(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    user_id = query.from_user.id
    selected_emoji = query.data
    correct_emoji = context.user_data.get('captcha')

    if selected_emoji == correct_emoji:
        verified_users.add(user_id)
        await query.answer("验证通过！")
        await query.edit_message_text("验证成功！现在您可以发送消息了，我会为您转达。")
    else:
        await query.answer("验证失败，请重新输入 /start", show_alert=True)

async def forward_to_owner(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if user_id == OWNER_ID:
        return

    if user_id in verified_users:
        # 转发消息给主人
        await context.bot.send_message(
            chat_id=OWNER_ID,
            text=f"来自 @{update.effective_user.username} (ID: {user_id}) 的消息：\n\n{update.message.text}"
        )
        await update.message.reply_text("消息已转发给主人。")
    else:
        await update.message.reply_text("请先输入 /start 完成验证。")

def main():
    print("Bot 正在运行...")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(handle_captcha))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, forward_to_owner))
    app.run_polling()

if __name__ == '__main__':
    main()
EOF

第二步：一键启动 Docker 容器
这是最关键的步骤，使用了绝对路径挂载和国内镜像加速。
请替换下面命令中的 TOKEN 和 ID：docker run -d \
  --name dm-gateway \
  -v /root/dm-bot/bot.py:/bot.py \
  -e BOT_TOKEN="你的_BOT_TOKEN_在这里" \
  -e OWNER_ID="你的_数字_ID_在这里" \
  --restart unless-stopped \
  python:3.11-slim \
  sh -c "pip install python-telegram-bot -i https://pypi.tuna.tsinghua.edu.cn/simple && python /bot.py"
第三步：小白排错指南（必看）
如果机器人没反应，请按照这个顺序检查：
1.	检查是否在跑：
输入 docker ps。如果 dm-gateway 状态是 Restarting，通常是代码写错了或 Token 填错了。
2.	查看报错日志：
输入 docker logs -f dm-gateway。如果看到 Forbidden，检查 Token；如果看到 Timeout，检查路由器的科学上网插件。
3.	网络检查（针对 iStoreOS 用户）：
在 PassWall / OpenClash 插件设置里，确保 “代理本机流量” 是开启状态。如果 Docker 容器无法出海，机器人永远无法上线。
第四步：常用维护命令
• 修改代码后重启：docker restart dm-gateway
• 查看谁发了消息：docker logs dm-gateway
• 彻底卸载机器人：docker rm -f dm-gateway
