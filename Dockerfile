# 多阶段构建 - 基础镜像
FROM node:18-alpine AS base

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 配置 npm 国内镜像（加速下载）
RUN npm config set registry https://registry.npmmirror.com

# 复制 package 文件
COPY package.json package-lock.json* ./

# 安装依赖（限制内存使用）
RUN npm ci --max-old-space-size=2048

# 重建 Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# 构建阶段
FROM base AS builder
WORKDIR /app

# 配置 Node.js 内存限制（防止 OOM）
ENV NODE_OPTIONS="--max-old-space-size=3072"

# 复制依赖和源码
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

# 禁用遥测
ENV NEXT_TELEMETRY_DISABLED=1

# 构建应用（增加超时时间）
RUN npm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 复制 Prisma 文件（运行时迁移需要 schema.prisma）
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# 设置权限
RUN chown -R nextjs:nodejs /app

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动命令
CMD ["node", "server.js"]
