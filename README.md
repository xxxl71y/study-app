# 📚 AI 学习助手

> 基于间隔重复算法的极简学习工具，支持自定义学习包、错题本、智能推荐和飞书推送。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-在线演示-brightgreen)](https://xxxl71y.github.io/study-app/)
[![Version](https://img.shields.io/badge/version-2.0-blue.svg)]()

---

## ✨ 功能特性

### 🎯 智能推荐系统
- **优先级算法**：错题 > 到期复习 > 新学 > 测验
- 根据学习状态自动推荐今日最该做的事
- 每日进度圆环，一目了然

### 🔄 间隔重复记忆
- 基于 **SM-2 算法**（SuperMemo 2）科学安排复习
- 四档评分：😵 忘了 / 😓 有点难 / 😊 记住了 / 🤩 太简单
- 自动计算下次复习时间，越记越牢

### ❌ 智能错题本
- 答错自动收录，答对自动移除
- 记录错题来源（学习/复习/测验）
- 支持手动删除

### 📝 测验系统
- 四选一选择题，从已学单词中随机抽题
- 即时反馈，答错自动加入错题本
- 结束后显示得分和详细统计

### 🔥 学习激励
- **连续打卡** streak 统计
- 最长连续天数记录
- 学习阶段追踪（入门 → 进阶 → 深化 → 冲刺 → 复习巩固）

### 📦 通用学习框架
- 内置 **CET-6 核心词汇**（1768 词）
- 支持导入自定义学习包（JSON 格式）
- 适用于词汇、知识点、面试题等各种内容

### 🔔 飞书推送
- 每日学习任务提醒
- 复习提醒
- 每周学习报告
- 可配置推送时间

### 📱 PWA 支持
- 可添加到手机桌面
- 离线可用
- 沉浸式全屏体验

### 💾 数据管理
- 本地存储，数据不上传
- 支持导出备份 / 导入恢复
- 数据安全可控

---

## 🚀 快速开始

### 在线使用

直接访问 GitHub Pages 即可：
👉 **[https://xxxl71y.github.io/study-app/](https://xxxl71y.github.io/study-app/)**

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/xxxl71y/study-app.git

# 进入目录
cd study-app

# 直接用浏览器打开
# 或者用任意静态服务器
npx serve .
```

### 部署到自己的 GitHub Pages

1. Fork 本仓库
2. 进入仓库 Settings → Pages
3. Source 选择 `main` 分支，目录选择 `/ (root)`
4. 保存后等待几分钟即可访问

---

## 📖 使用指南

### 学习流程

1. **打开应用** → 首页显示今日推荐
2. **点击主按钮** → 开始最优先的学习任务
3. **卡片学习** → 点击卡片翻面，选择掌握程度
4. **完成学习** → 系统自动安排下次复习时间

### 四档评分说明

| 评分 | 表情 | 说明 | 效果 |
|------|------|------|------|
| 忘了 | 😵 | 完全不记得 | 重置进度，当天重学 |
| 有点难 | 😓 | 想了很久才想起来 | 复习间隔缩短 40% |
| 记住了 | 😊 | 想了一会想起来了 | 正常间隔增长 |
| 太简单 | 🤩 | 一眼就认出来了 | 复习间隔加长 30% |

### 智能推荐优先级

1. **错题 ≥ 10 个** → 先刷错题
2. **有到期复习** → 先复习旧词
3. **今日新学未完成** → 学习新单词
4. **已学 ≥ 20 个** → 建议做测验
5. **全部完成** → 🎉 今日任务完成

---

## 📦 学习包格式

### JSON 结构

```json
{
  "package_id": "my-vocab",
  "title": "我的词汇包",
  "type": "vocabulary",
  "description": "包的描述",
  "total_items": 100,
  "items": [
    {
      "id": "word_0001",
      "front": "单词/问题",
      "back": "释义/答案",
      "extra": {
        "pos": "n.",
        "tags": ["标签1", "标签2"]
      }
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `package_id` | string | 包的唯一标识 |
| `title` | string | 显示名称 |
| `type` | string | 类型：vocabulary / knowledge |
| `description` | string | 描述 |
| `total_items` | number | 条目总数 |
| `items` | array | 学习条目列表 |
| `items[].id` | string | 条目标识（唯一） |
| `items[].front` | string | 正面内容（问题） |
| `items[].back` | string | 背面内容（答案） |
| `items[].extra` | object | 额外信息（可选） |

### 生成学习包

使用提供的 Python 脚本：

```bash
# 从词汇列表生成
python scripts/package_generator.py vocab input.txt output.json "我的词汇"

# 生成模板文件
python scripts/package_generator.py template template.json
```

---

## 🔔 飞书推送配置

### 1. 创建飞书机器人

1. 在飞书群聊中 → 设置 → 群机器人 → 添加机器人
2. 选择「自定义机器人」
3. 填写名称，获取 Webhook 地址

### 2. 配置应用

在「我的」页面填入 Webhook 地址，点击「测试推送」验证。

### 3. 定时推送（可选）

使用提供的 Python 脚本 + 定时任务：

```bash
# 每日任务提醒（每天早上 8 点）
python scripts/feishu_push.py daily

# 复习提醒（每天晚上 8 点）
python scripts/feishu_push.py review

# 每周周报（周日晚上）
python scripts/feishu_push.py weekly
```

---

## 📁 项目结构

```
study-app/
├── index.html              # 主页面
├── manifest.json           # PWA 配置
├── sw.js                   # Service Worker（离线缓存）
├── README.md               # 项目说明
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── app.js              # 主应用逻辑
│   ├── sm2.js              # SM-2 间隔重复算法
│   ├── storage.js          # 本地存储模块（IndexedDB）
│   ├── quiz.js             # 测验系统
│   └── stats.js            # 统计模块
├── data/
│   └── cet6-vocabulary.json # CET-6 核心词汇（1768 词）
└── scripts/
    ├── feishu_push.py      # 飞书推送脚本
    └── package_generator.py # 学习包生成工具
```

---

## 🧠 算法说明

### SM-2 间隔重复算法

本项目基于经典的 **SuperMemo 2** 算法，核心公式：

```
EF' = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
```

- **EF** (Easiness Factor)：易度因子，初始值 2.5，最小 1.3
- **q**：用户评分（0-5 分，本项目映射为 0-3 → 2-5）
- **间隔计算**：第 1 次 1 天，第 2 次 3 天，之后 = 上次间隔 × EF

### 掌握判定

当满足以下全部条件时，标记为「已掌握」：
- 连续答对 ≥ 5 次
- 易度因子 EF ≥ 2.5
- 复习间隔 ≥ 21 天

---

## 🛠️ 技术栈

- **前端**：原生 HTML / CSS / JavaScript（零依赖）
- **存储**：IndexedDB + localStorage
- **算法**：SM-2 间隔重复
- **部署**：GitHub Pages
- **PWA**：Service Worker + Web App Manifest

---

## 📄 许可证

MIT License - 自由使用、修改、分发

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

<div align="center">
  <p>用 ❤️ 打造的极简学习工具</p>
  <p>如果觉得好用，点个 ⭐ Star 支持一下吧～</p>
</div>
