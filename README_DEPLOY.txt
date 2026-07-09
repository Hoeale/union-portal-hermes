====================================================
工会网站部署说明 - Union Portal Deployment Guide
====================================================

【数据库配置】
数据库类型：MySQL 8.0
数据库名：union_portal
用户名：union
密码：union123
端口：3306

【部署步骤】

1. 解压部署包
   tar -xzf union-portal-20260709.tar.gz -C /目标目录/

2. 安装依赖
   cd /目标目录/union-portal-deploy
   npm install

3. 检查数据库连接
   # 确认 .env.production 文件中：
   DATABASE_URL=mysql://union:union123@localhost:3306/union_portal

4. 数据库迁移（如果需要）
   npx prisma generate
   npx prisma db push  # 或 npx prisma migrate deploy

5. 构建项目
   npm run build

6. 启动服务
   pm2 start ecosystem.config.js
   # 或
   npm start

7. 配置 Nginx（如需要）
   # 参考 nginx/nginx.conf 文件

【环境要求】
- Node.js >= 20
- MySQL >= 8.0
- npm >= 10

【注意事项】
- public/uploads 目录中的视频文件已排除在部署包外
- 首次部署需要确保数据库已创建且用户权限正确
- SESSION_SECRET 已在 .env 中配置

【修改记录】
- 2026-07-09: 修复富文本编辑器三大bug、导航栏高亮、数据库密码修复、计数逻辑优化
- 2026-07-08: 多个后台管理bug修复

====================================================
