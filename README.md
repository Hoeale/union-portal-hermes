# 西安高新区总工会门户网站

> 简洁实用的工会官方门户网站，支持信息发布、新闻展示、搜索功能和完整的内容管理后台。

## 项目简介

本项目是为西安高新区总工会开发的官方门户网站，采用现代化的技术栈，提供高效的内容管理和展示功能。

### 主要功能

- **信息发布**: 支持新闻动态、通知公告、政策文件的发布和管理
- **内容展示**: 轮播图、新闻列表、分类展示、视频展示
- **搜索功能**: 关键词搜索新闻标题
- **管理后台**: 完整的后台管理系统，支持内容管理和权限控制
- **友情链接**: 支持教育网外链，可标记必保留项
- **意见反馈**: 用户留言反馈管理
- **草稿系统**: 支持草稿保存、预览和发布工作流
- **可配置首页**: 动态配置首页布局和区块可见性
- **反爬保护**: 全网站反爬虫措施和速率限制

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI组件**: React 18 + Tailwind CSS + shadcn/ui
- **数据库**: MySQL + Prisma ORM
- **富文本编辑器**: TipTap
- **开发语言**: TypeScript
- **安全防护**: bcryptjs (密码哈希) + sanitize-html (XSS防护) + CSRF Token
- **部署平台**: Vercel / 自有服务器

## 页面结构

### 前台页面

| 路由 | 功能 |
|------|------|
| `/` | 首页 (V2 版本) |
| `/news` | 新闻列表 |
| `/news/[id]` | 新闻详情 |
| `/policies` | 政策文件列表 |
| `/policies/[id]` | 政策文件详情 |
| `/videos` | 视频展示 |
| `/videos/[id]` | 视频详情 |
| `/about` | 工会概况 |
| `/services` | 办事服务 |
| `/services/[slug]` | 服务详情 |
| `/workers` | 职工服务 |
| `/search` | 搜索功能 |

### 管理后台

| 路由 | 功能 |
|------|------|
| `/admin/login` | 管理员登录 |
| `/admin` | 管理首页 |
| `/admin/news` | 新闻管理 |
| `/admin/news-categories` | 新闻分类管理 |
| `/admin/policies` | 政策文件管理 |
| `/admin/carousel` | 轮播图管理 |
| `/admin/videos` | 视频管理 |
| `/admin/links` | 友情链接管理 |
| `/admin/feedback` | 反馈管理 |
| `/admin/drafts` | 草稿箱管理 |
| `/admin/footer` | 页脚配置 |
| `/admin/site-info` | 站点信息 |

## 快速开始

### 环境要求

- Node.js 18.17 或更高版本
- npm 或 yarn 或 pnpm
- MySQL 数据库

### 1. 克隆项目

```bash
git clone <repository-url>
cd union-portal
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.local.example` 为 `.env.local` 并填写配置：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件：

```env
DATABASE_URL="mysql://user:password@localhost:3306/union_portal"
ADMIN_SESSION_SECRET=your_random_secret_here
```

**生成会话密钥**：

```bash
openssl rand -base64 32
```

### 4. 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看网站

访问 http://localhost:3000/admin/login 登录管理后台

## 数据库设计

### 主要表结构

#### news (新闻表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (CUID) | 主键 |
| title | String | 标题 |
| category | String | 分类：动态/通知/公告/政策 |
| content | String | 内容 |
| imageUrl | String | 配图URL |
| isCarousel | Boolean | 是否为轮播图 |
| carouselOrder | Int | 轮播顺序 |
| status | String | 状态：published/pending/draft |
| viewCount | Int | 浏览次数 |
| publishedAt | DateTime | 发布时间 |
| createdAt | DateTime | 创建时间 |

#### friendly_links (友情链接表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (CUID) | 主键 |
| title | String | 显示名称 |
| url | String | 链接地址 |
| isRequired | Boolean | 是否必须保留 |
| orderIndex | Int | 排序索引 |

#### admins (管理员表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (CUID) | 主键 |
| username | String | 用户名（唯一） |
| passwordHash | String | 密码哈希 |
| createdAt | DateTime | 创建时间 |

## 安全特性

- **反爬虫**: 基于 User-Agent 的爬虫检测和拦截
- **速率限制**: 页面访问 60次/分钟，文件下载 20次/小时
- **XSS 防护**: 用户输入自动清洗，过滤恶意 HTML/脚本
- **CSRF 保护**: State-changing API 需要 CSRF Token 验证
- **认证保护**: 管理后台 API 需要登录验证
- **安全响应头**: X-Frame-Options, CSP, HSTS 等

## 部署指南

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署完成

### 自有服务器部署

1. 构建项目：
```bash
npm run build
```

2. 启动生产服务器：
```bash
npm start
```

3. 使用 PM2 管理进程：
```bash
npm install -g pm2
pm2 start npm --name "union-portal" -- start
```

## 开发指南

### 代码风格

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 组件采用函数式组件和 Hooks
- 使用 Tailwind CSS 进行样式开发

### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具变动
```

### 测试

```bash
npm run lint        # ESLint 检查
npm run build       # 构建项目
```

## 更新日志

### v0.2.0 (2026-06-01)

- 新增 V2 首页设计
- 新增政策文件管理
- 新增视频展示功能
- 新增草稿系统和预览
- 新增可配置首页布局
- 新增反爬和速率限制
- 新增 XSS 输入过滤
- 新增 CSRF Token 保护
- 新增浏览次数统计
- 数据库从 Supabase 迁移到 MySQL

### v0.1.0 (2026-04-09)

- 初始版本发布
- 实现新闻管理功能
- 实现友情链接管理
- 完成响应式设计

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

Copyright © 2026 西安高新区总工会. All rights reserved.

---

**最后更新**: 2026-06-01
