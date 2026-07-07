#!/bin/bash

# 工会门户一键部署脚本
# 适用于 Ubuntu 22.04 + Docker
# 使用方式: sudo bash deploy/one-click-deploy.sh

set -e

echo "========================================"
echo "  工会门户 - 一键部署脚本"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 sudo 运行此脚本${NC}"
    echo "  sudo bash deploy/one-click-deploy.sh"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}请在项目根目录运行此脚本${NC}"
    exit 1
fi

PROJECT_DIR="$(pwd)"

echo -e "${CYAN}项目目录: ${PROJECT_DIR}${NC}"
echo ""

# ============================================
# 第一步：系统检查
# ============================================
echo -e "${GREEN}[步骤 1/8]${NC} 系统环境检查..."

# 检查操作系统
if [ -f /etc/os-release ]; then
    OS_NAME=$(cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '"')
    echo -e "  操作系统: ${GREEN}${OS_NAME}${NC}"
fi

# 检查内存
MEMORY=$(free -h | grep Mem | awk '{print $2}')
MEMORY_AVAILABLE=$(free -h | grep Mem | awk '{print $7}')
echo -e "  内存: ${CYAN}${MEMORY}${NC} (可用: ${MEMORY_AVAILABLE})"

# 检查 CPU
CPU_CORES=$(nproc)
echo -e "  CPU: ${CYAN}${CPU_CORES} 核${NC}"

# 检查磁盘
DISK_AVAILABLE=$(df -h / | tail -1 | awk '{print $4}')
echo -e "  磁盘可用: ${CYAN}${DISK_AVAILABLE}${NC}"

# 检查最低要求
MEMORY_MB=$(free -m | grep Mem | awk '{print $2}')
if [ "$MEMORY_MB" -lt 3800 ]; then
    echo -e "${YELLOW}  ⚠ 内存低于 4GB，可能影响性能${NC}"
fi

if [ "$CPU_CORES" -lt 2 ]; then
    echo -e "${RED}  ✗ CPU 核心数不足（至少需要 2 核）${NC}"
    exit 1
fi

echo ""

# ============================================
# 第二步：安装 Docker（如未安装）
# ============================================
echo -e "${GREEN}[步骤 2/8]${NC} 检查 Docker..."

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}  Docker 未安装，正在安装...${NC}"
    
    apt update
    apt install -y ca-certificates curl gnupg lsb-release
    
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    systemctl start docker
    systemctl enable docker
    
    echo -e "  ${GREEN}✓ Docker 安装完成${NC}"
else
    DOCKER_VERSION=$(docker --version)
    echo -e "  ${GREEN}✓ ${DOCKER_VERSION}${NC}"
fi

# 检查 Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}  ✗ Docker Compose 未安装${NC}"
    exit 1
else
    COMPOSE_VERSION=$(docker compose version)
    echo -e "  ${GREEN}✓ ${COMPOSE_VERSION}${NC}"
fi

echo ""

# ============================================
# 第三步：配置环境变量
# ============================================
echo -e "${GREEN}[步骤 3/8]${NC} 配置环境变量..."

if [ ! -f ".env.docker" ]; then
    echo -e "${YELLOW}  创建 .env.docker 文件...${NC}"
    cp .env.docker.example .env.docker
    
    # 生成随机密钥
    SESSION_SECRET=$(openssl rand -hex 32)
    MYSQL_ROOT_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
    MYSQL_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
    ADMIN_PASS=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 12)
    
    # 替换默认值
    sed -i "s/change-this-root-password/${MYSQL_ROOT_PASS}/" .env.docker
    sed -i "s/change-this-password/${MYSQL_PASS}/" .env.docker
    sed -i "s/change-this-to-a-random-32-char-string/${SESSION_SECRET}/" .env.docker
    sed -i "s/change-this-password/${ADMIN_PASS}/" .env.docker
    
    echo ""
    echo -e "${GREEN}  ✓ 已自动生成安全密码${NC}"
    echo ""
    echo -e "${YELLOW}  请保存以下密码信息：${NC}"
    echo -e "  MySQL Root 密码: ${CYAN}${MYSQL_ROOT_PASS}${NC}"
    echo -e "  MySQL 用户密码: ${CYAN}${MYSQL_PASS}${NC}"
    echo -e "  管理员密码: ${CYAN}${ADMIN_PASS}${NC}"
    echo -e "  Session Secret: ${CYAN}${SESSION_SECRET}${NC}"
    echo ""
    echo -e "${YELLOW}  这些密码已写入 .env.docker 文件，请妥善保管！${NC}"
    echo ""
    read -p "  按 Enter 继续..."
