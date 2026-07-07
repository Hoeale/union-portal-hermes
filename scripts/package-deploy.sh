#!/bin/bash

# 工会门户部署包打包脚本
# 用于创建可在服务器上直接部署的压缩包
# 使用方式: bash scripts/package-deploy.sh

set -e

echo "========================================"
echo "  工会门户 - 部署包打包工具"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 项目名称
PROJECT_NAME="union-portal"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="${PROJECT_NAME}-deploy-${TIMESTAMP}.tar.gz"

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo -e "项目目录: ${GREEN}${PROJECT_ROOT}${NC}"
echo ""

# 创建临时打包目录
TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="${TEMP_DIR}/${PROJECT_NAME}"
mkdir -p "${PACKAGE_DIR}"

echo -e "${GREEN}[1/8]${NC} 复制项目文件..."

# 复制核心文件
cd "${PROJECT_ROOT}"

# 必需的文件和目录
ESSENTIAL_FILES=(
  "package.json"
  "package-lock.json"
  "next.config.mjs"
  "tsconfig.json"
  "tailwind.config.ts"
  "postcss.config.mjs"
  "prisma"
  "lib"
  "hooks"
  "components"
  "app"
  "scripts"
  "deploy"
  "nginx"
  "public"
  ".env.docker.example"
  "docker-compose.yml"
  "Dockerfile"
  ".dockerignore"
  "README.md"
)

for item in "${ESSENTIAL_FILES[@]}"; do
  if [ -e "$item" ]; then
    cp -r "$item" "${PACKAGE_DIR}/"
    echo "  ✓ $item"
  fi
done

echo ""
echo -e "${GREEN}[2/8]${NC} 创建部署配置文件..."

# 创建快速部署脚本
cat > "${PACKAGE_DIR}/QUICK_DEPLOY.sh" << 'SCRIPT'
#!/bin/bash

# 快速部署脚本 - 在服务器上运行
# 使用方式: sudo bash QUICK_DEPLOY.sh

set -e

echo "========================================"
echo "  工会门户 - 快速部署"
echo "========================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker 未安装，正在安装...${NC}"
    apt update
    apt install -y ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl start docker
    systemctl enable docker
    echo -e "${GREEN}Docker 安装完成${NC}"
fi

echo -e "${GREEN}[1/4]${NC} 配置环境变量..."

if [ ! -f .env.docker ]; then
    cp .env.docker.example .env.docker
    echo -e "${YELLOW}请编辑 .env.docker 文件，修改以下配置:${NC}"
    echo "  - MYSQL_ROOT_PASSWORD (MySQL root 密码)"
    echo "  - MYSQL_PASSWORD (数据库用户密码)"
    echo "  - ADMIN_PASSWORD (管理员密码)"
    echo "  - ADMIN_SESSION_SECRET (运行: openssl rand -hex 32)"
    echo ""
    echo "按 Enter 继续..."
    read
fi

echo -e "${GREEN}[2/4]${NC} 启动服务..."
docker compose up -d mysql redis app

echo -e "${GREEN}[3/4]${NC} 等待数据库就绪..."
sleep 30

echo -e "${GREEN}[4/4]${NC} 初始化数据库..."
docker compose exec app npx prisma db push --accept-data-loss
docker compose exec app npx tsx scripts/init-admin.ts

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "访问地址: http://your-server-ip:3000"
echo "管理后台: http://your-server-ip:3000/admin/login"
echo ""
echo "启动完整模式（含 Nginx）:"
echo "  docker compose --profile production up -d"
echo ""
SCRIPT

chmod +x "${PACKAGE_DIR}/QUICK_DEPLOY.sh"
echo "  ✓ QUICK_DEPLOY.sh"

echo ""
echo -e "${GREEN}[3/8]${NC} 创建部署检查脚本..."

cat > "${PACKAGE_DIR}/check-deploy.sh" << 'SCRIPT'
#!/bin/bash

# 部署环境检查脚本

echo "========================================"
echo "  部署环境检查"
echo "========================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查操作系统
echo -n "操作系统: "
if [ -f /etc/os-release ]; then
    cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '"'
else
    echo -e "${RED}未知${NC}"
fi

# 检查内存
echo -n "内存: "
free -h | grep Mem | awk '{print $2 " (可用: " $7 ")"}'

# 检查 CPU
echo -n "CPU: "
nproc
echo " 核"

# 检查磁盘
echo -n "磁盘可用空间: "
df -h / | tail -1 | awk '{print $4}'

echo ""

# 检查 Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker: $(docker --version)"
else
    echo -e "${RED}✗${NC} Docker 未安装"
fi

# 检查 Docker Compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose: $(docker compose version)"
else
    echo -e "${RED}✗${NC} Docker Compose 未安装"
fi

echo ""

# 检查端口
echo "端口检查:"
for port in 80 443 3000 3306 6379; do
    if ss -tuln | grep -q ":$port "; then
        echo -e "  ${YELLOW}⚠${NC} 端口 $port 已被占用"
    else
        echo -e "  ${GREEN}✓${NC} 端口 $port 可用"
    fi
done

echo ""
echo "========================================"
SCRIPT

chmod +x "${PACKAGE_DIR}/check-deploy.sh"
echo "  ✓ check-deploy.sh"

echo ""
echo -e "${GREEN}[4/8]${NC} 创建备份脚本..."

