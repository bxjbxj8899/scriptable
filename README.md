# Telegram 私聊防骚扰网关 (dm-gateway)

专门为 iStoreOS / 路由 Docker 环境优化的 Telegram 私聊过滤机器人。支持 Emoji 验证码挑战，有效拦截机器骚扰。

## 🚀 快速部署 (iStoreOS 专用)

只需以下三步，即可在您的路由器上完成部署：

### 1. 创建工作目录
```bash
mkdir -p ~/dm-bot && cd ~/dm-bot
2. 写入核心脚本
直接复制并执行以下整段命令：cat <<EOF> bot.py
import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes
import random

TOKEN = os.getenv("BOT_TOKEN")
OWNER_ID = int(os.getenv("OWNER_ID"))

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

verified_users = set()
EMOJI_POOL = ['🍎', '🐱', '🚗', '🚀', '🌈', '🍦', '🎸', '🏀']

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if user_id == OWNER_ID:
        await update.message.reply_text("欢迎回来，主人！")
        return
    if user_id in verified_users:
        await update.message.reply_text("您已通过验证。")
    else:
        target_emoji = random.choice(EMOJI_POOL)
        context.user_data['captcha'] = target_emoji
        options = random.sample([e for e in EMOJI_POOL if e != target_emoji], 3)
        options.append(target_emoji)
        random.shuffle(options)
        keyboard = [[InlineKeyboardButton(e, callback_query_data=e) for e in options]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text(f"请点击 {target_emoji} 完成验证：", reply_markup=reply_markup)

async def handle_captcha(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if query.data == context.user_data.get('captcha'):
        verified_users.add(query.from_user.id)
        await query.answer("验证通过！")
        await query.edit_message_text("验证成功！现在您可以发送消息了。")
    else:
        await query.answer("验证失败，请重新 /start", show_alert=True)

async def forward_to_owner(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER_ID and update.effective_user.id in verified_users:
        await context.bot.send_message(chat_id=OWNER_ID, text=f"来自 @{update.effective_user.username} 的消息：\n\n{update.message.text}")
        await update.message.reply_text("消息已转发。")

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(handle_captcha))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, forward_to_owner))
    app.run_polling()

if __name__ == '__main__':
    main()
EOF

3:启动容器
注意： 请将其中的 你的TOKEN 和 你的ID 替换为真实信息。docker run -d \
  --name dm-gateway \
  -v /root/dm-bot/bot.py:/bot.py \
  -e BOT_TOKEN="你的_BOT_TOKEN" \
  -e OWNER_ID="你的_数字_ID" \
  --restart unless-stopped \
  python:3.11-slim \
  sh -c "pip install python-telegram-bot -i [https://pypi.tuna.tsinghua.edu.cn/simple](https://pypi.tuna.tsinghua.edu.cn/simple) && python /bot.py"

🛠️ 常用命令
• 查看日志：docker logs -f dm-gateway
• 重启服务：docker restart dm-gateway
• 停止服务：docker stop dm-gateway
