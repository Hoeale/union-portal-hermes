# 部署包更新日志

## 版本：2026-07-07_153000
**部署时间**：2026-07-07 15:30:00

### 🐛 Bug 修复

#### 1. 办事服务页面设置 - 服务流程和联系信息前端不显示
**问题**：后台修改服务流程和联系信息后，前端 `/services` 页面不显示新修改的内容。

**原因**：前端页面硬编码了服务流程和联系方式，没有读取后台配置。

**修复**：
- 修改 `app/services/page.tsx`，添加从 API 读取配置
- 加载 `service_flow_steps` 和 `service_contact_info`
- 动态渲染服务流程和联系方式
- 支持自定义标题（"服务热线"和"邮箱地址"可修改）

#### 2. 办事服务页面 - 联系信息标题可自定义
**问题**：后台"联系我们"区域的"服务热线"和"邮箱地址"标题无法修改。

**修复**：
- 后台管理页面添加标题编辑框
- 保存时包含 `phoneLabel` 和 `emailLabel` 字段
- 前端读取并显示自定义标题

#### 3. 新闻中心 - 插入图片后自动设为封面
**问题**：新增新闻时，插入图片后自动默认为封面照片，没有提示。

**修复**：
- 修改 `components/admin/news-editor.tsx`
- 当没有封面照片时，检测到内容中有图片，弹出确认提示
- 提示语：'当前无封面照片，是否采用新闻第一张照片为封面？'
- 用户确认后才使用第一张图片作为封面

#### 4. 网站标题修改只在首页生效
**问题**：首页内容修改网站标题后，只有首页显示新标题，子页面未生效。

**原因**：`app/layout.tsx` 的 `generateMetadata` 可能被 Next.js 静态缓存。

**修复**：
- 在 `app/layout.tsx` 添加 `export const dynamic = 'force-dynamic'`
- 强制动态渲染，避免 metadata 被缓存
- 所有页面都会实时读取最新的网站标题

### 📝 修改的文件

1. `app/services/page.tsx` - 服务页面动态加载配置
2. `app/admin/services/page.tsx` - 后台添加标题编辑功能
3. `components/admin/news-editor.tsx` - 添加封面确认提示
4. `app/layout.tsx` - 强制动态渲染 metadata

### ✅ 验证清单

部署后请验证以下功能：

- [ ] 访问 `/admin/services`，修改服务流程步骤，保存后访问 `/services` 查看是否显示新流程
- [ ] 修改"联系我们"的标题（如改为"咨询电话"），保存后查看前端是否显示新标题
- [ ] 新增新闻，插入图片但不设置封面，保存时应弹出确认提示
- [ ] 修改网站标题后，刷新所有页面（包括子页面）查看标题是否更新

### 📦 部署步骤

```bash
# 1. 备份当前版本
tar -czf backup-$(date +%Y%m%d_%H%M%S).tar.gz union-portal-deploy

# 2. 解压新部署包
cd /home/unionportal
tar -xzf union-portal-deploy-20260707_153000_with_uploads.tar.gz

# 3. 安装依赖（如果 package.json 有变化）
cd union-portal-deploy
npm install

# 4. 构建项目
npm run build

# 5. 重启服务
pm2 restart union-portal
sudo nginx -s reload
```

### 🔍 技术说明

- **服务流程和联系信息**：存储在 `site_info` 表的 `service_flow_steps` 和 `service_contact_info` 字段
- **联系信息结构**：`{ phoneLabel, phone, emailLabel, email }`
- **动态渲染**：使用 Next.js 的 `dynamic = 'force-dynamic'` 确保 metadata 不被缓存

### 🎯 用户体验改进

- 服务流程和联系信息现在完全由后台控制，符合"后台管理可以修改前端"原则
- 联系信息标题可自定义，更灵活
- 新闻封面设置更友好，避免意外使用不合适的图片作为封面
- 网站标题修改后全局生效，提升一致性
