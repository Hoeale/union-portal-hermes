# 西安高新区总工会门户网站 - 部署清单

## ✅ 部署前检查

### 服务器要求
- [ ] CPU: 2核以上（推荐4核）
- [ ] 内存: 4GB以上（推荐8GB）
- [ ] 硬盘: 40GB以上 SSD
- [ ] 系统: Ubuntu 22.04 LTS
- [ ] 带宽: 3-5Mbps

### 网络配置
- [ ] SSH 端口 22 可访问
- [ ] HTTP 端口 80 已开放
- [ ] HTTPS 端口 443 已开放
- [ ] 域名已解析（可选）

---

## 📦 部署步骤

### 1. 上传部署包
```bash
# 方式A: 使用 SCP
scp union-portal-deploy-*.tar.gz root@your-server-ip:/opt/

# 方式B: 使用 WinSCP (Windows)
# 图形化拖拽上传
```
- [ ] 部署包已上传到服务器

### 2. SSH 登录服务器
```bash
ssh root@your-server-ip
```
- [ ] 已成功登录服务器

### 3. 解压部署包
```bash
cd /opt
mkdir -p union-portal
tar -xzf union-portal-deploy-*.tar.gz -C union-portal --strip-components=1
cd union-portal
```
- [ ] 文件已解压
- [ ] 进入项目目录

### 4. 运行一键部署
```bash
sudo bash deploy/one-click-deploy.sh
```
- [ ] 脚本执行完成
- [ ] 所有服务启动成功

### 5. 验证部署
```bash
# 检查服务状态
docker compose ps

# 测试访问
curl http://localhost:3000/api/health
```
- [ ] MySQL 状态: healthy
- [ ] Redis 状态: healthy
- [ ] App 状态: healthy
- [ ] API 响应正常

---

## 🔐 安全配置

### 修改默认密码
- [ ] 登录管理后台修改管理员密码
  - 访问: http://your-server-ip/admin/login
  - 默认用户: admin
  
### 配置防火墙
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```
- [ ] 防火墙已配置

### 备份环境变量
```bash
cp .env.docker .env.docker.backup
```
- [ ] .env.docker 已备份

---

## 🌐 域名和 HTTPS（可选）

### 配置域名
- [ ] 域名已购买
- [ ] DNS A 记录已指向服务器 IP
- [ ] 域名解析已生效

### 申请 SSL 证书
```bash
# 安装 Certbot
apt install -y certbot

# 停止 Nginx 容器
docker compose stop nginx

# 申请证书
certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```
- [ ] SSL 证书已申请

### 配置 HTTPS
```bash
# 复制证书
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# 启动生产模式
docker compose --profile production up -d
```
- [ ] HTTPS 已配置
- [ ] 网站可通过 HTTPS 访问

---

## 📊 功能测试

### 前台测试
- [ ] 首页可以访问
- [ ] 新闻列表正常显示
- [ ] 新闻详情页正常
- [ ] 图片加载正常
- [ ] 搜索功能正常

### 后台测试
- [ ] 管理后台可以登录
- [ ] 新闻管理功能正常
- [ ] 图片上传功能正常
- [ ] 用户管理功能正常

### 数据库测试
```bash
docker compose exec mysql mysql -u union_user -p
```
- [ ] 数据库连接正常
- [ ] 表结构已创建

---

## 🔄 运维配置

### 日志检查
```bash
docker compose logs -f app
docker compose logs -f mysql
docker compose logs -f nginx
```
- [ ] 无错误日志

### 备份配置
```bash
# 手动备份
docker compose exec -T mysql mysqldump -u union_user -p union_portal > backup.sql

# 或使用项目备份脚本
docker compose exec app npm run backup
```
- [ ] 备份功能测试成功

### 监控配置
```bash
# 查看资源使用
docker stats

# 查看系统资源
htop
df -h
free -h
```
- [ ] 资源使用正常

---

## 📝 文档清单

已创建的部署文档：

1. **完整部署指南**: `deploy/UBUNTU_DEPLOYMENT_GUIDE.md`
   - 详细的分步部署说明
   - 包含系统初始化、Docker 安装、Nginx 配置、HTTPS 配置
   - 故障排查指南

2. **快速参考**: `deploy/QUICK_REFERENCE.md`
   - 常用命令速查
   - 故障排查快速指南

3. **一键部署脚本**: `deploy/one-click-deploy.sh`
   - 自动化部署流程
   - 适合快速部署

4. **部署包打包脚本**: `scripts/package-deploy.ps1`
   - Windows PowerShell 版本
   - 自动打包项目文件

5. **部署清单**: `deploy/DEPLOYMENT_CHECKLIST.md`
   - 本文件
   - 部署步骤检查和验证

---

## ⚠️ 注意事项

### 密码安全
- [ ] 所有默认密码已修改
- [ ] .env.docker 文件权限设置为 600
- [ ] 密码已安全保存

### 数据备份
- [ ] 数据库备份策略已制定
- [ ] 上传文件备份策略已制定
- [ ] 备份文件定期测试恢复

### 性能优化
- [ ] Redis 缓存已启用
- [ ] Nginx 静态文件缓存已配置
- [ ] Gzip 压缩已启用

### 监控告警
- [ ] 服务监控已配置
- [ ] 磁盘空间监控已配置
- [ ] 错误日志监控已配置

---

## 🎯 部署完成确认

- [ ] 网站可以通过 HTTP/HTTPS 访问
- [ ] 管理后台可以正常登录
- [ ] 所有核心功能测试通过
- [ ] 数据库备份功能正常
- [ ] 监控和日志系统运行正常
- [ ] 安全配置已完成
- [ ] 运维文档已交接

---

## 📞 技术支持

### 常见问题
1. **容器启动失败**: 查看 `docker compose logs`
2. **数据库连接失败**: 检查 `.env.docker` 配置
3. **端口冲突**: 修改 `.env.docker` 中的端口配置
4. **内存不足**: 升级服务器配置

### 日志位置
- 应用日志: `docker compose logs app`
- 数据库日志: `docker compose logs mysql`
- Nginx 日志: `docker compose logs nginx`

### 文档位置
- 完整部署指南: `deploy/UBUNTU_DEPLOYMENT_GUIDE.md`
- 快速参考: `deploy/QUICK_REFERENCE.md`

---

**部署清单版本**: 1.0.0  
**创建日期**: 2026-06-22  
**适用版本**: Union Portal v0.1.0
