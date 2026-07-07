#!/bin/bash

# 工会门户网站一键部署脚本

set -e

echo "========================================"
echo "  工会门户网站 - Docker 部署脚本"
echo "========================================"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

echo "✅ Docker 和 Docker Compose 已安装"
echo ""

# 创建必要目录
mkdir -p mysql/init
mkdir -p nginx/ssl

# 构建并启动服务
echo "🚀 开始构建 Docker 镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

# 等待 MySQL 就绪
echo "⏳ 等待数据库就绪..."
sleep 10

# 运行数据库迁移
echo "🔄 运行数据库迁移..."
docker-compose exec -T app npx prisma migrate deploy

# 初始化数据（包括管理员账号）
echo "🔄 初始化数据..."
docker-compose exec -T app npx ts-node scripts/init-server-data.ts

echo ""
echo "========================================"
echo "  ✅ 部署成功！"
echo "========================================"
echo ""
echo "访问地址:"
echo "  前台首页: http://$(hostname -I | awk '{print $1}'):3000"
echo "  管理后台: http://$(hostname -I | awk '{print $1}'):3000/admin"
echo ""
echo "默认管理员账号:"
echo "  用户名: admin"
echo "  密码: admin123"
echo ""
echo "⚠️  重要: 首次登录后请立即修改默认密码!"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  重启服务: docker-compose restart"
echo "  停止服务: docker-compose down"
