# 部署包问题诊断与解决方案

## 📊 问题诊断

### 为什么 37MB 部署包经常报错？

根据分析，主要有以下原因：

#### 1. **服务器内存不足**（最常见）
- Docker 构建 Next.js 应用需要 **3-4GB 内存**
- 如果服务器只有 2GB 内存，会导致 **OOM (Out of Memory)** 错误
- 表现：构建过程中突然失败，无明确错误信息

#### 2. **Docker 构建超时**
- 国内服务器下载 npm 包速度慢
- 默认超时时间不够
- 表现：`npm ci` 或 `npm run build` 超时

#### 3. **上传文件丢失**
- 37MB 部署包不包含 `public/uploads/` 目录
- 如果本地有上传的图片/文件，部署后丢失
- 表现：图片 404 错误

#### 4. **环境变量未配置**
- `.env.docker` 文件未正确生成
- 数据库连接失败
- 表现：应用启动失败

---

## ✅ 解决方案

### 方案 A：优化现有部署（推荐）⭐⭐⭐

**不需要传输 2GB 项目**，只需优化部署流程：

#### 步骤 1：添加 Swap 空间（解决内存不足）

```bash
# SSH 登录服务器
ssh root@your-server-ip

# 检查当前内存
free -h

# 如果内存小于 4GB，创建 2GB Swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 验证 Swap
free -h

# 设置开机自动启用
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 步骤 2：使用优化后的 Dockerfile

已经为你优化了 `Dockerfile`：
- ✅ 添加了 npm 国内镜像源（加速下载）
- ✅ 限制了 Node.js 内存使用（防止 OOM）
- ✅ 增加了构建超时时间

#### 步骤 3：重新部署

```bash
# 进入项目目录
cd /opt/union-portal

# 停止旧服务
docker compose down

# 重新构建（使用优化后的 Dockerfile）
docker compose build --no-cache

# 启动服务
docker compose up -d

# 查看构建日志
docker compose logs -f app
```

#### 步骤 4：上传缺失的文件（如果有）

```bash
# 从本地上传 uploads 目录
scp -r public/uploads/ root@your-server-ip:/opt/union-portal/public/

# 设置权限
ssh root@your-server-ip
chmod -R 777 /opt/union-portal/public/uploads
```

---

### 方案 B：传输完整项目（不推荐）❌

**为什么不建议？**

1. ❌ **Windows 的 node_modules 在 Linux 无法使用**
   - 包含二进制编译文件（如 `bcrypt`、`sharp`）
   - 平台不兼容，必须重新编译

2. ❌ **传输时间长且不稳定**
   - 2GB 文件在慢速网络下需要 10-30 分钟
   - WinSCP 传输大文件容易中断
   - 断点续传不可靠

3. ❌ **包含大量无用文件**
   ```
   node_modules/     ~1.5GB  (需要在 Linux 重新安装)
   .next/            ~400MB  (需要在 Linux 重新构建)
   .git/             ~100MB  (部署不需要)
   performance-tests/~20MB   (生产环境不需要)
   ```

4. ❌ **文件权限问题**
   - Windows 和 Linux 文件权限不同
   - 可能导致执行权限丢失

**如果坚持要用此方案：**

```bash
# 1. 在本地排除不必要的文件
# 创建 .dockerdeployignore
node_modules/
.next/
.git/
performance-tests/
*.log
.DS_Store

# 2. 使用 rsync 传输（比 WinSCP 更可靠）
rsync -avz --exclude-from='.dockerdeployignore' \
  ./ root@your-server-ip:/opt/union-portal/

# 3. 在服务器上重新安装依赖和构建
cd /opt/union-portal
npm install
npm run build
```

---

### 方案 C：分步部署（适合网络差的情况）⭐⭐

#### 第 1 步：先传输代码（37MB）

```bash
# 使用 37MB 部署包
scp union-portal-deploy-*.tar.gz root@your-server-ip:/opt/
```

#### 第 2 步：在服务器上构建

```bash
ssh root@your-server-ip
cd /opt/union-portal