else
    echo -e "  ${GREEN}✓ .env.docker 已存在${NC}"
    echo -e "  ${YELLOW}如需重新配置，请删除 .env.docker 后重新运行此脚本${NC}"
fi

echo ""

# ============================================
# 第四步：创建必要目录
# ============================================
echo -e "${GREEN}[步骤 4/8]${NC} 创建目录结构..."

mkdir -p nginx/ssl
mkdir -p public/uploads
mkdir -p mysql/init
mkdir -p logs

chmod -R 777 public/uploads

echo -e "  ${GREEN}✓ 目录创建完成${NC}"
echo ""

# ============================================
# 第五步：启动服务
# ============================================
echo -e "${GREEN}[步骤 5/8]${NC} 启动 Docker 服务..."

echo -e "  ${CYAN}正在启动 MySQL、Redis 和应用服务...${NC}"
docker compose up -d mysql redis app

echo -e "  ${CYAN}等待服务启动（30 秒）...${NC}"
for i in {1..30}; do
    echo -ne "  ${YELLOW}●${NC}"
    sleep 1
done
echo ""

# 检查服务状态
echo ""
echo -e "  ${CYAN}服务状态:${NC}"
docker compose ps

echo ""

# ============================================
# 第六步：等待数据库就绪
# ============================================
echo -e "${GREEN}[步骤 6/8]${NC} 等待数据库就绪..."

MAX_WAIT=60
WAIT_COUNT=0

echo -n "  等待 MySQL 启动"
until docker compose exec -T mysql mysqladmin ping -h localhost --silent &> /dev/null; do
    echo -n "."
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 2))
    if [ "$WAIT_COUNT" -ge "$MAX_WAIT" ]; then
        echo ""
        echo -e "${RED}  ✗ MySQL 启动超时${NC}"
        echo -e "${YELLOW}  请查看日志: docker compose logs mysql${NC}"
        exit 1
    fi
done
echo -e "${GREEN} ✓${NC}"

echo ""

# ============================================
# 第七步：数据库迁移
# ============================================
echo -e "${GREEN}[步骤 7/8]${NC} 初始化数据库..."

echo -e "  ${CYAN}推送数据库架构...${NC}"
docker compose exec -T app npx prisma db push --accept-data-loss

echo -e "  ${CYAN}初始化管理员账户...${NC}"
docker compose exec -T app npx tsx scripts/init-admin.ts

echo -e "  ${GREEN}✓ 数据库初始化完成${NC}"
echo ""

# ============================================
# 第八步：验证部署
# ============================================
echo -e "${GREEN}[步骤 8/8]${NC} 验证部署..."

echo -e "  ${CYAN}测试应用响应...${NC}"
sleep 5

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}✓ 应用响应正常 (HTTP $HTTP_CODE)${NC}"
else
    echo -e "  ${YELLOW}⚠ 应用响应异常 (HTTP $HTTP_CODE)${NC}"
    echo -e "  ${YELLOW}请查看日志: docker compose logs app${NC}"
fi

echo ""

# 获取服务器 IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# ============================================
# 部署完成
# ============================================
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}访问地址:${NC}"
echo -e "  网站首页: ${GREEN}http://${SERVER_IP}:3000${NC}"
echo -e "  管理后台: ${GREEN}http://${SERVER_IP}:3000/admin/login${NC}"
echo ""
echo -e "${CYAN}管理员账户:${NC}"
echo -e "  用户名: ${GREEN}admin${NC}"
echo -e "  密码: ${GREEN}(见 .env.docker 中的 ADMIN_PASSWORD)${NC}"
echo ""
echo -e "${YELLOW}⚠️  重要提示：${NC}"
echo -e "  1. 请立即登录管理后台修改密码"
echo -e "  2. 请妥善保管 .env.docker 文件中的密码"
echo -e "  3. 建议配置防火墙和 HTTPS"
echo ""
echo -e "${CYAN}常用命令:${NC}"
echo -e "  查看日志: ${GREEN}docker compose logs -f app${NC}"
echo -e "  重启应用: ${GREEN}docker compose restart app${NC}"
echo -e "  查看状态: ${GREEN}docker compose ps${NC}"
echo -e "  停止服务: ${GREEN}docker compose down${NC}"
echo ""
echo -e "${CYAN}启动完整模式（含 Nginx 和 HTTPS）:${NC}"
echo -e "  ${GREEN}docker compose --profile production up -d${NC}"
echo ""
echo -e "${CYAN}详细部署指南:${NC}"
echo -e "  ${GREEN}deploy/UBUNTU_DEPLOYMENT_GUIDE.md${NC}"
echo ""
