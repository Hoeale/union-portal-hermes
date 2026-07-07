# 工会门户部署资源索引

本目录包含了将工会门户应用部署到 Ubuntu/Debian 服务器所需的所有资源和脚本。

## 📁 文件说明

### 脚本文件

| 文件 | 说明 | 使用时机 |
|------|------|----------|
| `setup-server.sh` | 服务器环境自动化安装脚本 | 首次部署，在新服务器上运行 |
| `deploy-app.sh` | 应用自动化部署脚本 | 每次部署或更新应用时运行 |
| `nginx.conf` | Nginx 反向代理配置模板 | 首次部署时配置 Nginx |

### 文档文件

| 文件 | 说明 | 适用人群 |
|------|------|----------|
| `QUICK_REFERENCE.txt` | 快速参考卡片（命令速查） | 所有用户 |
| `SIMPLE_GUIDE.md` | 简化部署指南（3步完成） | Linux/Mac 用户 |
| `WINDOWS_DEPLOYMENT.md` | Windows 用户详细部署指南 | Windows 用户 |
| `README.md` | 本文件，部署资源索引 | 所有用户 |

### Windows 工具

| 文件 | 说明 |
|------|------|
| `upload-to-server.ps1` | PowerShell 上传脚本，自动上传部署包到服务器 |

---

## 🚀 快速开始

### 对于 Windows 用户

1. 阅读 `WINDOWS_DEPLOYMENT.md`
2. 运行 `.\deploy\upload-to-server.ps1` 上传文件
3. SSH 登录服务器运行部署命令

详细步骤见 `WINDOWS_DEPLOYMENT.md`

### 对于 Linux/Mac 用户

1. 阅读 `SIMPLE_GUIDE.md`
2. 上传文件到服务器
3. 运行部署脚本

详细步骤见 `SIMPLE_GUIDE.md`

---

## 📋 部署流程概述

```
┌─────────────────┐
│  1. 准备部署包   │  (在本地电脑)
│  tar -czf ...   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. 上传到服务器  │  (scp / WinSCP)
│  scp ...        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. 安装环境     │  (在服务器运行)
│  setup-server.sh│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. 部署应用     │  (在服务器运行)
│  deploy-app.sh  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. 配置 Nginx   │  (在服务器运行)
│  nginx.conf     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ✅ 部署完成     │
│  访问测试       │
└─────────────────┘
```

---

## 🔧 脚本功能详解

### setup-server.sh

**功能**: 一键安装服务器所需的所有软件环境

**安装内容**:
- Node.js 18.x
- MySQL 8.0
- PM2 进程管理器
- Nginx Web 服务器
- Git, curl, wget 等工具

**创建内容**:
- 数据库: `union_portal`
- 数据库用户: `union_user` (密码: Union@2024)
- 项目目录: `/var/www/union-portal`

**使用方法**:
```bash
sudo bash deploy/setup-server.sh
```

---

### deploy-app.sh

**功能**: 一键部署应用

**执行步骤**:
1. 安装 npm 依赖
2. 配置环境变量 (.env.production)
3. 构建生产版本 (npm run build)
4. 生成 Prisma Client
5. 推送数据库架构
6. 初始化管理员和示例数据
7. 使用 PM2 启动应用

**使用方法**:
```bash
cd /var/www/union-portal
bash deploy/deploy-app.sh
```

---

### nginx.conf

**功能**: Nginx 反向代理配置

**特性**:
- 静态文件缓存优化
- WebSocket 支持
- Gzip 压缩
- 上传文件大小限制 (10MB)
- 健康检查端点

**配置位置**: `/etc/nginx/sites-available/union-portal`

---

## 📊 服务器要求

### 最低配置
- **CPU**: 2 核
- **内存**: 2GB
- **硬盘**: 20GB
- **系统**: Ubuntu 20.04+ / Debian 11+

### 推荐配置
- **CPU**: 4 核
- **内存**: 4GB+
- **硬盘**: 40GB+
- **系统**: Ubuntu 22.04 LTS

---

## 🔄 更新应用

当需要更新已部署的应用时:

```bash
# SSH 登录服务器
ssh user@your-server

# 进入项目目录
cd /var/www/union-portal

# 拉取最新代码
git pull

# 安装新依赖
npm install

# 构建新版本
npm run build

# 重启应用
pm2 restart union-portal
```

---

## 📞 获取帮助

### 文档
- 快速参考: `QUICK_REFERENCE.txt`
- 简化指南: `SIMPLE_GUIDE.md`
- Windows 指南: `WINDOWS_DEPLOYMENT.md`
- 完整文档: 项目根目录 `DEPLOYMENT.md`

### 常用命令
```bash
pm2 status              # 查看应用状态
pm2 logs union-portal   # 查看应用日志
pm2 restart union-portal # 重启应用
sudo systemctl status mysql  # 查看 MySQL 状态
sudo systemctl status nginx  # 查看 Nginx 状态
```

---

## 🔒 安全建议

部署完成后，请务必:

1. ✅ 修改默认管理员密码 (admin/admin123)
2. ✅ 修改 MySQL root 密码
3. ✅ 配置防火墙 (ufw)
4. ✅ 申请域名并配置 HTTPS
5. ✅ 设置数据库自动备份

---

## 📝 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-04-10 | 初始版本，支持自动化部署 |

---

## ⚠️ 注意事项

1. 部署脚本会提示输入 MySQL root 密码，请妥善保管
2. 默认数据库用户密码为 `Union@2024`，生产环境建议修改
3. 确保服务器 80、443 端口已开放
4. 建议在测试环境先验证部署流程

---

*部署资源版本: 1.0.0 | 更新时间: 2026-04-10*
