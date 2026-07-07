# 工会门户部署快速参考

## 🚀 一键部署（推荐）

```bash
# 上传项目到服务器后
cd /opt/union-portal
sudo bash deploy/one-click-deploy.sh
```

---

## 📦 手动部署步骤

### 1. 安装 Docker
```bash
apt update
apt install -y ca-certificates curl gnupg lsb-release
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl start docker
systemctl enable docker
```

### 2. 配置环境
```bash
cp .env.docker.example .env.docker
vim .env.docker
# 修改密码和密钥
```

### 3. 启动服务
```bash
docker compose up -d mysql redis app
```

### 4. 初始化数据库
```bash
docker compose exec app npx prisma db push --accept-data-loss
docker compose exec app npx tsx scripts/init-admin.ts
```

### 5. 访问网站
```
http://your-server-ip:3000
http://your-server-ip:3000/admin/login
```

---

## 🔧 常用命令

### 服务管理
```bash
docker compose up -d                    # 启动所有服务
docker compose down                     # 停止所有服务
docker compose ps                       # 查看服务状态
docker compose restart app              # 重启应用
docker compose logs -f app              # 查看应用日志
docker compose logs -f mysql            # 查看数据库日志
```

### 数据库管理
```bash
docker compose exec mysql mysql -u root -p                    # 进入 MySQL
docker compose exec app npx prisma db push                    # 推送数据库架构
docker compose exec app npx tsx scripts/init-admin.ts         # 初始化管理员
docker compose exec -T mysql mysqldump -u union_user -p union_portal > backup.sql  # 备份
```

### 应用更新
```bash
git pull
docker compose up -d --build app
docker compose exec app npx prisma db push --accept-data-loss
```

---

## 📊 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | Next.js App | 应用服务 |
| 3306 | MySQL | 数据库（仅本地） |
| 6379 | Redis | 缓存（仅本地） |
| 80 | Nginx | HTTP（生产模式） |
| 443 | Nginx | HTTPS（生产模式） |

---

## 🔐 默认账户

- **管理员用户名**: `admin`
- **管理员密码**: `.env.docker` 中的 `ADMIN_PASSWORD`
- **数据库用户**: `union_user`
- **数据库密码**: `.env.docker` 中的 `MYSQL_PASSWORD`

---

## ⚠️ 故障排查

### 容器启动失败
```bash
docker compose logs app
docker compose logs mysql
```

### 数据库连接失败
```bash
docker compose exec app node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect().then(() => console.log('成功')).catch(e => console.error(e));
"
```

### 端口被占用
```bash
ss -tuln | grep :3000
# 修改 .env.docker 中的 APP_PORT
```

### 内存不足
```bash
free -h
docker stats
# 升级服务器配置或限制容器内存
```

---

## 📚 文档索引

- **完整部署指南**: `deploy/UBUNTU_DEPLOYMENT_GUIDE.md`
- **一键部署脚本**: `deploy/one-click-deploy.sh`
- **Docker 配置**: `docker-compose.yml`
- **环境变量示例**: `.env.docker.example`
- **Nginx 配置**: `deploy/nginx.conf`

---

## 🔗 快速链接

- 项目首页: `http://localhost:3000`
- 管理后台: `http://localhost:3000/admin/login`
- 健康检查: `http://localhost:3000/api/health`
- API 文档: `http://localhost:3000/api/...`

---

**版本**: 1.0.0 | **更新**: 2026-06-22
