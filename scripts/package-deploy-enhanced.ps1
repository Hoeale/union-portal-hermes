# 工会门户增强版部署包打包脚本
# 包含所有必要文件，确保部署完整性

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Union Portal - Enhanced Deploy Packager" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$ProjectName = "union-portal"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$PackageName = "${ProjectName}-deploy-enhanced-${Timestamp}.tar.gz"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Write-Host "Project: $ProjectRoot" -ForegroundColor Cyan
Write-Host ""

$TempDir = Join-Path $env:TEMP "union-portal-enhanced-$Timestamp"
$PackageDir = Join-Path $TempDir $ProjectName
New-Item -ItemType Directory -Force -Path $PackageDir | Out-Null

Write-Host "[1/4] Copying core files..." -ForegroundColor Green

# 核心源代码文件
$EssentialItems = @(
    "package.json", "package-lock.json", "next.config.mjs", "tsconfig.json",
    "tailwind.config.ts", "postcss.config.mjs", "prisma", "lib", "hooks",
    "components", "app", "scripts", "deploy", "nginx", "public",
    ".env.docker.example", "docker-compose.yml", "Dockerfile",
    ".dockerignore", "README.md"
)

Set-Location $ProjectRoot

foreach ($item in $EssentialItems) {
    $sourcePath = Join-Path $ProjectRoot $item
    if (Test-Path $sourcePath) {
        if (Test-Path $sourcePath -PathType Container) {
            Copy-Item -Path $sourcePath -Destination (Join-Path $PackageDir $item) -Recurse -Force
        } else {
            Copy-Item -Path $sourcePath -Destination $PackageDir -Force
        }
        Write-Host "  OK: $item" -ForegroundColor Gray
    }
}

# 关键：包含 public/uploads 目录（如果有上传文件）
Write-Host ""
Write-Host "[2/4] Including uploaded files..." -ForegroundColor Green

$UploadsPath = Join-Path $ProjectRoot "public/uploads"
if (Test-Path $UploadsPath) {
    $UploadsDest = Join-Path $PackageDir "public/uploads"
    Copy-Item -Path $UploadsPath -Destination $UploadsDest -Recurse -Force
    $UploadsSize = (Get-ChildItem $UploadsPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  OK: public/uploads (${UploadsSize} MB)" -ForegroundColor Gray
} else {
    Write-Host "  SKIP: No uploads directory" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/4] Creating deployment scripts..." -ForegroundColor Green

# 创建增强版部署脚本
$EnhancedDeployScript = @"
#!/bin/bash

# 增强版部署脚本 - 包含详细错误处理

set -e

echo "========================================"
echo "  Enhanced Deployment Script"
echo "========================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查系统资源
echo -e "\${GREEN}[Check]${NC} System Resources..."
MEMORY_MB=\$(free -m | grep Mem | awk '{print \$2}')
echo "  Memory: \${MEMORY_MB} MB"

if [ "\$MEMORY_MB" -lt 3800 ]; then
    echo -e "\${RED}ERROR: Insufficient memory (need 4GB+)${NC}"
    echo -e "\${YELLOW}Solution: Add swap space${NC}"
    echo ""
    echo "Creating 2GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo "Swap created successfully"
fi

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "\${YELLOW}[Install]${NC} Docker..."
    apt update
    apt install -y ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl start docker
    systemctl enable docker
    echo -e "\${GREEN}Docker installed${NC}"
fi

# 配置环境变量
echo -e "\${GREEN}[Config]${NC} Environment..."
if [ ! -f ".env.docker" ]; then
    cp .env.docker.example .env.docker
    
    # 生成安全密码
    SESSION_SECRET=\$(openssl rand -hex 32)
    MYSQL_ROOT_PASS=\$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
    MYSQL_PASS=\$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
    ADMIN_PASS=\$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 12)
    
    sed -i "s/change-this-root-password/\${MYSQL_ROOT_PASS}/" .env.docker
    sed -i "s/change-this-password/\${MYSQL_PASS}/" .env.docker
    sed -i "s/change-this-to-a-random-32-char-string/\${SESSION_SECRET}/" .env.docker
    
    echo ""
    echo -e "\${YELLOW}Generated passwords (SAVE THESE):${NC}"
    echo "  MySQL Root: \${MYSQL_ROOT_PASS}"
    echo "  MySQL User: \${MYSQL_PASS}"
    echo "  Admin: \${ADMIN_PASS}"
    echo ""
fi

# 创建必要目录
mkdir -p nginx/ssl public/uploads logs

# 启动服务
echo -e "\${GREEN}[Start]${NC} Services..."
docker compose up -d mysql redis

