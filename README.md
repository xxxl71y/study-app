# AI 学习助手

极简的间隔重复学习工具，支持自定义学习包、错题本、测验、飞书推送。

## 功能特性

- 🎯 **智能推荐**：自动判断今天该复习还是学新单词
- 🔄 **间隔重复**：基于 SM-2 算法，科学安排复习时间
- ❌ **错题本**：自动收录错词错题，答对自动移除
- 📝 **测验模式**：选择题检验学习成果
- 📅 **学习阶段**：自动追踪学习天数和阶段进度
- 🔥 **连续打卡**： streak 激励机制
- 📦 **通用框架**：支持导入任意学习包（JSON格式）
- 🔔 **飞书推送**：每日学习提醒（需配置 webhook）
- 📱 **PWA 支持**：可添加到桌面，离线使用

## 快速开始

### 本地使用

直接用浏览器打开 `index.html` 即可使用。

### 部署到 GitHub Pages（免费）

#### 方法一：手动上传（最简单）

1. 登录 GitHub，创建一个新仓库（比如叫 `study-app`）
2. 把本文件夹里的所有文件上传到仓库
3. 进入仓库 Settings → Pages
4. Source 选择 `main` 分支，根目录 `/`
5. 保存后等几分钟，就能通过 `https://你的用户名.github.io/study-app/` 访问

#### 方法二：一键部署脚本

如果你配置了 git，在本目录执行：

```bash
# 初始化 git
git init
git add .
git commit -m "init"

# 添加你的远程仓库
git remote add origin https://github.com/你的用户名/study-app.git
git branch -M main
git push -u origin main
```

然后在 GitHub 仓库设置里开启 Pages 即可。

### 自定义域名（可选）

如果有自己的域名，在仓库根目录创建 `CNAME` 文件，写入你的域名，然后在 DNS 配置 CNAME 指向 `你的用户名.github.io`。

## 学习包格式

```json
{
  "package_id": "my-vocab",
  "title": "我的词汇包",
  "type": "vocabulary",
  "description": "描述",
  "total_items": 100,
  "items": [
    {
      "id": "word_0001",
      "front": "单词",
      "back": "释义",
      "extra": {
        "pos": "n.",
        "tags": ["标签"]
      }
    }
  ]
}
```

## 飞书推送配置

1. 在飞书中创建一个群机器人，获取 webhook 地址
2. 在应用「我的」页面填入 webhook 地址
3. 用定时任务（如 crontab）调用推送脚本：

```bash
python3 scripts/feishu_push.py daily    # 每日任务提醒
python3 scripts/feishu_push.py review   # 复习提醒
python3 scripts/feishu_push.py weekly   # 每周周报
```

## 项目结构

```
study-app/
├── index.html           # 主页面
├── manifest.json        # PWA 配置
├── sw.js                # Service Worker
├── css/
│   └── style.css        # 样式
├── js/
│   ├── app.js           # 主逻辑
│   └── sm2.js           # SM-2 算法
├── data/
│   └── cet6-vocabulary.json  # CET-6 词汇
└── scripts/
    ├── feishu_push.py       # 飞书推送
    └── package_generator.py # 学习包生成工具
```