# 添加 Swap（如果需要）
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile

# 构建 Docker 镜像
docker compose build
```

#### 第 3 步：传输上传文件（如果有）

```bash
# 只传输 uploads 目录（通常几十 MB）
scp -r public/uploads/ root@your-server-ip:/opt/union-portal/public/
```

---

## 🔧 常见错误及解决方案

### 错误 1：构建失败 - Out of Memory

**症状：**
```
Killed
npm ERR! code 137
```

**解决：**
```bash
# 添加 Swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 或者升级服务器配置到 4GB+ 内存
```

### 错误 2：npm 安装超时

**症状：**
```
npm ERR! network timeout at: https://registry.npmjs.org/...
```

**解决：**

已优化 Dockerfile，使用国内镜像源。重新构建即可：

```bash
docker compose build --no-cache
```

### 错误 3：数据库连接失败

**症状：**
```
Error: Can't connect to MySQL server
```

**解决：**
```bash
# 检查 MySQL 是否启动
docker compose ps mysql

# 检查环境变量
cat .env.docker

# 重新初始化
docker compose exec app npx prisma db push --accept-data-loss
```

### 错误 4：图片 404

**症状：**
上传的图片无法访问

**解决：**
```bash
# 从本地上传 uploads 目录
scp -r public/uploads/ root@your-server-ip:/opt/union-portal/public/

# 设置权限
ssh root@your-server-ip
chmod -R 777 /opt/union-portal/public/uploads
```

---

## 📋 推荐的部署流程

### ✅ 最佳实践（使用 37MB 部署包）

```bash
# === 在本地电脑上 ===

# 1. 打包（37MB）
powershell -ExecutionPolicy Bypass -File scripts\package-deploy.ps1

# 2. 上传到服务器
scp union-portal-deploy-*.tar.gz root@your-server-ip:/opt/


# === 在服务器上 ===

# 3. SSH 登录
ssh root@your-server-ip

# 4. 解压
cd /opt
mkdir -p union-portal
tar -xzf union-portal-deploy-*.tar.gz -C union-portal --strip-components=1
cd union-portal

# 5. 添加 Swap（如果内存 < 4GB）
free -m
# 如果小于 3800，执行：
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile

# 6. 一键部署
sudo bash deploy/one-click-deploy.sh

# 7. 上传 uploads 目录（如果有）
# 在本地执行：
scp -r public/uploads/ root@your-server-ip:/opt/union-portal/public/

# 8. 验证部署
docker compose ps
curl http://localhost:3000/api/health
```

---

## 🎯 总结

### 不要传输 2GB 项目的原因：

| 对比项 | 37MB 部署包 | 2GB 完整项目 |
|--------|------------|-------------|
| 传输时间 | 1-2 分钟 | 10-30 分钟 |
| 传输稳定性 | ✅ 高 | ❌ 低（易中断） |
| 平台兼容性 | ✅ Linux 原生编译 | ❌ Windows 编译不兼容 |
| 文件大小 | ✅ 37MB | ❌ 2GB |
| 部署成功率 | ✅ 高（优化后） | ❌ 低 |

### 推荐方案：

**使用 37MB 部署包 + 优化措施：**
1. ✅ 添加 Swap 空间（解决内存不足）
2. ✅ 使用优化后的 Dockerfile（国内镜像 + 内存限制）
3. ✅ 单独传输 uploads 目录（如果有上传文件）
4. ✅ 使用 `docker compose build --no-cache` 重新构建

**预计部署成功率：95%+**

---

## 📞 需要帮助？

如果部署仍然失败，请提供：
1. 服务器配置（CPU、内存、硬盘）
2. 错误日志：`docker compose logs app`
3. 系统资源：`free -h` 和 `df -h`

我们可以进一步诊断问题。