mkdir -p "${PACKAGE_DIR}/scripts/backup"

cat > "${PACKAGE_DIR}/scripts/backup/quick-backup.sh" << 'SCRIPT'
#!/bin/bash

# 快速备份脚本

BACKUP_DIR="/opt/union-portal/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/backup-${TIMESTAMP}"

mkdir -p "${BACKUP_PATH}"

echo "开始备份..."

# 备份数据库
docker compose exec -T mysql mysqldump -u union_user -p"${MYSQL_PASSWORD}" union_portal > "${BACKUP_PATH}/database.sql"

# 备份上传文件
cp -r /opt/union-portal/public/uploads "${BACKUP_PATH}/uploads"

# 备份环境变量
cp /opt/union-portal/.env.docker "${BACKUP_PATH}/"

# 压缩
cd "${BACKUP_DIR}"
tar -czf "backup-${TIMESTAMP}.tar.gz" "backup-${TIMESTAMP}"
rm -rf "backup-${TIMESTAMP}"

echo "备份完成: ${BACKUP_DIR}/backup-${TIMESTAMP}.tar.gz"
SCRIPT

chmod +x "${PACKAGE_DIR}/scripts/backup/quick-backup.sh"
echo "  ✓ scripts/backup/quick-backup.sh"

echo ""
echo -e "${GREEN}[5/8]${NC} 创建 README 部署说明..."

cat > "${PACKAGE_DIR}/DEPLOY_README.txt" << 'EOF'
================================================================================
  西安高新区总工会门户网站 - 部署说明
================================================================================

【快速开始】

1. 上传此目录到服务器
   scp -r union-portal-deploy-* root@your-server-ip:/opt/union-portal/

2. SSH 登录服务器
   ssh root@your-server-ip

3. 进入项目目录
   cd /opt/union-portal

4. 运行环境检查（可选）
   bash check-deploy.sh

5. 运行快速部署
   sudo bash QUICK_DEPLOY.sh

6. 配置环境变量
   vim .env.docker
   修改以下配置：
   - MYSQL_ROOT_PASSWORD
   - MYSQL_PASSWORD  
   - ADMIN_PASSWORD
   - ADMIN_SESSION_SECRET (生成: openssl rand -hex 32)

7. 启动服务
   docker compose up -d

8. 初始化数据库
   docker compose exec app npx prisma db push --accept-data-loss
   docker compose exec app npx tsx scripts/init-admin.ts

9. 访问网站
   http://your-server-ip:3000
   管理后台: http://your-server-ip:3000/admin/login

【完整部署指南】

详细部署说明请查看: deploy/UBUNTU_DEPLOYMENT_GUIDE.md

【常用命令】

启动服务:          docker compose up -d
停止服务:          docker compose down
查看状态:          docker compose ps
查看日志:          docker compose logs -f app
重启应用:          docker compose restart app
数据库备份:        bash scripts/backup/quick-backup.sh
更新应用:          docker compose up -d --build

【默认账户】

管理员用户名: admin
管理员密码: (在 .env.docker 中设置)

【技术支持】

如遇问题请查看:
1. 应用日志: docker compose logs -f app
2. 数据库日志: docker compose logs -f mysql
3. 部署指南: deploy/UBUNTU_DEPLOYMENT_GUIDE.md

================================================================================
EOF

echo "  ✓ DEPLOY_README.txt"

echo ""
echo -e "${GREEN}[6/8]${NC} 清理不必要的文件..."

# 创建 .dockerignore 确保不会打包多余文件
cat > "${PACKAGE_DIR}/.dockerignore" << 'EOF'
node_modules
.next
.git
.gitignore
*.md
!README.md
!DEPLOY_README.txt
.env
.env.local
.env.production
.DS_Store
coverage
.nyc_output
*.log
performance-tests
.qoder
.superpowers
.claude
EOF

echo "  ✓ 清理配置完成"

echo ""
echo -e "${GREEN}[7/8]${NC} 压缩打包..."

cd "${TEMP_DIR}"
tar -czf "${PACKAGE_NAME}" "${PROJECT_NAME}"

echo "  ✓ 打包完成: ${PACKAGE_NAME}"

# 计算文件大小
FILE_SIZE=$(du -h "${PACKAGE_NAME}" | cut -f1)
echo "  文件大小: ${FILE_SIZE}"

echo ""
echo -e "${GREEN}[8/8]${NC} 移动打包文件到项目根目录..."

mv "${PACKAGE_NAME}" "${PROJECT_ROOT}/"

# 清理临时目录
rm -rf "${TEMP_DIR}"

echo "  ✓ 打包文件已保存"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署包打包完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "打包文件: ${YELLOW}${PROJECT_ROOT}/${PACKAGE_NAME}${NC}"
echo -e "文件大小: ${YELLOW}${FILE_SIZE}${NC}"
echo ""
echo -e "下一步操作:"
echo -e "1. 上传到服务器:"
echo -e "   ${YELLOW}scp ${PACKAGE_NAME} root@your-server-ip:/opt/union-portal/${NC}"
echo ""
echo -e "2. 在服务器解压:"
echo -e "   ${YELLOW}tar -xzf ${PACKAGE_NAME}${NC}"
echo ""
echo -e "3. 开始部署:"
echo -e "   ${YELLOW}sudo bash QUICK_DEPLOY.sh${NC}"
echo ""
