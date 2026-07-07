# 工会门户服务器部署指南 (Ubuntu/Debian)

## 📋 前提条件

- 拥有 Ubuntu 20.04+ 或 Debian 11+ 服务器
- 有 root 权限或 sudo 权限
- 服务器可通过 SSH 访问

---

## 🚀 快速部署（3步完成）

### 第 1 步：上传文件到服务器

在本地电脑执行（使用 WinSCP 或命令行）：

```bash
# 压缩项目文件（排除不必要的文件）
cd "E:/CCProject/4.9 工会门户2"
tar -czf union-portal.tar.gz --exclude='node_modules' --exclude='.next' --exclude='.git' .

# 上传到服务器（替换 user 和 your-server-ip）
scp union-portal.tar.gz user@your-server-ip:/tmp/
```

### 第 2 步：SSH 登录服务器并解压

```bash
# SSH 登录服务器
ssh user@your-server-ip

# 解压文件到项目目录
sudo mkdir -p /var/www/union-portal
cd /var/www
sudo tar -xzf /tmp/union-portal.tar.gz -C union-portal
sudo chown -R $USER:$USER /var/www/union-portal
cd /var/www/union-portal
```

### 第 3 步：运行自动化脚本

```bash
# 1. 一键安装服务器环境（Node.js + MySQL + PM2 + Nginx）
sudo bash deploy/setup-server.sh

# 2. 一键部署应用
bash deploy/deploy-app.sh

# 3. 配置 Nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/union-portal
sudo ln -s /etc/nginx/sites-available/union-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ 部署完成

### 访问地址

- **网站首页**: `http://your-server-ip`
- **管理后台**: `http://your-server-ip/admin/login`

### 默认管理员账户

- **用户名**: `admin`
- **密码**: `admin123`

⚠️ **部署后请立即登录后台修改密码！**

---

## 🔧 常用管理命令

### 应用管理

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs union-portal

# 重启应用
pm2 restart union-portal

# 停止应用
pm2 stop union-portal

# 查看实时日志
pm2 logs union-portal --lines 100
```

### 数据库管理

```bash
# 登录 MySQL
mysql -u root -p

# 使用数据库
use union_portal;

# 查看管理员
SELECT * FROM admins;

# 修改管理员密码
# 在 MySQL 中执行：
# UPDATE admins SET password_hash = '新密码hash' WHERE username = 'admin';
```

### Nginx 管理

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx

# 重启 Nginx
sudo systemctl restart nginx

# 查看 Nginx 状态
sudo systemctl status nginx
```

---

## 🔒 安全建议

### 1. 修改默认密码

```bash
# 修改 MySQL root 密码
sudo mysql_secure_installation

# 修改应用管理员密码
# 登录后台 → 设置 → 修改密码
```

### 2. 配置防火墙

```bash
# 启用 UFW 防火墙
sudo ufw enable

# 允许 SSH
sudo ufw allow 22

# 允许 HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 查看状态
sudo ufw status
```

### 3. 配置 HTTPS（有域名后）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 📊 监控和维护

### 设置数据库自动备份

```bash
# 创建备份脚本
nano ~/backup-db.sh
```

添加以下内容：

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/union_portal"
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u union_user -p'Union@2024' union_portal | gzip > $BACKUP_DIR/union_portal_$DATE.sql.gz

# 删除30天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

```bash
# 设置权限
chmod +x ~/backup-db.sh

# 添加定时任务（每天凌晨2点）
crontab -e
# 添加: 0 2 * * * ~/backup-db.sh
```

### 查看磁盘空间

```bash
df -h
du -sh /var/www/union-portal
```

---

## 🐛 故障排查

### 应用无法访问

```bash
# 检查应用状态
pm2 status

# 检查端口占用
sudo netstat -tlnp | grep :3000

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/union-portal-error.log
```

### 数据库连接失败

```bash
# 检查 MySQL 状态
sudo systemctl status mysql

# 测试连接
mysql -u union_user -p union_portal
```

### 更新应用

```bash
cd /var/www/union-portal
git pull
npm install
npm run build
pm2 restart union-portal
```

---

## 📞 技术支持

如遇到问题，请提供以下信息：

1. 服务器操作系统版本
2. 错误日志内容 (`pm2 logs union-portal`)
3. 浏览器控制台错误
4. 服务器资源使用情况

---

## 📝 更新日志

- 2026-04-10: 初始版本部署