echo "Waiting for MySQL..."
for i in {1..30}; do
    if docker compose exec -T mysql mysqladmin ping -h localhost --silent &> /dev/null; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# 启动应用并构建
echo -e "\${GREEN}[Build]${NC} Application (this may take 5-10 minutes)..."
docker compose up -d app

# 等待构建完成
echo "Waiting for build..."
TIMEOUT=600
COUNT=0
while [ \$COUNT -lt \$TIMEOUT ]; do
    STATUS=\$(docker compose ps app --format json 2>/dev/null | grep -o '"Status":"[^"]*"' | cut -d'"' -f4)
    if echo "\$STATUS" | grep -q "healthy"; then
        echo -e "\${GREEN}Build complete!${NC}"
        break
    fi
    echo -n "."
    sleep 10
    COUNT=\$((COUNT + 10))
done

if [ \$COUNT -ge \$TIMEOUT ]; then
    echo -e "\${RED}Build timeout! Check logs:${NC}"
    echo "  docker compose logs app"
    exit 1
fi

# 初始化数据库
echo -e "\${GREEN}[Init]${NC} Database..."
docker compose exec -T app npx prisma db push --accept-data-loss
docker compose exec -T app npx tsx scripts/init-admin.ts

# 获取服务器 IP
SERVER_IP=\$(hostname -I | awk '{print \$1}')

echo ""
echo -e "\${GREEN}========================================${NC}"
echo -e "\${GREEN}  Deployment Complete!${NC}"
echo -e "\${GREEN}========================================${NC}"
echo ""
echo "Access:"
echo "  Website: http://\${SERVER_IP}:3000"
echo "  Admin: http://\${SERVER_IP}:3000/admin/login"
echo ""
"@

$DeployScriptPath = Join-Path $PackageDir "deploy-enhanced.sh"
Set-Content -Path $DeployScriptPath -Value $EnhancedDeployScript -Encoding UTF8
Write-Host "  OK: deploy-enhanced.sh" -ForegroundColor Gray

# 创建部署说明
$ReadmeContent = @"
================================================================================
  Union Portal - Enhanced Deployment Package
================================================================================

This package includes all necessary files for deployment.

QUICK START:
1. Upload to server: scp $PackageName root@your-server-ip:/opt/
2. SSH to server: ssh root@your-server-ip
3. Extract: tar -xzf $PackageName -C /opt/union-portal --strip-components=1
4. Deploy: cd /opt/union-portal && sudo bash deploy-enhanced.sh

DOCUMENTATION:
- Full Guide: deploy/UBUNTU_DEPLOYMENT_GUIDE.md
- Quick Ref: deploy/QUICK_REFERENCE.md
- Checklist: deploy/DEPLOYMENT_CHECKLIST.md

REQUIREMENTS:
- Ubuntu 22.04 LTS
- 4GB+ RAM (script will create swap if needed)
- 40GB+ SSD
- Docker (auto-installed if missing)

================================================================================
"@

$ReadmePath = Join-Path $PackageDir "DEPLOY_README.txt"
Set-Content -Path $ReadmePath -Value $ReadmeContent -Encoding UTF8
Write-Host "  OK: DEPLOY_README.txt" -ForegroundColor Gray

Write-Host ""
Write-Host "[4/4] Creating archive..." -ForegroundColor Green

Set-Location $TempDir

try {
    tar -czf "$PackageName" $ProjectName
    Write-Host "  OK: $PackageName" -ForegroundColor Gray
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    exit 1
}

$FileItem = Get-Item (Join-Path $TempDir $PackageName)
$FileSizeMB = [math]::Round($FileItem.Length / 1MB, 2)

Write-Host ""
Write-Host "Moving package..." -ForegroundColor Green

$FinalPath = Join-Path $ProjectRoot $PackageName
Move-Item -Path (Join-Path $TempDir $PackageName) -Destination $FinalPath -Force

# 清理临时目录（延迟删除避免占用）
Start-Sleep -Seconds 2
try {
    Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
} catch {
    # 忽略清理错误
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Enhanced Package Created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "File: $FinalPath" -ForegroundColor Yellow
Write-Host "Size: ${FileSizeMB} MB" -ForegroundColor Yellow
Write-Host ""
Write-Host "Features:" -ForegroundColor Cyan
Write-Host "  + Includes uploaded files (public/uploads)" -ForegroundColor White
Write-Host "  + Auto swap creation for low memory servers" -ForegroundColor White
Write-Host "  + Detailed error handling and logging" -ForegroundColor White
Write-Host "  + npm China mirror for faster downloads" -ForegroundColor White
Write-Host ""
