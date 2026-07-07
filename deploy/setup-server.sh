#!/bin/bash

# 工会门户自动化部署脚本
# 适用于 Ubuntu 20.04+ / Debian 11+
# 使用方法: sudo bash setup-server.sh

set -e

echo "========================================"
echo "  工会门户 - 自动化部署脚本"
echo "========================================"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用 sudo 运行此脚本: sudo bash setup-server.sh"
    exit 1
fi

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤 1: 更新系统
echo -e "${GREEN}[1/8]${NC} 更新系统包..."
apt update && apt upgrade -y

# 步骤 2: 安装 Node.js 18.x
echo -e "${GREEN}[2/8]${NC} 安装 Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

echo -e "  Node.js 版本: $(node -v)"
echo -e "  NPM 版本: $(npm -v)"

# 步骤 3: 安装 MySQL
echo -e "${GREEN}[3/8]${NC} 安装 MySQL..."
export DEBIAN_FRONTEND=noninteractive
apt install -y mysql-server

# 启动 MySQL
systemctl start mysql
systemctl enable mysql

echo -e "  MySQL 状态: $(systemctl is-active mysql)"

# 步骤 4: 安装 PM2
echo -e "${GREEN}[4/8]${NC} 安装 PM2 进程管理器..."
npm install -g pm2

# 步骤 5: 安装 Nginx
echo -e "${GREEN}[5/8]${NC} 安装 Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

echo -e "  Nginx 状态: $(systemctl is-active nginx)"

# 步骤 6: 安装其他必要工具
echo -e "${GREEN}[6/8]${NC} 安装必要工具..."
apt install -y git curl wget vim

# 步骤 7: 配置 MySQL
echo -e "${GREEN}[7/8]${NC} 配置 MySQL 数据库..."
echo ""
echo -e "${YELLOW}请设置 MySQL root 密码${NC}"

# 设置 MySQL root 密码（非交互式）
MYSQL_ROOT_PASSWORD=""
while [ -z "$MYSQL_ROOT_PASSWORD" ]; do
    read -sp "MySQL root 密码: " MYSQL_ROOT_PASSWORD
    echo
    read -sp "确认密码: " MYSQL_ROOT_PASSWORD_CONFIRM
    echo

    if [ "$MYSQL_ROOT_PASSWORD" = "$MYSQL_ROOT_PASSWORD_CONFIRM" ]; then
        break
    fi
    echo -e "${RED}密码不匹配，请重新输入${NC}"
done

# 配置 MySQL
MYSQL_COMMAND="mysql -u root -p$MYSQL_ROOT_PASSWORD"

# 创建数据库和用户
$MYSQL_COMMAND <<EOF
CREATE DATABASE IF NOT EXISTS union_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'union_user'@'localhost' IDENTIFIED BY 'Union@2024';
GRANT ALL PRIVILEGES ON union_portal.* TO 'union_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo -e "  数据库 'union_portal' 创建成功"

# 步骤 8: 创建项目目录
echo -e "${GREEN}[8/8]${NC} 创建项目目录..."
PROJECT_DIR="/var/www/union-portal"
mkdir -p $PROJECT_DIR

# 创建上传目录
mkdir -p $PROJECT_DIR/public/uploads
chmod 755 $PROJECT_DIR/public/uploads

# 获取当前用户名
CURRENT_USER=${SUDO_USER:-$USER}
echo -e "  项目目录: $PROJECT_DIR"
echo -e "  当前用户: $CURRENT_USER"

# 设置目录权限
chown -R $CURRENT_USER:$CURRENT_USER $PROJECT_DIR

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  环境安装完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "MySQL root 密码: ${YELLOW}$MYSQL_ROOT_PASSWORD${NC}"
echo -e "数据库用户: union_user"
echo -e "数据库密码: Union@2024"
echo -e "数据库名称: union_portal"
echo ""
echo -e "下一步："
echo -e "1. 上传项目文件到服务器"
echo -e "2. 运行部署脚本: cd $PROJECT_DIR && bash deploy-app.sh"
echo ""
echo -e "${YELLOW}注意：请妥善保管数据库密码！${NC}"
echo ""
