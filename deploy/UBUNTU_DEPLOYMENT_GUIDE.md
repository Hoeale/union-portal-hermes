# 西安高新区总工会门户 - Ubuntu 22.04 完整部署指南

本指南详细介绍如何在 Ubuntu 22.04 服务器上部署工会门户网站，包括系统初始化、Docker 安装、数据库配置、Nginx 反向代理、HTTPS 证书和启动验证。

---

## 📋 目录

- [服务器要求](#服务器要求)
- [第一步：系统初始化](#第一步系统初始化)
- [第二步：安装 Docker](#第二步安装-docker)
- [第三步：上传项目文件](#第三步上传项目文件)
- [第四步：配置环境变量](#第四步配置环境变量)
- [第五步：启动服务](#第五步启动服务)
- [第六步：数据库迁移](#第六步数据库迁移)
- [第七步：配置 Nginx 反向代理](#第七步配置-nginx-反向代理)
- [第八步：配置 HTTPS 证书](#第八步配置-https-证书)
- [第九步：首次启动验证](#第九首次启动验证)
- [常用运维命令](#常用运维命令)
- [故障排查](#故障排查)

---

## 服务器要求

### 最低配置（测试环境）
- **CPU**: 2 核
- **内存**: 4GB
- **硬盘**: 40GB SSD
- **系统**: Ubuntu 22.04 LTS

### 推荐配置（生产环境）
- **CPU**: 4 核+
- **内存**: 8GB
- **硬盘**: 50GB+ SSD
- **带宽**: 5Mbps+
- **系统**: Ubuntu 22.04 LTS

---

## 第一步：系统初始化

### 1.1 登录服务器

```bash
ssh root@your-server-ip
```

### 1.2 更新系统包

```bash
apt update && apt upgrade -y
```

### 1.3 安装基础工具

```bash
apt install -y curl wget vim git ufw unzip
```

### 1.4 配置防火墙

```bash
# 允许 SSH 连接
ufw allow 22/tcp

# 允许 HTTP 和 HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 启用防火墙
ufw enable

# 查看防火墙状态
ufw status
```

### 1.5 设置时区

```bash
timedatectl set-timezone Asia/Shanghai
timedatectl status
```

---

## 第二步：安装 Docker

### 2.1 安装 Docker Engine

```bash
# 卸载旧版本（如果有）
apt remove -y docker docker-engine docker.io containerd runc

# 安装依赖
apt install -y ca-certificates curl gnupg lsb-release

# 添加 Docker GPG 密钥
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker
systemctl start docker
systemctl enable docker

# 验证安装
docker --version
docker compose version
```

### 2.2 配置 Docker 非 root 用户访问

```bash
# 创建 docker 用户组（如果不存在）
groupadd docker

# 将当前用户添加到 docker 组
usermod -aG docker $USER

# 重新登录或执行以下命令使更改生效
newgrp docker

# 测试 Docker 命令（无需 sudo）
docker run hello-world
```

---

## 第三步：上传项目文件

### 3.1 创建项目目录

```bash
mkdir -p /opt/union-portal
cd /opt/union-portal
```

### 3.2 上传部署包

**方式 A：使用 SCP 从本地上传**

```bash
# 在本地电脑执行（Windows PowerShell）
scp union-portal-deploy.tar.gz root@your-server-ip:/opt/union-portal/

# 在服务器解压
cd /opt/union-portal
tar -xzf union-portal-deploy.tar.gz
```

**方式 B：使用 Git 克隆**

```bash
cd /opt/union-portal
git clone <your-repository-url> .
```

### 3.3 设置目录权限

```bash
# 创建上传目录
mkdir -p /opt/union-portal/public/uploads

# 设置权限
chmod -R 755 /opt/union-portal
chmod -R 777 /opt/union-portal/public/uploads
```

---

## 第四步：配置环境变量

### 4.1 创建 .env.docker 文件

```bash
cd /opt/union-portal
cp .env.docker.example .env.docker
```

### 4.2 编辑环境变量

```bash
vim .env.docker
```

**修改以下关键配置：**

```bash
# MySQL 数据库配置（⚠️ 请修改为强密码）
MYSQL_ROOT_PASSWORD=YourSecureRootPassword123!
MYSQL_DATABASE=union_portal
MYSQL_USER=union_user
MYSQL_PASSWORD=YourSecureDbPassword456!
MYSQL_PORT=3306

# 应用配置
APP_PORT=3000
ADMIN_SESSION_SECRET=$(openssl rand -hex 32)  # 生成随机密钥
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourAdminPassword789!  # ⚠️ 修改默认密码

# Nginx 配置
NGINX_PORT=80
NGINX_HTTPS_PORT=443

# Redis 配置
REDIS_URL=redis://redis:6379
```

### 4.3 生成随机密钥（可选）

```bash
# 生成 ADMIN_SESSION_SECRET
openssl rand -hex 32

# 生成 MySQL 密码示例
openssl rand -base64 16
```

---

## 第五步：启动服务

### 5.1 首次启动（不使用 Nginx）

```bash
cd /opt/union-portal

# 启动 MySQL、Redis 和应用
docker compose up -d mysql redis app

# 查看启动状态
docker compose ps

# 查看日志
docker compose logs -f app
```

### 5.2 等待服务就绪

```bash
# 等待 MySQL 和 Redis 健康检查通过（约 30-60 秒）
docker compose ps

# 应该看到所有服务状态为 healthy
```

### 5.3 测试应用访问

```bash
# 测试应用是否正常响应
curl http://localhost:3000/api/health

# 或从外部浏览器访问
http://your-server-ip:3000
```

---

## 第六步：数据库迁移

### 6.1 进入应用容器

```bash
docker compose exec app sh
```

### 6.2 生成 Prisma Client

```bash
npx prisma generate
```

### 6.3 推送数据库架构

```bash
# 推送数据库表结构
npx prisma db push --accept-data-loss

# 查看数据库状态
npx prisma db pull
```

### 6.4 初始化管理员账户

```bash
# 运行初始化脚本
npx tsx scripts/init-admin.ts

# 如果需要初始化示例数据
npx tsx scripts/init-service-data.ts
```

### 6.5 退出容器

```bash
exit
```

---

## 第七步：配置 Nginx 反向代理

### 7.1 创建 Nginx 配置目录

```bash
mkdir -p /opt/union-portal/nginx/ssl
```

### 7.2 创建 Nginx 配置文件

```bash
cat > /opt/union-portal/nginx/nginx.conf << 'EOF'
# 工会门户 Nginx 配置（Docker 版本）

upstream app_backend {
    server app:3000;
}

server {
    listen 80;
    server_name _;  # 替换为你的域名或保持 _ 使用 IP

    # 日志配置
    access_log /var/log/nginx/union-portal-access.log;
    error_log /var/log/nginx/union-portal-error.log;

    # 客户端上传大小限制
    client_max_body_size 10M;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://app_backend;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # 上传文件
    location /uploads {
        proxy_pass http://app_backend;
        expires 7d;
        add_header Cache-Control "public";
    }

    # 反向代理到应用
    location / {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # 传递真实 IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF
```

### 7.3 启动 Nginx

```bash
cd /opt/union-portal

# 启动包含 Nginx 的完整服务
docker compose --profile production up -d

# 查看服务状态
docker compose ps
```

### 7.4 测试 HTTP 访问

```bash
# 从服务器内部测试
curl http://localhost:80

# 从外部浏览器访问
http://your-server-ip
```

---

## 第八步：配置 HTTPS 证书

### 8.1 安装 Certbot

```bash
# 安装 Certbot
apt install -y certbot

# 创建证书目录
mkdir -p /opt/union-portal/nginx/ssl
```

### 8.2 申请 Let's Encrypt 证书

**前提条件：**
- ✅ 已绑定域名（如 `www.example.com`）
- ✅ 域名 DNS 已解析到服务器 IP
- ✅ 80 端口可外网访问

```bash
# 停止 Nginx 容器（释放 80 端口）
docker compose stop nginx

# 申请证书（替换为你的域名）
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 证书文件位置
ls -la /etc/letsencrypt/live/your-domain.com/
```

### 8.3 配置自动续期

```bash
# 创建证书续期脚本
cat > /opt/union-portal/renew-cert.sh << 'EOF'
#!/bin/bash
cd /opt/union-portal

# 停止 Nginx
docker compose stop nginx

# 续期证书
certbot renew --standalone

# 复制新证书到项目目录
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# 启动 Nginx
docker compose start nginx

echo "证书续期完成"
EOF

chmod +x /opt/union-portal/renew-cert.sh

# 添加定时任务（每月 1 号执行）
(crontab -l 2>/dev/null; echo "0 3 1 * * /opt/union-portal/renew-cert.sh >> /var/log/cert-renew.log 2>&1") | crontab -
```

### 8.4 更新 Nginx 配置启用 HTTPS

```bash
cat > /opt/union-portal/nginx/nginx.conf << 'EOF'
# 工会门户 Nginx 配置 - HTTPS 版本

upstream app_backend {
    server app:3000;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # 替换为你的域名
    
    # Let's Encrypt 验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # 其他所有请求重定向到 HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;  # 替换为你的域名

    # SSL 证书
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 日志配置
    access_log /var/log/nginx/union-portal-access.log;
    error_log /var/log/nginx/union-portal-error.log;

    # 客户端上传大小限制
    client_max_body_size 10M;

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://app_backend;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # 上传文件
    location /uploads {
        proxy_pass http://app_backend;
        expires 7d;
        add_header Cache-Control "public";
    }

    # 反向代理到应用
    location / {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # 传递真实 IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF
```

### 8.5 映射证书到 Nginx 容器

```bash
# 修改 docker-compose.yml 中的 nginx volumes 配置
# 确保包含证书映射：
# volumes:
#   - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
#   - ./nginx/ssl:/etc/nginx/ssl:ro
#   - /etc/letsencrypt/live/your-domain.com/fullchain.pem:/etc/nginx/ssl/fullchain.pem:ro
#   - /etc/letsencrypt/live/your-domain.com/privkey.pem:/etc/nginx/ssl/privkey.pem:ro

# 复制证书到项目目录
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/union-portal/nginx/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/union-portal/nginx/ssl/

# 重启 Nginx
docker compose restart nginx
```

### 8.6 测试 HTTPS

```bash
# 测试 HTTPS 访问
curl https://your-domain.com

# 或使用浏览器访问
https://your-domain.com
```

---

## 第九步：首次启动验证

### 9.1 检查所有服务状态

```bash
cd /opt/union-portal

# 查看所有容器状态
docker compose ps

# 应该看到：
# - union-portal-mysql: healthy
# - union-portal-redis: healthy
# - union-portal-app: healthy
# - union-portal-nginx: running (生产模式)
```

### 9.2 测试应用功能

```bash
# 1. 测试首页
curl http://localhost:3000

# 2. 测试健康检查
curl http://localhost:3000/api/health

# 3. 测试管理后台登录页
curl http://localhost:3000/admin/login

# 4. 测试 API 端点
curl http://localhost:3000/api/news
```

### 9.3 登录管理后台

1. 打开浏览器访问：`http://your-server-ip/admin/login`
2. 使用默认账户登录：
   - 用户名：`admin`
   - 密码：你在 `.env.docker` 中设置的 `ADMIN_PASSWORD`
3. **立即修改密码！**

### 9.4 检查数据库连接

```bash
# 进入 MySQL 容器
docker compose exec mysql mysql -u union_user -p union_portal

# 输入密码后执行
SHOW TABLES;
EXIT;
```

### 9.5 检查 Redis 缓存

```bash
# 进入 Redis 容器
docker compose exec redis redis-cli

# 测试连接
PING

# 查看缓存键
KEYS *

EXIT
```

### 9.6 查看应用日志

```bash
# 查看应用日志
docker compose logs -f app

# 查看 MySQL 日志
docker compose logs -f mysql

# 查看 Nginx 日志
docker compose logs -f nginx
```

---

## 常用运维命令

### 服务管理

```bash
cd /opt/union-portal

# 启动所有服务
docker compose up -d

# 启动生产模式（含 Nginx）
docker compose --profile production up -d

# 停止所有服务
docker compose down

# 重启某个服务
docker compose restart app

# 查看服务状态
docker compose ps

# 查看资源使用
docker compose top
```

### 日志查看

```bash
# 查看所有日志
docker compose logs -f

# 查看应用日志
docker compose logs -f app

# 查看最近 100 行日志
docker compose logs --tail=100 app
```

### 数据库管理

```bash
# 进入 MySQL
docker compose exec mysql mysql -u root -p

# 备份数据库
docker compose exec mysql mysqldump -u union_user -p union_portal > backup-$(date +%Y%m%d).sql

# 恢复数据库
docker compose exec -T mysql mysql -u union_user -p union_portal < backup-20260101.sql

# 运行项目备份脚本
docker compose exec app npm run backup
```

### 应用更新

```bash
cd /opt/union-portal

# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build app

# 或重新构建所有服务
docker compose up -d --build
```

### 数据清理

```bash
# 清理未使用的 Docker 资源
docker system prune -a

# 清理 Docker 卷（⚠️ 会删除数据库数据）
docker compose down -v
```

---

## 故障排查

### 问题 1：容器启动失败

```bash
# 查看容器日志
docker compose logs app

# 常见原因：
# - 数据库连接失败：检查 .env.docker 中的 DATABASE_URL
# - 端口被占用：修改 APP_PORT 或 NGINX_PORT
# - 内存不足：检查服务器资源 docker stats
```

### 问题 2：数据库连接失败

```bash
# 检查 MySQL 是否启动
docker compose ps mysql

# 测试数据库连接
docker compose exec app node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect().then(() => {
  console.log('数据库连接成功');
  process.exit(0);
}).catch(err => {
  console.error('数据库连接失败:', err.message);
  process.exit(1);
});
"
```

### 问题 3：Nginx 502 错误

```bash
# 检查应用是否运行
docker compose ps app

# 检查 Nginx 配置
docker compose exec nginx nginx -t

# 查看 Nginx 错误日志
docker compose logs nginx

# 重启 Nginx
docker compose restart nginx
```

### 问题 4：内存不足 OOM

```bash
# 查看内存使用
free -h

# 查看 Docker 容器内存
docker stats

# 解决方案：
# 1. 升级服务器配置
# 2. 限制容器内存（修改 docker-compose.yml）
#    app:
#      deploy:
#        resources:
#          limits:
#            memory: 1G
# 3. 关闭不需要的服务
```

### 问题 5：HTTPS 证书问题

```bash
# 检查证书有效期
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout

# 手动续期证书
certbot renew --force-renewal

# 检查 Certbot 日志
cat /var/log/letsencrypt/letsencrypt.log
```

---

## 安全建议

### 1. 修改默认密码

```bash
# 修改管理员密码（登录后台后）
# 修改数据库密码（.env.docker）
# 修改 SESSION_SECRET（.env.docker）
```

### 2. 配置防火墙

```bash
# 只开放必要端口
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 3. 定期备份

```bash
# 添加定时备份任务
(crontab -l 2>/dev/null; echo "0 2 * * * cd /opt/union-portal && docker compose exec -T mysql mysqldump -u union_user -p'\$MYSQL_PASSWORD' union_portal > /backup/db-\$(date +\%Y\%m\%d).sql") | crontab -
```

### 4. 监控服务状态

```bash
# 安装 htop 监控系统资源
apt install -y htop

# 查看系统状态
htop

# 设置服务监控（使用 systemd）
cat > /etc/systemd/system/union-portal-monitor.service << EOF
[Unit]
Description=Union Portal Health Check
After=docker.service

[Service]
Type=oneshot
ExecStart=/usr/bin/docker compose -f /opt/union-portal/docker-compose.yml ps

[Install]
WantedBy=multi-user.target
EOF
```

---

## 性能优化

### 1. 启用 Docker BuildKit

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

### 2. 配置 Redis 缓存

```bash
# 在 .env.docker 中启用 Redis
REDIS_URL=redis://redis:6379
```

### 3. 优化 Nginx 配置

```nginx
# 启用 Gzip 压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
gzip_min_length 1000;
```

---

## 联系支持

如遇到问题，请检查：
1. 服务器日志：`docker compose logs -f`
2. 应用日志：`/opt/union-portal/logs/`
3. Nginx 日志：`docker compose logs nginx`

---

**部署指南版本**: 1.0.0  
**更新日期**: 2026-06-22  
**适用系统**: Ubuntu 22.04 LTS  
**Docker 版本**: 24.0+  
**Node.js 版本**: 18.x (Docker 内置)
