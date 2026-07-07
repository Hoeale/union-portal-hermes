# 工会门户部署资源包

## 📦 部署包内容

本部署包包含西安高新区总工会门户网站的完整部署资源，支持在 Ubuntu 22.04 服务器上快速部署。

### 核心文件
```
union-portal/
├── app/                    # Next.js 应用代码
├── components/            # React 组件
├── lib/                   # 工具库和配置
├── prisma/                # 数据库架构
├── scripts/               # 脚本工具
│   ├── package-deploy.ps1    # Windows 打包脚本
│   └── backup/               # 备份脚本
├── deploy/                # 部署资源
│   ├── one-click-deploy.sh        # 一键部署脚本
│   ├── UBUNTU_DEPLOYMENT_GUIDE.md # 完整部署指南
│   ├── QUICK_REFERENCE.md         # 快速参考
│   ├── DEPLOYMENT_CHECKLIST.md    # 部署清单
│   ├── README.md                  # 本文件
│   └── nginx.conf                 # Nginx 配置
├── nginx/                 # Nginx 配置目录
├── public/                # 静态资源
├── docker-compose.yml     # Docker 编排配置
├── Dockerfile             # Docker 镜像构建
├── .env.docker.example    # 环境变量示例
└── package.json           # 项目依赖
```

---

## 🚀 快速部署（3步完成）

### 第1步：上传到服务器
```bash
# 使用 SCP 或 WinSCP 上传部署包
scp union-portal-deploy-*.tar.gz root@your-server-ip:/opt/
```

### 第2步：解压
```bash
ssh root@your-server-ip
cd /opt
mkdir -p union-portal
tar -xzf union-portal-deploy-*.tar.gz -C union-portal --strip-components=1
cd union-portal
```

### 第3步：一键部署
```bash
sudo bash deploy/one-click-deploy.sh
```

部署完成后访问：`http://your-server-ip:3000`

---

## 📚 文档导航

### 新手用户
1. 📖 [完整部署指南](deploy/UBUNTU_DEPLOYMENT_GUIDE.md) - 详细的分步说明
2. ✅ [部署清单](deploy/DEPLOYMENT_CHECKLIST.md) - 部署步骤检查表

### 有经验用户
1. ⚡ [快速参考](deploy/QUICK_REFERENCE.md) - 常用命令速查
2. 🚀 [一键部署脚本](deploy/one-click-deploy.sh) - 自动化部署

### 运维人员
1. 🔧 [Nginx 配置](deploy/nginx.conf) - 反向代理配置
2. 📦 [Docker 配置](docker-compose.yml) - 服务编排
3. 🔐 [环境变量](.env.docker.example) - 配置说明

---

## 🎯 部署方式选择

### 方式A：一键部署（推荐）
```bash
sudo bash deploy/one-click-deploy.sh
```
**优点**：自动化、快速、适合首次部署  
**适用**：测试环境、快速部署

### 方式B：手动部署
按照 [完整部署指南](deploy/UBUNTU_DEPLOYMENT_GUIDE.md) 逐步执行  
**优点**：可控性强、便于排查问题  
**适用**：生产环境、定制需求

### 方式C：Docker Compose
```bash
docker compose up -d
docker compose exec app npx prisma db push --accept-data-loss
docker compose exec app npx tsx scripts/init-admin.ts
```
**优点**：灵活、易于管理  
**适用**：开发环境、熟悉 Docker 的用户

---

## ⚙️ 系统要求

### 最低配置
- CPU: 2核
- 内存: 4GB
- 硬盘: 40GB SSD
- 系统: Ubuntu 22.04 LTS

### 推荐配置
- CPU: 4核+
- 内存: 8GB
- 硬盘: 50GB+ SSD
- 带宽: 5Mbps+

---

## 🔐 默认账户

### 管理后台
- **用户名**: `admin`
- **密码**: 在 `.env.docker` 中设置（首次部署自动生成）

