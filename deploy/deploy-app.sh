#!/bin/bash

# 工会门户应用部署脚本
# 使用方法: cd /var/www/union-portal && bash deploy-app.sh

set -e

echo "========================================"
echo "  工会门户 - 应用部署脚本"
echo "========================================"
echo ""

PROJECT_DIR="/var/www/union-portal"
cd $PROJECT_DIR

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 步骤 1: 安装依赖
echo -e "${GREEN}[1/6]${NC} 安装项目依赖..."
npm install

# 步骤 2: 配置环境变量
echo -e "${GREEN}[2/6]${NC} 配置环境变量..."

# 生成随机密钥
SESSION_SECRET=$(openssl rand -hex 16)

cat > .env.production <<EOF
# 数据库配置
DATABASE_URL="mysql://union_user:Union@2024@localhost:3306/union_portal"

# 管理员会话密钥
ADMIN_SESSION_SECRET=$SESSION_SECRET

# 应用配置
NEXT_PUBLIC_APP_URL=http://$(hostname -I | awk '{print $1}'):3000
NEXT_PUBLIC_SITE_NAME=西安高新区总工会
EOF

echo -e "  环境变量配置完成"

# 步骤 3: 构建应用
echo -e "${GREEN}[3/6]${NC} 构建生产版本..."
npm run build

# 步骤 4: 生成 Prisma Client
echo -e "${GREEN}[4/6]${NC} 生成数据库 Client..."
npx prisma generate

# 步骤 5: 推送数据库架构
echo -e "${GREEN}[5/6]${NC} 配置数据库..."
echo ""
echo -e "${YELLOW}请输入 MySQL root 密码:${NC}"
read -sp "密码: " MYSQL_ROOT_PASSWORD

# 推送数据库架构
MYSQL_COMMAND="mysql -u root -p$MYSQL_ROOT_PASSWORD union_portal"
$MYSQL_COMMAND <<EOF &> /dev/null

EOF

# 使用 Prisma 推送架构
npx prisma db push --skip-generate

# 步骤 6: 初始化数据
echo -e "${GREEN}[6/6]${NC} 初始化管理员和示例数据..."
npx tsx scripts/init-admin.ts

# 步骤 7: 启动应用
echo ""
echo -e "${GREEN}[7/7]${NC} 启动应用..."

# 停止旧的进程（如果有）
pm2 delete union-portal 2>/dev/null || true

# 启动新进程
pm2 start npm --name "union-portal" -- start

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup systemd -u $USER --hp /home/$USER

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  应用部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "应用信息："
echo -e "  地址: http://$(hostname -I | awk '{print $1}'):3000"
echo -e "  管理后台: http://$(hostname -I | awk '{print $1}'):3000/admin/login"
echo ""
echo -e "默认管理员账户："
echo -e "  用户名: admin"
echo -e "  密码: admin123"
echo ""
echo -e "常用命令："
echo -e "  查看日志: pm2 logs union-portal"
echo -e "  重启应用: pm2 restart union-portal"
echo -e "  查看状态: pm2 status"
echo ""
echo -e "${YELLOW}重要：请立即修改默认管理员密码！${NC}"
echo ""
