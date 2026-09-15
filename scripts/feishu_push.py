#!/usr/bin/env python3
"""
飞书推送脚本
用于每日学习任务提醒、复习提醒、每周周报

用法:
    python feishu_push.py daily    # 每日任务提醒
    python feishu_push.py review   # 复习提醒
    python feishu_push.py weekly   # 每周周报
"""

import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, timedelta


def send_feishu_message(webhook, msg_type, content):
    """发送飞书消息"""
    if not webhook:
        print("错误: 未配置飞书 Webhook")
        return False
    
    data = json.dumps({
        "msg_type": msg_type,
        "content": content
    }).encode('utf-8')
    
    req = urllib.request.Request(
        webhook,
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            if result.get('code') == 0 or result.get('StatusCode') == 0:
                return True
            else:
                print(f"飞书推送失败: {result}")
                return False
    except Exception as e:
        print(f"飞书推送异常: {e}")
        return False


def build_daily_reminder(stats, package_title):
    """构建每日任务提醒消息"""
    today = datetime.now().strftime("%Y年%m月%d日")
    weekday_names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    weekday = weekday_names[datetime.now().weekday()]
    
    text = f"""📚 今日学习任务
━━━━━━━━━━━━━━━
📅 {today} {weekday}
📖 学习包: {package_title}

📊 今日任务:
• 待复习: {stats.get('due_today', 0)} 个单词
• 建议新学: {stats.get('daily_new', 50)} 个单词
• 预计用时: 约 20 分钟

🎯 学习进度:
• 已掌握: {stats.get('mastered', 0)} / {stats.get('total', 0)}
• 完成度: {stats.get('progress', 0)}%

🔥 连续打卡: {stats.get('streak', 0)} 天

加油！坚持就是胜利 💪"""
    
    return text


def build_review_reminder(due_count, package_title):
    """构建复习提醒消息"""
    text = f"""🔔 复习提醒
━━━━━━━━━━━━━━━
📖 {package_title}

今天有 {due_count} 个单词需要复习
花 10 分钟回顾一下吧！

记忆的黄金法则：
• 间隔复习比临时突击更有效
• 快要忘记时复习效果最好
• 每次成功回忆都会让记忆更牢固"""
    
    return text


def build_weekly_report(weekly_data):
    """构建每周学习报告"""
    text = f"""📊 本周学习周报
━━━━━━━━━━━━━━━
📅 {weekly_data.get('week_range', '')}

📈 本周数据:
• 学习天数: {weekly_data.get('study_days', 0)} / 7 天
• 学习单词: {weekly_data.get('total_learned', 0)} 个
• 完成测验: {weekly_data.get('quiz_count', 0)} 次
• 平均正确率: {weekly_data.get('avg_accuracy', 0)}%

🔥 连续打卡: {weekly_data.get('streak', 0)} 天
🏆 最长连续: {weekly_data.get('max_streak', 0)} 天

🎯 掌握进度:
• 已掌握: {weekly_data.get('mastered', 0)} 个
• 学习中: {weekly_data.get('learning', 0)} 个
• 完成度: {weekly_data.get('progress', 0)}%

{'🎉 太棒了，继续保持！' if weekly_data.get('study_days', 0) >= 5 else '💪 下周继续加油！'}"""
    
    return text


def main():
    if len(sys.argv) < 2:
        print("用法: python feishu_push.py [daily|review|weekly]")
        sys.exit(1)
    
    push_type = sys.argv[1]
    
    # 从配置文件读取
    config_path = '/workspace/study-app/data/push_config.json'
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except FileNotFoundError:
        print("请先配置 push_config.json")
        sys.exit(1)
    
    webhook = config.get('feishu_webhook', '')
    if not webhook:
        print("请先配置飞书 Webhook")
        sys.exit(1)
    
    if push_type == 'daily':
        # 每日任务提醒
        stats = config.get('stats', {})
        package_title = config.get('package_title', 'CET-6 核心词汇')
        text = build_daily_reminder(stats, package_title)
        send_feishu_message(webhook, 'text', {"text": text})
        print("每日任务提醒已发送")
    
    elif push_type == 'review':
        # 复习提醒
        due_count = config.get('stats', {}).get('due_today', 0)
        package_title = config.get('package_title', 'CET-6 核心词汇')
        if due_count > 0:
            text = build_review_reminder(due_count, package_title)
            send_feishu_message(webhook, 'text', {"text": text})
            print("复习提醒已发送")
        else:
            print("今天没有需要复习的内容，跳过")
    
    elif push_type == 'weekly':
        # 每周周报
        weekly_data = config.get('weekly_data', {})
        text = build_weekly_report(weekly_data)
        send_feishu_message(webhook, 'text', {"text": text})
        print("每周报告已发送")
    
    else:
        print(f"未知类型: {push_type}")
        sys.exit(1)


if __name__ == '__main__':
    main()