### 数据库
- **用户**: `union_user`
- **密码**: 在 `.env.docker` 中设置
- **数据库**: `union_portal`

---

## 📊 服务架构

```
┌─────────────────────────────────────┐
│         Nginx (80/443)              │
│    反向代理 + 静态文件缓存           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Next.js App (3000)             │
│    SSR + API Routes                 │
└──────┬──────────────┬───────────────┘
       │              │
       ▼              ▼
┌──────────┐    ┌──────────┐
│  MySQL   │    │  Redis   │
│  (3306)  │    │  (6379)  │
└──────────┘    └──────────┘
```

---

## 🔧 常用命令

### 服务管理
```bash
docker compose up -d                    # 启动所有服务
docker compose down                     # 停止所有服务
docker compose ps                       # 查看状态
docker compose restart app              # 重启应用
docker compose logs -f app              # 查看日志
```

### 数据库管理
```bash
docker compose exec mysql mysql -u root -p         # 进入 MySQL
docker compose exec app npx prisma db push         # 推送架构
docker compose exec -T mysql mysqldump ...         # 备份数据库
```

### 应用更新
```bash
git pull
docker compose up -d --build app
docker compose exec app npx prisma db push --accept-data-loss
```

---

## ⚠️ 重要提示

### 安全第一
1. ✅ 立即修改默认密码
2. ✅ 配置防火墙（UFW）
3. ✅ 申请 HTTPS 证书
4. ✅ 定期备份数据

### 性能优化
1. ✅ 启用 Redis 缓存
2. ✅ 配置 Nginx 静态缓存
3. ✅ 启用 Gzip 压缩
4. ✅ 监控资源使用

### 数据备份
```bash
# 数据库备份
docker compose exec -T mysql mysqldump -u union_user -p union_portal > backup.sql

# 使用项目备份脚本
docker compose exec app npm run backup
```

---

## 🐛 故障排查

### 常见问题

**1. 容器启动失败**
```bash
docker compose logs app
docker compose logs mysql
```

**2. 数据库连接失败**
- 检查 `.env.docker` 中的 `DATABASE_URL`
- 确认 MySQL 服务已启动：`docker compose ps mysql`

**3. 端口被占用**
- 修改 `.env.docker` 中的 `APP_PORT` 或 `NGINX_PORT`
- 查看端口占用：`ss -tuln | grep :3000`

**4. 内存不足**
```bash
free -h
docker stats
# 解决方案：升级服务器配置
```

### 获取帮助
- 📖 查看 [完整部署指南](deploy/UBUNTU_DEPLOYMENT_GUIDE.md)
- 🔍 查看应用日志：`docker compose logs -f app`
- 💬 检查服务状态：`docker compose ps`

---

## 📝 版本信息

- **项目名称**: 西安高新区总工会门户网站
- **版本**: v0.1.0
- **部署包版本**: 1.0.0
- **创建日期**: 2026-06-22
- **技术栈**: Next.js 14 + MySQL 8.0 + Redis 7 + Docker
- **支持系统**: Ubuntu 22.04 LTS

---

## 📞 技术支持

### 文档资源
- 完整部署指南: `deploy/UBUNTU_DEPLOYMENT_GUIDE.md`
- 快速参考: `deploy/QUICK_REFERENCE.md`
- 部署清单: `deploy/DEPLOYMENT_CHECKLIST.md`

### 在线资源
- 项目文档: `README.md`
- API 文档: 访问 `/api/health` 测试
- 管理后台: `/admin/login`

---

## 🎓 学习资源

### Docker 学习
- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 教程](https://docs.docker.com/compose/)

### Next.js 学习
- [Next.js 官方文档](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

### Ubuntu 服务器管理
- [Ubuntu 服务器指南](https://ubuntu.com/server/docs)
- [Nginx 配置指南](https://nginx.org/en/docs/)

---

**祝您部署顺利！** 🎉

如有问题，请查阅部署文档或查看应用日志。
