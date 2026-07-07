# Windows 用户部署指南

## 📋 前提条件

- Windows 10/11 电脑
- 拥有 Ubuntu/Debian 服务器的 SSH 访问权限
- 已安装 PowerShell（Windows 自带）

---

## 🚀 快速部署（4步完成）

### 第 1 步：准备部署包

在项目目录执行：

```powershell
cd "E:\CCProject\4.9 工会门户2"

# 方式 A: 使用 Git Bash（推荐）
# 打开 Git Bash，执行:
tar -czf ../union_portal-deploy.tar.gz --exclude='node_modules' --exclude='.next' --exclude='.git' .

# 方式 B: 使用 WSL（Windows Subsystem for Linux）
# 在 PowerShell 中执行:
wsl tar -czf ../union_portal-deploy.tar.gz --exclude='node_modules' --exclude='.next' --exclude='.git' .
```

### 第 2 步：上传到服务器

**选项 A: 使用 PowerShell 上传脚本（推荐）**

```powershell
# 执行上传脚本
cd "E:\CCProject\4.9 工会门户2"
.\deploy\upload-to-server.ps1
```

**选项 B: 使用 WinSCP 图形界面**

1. 下载并安装 WinSCP: https://winscp.net/
2. 打开 WinSCP，输入服务器信息：
   - 协议: SFTP
   - 主机名: `你的服务器IP`
   - 端口: 22
   - 用户名: `你的用户名`
   - 密码: `你的密码`
3. 登录后，将 `E:\CCProject\union_portal-deploy.tar.gz` 上传到 `/tmp/` 目录

**选项 C: 使用 Windows 内置 OpenSSH**

```powershell
# 确认已安装 OpenSSH 客户端（设置 → 应用 → 可选功能）
scp E:\CCProject\union_portal-deploy.tar.gz user@your-server:/tmp/
```

### 第 3 步：SSH 登录服务器

**选项 A: 使用 PowerShell**

```powershell
ssh user@your-server-ip
```

**选项 B: 使用 PuTTY**

1. 下载 PuTTY: https://www.putty.org/
2. 打开 PuTTY，输入服务器 IP
3. 点击 Open 连接

### 第 4 步：运行部署脚本

登录服务器后执行：

```bash
# 1. 解压文件
sudo mkdir -p /var/www/union-portal
cd /var/www
sudo tar -xzf /tmp/union_portal-deploy.tar.gz -C union-portal
sudo chown -R $USER:$USER /var/www/union-portal
cd /var/www/union-portal

# 2. 一键安装服务器环境
sudo bash deploy/setup-server.sh

# 3. 一键部署应用
bash deploy/deploy-app.sh

# 4. 配置 Nginx
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

## 🛠️ Windows 环境准备

### 安装 Git Bash（推荐）

1. 下载 Git: https://git-scm.com/download/win
2. 安装时选择 "Git Bash Here"

### 安装 OpenSSH（Windows 10/11 自带）

```powershell
# 检查是否已安装
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'

# 如果未安装，运行:
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### 安装 WSL（可选）

```powershell
# 启用 WSL
wsl --install
```

---

## 🔧 常用工具

### PowerShell SSH

```powershell
# 连接服务器
ssh user@server

# 传输文件
scp local-file.txt user@server:/path/

# 从服务器下载
scp user@server:/path/file.txt local-path\
```

### PuTTY 常用命令

在 PuTTY 终端中，命令与 Linux 相同：

```bash
pm2 status
pm2 logs union-portal
pm2 restart union-portal
```

---

## 📞 故障排查

### 问题: tar 命令不可用

**解决方案**:
- 安装 Git Bash，使用 Git Bash 执行 tar 命令
- 或启用 WSL，使用 `wsl tar` 命令

### 问题: scp 命令不可用

**解决方案**:
- 启用 Windows OpenSSH 客户端
- 或使用 WinSCP 图形界面

### 问题: 无法连接服务器

**检查清单**:
- 服务器 IP 地址是否正确
- SSH 服务是否运行 (22 端口)
- 防火墙是否允许 SSH 连接

---

## 📝 下一步

部署完成后，建议：

1. 修改默认管理员密码
2. 配置防火墙
3. 申请域名并配置 HTTPS
4. 设置数据库自动备份

详见: `deploy/SIMPLE_GUIDE.md` 中的安全建议和监控维护部分。
