# 📚 AI 学习助手

基于间隔重复算法的极简学习工具，支持自定义学习包、选择题模式、错题本和微信推送。

[![在线演示](https://img.shields.io/badge/GitHub_Pages-在线使用-brightgreen)](https://xxxl71y.github.io/study-app/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 功能

- **🎯 智能推荐** — 错题 > 到期复习 > 新学，自动安排今日优先级
- **🔄 间隔重复** — 基于 SM-2 算法，四选一选择题代替手动评分
- **❌ 错题本** — 答错自动收录，答对自动移除
- **📦 学习包** — 内置 CET-6 词汇，支持导入自定义 JSON 包
- **🔔 微信推送** — Server酱每日定时提醒学习
- **📱 PWA + APK** — 可装手机桌面，支持打包成安卓 APP
- **🔥 打卡统计** — 连续打卡、学习阶段追踪
- **💾 本地存储** — 数据不上传，支持导出/导入备份

## 🚀 使用

在线访问：[xxxl71y.github.io/study-app](https://xxxl71y.github.io/study-app/)

本地运行：

```bash
npx serve .
```

## 📦 学习包格式

```json
{
  "package_id": "my-words",
  "title": "我的单词本",
  "items": [
    { "id": "w1", "front": "apple", "back": "苹果", "extra": { "pos": "n." } }
  ]
}
```

必填字段：`package_id`、`items`（含 `id` / `front` / `back`）。

## 📱 打包 APK

在 GitHub Actions 中手动运行 **Build Android APK** workflow，使用 Bubblewrap 将 PWA 打包为 TWA APK。

## 🛠️ 技术栈

原生 HTML / CSS / JavaScript · SM-2 算法 · Service Worker · GitHub Pages · Bubblewrap

## 📄 License

MIT
